/* CLASS OF 2026 — backend (Google Apps Script) · v6  "photo likes + carousel posts"
   v6 = v5 + (1) likes on photos use the SAME durable reaction pipeline as the wall messages (a photo id is a valid reaction target everywhere an id is checked),
   (2) a photo post can hold up to 10 pictures (column `more` in Photos, extra pictures are added one request at a time by `photoadd`),
   (3) a reply keeps the FULL text of the message it answers, (4) the blocked-devices list keeps the FULL name + text/caption.
   Setup: README.md.  Paste this file, keep your own ADMIN_KEY / FOUNDER_KEY, then Deploy > Manage deployments > Edit > New version.
   (Running setup() once is optional: missing tabs are created automatically and old reaction data is converted by itself the first time it is needed.)

   WHY v4 EXISTS — the wall reactions used to vanish after a refresh once the site got busy (about 1000 reactions in):
   • every single reaction read the WHOLE reactions sheet, rewrote a copy of ALL public data into the script cache (a new set of cache entries each time)
     and held the one global lock while doing it. CacheService keeps at most 1000 entries, so the cache thrashed constantly, and the work per tap grew with
     the amount of data until taps queued up behind the lock, timed out and were silently dropped (the page shows the tap first and reverts it later).
   • v5: a tap is one tiny row in an INBOX tab (constant work, whatever the history). The inbox is folded into per-device state + per-message counts in
     BATCHES (one pass for any number of taps). Counts live in their own small sheet and in a small fixed cache entry, so nothing grows with the number of
     reactions in the cache. v5 also runs a one-time recovery import from the old reaction tabs, so a previously completed migration cannot hide preserved
     legacy reactions when MsgState was emptied or a prior import was incomplete. */
const ADMIN_KEY = 'aud287**';           // the graduation team's secret (yoursite/#admin).   Better: put it in Project Settings > Script properties as ADMIN_KEY and leave this file without secrets
const FOUNDER_KEY = 'Bntawakl2030**';   // the FOUNDER's secret (yoursite/#founder). Must differ from ADMIN_KEY. Same: Script property FOUNDER_KEY overrides this value
const SHEET_ID = '1tJ_KcZX9P7Od9zWN0_APuiSqGRlP2mwnhnw7LMR_mCo';
const FOLDER = 'Class2026 Photos';        // Drive folder (created automatically)
const MAX_B64 = 4000000;                  // max photo size (base64 chars)
const COOLDOWN = 15;                      // seconds between photo/message posts from the same visitor
const MSG_WINDOW = 200;                   // newest messages sent with the first load (older ones are fetched page by page: nothing is ever hidden)
const MSG_PAGE = 100;                     // messages per "older notes" page (the page may ask for up to 500 with &n= when it needs them all)
const PHOTO_WINDOW = 1000;                // newest photos sent with the first load
const MAX_MORE = 9;                       // extra pictures per photo post (a carousel = the first picture + up to 9 more)
const ADD_WINDOW = 900000;                // ms after posting during which the same device may still add pictures to its own post
const REBUILD_MS = 300000;                // public data is re-read from the sheets after this long (a manual edit in the sheet shows up within minutes)
const RID_TTL = 600;                      // seconds a finished write is remembered by its request id (a retry gets the same answer instead of posting twice)
const LOCK_WAIT = 25000;                  // ms an ordinary write may wait for its turn
const REACT_WAIT = 20000;                 // ms a reaction may wait for its turn (its work inside the lock is a single row)
const FOLD_GAP = 2500;                    // ms: minimum pause between two folds (a fold handles every tap waiting in the inbox, so a burst costs one pass, not one per tap)
const CHUNK = 30000;                      // cache chunk size in characters (a cache value is limited to 100 KB)
const MSG_EMO = ['love', 'haha', 'sad', 'wow', 'party', 'grad'];   // the five reactions (the site shows them as ❤️ 😂 😢 🎉 🎓)
const MSG_COUNT_COLS = MSG_EMO.length + 1;       // message id + one column per reaction
const HEAD = {
  Messages: ['id', 'name', 'message', 'date', 'pin', 'badge', 'reply', 'rname', 'rtext', 'dev'],   // pin: '1' = pinned to the top (only one) · badge: 'founder' | 'team' | '' · reply = id of the message this one answers (+ rname / rtext copied at reply time)
  Photos: ['id', 'name', 'category', 'caption', 'date', 'fileId', 'uid', 'dev', 'more'],   // more = comma-separated Drive ids of the EXTRA pictures of a carousel post (fileId is the first one) · dev = anonymous id of the device that posted it (never sent to visitors; lets the admin / founder block that device)
  Votes: ['poll', 'option', 'date'],
  Bans: ['dev', 'msg', 'photo', 'from', 'until', 'label', 'by'],   // devices staff (admin or founder) blocked: msg / photo = '1' when blocked from that kind of post · from, until = ms since 1970 · by = 'founder' | 'admin' (who set the block: a founder block can only be lifted by the founder)
  Settings: ['key', 'value'],                               // msgLock = '1' while visitor messages are paused · mr6 = '1' once the recovery import has run
  MsgState: ['msg', 'dev', 'emoji', 'date'],                // STATE: one row per (message, device) = that device's current reaction (emoji '' = removed). Rows are reused, never duplicated. (The tab 'MsgReactions' of earlier versions is only READ, once, to import old reactions: it is never written, so a Google Sheets Table / dropdown rules on it can not break anything)
  MsgCounts: ['msg', 'love', 'haha', 'sad', 'wow', 'party', 'grad'], // reaction totals per message (derived from MsgState on every fold)
  MsgInbox: ['line'],                                      // taps waiting to be folded: emoji|messageId|deviceId|time
  AdminVisits: ['date', 'deviceId', 'link', 'deviceType', 'platform', 'browser', 'userAgent'] // one row per opening of #admin or #founder
};
/* The old posts page (Users, Reactions, Comments, Notes, PollVotes tabs) was removed from the site. Those tabs are left exactly as they are in your sheet;
   this file simply no longer reads them, which is a big part of why the site is faster now. */

