# Audio reference: SFX

Read only when SFX is on. Shared asset paths and copy rules are in [audio.md](audio.md).

---

## SFX library — approved files

The family SFX (casino, impact, interface, ui) live directly under `sfx/`; the individual keypress set lives in `sfx/keyboard/`.

Read `sfx-analysis.md` before choosing files — it lists safer picks by use case and flags files with high-frequency risk. Prefer low/medium HF risk for polished and repeated moments; reserve high-risk files for tiny isolated accents or chaotic tones.

### `keyboard/` — Individual keypress sounds

32 CC0 single keypress WAV files (`keypress-001.wav` through `keypress-032.wav`). Each is a distinct key sound at a slightly different velocity and character. Use these for per-character typing animations — randomize across the set so repeated characters don't sound robotic.

**Source:** [Keyboard Soundpack #1](https://opengameart.org/content/keyboard-soundpack-1-typing-and-single-keystrokes) by unicae_games — CC0

### `interface/` — UI sounds

| Files | Character | Use for |
|---|---|---|
| `click_001–005.ogg` | Sharp, precise | Button tap, CTA, any tap action |
| `glitch_002.ogg`, `glitch_004.ogg` | Digital distortion | Tech/AI moment, chaotic accent |
| `error_005–006.ogg` | Negative buzz | Comedic fail, wrong answer |
| `switch_001–002.ogg`, `switch_004–007.ogg` | Toggle switch | Feature switching on, binary state |
| `drop_001–003.ogg` | Soft drop | Element landing, gentle placement |
| `bong_001.ogg` | Deep bell | Dramatic announcement — use sparingly |
| `select_008.ogg` | Selection click | Navigation, item focus |

### `impact/` — Impact sounds

More physical and cinematic. Excellent for big moments and transitions.

| Files | Character | Use for |
|---|---|---|
| `impactSoft_medium_000–004.ogg` | Medium soft thud | Major reveal, hard transition — safest family |
| `impactSoft_heavy_000–004.ogg` | Heavy soft thud | Comedic bonk, weight, silly moment |
| `impactBell_heavy_000.ogg`, `_003.ogg`, `_004.ogg` | Deep resonant bell | Cinematic reveal, logo slam, dramatic moment |
| `impactPunch_heavy_000–004.ogg` | Heavy punch | Aggressive beat, chaotic tone |
| `impactPunch_medium_000–004.ogg` | Medium punch | Impact emphasis |
| `impactWood_light_000–004.ogg` | Light wood knock | Warm, organic tap |
| `impactWood_medium_000–004.ogg` | Wood knock | Warmer accent |
| `impactWood_heavy_000–004.ogg` | Heavy wood hit | Cinematic weight |
| `impactPlank_medium_000–004.ogg` | Plank slap | Comic physical moment |
| `impactPlate_heavy_000–004.ogg` | Metal plate slam | Big hit, aggressive |
| `impactPlate_light_000–004.ogg` | Light metal plate | Notification, crisp accent |
| `impactPlate_medium_000–004.ogg` | Medium plate | Mid-weight accent |
| `impactTin_medium_000–004.ogg` | Tin can hit | Quirky, lo-fi moment |
| `impactGeneric_light_000–004.ogg` | Generic light hit | Versatile small accent |
| `impactMetal_medium_000–004.ogg` | Metal tap | Medium accent |
| `impactMetal_heavy_000.ogg`, `_002.ogg`, `_004.ogg` | Heavy metal clang | Aggressive hit |
| `impactMetal_light_002–003.ogg` | Light metal ping | Small notification |
| `impactGlass_light_001–003.ogg` | Light glass clink | Sparkle, delicate achievement |
| `impactGlass_medium_000.ogg`, `_002.ogg`, `_004.ogg` | Glass tap | Mid-weight accent |
| `impactGlass_heavy_002.ogg` | Glass shatter | Chaotic hit |
| `impactMining_001.ogg` | Mining strike | Industrial, heavy |

### `casino/` — Card and chip sounds

Specific but great for swipe/deal/stack moments.

| Files | Character | Use for |
|---|---|---|
| `card-slide-1–8.ogg` | Card sliding | Swipe action, content sliding in |
| `card-place-1–4.ogg` | Card placement | Item landing, card appearing |
| `card-fan-1–2.ogg` | Cards fanning | Multiple items appearing in sequence |
| `card-shove-1–4.ogg` | Card shoved | Forceful card motion |
| `card-shuffle.ogg` | Shuffle | Transition with motion |
| `chip-lay-1–3.ogg` | Chip placed | Metric placed/confirmed |
| `chips-stack-1–6.ogg` | Chips stacking | Counter incrementing, stacking animation |
| `chips-collide-1–4.ogg` | Chips clinking | Celebratory, success with weight |
| `chips-handle-1–4.ogg`, `chips-handle-6.ogg` | Chips handled | Casual chip movement |
| `dice-shake-1–3.ogg` | Dice shaking | Build-up, anticipation |
| `dice-grab-1–2.ogg` | Dice grabbed | Pick up, quick action |
| `dice-throw-1–3.ogg` | Dice thrown | Chaotic/random moment |
| `die-throw-1–4.ogg` | Single die thrown | Lighter random accent |
| `cards-pack-open-1–2.ogg` | Pack opening | Reveal, product launch moment |

### `ui/` — Clicks and switches

| Files | Character | Use for |
|---|---|---|
| `click1–5.ogg` | Various click tones | Button tap, cleaner than interface clicks |
| `mouseclick1.ogg` | Mouse click | Simulated cursor interaction |
| `rollover1–2.ogg`, `rollover4–5.ogg` | Hover/rollover | Subtle hover feedback, very soft accent |
| `switch1–38.ogg` (most variants) | Switch variants | Toggle, mode change — pick by character |

---

## Tone → SFX energy

| Tone | Energy | Approach |
|---|---|---|
| `default` | Moderate | 3-5 SFX at key moments. `interface/click` or `interface/drop_*` for pop-ins, `impactBell_heavy_000` for success, `impactSoft_medium` for reveals. |
| `polished` | Minimal but present | 2-3 very subtle SFX. `interface/bong_001` for a soft accent. `interface/drop_001` for a gentle reveal. Nothing aggressive. |
| `yc-parody` | Sparse but present | 2-3 restrained cues. One dry reveal hit (`impactSoft_medium`), one UI/card accent, one logo payoff if it fits. |
| `chaotic` | Dense | SFX on every beat, sometimes stacked. Mix `impact/impactPunch_heavy`, `interface/glitch_002`, `casino/dice-throw`, `impact/impactMetal_heavy`. |
| `deadpan` | Very sparse | Prefer one quiet music bed plus 1-2 dry cues. Full silence only when the plan explicitly says silence is the joke. |
| `cinematic` | 2-3 big ones | `impactBell_heavy_000` or `_004` for the hero moment. `impactSoft_medium` for the reveal. `impactBell_heavy_003` for the outro. |
| `app-store` | Consistent light layer | `interface/drop_*` or `interface/click_*` per feature card. `impactBell_heavy_000` on outro. All at 0.65-0.75 volume. |

---

## Moment → sound heuristics

Use these as examples for Hyperframes, not a fixed recipe. Sound should reinforce the edit, not call attention to itself.

| Moment type | Good sound families | Notes |
|---|---|---|
| Sequential cards/items opening | `casino/card-slide-*`, `casino/card-place-*`, `casino/card-fan-*`, `interface/drop_*` | Match the gesture. A card stack uses card sounds; a soft product grid can use drop sounds. For dense sequences, accent the first, last, or rhythmically important items only. |
| Big reveal / payoff | `impact/impactBell_heavy_000`, `_003`, or `_004`, `impact/impactSoft_medium_*`, `interface/bong_001` | One short announcement-style cue when the reveal lands. Keep it brief. |
| Text popping / typed copy | `keyboard/keypress-*.wav` (randomized), `interface/drop_*` | For per-character typing animations, pick a random file from `keyboard/` for each character. For soft label pop-ins, use `drop_001` or `drop_002`. Thin out or skip when copy is dense. |
| Simulated user action | `interface/click_*`, `interface/select_008`, `interface/switch_*`, `ui/mouseclick1`, `ui/switch*` | Use interaction sounds when the video shows a cursor, tap, button, toggle, swipe, or selection. Match the visible action. |
| Success / completion | `impact/impactBell_heavy_000`, `_003`, or `_004`, `casino/chips-collide-*` | Positive accent for approvals, matches, metrics, completed flows, or final CTAs. |
| Chaotic or comedic beat | `interface/glitch_002`, `interface/glitch_004`, `interface/error_005–006`, `impact/impactPunch_heavy_*`, `casino/dice-throw-*` | Reserve louder or weirder cues for tones that can handle them. |

When in doubt, pick fewer cues with better timing. Prefer a coherent sonic palette for the whole video over a grab bag of cute sounds.

---

## Timing rules

These rules apply when Hyperframes is implementing the composition and the motion timings are known:

- Align SFX to the **start** of the animation, not the end
- Entry pop: 0.0–0.1s before the element's first visible frame
- Transition: at the transition start time
- Success ding: at the moment the metric/stat is fully visible
- For staggered elements: usually accent the first, final, or strongest beat; only score every item when that rhythm is intentional and still feels clean

Composition notation:
```
Scene 2 — Reveal — 3s
  "Horse Tinder" scales in at 0.3s  →  SFX: impact/impactSoft_medium_001 at 0.2s
  Tagline fades up at 0.8s          →  (no SFX, let the reveal carry)
  Transition at 3.0s                →  SFX: interface/drop_001 at 2.9s
```
