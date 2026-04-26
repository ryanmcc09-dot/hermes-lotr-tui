# hermes-lotr-tui

A **Lord of the Rings** themed dashboard plugin for [Hermes Agent](https://github.com/.../hermes-agent) — "One Dashboard to Rule Them All."

## What It Does

Transforms the Hermes dashboard into a Middle-earth Command Center with:

- **The One Ring** crest in the header with pulsing gold animation
- **Eye of Sauron** banner that blinks and watches over your agents
- **Palantír** crystal ball showing live gateway status — click to gaze into the full detail view
- **Fellowship Status** sidebar panel showing all 5 agents (Hermes, Ezra, Abnett, Ed, Robin) with live-inferred activity
- **Quest Log** of active cron jobs (agent pipelines)
- **Dispatches** showing recent sessions
- **Rotating Tolkien quotes** in the footer
- **Middle-earth map backdrop** with dark vignette overlay
- **Full Palantír Tab** with deep telemetry: Gateway status, Fellowship breakdown, Quest Log, Active Conduits, Realm Ledger (7-day analytics), and Skill Mastery bar chart

## Live Data Sources

The plugin pulls real-time data from the Hermes Plugin SDK:

| API | Used For |
|---|---|
| `api.getStatus()` | Gateway online/offline, version, PID, active sessions |
| `api.getCronJobs()` | Quest Log — all cron jobs with schedule and status |
| `api.getSessions()` | Active Conduits — recent sessions with live/closed badges |
| `api.getAnalytics(7)` | Realm Ledger + Skill Mastery chart |

## Installation

1. Copy this repo to your Hermes plugins directory:
   ```bash
   cp -r hermes-lotr-tui ~/.hermes/plugins/
   ```

2. Restart the Hermes dashboard server:
   ```bash
   hermes dashboard
   ```

3. Select **Middle-earth** from the theme dropdown.

## Plugin Architecture

```
hermes-lotr-tui/
├── plugin.yaml              # Plugin metadata
├── dashboard/
│   ├── manifest.json        # Slot registrations + tab definition
│   └── dist/
│       └── index.js         # Full plugin bundle (React + vanilla JS)
```

### Registered Slots

| Slot | Component |
|---|---|
| `header-left` | Ring Crest + "MIDDLE-EARTH / Command Center" |
| `header-right` | Palantír globe with live session count |
| `header-banner` | Eye of Sauron pulsing line |
| `sidebar` | Fellowship Status + Quest Log + Dispatches |
| `post-main` | Rotating Tolkien quote |
| `backdrop` | Middle-earth map (5% opacity) |
| `overlay` | Darkness vignette |
| Tab `/lotr-theme` | Full Palantír Detail View |

## Tech Stack

- **No build step** — plain IIFE using React + hooks from the Hermes Plugin SDK
- **Vanilla JS modal** option (body-mounted, z-index 99999) for escaping React container constraints
- **CSS keyframe animations** injected at runtime
- **Hermes Plugin SDK v1** — `window.__HERMES_PLUGIN_SDK__` + `window.__HERMES_PLUGINS__`

## License

MIT — feel free to fork and build your own realm.

---

*“All we have to decide is what to do with the time that is given us.”* — Gandalf
