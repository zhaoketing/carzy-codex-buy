System.register(["./application.47f5c.js?v=20260714-0008"], function (_export, _context) {
  "use strict";

  var Application, canvas, $p, bcr, application;
  function topLevelImport(url) {
    return System["import"](url);
  }
  function bootLog(message) {
    if (window.__bootStatus) window.__bootStatus(message);
    if (window.__mobileDebugLog) window.__mobileDebugLog(message);
  }
  function waitForCanvasSize(callback) {
    var tries = 0;
    function tick() {
      tries++;
      bcr = $p.getBoundingClientRect();
      if (bcr.width > 0 && bcr.height > 0 || tries >= 30) {
        canvas.width = Math.max(1, Math.round(bcr.width || window.innerWidth || document.documentElement.clientWidth || 375));
        canvas.height = Math.max(1, Math.round(bcr.height || window.innerHeight || document.documentElement.clientHeight || 667));
        bootLog('canvas ready: ' + canvas.width + 'x' + canvas.height);
        callback();
        return;
      }
      if (tries === 1 || tries === 10 || tries === 20) {
        bootLog('waiting for canvas size: ' + Math.round(bcr.width) + 'x' + Math.round(bcr.height));
      }
      requestAnimationFrame(tick);
    }
    tick();
  }
  return {
    setters: [function (_applicationJs) {
      Application = _applicationJs.Application;
    }],
    execute: function () {
      canvas = document.getElementById('GameCanvas');
      $p = canvas.parentElement;
      waitForCanvasSize(function () {
        application = new Application();
        bootLog('loading Cocos engine');
        topLevelImport('cc').then(function (engine) {
          bootLog('Cocos engine loaded');
          return application.init(engine);
        }).then(function () {
          bootLog('starting game');
          return application.start();
        }).then(function () {
          bootLog('game started');
          if (window.__hideBootStatus) window.__hideBootStatus();
        })["catch"](function (err) {
          bootLog('BOOT ERROR: ' + (err && (err.stack || err.message) || err));
          console.error(err);
        });
      });
    }
  };
});
