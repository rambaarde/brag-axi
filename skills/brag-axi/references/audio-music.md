# Audio reference: music

Read only when music is on. Shared asset paths and copy rules are in [audio.md](audio.md).

---

## Audio-reactive visuals

When music is present, prefer a subtle audio-reactive treatment unless the tone asks for stillness or deadpan restraint. This does not mean beat detection. It means Hyperframes can pre-extract per-frame audio data and use RMS/frequency-band energy to modulate existing visual elements.

Good uses:
- Hero glow or sky warmth breathes slightly with RMS
- Product card, phone, or metric panel gains subtle presence on bass
- Title, quote, or logo gets a soft treble glow on stronger musical moments
- Background depth, vignette, or light layer gently swells with the bed

Avoid:
- Waveform displays, equalizer bars, musical notes, or generic visualizer graphics
- Strobing, heavy pulsing, or text scaling that hurts readability
- Treating audio-reactivity as a substitute for good scene timing
- Claiming exact beat/BPM sync unless a real beat detector is available

Suggested plan notation:
```
Audio-reactive treatment: subtle; use music RMS/bass to make the hero glow and product card presence breathe. No waveform/equalizer visuals.
```

Hyperframes implementation note: follow the audio-reactive guidance owned by the `hyperframes-creative` skill (let that skill locate its own files), to extract per-frame audio data and sample it synchronously inside the composition timeline. The extraction helper ships with that skill — `/brag` does not provide it, so don't hardcode a path to it.

---

## Music

### Available tracks

All tracks are "Happy Beats / Business Moves" by ende.app. Upbeat, clean, corporate-adjacent. Good across multiple tones.

| Filename | Duration | Character | Best for |
|---|---|---|---|
| `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` | 2:44 | Full upbeat track, most energetic | `default`, `app-store` |
| `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` | 1:54 | Mid-energy, slightly more laid-back | `default`, `yc-parody` |
| `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` | 1:00 | Compact loop, punchy | `default`, `chaotic` |
| `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` | 1:28 | Warm and business-y | `yc-parody`, `app-store` |
| `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` | 1:58 | Steady and clean | `polished`, `cinematic` |

For `deadpan` tone: prefer vol-12 at very low volume (0.12-0.18). Skip music only if the plan explicitly chooses silence.

### In a composition

After copying files (see Asset paths above), reference them with relative paths from `composition/`:

```html
<audio id="bg-music" data-start="0" data-duration="[total]" data-track-index="10" data-volume="0.35" src="assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3"></audio>
```

Volume: 0.3-0.4 for normal music beds. Use 0.12-0.22 for deadpan or very restrained parody. Never above 0.5. SFX at 0.55-0.85, with softer values for polished/deadpan.

If the music file doesn't exist, skip it and notify the user after rendering.

### Beat and cue sources

Beat sync needs a cue source. Three are available — use the richest one the environment supports. Beat sync now works on **any** track, not just bundled ones. The two any-track methods (2 and 3) have orthogonal requirements — option 2 needs Python, option 3 needs a recent Hyperframes — so when one is unavailable the other usually covers it.

1. **Bundled track → precomputed preset (richest, instant, no deps).** The bundled tracks ship with cue metadata. Read the matching markdown summary, and pass the JSON path in `composition-brief.md`:

```text
<skill-dir>/assets/music/cues/<track-stem>.music-cues.md
<skill-dir>/assets/music/cues/<track-stem>.music-cues.json
```

2. **Any track → extended analysis (richest for custom tracks; needs Python, any Hyperframes version).** For a custom track — or to refresh a bundled one — run `analyze_music_cues.py` on the audio file. It produces the same rich cue JSON/Markdown for any track. Run it via `uv`, which auto-provisions the deps (`librosa`, `numpy`, `scipy`, `soundfile`) from `<skill-dir>/scripts/pyproject.toml` — no manual `pip install` needed:

```bash
uv run --project <skill-dir>/scripts \
  python <skill-dir>/scripts/analyze_music_cues.py <track>.mp3 \
  --output-json <output-dir>/composition/assets/music/cues/<stem>.music-cues.json \
  --output-md  <output-dir>/composition/assets/music/cues/<stem>.music-cues.md
```

This is the fallback when `hyperframes beats` (option 3) is unavailable — e.g. an older pinned Hyperframes. If neither `uv` nor the Python deps are available, use option 3 instead.

3. **Any track → `hyperframes beats` (simple, no Python; needs Hyperframes ≥ 0.6.99).** After the music is wired into the composition, run:

```bash
npx hyperframes beats <output-dir>/composition
```

It writes a per-track beat file: a beat grid with per-beat timing and a normalized `strength` (0-1), but no separate `strongCues` array — so derive "strong" beats by taking the highest-`strength` ones. (See the current hyperframes-cli `beats` guidance for the exact output path.) `beats` was added in Hyperframes 0.6.99; on an older pinned install it won't exist — fall back to option 2 (the script), or to the `unavailable` note below.

The preset and `analyze_music_cues.py` share the rich schema:

- `duration`, `tempo`
- `beats`: beat-grid points with `time` and normalized `intensity`
- `strongCues`: highest-value landing moments with `time`, `intensity`, and `kind` (`strong_beat` / `onset_peak`)
- `scoring`: feature and normalization metadata

`hyperframes beats` is the simpler floor: a plain beat grid with a per-beat strength, no strong-cue array.

Planning rules (apply to whichever source you have):

- Use cue metadata to bias timing, not control it.
- Major reveals may move toward strong cues within about `±0.15s`.
- Smaller entrances may align to nearby beat points within about `±0.10s`.
- Use 1-3 strong cue locks per 15-25s video.
- Ignore cues when they harm copy readability, scene pacing, or the product story.
- For deadpan or restraint-heavy tones, cues should be rare, quiet, or saved for the final logo.

Cue/beat metadata is not a substitute for Hyperframes audio-reactive visuals: it helps with beat/swell timing; audio-reactive data helps subtle visual properties breathe with the music.

If no source is available (no preset, no Python deps, and `hyperframes beats` not run), write:

```text
Music cue guidance: unavailable; continue without beat/cue sync.
```

### Adding SFX elements

Put the music bed on a low track and give each overlapping SFX its own ascending track-index (e.g. music at 10, SFX from 11 up). Never share a track-index between overlapping audio.

```html
<audio id="sfx-1" data-start="0.2" data-duration="1" data-track-index="11" data-volume="0.80" src="assets/sfx/interface/drop_001.ogg"></audio>
```

Wire each `<audio>` clip per the current hyperframes Data Attributes + Video/Audio contract (`data-track-index`, `data-volume`, `data-start`, `data-duration`). `/brag` owns only the volume policy above and the track-allocation convention; Hyperframes owns the clip schema.
