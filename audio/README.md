# Audio folder
Place external audio files here before linking them to any page or demo block.

Recommended locations:
- /audio/ for project-local demo audio
- /assets/audio/ as an alternate import location

Example filenames:
- /audio/beat-demo-01.mp3
- /audio/bass-demo-01.mp3
- /audio/chords-demo-01.mp3
- /audio/melody-demo-01.mp3

How to connect them later:
- In the introduction page, replace the empty data-audio values in the 4x4 audio block with a path such as:
  - ../audio/beat-demo-01.mp3
  - ../audio/bass-demo-01.mp3
  - ../audio/chords-demo-01.mp3
  - ../audio/melody-demo-01.mp3

The audio demo block is currently left blank intentionally. Fill these paths later when the final audio files are ready.

## Piano samples (audio/piano) — alignment status

Measured on 2026-09-19 with a small script (onset = first 5 ms window above the noise floor):

| file | length | leading silence | peak level |
| --- | --- | --- | --- |
| piano-C3 | 41.3 s | 554 ms | -25.5 dB |
| piano-Db3 | 40.5 s | 439 ms | -25.4 dB |
| piano-D3 | 44.3 s | 848 ms | -26.0 dB |
| piano-Eb3 | 43.3 s | 145 ms | -23.7 dB |
| piano-E3 | 33.7 s | 170 ms | -21.8 dB |
| piano-F3 | 32.7 s | 105 ms | -27.0 dB |
| piano-Gb3 | 38.1 s | 439 ms | -25.3 dB |
| piano-G3 | 34.4 s | 549 ms | -26.6 dB |
| piano-Ab3 | 38.8 s | 544 ms | -28.8 dB |
| piano-A3 | 32.3 s | 584 ms | -31.4 dB |
| piano-Bb3 | 35.9 s | 504 ms | -29.1 dB |
| piano-B3 | 35.7 s | 634 ms | -28.9 dB |
| piano-C4 | 30.9 s | 349 ms | -29.7 dB |
| piano-Db4 | 29.6 s | 534 ms | -28.3 dB |
| piano-D4 | 29.5 s | 409 ms | -25.5 dB |
| piano-Eb4 | 29.6 s | 249 ms | -29.0 dB |
| piano-E4 | 29.1 s | 299 ms | -28.2 dB |
| piano-F4 | 27.8 s | 459 ms | -25.9 dB |
| piano-Gb4 | 24.7 s | 444 ms | -26.0 dB |
| piano-G4 | 31.4 s | 364 ms | -22.8 dB |
| piano-Ab4 | 25.9 s | 289 ms | -21.5 dB |
| piano-A4 | 30.0 s | 240 ms | -26.8 dB |
| piano-Bb4 | 25.7 s | 249 ms | -25.7 dB |
| piano-B4 | 34.1 s | 449 ms | -15.9 dB |
| piano-C5 | 24.7 s | 429 ms | -25.4 dB |

Problem: the leading silence differs by up to ~740 ms between notes, so a chord scheduled at the
same time by `js/audio-engine.js` does not sound together. The engine itself is precise (the drum
samples all start at 0 ms and play in sync), so this is a source-material issue — do NOT patch it in JS.

Manual fix (CapCut, do it once and replace the files):
1. Import all 25 wavs onto separate tracks.
2. Align every clip so the first visible waveform peak sits at the same position (roughly 10 ms of
   silence before the attack is enough).
3. Trim every clip to the same length — 4 s is plenty for ear training / sequencer use
   (all notes decay below -40 dB within ~5–9 s; the current 25–44 s files are mostly silence + noise).
4. Add a short fade-out (~200 ms) at the end of each clip; optionally normalize peaks to about -6 dB
   (B4 is currently ~10–15 dB louder than the rest).
5. Export as WAV, 44.1 kHz / 16-bit mono, keeping the exact filenames `piano-<Note><Octave>.wav`.
