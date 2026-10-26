# Channel sidebar collapse toggle

| | |
|---|---|
| **Date** | 2026-10-26 00:45:10 -0300 (ADT) |
| **Repository** | [fernandeslder/Legcord](https://github.com/fernandeslder/Legcord) (personal fork of [Legcord/Legcord](https://github.com/Legcord/Legcord)) |
| **Branch** | `dev` |
| **Commit** | `96c5914` — full: `96c59146d6b497057455ba57a15b92b431fb9419` |
| **Base commit** | `a5f0a9c` (`metainfo: add entry for v1.3.1`) |
| **Scope** | Fork-only feature, not upstreamed |

## Summary

Legcord had no way to collapse the Discord channel sidebar. This change adds a
toggle button to the server rail that collapses the channel sidebar into the
rail and expands it back, giving the chat area the reclaimed width (375px →
72px on a 2560x1402 window).

The button is styled like a native Discord rail item (48px circle, brand hover
state, chevron icon that flips with the state) and sits in the empty space at
the bottom of the server rail, above the user panel.

## Behavior

- **Collapse**: hides the channel list and the sidebar resize handle, and shrinks
  the sidebar container to the server rail width. The server rail stays visible,
  so servers remain reachable and the toggle stays in the same place.
- **Expand**: restores the previous Discord sidebar width (Discord's own layout
  state is untouched — only our override is removed).
- **Persistence**: the state is stored in the `sidebarCollapsed` setting and
  restored on the next launch.
- **Resilience**: the sidebar elements are resolved structurally (server rail →
  nearest ancestor that also contains the channel list) rather than by hashed
  Discord class names, and state is re-applied by a rAF-throttled
  `MutationObserver`, so React re-renders, server switches and SPA navigation to
  Discord settings do not lose it.
- **Accessibility**: the button is a real `<button>` with `aria-label`,
  `aria-expanded`, a `title` tooltip that updates with the state, and a visible
  focus ring.

## Files changed

| File | Change |
|---|---|
| `src/discord/preload/sidebarCollapse.mts` | **New.** Resolves the sidebar, injects the toggle button, applies/restores the collapsed state, persists it via `setConfig` IPC. |
| `assets/app/css/sidebarCollapse.css` | **New.** Collapsed-state rules and Discord-styled toggle button. |
| `src/discord/preload/preload.mts` | Imports the new preload module. |
| `src/@types/settings.d.ts` | Adds `sidebarCollapsed: boolean` to `Settings`. |
| `src/common/config.ts` | Adds `sidebarCollapsed: false` to the config defaults (auto-migrated into existing `settings.json` files). |

## Verification

Verified against the packaged build on CachyOS (Arch), Wayland session:

- Toggle click: sidebar 375px → 72px, channel list `display: none`, chat area
  2185px → 2488px; clicking again restores all three.
- Toggle works both in the Direct Messages view (`/channels/@me`) and in a
  guild view (`/channels/<guild>/<channel>`).
- `aria-label` / `aria-expanded` / `title` update between
  "Collapse channel sidebar" and "Expand channel sidebar".
- `storage/settings.json` records `"sidebarCollapsed": true|false`, and a
  restart restores the collapsed state on startup.
- `biome check` passes on the touched files.

## Build and install (Arch/CachyOS)

```sh
cd /home/lderfernandes/my-custom-projects/legcord
pnpm install
pnpm run build
pnpm exec electron-builder --linux pacman
cp dist/Legcord-1.3.1-linux-x64.pacman dist/Legcord-1.3.1-1-x86_64.pkg.tar.xz
sudo pacman -U dist/Legcord-1.3.1-1-x86_64.pkg.tar.xz
```
