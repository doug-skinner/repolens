# repolens

A focused TUI dashboard for your GitHub repository. See pull requests, issues, actions, milestones, and releases at a glance — without leaving the terminal.

![Dashboard view](docs/screenshots/dashboard.png)

## Features

- **Dashboard overview** — PR, issue, actions, milestone, and release summaries in a single view
- **Dedicated list views** — drill into PRs, issues, Actions runs, milestones, or releases
- **Detail panes** — expand any item inline to see full context
- **Keyboard-driven** — vim-style navigation (`j`/`k`, `gg`/`G`), tab between views, number keys to jump
- **Auto-refresh** — data refreshes automatically in the background
- **Review requests** — see how many reviews are waiting for you
- **Open in browser** — press `o` to jump straight to the item on GitHub
- **Copy URLs** — `y` copies the item URL, `Y` copies the branch ref

### More screenshots

![Issue detail view](docs/screenshots/issue-detail.png)

![Milestone view](docs/screenshots/milestone-view.png)

## Installation

### Homebrew

```sh
brew install doug-skinner/repolens/repolens
```

### Build from source

Requires [Bun](https://bun.sh) v1.1+.

```sh
git clone https://github.com/doug-skinner/repolens.git
cd repolens
bun install
bun run build
```

This produces a standalone `repolens` binary. Move it somewhere on your `PATH`:

```sh
sudo cp repolens /usr/local/bin/
```

## Requirements

- [GitHub CLI](https://cli.github.com) (`gh`) installed and authenticated — run `gh auth login` if you haven't already

## Usage

Run `repolens` from any directory inside a Git repository with a GitHub remote:

```sh
repolens
```

## Configuration

repolens is configured via a JSON file. No config file is required — all options have sensible defaults.

### Config file location

repolens checks for a config file in this order:

1. `$XDG_CONFIG_HOME/repolens/config.json` (defaults to `~/.config/repolens/config.json`)
2. `~/.repolens.json`

If neither file exists, all defaults are used. If the file contains invalid JSON, a warning is printed to stderr and defaults are used.

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `staleDays` | `number` | `14` | Days before items are visually dimmed |
| `refreshInterval` | `number` | `30` | Auto-refresh interval in seconds. `0` disables auto-refresh |
| `milestoneSort` | `string` | `"version"` | Default sort for milestones: `"version"`, `"due"`, `"progress"`, or `"title"` |
| `columns` | `object` | all visible | Column visibility per view (see below) |
| `dashboard` | `object` | all sections | Dashboard section order and visibility (see below) |
| `theme` | `object` | dark preset | Color theme configuration (see below) |

Only include the options you want to change — missing keys fall back to defaults.

### Column visibility

Each view has a set of columns that can be toggled on or off. Set a column to `false` to hide it. Hidden columns' width is redistributed to the flexible column (usually `title`).

**Safety rails:** Some columns are always visible regardless of config — `title` in most views, `status` + `title` in Actions, and `tag` in Releases.

#### Pull Requests (`columns.prs`)

| Column | Default | Description |
| --- | --- | --- |
| `number` | `true` | PR number |
| `title` | `true` | PR title (always visible) |
| `author` | `true` | Author login |
| `branch` | `true` | Head branch name |
| `checks` | `true` | CI status badge |
| `review` | `true` | Review decision badge |
| `size` | `true` | Diff size indicator (S/M/L/XL) |
| `time` | `true` | Relative created time |

#### Issues (`columns.issues`)

| Column | Default | Description |
| --- | --- | --- |
| `number` | `true` | Issue number |
| `title` | `true` | Issue title (always visible) |
| `author` | `true` | Author login |
| `labels` | `true` | Label names |
| `time` | `true` | Relative created time |

#### Actions (`columns.actions`)

| Column | Default | Description |
| --- | --- | --- |
| `status` | `true` | Status symbol (always visible) |
| `workflow` | `true` | Workflow name |
| `title` | `true` | Run title (always visible) |
| `branch` | `true` | Head branch name |
| `time` | `true` | Relative created time |

#### Milestones (`columns.milestones`)

| Column | Default | Description |
| --- | --- | --- |
| `title` | `true` | Milestone title (always visible) |
| `due` | `true` | Due date |
| `progress` | `true` | Progress bar with count |
| `percent` | `true` | Completion percentage |

#### Releases (`columns.releases`)

| Column | Default | Description |
| --- | --- | --- |
| `status` | `true` | Status symbol (latest/pre-release/draft) |
| `tag` | `true` | Release tag (always visible) |
| `detail` | `true` | Release name or first line of body |
| `author` | `true` | Author login |
| `downloads` | `true` | Download count |
| `time` | `true` | Relative published time |

### Dashboard sections

The `dashboard.sections` array controls which sections appear on the dashboard and in what order. Omit a section to hide it.

```json
{
  "dashboard": {
    "sections": ["prs", "issues", "actions", "milestones", "releases"]
  }
}
```

Valid section names: `prs`, `issues`, `actions`, `milestones`, `releases`.

### Theme

Choose a preset and optionally override individual colors.

```json
{
  "theme": {
    "preset": "dark",
    "overrides": {}
  }
}
```

**Presets:** `"dark"` (default) or `"light"`.

**Color roles** available in `overrides`:

| Role | Dark default | Light default | Used for |
| --- | --- | --- | --- |
| `accent` | `cyan` | `blue` | Headers, borders, selection cursor |
| `success` | `green` | `green` | Passed checks, approved reviews, merge |
| `error` | `red` | `red` | Failed checks, requested changes |
| `warning` | `yellow` | `#b58900` | Pending status, labels, confirmations |
| `info` | `magenta` | `magenta` | Review requests, release tags |
| `branch` | `cyan` | `blue` | Branch names |
| `muted` | `gray` | `gray` | Inactive/cancelled items |

Values can be any color name supported by your terminal or a hex code (e.g. `"#ff5733"`).

### Example config

```json
{
  "refreshInterval": 60,
  "staleDays": 7,
  "milestoneSort": "due",
  "columns": {
    "prs": {
      "size": false,
      "branch": false
    }
  },
  "dashboard": {
    "sections": ["prs", "actions", "releases"]
  },
  "theme": {
    "preset": "light"
  }
}
```

### Environment variables

| Variable | Description |
| --- | --- |
| `REPOLENS_STALE_DAYS` | Overrides `staleDays` from the config file |

## Keybindings

### Global

| Key         | Action             |
| ----------- | ------------------ |
| `?`         | Toggle help screen |
| `q`         | Quit               |
| `r`         | Refresh all data   |
| `Tab`       | Next view          |
| `Shift+Tab` | Previous view      |
| `1`–`6`     | Jump to view       |

### List views

| Key                | Action                |
| ------------------ | --------------------- |
| `↑`/`↓` or `j`/`k` | Navigate items        |
| `gg` / `G`         | Jump to top / bottom  |
| `Enter` / `d`      | Toggle detail pane    |
| `o`                | Open in browser       |
| `y`                | Copy URL to clipboard |
| `Y`                | Copy branch/tag ref   |

## License

[MIT](LICENSE)
