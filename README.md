# /brag-axi

**You built it. Now brag, and spend fewer tokens doing it.**

`/brag-axi` is a token-efficient fork of [latent-spaces/brag](https://github.com/latent-spaces/brag): an agent skill that turns
your project into a short, shareable launch video with music, motion, and share copy, powered by
[Hyperframes](https://hyperframes.heygen.com/). Same creative workflow and the same videos. The difference is that
the agent loads only the instructions each run needs, and the HyperFrames CLI talks back in a few lines instead of thousands.

[![the /brag launch site](docs/assets/hero.png)](https://latent-spaces.github.io/brag/)
<sub>Hero and example videos from the upstream project.</sub>

## What it saves

Measured with [`bench/context_cost.mjs`](bench/context_cost.mjs) against `upstream/main` (estimated tokens = bytes / 4).

**Instructions the agent loads per run**

| Scenario | /brag | /brag-axi | Saved |
|---|---:|---:|---:|
| Default (music + SFX, preset tone) | 37,129 | 26,738 | **28%** |
| Silent (`--no-music --no-sfx`) | 35,052 | 19,985 | **43%** |
| Camera moves (keyframes skill needed) | 37,129 | 30,774 | 17% |
| `--voice` (CLI skill needed) | 37,129 | 32,293 | 13% |

**Command output the agent reads per call** (sample HyperFrames composition)

| Command | Raw HyperFrames | `brag.mjs` | Saved |
|---|---:|---:|---:|
| `check` | 1,278 | 527 | **59%** |
| `render --quality draft` | 3,810 | 66 | **98%** |

A run usually checks more than once. With 3 checks and 2 renders, a default run goes from about **48.6k to 28.5k tokens (−41%)**
before the agent writes any composition code. That total is an estimate from the measured parts, not a measured end-to-end run.

Reproduce:

```bash
git remote add upstream https://github.com/latent-spaces/brag.git && git fetch upstream
node bench/context_cost.mjs                       # instruction cost
node bench/context_cost.mjs --runtime <comp-dir>  # also check/render output, raw vs brag.mjs
```

### End-to-end test (2026-10-04)

Codex CLI 0.155.1 (`gpt-5.6-luna`, high reasoning) ran `/brag-axi` headless on the upstream `examples/horse-tinder` site:

| Result | |
|---|---|
| Deliverables | plan, composition brief, composition, `brag.mp4`, `brag.jpg`, `share-copy.txt`: all written |
| Video | 20.0 s, 1920x1080, with music and SFX; poster baked as frame 0 |
| Gate and render | 6 `brag.mjs check` calls and 1 `brag.mjs render`; final check `pass`; **0 raw `npx hyperframes` calls** |
| Time and tokens | ~11 minutes, 191,326 tokens total (Codex count, including reading the project and writing the composition) |

Limit of this test: the agent worked from `SKILL.md` alone and read no reference file and no Hyperframes skill, so it
did not exercise the per-step loading rules. There is no matching upstream run yet, so the end-to-end saving is not measured.

## How it saves

The fork applies the [AXI](https://github.com/kunchenguid/axi) principles for agent-facing tools:

| Change | Effect |
|---|---|
| **`scripts/brag.mjs`** wraps `hyperframes check` and `render` | [TOON](https://toonformat.dev/) output; only blocking errors with fix hints (`--all` for the rest); `render` runs `--quiet` and reports path, duration, resolution, size; full logs stay in `<output-dir>/.brag-logs/` |
| **Home view** | `node brag.mjs` with no arguments lists every `brag-output*` run and what is still missing |
| **Structured errors** | `error:` + `help:` on stdout, unknown flags rejected, exit codes `0` ran / `1` could not finish / `2` usage |
| **Load Hyperframes skills per need** | `core`, `animation`, `creative` always; `keyframes` only for camera moves and keyframe work; `cli` only for `--voice`, `hyperframes beats`, or an unexplained failure |
| **One file per tone** | Reads `references/tones/<tone>.md` for the chosen preset, not all seven |
| **Audio by layer** | `audio.md` (shared paths) + `audio-music.md` + `audio-sfx.md`, each read only when that layer is on |
| **Data stays on disk** | Cue and SFX analysis JSON (up to ~100k tokens) is passed by path, never read (as upstream already did) |

`/brag-slim`, the single-file Opus 5.5 variant (~1.9k tokens), ships unchanged.

## Install

**Any agent** (Codex, Claude Code, Antigravity, Cursor, opencode, Copilot, and others) through the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add rambaarde/brag-axi --skill brag-axi
```

Add `-g` for all projects. Add `--skill brag-slim` as well if you also want the slim variant.

**Claude Code plugin:**

```text
/plugin marketplace add rambaarde/brag-axi
/plugin install brag-axi@brag-axi
```

**Codex plugin:**

```bash
codex plugin marketplace add rambaarde/brag-axi
codex plugin add brag-axi@brag-axi
```

The repo also exposes the skills at `.agents/skills/`, `.claude/skills/`, and `.opencode/skills/` via symlinks
(Windows: `git clone -c core.symlinks=true`). If you also have upstream `/brag` installed, keep only one of the two,
because both answer "let's brag about this".

## Use it

From any project directory:

```text
let's /brag-axi
/brag-axi --tone chaotic --format vertical
/brag-axi --no-music --no-sfx
/brag-axi --voice
```

Options, tones, and output (`brag-output/` with the plan, composition brief, share copy, `brag.mp4`, and `brag.jpg`)
are the same as upstream. On Claude Opus 5.5, `/brag-axi` hands off to `/brag-slim` unless you pass `--full` or `--voice`.

## Requirements

- An agent that supports Agent Skills
- Node.js 22+
- FFmpeg (with `ffprobe`) on `PATH`
- Hyperframes CLI: `npx hyperframes` (check with `npx hyperframes doctor`)

## Staying in sync with upstream

```bash
git fetch upstream && git merge upstream/main
```

The skill folder is `skills/brag-axi/` (upstream: `skills/brag/`), so git follows the rename. Conflicts are most likely in
`SKILL.md` and the step references, where the loading rules changed.

## Credits

- **[/brag](https://github.com/latent-spaces/brag)** by Latent Spaces (Shunit Haviv Hakimi): the original skill, creative rules, examples, and launch site. MIT.
- Music: [ende.app](https://ende.app/en) "Happy Beats / Business Moves". Sound effects: [Kenney](https://kenney.nl/) (CC0).
- Video generation: [Hyperframes](https://hyperframes.heygen.com/).
- Principles: [AXI](https://github.com/kunchenguid/axi) and [TOON](https://toonformat.dev/).

## License

MIT, same as upstream. See [LICENSE](LICENSE).
