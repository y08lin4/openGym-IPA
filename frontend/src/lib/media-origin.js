// Where the catalogue's exercise media are served from right now (openGym-lite).
//
// Upstream reads the build-time VITE_IMG_BASE/VITE_GIF_BASE once, when exercises.js loads,
// which is the right model when the media sit next to the app or on a CDN the build itself
// already names. A lite fork pairs with a server instead: while a pairing is in place the
// images of THAT server are wanted, and the build's own defaults the moment it is gone.
// exercises.js asks this module on every call; api.js tells it what the pairing says
// (setMediaOrigin), so pairing, unpairing and a boot that restores a saved pairing need no
// other hook. This module imports nothing — exercises.js and api.js both reach it, and any
// import back towards them would be a cycle.
export const MEDIA_CACHE = 'opengym-media-v1'

let current = ''

export const mediaOrigin = () => current

/**
 * Point every exercise-media base at the server the given origin names (a trailing slash is
 * dropped); '' or anything falsy returns the bases to the build defaults. When the base
 * changes and this session had a server before it, the worker's media cache is dropped: that
 * copy belongs to a different server (or to none anymore) and is not worth sitting on while
 * a new one answers. The first set, and a set to the same origin again (a token renewal),
 * change nothing and clear nothing. The cache name is public/sw.js's MEDIA — spelled out
 * because the worker is not bundled and importing lib/media-prefetch.js here would run into
 * exercises.js, which imports this file; sw-media.test.js pins the spellings together. A
 * place without a Cache API (plain Node, a test) skips only the drop.
 */
export function setMediaOrigin(origin) {
  const next = String(origin || '').replace(/\/+$/, '')
  if (next === current) return
  const had = current
  current = next
  if (!had) return
  try {
    const gone = caches.delete(MEDIA_CACHE)
    if (gone && typeof gone.catch === 'function') gone.catch(() => {})
  } catch { /* no Cache API here */ }
}

/** The still-image base: the paired server's while one is set, else the build default. */
export const imgBase = fallback => current ? current + '/exercise-media/still/' : fallback

/** The animation base, same rule. */
export const gifBase = fallback => current ? current + '/exercise-media/clip/' : fallback
