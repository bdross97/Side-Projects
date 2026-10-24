# meridian visuals

A desktop sandbox for building looping visuals for **meridian** and **The TECHOMA**, then
rendering them to video for club LED walls (handed to the VJ team) and Instagram.

It is not a live tool. You build a composition from layers, preview it at low resolution,
and export tempo-locked loops at full quality.

**Status: Phase 1.** Footage, generator and logo/text layers. Color, invert, blur and glow
effects. BPM-locked seamless loops exported as H.264 MP4.

---

## Setup and launch

You need macOS, Python 3.11 and ffmpeg. All three are already on this Mac.

```bash
cd ~/Side-Projects/meridian_visuals
./launch
```

The first run creates a private Python environment in `.venv/` (about 500 MB, around 2 minutes).
After that, `./launch` opens the app straight away.

---

## The window

| Area | What it does |
|---|---|
| **Left: project** | Name, style pack, **BPM** (90–150), **loop length** (4/8/16/32 bars). The grey line shows the exact frame count. |
| **Left: layers** | The stack. Higher in the list draws on top. The tick box shows or hides a layer; double-click renames it. *Global effects* applies to the whole finished frame. |
| **Center: preview** | Plays the loop in real time at reduced size. **Space** plays or pauses. Drag the bar to scrub. Pick the *Preview format* (16:9, 9:16…) and *Quality* here. |
| **Right: inspector** | Controls for the selected layer. Every section has **Randomize** and **Reset**. Hover a label for help. |

Undo is **Cmd+Z** and redo is **Cmd+Shift+Z**. One slider drag counts as one undo step. Save is **Cmd+S** and export is **Cmd+E**.

### Layer types

- **Footage**: a video clip.
  - *Start at* trims the beginning.
  - *Speed* changes playback rate. On a 120 fps iPhone clip, 0.25 gives smooth 4x slow motion, and the panel tells you the right value for each clip.
  - *Reverse* plays the clip backwards.
  - *Loop seam* sets how the end joins the start. **Crossfade** (the default) blends the last beats into the first so there is no visible jump. **Ping-pong** plays forward then backward. **Hard cut** just jumps.
  - **Framing** (zoom and pan) is stored separately for each aspect ratio. Set the preview format to 9:16 to frame the Reels version without affecting the 16:9 one.
- **Generator**: a GPU-drawn pattern.
  - meridian: *Flow field*, *Bloom*, *Water ripples*.
  - TECHOMA: *Tunnel*, *Laser grid*, *Scan bars*.
  - Turn on *Black is see-through* to lay white lines over footage.
- **Logo / text**: your logo as PNG or SVG (the white meridian SVG is the default), or text in any font, Paladins included.
  - Position, size, rotation and opacity.
  - Animation: pulse on beat, breathe per bar, slow drift, or flicker.
  - Size is measured against the frame's shorter side, so the logo reads the same in 16:9 and 9:16.

### Effects

Each layer has its own effects, plus a global set. Effects run in this order:
**Color** (exposure, contrast, saturation, warm/cool, tint, hue) → **Invert** → **Blur** → **Glow**.
Each one is off until you tick *Enabled*.

Example projects are in `projects/`. Use **File → Open** to load `meridian_bloom.json` or `techoma_grid.json`.

---

## Exporting

**Export…** lets you tick one or more formats and choose a folder. The default folder is `exports/`.
Rendering runs in a separate process, so the app stays usable, and **Cancel** removes half-written files.

- Always 30 fps, H.264 (high quality, CRF 16), BT.709 color, keyframe every second.
- Formats:
  - 1920x1080
  - 3840x2160
  - 1080x1920 (Reels)
  - 1080x1350 (4:5)
  - 1080x1080
- File names: `pack_name_BPMbpm_BARSbars_WxH.mp4`, e.g. `meridian_bloom_124bpm_8bars_1920x1080.mp4`.

Footage is always rendered from your **original** files at full quality, never from the preview copies.

You can also export from Terminal:
```bash
.venv/bin/python -m visuals.export projects/techoma_grid.json --formats 1080p reels
```

---

## How the tempo sync works

A loop of N bars at a given BPM lasts `N × 4 × 60 / BPM` seconds. At 30 fps that's rarely a whole
number of frames: 8 bars at 124 BPM is 464.5 frames. The app rounds to the nearest frame (465), then
times every beat-driven animation to that rounded length. The result:

- **The loop is seamless.** Frame 465 would be identical to frame 0, so the video wraps with no jump.
  (The last frame deliberately *isn't* a copy of the first, because a duplicated frame would stutter
  on every repeat.)
