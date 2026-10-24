"""Run:  .venv/bin/python -m unittest discover tests"""
import os
import unittest

import numpy as np

from visuals import project as proj
from visuals.media import ClipInfo, source_times
from visuals.timing import LoopTiming


class TimingTests(unittest.TestCase):
    def test_frames_round_to_nearest(self):
        t = LoopTiming(124, 8)
        self.assertEqual(t.frames, 465)            # 464.52 exact
        self.assertAlmostEqual(t.effective_bpm, 123.87, places=2)
        self.assertEqual(LoopTiming(120, 4).frames, 240)  # 120 BPM lands exactly

    def test_phase_wraps(self):
        t = LoopTiming(124, 8)
        self.assertAlmostEqual(t.phase(t.frames), 0.0)
        self.assertAlmostEqual(t.beat_position(t.frames / 2), 16.0)


class FootageLoopTests(unittest.TestCase):
    info = ClipInfo("x.mov", 1920, 1080, 120.0, 60.0, False)

    def params(self, **kw):
        layer = proj.new_layer("footage", source="x.mov", **kw)
        return layer["params"]

    def test_crossfade_is_continuous_across_seam(self):
        t = LoopTiming(124, 8)
        for reverse in (False, True):
            p = self.params(speed=0.5, trim_in=3.0, loop_mode="crossfade", reverse=reverse)
            last = source_times(p, self.info, t, t.frames - 1)
            first = source_times(p, self.info, t, 0)
            # Frame 0 shows (fully weighted) what would follow the last frame.
            dominant = max(first, key=lambda e: e[1])[0]
            self.assertAlmostEqual(dominant - last[0][0], (-1 if reverse else 1) * 0.5 / 30, places=4)

    def test_pingpong_returns_to_start(self):
        t = LoopTiming(124, 8)
        p = self.params(loop_mode="pingpong")
        self.assertAlmostEqual(source_times(p, self.info, t, 0)[0][0],
                               source_times(p, self.info, t, t.frames)[0][0])


@unittest.skipIf(os.environ.get("SKIP_GL"), "GPU tests skipped")
class GeneratorSeamTests(unittest.TestCase):
    """Each generator's jump from last frame to first must look like any
    other frame step, i.e. the loop is invisible."""

    def test_generators_loop(self):
        from visuals.render.engine import Engine
        from visuals.schema import generators
        eng = Engine()
        t = LoopTiming(124, 4)
        size = (256, 144)

        def frame(p, i):
            final = eng.render(p, i, size, "16:9", None, t)
            return np.frombuffer(eng.read_rgb(final), np.uint8).reshape(144, 256, 3).astype(float)

        for key in generators():
            with self.subTest(generator=key):
                gen = proj.new_layer("generator", shader=key)
                p = proj.normalize({"layers": [gen], "bpm": 124, "bars": 4})
                f_last, f0, f1, f2 = (frame(p, i) for i in (t.frames - 1, 0, 1, 2))
                seam = np.abs(f0 - f_last).mean()
                # The seam is also a beat boundary, so compare against the
                # step across a beat boundary inside the loop too.
                b = int(np.ceil(t.frames_per_beat * 4))
                fb0, fb1 = frame(p, b - 1), frame(p, b)
                normal = max(np.abs(f1 - f0).mean(), np.abs(f2 - f1).mean(),
                             np.abs(fb1 - fb0).mean())
                self.assertLessEqual(seam, normal * 1.6 + 0.5, f"{key}: seam {seam:.2f} vs step {normal:.2f}")
                self.assertEqual(eng.errors, {})


if __name__ == "__main__":
    unittest.main()
