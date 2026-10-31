Compact Layout is a fork of [Simple Layout](https://github.com/Termix-SSH/Plugin-Simple-Layout) with a different shell, plus two themes. The host editor, the host and credential lists and the settings pages are Simple Layout's, unchanged.

## What is different

- **The tab bar holds sessions only.** Pages live in the rail, so opening Settings costs no tab and needs no closing. Closing a session lands on the next one, or on Home when it was the last.
- **A rail on the left.** Every destination that can open, plugin panels included. Simple Layout filtered those out, which is why Snippets had nowhere to appear.
- **You arrange the rail yourself.** Settings, Sidebar: switch entries off and move them with the arrows. Stored in Termix's own rail preferences, so the choice follows you to other layouts.
- **Sessions look like sessions.** Status dot, monospace, a close cross, and the strip scrolls with the mouse wheel.
- **A Snippets button** in the terminal's bottom toolbar.
- **No right edge rail.** Simple Layout renders `shell.rightEdge`; this one does not, because those icons repeat what the rail offers.

## The themes

Termius Dark and Termius Light: a desaturated blue-grey shell with an azure accent, the rail a step darker than the content, the terminal the darkest surface on screen. Pick one under Settings, Appearance. Accent colour, interface font, font size and density are separate settings and apply on top.

Both themes also set `--radius`, and the layout makes Termix's own components follow it, so cards, dialogs and buttons share one radius instead of mixing rounded and square.

## Tweaking

Each theme is one CSS file in `themes/`, scoped under its own class. Change a value, run `npm run validate` and `npm test`, then install it again. A theme may only hold rules whose selectors start with the theme's class, inside `@media` or `@supports` at most; `@import`, other at-rules and `url()` to another host are refused by the server.

## Credits

Forked from Plugin-Simple-Layout, Apache-2.0, by the Termix project.
