# Music sources

## music_piece_main.m4a

- Gameplay main theme: `event:/music/music_piece_main`.
- Source: `exports/audio/music_piece_main.wav` (24 kHz, stereo).
- Encoded as AAC at 128 kbps without trimming or changing gain:

  ```sh
  afconvert exports/audio/music_piece_main.wav public/sounds/music/music_piece_main.m4a -f m4af -d 'aac ' -b 128000
  ```

- Used by `mainTheme`; the title screen uses `/sounds/ThemeMusic.mp3`.
