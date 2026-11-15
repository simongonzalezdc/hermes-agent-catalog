/**
 * Reload the dashboard into the management scope a saved pick targeted.
 *
 * A plain `window.location.reload()` replays the current URL, and under the
 * dashboard's own scope (`profile === ""`) that URL is deliberately
 * profile-less (`ProfileProvider` keeps it that way). A profile-less reload
 * then resolves through `initialProfileScope()`, which prefers the server's
 * `--open-profile` preselection (`__HERMES_INITIAL_PROFILE__`) — so a model
 * saved while managing the dashboard's own profile reloads into the
 * preselected one and looks like it never landed (#146342).
 *
 * An explicit `?profile=` — empty value included — wins over that bootstrap
 * (`initialProfileScope` distinguishes an absent param from an empty one), so
 * pin the exact scope the write targeted before reloading.
 */
export function reloadInManagedScope(profile: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set("profile", profile);
  window.location.assign(url.toString());
}
