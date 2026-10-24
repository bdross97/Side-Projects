"""Tempo math: BPM + bar count -> loop length in frames.

At 30 fps a bar rarely lands on a whole frame (one bar at 124 BPM is 58.06
frames), so the loop length is rounded to the nearest frame and every
tempo-driven animation is computed from that rounded length. That keeps the
loop perfectly seamless; the tiny tempo difference (<0.2%) disappears when VJ
software runs the clip in BPM-sync mode.
"""
from dataclasses import dataclass

from . import FPS

BPM_MIN, BPM_MAX, BPM_DEFAULT = 90, 150, 124
BAR_CHOICES = (4, 8, 16, 32)
BEATS_PER_BAR = 4


@dataclass(frozen=True)
class LoopTiming:
    bpm: float
    bars: int
    fps: int = FPS

    @property
    def beats(self) -> int:
        return self.bars * BEATS_PER_BAR

    @property
    def exact_seconds(self) -> float:
        return self.beats * 60.0 / self.bpm

    @property
    def frames(self) -> int:
        return max(1, round(self.exact_seconds * self.fps))

    @property
    def seconds(self) -> float:
        return self.frames / self.fps

    @property
    def effective_bpm(self) -> float:
        """The tempo the rendered file actually runs at."""
        return self.beats * 60.0 / self.seconds

    @property
    def frames_per_beat(self) -> float:
        return self.frames / self.beats

    def phase(self, frame: float) -> float:
        """0..1 position through the loop. Frame `frames` wraps back to 0."""
        return (frame % self.frames) / self.frames

    def beat_position(self, frame: float) -> float:
        """Beats elapsed since loop start (fractional)."""
        return self.phase(frame) * self.beats

    def describe(self) -> str:
        return (f"{self.bars} bars @ {self.bpm:g} BPM = {self.frames} frames "
                f"({self.seconds:.2f}s, file tempo {self.effective_bpm:.2f} BPM)")
