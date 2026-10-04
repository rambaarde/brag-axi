# Step 4: Validate, render, and deliver

## Validate

```bash
node <skill-dir>/scripts/brag.mjs check <output-dir>/composition   # brag's single pre-render gate
```

The script runs `hyperframes check --json`, keeps the full report in `<output-dir>/.brag-logs/check.log`, and prints `check: pass` or `check: fail` with only the blocking errors and their fix hints (add `--all` for warnings and info). Fix every error, including WCAG contrast failures (they gate as errors, not warnings). Each contrast finding carries a suggested compliant color, so apply it or adjust within the palette family and re-run the check. Most fixes need no screenshot. There is no per-element contrast escape hatch for real text; the only bypass is `-- --no-contrast`, which skips the entire WCAG pass (all-or-nothing), not a way to accept one borderline element. The layout pass backstops the "keep all text readable" creative law, so fix any reported overflow. Load `hyperframes-cli` only if the script output does not explain an error.

For a visual gut-check before rendering, optionally capture key frames:

```bash
cd <output-dir>/composition
npx hyperframes snapshot   # PNG key frames
```

## Preview

```bash
cd <output-dir>/composition
npx hyperframes preview
```

Tell the user the preview is running and give them the localhost URL. Invite them to check it before rendering.

If the user approves or asks to render:

## Render

```bash
node <skill-dir>/scripts/brag.mjs render <output-dir>/composition --output <output-dir>/brag.mp4
```

The script runs `hyperframes render --quiet`, keeps the full log in `<output-dir>/.brag-logs/render.log`, and prints `render: ok` with the path, duration, resolution, audio flag, and size. On failure it prints `render: fail` and the last log lines.

For a faster iteration render, add `--quality draft`. For final delivery, add `--quality high`.

## Pick the poster frame

The poster is the still shown before the video plays — the first thing anyone sees when it's idle or unplayed. Don't leave it to the raw first frame or an arbitrary timestamp; those land on fades, mid-transitions, blank intro backgrounds, or half-rendered text.

You built this composition, so you already know its strongest moment and exactly when it lands — the hook line, the hero reveal, or the final logo. Pick that beat at a **settled** point: text fully animated in, before it exits (the storyboard timings tell you the safe window). Then extract that one frame full-res with ffmpeg. From `<output-dir>/composition`:

```bash
# use the timestamp of your strongest settled beat, e.g. 3.2s
ffmpeg -ss 3.2 -i <output-dir>/brag.mp4 -frames:v 1 -q:v 2 <output-dir>/brag.jpg
```

Aim for a frame that's postable on its own (the "show the thing" law — any frozen frame should be shareable). If the pulled frame lands on a transition or mid-animation, nudge the timestamp a few tenths of a second and re-extract.

### Bake the poster as frame 0

A bare `.mp4` has no `poster` attribute — every player and platform picks its own idle thumbnail, and almost all of them grab **frame 0**. Slack, Twitter/X, and Discord regenerate thumbnails server-side and ignore embedded cover-art metadata, so the *only* reliable way to control the idle image everywhere is to make frame 0 *be* the poster.

Replace **only** the first frame's pixels with `brag.jpg`, leaving every other frame and all timing untouched — same duration, same frame count, audio copied through. At 30fps the poster shows for 1/30s before the intro rolls, so it's imperceptible on playback but it's what every thumbnail grabber sees. From `<output-dir>`:

```bash
ffmpeg -y -i brag.mp4 -i brag.jpg \
  -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" \
  -map "[v]" -map 0:a? -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
  -c:a copy -movflags +faststart brag.poster.mp4 \
  && mv brag.poster.mp4 brag.mp4
```

The poster (`brag.jpg`) matches the video's dimensions because it was pulled from the same render, so the overlay lines up exactly. Keep `brag.jpg` alongside — it's the custom-thumbnail asset for platforms that accept an upload (Instagram, TikTok, YouTube, Facebook, and the LinkedIn post editor) and the `poster="brag.jpg"` image for any `<video>` that embeds the brag (a gallery card, the user's site).

## Write share copy

Write `<output-dir>/share-copy.txt`.

The share copy should be:
- One to three sentences max
- Postable as-is to Twitter/X, LinkedIn, or Discord
- Specific to the project — no generic "excited to share" language
- Tone-matched to the brag video

`share-copy.txt` is the canonical single caption. Do not put multi-platform variants, long launch notes, or Product Hunt copy in this file.

If variants are useful, write them to a separate optional file:

```text
<output-dir>/share-copy-variants.md
```

### Share copy by tone

**`default`:**
```
Made [App Name]. It's [what it does, in the project's own absurd terms].
[The best line from the product.]
```

**`polished`:**
```
Introducing [App Name]: [clean one-liner from the site].
Built with [stack if notable].
```

**`yc-parody`:**
```
We built [App Name] to solve [problem stated completely seriously].
[Deadpan feature or stat.]
```

**`chaotic`:**
```
[ALL CAPS CLAIM].
[App Name] is [wildly overstated description].
Link below.
```

**`deadpan`:**
```
I made [App Name].
It [what it does].
```

**`cinematic`:**
```
[App Name].
[Tagline from the site, verbatim or lightly adapted.]
```

**`app-store`:**
```
[App Name] is now live.
[Feature 1], [Feature 2], and [Feature 3] — all in one place.
```

### Example: Taxi for Taxis

```
Every day, taxis carry us. But who carries the taxis?
Taxi for Taxis: the ride-hailing app for ride-hailing assets.
Available in 12 metros.
```

## Final output structure

After this step, `<output-dir>/` should contain:

```
<output-dir>/
  brag.mp4                — the rendered video
  brag.jpg                — the poster (best frame, for <video poster>)
  brag-plan.md            — the plan and storyboard
  composition-brief.md    — the Hyperframes handoff brief
  share-copy.txt          — the share caption
  composition/            — the Hyperframes project
    index.html
    ...
```

## Telling the user

After everything is done, tell the user:
- Where the video is (`<output-dir>/brag.mp4`)
- Where the share copy is
- One sentence on what the video does creatively
- Optionally: offer to re-roll a scene, change tone, or try a different angle
