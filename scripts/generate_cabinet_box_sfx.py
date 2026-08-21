#!/usr/bin/env python3
"""Render the cabinet box placement Web Audio tones as PCM WAV files."""

from __future__ import annotations

import math
import struct
import wave
from dataclasses import dataclass
from pathlib import Path


SAMPLE_RATE = 48_000
SILENCE_GAIN = 0.0001
OUTPUT_DIRECTORY = Path(__file__).resolve().parents[1] / "public" / "sounds" / "game-sfx"


@dataclass(frozen=True)
class Tone:
    filename: str
    waveform: str
    start_frequency: float
    end_frequency: float
    duration_seconds: float
    start_gain: float


TONES = (
    Tone(
        filename="box-place-normal.wav",
        waveform="triangle",
        start_frequency=128.0,
        end_frequency=62.0,
        duration_seconds=0.13,
        start_gain=0.12,
    ),
    Tone(
        filename="box-place-perfect.wav",
        waveform="sine",
        start_frequency=190.0,
        end_frequency=104.0,
        duration_seconds=0.18,
        start_gain=0.14,
    ),
)


def exponential_ramp(start: float, end: float, progress: float) -> float:
    return start * ((end / start) ** progress)


def oscillator_sample(waveform: str, phase: float) -> float:
    sine = math.sin(phase)
    if waveform == "sine":
        return sine
    if waveform == "triangle":
        return (2.0 / math.pi) * math.asin(sine)
    raise ValueError(f"Unsupported waveform: {waveform}")


def render_tone(tone: Tone) -> Path:
    sample_count = round(tone.duration_seconds * SAMPLE_RATE)
    phase = 0.0
    samples = bytearray()

    for sample_index in range(sample_count):
        time_seconds = sample_index / SAMPLE_RATE
        progress = min(1.0, time_seconds / tone.duration_seconds)
        frequency = exponential_ramp(
            tone.start_frequency,
            tone.end_frequency,
            progress,
        )
        gain = exponential_ramp(tone.start_gain, SILENCE_GAIN, progress)
        value = oscillator_sample(tone.waveform, phase) * gain
        pcm_value = round(max(-1.0, min(1.0, value)) * 32_767)
        samples.extend(struct.pack("<h", pcm_value))
        phase += 2.0 * math.pi * frequency / SAMPLE_RATE

    OUTPUT_DIRECTORY.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIRECTORY / tone.filename
    with wave.open(str(output_path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(samples)
    return output_path


def main() -> None:
    for tone in TONES:
        output_path = render_tone(tone)
        print(output_path)


if __name__ == "__main__":
    main()