/* ---------- sheet helpers (every cell is written as plain text, so nothing a visitor types can become a formula) ---------- */
const TABS = {};                                       // sheets opened during this request
let SS = null;
function cache() { return CacheService.getScriptCache(); }
function book() { return SS || (SS = SpreadsheetApp.openById(SHEET_ID)); }       // opened once per request (it used to be re-opened for every tab)
function tab(n) {
  if (TABS[n]) return TABS[n];
  const ss = book(); let t = ss.getSheetByName(n);
  if (!t) {
    try { t = ss.insertSheet(n); } catch (x) { t = ss.getSheetByName(n); if (!t) throw x; }       // two requests creating the same tab at once: the loser just uses it
    if (t.getLastRow() < 1) t.getRange(1, 1, 1, HEAD[n].length).setValues([HEAD[n]]);
  } else if (!cache().get('hd_' + n + '_' + HEAD[n].length)) {                  // older sheet: add the new columns at the end (checked once, then remembered)
    const lc = Math.max(1, t.getLastColumn()), h = t.getRange(1, 1, 1, lc).getValues()[0].map(String), miss = HEAD[n].filter(k => h.indexOf(k) < 0);
    if (miss.length) t.getRange(1, lc + 1, 1, miss.length).setValues([miss]);
    cache().put('hd_' + n + '_' + HEAD[n].length, '1', 21600);
  }
  return TABS[n] = t;
}
function txt(r) { try { r.setNumberFormat('@'); } catch (e) {} return r; }          // plain-text cells; a Google Sheets Table column refuses a number format ("can't set the number format in a typed column"), and that must never stop a write
function heads(t) { return t.getRange(1, 1, 1, t.getLastColumn()).getValues()[0].map(String); }
function asObj(h, r) { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; }
function rows(n) { const v = tab(n).getDataRange().getValues(), h = v.shift().map(String); return v.map(r => asObj(h, r)); }
function tailRows(n, k) {                              // the last k data rows of a tab as objects (oldest first) + whether older rows exist: reads only what is needed
  const t = tab(n), lr = t.getLastRow(), lc = t.getLastColumn(); if (lr < 2 || lc < 1) return { list: [], more: false, first: 2 };
  const h = heads(t), from = Math.max(2, lr - k + 1);
  return { list: t.getRange(from, 1, lr - from + 1, lc).getValues().map(r => asObj(h, r)), more: from > 2, first: from };
}
function put(n, o) {
  const t = tab(n), h = heads(t), r = t.getLastRow() + 1;
  if (r > t.getMaxRows()) t.insertRowsAfter(t.getMaxRows(), 500);
  txt(t.getRange(r, 1, 1, h.length)).setValues([h.map(k => o[k] == null ? '' : String(o[k]))]);
}
function find(n, col, val) {                              // first row where col == val  ->  {row, o}  (row is 1-based)
  const v = tab(n).getDataRange().getValues(), h = v[0].map(String), c = h.indexOf(col);
  for (let i = 1; i < v.length; i++) if (String(v[i][c]) === String(val)) return { row: i + 1, o: asObj(h, v[i]) };
  return null;
}
function setRow(n, row, o) {
  const t = tab(n), h = heads(t);
  Object.keys(o).forEach(k => { const c = h.indexOf(k); if (c >= 0) txt(t.getRange(row, c + 1)).setValue(String(o[k])); });
}
function dropRows(n, test) {                           // delete every row where test(rowObject) is true, in a few calls; returns the removed rows (as objects)
  const t = tab(n), lr = t.getLastRow(), lc = t.getLastColumn(); if (lr < 2 || lc < 1) return [];
  const h = heads(t), v = t.getRange(2, 1, lr - 1, lc).getValues(), keep = [], gone = [];
  v.forEach(r => { const o = asObj(h, r); if (test(o)) gone.push(o); else keep.push(r); });
  if (!gone.length) return gone;
  if (keep.length) txt(t.getRange(2, 1, keep.length, lc)).setValues(keep);   // write the survivors first ...
  t.getRange(keep.length + 2, 1, gone.length, lc).clearContent();                           // ... then clear the leftover rows (a failure in between can only duplicate a row, never lose one)
  return gone;
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function raw(s) { return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON); }
function folder() { const f = DriveApp.getFoldersByName(FOLDER); return f.hasNext() ? f.next() : DriveApp.createFolder(FOLDER); }
function clean(x, n) { return String(x || '').replace(/[<>]/g, '').trim().slice(0, n); }
function limited(key, secs) { if (!key) return false; const c = cache(), k = 'rl_' + key; if (c.get(k)) return true; c.put(k, '1', secs); return false; }
function trashFile(id) { if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (x) {} } }
function setup() { Object.keys(HEAD).forEach(tab); folder(); const lock = LockService.getScriptLock(); lock.waitLock(30000); try { migrateOnce(); bump(); } finally { lock.releaseLock(); } Logger.log('OK: sheets + Drive folder are ready, reactions are in the v5 format.'); }

/* ---------- identity: the admin / founder keys ---------- */
const DEF_ADMIN = 'CHANGE_THIS_SECRET', DEF_FOUNDER = 'CHANGE_THIS_FOUNDER_SECRET';
const KEYS = {};
function secret(name, dflt) {                            // a Script property (Project Settings) wins over the value written in this file
  if (KEYS[name] != null) return KEYS[name];
  let v = ''; try { v = String(PropertiesService.getScriptProperties().getProperty(name) || ''); } catch (e) {}
  return KEYS[name] = v || dflt;
}
function role(k) {                                       // whose key is this?  'founder' | 'admin' | ''.  A default (unchanged) key never works, and the founder key must differ from the admin key
  k = String(k || ''); if (!k) return '';
  const A = secret('ADMIN_KEY', ADMIN_KEY), F = secret('FOUNDER_KEY', FOUNDER_KEY);
  if (F !== DEF_FOUNDER && F !== A && k === F) return 'founder';
  if (A !== DEF_ADMIN && k === A) return 'admin';
  return '';
}
function adminState(k) {                                 // 'ok' (admin OR founder: every moderation power) | 'key' (wrong key) | 'unset' (no key was changed from its default)
  if (role(k)) return 'ok';
  return secret('ADMIN_KEY', ADMIN_KEY) === DEF_ADMIN && secret('FOUNDER_KEY', FOUNDER_KEY) === DEF_FOUNDER ? 'unset' : 'key';
}
function lockOn() { const f = find('Settings', 'key', 'msgLock'); return !!f && String(f.o.value) === '1'; }          // are visitor messages paused?
const DEV_RE = /^[a-z0-9]{6,32}$/i;
function devId(v) { v = String(v || ''); return DEV_RE.test(v) ? v : ''; }                                // the id a browser keeps for itself (anonymous, random)
function noDev(o) { const x = Object.assign({}, o); x.bn = devId(o.dev) ? 1 : 0; delete x.dev; return x; }   // what visitors get to see: never the device id, only "can staff block this one?"
function banOf(dev, what) {                              // the active block that stops this device from posting `what` ('msg' | 'photo'), or null
  const f = dev ? find('Bans', 'dev', dev) : null; if (!f) return null;
  const o = f.o, until = Number(o.until);
  if (!(until > Date.now()) || String(o[what]) !== '1') return null;
  return { from: Number(o.from) || 0, until: until, msg: String(o.msg) === '1', photo: String(o.photo) === '1' };
}
function banInfo(b, what) { return { what: what, scope: b.msg && b.photo ? 'both' : b.msg ? 'msg' : 'photo', from: b.from, until: b.until, now: Date.now() }; }
function banErr(b, what) { return out(Object.assign({ ok: 0, error: 'banned' }, banInfo(b, what))); }
function addSpan(t0, Y, Mo, D, H) {                      // calendar years + months (the day is kept inside the month: Jan 31 + 1 month = Feb 28), then days + hours
  const d = new Date(t0), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCFullYear(d.getUTCFullYear() + Y); d.setUTCMonth(d.getUTCMonth() + Mo);
  d.setUTCDate(Math.min(day, new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()));
  return d.getTime() + D * 864e5 + H * 36e5;
}
function setLock(on) { const f = find('Settings', 'key', 'msgLock'), v = on ? '1' : '0'; if (f) setRow('Settings', f.row, { value: v }); else put('Settings', { key: 'msgLock', value: v }); }

