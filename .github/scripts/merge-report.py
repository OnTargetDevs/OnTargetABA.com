#!/usr/bin/env python3
"""Parse LHCI results and generate a Lighthouse report.

Handles two modes:
  pr         – parse .lighthouseci/manifest.json, compare to baseline,
               write GITHUB_OUTPUT (comment + passed), exit 1 on regression.
  all-pages  – walk lhci-results/lhci-shard-*/ dirs, generate full
               per-page Markdown table, update baseline.json.

Audit adjustments
-----------------
`third-party-cookies` and `inspector-issues` are caused by the Google Ads
tag (doubleclick.net), which is required business tracking.  They are
reported but excluded when computing the "adjusted best-practices" score
used for the pass/fail gate.
"""
import argparse, json, os, pathlib, re, sys
from datetime import datetime, timezone

# Audits caused by Google Ads; excluded from the adjusted BP score.
GOOGLE_ADS_AUDITS = {"third-party-cookies", "inspector-issues"}

# Pattern for Cloudflare Pages preview URLs: https://<8hex>.ontargetaba.pages.dev
_PREVIEW_RE = re.compile(r"^https://[0-9a-f]+\.ontargetaba\.pages\.dev", re.IGNORECASE)

CAT_KEYS = ["performance", "accessibility", "best-practices", "seo"]

# Shorten long audit titles for the table
_MAX_AUDIT_TITLE = 45


# ── LHR helpers ──────────────────────────────────────────────────────────────

def compute_adjusted_bp(lhr: dict) -> float:
    """Recompute best-practices score excluding GOOGLE_ADS_AUDITS."""
    cat = lhr.get("categories", {}).get("best-practices", {})
    audits = lhr.get("audits", {})
    total_w = 0.0
    weighted = 0.0
    for ref in cat.get("auditRefs", []):
        aid = ref.get("id", "")
        w = float(ref.get("weight", 0))
        if w == 0 or aid in GOOGLE_ADS_AUDITS:
            continue
        score = audits.get(aid, {}).get("score")
        if score is None:
            continue
        total_w += w
        weighted += w * float(score)
    if total_w == 0:
        return round(float(cat.get("score", 0)) * 100, 1)
    return round(weighted / total_w * 100, 1)


def get_top_failing_audits(lhr: dict, n: int = 3) -> list[tuple[str, float, str]]:
    """Return the top-n failing audits (title, weight, category) by weight desc."""
    audits = lhr.get("audits", {})
    # Build max weight per audit across all categories
    weight_map: dict[str, tuple[float, str]] = {}
    for cat_id, cat in lhr.get("categories", {}).items():
        for ref in cat.get("auditRefs", []):
            aid = ref.get("id", "")
            w = float(ref.get("weight", 0))
            if w > 0:
                prev_w, _ = weight_map.get(aid, (0.0, ""))
                if w > prev_w:
                    weight_map[aid] = (w, cat_id)

    failing: list[tuple[float, str, str]] = []  # (weight, title, cat)
    for aid, (w, cat_id) in weight_map.items():
        a = audits.get(aid, {})
        score = a.get("score")
        if score is not None and float(score) < 1.0:
            title = a.get("title", aid)[:_MAX_AUDIT_TITLE]
            failing.append((w, title, cat_id))
    failing.sort(reverse=True)
    return [(title, w, cat_id) for w, title, cat_id in failing[:n]]


def url_to_path(url: str) -> str:
    """Strip the origin from a URL, returning just the path."""
    for prefix in (
        "https://beta.ontargetaba.com",
        "https://ontargetaba.pages.dev",
        "http://localhost",
    ):
        if url.startswith(prefix):
            url = url[len(prefix):]
            break
    else:
        # CF Pages preview URLs: https://<hash>.ontargetaba.pages.dev/...
        m = _PREVIEW_RE.match(url)
        if m:
            url = url[m.end():]
    # Strip port (e.g. :6789/)
    if url and url[0] == ":":
        url = "/" + url.split("/", 1)[-1]
    path = url.split("?")[0].split("#")[0]
    return path or "/"


# ── Result parsing ────────────────────────────────────────────────────────────

