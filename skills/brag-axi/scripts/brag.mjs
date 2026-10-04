#!/usr/bin/env node
/**
 * brag.mjs: token-efficient (AXI) front end for the HyperFrames steps of /brag-axi.
 *
 * Why: `hyperframes check` prints ~1.3k tokens (its --json form ~4.2k) and
 * `hyperframes render` ~3.9k tokens of browser and progress logs per run.
 * An agent needs only the verdict, the issues with their fix hints, and the
 * output file facts. This script runs the real commands, keeps the full log on
 * disk, and prints a short TOON summary on stdout.
 *
 * Usage:
 *   node brag.mjs                                  home view: brag-output* runs in the cwd
 *   node brag.mjs check <composition-dir> [--all] [-- <hyperframes check flags>]
 *   node brag.mjs render <composition-dir> --output <file> [--quality draft|standard|high]
 *                                         [-- <hyperframes render flags>]
 * Exit codes: 0 = command ran (a failed check is data, read `check:`),
 *             1 = could not finish, 2 = usage error.
 * No dependencies beyond Node 22+, npx, and ffprobe (ships with FFmpeg).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BIN = (() => {
  const p = fileURLToPath(import.meta.url);
  const h = homedir();
  return p.startsWith(h + "/") ? "~" + p.slice(h.length) : p;
})();
const RUN = `node ${BIN}`;
const MAX_ISSUES = 20;
const CELL = 220; // max chars per table cell; full text stays in the log

// --- TOON output (spec v3 section 7.2 quoting, comma delimiter) ------------
const NEEDS_QUOTE = /[:"\\[\]{},\u0000-\u001f]/;
const NUMERIC = /^[+-]?[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/i;
function v(x) {
  if (x === null || x === undefined) return "null";
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  let s = String(x);
  if (s.length > CELL) s = s.slice(0, CELL) + "...";
  const quote = s === "" || s !== s.trim() || ["true", "false", "null"].includes(s) ||
    NUMERIC.test(s) || NEEDS_QUOTE.test(s) || s[0] === "-" || s[0] === "#";
  if (!quote) return s;
  return '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r").replace(/\t/g, "\\t")
    .replace(/[\u0000-\u001f]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")) + '"';
}
const field = (k, x) => `${k}: ${v(x)}`;
const table = (name, cols, rows) => rows.length === 0 ? `${name}: []`
  : [`${name}[${rows.length}]{${cols.join(",")}}:`, ...rows.map((r) => "  " + cols.map((c) => v(r[c])).join(","))].join("\n");
const help = (lines) => lines.length ? [`help[${lines.length}]:`, ...lines.map((l) => "  " + l)].join("\n") : "";
const emit = (...blocks) => console.log(blocks.filter(Boolean).join("\n"));
function fail(message, hint, code) {
  emit(field("error", message), field("help", hint));
  process.exit(code);
}

// --- argument parsing (unknown flags fail loudly, AXI section 6) -----------
const USAGE = {
  check: "check <composition-dir> [--all] [-- <hyperframes check flags>]",
  render: "render <composition-dir> --output <file> [--quality draft|standard|high] [-- <hyperframes render flags>]",
};
function parse(argv, cmd, known) {
  const out = { _: [], pass: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") { out.pass = argv.slice(i + 1); break; }
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const [name, inline] = a.slice(2).split(/=(.*)/s);
    if (!(name in known)) fail(`unknown flag --${name} for \`${cmd}\``, `valid: ${USAGE[cmd]} (--help always allowed)`, 2);
    if (known[name] === "bool") out[name] = true;
    else {
      const val = inline ?? argv[++i];
      if (val === undefined || val.startsWith("--")) fail(`--${name} needs a value`, `usage: ${RUN} ${USAGE[cmd]}`, 2);
      out[name] = val;
    }
  }
  return out;
}
function compDir(args, cmd) {
  if (args._.length !== 1) fail(`\`${cmd}\` needs exactly one <composition-dir>`, `usage: ${RUN} ${USAGE[cmd]}`, 2);
  const d = resolve(args._[0]);
  if (!existsSync(join(d, "index.html"))) {
    fail(`no index.html in ${d}`, "pass the HyperFrames composition folder, usually <output-dir>/composition", 2);
  }
  return d;
}

// --- running HyperFrames with the full log kept on disk --------------------
function run(cwd, hfArgs, logName) {
  const t0 = Date.now();
  const r = spawnSync("npx", ["--yes", "hyperframes", ...hfArgs], {
    cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, env: { ...process.env, CI: "1" },
  });
  const log = (r.stdout || "") + (r.stderr || "");
  const logDir = join(dirname(cwd), ".brag-logs");
  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, logName);
  writeFileSync(logPath, log);
  if (r.error) fail(`could not start npx hyperframes: ${r.error.code || r.error.message}`, "install Node 22+ and check `npx hyperframes doctor`", 1);
  return { code: r.status, log, stdout: r.stdout || "", logPath, seconds: ((Date.now() - t0) / 1000).toFixed(1) };
}
function logTail(log, n = 12) {
  const lines = log.split("\n").map((l) => l.replace(/\u001b\[[0-9;]*m/g, "").trimEnd()).filter(Boolean);
  return { total: lines.length, tail: lines.slice(-n).map((line) => ({ line })) };
}

// --- check ------------------------------------------------------------------
const SECTIONS = ["lint", "runtime", "layout", "motion", "contrast"];
function issueRow(section, f) {
  const at = f.firstSeen != null && f.lastSeen != null && f.firstSeen !== f.lastSeen
    ? `${+f.firstSeen.toFixed(2)}-${+f.lastSeen.toFixed(2)}s` : f.time != null ? `${+Number(f.time).toFixed(2)}s` : "";
  let fix = f.fixHint || f.fix || "";
  if (!fix && f.suggestedColor) fix = `use ${f.suggestedColor} (contrast ${f.ratio}:1, needs ${f.requiredRatio}:1)`;
  const where = [f.selector, f.sourceFile && `(${f.sourceFile}${f.line ? ":" + f.line : ""})`].filter(Boolean).join(" ");
  return {
    severity: f.severity || "error", section, where, at,
    problem: [f.code, f.message].filter(Boolean).join(": ") + (f.text ? ` "${f.text}"` : ""), fix,
  };
}
function check(argv) {
  const args = parse(argv, "check", { all: "bool" });
  const dir = compDir(args, "check");
  const r = run(dir, ["check", "--json", ...args.pass], "check.log");
  const start = r.stdout.search(/^\{/m); // the JSON report is on stdout; stderr carries the logs
  let report;
  try { report = JSON.parse(r.stdout.slice(start)); } catch {
    const t = logTail(r.log);
    emit(field("check", "error"), field("composition", dir), field("exit_code", r.code),
      table("log_tail", ["line"], t.tail),
      help([`HyperFrames printed no JSON report. Full log (${t.total} lines): ${r.logPath}`,
        "If the cause is unclear, load the hyperframes-cli skill"]));
    process.exit(1);
  }
  const sections = SECTIONS.filter((s) => report[s]).map((s) => ({
    section: s, errors: report[s].errorCount ?? 0, warnings: report[s].warningCount ?? 0,
  }));
  const rank = { error: 0, warning: 1 };
  const issues = SECTIONS.flatMap((s) => (report[s]?.findings || []).map((f) => issueRow(s, f)))
    .sort((a, b) => (rank[a.severity] ?? 2) - (rank[b.severity] ?? 2));
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const other = issues.length - errors.length - warnings;
  // Default schema: only the errors that block the gate. Warnings and info are opt-in (--all).
  const shown = args.all ? issues : errors.slice(0, MAX_ISSUES);
  const verdict = report.ok ? "pass" : "fail";
  const hints = [];
  if (verdict === "fail") hints.push(`Fix every error, then run \`${RUN} check ${args._[0]}\` again`);
  if (shown.length < issues.length) {
    hints.push(`\`${RUN} check ${args._[0]} --all\` lists all ${issues.length} (${issues.length - errors.length} do not block render)`);
  }
  if (verdict === "pass") hints.push(`Render: \`${RUN} render ${args._[0]} --output <output-dir>/brag.mp4\``);
  if (issues.length) hints.push(`Full report: ${r.logPath}`);
  emit(field("check", verdict), field("composition", dir), table("sections", ["section", "errors", "warnings"], sections),
    issues.length
      ? field("issues", `${issues.length} (${errors.length} errors, ${warnings} warnings, ${other} info; ${shown.length} shown)`)
      : field("issues", "0 found in lint, runtime, layout, motion, and contrast"),
    shown.length ? table("issues", ["severity", "section", "where", "at", "problem", "fix"], shown) : "",
    help(hints));
}

// --- render -----------------------------------------------------------------
function probe(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=width,height,codec_type",
    "-of", "json", file], { encoding: "utf8" });
  if (r.status !== 0) return {};
  const j = JSON.parse(r.stdout);
  const vs = (j.streams || []).find((s) => s.codec_type === "video") || {};
  return {
    duration: j.format?.duration ? `${(+j.format.duration).toFixed(1)}s` : "unknown",
    resolution: vs.width ? `${vs.width}x${vs.height}` : "unknown",
    audio: (j.streams || []).some((s) => s.codec_type === "audio"),
  };
}
function render(argv) {
  const args = parse(argv, "render", { output: "value", quality: "value" });
  const dir = compDir(args, "render");
  if (!args.output) fail("--output is required", `usage: ${RUN} ${USAGE.render}`, 2);
  if (args.quality && !["draft", "standard", "high"].includes(args.quality)) {
    fail(`--quality must be draft, standard, or high (got ${args.quality})`, `usage: ${RUN} ${USAGE.render}`, 2);
  }
  const out = resolve(args.output);
  const hf = ["render", "--quiet", "--output", out, ...(args.quality ? ["--quality", args.quality] : []), ...args.pass];
  const r = run(dir, hf, "render.log");
  if (r.code !== 0 || !existsSync(out)) {
    const t = logTail(r.log);
    emit(field("render", "fail"), field("composition", dir), field("exit_code", r.code),
      table("log_tail", ["line"], t.tail),
      help([`Full log (${t.total} lines): ${r.logPath}`,
        `Run \`${RUN} check ${args._[0]}\` first; render does not run the check gate`,
        "If the cause is unclear, load the hyperframes-cli skill"]));
    process.exit(1);
  }
  const p = probe(out);
  emit(field("render", "ok"), field("video", out), field("duration", p.duration ?? "unknown"),
    field("resolution", p.resolution ?? "unknown"), field("audio", p.audio ?? false),
    field("size", `${(statSync(out).size / 1024 / 1024).toFixed(1)} MB`), field("rendered_in", `${r.seconds}s`),
    help(["Next: pick the poster frame and bake it as frame 0 (references/step-4-deliver.md)"]));
}

// --- home view (no arguments) ----------------------------------------------
function home() {
  const runs = readdirSync(".").filter((d) => /^brag-output/.test(d) && statSync(d).isDirectory()).sort();
  const has = (d, f) => existsSync(join(d, f)) ? "yes" : "no";
  const rows = runs.map((d) => ({
    dir: d, plan: has(d, "brag-plan.md"), brief: has(d, "composition-brief.md"),
    composition: has(d, "composition/index.html"), video: has(d, "brag.mp4"),
    poster: has(d, "brag.jpg"), share_copy: has(d, "share-copy.txt"),
  }));
  const last = rows.at(-1);
  const hints = !last ? ["Start a run: ask the agent to /brag-axi this project"]
    : last.composition === "yes" && last.video === "no"
      ? [`Gate: \`${RUN} check ${last.dir}/composition\``, `Then: \`${RUN} render ${last.dir}/composition --output ${last.dir}/brag.mp4\``]
      : [`Check a composition: \`${RUN} check <dir>/composition\``];
  emit(field("bin", BIN), field("description", "Check and render /brag-axi compositions with short TOON output"),
    rows.length ? table("runs", ["dir", "plan", "brief", "composition", "video", "poster", "share_copy"], rows)
      : field("runs", `0 brag-output* folders in ${basename(process.cwd())}`),
    help(hints));
}

// --- dispatch -----------------------------------------------------------------
const [cmd, ...rest] = process.argv.slice(2);
if (cmd === undefined) home();
else if (cmd === "--help" || cmd === "-h" || cmd === "help") {
  console.log(`usage:\n  ${RUN}\n  ${RUN} ${USAGE.check}\n  ${RUN} ${USAGE.render}\n` +
    "exit codes: 0 = ran (read check:/render:), 1 = could not finish, 2 = usage error\n" +
    "flags after -- go to hyperframes unchanged (e.g. -- --no-contrast)\n" +
    `examples:\n  ${RUN} check brag-output/composition\n  ${RUN} render brag-output/composition --output brag-output/brag.mp4 --quality draft`);
} else if (rest.includes("--help") || rest.includes("-h")) {
  console.log(`usage: ${RUN} ${USAGE[cmd] || "[check|render] ..."}`);
} else if (cmd === "check") check(rest);
else if (cmd === "render") render(rest);
else fail(`unknown command ${cmd}`, `valid commands: check, render (run with no arguments for the home view)`, 2);