/* ---------- the cache: a handful of FIXED entries, overwritten in place (the cache is limited to 1000 entries in total, so nothing here may grow with traffic) ----------
   A blob is a string stored as  b_<name>  (meta: stamp:chunks:builtAt)  +  b_<name>_0 … b_<name>_n  (each chunk starts with the 8-character stamp, so a reader can tell
   if it caught a half-overwritten blob and then simply treats it as missing). Stamps change on every write, so they double as the version the page compares. */
function stampNew() { return Utilities.getUuid().replace(/-/g, '').slice(0, 8); }
function blobPut(name, str, at) {                     // -> {v, at} or null when the cache refused it (the data is then simply read from the sheets next time)
  const c = cache(), stamp = stampNew();
  for (const size of [CHUNK, 12000]) {
    const kv = {}; let n = 0;
    for (let i = 0; i < str.length;) {                  // never cut between the two halves of an emoji
      let j = Math.min(i + size, str.length); if (j < str.length) { const k = str.charCodeAt(j - 1); if (k >= 0xD800 && k <= 0xDBFF) j--; }
      kv['b_' + name + '_' + n++] = stamp + str.slice(i, j); i = j;
    }
    if (!n) kv['b_' + name + '_' + n++] = stamp;
    const when = at || Date.now();
    try { c.putAll(kv, 21600); c.put('b_' + name, stamp + ':' + n + ':' + when, 21600); return { v: stamp, at: when }; } catch (e) { /* value too large for the cache: retry with smaller chunks */ }
  }
  c.remove('b_' + name); return null;
}
function metaOf(m) { if (!m) return null; const p = String(m).split(':'); return p.length === 3 ? { v: p[0], n: Number(p[1]), at: Number(p[2]) } : null; }
function blobGet(name, meta) {                         // -> {v, at, str} or null (missing, expired, evicted or torn)
  const c = cache(); meta = meta || metaOf(c.get('b_' + name)); if (!meta) return null;
  const keys = []; for (let i = 0; i < meta.n; i++) keys.push('b_' + name + '_' + i);
  const got = c.getAll(keys); let s = '';
  for (let i = 0; i < keys.length; i++) { const x = got[keys[i]]; if (x == null || x.slice(0, 8) !== meta.v) return null; s += x.slice(8); }
  return { v: meta.v, at: meta.at, str: s };
}
function bump() { const c = cache(); c.remove('b_pub'); c.remove('b_mr'); }      // throw the public data away: the next read rebuilds it from the sheets

