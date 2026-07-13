(function () {
  var debug = new URLSearchParams(location.search).get('debug') === '1';
  var seen = {};

  function say(message) {
    if (!debug) return;
    var text = '[probe] ' + message;
    if (window.__mobileDebugLog) window.__mobileDebugLog(text);
    if (window.__bootStatus) window.__bootStatus(text);
    try {
      (console.__nativeLog || console.log).call(console, text);
    } catch (err) {}
  }

  function once(key, message) {
    if (seen[key]) return;
    seen[key] = true;
    say(message);
  }

  window.addEventListener('error', function (event) {
    say('error: ' + (event.message || 'unknown'));
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    say('promise: ' + (reason && (reason.message || reason.stack) || reason));
  });

  var started = Date.now();
  var timer = setInterval(function () {
    if (window.YT) once('yt', 'YT ready');
    if (window.YT && window.YT.game) once('game', 'YT.game ready');
    if (window.YT && window.YT.logic) once('logic', 'YT.logic ready');
    if (window.YTCommon) once('ytcommon', 'YTCommon ready');
    if (document.querySelector('canvas')) once('canvas', 'canvas present');
    if (Date.now() - started > 45000) clearInterval(timer);
  }, 500);

  say('probe loaded');
})();
