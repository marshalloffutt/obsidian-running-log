# Obsidian Running Log

A running-focused Obsidian plugin. Import your Apple Health workouts and drop runner's visualizations — weekly mileage, pace trends, a contribution-style mileage heatmap, and streaks — straight into your notes as simple code blocks.

Not a generic health dashboard. Opinionated for runners: mileage, pace, streaks, heatmaps.

> Status: in development. See the roadmap below.

## Why

If you track runs with an Apple Watch and think in Obsidian, your training data and your notes live in two different worlds. Existing health plugins cover dozens of generic metrics; none are built for runners. Running Log is laser-focused on what runners actually look at, and it keeps your data in your vault as plain JSON — nothing proprietary, nothing in the cloud.

## How it works

1. On your iPhone: **Health app → profile → Export All Health Data**. You'll get a `export.zip`.
2. Unzip it and copy `export.xml` into a folder in your vault (default: `running-log/`).
3. In Obsidian, run the command **Running Log: Import Apple Health runs**.
4. Add a code block to any note:

````markdown
```running-log
type: weekly-mileage
last: 12
goal: 25
```
````

The plugin parses only your running workouts into a small `running-log/runs.json` index, then renders from that — so your notes stay fast even if your Health export is gigabytes.

## Visualizations

All five render as `running-log` code blocks.

### Weekly / monthly mileage

Bar chart of distance per week or month, with an optional goal line.

````markdown
```running-log
type: weekly-mileage
last: 16
goal: 30
showRunCount: true
```
````

````markdown
```running-log
type: monthly-mileage
last: 12
goal: 120
```
````

### Pace trend

Average pace over time — are you getting faster? Optional moving-average smoothing and a best-fit trend line. (For pace, faster is up.)

````markdown
```running-log
type: pace-trend
last: 180
metric: pace
smoothing: 5
trendline: true
```
````

### Calendar heatmap

A GitHub-contribution-style grid of your year, with each day shaded by distance run.

````markdown
```running-log
type: heatmap
year: 2026
metric: distance
```
````

### Streak tracker

Current and longest run streak, by day or by week.

````markdown
```running-log
type: streak
unit: day
min: 1
```
````

See the [full syntax reference](#syntax-reference) for every parameter.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Index folder | `running-log` | Where `export.xml` lives and `runs.json` is written. |
| Export file name | `export.xml` | Name of the Apple Health export to read. |
| Display unit | `mi` | Miles or kilometres. Per-block `unit:` overrides this. |
| Week starts on | Monday | Affects weekly buckets and streaks. |
| Default goal | — | Default goal line for mileage charts. |
| Minimum run distance | 0 | Ignore runs shorter than this (filters noise). |

## Syntax reference

Common keys (all types): `type` (required), `title`, `unit` (`mi`/`km`), `from`/`to` (`YYYY-MM-DD`), `last` (N periods).

| type | key params |
|---|---|
| `weekly-mileage` | `last`, `goal`, `showRunCount` |
| `monthly-mileage` | `last`, `goal`, `showRunCount` |
| `pace-trend` | `last` (days), `metric` (`pace`/`speed`), `smoothing`, `minDistance`, `trendline` |
| `heatmap` | `year` or `last` (days), `metric` (`distance`/`duration`/`count`), `levels` |
| `streak` | `unit` (`day`/`week`), `min`, `showLongest` |

## Installation

> Once published, install from **Settings → Community plugins → Browse → "Running Log."**

Manual install (until then): download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/marshalloffutt/obsidian-running-log/releases) into `<vault>/.obsidian/plugins/running-log/`, then enable it under Community plugins.

## Data & privacy

Everything stays on your machine. The plugin reads your local `export.xml`, writes a local `runs.json` in your vault, and never makes a network request. Distances and durations are stored in canonical metric units (meters/seconds) and converted for display, so switching between miles and kilometres never corrupts your data.

## Platform support

Desktop only. The importer streams a potentially multi-gigabyte XML file using Node file APIs that aren't available on Obsidian mobile. Rendering itself is lightweight, but import has to run on desktop.

## Roadmap

**v1 (current target):** Apple Health import, all five visualizations, theme-aware rendering, settings, graceful empty/error states.

**v1.1:** Health.md JSON import as an alternate source; personal-records card; optional "write run summary to daily note."

**v2:** Per-run splits, heart-rate zone distribution, year-over-year comparison, expanded personal-records trends.

## Development

```bash
npm install
npm run dev      # esbuild watch → main.js
npm run build    # type-check + production bundle
```

Point the build at a test vault's `.obsidian/plugins/running-log/` and toggle the plugin in Obsidian to reload. The parser and aggregation logic are pure TypeScript with no Obsidian dependency, so they're unit-tested in plain Node.

## Contributing

Issues and PRs welcome. The plugin is intentionally opinionated toward running — feature requests that push it toward a generic fitness tracker may be declined to keep it focused.

## License

MIT