/* ---------- reactions: inbox -> fold -> state + counts ---------- */
function noteErr(where, err) {                         // remember the last server-side problem (Script properties) so diagnose() can show it
  try { console.error(where, err); PropertiesService.getScriptProperties().setProperty('lastErr', new Date().toISOString() + ' ' + where + ': ' + String((err && err.stack) || err).slice(0, 500)); } catch (e) {}
}
function legacyRows() {                                 // every row of the OLD reaction tabs (oldest first). Read only: these tabs are never written by this version
  const ss = book(); let out = [];
  ['MsgReactionsOld', 'MsgReactions'].forEach(n => { const t = ss.getSheetByName(n); if (!t) return; const lr = t.getLastRow(); if (lr > 1) out = out.concat(t.getRange(2, 1, lr - 1, Math.max(4, 1)).getValues().map(r => r.slice(0, 4))); });
  return out;
}
function importLegacy() {                               // old reactions -> MsgState. A (message, device) pair that already has a state row is never touched (the state is newer). Returns how many were imported
  const old = legacyRows(); if (!old.length) return 0;
  const last = {}, order = []; old.forEach(r => { const k = String(r[0]) + '|' + String(r[1]); if (!(k in last)) order.push(k); last[k] = [String(r[0]), String(r[1]), String(r[2] || ''), String(r[3] || '')]; });   // the last row of a pair is that device's current reaction
  const st = tab('MsgState'), slr = st.getLastRow(), have = {}, ok = validIds();
  if (slr > 1) st.getRange(2, 1, slr - 1, 2).getValues().forEach(r => have[String(r[0]) + '|' + String(r[1])] = 1);
  const add = order.filter(k => !have[k]).map(k => last[k]).filter(r => MSG_EMO.indexOf(r[2]) >= 0 && DEV_RE.test(r[1]) && ok[r[0]]);
  if (add.length) { const to = slr + add.length, mx = st.getMaxRows(); if (to > mx) st.insertRowsAfter(mx, Math.max(500, to - mx)); txt(st.getRange(slr + 1, 1, add.length, 4)).setValues(add); }
  return add.length;
}
function migrateOnce() {                                // once per backend generation: bring old reactions back without ever replacing newer state
  const c = cache(); if (c.get('mr6ok')) return;
  const f = find('Settings', 'key', 'mr6'); if (f && String(f.o.value) === '1') { c.put('mr6ok', '1', 21600); return; }
  /* Do not trust the old mr5 flag here. Earlier deployments could set it while MsgState was empty, leaving perfectly valid rows in MsgReactions invisible
     after a refresh. importLegacy is additive: an existing (message, device) state row always wins, so it is safe for live installations. */
  importLegacy(); recount();
  if (f) setRow('Settings', f.row, { value: '1' }); else put('Settings', { key: 'mr6', value: '1' });
  c.put('mr6ok', '1', 21600);
}
function msgOrder() {                                   // ids of every message in sheet order + the pinned one ('' if none)
  const t = tab('Messages'), lr = t.getLastRow(); if (lr < 2) return { ids: [], pin: '' };
  const h = heads(t), ic = h.indexOf('id'), pc = h.indexOf('pin');
  const ids = t.getRange(2, ic + 1, lr - 1, 1).getValues().map(r => String(r[0]));
  let pin = ''; if (pc >= 0) { const p = t.getRange(2, pc + 1, lr - 1, 1).getValues(); for (let i = p.length - 1; i >= 0; i--) if (String(p[i][0]) === '1') { pin = ids[i]; break; } }
  return { ids: ids, pin: pin };
}
function photoOrder() {                                 // ids of every photo post in sheet order
  const t = tab('Photos'), lr = t.getLastRow(); if (lr < 2) return [];
  const c = heads(t).indexOf('id'); if (c < 0) return [];
  return t.getRange(2, c + 1, lr - 1, 1).getValues().map(r => String(r[0]));
}
function validIds(mo, po) {                             // EVERY id that can hold reactions: wall messages AND photo posts. (Anything not in here is treated as "deleted" and its reactions are dropped, so a photo id MUST be listed.)
  const v = {}; (mo || msgOrder()).ids.forEach(i => v[i] = 1); (po || photoOrder()).forEach(i => v[i] = 1); return v;
}
function windowIds(o, po) { const s = {}; o.ids.slice(-MSG_WINDOW).forEach(i => s[i] = 1); if (o.pin) s[o.pin] = 1; (po || []).slice(-PHOTO_WINDOW).forEach(i => s[i] = 1); return s; }
function tallies(state, valid) {                        // state rows [msg, dev, emoji] -> {msg: {emoji: n}}
  const cnt = {};
  state.forEach(r => { const m = r[0], e = r[2]; if (!e || !valid[m]) return; const c = cnt[m] = cnt[m] || {}; c[e] = (c[e] || 0) + 1; });
  return cnt;
}
function writeCounts(cnt) {                             // MsgCounts = the totals, rewritten in one go (it only has one row per message that has reactions)
  const t = tab('MsgCounts'), lr = t.getLastRow();
  if (lr > 1) t.getRange(2, 1, lr - 1, MSG_COUNT_COLS).clearContent();
  const list = Object.keys(cnt).map(m => [m].concat(MSG_EMO.map(e => String(cnt[m][e] || 0))));
  if (list.length) { const to = 1 + list.length, mx = t.getMaxRows(); if (to > mx) t.insertRowsAfter(mx, Math.max(500, to - mx)); txt(t.getRange(2, 1, list.length, MSG_COUNT_COLS)).setValues(list); }
}
function recount() {                                    // rebuild MsgCounts from the state rows (safe to run any time from the editor: it repairs any drift)
  const t = tab('MsgState'), lr = t.getLastRow(), valid = validIds();
  const st = lr > 1 ? t.getRange(2, 1, lr - 1, 3).getValues().map(r => [String(r[0]), String(r[1]), String(r[2] || '')]) : [];
  writeCounts(tallies(st, valid)); bump();
}
function readCounts() {                                 // MsgCounts -> {msg: {emoji: n}} (only non-zero)
  const t = tab('MsgCounts'), lr = t.getLastRow(), cnt = {}; if (lr < 2) return cnt;
  t.getRange(2, 1, lr - 1, MSG_COUNT_COLS).getValues().forEach(r => { const o = {}; MSG_EMO.forEach((e, i) => { const n = Number(r[i + 1]) || 0; if (n > 0) o[e] = n; }); if (Object.keys(o).length) cnt[String(r[0])] = o; });
  return cnt;
}
function mrStr(cnt, win) {                              // the small public blob: counts of the messages the page shows
  const o = {}; Object.keys(cnt).forEach(m => { if (win[m]) o[m] = cnt[m]; });
  return JSON.stringify(o);
}
function mrPut(cnt, win) { return blobPut('mr', mrStr(cnt, win)); }
function fold() {                                       // CALLER HOLDS THE LOCK. Applies every tap waiting in the inbox in one pass. -> {cnt, valid} | null (nothing was waiting)
  migrateOnce();
  const inb = tab('MsgInbox'), ilr = inb.getLastRow(); if (ilr < 2) return null;
  const t0 = Date.now();
  const lines = inb.getRange(2, 1, ilr - 1, 1).getValues().map(r => String(r[0]));
  const mo = msgOrder(), po = photoOrder(), valid = validIds(mo, po);
  const st = tab('MsgState'), slr = st.getLastRow();
  const sv = slr > 1 ? st.getRange(2, 1, slr - 1, 3).getValues().map(r => [String(r[0]), String(r[1]), String(r[2] || '')]) : [];
  const idx = new Map(); sv.forEach((r, i) => idx.set(r[0] + '|' + r[1], i));
  const add = []; let lo = -1, hi = -1;
  lines.forEach(L => {                                  // in the order the taps arrived: the last tap of a device on a message wins
    const p = L.split('|'); if (p.length < 4) return;
    const em = p[0] === 'none' ? '' : p[0], msg = p[1], dev = p[2];
    if ((em && MSG_EMO.indexOf(em) < 0) || !valid[msg] || !DEV_RE.test(dev)) return;     // unknown / deleted message or a bad line: dropped
    const k = msg + '|' + dev, i = idx.get(k);
    if (i === undefined) { if (em) { idx.set(k, sv.length + add.length); add.push([msg, dev, em, p[3] || '']); } return; }
    if (i >= sv.length) { add[i - sv.length][2] = em; return; }
    if (sv[i][2] !== em) { sv[i][2] = em; lo = lo < 0 ? i : Math.min(lo, i); hi = Math.max(hi, i); }
  });
  if (hi >= 0) txt(st.getRange(lo + 2, 3, hi - lo + 1, 1)).setValues(sv.slice(lo, hi + 1).map(r => [r[2]]));     // only the emoji column of the rows that changed
  if (add.length) { const from = slr + 1, to = slr + add.length, mx = st.getMaxRows(); if (to > mx) st.insertRowsAfter(mx, Math.max(500, to - mx)); txt(st.getRange(from, 1, add.length, 4)).setValues(add); }
  const cnt = tallies(sv.concat(add), valid);
  if (hi >= 0 || add.length) writeCounts(cnt);
  inb.getRange(2, 1, ilr - 1, 1).clearContent();        // only now: if anything above failed the taps stay in the inbox and the next fold applies them again (applying twice changes nothing)
  SpreadsheetApp.flush();
  mrPut(cnt, windowIds(mo, po));
  const c = cache(), dur = Date.now() - t0; c.put('fold_at', String(Date.now() + Math.max(FOLD_GAP, 2 * dur)), 60);     // next fold allowed from here
  return { cnt: cnt, valid: valid };
}
function foldDue() { const t = Number(cache().get('fold_at') || 0); return Date.now() >= t; }
function msgReact(d) {                                  // a tap on a wall message. Its own fast path: it never reads the sheets except through a fold
  const id = clean(d.id, 40), dev = clean(d.dev, 24), em = String(d.emoji || '');
  if (!id || !DEV_RE.test(dev)) return out({ ok: 0, error: 'noauth' });
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return out({ ok: 0, error: 'nomsg' });
  if (em && MSG_EMO.indexOf(em) < 0) return out({ ok: 0, error: 'emoji' });
  const lock = LockService.getScriptLock(), w0 = Date.now();
  try { lock.waitLock(REACT_WAIT); } catch (x) { return out({ ok: 0, error: 'busy' }); }
  const queued = Date.now() - w0 > 150;                 // had to wait for the lock = other taps are lining up behind this one
  try {
    inboxAdd((em || 'none') + '|' + id + '|' + dev + '|' + new Date().toISOString());
    let r = null;
    if (!queued || foldDue()) { try { r = fold(); } catch (err) { noteErr('fold(tap)', err); } }   // quiet site: fold at once (the tap shows for everybody immediately). Busy site: one fold per FOLD_GAP handles the whole queue. A failed fold is harmless: the tap is safe in the inbox and the next fold applies it
    if (r && !r.valid[id]) return out({ ok: 0, error: 'nomsg' });                    // the message was deleted meanwhile
    return out(r ? { ok: 1, counts: r.cnt[id] || {} } : { ok: 1, pending: 1 });
  } catch (err) { console.error(err); return out({ ok: 0, error: 'server', detail: String(err).slice(0, 160) }); }
  finally { lock.releaseLock(); }
}
function inboxAdd(line) {                               // append without appendRow's implicit formatting work; the caller already owns the lock
  const t = tab('MsgInbox'), row = t.getLastRow() + 1;
  if (row > t.getMaxRows()) t.insertRowsAfter(t.getMaxRows(), Math.max(500, row - t.getMaxRows()));
  txt(t.getRange(row, 1)).setValue(line);
}
function maybeFold() {                                  // a reader helps: if taps are waiting and nobody folded lately, fold them now (never waits for a busy lock)
  const c = cache(); if (c.get('chk')) return; c.put('chk', '1', 2);
  if (!foldDue() || tab('MsgInbox').getLastRow() < 2) return;
  const lock = LockService.getScriptLock(); let got = false;
  try { got = lock.tryLock(500); } catch (x) {}
  if (!got) return;
  try { fold(); } catch (err) { noteErr('fold(reader)', err); } finally { lock.releaseLock(); }
}

