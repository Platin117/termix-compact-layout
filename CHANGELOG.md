# Changelog

## 1.4.0

### Changed

- Rounding is applied structurally rather than from a list of known class names: anything with a full border or a card or popover surface that has no radius of its own now follows the theme. This also reaches dialogs and forms belonging to other plugins, which the previous rule missed.

## 1.3.0

### Changed

- Toggles are round. Their track and knob carry no rounding class at all, so the previous rule never saw them; they are reached through `role="switch"`, which is semantics rather than styling and therefore survives a restyle.

## 1.2.0

### Changed

- Rounding now covers everything in the layout rather than only buttons and inputs: panels, menus, dialogs, search fields, segmented bars, sliders and the plugin cards. The tooltip arrow is excluded, being a square rotated 45 degrees that rounding would turn into a blob.

## 1.1.0

### Changed

- Buttons, inputs and selects follow the theme's radius. Termix's UI kit writes `rounded-none` in 42 places and never reads the `--radius` token, so the themes alone had no effect.

## 1.0.0

### Added

- The two themes, Termius Dark and Termius Light, now ship inside this plugin. One package instead of two.
- `--radius` is set to 0.75rem.

### Changed

- Anyone running the separate "Termius Look" theme plugin should uninstall it before installing this one: both carry the same theme ids.

## 0.9.0

### Changed

- Plugins sits above the account entry in the rail.

### Removed

- The docked command history from 0.8.0. It was not what had been asked for — a minimap of the terminal contents — and that cannot be built as a plugin: the terminal's side panel slot receives only the host, never the buffer.

## 0.8.0

### Added

- The command history can be docked beside the terminal, switched on in the layout's settings.

### Changed

- Plugins moved to the bottom of the rail, between the account and the settings.

## 0.7.0

### Fixed

- The CPU, memory and disk labels in the terminal toolbar no longer run under the bars. Host Metrics gives them a fixed 48px with no truncation, which fits "Memory" and not "Arbeitsspeicher"; this rule lets them size themselves. A patch on someone else's markup, not a fix — that belongs upstream.

## 0.6.0

### Added

- A Snippets button in the terminal's bottom toolbar, replacing the companion button at the right edge.

### Changed

- The active session tab stands out: a lighter fill instead of a darker one, with an accent ring.

## 0.5.0

### Changed

- Closing a session tab lands on the next session, and on the home screen when it was the last one.
- Host cards, session tabs and the sidebar settings are rounded.

## 0.4.0

### Added

- Settings, Sidebar: which entries the rail shows and in which order, with arrows to move them and a reset button.

## 0.3.0

### Changed

- The rail scrolls instead of making the window taller.
- Core's own panels are no longer listed: Hosts, Credentials and Connections render blank outside the sidebar, and the first two are the rail's top two entries anyway.

### Fixed

- Connect opens a new session every time instead of jumping to the open one.

## 0.2.0

### Changed

- The tab bar shows open connections only. Pages live in the rail, so an open settings page no longer costs a tab and does not have to be closed by hand.
- Hosts, Manage, the account and Settings moved into the rail.
- Search and the account menu left the tab bar.

### Added

- Panels without a tab type of their own, Snippets among them, open in a panel tab.

## 0.1.0

### Added

- First version: rail on the left, sessions set apart in the tab bar, no right edge rail.
