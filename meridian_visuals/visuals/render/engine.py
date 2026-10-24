"""GPU renderer. Shared by the preview and the exporter so they match.

How a frame is made:
  1. Each visible layer (bottom to top) is drawn into its own offscreen image
     (a "render target": a texture on the GPU we can draw into, then read).
  2. The layer's effects run as passes over that image.
  3. It is stacked onto everything below it ("composite").
  4. Global effects run over the full stack, then a last pass converts to
     8-bit for display or encoding.
Intermediate images use 16-bit floats so glows can go brighter than white
and gradients don't band.
"""
from __future__ import annotations

import math

import moderngl
import numpy as np

from .. import SHADER_DIR
from ..params import hex_to_rgb
from ..raster import overlay_pixels
from ..schema import EFFECT_ORDER, generators
from ..timing import LoopTiming


class Target:
    def __init__(self, ctx: moderngl.Context, size: tuple[int, int], dtype: str):
        self.size = size
        self.tex = ctx.texture(size, 4, dtype=dtype)
        self.tex.filter = (moderngl.LINEAR, moderngl.LINEAR)
        self.tex.repeat_x = self.tex.repeat_y = False
        self.fbo = ctx.framebuffer(color_attachments=[self.tex])

    def release(self):
        self.fbo.release()
        self.tex.release()


