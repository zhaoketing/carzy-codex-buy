(function () {
  var started = Date.now();
  var wrapped = {};

  function say(message) {
    var text = '[runtime] ' + message;
    if (window.__mobileDebugLog) window.__mobileDebugLog(text);
    if (window.__bootStatus) window.__bootStatus(text);
    try {
      (console.__nativeLog || console.log).call(console, text);
    } catch (err) {}
  }

  function wrap(obj, name, label, after) {
    if (!obj || typeof obj[name] !== 'function' || obj[name].__mobileWrapped) return;
    var original = obj[name];
    var wrappedFn = function () {
      say(label + ' start');
      var result;
      try {
        result = original.apply(this, arguments);
      } catch (err) {
        say(label + ' throw: ' + (err && err.message || err));
        throw err;
      }
      return Promise.resolve(result).then(function (value) {
        if (after) after(value);
        say(label + ' done');
        return value;
      }, function (err) {
        say(label + ' fail: ' + (err && err.message || err));
        throw err;
      });
    };
    wrappedFn.__mobileWrapped = true;
    obj[name] = wrappedFn;
  }

  function patch() {
    if (window.YT && window.YT.config && window.YT.config.game) {
      window.YT.config.game.server_config = window.YT.config.game.server_config || {
        save_internal: 180,
        save_rate: 0
      };
    }

    if (window.YT && window.YT.sdk) {
      window.YT.sdk.canUseCloudStorage = false;
    }

    if (window.YT && window.YT.platform) {
      if (!wrapped.platform) {
        wrapped.platform = true;
        say('platform patch ready');
      }
      window.YT.platform.getCloudStorage = function () {
        say('cloud storage bypass');
        return Promise.resolve(null);
      };
      window.YT.platform.setCloudStorage = function () {
        say('cloud storage save bypass');
      };
      wrap(window.YT.platform, 'getLocalStorage', 'getLocalStorage');
      wrap(window.YT.platform, 'setLocalStorage', 'setLocalStorage');
      wrap(window.YT.platform, 'reportEvent', 'reportEvent');
    }

    if (window.YT && window.YT.game) {
      wrap(window.YT.game, 'startGame', 'YT.game.startGame');
    }

    if (window.YT && window.YT.logic) {
      wrap(window.YT.logic, 'changeState', 'YT.logic.changeState', function () {
        if (window.__hideBootStatus) window.__hideBootStatus();
      });
    }

    if (window.YTCommon && window.YTCommon.platform) {
      wrap(window.YTCommon.platform, 'initPlatform', 'YTCommon.platform.initPlatform', function () {
        if (window.YT && window.YT.sdk) window.YT.sdk.canUseCloudStorage = false;
      });
      wrap(window.YTCommon.platform, 'onSeverConnected', 'YTCommon.platform.onSeverConnected');
    }
  }

  window.addEventListener('error', function (event) {
    say('error: ' + (event.message || 'unknown'));
  }, true);

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    say('promise: ' + (reason && (reason.message || reason.stack) || reason));
  });

  var timer = setInterval(function () {
    patch();
    if (Date.now() - started > 60000) clearInterval(timer);
  }, 100);

  say('patch loaded');
})();