def find_lhr_file(entry: dict, shard_dir: pathlib.Path) -> pathlib.Path | None:
    json_path = entry.get("jsonPath", "")
    if not json_path:
        return None
    filename = pathlib.Path(json_path).name
    candidate = shard_dir / filename
    if candidate.exists():
        return candidate
    # Try absolute path (works in PR mode on the runner)
    abs_p = pathlib.Path(json_path)
    if abs_p.exists():
        return abs_p
    return None


def parse_results(results_base: pathlib.Path) -> list[dict]:
    """Walk results_base for manifest.json files; return per-page dicts."""
    pages: dict[str, dict] = {}

    for manifest_path in sorted(results_base.rglob("manifest.json")):
        shard_dir = manifest_path.parent
        try:
            entries = json.loads(manifest_path.read_text())
        except Exception as e:
            print(f"Warning: could not parse {manifest_path}: {e}", file=sys.stderr)
            continue

        for entry in entries:
            # For 1-run jobs every entry is representative; for 3-run jobs pick median.
            if not entry.get("isRepresentativeRun", True):
                continue
            url = entry.get("url", "")
            path = url_to_path(url)
            summary = entry.get("summary", {})
            scores = {k: round(float(summary.get(k, 0)) * 100, 1) for k in CAT_KEYS}

            adj_bp = scores["best-practices"]
            top_failing: list[tuple[str, float, str]] = []

            lhr_file = find_lhr_file(entry, shard_dir)
            if lhr_file and lhr_file.exists():
                try:
                    lhr = json.loads(lhr_file.read_text())
                    adj_bp = compute_adjusted_bp(lhr)
                    top_failing = get_top_failing_audits(lhr)
                except Exception as e:
                    print(f"Warning: could not parse LHR {lhr_file}: {e}", file=sys.stderr)

            pages[path] = {
                "path": path,
                "performance": scores["performance"],
                "accessibility": scores["accessibility"],
                "best-practices": scores["best-practices"],
                "best-practices-adjusted": adj_bp,
                "seo": scores["seo"],
                "top-failing": top_failing,
            }

    return list(pages.values())


# ── Formatting helpers ────────────────────────────────────────────────────────

def _emoji(s: float) -> str:
    return "🟢" if s >= 90 else ("🟡" if s >= 50 else "🔴")


def _cell(score: float, cat_key: str, path: str, baseline: dict, show_delta: bool) -> str:
    s = _emoji(score) + f" {int(score)}"
    if show_delta:
        bl = baseline.get(path, {}).get(cat_key)
        if bl is not None:
            delta = score - bl
            if abs(delta) >= 1:
                s += f" ({delta:+.0f})"
    return s


def make_table(pages: list[dict], baseline: dict, show_delta: bool = False) -> str:
    sorted_pages = sorted(
        pages,
        key=lambda p: p["performance"] + p["accessibility"] + p["best-practices-adjusted"] + p["seo"],
    )
    rows = [
        "| Path | Perf | A11y | BP† | SEO | Top failing audits |",
        "|------|-----:|-----:|----:|----:|---------------------|",
    ]
    for p in sorted_pages:
        path = p["path"]
        failing_str = "; ".join(t for t, _, _ in p["top-failing"][:3]) or "—"
        rows.append(
            f"| `{path}` "
            f"| {_cell(p['performance'], 'performance', path, baseline, show_delta)} "
            f"| {_cell(p['accessibility'], 'accessibility', path, baseline, show_delta)} "
            f"| {_cell(p['best-practices-adjusted'], 'best-practices-adjusted', path, baseline, show_delta)} "
            f"| {_cell(p['seo'], 'seo', path, baseline, show_delta)} "
            f"| {failing_str} |"
        )
    rows.append("")
    rows.append(
        "† BP = best-practices **adjusted**: `third-party-cookies` and "
        "`inspector-issues` (Google Ads tag) excluded from score but still reported."
    )
    return "\n".join(rows)