class Engine:
    def __init__(self):
        self.ctx = moderngl.create_standalone_context(require=330)
        self.renderer = self.ctx.info.get("GL_RENDERER", "?")
        self._quad = self.ctx.buffer(np.array([-1, -1, 1, -1, -1, 1, 1, 1], "f4").tobytes())
        self._vert = (SHADER_DIR / "core/quad.vert").read_text()
        self._progs: dict[str, tuple] = {}
        self._targets: dict[str, Target] = {}
        self._uploads: dict[tuple, tuple] = {}
        self.errors: dict[str, str] = {}   # layer id -> message for the UI

    # ------------------------------------------------------------ plumbing --

    def _program(self, name: str, frag_src: str | None = None):
        if name not in self._progs:
            if frag_src is None:
                frag_src = (SHADER_DIR / f"{name}.frag").read_text()
            prog = self.ctx.program(vertex_shader=self._vert, fragment_shader=frag_src)
            vao = self.ctx.vertex_array(prog, [(self._quad, "2f", "in_pos")])
            self._progs[name] = (prog, vao)
        return self._progs[name]

    def _generator_program(self, key: str):
        name = f"gen:{key}"
        if name not in self._progs:
            src = ((SHADER_DIR / "core/generator_prelude.glsl").read_text()
                   + "\n#line 1\n" + generators()[key].source
                   + (SHADER_DIR / "core/generator_epilogue.glsl").read_text())
            self._program(name, src)
        return self._progs[name]

    def target(self, tag: str, size: tuple[int, int], dtype: str = "f2") -> Target:
        t = self._targets.get(tag)
        if t is None or t.size != size or t.tex.dtype != dtype:
            if t is not None:
                t.release()
            t = self._targets[tag] = Target(self.ctx, size, dtype)
        return t

    def _draw(self, prog_name: str, dst: Target, uniforms: dict | None = None,
              textures: dict | None = None, prog=None):
        prog, vao = prog or self._program(prog_name)
        dst.fbo.use()
        for unit, (name, tex) in enumerate((textures or {}).items()):
            tex.use(unit)
            if name in prog:
                prog[name].value = unit
        for k, v in (uniforms or {}).items():
            if k in prog:
                prog[k].value = v
        vao.render(moderngl.TRIANGLE_STRIP)

    def _upload(self, slot: tuple, key, array: np.ndarray) -> moderngl.Texture:
        """Send pixels to the GPU, skipping the copy if this slot already holds `key`."""
        cached = self._uploads.get(slot)
        h, w, c = array.shape
        if cached and cached[0] == key:
            return cached[1]
        if cached and cached[1].size == (w, h) and cached[1].components == c:
            tex = cached[1]
            tex.write(np.ascontiguousarray(array).tobytes(), alignment=1)
        else:
            if cached:
                cached[1].release()
            tex = self.ctx.texture((w, h), c, np.ascontiguousarray(array).tobytes(), alignment=1)
            tex.filter = (moderngl.LINEAR, moderngl.LINEAR)
            tex.repeat_x = tex.repeat_y = False
        self._uploads[slot] = (key, tex)
        return tex

    def read_rgb(self, final: Target) -> bytes:
        return final.fbo.read(components=3, alignment=1)

    # -------------------------------------------------------------- frame ---

    def render(self, project: dict, frame: float, size: tuple[int, int], aspect: str,
               feeds, timing: LoopTiming) -> Target:
        acc = [self.target("acc0", size), self.target("acc1", size)]
        acc[0].fbo.clear(0.0, 0.0, 0.0, 1.0)
        cur = 0
        for layer in project["layers"]:
            if not layer["visible"]:
                continue
            try:
                rt = self._render_layer(layer, frame, size, aspect, feeds, timing)
            except moderngl.Error as e:
                self.errors[layer["id"]] = str(e).strip()
                continue
            if rt is None:
                continue
            self.errors.pop(layer["id"], None)
            rt = self._effects(layer["effects"], rt, size)
            self._draw("core/composite", acc[1 - cur], {"opacity": layer["layer"]["opacity"]},
                       {"dst": acc[cur].tex, "src": rt.tex})
            cur = 1 - cur
        out = self._effects(project["global_effects"], acc[cur], size)
        final = self.target("final", size, "f1")
        self._draw("core/output", final, textures={"tex": out.tex})
        return final

    def _render_layer(self, layer, frame, size, aspect, feeds, timing) -> Target | None:
        W, H = size
        p = layer["params"]
        dst = self.target("layer", size)
        kind = layer["type"]
        if kind == "generator":
            gen = generators().get(p["shader"])
            if gen is None:
                return None
            prog = self._generator_program(gen.key)
            uniforms = {"u_resolution": (float(W), float(H)), "u_phase": timing.phase(frame),
                        "u_beats": float(timing.beats), "u_beat": timing.beat_position(frame),
                        "u_key_black": 1.0 if p["transparent"] else 0.0}
            for param in gen.section.params:
                v = p["shader_params"][gen.key][param.key]
                uniforms[f"p_{param.key}"] = hex_to_rgb(v) if param.kind == "color" else float(v)
            self._draw("", dst, uniforms, prog=prog)
            return dst

        if kind == "footage":
            frames = feeds.frames(layer, frame, timing) if feeds else None
            if not frames:
                return None
            (key_a, arr_a, _), *rest = frames
            tex_a = self._upload((layer["id"], "a"), key_a, arr_a)
            tex_b, mix_b = tex_a, 0.0
            if rest:
                key_b, arr_b, mix_b = rest[0]
                tex_b = self._upload((layer["id"], "b"), key_b, arr_b)
            fr = layer["framing"][aspect]
            self._draw("core/footage", dst, {
                "mix_b": float(mix_b), "src_aspect": arr_a.shape[1] / arr_a.shape[0],
                "out_aspect": W / H, "zoom": fr["zoom"], "pan": (fr["pan_x"], fr["pan_y"]),
            }, {"tex_a": tex_a, "tex_b": tex_b})
            return dst

        if kind == "overlay":
            scale, opacity, dx, dy, rot = overlay_motion(p, timing, frame)
            short = min(W, H)
            base_w = p["size"] * short
            headroom = 1.0 + 0.25 * p["anim_amount"] if p["animation"] in ("pulse", "breathe") else 1.0
            arr = overlay_pixels(p, int(base_w * headroom))
            if arr is None:
                return None
            content_key = tuple(p[k] for k in ("mode", "source", "text", "font", "color")) + (arr.shape,)
            tex = self._upload((layer["id"], "overlay"), content_key, arr)
            w_px = base_w * scale
            h_px = w_px * arr.shape[0] / arr.shape[1]
            self._draw("core/overlay", dst, {
                "resolution": (float(W), float(H)),
                "center_px": (W / 2 + (p["x"] + dx) * W / 2, H / 2 + (p["y"] + dy) * H / 2),
                "size_px": (w_px, h_px), "rotation": math.radians(p["rotation"] + rot),
                "opacity": opacity,
            }, {"tex": tex})
            return dst
        return None

    # ------------------------------------------------------------ effects ---

    def _effects(self, effects: dict, src: Target, size) -> Target:
        cur = src
        H = size[1]

        def scratch():
            name = "fxB" if cur is self._targets.get("fxA") else "fxA"
            return self.target(name, size)

        for key in EFFECT_ORDER:
            e = effects[key]
            if not e["enabled"]:
                continue
            if key == "color":
                out = scratch()
                self._draw("effects/color", out, {k: float(e[k]) for k in (
                    "exposure", "contrast", "saturation", "temperature", "tint", "hue")},
                    {"tex": cur.tex})
            elif key == "invert":
                out = scratch()
                self._draw("effects/invert", out, {"amount": e["amount"]}, {"tex": cur.tex})
            elif key == "blur":
                out = scratch()
                if not self._blur(cur, e["radius"] / 100 * H * 0.5, out):
                    continue
            elif key == "glow":
                ext = self.target("glow_extract", size)
                self._draw("effects/glow_extract", ext, {"threshold": e["threshold"]}, {"tex": cur.tex})
                glow = self.target("glow_blur", size)
                if not self._blur(ext, e["radius"] / 100 * H * 0.5, glow):
                    glow = ext
                out = scratch()
                self._draw("effects/glow_combine", out,
                           {"intensity": e["intensity"], "tint": hex_to_rgb(e["tint"])},
                           {"tex": cur.tex, "glow": glow.tex})
            else:
                continue
            cur = out
        return cur

    def _blur(self, src: Target, sigma: float, dst: Target) -> bool:
        """Gaussian blur src into dst. Big blurs are done on a shrunken copy
        (halving the size halves the needed radius), which is far cheaper and
        looks the same."""
        if sigma < 0.3:
            return False
        cur, size, level = src, src.size, 0
        while sigma > 4.0 and min(size) > 16:
            size = (max(1, size[0] // 2), max(1, size[1] // 2))
            level += 1
            down = self.target(f"blur_down{level}", size)
            self._draw("core/copy", down, textures={"tex": cur.tex})
            cur, sigma = down, sigma / 2
        tmp = self.target(f"blur_h{level}", size)
        self._draw("effects/blur", tmp, {"step_uv": (1 / size[0], 0.0), "sigma": sigma}, {"tex": cur.tex})
        last = dst if level == 0 else self.target(f"blur_v{level}", size)
        self._draw("effects/blur", last, {"step_uv": (0.0, 1 / size[1]), "sigma": sigma}, {"tex": tmp.tex})
        if level:
            self._draw("core/copy", dst, textures={"tex": last.tex})
        return True


def overlay_motion(p: dict, timing: LoopTiming, frame: float):
    """Logo animation -> (scale, opacity, dx, dy, rotation_deg). All of it is
    driven by beats/bars/loop phase so it loops cleanly."""
    beat = timing.beat_position(frame)
    bf, bar, ph = beat % 1.0, (beat / 4.0) % 1.0, timing.phase(frame)
    amt = p["anim_amount"]
    scale, opacity, dx, dy, rot = 1.0, 1.0, 0.0, 0.0, 0.0
    anim = p["animation"]
    if anim == "pulse":
        scale = 1 + 0.25 * amt * math.exp(-bf * 6)
    elif anim == "breathe":
        k = 0.5 - 0.5 * math.cos(2 * math.pi * bar)
        scale = 1 + 0.12 * amt * k
        opacity = 1 - 0.5 * amt * (1 - k)
    elif anim == "drift":
        a = 2 * math.pi * ph
        dx, dy = 0.08 * amt * math.cos(a), 0.05 * amt * math.sin(2 * a)
        rot = 4 * amt * math.sin(a)
    elif anim == "flicker":
        opacity = 1 - amt * (1 - math.exp(-bf * 10))
    return scale, opacity, dx, dy, rot
