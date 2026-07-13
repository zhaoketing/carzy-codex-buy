
(function () {
    function isMobile() {
        if (getBrowserName() === 'WeChat') return true; // 微信内置浏览器强制开启适配
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return true;
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
        return false;
    }
    if (isMobile()) return;

    var devices = [
        { name: '设计分辨率', w: 750, h: 1334 },  // 9:16（默认）
        { name: '全屏', w: 0, h: 0 },             // 填满视窗（按真实视口尺寸）
        { name: 'iPhone SE', w: 375, h: 667 },  // 9:16
        { name: 'iPhone 12/13', w: 390, h: 844 },  // 9:19.5
        { name: 'iPhone 15', w: 393, h: 852 },  // 主流旗舰尺寸
        { name: 'iPhone 14 Pro Max', w: 430, h: 932 },
        { name: 'Samsung S24 Ultra', w: 412, h: 915 },  // 主流安卓旗舰
        { name: 'Xiaomi 14', w: 393, h: 852 },
        { name: 'Huawei Mate 60 Pro', w: 392, h: 852 },
        { name: 'OPPO Find X7', w: 412, h: 919 },
        { name: 'iPad mini 6', w: 744, h: 1133 },
        { name: 'iPad Pro', w: 1024, h: 1366 }
    ];

    var currentDevice = null;

    /* ── 劫持 window.innerWidth / innerHeight ────────────────────────────
       同时覆盖宽高 getter，让 Cocos 的 _resizeFrame 拿到按设备比例裁剪后
       的尺寸，而不是真实窗口尺寸。无论浏览器如何缩放，GameDiv 长宽比
       始终与所选分辨率保持一致。
    ────────────────────────────────────────────────────────────────────── */
    var _customWidth = null;
    var _customHeight = null;
    /* 某些浏览器属性在 window 实例而非 Window.prototype 上，先查 prototype，
       再查实例，都没有则 desc 为 null，回退到 screen 尺寸。              */
    var _origWidthDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'innerWidth')
        || Object.getOwnPropertyDescriptor(window, 'innerWidth')
        || null;
    var _origHeightDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'innerHeight')
        || Object.getOwnPropertyDescriptor(window, 'innerHeight')
        || null;

    function _realInnerWidth() { return _origWidthDesc ? _origWidthDesc.get.call(window) : screen.width; }
    function _realInnerHeight() { return _origHeightDesc ? _origHeightDesc.get.call(window) : screen.height; }

    Object.defineProperty(window, 'innerWidth', {
        get: function () {
            if (_customWidth !== null) return _customWidth;
            return _realInnerWidth();
        },
        configurable: true
    });
    Object.defineProperty(window, 'innerHeight', {
        get: function () {
            if (_customHeight !== null) return _customHeight;
            return _realInnerHeight();
        },
        configurable: true
    });

    /* 在真实视口内，按设备宽高比做 contain 适配，返回 { w, h } */
    function calcDimensions(device) {
        var realW = _realInnerWidth();
        var realH = _realInnerHeight();
        if (device.name === '全屏') return { w: realW, h: realH };
        var ratio = device.w / device.h;
        var w, h;
        if (realW / realH >= ratio) {
            // 视口比游戏更宽：以高度为准，两侧留黑边
            h = realH;
            w = Math.round(h * ratio);
        } else {
            // 视口比游戏更窄：以宽度为准，上下留黑边
            w = realW;
            h = Math.round(w / ratio);
        }
        return { w: w, h: h };
    }

    /* 窗口真实 resize 时同步更新 _customWidth/_customHeight，
       保证 Cocos 自己的 resize 监听器触发时读到正确值             */
    window.addEventListener('resize', function () {
        if (currentDevice) {
            var dims = calcDimensions(currentDevice);
            _customWidth = dims.w;
            _customHeight = dims.h;
        }
    });

    function selectDevice(device, btn) {
        currentDevice = device;
        var dims = calcDimensions(device);
        _customWidth = dims.w;
        _customHeight = dims.h;

        /* 更新按钮高亮 */
        var btns = document.querySelectorAll('#__device_bar button');
        for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
        if (btn) btn.classList.add('active');

        /* 触发 Cocos _resizeFrame：引擎会读 window.innerWidth（已被我们劫持）
           并自动将 GameDiv 设为正确宽度，同时 margin:0 auto 居中            */
        window.dispatchEvent(new Event('resize'));

        try { localStorage.setItem('__desktop_device', device.name); } catch (e) { }
    }

    /* ── 样式 ── */
    var style = document.createElement('style');
    style.textContent = [
        '#__device_bar{',
        'position:fixed;left:12px;top:50%;transform:translateY(-50%);',
        'z-index:99999;display:flex;flex-direction:column;gap:8px;',
        'background:rgba(0,0,0,0.62);padding:10px 10px 12px;',
        'border-radius:20px;backdrop-filter:blur(8px);',
        'box-shadow:0 2px 14px rgba(0,0,0,0.45);',
        'user-select:none;-webkit-user-select:none;',
        '}',
        '#__device_bar_title{',
        'display:flex;align-items:center;justify-content:space-between;',
        'color:rgba(255,255,255,0.5);font-size:11px;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'letter-spacing:.5px;padding:2px 2px 6px;',
        'cursor:grab;border-bottom:1px solid rgba(255,255,255,0.12);margin-bottom:2px;',
        '}',
        '#__device_bar_title:active{cursor:grabbing;}',
        '#__device_bar_hide{',
        'cursor:pointer;color:rgba(255,255,255,0.35);font-size:14px;line-height:1;',
        'padding:0 2px;transition:color .15s;flex-shrink:0;',
        '}',
        '#__device_bar_hide:hover{color:rgba(255,255,255,0.8);}',
        '#__device_bar button{',
        'background:rgba(255,255,255,0.11);color:rgba(255,255,255,0.82);',
        'border:1px solid rgba(255,255,255,0.22);',
        'padding:6px 12px;border-radius:14px;cursor:pointer;',
        'font-size:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'transition:background .15s,color .15s;white-space:nowrap;outline:none;text-align:left;',
        '}',
        '#__device_bar button:hover{background:rgba(255,255,255,0.22);color:#fff;}',
        '#__device_bar button.active{',
        'background:rgba(55,150,255,0.52);',
        'border-color:rgba(55,150,255,0.85);color:#fff;',
        '}',
        /* GameDiv 居中：视口 overflow hidden，游戏区始终保持比例并居中 */
        'html,body{overflow:hidden!important;width:100%!important;height:100%!important;}',
        '#GameDiv{position:absolute!important;left:50%!important;top:50%!important;',
        'transform:translate(-50%,-50%)!important;margin:0!important;}',
        /* 展开按钮：面板隐藏时显示 */
        '#__device_bar_show{',
        'position:fixed;left:0;top:50%;transform:translateY(-50%);',
        'z-index:99999;display:none;',
        'background:rgba(0,0,0,0.62);backdrop-filter:blur(8px);',
        'color:rgba(255,255,255,0.7);font-size:13px;',
        'padding:10px 7px;border-radius:0 10px 10px 0;',
        'cursor:pointer;box-shadow:2px 0 10px rgba(0,0,0,0.4);',
        'writing-mode:vertical-rl;letter-spacing:3px;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'user-select:none;-webkit-user-select:none;',
        'transition:background .15s,color .15s;',
        '}',
        '#__device_bar_show:hover{background:rgba(0,0,0,0.82);color:#fff;}',
        '#__device_bar_browser{',
        'color:rgba(255,255,255,0.9);font-size:12px;font-weight:600;text-align:center;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'padding:2px 4px 6px;border-bottom:1px solid rgba(255,255,255,0.12);',
        'margin-bottom:2px;letter-spacing:.5px;',
        '}',
        /* 操作说明（折叠标签） */
        '#__device_bar_tips{',
        'color:rgba(255,255,255,0.55);font-size:11px;line-height:1.2;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'padding:8px 4px 2px;margin-top:4px;',
        'border-top:1px solid rgba(255,255,255,0.12);',
        'text-align:center;cursor:help;letter-spacing:.5px;',
        'transition:color .15s;',
        '}',
        '#__device_bar_tips:hover{color:rgba(255,255,255,0.9);}',
        /* 放大说明浮层 */
        '#__device_bar_tips_pop{',
        'position:fixed;z-index:100000;display:none;',
        'background:rgba(20,20,24,0.96);backdrop-filter:blur(10px);',
        'color:rgba(255,255,255,0.92);font-size:14px;line-height:1.85;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'padding:16px 20px;border-radius:14px;',
        'border:1px solid rgba(255,255,255,0.18);',
        'box-shadow:0 8px 32px rgba(0,0,0,0.55);',
        'max-width:340px;letter-spacing:.3px;',
        'pointer-events:none;',
        'opacity:0;transform:scale(0.92);',
        'transition:opacity .18s ease,transform .18s ease;',
        '}',
        '#__device_bar_tips_pop.show{opacity:1;transform:scale(1);}',
        '#__device_bar_tips_pop h4{',
        'margin:0 0 10px;font-size:15px;font-weight:600;',
        'color:#fff;letter-spacing:1px;',
        'padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.15);',
        '}',
        '#__device_bar_tips_pop b{color:#7fc4ff;font-weight:600;}'
    ].join('');
    document.head.appendChild(style);

    /* ── 浏览器检测 ── */
    function getBrowserName() {
        var ua = navigator.userAgent;
        if (/Edg\//.test(ua)) return 'Edge';
        if (/OPR\/|Opera/.test(ua)) return 'Opera';
        if (/SamsungBrowser/.test(ua)) return 'Samsung Browser';
        if (/UCBrowser/.test(ua)) return 'UC Browser';
        if (/QQBrowser/.test(ua)) return 'QQ Browser';
        if (/MicroMessenger/.test(ua)) return 'WeChat';
        if (/BIDUBrowser|baidubrowser/i.test(ua)) return 'Baidu Browser';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/Chrome\//.test(ua)) return 'Chrome';
        if (/Safari\//.test(ua)) return 'Safari';
        return 'Browser';
    }

    /* ── 工具栏 ── */
    var bar = document.createElement('div');
    bar.id = '__device_bar';

    /* 浏览器名称（拖动区域顶部） */
    var browserLabel = document.createElement('div');
    browserLabel.id = '__device_bar_browser';
    browserLabel.textContent = getBrowserName();
    bar.appendChild(browserLabel);

    /* 标题（拖动把手） */
    var titleEl = document.createElement('div');
    titleEl.id = '__device_bar_title';
    var titleText = document.createElement('span');
    titleText.textContent = '屏幕适配';
    var hideBtn = document.createElement('span');
    hideBtn.id = '__device_bar_hide';
    hideBtn.textContent = 'x';
    hideBtn.title = '收起';
    titleEl.appendChild(titleText);
    titleEl.appendChild(hideBtn);
    bar.appendChild(titleEl);

    /* 展开按钮（面板收起时显示） */
    var showPanel = document.createElement('div');
    showPanel.id = '__device_bar_show';
    showPanel.textContent = '屏幕适配';
    showPanel.title = '点击展开面板';
    document.body.appendChild(showPanel);

    var savedName = '';
    try { savedName = localStorage.getItem('__desktop_device') || ''; } catch (e) { }
    var defaultDevice = devices[0];
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].name === savedName) { defaultDevice = devices[i]; break; }
    }
    /* 全屏存档但视窗为横向（宽 > 高）时，回退到设计分辨率，避免画面被严重拉伸 */
    if (defaultDevice.name === '全屏' && _realInnerWidth() > _realInnerHeight()) {
        for (var j = 0; j < devices.length; j++) {
            if (devices[j].name === '设计分辨率') { defaultDevice = devices[j]; break; }
        }
        try { localStorage.setItem('__desktop_device', defaultDevice.name); } catch (e) { }
    }

    devices.forEach(function (device) {
        var btn = document.createElement('button');
        btn.textContent = device.name;
        btn.title = '切换到 ' + device.name + ' (' + device.w + '×' + device.h + ')，将自动刷新页面';
        btn.addEventListener('click', function () {
            selectDevice(device, btn);
            window.location.reload();
        });
        bar.appendChild(btn);
    });

    /* 操作说明（折叠标签 + 悬停浮层） */
    var tipsEl = document.createElement('div');
    tipsEl.id = '__device_bar_tips';
    tipsEl.textContent = '操作说明 ⓘ';
    bar.appendChild(tipsEl);

    var tipsPop = document.createElement('div');
    tipsPop.id = '__device_bar_tips_pop';
    tipsPop.innerHTML = [
        '<h4>操作说明</h4>',
        '· 点击设备名：<b>切换分辨率</b>（页面会自动刷新）<br>',
        '· 按住标题栏拖动：<b>移动面板</b>位置<br>',
        '· 点击右上 <b>—</b>：<b>收起</b>面板<br>',
        '· 收起后将鼠标移至屏幕<b>左侧边缘</b>停留 <b>1 秒</b>：展开<br>',
        '· 展开后离开 <b>2 秒</b>自动收起<br>',
        '· 按键盘 <b>P</b> 键：随时切换面板显隐'
    ].join('');
    document.body.appendChild(tipsPop);

    document.body.appendChild(bar);

    /* 悬停 0.25s 后弹出，跟随鼠标显示在右侧；离开立即收起 */
    var _tipsShowTimer = null;
    var _lastMouseX = 0, _lastMouseY = 0;
    function _positionTipsPop(mx, my) {
        var popW = tipsPop.offsetWidth;
        var popH = tipsPop.offsetHeight;
        var GAP = 16; // 与鼠标的距离
        // 默认在鼠标右侧，垂直方向以鼠标为中心
        var left = mx + GAP;
        var top = my - popH / 2;
        // 右侧空间不足：翻到鼠标左侧
        // if (left + popW > window.innerWidth - 8) left = mx - GAP - popW;
        // 限制在视口内
        left = Math.max(8, left);
        top = Math.max(8, Math.min(top, window.innerHeight - popH - 8));
        tipsPop.style.left = left + 'px';
        tipsPop.style.top = top + 'px';
    }
    tipsEl.addEventListener('mouseenter', function (e) {
        _lastMouseX = e.clientX; _lastMouseY = e.clientY;
        if (_tipsShowTimer) clearTimeout(_tipsShowTimer);
        _tipsShowTimer = setTimeout(function () {
            tipsPop.style.display = 'block';
            // 先放到屏外测量尺寸，再定位，避免首帧闪到 (0,0)
            tipsPop.style.left = '-9999px';
            tipsPop.style.top = '-9999px';
            requestAnimationFrame(function () {
                _positionTipsPop(_lastMouseX, _lastMouseY);
                tipsPop.classList.add('show');
            });
        }, 250);
    });
    tipsEl.addEventListener('mousemove', function (e) {
        _lastMouseX = e.clientX; _lastMouseY = e.clientY;
        // 已显示则跟随鼠标
        if (tipsPop.classList.contains('show')) _positionTipsPop(e.clientX, e.clientY);
    });
    tipsEl.addEventListener('mouseleave', function () {
        if (_tipsShowTimer) { clearTimeout(_tipsShowTimer); _tipsShowTimer = null; }
        tipsPop.classList.remove('show');
        // 等过渡结束再 display:none，避免突兀
        setTimeout(function () {
            if (!tipsPop.classList.contains('show')) tipsPop.style.display = 'none';
        }, 200);
    });

    /* ── 拖动逻辑 ── */
    (function () {
        var dragging = false, ox = 0, oy = 0;
        /* 初始定位：用 top/left 绝对值替换 transform，方便拖动计算 */
        function initPos() {
            var r = bar.getBoundingClientRect();
            bar.style.transform = 'none';
            bar.style.left = r.left + 'px';
            bar.style.top = r.top + 'px';
        }
        titleEl.addEventListener('mousedown', function (e) {
            if (bar.style.transform !== 'none') initPos();
            dragging = true;
            ox = e.clientX - bar.getBoundingClientRect().left;
            oy = e.clientY - bar.getBoundingClientRect().top;
            e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var nx = e.clientX - ox;
            var ny = e.clientY - oy;
            /* 限制在视口内 */
            nx = Math.max(0, Math.min(nx, window.innerWidth - bar.offsetWidth));
            ny = Math.max(0, Math.min(ny, window.innerHeight - bar.offsetHeight));
            bar.style.left = nx + 'px';
            bar.style.top = ny + 'px';
            try { localStorage.setItem('__bar_pos', nx + ',' + ny); } catch (e) { }
        });
        document.addEventListener('mouseup', function () { dragging = false; });
        /* 恢复上次拖动位置 */
        try {
            var pos = localStorage.getItem('__bar_pos');
            if (pos) {
                var p = pos.split(',');
                bar.style.transform = 'none';
                bar.style.left = p[0] + 'px';
                bar.style.top = p[1] + 'px';
            }
        } catch (e) { }
    })();

    /* ── 收起 / 展开逻辑 ── */
    /* 最小化时 showPanel 隐藏；鼠标在左侧驻留 1s 才显示；离开后 2s 自动隐藏 */
    var HOVER_EDGE_PX = 20;       // 左侧热区宽度
    var SHOW_DELAY_MS = 1000;     // 驻留多久后显示
    var AUTO_HIDE_MS = 2000;     // 不驻留多久后隐藏
    var _showTimer = null;        // 等待显示计时器
    var _hideTimer = null;        // 自动隐藏计时器
    var _isMinimized = false;     // 当前是否处于最小化状态

    function _clearShowTimer() { if (_showTimer) { clearTimeout(_showTimer); _showTimer = null; } }
    function _clearHideTimer() { if (_hideTimer) { clearTimeout(_hideTimer); _hideTimer = null; } }

    function _scheduleAutoHide() {
        _clearHideTimer();
        _hideTimer = setTimeout(function () {
            if (_isMinimized) showPanel.style.display = 'none';
        }, AUTO_HIDE_MS);
    }

    function hideBar() {
        _isMinimized = true;
        bar.style.display = 'none';
        showPanel.style.display = 'none';
        _clearShowTimer();
        _clearHideTimer();
        try { localStorage.setItem('__bar_hidden', '1'); } catch (e) { }
    }
    function showBar() {
        _isMinimized = false;
        bar.style.display = 'flex';
        showPanel.style.display = 'none';
        _clearShowTimer();
        _clearHideTimer();
        try { localStorage.removeItem('__bar_hidden'); } catch (e) { }
    }
    hideBtn.addEventListener('mousedown', function (e) { e.stopPropagation(); }); // 阻止触发拖动
    hideBtn.addEventListener('click', function (e) { e.stopPropagation(); hideBar(); });
    showPanel.addEventListener('click', showBar);

    /* 监听鼠标移动：仅在最小化状态下生效
       用 capture 阶段挂在 window 上，避免被 Cocos canvas 的 stopPropagation 吞掉
       （全屏时 GameDiv 铺满视口，引擎会拦截 mousemove） */
    function _onEdgeMove(e) {
        if (!_isMinimized) return;
        var inEdge = e.clientX <= HOVER_EDGE_PX;
        var visible = showPanel.style.display === 'block';

        if (inEdge) {
            // 已经显示：刷新自动隐藏倒计时
            if (visible) {
                _clearHideTimer();
                return;
            }
            // 未显示：启动驻留计时器（已存在则不重置，保持连续驻留）
            if (!_showTimer) {
                _showTimer = setTimeout(function () {
                    _showTimer = null;
                    if (_isMinimized) {
                        showPanel.style.display = 'block';
                        _scheduleAutoHide();
                    }
                }, SHOW_DELAY_MS);
            }
        } else {
            // 离开热区：取消未触发的显示计时
            _clearShowTimer();
            // 若已显示，启动自动隐藏倒计时（已在跑则不重置）
            if (visible && !_hideTimer) _scheduleAutoHide();
        }
    }
    window.addEventListener('mousemove', _onEdgeMove, true);
    window.addEventListener('pointermove', _onEdgeMove, true);

    /* 键盘快捷键：P 键切换面板显隐（capture 阶段，避免被 Cocos 吞掉） */
    window.addEventListener('keydown', function (e) {
        if (e.key !== 'p' && e.key !== 'P') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        // 在输入控件中按 P 不触发
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (_isMinimized) showBar(); else hideBar();
        e.preventDefault();
        e.stopPropagation();
    }, true);

    /* 恢复上次收起状态 */
    try { if (localStorage.getItem('__bar_hidden')) hideBar(); } catch (e) { }

    /* 预设 _customWidth/_customHeight（Cocos 初始化时也会读这两个值） */
    var defaultBtn = bar.querySelectorAll('button')[devices.indexOf(defaultDevice)];
    var _initDims = calcDimensions(defaultDevice);
    _customWidth = _initDims.w;
    _customHeight = _initDims.h;
    /* 高亮按钮，等 Cocos 就绪后再触发一次 resize 让引擎真正应用尺寸 */
    var btns = bar.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (defaultBtn) defaultBtn.classList.add('active');

    /* Cocos 通过 System.import 异步加载，用 requestAnimationFrame 轮询
       等引擎完成初始化后触发一次 resize                                  */
    var _applyTries = 0;
    function tryApply() {
        _applyTries++;
        window.dispatchEvent(new Event('resize'));
        if (_applyTries < 8) requestAnimationFrame(tryApply);

    }
    requestAnimationFrame(tryApply);

})(); 