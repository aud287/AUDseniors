/* ===================== Google sign-in (Firebase Authentication) =====================
   Browsing the site never needs an account. Only WRITING a message / UPLOADING a photo needs a Google account.
   • Nothing is loaded or required while  SITE.firebase  in config.js is empty -> the site behaves exactly as before (AUTH.on = false).
   • The Firebase SDK is loaded after the page has finished loading, so it can never slow down or break the page. If it cannot load, the site keeps working (only posting is affected).
   • Firebase keeps the visitor signed in (browser storage), so they sign in once and are never asked again until they sign out.
   Setup: FIREBASE_SETUP.md */
(function () {
  var C = (window.SITE && window.SITE.firebase) || {};
  var on = !!(C.apiKey && C.authDomain && C.projectId);
  var VER = '10.14.1', BASE = 'https://www.gstatic.com/firebasejs/' + VER + '/';
  var auth = null, cur = null, ready = false, waiters = [], listeners = [], lastError = null, started = false;

  var ua = navigator.userAgent || '';
  /* Google refuses to sign people in inside the browsers embedded in Facebook / Instagram / Messenger / TikTok ... ("disallowed_useragent") */
  var inApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|TikTok|musical_ly|Snapchat|MicroMessenger|Line\/|; wv\)/i.test(ua);

  function fire() { listeners.forEach(function (f) { try { f(cur); } catch (e) {} }); }
  function settle() { if (ready) return; ready = true; var w = waiters; waiters = []; w.forEach(function (f) { f(); }); }
  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.async = false; s.crossOrigin = 'anonymous';
      s.onload = res; s.onerror = function () { rej(new Error('load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function start() {
    if (!on || started) return; started = true;
    load(BASE + 'firebase-app-compat.js').then(function () { return load(BASE + 'firebase-auth-compat.js'); }).then(function () {
      var app = firebase.apps.length ? firebase.app() : firebase.initializeApp({ apiKey: C.apiKey, authDomain: C.authDomain, projectId: C.projectId, appId: C.appId || undefined });
      auth = app.auth();
      try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function () {}); } catch (e) {}
      try { auth.useDeviceLanguage(); } catch (e) {}
      auth.onAuthStateChanged(function (u) { cur = u || null; settle(); fire(); }, function (e) { lastError = e; settle(); });
      try { auth.getRedirectResult().catch(function (e) { lastError = e; }); } catch (e) {}
    }).catch(function (e) { lastError = { code: 'sdk', message: String(e && e.message || e) }; settle(); });
    setTimeout(settle, 9000);     // never wait for ever for the first answer
  }
  function whenReady() { return ready ? Promise.resolve() : new Promise(function (r) { waiters.push(r); start(); }); }

  var AUTH = {
    on: on,
    inApp: inApp,
    get lastError() { return lastError; },
    user: function () { return cur; },
    info: function () { return cur ? { uid: cur.uid, name: cur.displayName || '', email: cur.email || '', photo: cur.photoURL || '' } : null; },
    whenReady: whenReady,
    onChange: function (f) { listeners.push(f); if (ready) { try { f(cur); } catch (e) {} } },
    /* Opens the Google popup (or returns the saved account at once). Resolves to the user, or null when cancelled / impossible: AUTH.lastError says why. */
    signIn: function () {
      lastError = null;
      if (!on) return Promise.resolve(null);
      if (cur) return Promise.resolve(cur);
      return whenReady().then(function () {
        if (cur) return cur;
        if (inApp) { lastError = { code: 'inapp' }; return null; }
        if (!auth) { if (!lastError) lastError = { code: 'sdk' }; return null; }
        var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
        return auth.signInWithPopup(p).then(function (r) { if (r && r.user) { cur = r.user; fire(); } return r && r.user || null; }).catch(function (e) {
          var c = e && e.code;
          if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') {
            try { auth.signInWithRedirect(p); lastError = { code: 'redirect' }; return null; } catch (x) {}
          }
          if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' || c === 'auth/user-cancelled') lastError = { code: 'cancel' };
          else lastError = e || { code: 'unknown' };
          return null;
        });
      });
    },
    signOut: function () { return auth ? auth.signOut().catch(function () {}) : Promise.resolve(); },
    /* a fresh ID token for the backend (Firebase renews it by itself; force = ask for a brand-new one) */
    token: function (force) { return cur ? cur.getIdToken(!!force).catch(function () { return ''; }) : Promise.resolve(''); }
  };
  window.AUTH = AUTH;

  if (on) {
    /* start after the page is fully loaded (so the SDK never competes with the first paint), and a little later if the browser is busy */
    var go = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 300); })(start, { timeout: 2500 }); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go);
  }
})();