- **The file's real tempo is a hair off.** For this example it is 123.87 BPM, under 0.2%, and the
  project panel shows the exact figure.

  Tell the VJ team to set the clip to **BPM sync** in Resolume (or "beat snap" / "tempo sync" in
  other software) with the beat count = bars × 4. Their software then stretches the clip to the live
  tempo and the rounding disappears. Some tempos land exactly: 120, 144 and 150 BPM give whole-frame
  bars.

---

## A few graphics concepts, plainly

- **Shader**: a tiny program the graphics card runs once for *every pixel* of every frame, all in
  parallel. Generators and effects are shaders, in the `.frag` files under `visuals/shaders/`.
- **Render target**: an off-screen image on the GPU that a shader draws into. Each layer gets one;
  effects read one and write another; then layers are stacked ("composited").
- **Why loops are seamless**: every generator moves using `u_phase` (0→1 over the loop) times a
  *whole number*, or using beats. For organic noise there's a special noise function whose time axis
  wraps around exactly once per loop, so the texture morphs and lands back where it began.
- **Proxy**: phone video stores only occasional complete frames and the rest as differences, so
  jumping around in it (reverse, slow-mo, crossfades) is slow. On import the app quietly makes a small
  copy where every frame is complete, used only for the preview. These live in `cache/` and are safe
  to delete.
- **Preview vs export**: blur, glow and logo sizes are defined as a percentage of the frame, not in
  pixels, so the 640px preview matches the 4K render.

## Adding your own generator

Drop a `.frag` file into `visuals/shaders/generators/`. The header comments become panel controls:

```glsl
// @name My pattern
// @pack meridian
// @param cycles int 1 1 4 "Cycles per loop"
// @param size float 0.5 0 2 "Size"
// @param tint color #ffffff "Color"
uniform float p_cycles, p_size;
uniform vec3 p_tint;

vec3 image() {
    vec2 p = centered();                       // shorter side spans -1..1
    float wave = sin(length(p) * 10.0 - loop_angle(p_cycles));
    return p_tint * (1.0 - smoothstep(0.0, p_size, abs(wave))) * (0.5 + 0.5 * beat_pulse(6.0));
}
```

Helpers available to every generator: `u_phase`, `u_beat`, `beat_phase()`, `bar_phase()`,
`beat_pulse(decay)`, `loop_angle(cycles)`, `loop_noise()`, `loop_fbm()`, `ramp3()` and `rot2()`.
See `visuals/shaders/core/generator_prelude.glsl` for all of them. Restart the app to pick up new
files.

---

## Project layout

```
launch                     one-command launcher
visuals/
  timing.py                BPM / bars -> frames
  params.py, schema.py     every control is declared once here; the panel is built from it
  project.py               project JSON, defaults, export file names
  media.py, feeds.py       clip probing, proxies, frame access, loop-seam math
  raster.py                logo / SVG / text -> pixels at exact output size
  render/engine.py         the GPU renderer (shared by preview and export)
  export.py                renderer -> ffmpeg -> .mp4 (separate process / CLI)
  shaders/                 GLSL: core passes, effects, generators
  ui/                      PySide6 window, panel widgets, export dialog
projects/                  saved projects (.json)
exports/  cache/           output videos, preview proxies (both git-ignored)
tests/                     .venv/bin/python -m unittest discover tests
```

## Known limits (Phase 1)

- **iPhone HDR clips look flat or washed out.** This ffmpeg build can't convert HDR to normal color
  properly; the panel flags HDR clips. Workarounds:
  - Use the Color effect (more contrast and saturation).
  - Turn off *Settings → Camera → Record Video → HDR Video* for clips meant for visuals.
- **No photo layers, blend modes, presets/style-pack switching, audio, ProRes/HAP or custom sizes
  yet.** These come in Phases 2–4.
- The style pack only affects file names for now; Phase 2 gives each pack its palettes and defaults.

## Machine notes

Tested on this 2018 MacBook Pro. Rendering runs on the Radeon Pro 555X through OpenGL 4.1 (Apple
deprecated OpenGL but still ships it; 4.1 is the ceiling and is all this needs).

Measured render speeds (before encoding):

| Content | 1080p | 4K |
|---|---|---|
| Tunnel + glow | ~120 fps | ~36 fps |
| Flow field + glow (heaviest) | ~21 fps | ~6 fps |

A 16-bar 4K Flow field loop takes about 2.5 minutes. Footage adds a one-time preparation step
per export.
