# Obsidian Running Log

A running-focused Obsidian plugin. Your runs and walks sync in automatically and render as rich visualizations inline in your notes — a monthly summary, an activity log, weekly/monthly mileage, pace trends, a contribution-style heatmap, streaks, and full per-run detail with splits, heart-rate and pace curves, and route maps.

Not a generic health dashboard. Opinionated for runners.

> Status: in development. See the roadmap below.

## Why

If you track runs with an Apple Watch and think in Obsidian, your training and your notes live in two different worlds. Running Log bridges them with a hands-off pipeline: finish a run, and minutes later it's in your vault and your dashboards — no exporting, no fiddling. Your data stays in your vault as plain JSON.

## How it works

Running Log reads `.fit` workout files from a folder in your vault and indexes them. Both runs and walks are imported. The frictionless way to fill that folder is RunGap's automatic export:

1. **Apple Watch → Apple Health** — happens automatically.
2. **RunGap** (iOS, paid upgrade) — connect Apple Health, and set up **Auto Sharing** to export each new activity as a **FIT** file to a cloud folder (Dropbox or iCloud Drive). Turn off "Ask before sharing" and enable Background Refresh so it runs unattended.
3. **Cloud sync → vault** — sync that cloud folder down to `<vault>/running-log/inbox/` on your computer.
4. **Running Log** watches that folder and imports new activities automatically. Processed files move to `inbox/processed/`.

Then drop a code block into any note:

````markdown
```running-log
type: summary
```
````

The plugin keeps a small `index.json` of activity summaries (so charts and the log are instant) plus one detail file per activity (loaded only when you open its detail view).

## Visualizations

All render as `running-log` code blocks. Every block accepts an optional `title:` to set its heading, or `title: ""` to hide it. Each view has a sensible default title.

### Monthly summary

Three at-a-glance totals — total distance, run distance, and walk distance. Defaults to the current month; pass `month: 2026-05` for a specific one, or `from:`/`to:` for a custom range.

````markdown
```running-log
type: summary
```
````

### Activity log

A clean data list — one row per activity, with date, type (Run/Walk), distance, time, pace, and average heart rate. Walk rows are subtly shaded. Defaults to the current month; pass `month: 2026-05`, a `last: N` count, or a `from:`/`to:` range.

````markdown
```running-log
type: gallery
sort: date
```
````

### Run detail

Splits, HR and pace curves, and a route map for a single run.

````markdown
```running-log
type: run-detail
date: 2026-05-20
panels: summary, splits, pace, hr, route
```
````

### Weekly / monthly mileage

Bar charts with an optional goal line.

````markdown
```running-log
type: weekly-mileage
last: 16
goal: 30
```
````

### Pace trend

Average pace over time, with optional smoothing and a trend line.

````markdown
```running-log
type: pace-trend
last: 180
smoothing: 5
trendline: true
```
````

### Calendar heatmap

A GitHub-style grid of your year, shaded by distance.

````markdown
```running-log
type: heatmap
year: 2026
```
````

### Streak tracker

Current and longest run streak, by day or week.

````markdown
```running-log
type: streak
unit: day
```
````

## Settings

| Setting | Default | What it does |
|---|---|---|
| Index folder | `running-log` | Where the index and detail files live. |
| Inbox folder | `running-log/inbox` | Watched folder where synced `.fit` files land. |
| Auto-import | on | Import new files automatically as they arrive. |
| Display unit | `mi` | Miles or kilometres (per-block `unit:` overrides). |
| Week starts on | Monday | Affects weekly buckets and streaks. |
| Default goal | — | Default goal line for mileage charts. |
| Minimum run distance | 0 | Ignore activities shorter than this. |

## Syntax reference

Common keys (all types): `type` (required), `title` (set a heading, or `""` to hide), `unit`.

| type | key params |
|---|---|
| `summary` | `month` (`YYYY-MM`) or `from`/`to`; defaults to current month |
| `gallery` | `month` (`YYYY-MM`), `last` (count), or `from`/`to`; `sort` (date/distance/pace/duration); defaults to current month |
| `run-detail` | `date`, `nth`, `id`, `latest`, `panels`, `smoothing` |
| `weekly-mileage` / `monthly-mileage` | `last`, `goal`, `showRunCount` |
| `pace-trend` | `last` (days), `metric` (pace/speed), `smoothing`, `minDistance`, `trendline` |
| `heatmap` | `year` or `last` (days), `metric`, `levels` |
| `streak` | `unit` (day/week), `min`, `showLongest` |

`run-detail` panels: `summary`, `splits`, `pace`, `hr`, `cadence`, `power`, `elevation`, `route`.

## Installation

Manual install: download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/marshalloffutt/obsidian-running-log/releases) into `<vault>/.obsidian/plugins/running-log/`, then enable it under Community plugins.

## Data & privacy

Everything stays on your machine. The plugin reads `.fit` files from a vault folder and writes plain JSON into your vault — no network requests. Distances and durations are stored in canonical metric units and converted for display, so switching units never corrupts your data.

## Roadmap

**v2 (current target):** automatic FIT import of runs and walks, monthly summary, activity log, per-run detail (splits, HR/pace curves, route map), mileage/pace/heatmap/streak charts, settings.

**v2.1:** aerobic-efficiency analysis (HR vs pace), gallery route thumbnails, card deep-links.

**v3:** running-form trends (cadence, vertical oscillation, ground contact, power), year-over-year, personal records, optional tiled basemap, write-run-to-daily-note.

## Development

```bash
npm install
npm run dev      # esbuild watch → main.js
npm run build    # type-check + production bundle
```

Point the build at a test vault's `.obsidian/plugins/running-log/` and toggle the plugin to reload. The FIT importer and aggregation logic are pure TypeScript with no Obsidian dependency, so they're unit-tested in plain Node.

## License

MIT
