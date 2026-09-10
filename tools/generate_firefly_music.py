#!/usr/bin/env python3
"""Generate the original short backing track used by Firefly Rhythm.

The script only uses Python's standard library so the music asset can be
regenerated without a DAW.  It writes a mono 44.1 kHz WAV file; the release
task converts that WAV to MP3 with ffmpeg.
"""

from array import array
import math
import random
import sys
import wave


SAMPLE_RATE = 44_100
BPM = 80
BEAT_SECONDS = 60 / BPM
TOTAL_BEATS = 48


def midi_to_hz(note):
    return 440.0 * (2.0 ** ((note - 69) / 12.0))


def add_tone(buffer, start_seconds, duration, frequency, amplitude=0.2, bell=False):
    start = max(0, int(start_seconds * SAMPLE_RATE))
    length = int(duration * SAMPLE_RATE)
    end = min(len(buffer), start + length)
    for index in range(start, end):
        elapsed = (index - start) / SAMPLE_RATE
        attack = min(1.0, elapsed / 0.012)
        release = max(0.0, min(1.0, (duration - elapsed) / 0.09))
        decay = math.exp((-5.5 if bell else -2.0) * elapsed / max(duration, 0.01))
        phase = math.tau * frequency * elapsed
        if bell:
            wave_value = math.sin(phase) + 0.34 * math.sin(phase * 2.01) + 0.16 * math.sin(phase * 3.98)
        else:
            wave_value = math.sin(phase) + 0.18 * math.sin(phase * 2)
        buffer[index] += amplitude * attack * release * decay * wave_value


def add_kick(buffer, start_seconds, amplitude=0.2):
    start = int(start_seconds * SAMPLE_RATE)
    length = int(0.16 * SAMPLE_RATE)
    for offset in range(length):
        index = start + offset
        if index >= len(buffer):
            break
        elapsed = offset / SAMPLE_RATE
        frequency = 95 - 55 * (elapsed / 0.16)
        envelope = math.exp(-24 * elapsed)
        buffer[index] += amplitude * envelope * math.sin(math.tau * frequency * elapsed)


def add_shaker(buffer, start_seconds, random_source, amplitude=0.028):
    start = int(start_seconds * SAMPLE_RATE)
    length = int(0.055 * SAMPLE_RATE)
    previous = 0.0
    for offset in range(length):
        index = start + offset
        if index >= len(buffer):
            break
        noise = random_source.uniform(-1.0, 1.0)
        high_pass = noise - previous * 0.82
        previous = noise
        envelope = math.exp(-52 * offset / SAMPLE_RATE)
        buffer[index] += amplitude * envelope * high_pass


def build_track():
    duration = TOTAL_BEATS * BEAT_SECONDS + 1.2
    samples = array('f', [0.0]) * int(duration * SAMPLE_RATE)
    random_source = random.Random(8121230)

    # Four-beat harmonic loop.  The melody is an original pentatonic phrase.
    chord_roots = [48, 53, 45, 55]  # C3, F3, A2, G3
    melody_bars = [
        [72, 76, 79, 76, 74, 72, 67, 69],
        [72, 74, 76, 81, 79, 76, 74, 72],
        [69, 72, 76, 74, 72, 69, 67, 69],
        [67, 71, 74, 79, 76, 74, 72, 71],
        [72, 76, 79, 81, 79, 76, 74, 76],
        [81, 79, 76, 74, 72, 74, 76, 79],
    ]

    # Intro chimes establish the pulse before the first playable note.
    for beat, note in enumerate([72, 76, 79, 84]):
        add_tone(samples, beat * BEAT_SECONDS, 0.48, midi_to_hz(note), 0.16, bell=True)

    for beat in range(4, TOTAL_BEATS):
        local_beat = beat - 4
        bar = local_beat // 4
        beat_in_bar = local_beat % 4
        root = chord_roots[bar % len(chord_roots)]
        start = beat * BEAT_SECONDS

        add_tone(samples, start, 0.43, midi_to_hz(root), 0.08)
        add_tone(samples, start, 0.38, midi_to_hz(root + 7), 0.035)
        if beat_in_bar in (0, 2):
            add_kick(samples, start, 0.18 if beat_in_bar == 0 else 0.12)
        add_shaker(samples, start + BEAT_SECONDS / 2, random_source)

        phrase = melody_bars[bar % len(melody_bars)]
        melody_note = phrase[beat_in_bar * 2]
        next_note = phrase[beat_in_bar * 2 + 1]
        add_tone(samples, start, 0.26, midi_to_hz(melody_note), 0.105, bell=True)
        add_tone(samples, start + BEAT_SECONDS / 2, 0.23, midi_to_hz(next_note), 0.075, bell=True)

    # Gentle ending chord.
    ending = TOTAL_BEATS * BEAT_SECONDS
    for note in (60, 64, 67, 72):
        add_tone(samples, ending - 0.15, 1.05, midi_to_hz(note), 0.06, bell=True)

    peak = max(max(samples), abs(min(samples)), 0.001)
    gain = 0.82 / peak
    pcm = array('h')
    fade_length = int(0.18 * SAMPLE_RATE)
    for index, sample in enumerate(samples):
        fade = 1.0
        if index < fade_length:
            fade = index / fade_length
        if len(samples) - index < fade_length * 3:
            fade = min(fade, (len(samples) - index) / (fade_length * 3))
        pcm.append(int(max(-1.0, min(1.0, sample * gain * fade)) * 32767))
    return pcm


def main():
    if len(sys.argv) != 2:
        raise SystemExit('usage: generate_firefly_music.py OUTPUT.wav')
    with wave.open(sys.argv[1], 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(build_track().tobytes())


if __name__ == '__main__':
    main()