/* ---------- public data: built once, kept in a few cache entries, patched in place by writes ---------- */
function buildPub() {
  const M = tailRows('Messages', MSG_WINDOW), P = tailRows('Photos', PHOTO_WINDOW), mo = msgOrder(), pinId = mo.pin;
  const msgs = M.list.slice().reverse(); let pin = pinId && !M.list.some(m => String(m.id) === pinId) ? find('Messages', 'id', pinId) : null;    // a pinned note that is older than the window is still shown
  if (pin) msgs.unshift(pin.o);
  const votes = {}; rows('Votes').forEach(r => { const k = r.poll + '_' + r.option; votes[k] = (votes[k] || 0) + 1; });
  return { at: Date.now(), locked: lockOn() ? 1 : 0, photos: P.list.slice().reverse().map(r => ({ id: String(r.id), name: r.name, category: r.category, caption: r.caption, date: r.date, fileId: r.fileId, uid: String(r.uid || ''), bn: devId(r.dev) ? 1 : 0, more: String(r.more || '') })),
    messages: msgs.map(noDev), votes: votes, oldest: M.list.length ? String(M.list[0].id) : '', more: M.more ? 1 : 0, total: mo.ids.length };      // total = how many notes exist (the page shows it; older ones load as the reader scrolls)
}
function buildAll() { return { d: buildPub(), cnt: readCounts(), win: windowIds(msgOrder(), photoOrder()) }; }
function loadAll(wantV) {                               // the cached public data, rebuilt if missing / too old. Normal page loads never touch a sheet. -> {v, pub, mr} (pub / mr are strings, or null when wantV already matches)
  const c = cache(), got = c.getAll(['b_pub', 'b_mr']), mp = metaOf(got.b_pub), mm = metaOf(got.b_mr);
  const fresh = mp && mm && Date.now() - mp.at <= REBUILD_MS;
  if (fresh && wantV && wantV === mp.v + mm.v) return { v: wantV, pub: null, mr: null };      // the page already has exactly this: not even the chunks are read
  const pub = mp && blobGet('pub', mp), mr = mm && blobGet('mr', mm);
  if (pub && mr && fresh) return { v: pub.v + mr.v, pub: pub.str, mr: mr.str };
  const lock = LockService.getScriptLock(); let own = false;
  try { own = lock.tryLock(pub && mr ? 0 : 4000); } catch (x) {}      // an old copy is served at once while one request refreshes it; a missing copy is worth waiting for
  if (!own) {
    if (pub && mr) return { v: pub.v + mr.v, pub: pub.str, mr: mr.str };
    const b = buildAll(); return { v: stampNew() + stampNew(), pub: JSON.stringify(b.d), mr: mrStr(b.cnt, b.win) };     // built without the lock: answered, not stored
  }
  try {
    const p2 = blobGet('pub'), m2 = blobGet('mr');                              // somebody may have rebuilt while we waited
    if (p2 && m2 && Date.now() - p2.at <= REBUILD_MS) return { v: p2.v + m2.v, pub: p2.str, mr: m2.str };
    migrateOnce();
    const b = buildAll(), ps = JSON.stringify(b.d), ms = mrStr(b.cnt, b.win), sp = blobPut('pub', ps, b.d.at), sm = blobPut('mr', ms);
    return { v: (sp ? sp.v : stampNew()) + (sm ? sm.v : stampNew()), pub: ps, mr: ms };
  } finally { lock.releaseLock(); }
}
let PATCHED = false;                                                          // did this write already refresh the cached public data?
function patch(fn) {                                                          // apply a small change to the cached public data (called by writes, inside the write lock)
  PATCHED = true;
  const b = blobGet('pub'); if (!b || Date.now() - b.at > REBUILD_MS) { bump(); return; }
  let d; try { d = JSON.parse(b.str); fn(d); } catch (e) { bump(); return; }
  if (!blobPut('pub', JSON.stringify(d), b.at)) bump();
}
function msgPage(p) {                                                         // older notes, one page: ?scope=msgs&before=<id of the oldest note you have>
  const before = clean(p.before, 40);
  const t = tab('Messages'), lr = t.getLastRow(); if (lr < 2) return out({ ok: 1, messages: [], mr: {}, oldest: '', more: 0, total: 0 });
  const h = heads(t), lc = t.getLastColumn(), ids = t.getRange(2, h.indexOf('id') + 1, lr - 1, 1).getValues();
  let end = -1; for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === before) { end = i; break; }
  if (end < 0) return out({ ok: 1, messages: [], mr: {}, oldest: '', more: 0, gone: 1, total: ids.length });
  const per = Math.min(500, Math.max(1, Math.floor(Number(p.n)) || MSG_PAGE)), start = Math.max(0, end - per), list = end > start ? t.getRange(start + 2, 1, end - start, lc).getValues().map(r => asObj(h, r)) : [];
  const cnt = readCounts(), mr = {}; list.forEach(m => { const k = String(m.id); if (cnt[k]) mr[k] = cnt[k]; });
  return out({ ok: 1, messages: list.slice().reverse().map(noDev), mr: mr, oldest: list.length ? String(list[0].id) : '', more: start > 0 ? 1 : 0, total: ids.length });
}
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.scope === 'msgs') return msgPage(p);
  try { maybeFold(); } catch (err) { console.error(err); }
  const a = loadAll(p.v ? String(p.v) : '');
  if (!a.pub) return out({ ok: 1, same: 1, v: a.v });                          // the caller already has this exact version: send nothing else
  return raw('{"ok":1,"v":"' + a.v + '",' + a.pub.slice(1, -1) + ',"mr":' + a.mr + '}');
}

