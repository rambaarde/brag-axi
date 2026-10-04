#!/usr/bin/env node
/**
 * context_cost.mjs: measure the instruction tokens a /brag run loads, upstream vs this fork.
 *
 * Why: brag-axi exists to cut context cost. This benchmark makes every saving
 * claimed in the README reproducible. "Before" files come from git ref
 * upstream/main (latent-spaces/brag); "after" files come from the working tree.
 * Hyperframes skill sizes come from heygen-com/hyperframes on GitHub.
 * Tokens are estimated as bytes / 4.
 *
 * Usage:
 *   node bench/context_cost.mjs                         instruction cost per scenario
 *   node bench/context_cost.mjs --runtime <comp-dir>    also run hyperframes check/render raw vs brag.mjs
 * Needs: git remote `upstream` fetched (git fetch upstream), network for GitHub raw files.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const UP = "skills/brag/", AX = "skills/brag-axi/";
const CUE = "assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.md";
const STEPS = ["SKILL.md", "references/step-1-inspect.md", "references/step-2-plan.md",
  "references/step-3-compose.md", "references/step-4-deliver.md"];
const HF_ALL = ["core", "animation", "creative", "keyframes", "cli"];
const HF_BASE = ["core", "animation", "creative"];

// Each scenario lists what the agent reads in that run, per the SKILL.md routing.
const SCENARIOS = [
  { name: "default (music + sfx, preset tone)",
    before: { files: [...STEPS, "references/tones.md", "references/audio.md", "assets/sfx/sfx-analysis.md", CUE], hf: HF_ALL },
    after: { files: [...STEPS, "references/tones/default.md", "references/audio.md", "references/audio-music.md", "references/audio-sfx.md", "assets/sfx/sfx-analysis.md", CUE], hf: HF_BASE } },
  { name: "silent (--no-music --no-sfx)",
    before: { files: [...STEPS, "references/tones.md", "references/audio.md"], hf: HF_ALL },
    after: { files: [...STEPS, "references/tones/default.md"], hf: HF_BASE } },
  { name: "camera moves (keyframes needed)",
    before: { files: [...STEPS, "references/tones.md", "references/audio.md", "assets/sfx/sfx-analysis.md", CUE], hf: HF_ALL },
    after: { files: [...STEPS, "references/tones/default.md", "references/audio.md", "references/audio-music.md", "references/audio-sfx.md", "assets/sfx/sfx-analysis.md", CUE], hf: [...HF_BASE, "keyframes"] } },
  { name: "--voice (cli needed)",
    before: { files: [...STEPS, "references/tones.md", "references/audio.md", "assets/sfx/sfx-analysis.md", CUE], hf: HF_ALL },
    after: { files: [...STEPS, "references/tones/default.md", "references/audio.md", "references/audio-music.md", "references/audio-sfx.md", "assets/sfx/sfx-analysis.md", CUE], hf: [...HF_BASE, "cli"] } },
];

const tok = (bytes) => Math.round(bytes / 4);
const upstreamBytes = (p) => execFileSync("git", ["show", `upstream/main:${UP}${p}`], { maxBuffer: 1 << 26 }).length;
const forkBytes = (p) => readFileSync(AX + p).length;
const hfCache = new Map();
async function hfBytes(skill) {
  if (!hfCache.has(skill)) {
    const r = await fetch(`https://raw.githubusercontent.com/heygen-com/hyperframes/main/skills/hyperframes-${skill}/SKILL.md`);
    if (!r.ok) throw new Error(`hyperframes-${skill}: HTTP ${r.status}`);
    hfCache.set(skill, Buffer.byteLength(await r.text()));
  }
  return hfCache.get(skill);
}
async function cost(spec, local) {
  let bytes = spec.files.reduce((n, f) => n + local(f), 0);
  for (const s of spec.hf) bytes += await hfBytes(s);
  return tok(bytes);
}

function runtime(dir) {
  const measure = (cmd, args) => {
    const r = spawnSync(cmd, args, { cwd: dir, encoding: "utf8", maxBuffer: 1 << 28 });
    return tok(Buffer.byteLength((r.stdout || "") + (r.stderr || "")));
  };
  const out = join(tmpdir(), `brag-bench-${process.pid}.mp4`);
  const bin = join(process.cwd(), AX, "scripts/brag.mjs");
  const rows = [
    { command: "check", raw: measure("npx", ["--yes", "hyperframes", "check"]), fork: measure("node", [bin, "check", "."]) },
    { command: "render --quality draft", raw: measure("npx", ["--yes", "hyperframes", "render", "--quality", "draft", "--output", out]),
      fork: measure("node", [bin, "render", ".", "--output", out, "--quality", "draft"]) },
  ];
  rmSync(out, { force: true });
  return rows;
}

const pct = (a, b) => `${Math.round((1 - b / a) * 100)}%`;
const rows = [];
try {
  for (const s of SCENARIOS) {
    const before = await cost(s.before, upstreamBytes), after = await cost(s.after, forkBytes);
    rows.push({ scenario: s.name, upstream_tok: before, brag_axi_tok: after, saved: pct(before, after) });
  }
} catch (e) {
  console.log(`error: ${JSON.stringify(e.message.split("\n")[0])}`);
  console.log('help: run `git fetch upstream` and check network access to raw.githubusercontent.com');
  process.exit(1);
}
const q = (s) => /[,:"]/.test(s) ? JSON.stringify(s) : s;
console.log("method: est. tokens = bytes / 4; files an agent reads per scenario (SKILL.md routing)");
console.log(`instructions[${rows.length}]{scenario,upstream_tok,brag_axi_tok,saved}:`);
for (const r of rows) console.log(`  ${q(r.scenario)},${r.upstream_tok},${r.brag_axi_tok},${r.saved}`);
const i = process.argv.indexOf("--runtime");
if (i > 0) {
  const rt = runtime(process.argv[i + 1]);
  console.log(`runtime_output[${rt.length}]{command,raw_tok,brag_mjs_tok,saved}:`);
  for (const r of rt) console.log(`  ${q(r.command)},${r.raw},${r.fork},${pct(r.raw, r.fork)}`);
}