def make_distribution(pages: list[dict]) -> str:
    cats = {
        "Perf": [p["performance"] for p in pages],
        "A11y": [p["accessibility"] for p in pages],
        "BP†":  [p["best-practices-adjusted"] for p in pages],
        "SEO":  [p["seo"] for p in pages],
    }
    rows = [
        "| Category | 100 | 90–99 | 50–89 | <50 |",
        "|----------|----:|------:|------:|----:|",
    ]
    for label, scores in cats.items():
        n100  = sum(1 for s in scores if s >= 100)
        n9099 = sum(1 for s in scores if 90 <= s < 100)
        n5089 = sum(1 for s in scores if 50 <= s < 90)
        nlt50 = sum(1 for s in scores if s < 50)
        rows.append(f"| {label} | {n100} | {n9099} | {n5089} | {nlt50} |")
    return "\n".join(rows)


def make_common_audits(pages: list[dict], top: int = 15) -> str:
    counts: dict[str, int] = {}
    for p in pages:
        for title, _, _ in p["top-failing"]:
            counts[title] = counts.get(title, 0) + 1
    if not counts:
        return ""
    rows = [
        "| Audit | Pages |",
        "|-------|------:|",
    ]
    for title, n in sorted(counts.items(), key=lambda x: -x[1])[:top]:
        rows.append(f"| {title} | {n} |")
    return "\n".join(rows)


# ── Baseline + regression logic ───────────────────────────────────────────────

def check_regressions(pages: list[dict], baseline: dict, changed: list[str]) -> list[str]:
    """Return list of regression messages for directly-changed pages."""
    issues: list[str] = []
    changed_set = set(changed)
    for p in pages:
        path = p["path"]
        if path not in changed_set:
            continue
        bl = baseline.get(path)
        if bl is None:
            continue  # No baseline entry → new page, not a failure
        for cat in ["performance", "accessibility", "seo"]:
            score = p[cat]
            bl_score = bl.get(cat)
            if bl_score is None:
                continue
            if score < bl_score - 5:
                issues.append(
                    f"`{path}` {cat}: {score:.0f} (was {bl_score:.0f}, Δ {score-bl_score:+.0f})"
                )
            elif cat in ("accessibility", "seo") and bl_score >= 100 and score < 100:
                issues.append(f"`{path}` {cat}: dropped from 100 → {score:.0f}")
        # Use adjusted BP for the gate
        bp = p["best-practices-adjusted"]
        bl_bp = bl.get("best-practices-adjusted", bl.get("best-practices"))
        if bl_bp is not None and bp < bl_bp - 5:
            issues.append(
                f"`{path}` best-practices†: {bp:.0f} (was {bl_bp:.0f}, Δ {bp-bl_bp:+.0f})"
            )
    return issues


