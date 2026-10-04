# Audio reference (shared)

All SFX are CC0 (Kenney.nl, public domain). Music and SFX should be used by default unless the user passes `--no-music`, `--no-sfx`, the required assets are missing, or the plan explicitly chooses silence as the strongest creative move.

Bias toward a smooth, professional result: one tasteful music bed plus a small number of well-timed SFX usually feels better than silence.

Read this file when music or SFX is on. Then read only the layers you use: [audio-music.md](audio-music.md) for music, beat sync, and audio-reactive visuals; [audio-sfx.md](audio-sfx.md) for sound effects. With `--no-music` and `--no-sfx`, skip all three.

---

## Asset paths

All paths below are relative to `<skill-dir>`, this skill's own directory (see "Skill directory" in `SKILL.md`). It differs by install method, so resolve it rather than assuming `~/.claude/skills/brag-axi/`.

SFX live under `<skill-dir>/assets/sfx/{casino,impact,interface,ui}/`, and the individual keypress set under `<skill-dir>/assets/sfx/keyboard/`.

Music lives at `<skill-dir>/assets/music/`.

Bundled music cue presets live beside the music:

```text
<skill-dir>/assets/music/cues/<track-stem>.music-cues.md
<skill-dir>/assets/music/cues/<track-stem>.music-cues.json
```

SFX analysis lives beside the SFX library:

```text
<skill-dir>/assets/sfx/sfx-analysis.md
<skill-dir>/assets/sfx/sfx-analysis.json
```

**Critical: copy audio files into the composition project before rendering.** Hyperframes validates and serves assets from the composition directory. Always copy the files you need into `<output-dir>/composition/assets/` first:

```bash
# Create local asset dirs
mkdir -p <output-dir>/composition/assets/sfx/interface <output-dir>/composition/assets/sfx/impact <output-dir>/composition/assets/sfx/casino <output-dir>/composition/assets/sfx/ui
mkdir -p <output-dir>/composition/assets/music

# Copy only the files you plan to use (not the entire library)
cp <skill-dir>/assets/sfx/interface/bong_001.ogg <output-dir>/composition/assets/sfx/interface/
cp <skill-dir>/assets/sfx/impact/impactBell_heavy_000.ogg <output-dir>/composition/assets/sfx/impact/
cp <skill-dir>/assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3 <output-dir>/composition/assets/music/
```

Then in the composition HTML, paths are **relative to the `composition/` directory**:
```
assets/sfx/interface/bong_001.ogg
assets/sfx/impact/impactBell_heavy_000.ogg
assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3
```

Never use absolute paths (starting with `/Users/...`) — they will silently fail in the renderer.
