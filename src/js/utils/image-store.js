// Offloads base64 images from localStorage to IndexedDB.
//
// Images in note HTML are replaced with antask-img://id references before
// being written to localStorage. The actual pixel data lives in IndexedDB,
// which has a ~250 MB limit (vs ~5 MB for localStorage).
//
// Flow:
//   startup  → preloadAll()            populate in-memory cache from IDB
//   open note → resolveImages(html)    replace antask-img://id with data: URLs
//   save note → extractImages(html)    extract data: URLs → IDB, return clean html
//   export   → resolveImages(html)     restore base64 so export is self-contained

const DB_NAME    = "antask-images";
const STORE_NAME = "images";
const SCHEME     = "antask-img://";

let _db      = null;
let _ready   = false;

// id → base64 data URL
const _cache   = new Map();
// base64 data URL → id  (for deduplication across notes)
const _reverse = new Map();

function _openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = function (e) {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
    req.onerror   = function (e) { reject(e.target.error); };
  });
}

function _makeId() {
  return "img-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

/**
 * Load all stored images into the in-memory cache.
 * Must complete before resolveImages() can work correctly.
 * Safe to call multiple times (idempotent).
 */
export function preloadAll() {
  return _openDB().then(function (db) {
    return new Promise(function (resolve) {
      var tx  = db.transaction(STORE_NAME, "readonly");
      var req = tx.objectStore(STORE_NAME).openCursor();
      req.onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
          if (!_cache.has(cursor.key)) {
            _cache.set(cursor.key, cursor.value);
            _reverse.set(cursor.value, cursor.key);
          }
          cursor.continue();
        }
      };
      tx.oncomplete = function () { _ready = true; resolve(); };
      tx.onerror    = function () { _ready = true; resolve(); };
    });
  }).catch(function () { _ready = true; });
}

/**
 * Synchronous — replace antask-img://id refs with their base64 data URLs.
 * Works after preloadAll() has resolved.
 */
export function resolveImages(html) {
  if (!html || !html.includes(SCHEME)) return html;
  return html.replace(/antask-img:\/\/[a-z0-9-]+/g, function (ref) {
    return _cache.get(ref.slice(SCHEME.length)) || ref;
  });
}

/**
 * Async — extract every data:image/… src from html, persist each in IDB,
 * and return the html with those srcs replaced by antask-img://id refs.
 * Already-extracted images (same base64) reuse the existing id.
 */
export function extractImages(html) {
  if (!html || !html.includes("data:image/")) return Promise.resolve(html);

  var dataUrls = [];
  var regex    = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  var match;
  while ((match = regex.exec(html)) !== null) {
    var url = match[0];
    if (!dataUrls.includes(url)) dataUrls.push(url);
  }
  if (dataUrls.length === 0) return Promise.resolve(html);

  var newEntries = [];
  dataUrls.forEach(function (url) {
    if (!_reverse.has(url)) {
      var id = _makeId();
      _cache.set(id, url);
      _reverse.set(url, id);
      newEntries.push({ id: id, url: url });
    }
  });

  var persist = newEntries.length === 0
    ? Promise.resolve()
    : _openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
          var tx    = db.transaction(STORE_NAME, "readwrite");
          var store = tx.objectStore(STORE_NAME);
          newEntries.forEach(function (e) { store.put(e.url, e.id); });
          tx.oncomplete = resolve;
          tx.onerror    = function (ev) { reject(ev.target.error); };
        });
      }).catch(function (err) {
        console.warn("image-store: IDB write failed:", err);
      });

  return persist.then(function () {
    var result = html;
    dataUrls.forEach(function (url) {
      var id = _reverse.get(url);
      result = result.split(url).join(SCHEME + id);
    });
    return result;
  });
}

/**
 * Return all antask-img:// ids referenced in an html string.
 * Useful for cleanup when a note is deleted.
 */
export function findImageIds(html) {
  if (!html) return [];
  var matches = html.match(/antask-img:\/\/([a-z0-9-]+)/g) || [];
  return matches.map(function (m) { return m.slice(SCHEME.length); });
}

/**
 * Delete images by id from IDB and cache.
 * Call when a note that references them is permanently deleted.
 */
export function deleteImages(ids) {
  if (!ids || ids.length === 0) return Promise.resolve();
  ids.forEach(function (id) {
    var url = _cache.get(id);
    if (url) _reverse.delete(url);
    _cache.delete(id);
  });
  return _openDB().then(function (db) {
    return new Promise(function (resolve) {
      var tx    = db.transaction(STORE_NAME, "readwrite");
      var store = tx.objectStore(STORE_NAME);
      ids.forEach(function (id) { store.delete(id); });
      tx.oncomplete = resolve;
      tx.onerror    = resolve;
    });
  }).catch(function () {});
}