def update_baseline(pages: list[dict], existing: dict) -> dict:
    updated = dict(existing)
    for p in pages:
        updated[p["path"]] = {
            "performance": p["performance"],
            "accessibility": p["accessibility"],
            "best-practices": p["best-practices"],
            "best-practices-adjusted": p["best-practices-adjusted"],
            "seo": p["seo"],
        }
    return dict(sorted(updated.items()))


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["pr", "all-pages"], required=True)
    ap.add_argument("--results-dir", default="lhci-results",
                    help="Root dir containing lhci-shard-* subdirs (all-pages mode)")
    ap.add_argument("--lhci-dir", default=".lighthouseci",
                    help="LHCI output dir (pr mode)")
    ap.add_argument("--baseline", default=".github/lighthouse-baseline.json")
    ap.add_argument("--output", default="report.md")
    ap.add_argument("--changed-pages", default="/",
                    help="Comma-separated list of URL paths changed by the PR")
    ap.add_argument("--update-baseline", action="store_true",
                    help="Write updated baseline.json after parsing results")
    args = ap.parse_args()

    baseline_path = pathlib.Path(args.baseline)
    baseline: dict = {}
    if baseline_path.exists():
        try:
            baseline = json.loads(baseline_path.read_text())
        except Exception as e:
            print(f"Warning: could not load baseline: {e}", file=sys.stderr)

    # ── PR mode ──────────────────────────────────────────────────────────────
    if args.mode == "pr":
        pages = parse_results(pathlib.Path(args.lhci_dir))
        if not pages:
            print("::warning::No LHCI results found; skipping gate.", file=sys.stderr)
            gho = os.environ.get("GITHUB_OUTPUT", "")
            if gho:
                with open(gho, "a") as f:
                    f.write("passed=true\ncomment=No Lighthouse results found.\n")
            sys.exit(0)

        changed = [p.strip() for p in args.changed_pages.split(",") if p.strip()]
        regressions = check_regressions(pages, baseline, changed)

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        audited_paths = ", ".join(f"`{p['path']}`" for p in sorted(pages, key=lambda x: x["path"]))
        comment_parts = [
            "<!-- lighthouse-report -->",
            f"### 🔦 Lighthouse — {now}",
            "",
            f"Audited {len(pages)} page(s): {audited_paths}",
            "",
            make_table(pages, baseline, show_delta=True),
        ]
        if regressions:
            comment_parts += [
                "",
                "### ❌ Regressions detected",
                "",
            ] + [f"- {r}" for r in regressions]
        else:
            comment_parts += ["", "### ✅ No regressions vs baseline"]

        if not baseline:
            comment_parts += [
                "",
                "> ℹ️ No baseline on file yet. Run the **all-pages** workflow "
                "dispatch on this branch to seed it.",
            ]

        comment = "\n".join(comment_parts)

        # Update baseline for any newly audited pages
        new_baseline = update_baseline(pages, baseline)
        if new_baseline != baseline:
            baseline_path.parent.mkdir(parents=True, exist_ok=True)
            baseline_path.write_text(json.dumps(new_baseline, indent=2) + "\n")

        gho = os.environ.get("GITHUB_OUTPUT", "")
        if gho:
            with open(gho, "a") as f:
                f.write("comment<<GHEOF\n")
                f.write(comment + "\n")
                f.write("GHEOF\n")
                f.write(f"passed={'false' if regressions else 'true'}\n")
        else:
            print(comment)

        if regressions:
            print(f"\n{len(regressions)} regression(s) found:", file=sys.stderr)
            for r in regressions:
                print(f"  {r}", file=sys.stderr)
            sys.exit(1)

    # ── All-pages mode ────────────────────────────────────────────────────────
    elif args.mode == "all-pages":
        pages = parse_results(pathlib.Path(args.results_dir))
        if not pages:
            print("::error::No LHCI results found in results dir.", file=sys.stderr)
            sys.exit(1)

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        n = len(pages)

        parts = [
            "# Lighthouse All-Pages Baseline Report",
            "",
            f"Run: {now}  ·  **{n} pages** audited  ·  "
            "[beta.ontargetaba.com](https://beta.ontargetaba.com)",
            "",
            "## Score Distribution",
            "",
            make_distribution(pages),
            "",
            "## Per-Page Scores (worst first)",
            "",
            make_table(pages, baseline, show_delta=bool(baseline)),
            "",
        ]

        common = make_common_audits(pages)
        if common:
            parts += ["## Most Common Failing Audits (top 15)", "", common, ""]

        # Top 10 worst pages (by sum of scores)
        worst = sorted(
            pages,
            key=lambda p: p["performance"] + p["accessibility"]
            + p["best-practices-adjusted"] + p["seo"],
        )[:10]
        worst_rows = [
            "## 10 Worst Pages",
            "",
            "| Path | Perf | A11y | BP† | SEO | Sum |",
            "|------|-----:|-----:|----:|----:|----:|",
        ]
        for p in worst:
            total = p["performance"] + p["accessibility"] + p["best-practices-adjusted"] + p["seo"]
            worst_rows.append(
                f"| `{p['path']}` | {p['performance']:.0f} | {p['accessibility']:.0f} "
                f"| {p['best-practices-adjusted']:.0f} | {p['seo']:.0f} | **{total:.0f}** |"
            )
        parts += worst_rows

        report = "\n".join(parts)

        out = pathlib.Path(args.output)
        out.write_text(report)
        print(f"Report written to {out}  ({n} pages)")

        if args.update_baseline:
            new_baseline = update_baseline(pages, baseline)
            baseline_path.parent.mkdir(parents=True, exist_ok=True)
            baseline_path.write_text(json.dumps(new_baseline, indent=2) + "\n")
            print(f"Baseline updated → {baseline_path}  ({len(new_baseline)} entries)")


if __name__ == "__main__":
    main()