/* ---------- write ---------- */
function doPost(e) {
  let d, A;
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out({ ok: 0, error: 'badjson' }); }
  if (d.action === 'msgreact') return msgReact(d);
  A = ACT[d.action]; if (!A) return out({ ok: 0, error: 'action' });
  const rid = /^[a-z0-9]{8,16}$/.test(String(d.rid || '')) ? String(d.rid) : '', c = cache();     // request id: the same write sent twice (a retry) is done only once
  const again = () => { const p = rid ? c.get('rid_' + rid) : null; return p ? raw(p) : null; };
  let hit = again(); if (hit) return hit;
  const lock = LockService.getScriptLock();
  try { lock.waitLock(LOCK_WAIT); } catch (x) { return out({ ok: 0, error: 'busy' }); }
  try {
    hit = again(); if (hit) return hit;                                        // an earlier try of this same request finished while we waited
    PATCHED = false;
    const res = A(d, new Date().toISOString(), rid || Utilities.getUuid().slice(0, 8)), body = res.getContent(), ok = body.indexOf('"ok":1') > -1;
    if (ok && !PATCHED && ['auth', 'bancheck', 'listbans', 'ban', 'unban'].indexOf(d.action) < 0) bump();     // writes that did not patch the public data throw it away
    if (ok && rid) c.put('rid_' + rid, body, RID_TTL);
    return res;
  } catch (err) { console.error(err); return out({ ok: 0, error: 'server', detail: String(err).slice(0, 160) }); }
  finally { lock.releaseLock(); }
}
const ACT = {
  message(d, now, id) {                                   // a visitor, or staff posting from the founder / admin link (their message gets a badge)
    const r = d.key ? role(d.key) : '';
    if (d.key && !r) return out({ ok: 0, error: adminState(d.key) });                 // a wrong staff key never falls back to an unmarked visitor post
    const it = { id: id, name: clean(d.name, 30), message: clean(d.message, 240), date: now, badge: r === 'founder' ? 'founder' : r === 'admin' ? 'team' : '', reply: '', rname: '', rtext: '' };
    if (!it.name || !it.message) return out({ ok: 0, error: 'empty' });
    let dev = '';
    if (!r) {                                                                         // visitors only (staff are never blocked):
      dev = devId(d.dev); if (!dev) return out({ ok: 0, error: 'refresh' });          //   an old cached page that does not send its device id must reload
      const bn = banOf(dev, 'msg'); if (bn) return banErr(bn, 'msg');                 //   blocked by staff
      if (lockOn()) return out({ ok: 0, error: 'locked' });                           //   closed while the founder has paused messages
    }
    it.dev = dev;
    if (d.reply) {                                                                    // a reply is a normal new message + a link to the original; the preview comes from the REAL original, never from what the browser sends
      const f = find('Messages', 'id', String(d.reply).slice(0, 60));
      if (!f) return out({ ok: 0, error: 'gone' });                                   // the original was deleted meanwhile
      it.reply = String(f.o.id); it.rname = clean(f.o.name, 30); it.rtext = clean(String(f.o.message || '').replace(/\s+/g, ' '), 240);      // the FULL original (messages are at most 240 characters), so the reply can show all of it
    }
    if (!r && limited(d.cid, COOLDOWN)) return out({ ok: 0, error: 'wait' });
    put('Messages', it);
    patch(x => { if (x.messages.some(m => String(m.id) === it.id)) return; x.messages.unshift(noDev(it)); if (x.total != null) x.total++; if (x.messages.length > MSG_WINDOW + 1) { x.messages = x.messages.slice(0, MSG_WINDOW + 1); x.more = 1; x.oldest = String(x.messages[x.messages.length - 1].id); } });
    return out({ ok: 1, item: noDev(it) });
  },
  photo(d, now, id) {                                      // visitor photo
    const img = String(d.image || ''); if (img.indexOf('data:image/') !== 0 || img.length > MAX_B64) return out({ ok: 0, error: 'image' });
    const name = clean(d.name, 30) || 'Anonymous', dev = devId(d.dev); if (!dev) return out({ ok: 0, error: 'refresh' });
    const bn = banOf(dev, 'photo'); if (bn) return banErr(bn, 'photo');             // blocked by staff: refused before anything is stored
    if (limited(d.cid, COOLDOWN)) return out({ ok: 0, error: 'wait' });
    const bytes = Utilities.base64Decode(img.split(',')[1]);
    const f = folder().createFile(Utilities.newBlob(bytes, 'image/jpeg', id + '.jpg'));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const it = { id: id, name: name, category: clean(d.category, 40), caption: clean(d.caption, 140), date: now, fileId: f.getId(), uid: '', dev: dev, more: '' };
    put('Photos', it);
    patch(x => { if (x.photos.some(m => m.id === it.id)) return; x.photos.unshift({ id: it.id, name: it.name, category: it.category, caption: it.caption, date: it.date, fileId: it.fileId, uid: '', bn: 1, more: '' }); x.photos = x.photos.slice(0, PHOTO_WINDOW); });
    return out({ ok: 1, item: noDev(it) });
  },
  photoadd(d, now) {                                       // the SAME visitor adds one more picture to the post they just made (a carousel). One picture per request, so the global lock is never held for long
    const img = String(d.image || ''); if (img.indexOf('data:image/') !== 0 || img.length > MAX_B64) return out({ ok: 0, error: 'image' });
    const dev = devId(d.dev); if (!dev) return out({ ok: 0, error: 'refresh' });
    const bn = banOf(dev, 'photo'); if (bn) return banErr(bn, 'photo');
    const pid = clean(d.id, 40), f = pid ? find('Photos', 'id', pid) : null; if (!f) return out({ ok: 0, error: 'gone' });
    if (devId(f.o.dev) !== dev) return out({ ok: 0, error: 'noauth' });                  // only the device that made the post can add to it
    if (Date.now() - Date.parse(String(f.o.date)) > ADD_WINDOW) return out({ ok: 0, error: 'late' });
    const more = String(f.o.more || '').split(',').map(x => x.trim()).filter(Boolean);
    if (more.length >= MAX_MORE) return out({ ok: 0, error: 'many' });
    const file = folder().createFile(Utilities.newBlob(Utilities.base64Decode(img.split(',')[1]), 'image/jpeg', pid + '_' + (more.length + 2) + '.jpg'));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    more.push(file.getId()); const joined = more.join(',');
    setRow('Photos', f.row, { more: joined });
    patch(x => { const p = x.photos.find(q => String(q.id) === pid); if (p) p.more = joined; });
    return out({ ok: 1, fileId: file.getId(), n: more.length + 1 });
  },
  vote(d, now) {
    const poll = Number(d.poll) || 0, option = Number(d.option) || 0; put('Votes', { poll: poll, option: option, date: now });
    patch(x => { const k = poll + '_' + option; x.votes[k] = (x.votes[k] || 0) + 1; });
    return out({ ok: 1 });
  },
  adminvisit(d, now) {                                  // anonymous audit entry: one request is sent whenever #admin / #founder opens. No browser permission is requested.
    const link = d.link === 'founder' ? 'founder' : d.link === 'admin' ? 'admin' : '';
    if (!link) return out({ ok: 0, error: 'link' });
    const ua = clean(d.ua, 500), type = clean(d.deviceType, 24), platform = clean(d.platform, 80), browser = clean(d.browser, 80);
    put('AdminVisits', { date: now, deviceId: devId(d.dev), link: link, deviceType: type, platform: platform, browser: browser, userAgent: ua });
    return out({ ok: 1 });
  },
  auth(d) { const s = adminState(d.key); return out(s === 'ok' ? { ok: 1, role: role(d.key), locked: lockOn() ? 1 : 0 } : { ok: 0, error: s }); },
  bancheck(d) {                                            // anyone: "is THIS device blocked right now?" (the page asks before it uploads a heavy photo)
    const dv = devId(d.dev), m = banOf(dv, 'msg'), p = banOf(dv, 'photo');
    return out({ ok: 1, now: Date.now(), msg: m ? banInfo(m, 'msg') : null, photo: p ? banInfo(p, 'photo') : null });
  },
  ban(d) {                                                 // admin or founder: block the device behind one message / photo from posting messages, photos or both, for any span
    const st = adminState(d.key); if (st !== 'ok') return out({ ok: 0, error: st });   // admin OR founder
    const yes = v => v === true || v === 1 || v === '1', msg = yes(d.msg), photo = yes(d.photo);
    if (!msg && !photo) return out({ ok: 0, error: 'what' });
    const n = k => { const x = Number(d[k] || 0); return Math.floor(x) === x && x >= 0 && x <= 9999 ? x : NaN; };
    const Y = n('y'), Mo = n('mo'), D = n('d'), H = n('h');
    if ([Y, Mo, D, H].some(isNaN) || Y + Mo + D + H === 0) return out({ ok: 0, error: 'span' });
    let f, label = '';
    const one = (v, n) => clean(String(v || '').replace(/\s+/g, ' '), n);                      // the label keeps the WHOLE name and the WHOLE text / caption: "name \n text"
    if (d.type === 'photo') { f = find('Photos', 'id', String(d.id)); if (f) label = one(f.o.name, 30) + '\n📷 ' + (one(f.o.caption, 140) || 'Photo'); }
    else { f = find('Messages', 'id', String(d.id)); if (f) label = one(f.o.name, 30) + '\n' + one(f.o.message, 240); }
    if (!f) return out({ ok: 0, error: 'gone' });
    const dev = devId(f.o.dev); if (!dev) return out({ ok: 0, error: 'nodev' });      // posted before devices were recorded (or by staff)
    const now = Date.now(), until = Math.min(addSpan(now, Y, Mo, D, H), Date.UTC(9999, 11, 31));
    const by = role(d.key) === 'founder' ? 'founder' : 'admin', b = find('Bans', 'dev', dev);
    if (b && by !== 'founder' && String(b.o.by) === 'founder' && Number(b.o.until) > now && (String(b.o.msg) === '1' || String(b.o.photo) === '1')) return out({ ok: 0, error: 'founderlock' });   // the admin can not replace (shorten / change) a block the founder set
    const row = { dev: dev, msg: msg ? '1' : '', photo: photo ? '1' : '', from: now, until: until, label: label, by: by };
    if (b) setRow('Bans', b.row, row); else put('Bans', row);                          // blocking the same device again replaces its earlier block
    return out({ ok: 1, from: now, until: until, now: now, label: label });
  },
  unban(d) {                                               // admin or founder: lift a block before it ends
    const st = adminState(d.key); if (st !== 'ok') return out({ ok: 0, error: st });   // admin OR founder
    const b = find('Bans', 'dev', devId(d.dev));
    if (b && role(d.key) !== 'founder' && String(b.o.by) === 'founder' && Number(b.o.until) > Date.now()) return out({ ok: 0, error: 'founderlock' });   // a block set by the founder can only be lifted by the founder
    if (b) setRow('Bans', b.row, { msg: '', photo: '', until: '0' });
    return out({ ok: 1 });
  },
  listbans(d) {                                            // admin or founder: the blocks that are still running
    const st = adminState(d.key); if (st !== 'ok') return out({ ok: 0, error: st });   // admin OR founder
    const now = Date.now(), me = role(d.key), list = rows('Bans').filter(r => Number(r.until) > now && (String(r.msg) === '1' || String(r.photo) === '1'))
      .map(r => ({ dev: String(r.dev), msg: String(r.msg) === '1', photo: String(r.photo) === '1', from: Number(r.from) || 0, until: Number(r.until), label: String(r.label || ''), locked: me !== 'founder' && String(r.by) === 'founder' ? 1 : 0 }))   // locked = set by the founder, so this staff member can not lift it
      .sort((a, b) => a.until - b.until);
    return out({ ok: 1, now: now, bans: list });
  },
  msglock(d) {                                             // admin or founder: pause / resume messages from visitors (staff can still post)
    const s = adminState(d.key); if (s !== 'ok') return out({ ok: 0, error: s });
    const on = d.on === true || d.on === 1 || d.on === '1';
    setLock(on);
    return out({ ok: 1, locked: on ? 1 : 0 });             // not a patch, so the cached public data is rebuilt on the next read
  },
  pinmsg(d) {                                              // admin: pin a message to the top of the wall / unpin it (pinning one un-pins the others). Cannot change anyone's name or text
    const s = adminState(d.key); if (s !== 'ok') return out({ ok: 0, error: s });
    const m = find('Messages', 'id', clean(d.id, 40)); if (!m) return out({ ok: 0, error: 'nomsg' });
    if (d.pin) {                                           // only one pinned message: clear the pin column first
      const t = tab('Messages'), c = heads(t).indexOf('pin'), lr = t.getLastRow();
      if (c >= 0 && lr > 1) txt(t.getRange(2, c + 1, lr - 1, 1)).setValues(new Array(lr - 1).fill(['']));
    }
    setRow('Messages', m.row, { pin: d.pin ? '1' : '' });
    return out({ ok: 1 });                                 // the cached public data is rebuilt automatically after a write that does not patch it
  },
  delete(d) {                                              // admin: delete a photo or a message
    const s = adminState(d.key); if (s !== 'ok') return out({ ok: 0, error: s });
    const photo = d.type === 'photo', id = String(d.id);
    const gone = dropRows(photo ? 'Photos' : 'Messages', x => String(x.id) === id);
    if (photo) {
      gone.forEach(x => { trashFile(x.fileId); String(x.more || '').split(',').forEach(f => trashFile(f.trim())); });      // every picture of a carousel post
      if (gone.length) { dropRows('MsgState', x => String(x.msg) === id); recount(); }                                      // its likes go with it
    } else if (gone.length) {
      dropRows('MsgState', x => String(x.msg) === id);   // its reactions go with it ...
      recount();                                             // ... and the totals are rebuilt (taps still waiting for it in the inbox are dropped by the next fold)
    }
    return out({ ok: 1 });
  }
};

