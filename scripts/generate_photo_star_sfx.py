#!/usr/bin/env python3
"""Render three original, gently ascending bell notes for the photo star reveal."""

import math
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "sounds" / "game-sfx"
# C6, E6, G6; the final note rings longer to close the three-star phrase.
NOTES = ((1046.50, 0.34), (1318.51, 0.36), (1567.98, 0.60))


def render_note(frequency, duration):
    frames = bytearray()
    for index in range(round(duration * SAMPLE_RATE)):
        time = index / SAMPLE_RATE
        attack = min(1, time / 0.006)
        release = min(1, (duration - time) / 0.06)
        # Rounded onset, mellow fundamental and quickly fading bell partials.
        value = (
            math.sin(math.tau * frequency * time) * math.exp(-time / (duration * 0.27))
            + 0.24 * math.sin(math.tau * frequency * 2 * time) * math.exp(-time / 0.075)
            + 0.08 * math.sin(math.tau * frequency * 3 * time) * math.exp(-time / 0.045)
        ) * attack * release * 0.45
        frames.extend(struct.pack("<h", round(value * 32767)))
    return frames


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for star, (frequency, duration) in enumerate(NOTES, start=1):
        path = OUTPUT / f"photo-star-{star}.wav"
        with wave.open(str(path), "wb") as output:
            output.setnchannels(1)
            output.setsampwidth(2)
            output.setframerate(SAMPLE_RATE)
            output.writeframes(render_note(frequency, duration))
        print(f"{path.name}: {frequency:.2f} Hz, {duration:.2f}s")