/* ---------- maintenance: run these from the Apps Script editor (select the function, press Run, then View > Logs) ---------- */
function diagnose() {                                   // read-only: shows what the reactions look like inside the sheet, and the last server error
  const L = []; const say = s => { L.push(s); Logger.log(s); };
  const ids = msgOrder().ids, pids = photoOrder(), idSet = validIds();
  say('Messages: ' + ids.length + ' rows · Photo posts: ' + pids.length + ' rows (both can hold reactions / likes)');
  const sh = n => book().getSheetByName(n), rowsOf = t => t ? Math.max(0, t.getLastRow() - 1) : 'MISSING';
  const mrT = sh('MsgState'), cT = sh('MsgCounts'), iT = sh('MsgInbox'), sT = sh('Settings');
  say('Tabs: MsgState=' + rowsOf(mrT) + ' rows, MsgCounts=' + rowsOf(cT) + ' rows, MsgInbox=' + rowsOf(iT) + ' waiting. Old tabs (read only): MsgReactions=' + (sh('MsgReactions') ? rowsOf(sh('MsgReactions')) : 'none') + ', MsgReactionsOld=' + (sh('MsgReactionsOld') ? rowsOf(sh('MsgReactionsOld')) : 'none'));
  const f = sT ? find('Settings', 'key', 'mr6') : null; say('Old reaction recovery imported (Settings mr6): ' + (f ? f.o.value : 'NOT YET'));
  const warn = []; ['MsgState', 'MsgCounts', 'MsgInbox'].forEach(n => { const t = sh(n); if (!t) return; try { const dv = t.getRange(2, 1, Math.max(1, Math.min(t.getMaxRows() - 1, 200)), Math.max(1, t.getLastColumn())).getDataValidations(); if (dv.some(r => r.some(x => x))) warn.push(n); } catch (e) {} });
  if (warn.length) say('WARNING: these tabs have dropdown / validation rules: ' + warn.join(', ') + '. Select the tab, Data > Data validation > Remove all. (A Google Sheets "Table" on them can also block writes: right-click it > Convert to range.)');
  let st = [];
  if (mrT && mrT.getLastRow() > 1) {
    st = mrT.getRange(2, 1, mrT.getLastRow() - 1, 4).getValues();
    let good = 0, known = 0, odd = 0; const msgs = {};
    st.forEach(r => { if (MSG_EMO.indexOf(String(r[2])) >= 0) good++; if (idSet[String(r[0])]) { known++; msgs[String(r[0])] = 1; } if (typeof r[0] !== 'string' || typeof r[1] !== 'string') odd++; });
    say('MsgState: ' + good + ' live reactions, ' + known + ' rows point to a message that exists (' + Object.keys(msgs).length + ' different messages), ' + (st.length - known) + ' rows point to a message that does NOT exist, ' + odd + ' rows have a non-text id (should be 0)');
    say('First 3 rows: ' + JSON.stringify(st.slice(0, 3)));
  }
  const want = tallies(st.map(r => [String(r[0]), String(r[1]), String(r[2] || '')]), idSet), have = readCounts();
  let diff = 0; Object.keys(want).concat(Object.keys(have)).filter((k, i, a) => a.indexOf(k) === i).forEach(k => { const n = o => MSG_EMO.map(e => (o && o[e]) || 0).join(','); if (n(want[k]) !== n(have[k])) diff++; });
  say('MsgCounts matches the reactions? ' + (diff ? 'NO: ' + diff + ' messages differ (run repair())' : 'yes'));
  if (iT && iT.getLastRow() > 1) say('Inbox waiting: ' + (iT.getLastRow() - 1) + ' tap(s). First: ' + iT.getRange(2, 1).getValue());
  const c = cache(), mp = metaOf(c.get('b_pub')), mm = metaOf(c.get('b_mr')); say('Cache: public data ' + (mp ? Math.round((Date.now() - mp.at) / 1000) + ' s old' : 'empty') + ', reaction totals ' + (mm ? 'present' : 'empty'));
  let le = ''; try { le = PropertiesService.getScriptProperties().getProperty('lastErr') || ''; } catch (e) {}
  say('Last server error: ' + (le || 'none recorded'));
  return L.join('\n');
}
function compactState() {                              // MsgState back to ONE row per (message, device): the last row of a pair wins, removed / unknown reactions go. Fixes a tab restored from an old copy (version history)
  const t = tab('MsgState'), lr = t.getLastRow(); if (lr < 2) return 0;
  const v = t.getRange(2, 1, lr - 1, 4).getValues(), last = {}, order = [];
  v.forEach(r => { const k = String(r[0]) + '|' + String(r[1]); if (!(k in last)) order.push(k); last[k] = [String(r[0]), String(r[1]), String(r[2] || ''), String(r[3] || '')]; });
  const ok = validIds();
  const keep = order.map(k => last[k]).filter(r => MSG_EMO.indexOf(r[2]) >= 0 && DEV_RE.test(r[1]) && ok[r[0]]);
  t.getRange(2, 1, lr - 1, 4).clearContent();
  if (keep.length) txt(t.getRange(2, 1, keep.length, 4)).setValues(keep);
  return keep.length;
}
function repair() {                                     // rebuilds the totals from the reactions in the sheet and applies anything waiting. Safe to run any time.
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { cache().remove('mr6ok'); migrateOnce(); const imp = importLegacy(), n = compactState(); fold(); recount(); bump(); Logger.log('Repaired: ' + imp + ' old reactions imported, ' + n + ' reactions kept. Run diagnose() to check.'); } finally { lock.releaseLock(); }
}
