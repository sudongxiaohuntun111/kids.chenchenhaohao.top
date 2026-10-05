/* =====================================================
   小红军长征记 2.0 · 小游戏渲染框架（P0b2）
   - renderDanger(container, stationData, engine)：按
     stationData.interactive.type 分发到已注册玩法。
   - 已注册玩法返回 DOM 并挂到 container；未匹配 / TODO
     显示占位卡。
   - 玩法内只做「完成判定」，通关点亮仍由 main.js 玩家点击。
     红线：无数字进度、无失败画面、无死亡表述、中文。
   ===================================================== */

(function (global) {
  "use strict";

  /* 简单节点构造（games.js 先于 main.js 加载，自带辅助） */
  function h(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function placeholder(type) {
    var box = h("div", "game-placeholder");
    box.appendChild(h("div", "game-placeholder-icon", "🧩"));
    box.appendChild(h("div", "game-placeholder-text",
      (type && type !== "TODO") ? "这个玩法正在准备中。" : "玩法：待实现（P0b）"));
    return box;
  }

  /* 连接顺序顺水势校验：桥段号必须与缓流锚点号一致（1→5） */
  function fit(sel, n) { return sel === n; }

  /* ===================================================
     实时玩法共享框架（P2-action
     - rtCanvas(ht)：按容器宽度自适应、DPR 清晰的 canvas
     - rttMake(cfg)：回合制事件循环（RAF + dt + pointerdown），
       每帧 draw，点击 tap；win() 置完成并在根节点加 complete
       （main.js 的 watchCompletion 据此放行关卡门槛）。
     - 纯触屏，中文温和失败，循环在节点脱离 DOM 时自停。
     =================================================== */
  function rtCanvas(ht) {
    var cv = document.createElement("canvas");
    cv.className = "rt-canvas";
    cv.style.width = "100%";
    cv.style.height = (ht || 320) + "px";
    cv.style.touchAction = "none";
    cv.style.display = "block";
    return cv;
  }

  function rttMake(cfg) {
    var ht = cfg.height || 320;
    var cv = rtCanvas(ht);
    var wrap = h("div", "rt-wrap");
    if (cfg.tip) wrap.appendChild(h("div", "tip-bar", cfg.tip));
    wrap.appendChild(cv);
    var msg = h("div", "rt-msg", cfg.initialMsg || " ");
    wrap.appendChild(msg);
    var state = { t: 0, won: false, _last: 0, data: cfg.init ? cfg.init() : {} };
    var running = false;

    function ctx() { return cv.getContext("2d"); }

    function resizeNow() {
      var dpr = window.devicePixelRatio || 1;
      var w = cv.clientWidth || (cv.parentNode ? cv.parentNode.clientWidth : 0) || 320;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(ht * dpr);
      var c = ctx();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return w;
    }

    function loop(ts) {
      if (!cv.isConnected) { running = false; return; }
      if (!running) return;
      var dt = state._last ? Math.min(0.05, (ts - state._last) / 1000) : 0.016;
      state._last = ts;
      state.t += dt;
      var w = cv.clientWidth || cfg._lastW || 320;
      cfg._lastW = w;
      state._w = w;
      try {
        if (cfg.update) cfg.update(dt, state, w, ht, win);
        var c = ctx();
        c.clearRect(0, 0, w, ht);
        if (cfg.draw) cfg.draw(c, state, w, ht, ts / 1000);
      } catch (err) {
        if (!window.__rtErr) window.__rtErr = [];
        window.__rtErr.push(String(err && err.stack || err));
        /* 出错不弄死循环，继续下一帧 */
      }
      if (running) requestAnimationFrame(loop);
    }

    function say(txt, shake) {
      msg.textContent = txt;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    cv.addEventListener("pointerdown", function (e) {
      var r = cv.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (cfg.tap) cfg.tap(state, x, y, ctx(), say, win);
    });

    function win() {
      if (state.won) return;
      state.won = true;
      wrap.classList.add("complete");
      if (cfg.onWin) cfg.onWin(state, say);
    }

    wrap._reset = function () { state.won = false; state.t = 0; state._last = 0; if (cfg.init) state.data = cfg.init(); if (cfg.onReset) cfg.onReset(state); msg.textContent = cfg.initialMsg || " "; };
    wrap._say = say;
    wrap.__state = state;   /* 测试/调试钩子（无副作用） */
    wrap.__win = win;       /* 外部可控完成钩子 */

    requestAnimationFrame(function () {
      if (!cv.isConnected) return;
      resizeNow();
      running = true;
      requestAnimationFrame(loop);
    });
    return wrap;
  }

  /* 绘制小助手：圆弧/圆角矩形 */
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* ===================================================
     于都站 · 搭浮桥（经典：华容道滑块拼图）
     6 格板面放 5 块桥板(1..5)+1 空位；点击与空位相邻的桥板
     把它滑进空位；按 1→2→3→4→5 排好即“桥搭好”。
     初始从已排好乱序（保证可解）。触屏点格。
     =================================================== */
  function rtHuarongGame(stationData, engine) {
    var COLS = 2, ROWS = 3;                 /* 2x3 板面 */
    var SOLVED = [1, 2, 3, 4, 5, 0];        /* 0=空位 */
    var cfg = {
      height: 320,
      tip: "💡 点跟空位挨着的桥板，把它滑进去；排成 1 2 3 4 5 就搭好了",
      initialMsg: "华容道拼桥：把桥板滑到对的位置",
      init: function () {
        var b = SOLVED.slice();
        /* 随机打乱：做 60 次合法滑动，保证可解 */
        var blank = 5, moves = 0;
        while (moves < 60) {
          var nb = [];
          var r = Math.floor(blank / COLS), c = blank % COLS;
          if (r > 0) nb.push(blank - COLS);
          if (r < ROWS - 1) nb.push(blank + COLS);
          if (c > 0) nb.push(blank - 1);
          if (c < COLS - 1) nb.push(blank + 1);
          var pick = nb[Math.floor(Math.random() * nb.length)];
          b[blank] = b[pick]; b[pick] = 0; blank = pick;
          moves++;
        }
        return { b: b, blank: blank };
      },
      draw: function (c, s, W, H, t) {
        var d = s.data, b = d.b;
        var pad = 12, gap = 8;
        var cellW = (W - pad * 2 - gap * (COLS - 1)) / COLS;
        var cellH = (H - pad * 2 - gap * (ROWS - 1)) / ROWS;
        c.fillStyle = "#18324b"; c.fillRect(0, 0, W, H);
        for (var i = 0; i < b.length; i++) {
          var r = Math.floor(i / COLS), col = i % COLS;
          var x = pad + col * (cellW + gap), y = pad + r * (cellH + gap);
          if (b[i] === 0) continue;
          c.fillStyle = "#8a5a2b"; rr(c, x, y, cellW, cellH, 10); c.fill();
          c.fillStyle = "#d9a25a"; rr(c, x + 4, y + 4, cellW - 8, cellH - 8, 8); c.fill();
          c.fillStyle = "#4a2f1a"; c.font = "bold " + Math.round(cellH * 0.5) + "px sans-serif"; c.textAlign = "center";
          c.fillText("桥" + b[i], x + cellW / 2, y + cellH / 2 + cellH * 0.16);
          c.textAlign = "start";
        }
        var solved = d.b.join("") === SOLVED.join("");
        c.fillStyle = solved ? "#dff0d6" : "#ffd9a0"; c.font = "15px sans-serif"; c.textAlign = "center";
        c.fillText(solved ? "桥搭好了！" : "点空位旁边的桥板，滑进空位", W / 2, H - 4);
        c.textAlign = "start";
      },
      tap: function (s, x, y, ctx, say, win) {
        var d = s.data, b = d.b;
        var pad = 12, gap = 8;
        var W = s._w || 320, H = 320;
        var cellW = (W - pad * 2 - gap * (COLS - 1)) / COLS;
        var cellH = (H - pad * 2 - gap * (ROWS - 1)) / ROWS;
        var col = Math.floor((x - pad) / (cellW + gap));
        var r = Math.floor((y - pad) / (cellH + gap));
        if (col < 0 || col >= COLS || r < 0 || r >= ROWS) { say("点一下空位旁边的桥板。", true); return; }
        var idx = r * COLS + col;
        if (b[idx] === 0) { say("这是空位，点旁边的桥板。"); return; }
        var br = Math.floor(d.blank / COLS), bc = d.blank % COLS;
        var ad = Math.abs(br - r) + Math.abs(bc - col);
        if (ad === 1) {
          b[d.blank] = b[idx]; b[idx] = 0; d.blank = idx;
          if (b.join("") === SOLVED.join("")) { say("桥搭好了——桥板一块块拼到对岸！"); win(); }
          else say("好，这块桥板归位了。");
        } else {
          say("桥板得跟空位挨着才能滑，点空位旁边的。", true);
        }
      },
      onWin: function (s, say) { say("浮桥拼好了，队伍过河！"); }
    };
    return rttMake(cfg);
  }

  /* ===================================================
     乌江站 · 渡江（经典：青蛙过河 Frogger）
     红军小人在河底，利用河上漂流的竹筏/浮板一步一步跳向对岸。
     跳到没浮板的江面会掉回岸边重来（温和）。跳上对岸即渡江成功。
     方向按钮：← ↑ →（触屏）。
     =================================================== */
  function rtFroggerGame(stationData, engine) {
    var ROWS = [
      { dir: 1,  speed: 0.20, rafts: [0.05, 0.34, 0.63, 0.90] }, /* 上游：竹筏右漂 */
      { dir: -1, speed: 0.26, rafts: [0.12, 0.46, 0.80] },        /* 中游：竹筏左漂 */
      { dir: 1,  speed: 0.16, rafts: [0.0, 0.28, 0.56, 0.84] }    /* 下游：竹筏右漂 */
    ];
    var RAFT_LEN = 0.16;
    function build() {
      var wrap = rttMake({
        height: 330,
        tip: "💡 用 ←↑→ 让红军小人跳上漂的竹筏，一步步到对岸",
        initialMsg: "踩着漂的竹筏，小心别掉进江里",
        init: function () { return { row: 3, x: 0.5, t: 0, drifts: [0, 0, 0] }; },
        update: function (dt, s, W, H, win) {
          var d = s.data; d.t += dt;
          /* 竹筏漂移 */
          for (var r = 0; r < ROWS.length; r++) {
            d.drifts[r] = (d.drifts[r] + ROWS[r].dir * ROWS[r].speed * dt) % 1;
          }
          /* 站在某行竹筏上时跟着漂 */
          if (d.row >= 0 && d.row < ROWS.length) {
            d.x = (d.x + ROWS[d.row].dir * ROWS[d.row].speed * dt + 1) % 1;
          }
        },
        draw: function (c, s, W, H, t) {
          var d = s.data;
          var laneH = H / 5;
          /* 对岸(win)与岸边 */
          c.fillStyle = "#6d7f5a"; c.fillRect(0, 0, W, laneH);
          c.fillStyle = "#e8dcc0"; c.fillRect(0, H - laneH, W, laneH);
          /* 三条江 */
          for (var r = 0; r < 3; r++) {
            var y = (r + 1) * laneH;
            c.fillStyle = "#3a6a9a"; c.fillRect(0, y, W, laneH);
            /* 竹筏 */
            ROWS[r].rafts.forEach(function (off) {
              var x0 = (off + d.drifts[r]) % 1;
              var px = x0 * W;
              c.fillStyle = "#9a6a2b"; rr(c, px, y + laneH * 0.18, RAFT_LEN * W, laneH * 0.6, 6); c.fill();
              c.fillStyle = "#6b4a1f"; c.fillRect(px + 2, y + laneH * 0.28, RAFT_LEN * W - 4, 3);
            });
          }
          /* 红军小人 */
          var fy = (H - laneH) - d.row * laneH - laneH * 0.5;
          var fx = d.x * W;
          c.fillStyle = "#b3202a"; c.beginPath(); c.arc(fx, fy, 16, 0, 6.283); c.fill();
          c.fillStyle = "#ffd9a0"; c.beginPath(); c.arc(fx, fy - 5, 6, 0, 6.283); c.fill();
          c.fillStyle = "#fff"; c.font = "15px sans-serif"; c.textAlign = "center";
          c.fillText("红", fx, fy + 6);
          c.fillStyle = "#e8dcc0"; c.font = "16px sans-serif"; c.textAlign = "center";
          c.fillText("跳上对岸就过江啦", W / 2, laneH * 0.6);
          c.textAlign = "start";
        }
      });
      /* 方向按钮 */
      var btns = h("div", "frog-btns");
      ["◀", "▲", "▶"].forEach(function (sym, i) {
        var b = h("button", "frog-btn", sym);
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); move(i); });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);

      var wonFlag = false;
      function sayMsg(t) { var w = wrap._say; if (w) w(t); }
      function move(dir) {
        if (wonFlag) return;
        var s = wrap.__state, d = s.data;
        if (dir === 0) { d.x = (d.x - 0.12 + 1) % 1; }
        else if (dir === 2) { d.x = (d.x + 0.12) % 1; }
        else if (dir === 1) {
          d.row--;
          if (d.row < 0) { d.row = 0; }
          if (d.row === 0) { wonFlag = true; wrap.classList.add("complete"); sayMsg("渡江成功！红军小人踏上对岸！"); return; }
          if (!onRaft(s)) { d.row = 3; d.x = 0.5; sayMsg("没踩稳，掉回岸边了，再来一次。", true); }
          else sayMsg("踩上竹筏了，继续往前！");
        }
      }
      function onRaft(s) {
        var d = s.data, r = d.row - 1;
        if (r < 0 || r >= ROWS.length) return false;
        var x = d.x;
        return ROWS[r].rafts.some(function (off) {
          var x0 = (off + d.drifts[r]) % 1;
          var x1 = (x0 + RAFT_LEN) % 1;
          if (x0 < x1) return x >= x0 && x <= x1;
          return x >= x0 || x <= x1;
        });
      }
      return wrap;
    }
    return build();
  }

  /* ===================================================
     于都站 · 昼拆夜搭浮桥
     纯 DOM，点击桥节→点击锚点放置，移动端同样可用。
     =================================================== */
  function bridgeGame(stationData, engine) {
    var N = 5;
    /* 缓流锚点（河湾内侧），目标号即连接顺序 1→2→3→4→5 */
    var calm = [
      { id: "c1", n: 1, left: 8,  top: 62 },
      { id: "c2", n: 2, left: 26, top: 40 },
      { id: "c3", n: 3, left: 44, top: 26 },
      { id: "c4", n: 4, left: 62, top: 40 },
      { id: "c5", n: 5, left: 80, top: 58 }
    ];
    /* 直河段急流锚点（诱饵）：放上去会被冲歪 */
    var fast = [
      { id: "f1", left: 17, top: 14 },
      { id: "f2", left: 50, top: 60 },
      { id: "f3", left: 83, top: 24 }
    ];
    var anchors = calm.concat(fast);

    /* 玩法状态（每次 renderDanger 独立，互不影响） */
    var state = {
      isNight: true,
      selected: null,            /* 当前选中的桥节号 1..5 */
      placed: {},                /* 桥节号 -> 锚点id */
      planeState: "idle",        /* idle | flying | safe | seen */
      complete: false,
      planeTimer: null,
      planeEndTimer: null
    };

    var root = h("div", "bridge-game night");
    var msg = h("div", "bridge-msg");
    var statusLine = h("div", "bridge-status");

    var sky = h("div", "bg-sky");
    var skyIcon = h("div", "sky-icon moon", "🌙");
    sky.appendChild(skyIcon);
    var plane = h("div", "plane", "✈");
    plane.style.display = "none";
    sky.appendChild(plane);
    root.appendChild(sky);

    var tip = h("div", "tip-bar", "💡 先看河弯，缓流处才好搭桥");
    root.appendChild(tip);

    /* 昼 / 夜切换 */
    var toggleBtn = h("button", "secondary toggle-btn", "到白天");
    var hideBtn = h("button", "ghost hide-btn", "🌿 藏桥");
    hideBtn.style.display = "none";
    var btnRow = h("div", "btn-row");
    btnRow.appendChild(toggleBtn);
    btnRow.appendChild(hideBtn);
    root.appendChild(btnRow);

    var rinse = h("div", "river");
    root.appendChild(rinse);

    /* 河面锚点 */
    var anchorEls = {};
    anchors.forEach(function (a) {
      var elA = h("button", "anchor " + (a.n ? "calm" : "fast"), a.n ? "" : "急流");
      elA.style.left = a.left + "%";
      elA.style.top = a.top + "%";
      elA.setAttribute("data-id", a.id);
      if (a.n) {
        var num = h("span", "anchor-num", String(a.n));
        elA.appendChild(num);
      }
      rinse.appendChild(elA);
      anchorEls[a.id] = elA;
    });

    /* 岸上桥节托盘 */
    var bank = h("div", "bank");
    var pieceEls = {};
    var i;
    for (i = 1; i <= N; i++) {
      (function (num) {
        var pb = h("button", "piece", "桥" + num);
        pb.setAttribute("data-num", String(num));
        pb.appendChild(h("span", "piece-n", String(num)));
        pb.addEventListener("click", function () { selectPiece(num); });
        bank.appendChild(pb);
        pieceEls[num] = pb;
      })(i);
    }
    root.appendChild(bank);
    root.appendChild(msg);
    root.appendChild(statusLine);

    /* ---------- 文案反馈 ---------- */
    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) {
        /* 强制重启动画 */
        void msg.offsetWidth;
        msg.classList.add("shake");
      }
    }

    function clearTimers() {
      if (state.planeTimer) { clearTimeout(state.planeTimer); state.planeTimer = null; }
      if (state.planeEndTimer) { clearTimeout(state.planeEndTimer); state.planeEndTimer = null; }
    }

    /* ---------- 渲染状态 ---------- */
    function refreshPieces() {
      var n;
      for (n = 1; n <= N; n++) {
        var placedAt = state.placed[n];
        pieceEls[n].style.visibility = placedAt ? "hidden" : "visible";
        pieceEls[n].classList.toggle("selected", state.selected === n);
      }
    }

    function refreshAnchors() {
      anchors.forEach(function (a) {
        var elA = anchorEls[a.id];
        var placedNum = null, n;
        for (n in state.placed) { if (state.placed[n] === a.id) placedNum = Number(n); }

        elA.classList.toggle("has-bridge", !!placedNum);
        var badge = elA.querySelector(".placed-bridge");
        if (!badge) { badge = h("span", "placed-bridge"); elA.appendChild(badge); }
        if (placedNum) { badge.textContent = "桥" + placedNum; badge.style.display = ""; }
        else { badge.style.display = "none"; }
      });
    }

    function checkComplete() {
      var done = true, n;
      for (n = 1; n <= N; n++) {
        if (state.placed[n] !== "c" + n) { done = false; break; }
      }
      if (done && state.isNight && !state.complete) {
        state.complete = true;
        root.classList.add("complete");
        say("浮桥搭好了！");
      }
      return state.complete;
    }

    /* ---------- 选择桥节 / 放置 ---------- */
    function selectPiece(num) {
      if (state.isNight && state.planeState === "flying") {
        say("敌机影子在飞，先点「藏桥」把桥藏到岸边。");
        return;
      }
      if (state.complete) {
        say("浮桥已经搭好了。");
        return;
      }
      if (state.placed[num]) { say("这节桥已经在河面上了，点河面锚点可以收回。"); return; }
      state.selected = (state.selected === num) ? null : num;
      refreshPieces();
      if (state.selected) say("选好了第 " + num + " 段桥，再点一个河面锚点放上去。");
      else say("点一段河湾缓流处的锚点，把选好的桥放上去。");
    }

    function onAnchorClick(a) {
      if (state.complete) { say("浮桥已经搭好了。"); return; }
      if (state.isNight && state.planeState === "flying") {
        say("敌机影子在飞，先点「藏桥」躲一躲。");
        return;
      }
      if (a.n) {
        /* 缓流锚点：若有桥在可收回 */
        var existing = null, n;
        for (n in state.placed) { if (state.placed[n] === a.id) existing = Number(n); }
        if (existing) {
          delete state.placed[existing];
          state.selected = null;
          refreshPieces(); refreshAnchors();
          say("桥节回到岸上，可以重新排列（要按照 1→2→3→4→5 顺水势放）。");
          return;
        }
      }
      /* 放置 */
      if (!state.selected) {
        say("先点岸上一段桥节，再点河面锚点放上去。");
        return;
      }
      var sel = state.selected;
      if (!a.n) {
        /* 直河段急流 → 被水冲歪 */
        anchorEls[a.id].classList.remove("shake");
        void anchorEls[a.id].offsetWidth;
        anchorEls[a.id].classList.add("shake");
        say("「被水冲歪」——这段水流太急，桥站不住，换个缓流位置。", true);
        state.selected = null;
        refreshPieces();
        return;
      }
      if (!fit(sel, a.n)) {
        say("缓流处也要按 1→2→3→4→5 的顺序放，先接上前面那段。");
        return;
      }
      state.placed[sel] = a.id;
      state.selected = null;
      refreshPieces(); refreshAnchors();
      if (!checkComplete() && state.isNight) {
        say("第 " + sel + " 段桥稳稳搭在缓流上了。");
      }
    }

    anchors.forEach(function (a) {
      anchorEls[a.id].addEventListener("click", function () { onAnchorClick(a); });
    });

    /* ---------- 昼/夜 与 敌机 ---------- */
    function setMode(night) {
      clearTimers();
      state.isNight = night;
      root.classList.toggle("night", night);
      root.classList.toggle("day", !night);
      skyIcon.className = "sky-icon " + (night ? "moon" : "sun");
      skyIcon.textContent = night ? "🌙" : "☀️";
      toggleBtn.textContent = night ? "到白天" : "到夜里";
      if (night) {
        plane.style.display = "none";
        resetPlaneState();
        if (!state.complete) say("夜里安静，试试把 5 段桥按 1→2→3→4→5 放到河湾缓流锚点上。");
      } else {
        hideBtn.style.display = "";
        state.planeState = "idle";
        plane.style.display = "";
        plane.classList.remove("flying");
        /* 短暂停顿后敌机影子扫过 */
        state.planeTimer = setTimeout(function () {
          state.planeTimer = null;
          plane.classList.add("flying");
          state.planeState = "flying";
          say("敌机的影子来了！快把桥「藏桥」藏到岸边。");
          state.planeEndTimer = setTimeout(function () {
            state.planeEndTimer = null;
            if (state.planeState === "flying") { onPlaneCaught(); }
          }, 2600);
        }, 1600);
      }
    }

    function resetPlaneState() {
      state.planeState = "idle";
      plane.classList.remove("flying");
      hideBtn.style.display = "none";
      clearTimers();
    }

    function hideBridges() {
      state.placed = {};
      state.selected = null;
      refreshPieces(); refreshAnchors();
    }

    function onPlaneCaught() {
      state.planeState = "seen";
      plane.classList.remove("flying");
      plane.style.display = "none";
      hideBridges();
      say("敌机的影子飞过去了，桥要赶紧藏起来。切回夜里重新搭吧。");
    }

    hideBtn.addEventListener("click", function () {
      if (state.planeState === "flying") {
        clearTimers();
        state.planeState = "safe";
        plane.classList.remove("flying");
        plane.style.display = "none";
        hideBtn.style.display = "none";
        hideBridges();
        say("把桥藏到岸边，敌机没有发现。夜里再搭桥吧。");
      } else {
        say("桥上还没有敌机影子，暂时不用藏。");
      }
    });

    toggleBtn.addEventListener("click", function () { setMode(!state.isNight); });

    /* 初始：夜里开始 */
    setMode(true);

    return root;
  }


  /* ===================================================
     乌江站 · 找一处可渡点（水势 / 岸形 / 隐蔽）
     点开三段渡口的图卡，选错温和重试并打×，
     选对进入「绑竹筏 → 试水 → 调整靠岸点」短交互到通关。
     =================================================== */
  function ferryGame(stationData, engine) {
    var points = [
      { id: "narrow", name: "窄谷急流", correct: false,
        water: { n: 1, l: "急" }, bank: { n: 1, l: "窄" }, hide: { n: 2, l: "" } },
      { id: "flat", name: "宽滩缓流", correct: false,
        water: { n: 1, l: "缓" }, bank: { n: 1, l: "宽" }, hide: { n: 1, l: "易暴露" } },
      { id: "cliff", name: "陡崖下旋涡", correct: true,
        water: { n: 2, l: "次缓" }, bank: { n: 2, l: "可停靠" }, hide: { n: 3, l: "最隐蔽" } }
    ];
    var steps = [
      { name: "绑竹筏", text: "把几根竹子扎紧，做成能稳过江的竹筏。" },
      { name: "试水", text: "先推下水试一段，看看旋涡里的水稳不稳。" },
      { name: "调整靠岸点", text: "顺着水势把靠岸点放到平缓处。" }
    ];

    var state = { chosen: false, step: 0, timer: null };
    var root = h("div", "ferry-game");
    var msg = h("div", "ferry-msg");
    root.appendChild(h("div", "tip-bar", "💡 水势要缓、岸形能停靠、又要隐蔽，才是好渡点"));

    /* 三段渡口横向示意 */
    var river = h("div", "ferry-river");
    var btnEls = {};
    points.forEach(function (p) {
      var b = h("button", "ferry-point");
      b.appendChild(h("span", "ferry-point-name", p.name));
      b.appendChild(h("span", "ferry-point-note", p.id === "cliff" ? "视线被崖挡" : "点开图卡看看"));
      b.addEventListener("click", function () { onPoint(p, b); });
      river.appendChild(b);
      btnEls[p.id] = b;
    });
    root.appendChild(river);

    /* 三要素图卡 */
    var card = h("div", "ferry-card ferry-hidden");
    function fillCard(p) {
      card.innerHTML = "";
      card.appendChild(h("div", "ferry-card-title", p.name));
      card.appendChild(factorRow("水势", p.water));
      card.appendChild(factorRow("岸形", p.bank));
      card.appendChild(factorRow("隐蔽", p.hide));
    }
    function factorRow(k, f) {
      var row = h("div", "ferry-factor");
      var stars = "";
      var i;
      for (i = 0; i < 3; i++) stars += (i < f.n) ? "★" : "☆";
      row.appendChild(h("span", "ferry-factor-k", k));
      row.appendChild(h("span", "ferry-factor-s", stars));
      row.appendChild(h("span", "ferry-factor-l", f.l || ""));
      return row;
    }
    root.appendChild(card);

    /* 短交互步骤区 */
    var stepsRow = h("div", "ferry-steps");
    var stepEls = [];
    steps.forEach(function (s) {
      var chip = h("div", "ferry-step", s.name);
      var sub = h("div", "ferry-step-text", "");
      stepsRow.appendChild(chip);
      stepsRow.appendChild(sub);
      stepEls.push({ chip: chip, sub: sub, data: s });
    });
    root.appendChild(stepsRow);

    root.appendChild(msg);
    var status = h("div", "ferry-status", "看三条线索，点一个渡点试试");
    root.appendChild(status);

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }
    function clearTimer() {
      if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    }

    function advanceStep() {
      var idx = state.step;
      if (idx >= steps.length) {
        status.textContent = "渡点选好，竹筏下水稳！";
        return;
      }
      var s = stepEls[idx];
      s.chip.classList.add("lit");
      s.sub.textContent = s.data.text;
      state.timer = setTimeout(function () { state.step++; advanceStep(); }, 1800);
    }

    function startSteps() {
      state.chosen = true;
      root.classList.add("complete");
      status.textContent = "渡点选好了，绑竹筏下水试试。";
      msg.textContent = "";
      advanceStep();
    }

    function onPoint(p, b) {
      if (state.chosen) { say("渡点已经选好了。"); return; }
      clearTimer();
      card.classList.remove("ferry-hidden");
      card.classList.add("show");
      fillCard(p);
      if (!p.correct) {
        b.classList.add("crossed");
        b.disabled = true;
        if (p.id === "narrow") say("这里水流太急，再看一眼水势、岸形、隐蔽三条线索。", true);
        else say("这里太开阔容易被发现，再看一眼水势、岸形、隐蔽三条线索。", true);
        return;
      }
      b.classList.add("chosen");
      say("水势缓下来、岸形能停靠、又隐蔽，就选这里！");
      state.timer = setTimeout(function () { startSteps(); }, 700);
    }

    return root;
  }

  /* ===================================================
     遵义站 · 找出口（经典：贪吃蛇沿山谷）
     红军蛇沿等高线山谷前进，避开「密线高山」墙格，
     吃掉「山口」节点；吃到 3 个山口即找到出口。
     方向 ↑←↓→ 按钮控制；撞山/撞自己温和重试。
     =================================================== */
  function rtSnakeGame(stationData, engine) {
    var COLS = 8, ROWS = 6;
    var WALL = "#3a5a3a";       /* 密线高山墙 */
    var FOOD = "山";            /* 山口节点 */
    /* 迷宫墙体：1=山，0=可走 */
    var GRID = [
      [1,1,1,1,1,1,1,1],
      [1,0,0,1,0,1,0,1],
      [1,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1]
    ];
    var SPEED = 1.2;            /* 格/秒：约 0.83 步/秒，适合儿童 */
    function build() {
      var wrap = rttMake({
        height: 320,
        tip: "💡 用 ←↑↓→ 让红军沿山谷走，别撞上山，吃掉 3 个山口",
        initialMsg: "吃掉山口的标记，走到出口；撞山会缓一缓",
        init: function () {
          return { snake: [{ r: 4, c: 1 }], dir: { r: -1, c: 0 }, acc: 0, eaten: 0, foods: [[1,2],[3,5],[2,3]], won: false };
        },
        update: function (dt, s, W, H, win) {
          var d = s.data;
          d.acc += dt;
          if (d.acc >= 1 / SPEED) { d.acc = 0; stepSnake(d, win, function (t, sh) { var w = wrap._say; if (w) w(t, sh); }); }
        },
        draw: function (c, s, W, H, t) {
          var d = s.data;
          var cw = W / COLS, ch = H / ROWS;
          for (var r = 0; r < ROWS; r++) for (var col = 0; col < COLS; col++) {
            var x = col * cw, y = r * ch;
            if (GRID[r][col] === 1) { c.fillStyle = WALL; c.fillRect(x, y, cw, ch); }
            else { c.fillStyle = "#eef0d9"; c.fillRect(x, y, cw, ch); }
          }
          /* 山口节点 */
          d.foods.forEach(function (f) {
            var x = f[1] * cw + cw / 2, y = f[0] * ch + ch / 2;
            c.fillStyle = "#d98a1f"; c.beginPath(); c.arc(x, y, cw * 0.22, 0, 6.283); c.fill();
            c.fillStyle = "#fff"; c.font = (cw * 0.4) + "px sans-serif"; c.textAlign = "center";
            c.fillText(FOOD, x, y + cw * 0.16);
            c.textAlign = "start";
          });
          /* 蛇 */
          d.snake.forEach(function (seg, i) {
            var x = seg.c * cw, y = seg.r * ch;
            c.fillStyle = i === 0 ? "#b3202a" : "#d66a5a";
            rr(c, x + 2, y + 2, cw - 4, ch - 4, 6); c.fill();
          });
          c.fillStyle = "#4a5a2a"; c.font = "14px sans-serif";
          c.fillText("已吃山口 " + d.eaten + " / 3", 8, H - 6);
        }
      });
      /* 方向按钮 */
      var btns = h("div", "frog-btns");
      [["◀",{r:0,c:-1}],["▲",{r:-1,c:0}],["▼",{r:1,c:0}],["▶",{r:0,c:1}]].forEach(function (grp) {
        var b = h("button", "frog-btn", grp[0]);
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); turn(grp[1]); });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);

      function sayMsg(t, s) { var w = wrap._say; if (w) w(t, s); }
      function turn(nd) {
        var d = wrap.__state.data;
        /* 禁止 180 度掉头 */
        if (d.snake.length > 1 && (d.dir.r === -nd.r && d.dir.c === -nd.c)) return;
        d.dir = nd;
      }
      function resetSnake(d) { d.snake = [{ r: 4, c: 1 }]; d.dir = { r: -1, c: 0 }; d.acc = 0; }
      function stepSnake(d, win, say) {
        if (d.won) return;
        var head = { r: d.snake[0].r + d.dir.r, c: d.snake[0].c + d.dir.c };
        if (head.r < 0 || head.r >= ROWS || head.c < 0 || head.c >= COLS || GRID[head.r][head.c] === 1) {
          resetSnake(d); say("撞到高山了，缓一缓，沿山谷重新走。", true); return;
        }
        if (d.snake.some(function (s) { return s.r === head.r && s.c === head.c; })) {
          resetSnake(d); say("缠在一起了，松开重来。", true); return;
        }
        d.snake.unshift(head);
        var fx = d.foods.findIndex(function (f) { return f[0] === head.r && f[1] === head.c; });
        if (fx >= 0) {
          d.foods.splice(fx, 1); d.eaten++;
          say("吃掉一个山口！");
          if (d.eaten >= 3 || d.foods.length === 0) { d.won = true; win(); say("找到出口——赤水方向的河谷！"); }
        } else { d.snake.pop(); }
      }
      return wrap;
    }
    return build();
  }
  function channelGame(stationData, engine) {
    var routes = [
      { id: "valley", name: "河谷", note: "沿河山谷", correct: true },
      { id: "pass", name: "山口", note: "山垭口", correct: true },
      { id: "ridge", name: "山脊", note: "等高线最密", correct: false }
    ];

    var state = { done: false };
    var root = h("div", "channel-game");
    root.appendChild(h("div", "tip-bar", "💡 等高线密的是高山，山口和河谷才是天然通道"));

    /* 遵义以北地形示意：等高线密度表示山地，密线区标「山」 */
    var terrain = h("div", "channel-terrain");
    var contour = h("div", "contour");
    var mtn = h("div", "contour-mountain");
    mtn.appendChild(h("span", "contour-mtn-label", "山"));
    contour.appendChild(mtn);
    terrain.appendChild(contour);

    var routesWrap = h("div", "channel-routes");
    var routeEls = {};
    routes.forEach(function (r) {
      var b = h("button", "channel-route");
      b.appendChild(h("span", "channel-route-name", r.name));
      b.appendChild(h("span", "channel-route-note", r.note));
      b.addEventListener("click", function () { onRoute(r, b); });
      routesWrap.appendChild(b);
      routeEls[r.id] = b;
    });
    terrain.appendChild(routesWrap);
    root.appendChild(terrain);

    var card = h("div", "channel-card channel-hidden", "密线是高山，山口是通道");
    root.appendChild(card);

    var msg = h("div", "channel-msg");
    root.appendChild(msg);
    var status = h("div", "channel-status", "点一条向北的通道试试");
    root.appendChild(status);

    /* 底部科学固定文案：与 data.js sciExplanation 保持一致 */
    var sciText = (stationData && stationData.sciExplanation) ||
      "等高线密的地方难走，山口和河谷是天然通道。";
    root.appendChild(h("div", "channel-sci", "🔵 " + sciText));

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    function onRoute(r, b) {
      if (state.done) { say("出口已经找到了。"); return; }
      if (!r.correct) {
        b.classList.add("crossed");
        b.disabled = true;
        say("这里等高线太密、山太陡，换一条沿山谷的。", true);
        return;
      }
      b.classList.add("chosen");
      state.done = true;
      root.classList.add("complete");
      card.classList.remove("channel-hidden");
      card.classList.add("show");
      say("可通行，靠山谷省力。");
      status.textContent = "出口找到——赤水方向的河谷";
    }

    return root;
  }


  /* ===================================================
     四渡赤水 · 吃豆人（小红军躲敌影四渡）
     红军小人在河谷网格吃「渡口豆」，灰色敌影沿固定路线巡逻。
     吃到所有渡口豆即「四渡成功」；被敌影碰到 → 温和退回起点重试。
     方向 ←↑↓→ 移动。
     =================================================== */
  function rtPacGame(stationData, engine) {
    var GRID = [
      [1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,0,1],
      [1,0,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,0,1,0,0,1],
      [1,1,0,1,0,1,1,0,1,1],
      [1,0,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1]
    ];
    var COLS = 10, ROWS = 7;
    var P0 = { r: 3, c: 1 }, G0 = { r: 1, c: 1 };
    function build() {
      var wrap = rttMake({
        height: 320,
        tip: "💡 用 ←↑↓→ 让红军吃渡口豆；灰色敌影会巡逻，别被它碰到",
        initialMsg: "吃掉所有渡口豆就算渡过赤水",
        init: function () {
          var dots = 0;
          for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if (GRID[r][c] === 0) dots++;
          return { pr: P0.r, pc: P0.c, gr: G0.r, gc: G0.c, gt: 0, dir: { r: 0, c: 1 }, dots: dots, eaten: {}, won: false };
        },
        update: function (dt, s, W, H, win) {
          var d = s.data; if (d.won) return;
          /* 敌影沿巡逻路径走 */
          d.gt += dt;
          if (d.gt >= 0.4) {
            d.gt = 0;
            var nr = d.gr + d.dir.r, nc = d.gc + d.dir.c;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || GRID[nr][nc] === 1) {
              /* 撞墙：换个方向（尝试转向） */
              var choices = [[0,1],[0,-1],[1,0],[-1,0]];
              for (var i = 0; i < 4; i++) {
                var rr2 = d.gr + choices[i][0], cc2 = d.gc + choices[i][1];
                if (rr2 >= 0 && rr2 < ROWS && cc2 >= 0 && cc2 < COLS && GRID[rr2][cc2] === 0) { d.dir = { r: choices[i][0], c: choices[i][1] }; nr = rr2; nc = cc2; break; }
              }
            }
            d.gr = nr; d.gc = nc;
            if (d.gr === d.pr && d.gc === d.pc) {
              d.pr = P0.r; d.pc = P0.c; d.gr = G0.r; d.gc = G0.c; d.dir = { r: 0, c: 1 }; d.gt = 0;
              var w2 = wrap._say; if (w2) w2("被敌影发现了，躲进河谷重来，渡口豆还留着。", true);
            }
          }
        },
        draw: function (c, s, W, H, t) {
          var d = s.data, cw = W / COLS, ch = H / ROWS;
          for (var r = 0; r < ROWS; r++) for (var col = 0; col < COLS; col++) {
            var x = col * cw, y = r * ch;
            if (GRID[r][col] === 1) { c.fillStyle = "#3a5a3a"; c.fillRect(x, y, cw, ch); }
            else {
              c.fillStyle = "#f0ecd8"; c.fillRect(x, y, cw, ch);
              if (!d.eaten[r + "_" + col]) { c.fillStyle = "#d98a1f"; c.beginPath(); c.arc(x + cw / 2, y + ch / 2, cw * 0.16, 0, 6.283); c.fill(); }
            }
          }
          /* 敌影 */
          c.fillStyle = "#8a8a8a"; c.beginPath(); c.arc(d.gc * cw + cw / 2, d.gr * ch + ch / 2, cw * 0.38, 0, 6.283); c.fill();
          c.fillStyle = "#666"; c.font = "16px sans-serif"; c.textAlign = "center"; c.fillText("敌", d.gc * cw + cw / 2, d.gr * ch + ch / 2 + 6);
          /* 红军 */
          c.fillStyle = "#b3202a"; c.beginPath(); c.arc(d.pc * cw + cw / 2, d.pr * ch + ch / 2, cw * 0.4, 0, 6.283); c.fill();
          c.fillStyle = "#fff"; c.font = "16px sans-serif"; c.textAlign = "center"; c.fillText("红", d.pc * cw + cw / 2, d.pr * ch + ch / 2 + 6);
          c.fillStyle = "#6b4a2a"; c.font = "14px sans-serif"; c.fillText("还差渡口豆 " + (d.dots - Object.keys(d.eaten).length), 8, H - 6);
        }
      });
      /* 方向按钮 */
      var btns = h("div", "frog-btns");
      [["◀",0,-1],["▲",-1,0],["▼",1,0],["▶",0,1]].forEach(function (grp) {
        var b = h("button", "frog-btn", grp[0]);
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); move(grp[1], grp[2]); });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);
      function move(dr, dc) {
        var d = wrap.__state.data; if (d.won) return;
        var nr = d.pr + dr, nc = d.pc + dc;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || GRID[nr][nc] === 1) { var w = wrap._say; if (w) w("这边是高山，过不去，换一边。", true); return; }
        d.pr = nr; d.pc = nc;
        var key = nr + "_" + nc;
        if (GRID[nr][nc] === 0 && !d.eaten[key]) {
          d.eaten[key] = true; var w2 = wrap._say; if (w2) w2("吃掉一颗渡口豆！");
          if (Object.keys(d.eaten).length >= d.dots) { d.won = true; wrap.__win(); var w3 = wrap._say; if (w3) w3("四渡赤水，调虎离山成功！"); }
        }
      }
      return wrap;
    }
    return build();
  }

  /* ===================================================
     四渡赤水 · 迷阵推演（调虎离山）
     依次走四个渡河步骤：选对才前进，选错给温和提示；
     四步都对后显示「调虎离山成功」并完成。
     =================================================== */
  function mazeGame(stationData, engine) {
    var steps = [
      { title: "第一渡 · 声东击西",
        prompt: "先大步朝东作势强渡，敌军影子追向东方。这时该……",
        options: [
          { text: "折向西，趁敌离开转向渡河", correct: true },
          { text: "停在原地等敌回头", correct: false },
          { text: "与敌军隔河对峙", correct: false }
        ] },
      { title: "第二渡 · 二渡赤水",
        prompt: "东岸敌军被调开一部分。要甩开追兵，该……",
        options: [
          { text: "再折回西岸，走河曲山影掩护", correct: true },
          { text: "沿东岸直追正面大军", correct: false },
          { text: "守在渡口等敌人过河", correct: false }
        ] },
      { title: "第三渡 · 三渡赤水",
        prompt: "敌人又被引到西边。趁西岸空虚，该……",
        options: [
          { text: "悄悄转回东岸，从敌军背后走", correct: true },
          { text: "在西岸多停留几天", correct: false },
          { text: "和追兵同时过河抢渡", correct: false }
        ] },
      { title: "第四渡 · 四渡赤水",
        prompt: "几番转折，敌人已摸不清方向。最后一程该……",
        options: [
          { text: "沿河曲与山体遮蔽，向预定方向穿插", correct: true },
          { text: "原路退回最开始的地方", correct: false },
          { text: "摆开阵势与敌人正面决出胜负", correct: false }
        ] }
    ];

    var state = { step: 0, done: false };

    var root = h("div", "maze-game");
    var msg = h("div", "maze-msg", "跟着河曲与山影，一步步把敌军影子调开。");
    root.appendChild(msg);

    var sciText = (stationData && stationData.sciExplanation) ||
      "河曲和山体提供遮蔽，所以能在山区河边声东击西。";
    root.appendChild(h("div", "maze-sci", "🔵 " + sciText));

    var stepBox = h("div", "maze-step");
    root.appendChild(stepBox);

    var status = h("div", "maze-status", "第一步：先想好往哪引敌。");
    root.appendChild(status);

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    function renderStep() {
      stepBox.textContent = "";
      if (state.done) return;
      var cur = steps[state.step];
      stepBox.appendChild(h("div", "maze-step-title", cur.title));
      stepBox.appendChild(h("div", "maze-step-prompt", cur.prompt));
      var opts = h("div", "maze-options");
      cur.options.forEach(function (opt) {
        var b = h("button", "maze-option", opt.text);
        b.addEventListener("click", function () {
          if (state.done) { say("迷阵已经走通了。"); return; }
          if (!opt.correct) {
            b.classList.add("crossed");
            b.disabled = true;
            say("这一步会让敌军影子跟得更近，再想想别的方向。", true);
            return;
          }
          b.classList.add("chosen");
          if (state.step === steps.length - 1) {
            state.done = true;
            root.classList.add("complete");
            say("调虎离山成功——敌军被甩在身后，渡口打开了。");
            status.textContent = "四渡赤水完成，迷阵走通！";
            renderStep();
          } else {
            state.step++;
            say("调开了这一步，继续下一渡。");
            status.textContent = "第" + (state.step + 1) + "步：跟着山形判断去向。";
            renderStep();
          }
        });
        opts.appendChild(b);
      });
      stepBox.appendChild(opts);
    }

    renderStep();
    return root;
  }

  /* ===================================================
     金沙江站 · 渡江秩序（经典：俄罗斯方块）
     船队方块按序落下、排满一行即「渡江成功」清行。
     排满 5 行即完成；触顶温和提示。←→↓ 移动、↻ 旋转。
     =================================================== */
  function rtTetrisGame(stationData, engine) {
    var CW = 10, CH = 16, GOAL = 5;
    var SHAPES = [
      { m: [[1,1,1,1]], c: "#d98a1f" },
      { m: [[1,1],[1,1]], c: "#e6c34a" },
      { m: [[0,1,0],[1,1,1]], c: "#b3202a" },
      { m: [[0,1,1],[1,1,0]], c: "#3a7a3a" },
      { m: [[1,1,0],[0,1,1]], c: "#5a5aa8" },
      { m: [[1,0,0],[1,1,1]], c: "#7a5aa8" },
      { m: [[0,0,1],[1,1,1]], c: "#3a8a8a" }
    ];
    function build() {
      var wrap = rttMake({
        height: 300,
        tip: "💡 用 ←→↓ 移动、↻ 旋转，把船队叠排满一行就清掉",
        initialMsg: "排满 5 行，渡江守则达成",
        init: function () {
          var g = []; for (var r = 0; r < CH; r++) g.push(new Array(CW).fill(0));
          return { g: g, cur: null, acc: 0, cleared: 0, won: false, t: 0 };
        },
        update: function (dt, s, W, H, win) {
          var d = s.data;
          if (d.won) return;
          d.t += dt; d.acc += dt;
          if (d.acc >= 0.55) { d.acc = 0; stepDown(d, win); }
          if (!d.cur) spawn(d);
        },
        draw: function (c, s, W, H, t) {
          var d = s.data;
          var cw = W / CW, ch = H / CH;
          c.fillStyle = "#12233a"; c.fillRect(0, 0, W, H);
          for (var r = 0; r < CH; r++) for (var col = 0; col < CW; col++) {
            if (d.g[r][col]) { c.fillStyle = d.g[r][col]; rr(c, col * cw + 1, r * ch + 1, cw - 2, ch - 2, 4); c.fill(); }
          }
          if (d.cur) {
            var m = d.cur.m;
            for (var ri = 0; ri < m.length; ri++) for (var cc = 0; cc < m[0].length; cc++) if (m[ri][cc]) {
              var py = d.cur.y + ri, px = d.cur.x + cc;
              if (py >= 0 && py < CH && px >= 0 && px < CW) { c.fillStyle = d.cur.c; rr(c, px * cw + 1, py * ch + 1, cw - 2, ch - 2, 4); c.fill(); }
            }
          }
          c.fillStyle = "#fff"; c.font = "15px sans-serif"; c.fillText("已排满 " + d.cleared + " / " + GOAL + " 行", 8, 18);
        }
      });
      var btns = h("div", "frog-btns");
      [["◀",0,-1],["↻",9,9],["▶",0,1],["▼",1,0]].forEach(function (grp) {
        var b = h("button", "frog-btn", grp[0]);
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); doAction(grp[1], grp[2]); });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);
      function spawn(d) {
        var i = Math.floor(Math.random() * SHAPES.length);
        var m = SHAPES[i].m.map(function (row) { return row.slice(); });
        d.cur = { m: m, c: SHAPES[i].c, x: Math.floor((CW - m[0].length) / 2), y: 0 };
      }
      function collides(d, m, x, y) {
        for (var r = 0; r < m.length; r++) for (var cc = 0; cc < m[0].length; cc++) {
          if (!m[r][cc]) continue;
          var py = y + r, px = x + cc;
          if (px < 0 || px >= CW || py >= CH) return true;
          if (py >= 0 && d.g[py][px]) return true;
        }
        return false;
      }
      function stepDown(d, win) {
        if (!d.cur) { spawn(d); return; }
        if (!collides(d, d.cur.m, d.cur.x, d.cur.y + 1)) { d.cur.y++; return; }
        lock(d);
      }
      function lock(d) {
        var m = d.cur.m;
        for (var r = 0; r < m.length; r++) for (var cc = 0; cc < m[0].length; cc++) if (m[r][cc] && d.cur.y + r >= 0) {
          d.g[d.cur.y + r][d.cur.x + cc] = d.cur.c;
        }
        d.cur = null;
        for (var ri = CH - 1; ri >= 0; ri--) {
          if (d.g[ri].every(function (v) { return v; })) { d.g.splice(ri, 1); d.g.unshift(new Array(CW).fill(0)); d.cleared++; ri++; }
        }
        if (d.cleared >= GOAL) { d.won = true; wrap.__win(); var w2 = wrap._say; if (w2) w2("排满 5 行——渡江守则达成！"); }
      }
      function doAction(ar, ac) {
        var d = wrap.__state.data; if (d.won || !d.cur) return;
        if (ar === 9) { rotatePiece(d); return; }
        if (!collides(d, d.cur.m, d.cur.x + ac, d.cur.y + ar)) { d.cur.x += ac; d.cur.y += ar; }
        if (ar === 1) stepDown(d);
      }
      function rotatePiece(d) {
        var m = d.cur.m, n = m.length, w = m[0].length;
        var nm = []; for (var r = 0; r < w; r++) { nm.push([]); for (var cc = 0; cc < n; cc++) nm[r].push(m[n - 1 - cc][r]); }
        var x = d.cur.x - Math.floor((w - n) / 2);
        if (!collides(d, nm, x, d.cur.y)) { d.cur.m = nm; d.cur.x = x; }
      }
      return wrap;
    }
    return build();
  }

  /* ===================================================
     金沙江站 · 渡江秩序调度（boarding）
     7 只小船横排、江流自左向右；右侧四类按序上船：
     先侦察分队 → 伤员 → 装备 → 大部队。乱序温和提示可重试。
     =================================================== */
  function boardingGame(stationData, engine) {
    var cats = [
      { key: "scout",   name: "侦察分队", desc: "先过江能先探路、守住渡口" },
      { key: "wounded", name: "伤员",     desc: "先过去安置、稳妥休息" },
      { key: "equip",   name: "装备",     desc: "物资跟上、过江有粮有械" },
      { key: "main",    name: "大部队",   desc: "最后大队有序、人最多" }
    ];
    /* 前 4 只船的上船顺序（参考历史守则，简单化） */
    var order = ["scout", "wounded", "equip", "main"];

    var state = { selected: null, placed: 0, done: false };

    var root = h("div", "boarding-game");

    var msg = h("div", "ferry-msg", "7 只小船，按秩序一船一船过江。");
    root.appendChild(msg);

    /* 江面示意：江流自左向右，7 船横排 */
    var river = h("div", "boarding-river");
    river.style.cssText = "position:relative;background:linear-gradient(180deg,#bfe0f5,#8fc3e8);" +
      "border:2px solid #5b8fb8;border-radius:12px;padding:18px 12px 14px;margin-bottom:12px;";
    var arrow = h("div", "boarding-flow", "江流 →");
    arrow.style.cssText = "position:absolute;top:6px;right:10px;font-size:16px;font-weight:700;color:#2f6b96;";
    river.appendChild(arrow);

    var boatsRow = h("div", "boarding-boats");
    boatsRow.style.cssText = "display:flex;gap:8px;";
    var boatEls = [];
    var i;
    for (i = 0; i < 7; i++) {
      (function (idx) {
        var isSlot = idx < 4;
        var b = h(isSlot ? "button" : "div", "boarding-boat");
        b.style.cssText = "flex:1 1 0;min-width:56px;min-height:62px;border-radius:10px;font-size:18px;" +
          "font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;" +
          "gap:4px;border:2px solid #6b4a2a;background:#f4e3c4;color:#4a2f1a;box-sizing:border-box;";
        if (isSlot) {
          b.setAttribute("data-boat", String(idx + 1));
          b.appendChild(h("span", "", "船" + (idx + 1)));
          b.addEventListener("click", function () { onBoat(idx); });
        } else {
          b.style.opacity = ".75";
          b.appendChild(h("span", "", "空"));
          b.appendChild(h("span", "", "返航"));
        }
        boatsRow.appendChild(b);
        boatEls.push(b);
      })(i);
    }
    river.appendChild(boatsRow);
    root.appendChild(river);

    /* 右侧四类待上船 */
    var catBox = h("div", "boarding-cats");
    catBox.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-bottom:12px;";
    var catEls = {};
    cats.forEach(function (c) {
      var cb = h("button", "boarding-cat", c.name);
      cb.style.cssText = "font-size:20px;min-height:48px;border-radius:10px;border:2px solid #a97c2a;" +
        "background:#ffe9c7;color:#4a2f1a;font-weight:800;padding:6px 12px;text-align:left;box-sizing:border-box;";
      cb.appendChild(h("div", "boarding-cat-desc", c.desc));
      cb.addEventListener("click", function () { selectCat(c); });
      catBox.appendChild(cb);
      catEls[c.key] = cb;
    });
    root.appendChild(catBox);

    var status = h("div", "ferry-status", "点一类待上船，再点前 4 只船按序放入");
    root.appendChild(status);

    var sciText = (stationData && stationData.sciExplanation) ||
      "江面窄但水流急，多船并排不易，必须有秩序。";
    root.appendChild(h("div", "channel-sci", "🔵 " + sciText));

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    function clearSelected() {
      state.selected = null;
      cats.forEach(function (cc) { catEls[cc.key].style.boxShadow = ""; });
    }

    function selectCat(c) {
      if (state.done) { say("渡江守则已经完成。"); return; }
      state.selected = c;
      cats.forEach(function (cc) {
        catEls[cc.key].style.boxShadow = (cc.key === c.key) ? "inset 0 0 0 3px #d98a1f" : "";
      });
      say("选好了「" + c.name + "」，点前 4 只船中的一艘放上去。");
    }

    function onBoat(idx) {
      if (state.done) { say("四类都已按序上船。"); return; }
      if (state.placed > idx) { say("这艘船已经有乘客了，换下一艘。"); return; }
      if (!state.selected) { say("先点右侧一类待上船，再点船放上去。"); return; }

      var expected = order[idx];
      if (state.selected.key !== expected) {
        var boatEl = boatEls[idx];
        boatEl.style.animation = "msg-shake .5s";
        var timer = setTimeout(function () { boatEl.style.animation = ""; }, 600);
        if (state.selected.key === "main") {
          say("船队拥挤、江浪把船冲偏——江急船少，先让最前面需探路的部队和伤员先过。", true);
        } else {
          say("这一船先不急着上「" + state.selected.name + "」，按探路→伤员→装备→大队的顺序来。", true);
        }
        clearSelected();
        return;
      }

      var placedName = state.selected.name;
      var slotEl = boatEls[idx];
      slotEl.textContent = placedName;
      slotEl.style.background = "#cfe9c0";
      slotEl.style.borderColor = "#5f8f4e";
      state.placed++;
      clearSelected();

      if (state.placed === order.length) {
        state.done = true;
        root.classList.add("complete");
        root.style.outline = "4px solid #d98a1f";
        root.style.outlineOffset = "2px";
        say("渡江守则：探路→伤员→装备→大队，按序上船完成！");
        status.textContent = "7 只小船按序过江，渡江守则达成！";
      } else {
        say("「" + placedName + "」按序上船。");
        status.textContent = "已放 " + state.placed + " 类，继续按守则放下一类";
      }
    }

    return root;
  }


  /* ===================================================
     泸定桥站 · 抢时铺桥（经典：打地鼠）
     桥板上会从某个桥洞冒出来，在它缩回前点中接住。
     2×3 桥洞；接住 8 块桥板即「峡谷铺桥完成」。
     =================================================== */
  function rtWhackGame(stationData, engine) {
    var COLS = 3, ROWS = 2, NEED = 8;
    function build() {
      var wrap = rttMake({
        height: 300,
        tip: "💡 木板从桥洞冒出来时，赶紧点中它接住",
        initialMsg: "点中从桥洞里冒出的木板，接住 8 块",
        init: function () { return { holes: [], timer: 0, done: 0, won: false }; },
        update: function (dt, s, W, H, win) {
          var d = s.data; if (d.won) { d.holes = []; return; }
          d.timer += dt;
          if (d.timer >= 1.0) { d.timer = 0; d.holes = [{ col: Math.floor(Math.random() * COLS), row: Math.floor(Math.random() * ROWS), life: 1.4 }]; }
          for (var i = d.holes.length - 1; i >= 0; i--) {
            d.holes[i].life -= dt;
            if (d.holes[i].life <= 0) { d.holes.splice(i, 1); var w = wrap._say; if (w) w("这块木板缩回去了，错过啦，再试。", true); }
          }
        },
        draw: function (c, s, W, H, t) {
          var d = s.data, cw = W / COLS, ch = H / ROWS;
          c.fillStyle = "#7c5a2a"; c.fillRect(0, 0, W, H);
          for (var r = 0; r < ROWS; r++) for (var col = 0; col < COLS; col++) {
            var x = col * cw, y = r * ch;
            c.fillStyle = "#4a3118"; c.beginPath(); c.ellipse(x + cw / 2, y + ch * 0.72, cw * 0.34, ch * 0.26, 0, 0, 6.283); c.fill();
            c.fillStyle = "#2a1d0e"; c.beginPath(); c.ellipse(x + cw / 2, y + ch * 0.72, cw * 0.22, ch * 0.16, 0, 0, 6.283); c.fill();
          }
          d.holes.forEach(function (h) {
            var x = h.col * cw, y = h.row * ch;
            c.fillStyle = "#b9884a"; rr(c, x + cw * 0.2, y + ch * 0.18, cw * 0.6, ch * 0.5, 6); c.fill();
            c.fillStyle = "#6b4a1f"; c.font = "20px sans-serif"; c.textAlign = "center"; c.fillText("桥板", x + cw / 2, y + ch * 0.5);
          });
          c.fillStyle = "#fff"; c.font = "16px sans-serif"; c.textAlign = "center"; c.fillText("接住木板 " + d.done + " / " + NEED, W / 2, H - 8);
        }
      });
      wrap.addEventListener("pointerdown", function (e) {
        var cv = wrap.querySelector(".rt-canvas"); var r = cv.getBoundingClientRect();
        tapAt(e.clientX - r.left, e.clientY - r.top);
      });
      function tapAt(x, y) {
        var s = wrap.__state, d = s.data; if (d.won) return;
        var W = s._w || 320, H = 300, cw = W / COLS, ch = H / ROWS;
        var col = Math.floor(x / cw), row = Math.floor(y / ch);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
        var hit = d.holes.findIndex(function (h) { return h.col === col && h.row === row; });
        if (hit >= 0) {
          d.holes.splice(hit, 1); d.done++; say("接住一块桥板！");
          if (d.done >= NEED) { d.won = true; wrap.__win(); say("桥板一块块接稳了——峡谷铺桥完成！"); }
        } else say("木板不在这儿，看准桥洞再点。", true);
      }
      function say(t, sh) { var w = wrap._say; if (w) w(t, sh); }
      return wrap;
    }
    return build();
  }

  /* ===================================================
     泸定桥站 · 飞夺泸定桥（峡谷铺桥）
     纯 DOM：先选路线（3 条），再把 5 块木板铺上铁链，
     全部铺完显示「铺桥完成」。
     =================================================== */
  function plankBridgeGame(stationData, engine) {
    var N = 5;
    var routes = ["挂铁索", "搭木板", "稳稳推"];
    var state = { route: null, placed: 0 };

    var root = h("div", "plank-bridge-game");
    var msg = h("div", "plank-msg");
    root.appendChild(msg);

    var statusLine = h("div", "plank-status", "先选路线，再铺木板");
    root.appendChild(statusLine);

    var routeRow = h("div", "btn-row");
    routes.forEach(function (name) {
      var btn = h("button", "secondary route-btn", name);
      btn.addEventListener("click", function () {
        state.route = name;
        routeRow.querySelectorAll("button.route-btn").forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        msg.textContent = "路线已选：「" + name + "」。开始铺木板。";
      });
      routeRow.appendChild(btn);
    });
    root.appendChild(routeRow);

    var plankRow = h("div", "btn-row plank-row");
    var i;
    for (i = 1; i <= N; i++) {
      (function (num) {
        var btn = h("button", "primary plank-btn", "木板 " + num);
        btn.addEventListener("click", function () {
          if (btn.classList.contains("done")) return;
          btn.classList.add("done");
          state.placed += 1;
          statusLine.textContent = "已铺 " + state.placed + " / " + N + " 块";
          if (state.placed === N) {
            statusLine.textContent = "铺桥完成！";
            msg.textContent = "五块木板都铺上铁链，队伍稳稳过桥。";
          }
        });
        plankRow.appendChild(btn);
      })(i);
    }
    root.appendChild(plankRow);

    return root;
  }

  /* ===================================================
     通用记忆 Simon（夹金山/腊子口复用）
     - 一串按钮依次亮起，玩家照着顺序再点一遍。
     - 点对到最后 → 完成；点错 → 温和提示并再放一遍。
     =================================================== */
  function rtSimon(stationData, engine, opts) {
    var labels = opts.labels;
    var seqLen = opts.seqLen || 4;
    var winMsg = opts.winMsg || "完成！";
    var wrap = h("div", "simon-wrap");
    wrap.appendChild(h("div", "tip-bar", opts.tip || "💡 记住亮灯的顺序，照着点一遍"));
    var btns = h("div", "simon-btns");
    var els = [];
    labels.forEach(function (l, i) {
      var b = h("button", "simon-btn", "⬤ " + l);
      b.addEventListener("click", function () { onPress(i); });
      btns.appendChild(b); els.push(b);
    });
    wrap.appendChild(btns);
    var status = h("div", "simon-status", opts.initial || "记住亮灯的顺序");
    wrap.appendChild(status);
    var seq = [], progress = 0, playing = false;
    function makeSeq() { var s = []; for (var i = 0; i < seqLen; i++) s.push(Math.floor(Math.random() * labels.length)); return s; }
    function flash(i, dur) { var el = els[i]; el.classList.add("lit"); setTimeout(function () { el.classList.remove("lit"); }, dur || 400); }
    function playSeq() {
      playing = true; status.textContent = "看好亮灯顺序…";
      var k = 0;
      function next() {
        if (k >= seq.length) { playing = false; progress = 0; status.textContent = "轮到你了，照着点一遍"; return; }
        flash(seq[k]); k++; setTimeout(next, 600);
      }
      setTimeout(next, 500);
    }
    function onPress(i) {
      if (playing || seq.length === 0) return;
      flash(i, 250);
      if (seq[progress] === i) {
        progress++;
        if (progress >= seq.length) {
          status.textContent = winMsg;
          wrap.classList.add("complete");
        }
      } else {
        status.textContent = "顺序没对上，再记一遍";
        playSeq();
      }
    }
    seq = makeSeq();
    setTimeout(function () { playSeq(); }, 700);
    return wrap;
  }

  /* 夹金山：记忆天气窗顺序（正午出发） */
  function rtSnowSimon(stationData, engine) {
    return rtSimon(stationData, engine, {
      labels: ["天刚亮", "正午", "快傍晚"],
      seqLen: 4,
      tip: "💡 记住天气窗亮起的顺序，按顺序点一遍，把正午留在中间",
      initial: "记天气窗顺序：天刚亮→正午→快傍晚",
      winMsg: "正午出发，踏雪开道完成！"
    });
  }
  /* 腊子口：记忆配合时序（牵制→攀爬→信号） */
  function rtCliffSimon(stationData, engine) {
    return rtSimon(stationData, engine, {
      labels: ["正面牵制", "侧崖攀爬", "发信号"],
      seqLen: 5,
      tip: "💡 记住「牵制→攀爬→信号」的配合顺序",
      initial: "记配合顺序，照着点",
      winMsg: "正面牵制、侧崖迂回——通道打开了！"
    });
  }

  /* ===================================================
     夹金山站 · 翻越雪山（snowPass / 踏雪开道）
     看天选时：三个天气窗里选「正午」，解锁 5 个踏雪孔；
     依次点开 5 个踏雪孔即「踏雪开道完成」。
     =================================================== */
  function snowPassGame(stationData, engine) {
    var weathers = [
      { key: "dawn", label: "天刚亮", note: "雪雾还没散，看不清山脊。", correct: false },
      { key: "noon", label: "正午",   note: "阳光足、雪坡亮，正是好时辰。", correct: true },
      { key: "dusk", label: "快傍晚", note: "天色转暗，风又起来了。", correct: false }
    ];
    var HOLES = 5;

    var state = { opened: 0, done: false };

    var root = h("div", "snowpass-game");
    root.style.cssText = "border:1px solid #d8e3f2;border-radius:14px;padding:16px;background:#f6f9ff;";

    var msg = h("div", "snowpass-msg", "雪山很高，先看天气选出发时间。");
    root.appendChild(msg);

    var sciText = (stationData && stationData.sciExplanation) ||
      "海拔越高越冷缺氧，翻雪山要选对时间、打出落脚点。";
    root.appendChild(h("div", "snowpass-sci", "🔵 " + sciText));

    var weatherBox = h("div", "snowpass-weather");
    weatherBox.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin:10px 0;";
    root.appendChild(weatherBox);

    var holeBox = h("div", "snowpass-holes");
    holeBox.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin:10px 0;";
    root.appendChild(holeBox);

    var status = h("div", "snowpass-status", "先点一个天气窗试试。");
    root.appendChild(status);

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    weathers.forEach(function (w) {
      var b = h("button", "snowpass-weather-btn", w.label);
      b.style.cssText = "padding:10px 14px;border:2px solid #b9c8e0;border-radius:10px;background:#eef4ff;cursor:pointer;font-size:15px;";
      b.addEventListener("click", function () {
        if (state.done) { say("雪路已经开好了。"); return; }
        if (!w.correct) {
          b.style.opacity = "0.5";
          b.disabled = true;
          say(w.note + " 这时候翻雪坡看不清路，换个时辰。", true);
          return;
        }
        b.classList.add("chosen");
        b.style.background = "#d98a1f";
        b.style.borderColor = "#b06e14";
        b.style.color = "#fff";
        weathers.forEach(function (x) { x.correct = true; });
        say("正午阳光足、雪坡亮堂——开始打踏雪孔开道吧！");
        status.textContent = "正午好时辰！依次点开 5 个踏雪孔。";
        holeBox.textContent = "";
        for (var i = 1; i <= HOLES; i++) {
          (function (n) {
            var hb = h("button", "snowpass-hole", "踏雪孔 " + n);
            hb.style.cssText = "padding:10px 14px;border:2px solid #cfe0f5;border-radius:10px;background:#fff;cursor:pointer;font-size:15px;";
            hb.addEventListener("click", function () {
              if (state.done) { say("踏雪开道已经完成。"); return; }
              if (hb.dataset.opened) { return; }
              hb.dataset.opened = "1";
              hb.textContent = "✓ 踏雪孔 " + n;
              hb.style.background = "#cfe9c0";
              hb.style.borderColor = "#5f8f4e";
              state.opened++;
              say("挖开一个踏雪孔，后面的人就有地方落脚。");
              status.textContent = "已开 " + state.opened + "/" + HOLES + " 个踏雪孔";
              if (state.opened === HOLES) {
                state.done = true;
                root.classList.add("complete");
                root.style.outline = "4px solid #d98a1f";
                root.style.outlineOffset = "2px";
                say("踏雪开道完成——雪坡有了落脚点，队伍一步步翻过夹金山！");
                status.textContent = "踏雪开道完成！";
              }
            });
            holeBox.appendChild(hb);
          })(i);
        }
      });
      weatherBox.appendChild(b);
    });

    return root;
  }

  /* ===================================================
     草地站 · 踏草甸（经典：别踩白块儿）
     4 列草甸从上方落下，绿「草甸」格是安全的，紫「泥潭」格不能踩。
     点中落下的安全草甸 → 接住一块；点错/漏接 → 温和重试。
     接住 8 块草甸即走通草地。
     =================================================== */
  function rtMarshTiles(stationData, engine) {
    var COLS = 4, NEED = 8;
    function build() {
      var wrap = rttMake({
        height: 330,
        tip: "💡 草甸从上面落下来，点中绿色草甸才算踩稳；紫色的泥潭别碰",
        initialMsg: "接住 8 块安全草甸，别踩到泥潭",
        init: function () {
          return { tiles: [], speed: 0.30, acc: 0, done: 0, spawnT: 0, won: false };
        },
        update: function (dt, s, W, H, win) {
          var d = s.data;
          if (d.won) { d.tiles = []; return; }
          d.spawnT += dt;
          if (d.spawnT >= 0.9 && d.done + d.tiles.length < NEED) {
            d.spawnT = 0;
            d.tiles.push({ col: (d.done + d.tiles.length) % COLS, y: 0, kind: "grass" });
          }
          for (var i = d.tiles.length - 1; i >= 0; i--) {
            d.tiles[i].y += d.speed * dt;
            if (d.tiles[i].y > 1.18) { d.tiles.splice(i, 1); var w = wrap._say; if (w) w("草甸落了，没踩到，再试。", true); }
          }
        },
        draw: function (c, s, W, H, t) {
          var d = s.data;
          var cw = W / COLS;
          c.fillStyle = "#8a6a3a"; c.fillRect(0, 0, W, H);
          for (var i = 0; i < COLS; i++) {
            c.fillStyle = "#a98a4a"; c.fillRect(i * cw, 0, cw, H);
            c.fillStyle = "#6a4a2a"; c.fillRect(i * cw + cw - 3, 0, 3, H);
          }
          d.tiles.forEach(function (tile) {
            var tx = tile.col * cw, ty = (tile.y - 0.2) * H;
            c.fillStyle = "#7fb069";
            rr(c, tx + 8, ty, cw - 16, 60, 8); c.fill();
            c.fillStyle = "#fff"; c.font = "22px sans-serif"; c.textAlign = "center";
            c.fillText("草甸", tx + cw / 2, ty + 38);
          });
          c.fillStyle = "#fff"; c.font = "16px sans-serif"; c.textAlign = "center";
          c.fillText("接住草甸 " + d.done + " / " + NEED, W / 2, H - 8);
        }
      });
      wrap.addEventListener("pointerdown", function (e) {
        var cv = wrap.querySelector(".rt-canvas");
        var r = cv.getBoundingClientRect();
        tapAt(e.clientX - r.left, e.clientY - r.top);
      });
      function tapAt(x, y) {
        var s = wrap.__state, d = s.data;
        if (d.won) return;
        var W = s._w || 320, cw = W / COLS;
        var col = Math.floor(x / cw);
        if (col < 0 || col >= COLS) return;
        var hit = -1;
        for (var i = 0; i < d.tiles.length; i++) { if (d.tiles[i].col === col && d.tiles[i].y > 0.12) { hit = i; break; } }
        if (hit >= 0) {
          d.tiles.splice(hit, 1); d.done++;
          say("踩稳一块草甸！");
          if (d.done >= NEED) { d.won = true; wrap.__win(); say("看清草甸再下脚——草地走通了！"); }
        } else {
          say("踩到泥潭边缘了，大家拉住你，换一块重来。", true);
        }
      }
      function say(t, s) { var w = wrap._say; if (w) w(t, s); }
      return wrap;
    }
    return build();
  }

  /* ===================================================
     松潘草地站 · 踏草甸过草地（marsh / 踏草甸）
     3×3 草格：绿且根须厚、不反光的是安全草甸；
     发黑、反光、有飘动草根的是泥潭。从入口逐步踩
     安全草甸到出口；走通后再做两个互助动作。
     =================================================== */
  function marshGame(stationData, engine) {
    var rows = 3, cols = 3;
    /* 安全草甸连成一条入口→出口的路，其余为泥潭 */
    var safe = {};
    [[0,0],[1,0],[2,0],[2,1],[2,2]].forEach(function (c) {
      safe[c[0] + "-" + c[1]] = true;
    });
    var SAFE_COUNT = 5;

    var state = { walked: 0, warmed: false, complete: false };

    var root = h("div", "marsh-game");
    root.style.cssText = "border:1px solid #bcd9b0;border-radius:14px;padding:16px;background:#f2f9ef;";

    var msg = h("div", "marsh-msg", "草地看着像草原，可下面藏着泥潭。");
    root.appendChild(msg);

    var sciText = (stationData && stationData.sciExplanation) ||
      "高原沼泽只能踏草甸，行军要看颜色辨安全。";
    root.appendChild(h("div", "marsh-sci", "🔵 " + sciText));

    var grid = h("div", "marsh-grid");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:360px;margin:12px 0;";
    root.appendChild(grid);

    var r, c;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        (function (rr, cc) {
          var key = rr + "-" + cc;
          var isSafe = !!safe[key];
          var btn = h("button", "marsh-cell", isSafe ? "🌱" : "💧");
          btn.style.cssText = "min-height:76px;font-size:26px;border-radius:10px;cursor:pointer;" +
            "border:2px solid " + (isSafe ? "#7fa86c" : "#6a6a6a") + ";" +
            "background:" + (isSafe ? "#d6ecd0" : "#3a3a3a") + ";color:" + (isSafe ? "#2c4a20" : "#cfcfcf") + ";";
          btn.setAttribute("data-cell", key);
          btn.setAttribute("title", isSafe ? "安全草甸" : "泥潭");
          btn.addEventListener("click", function () { onCellClick(key, isSafe, btn); });
          grid.appendChild(btn);
        })(r, c);
      }
    }
    root.appendChild(grid);

    var hint = h("div", "marsh-hint",
      "绿且根须厚、不反光的是草甸；发黑反光的是泥潭。从左上角入口走向右下角出口。");
    root.appendChild(hint);

    var status = h("div", "marsh-status", "先踩一块安全草甸试试。");
    root.appendChild(status);

    var helpRow = h("div", "marsh-help");
    helpRow.style.cssText = "display:none;gap:10px;flex-wrap:wrap;margin:12px 0;";
    var warmBtn = h("button", "primary marsh-help-btn", "背靠背取暖");
    var waterBtn = h("button", "primary marsh-help-btn", "互相递水");
    [warmBtn, waterBtn].forEach(function (b) {
      b.style.cssText = "min-height:48px;font-size:20px;padding:8px 16px;cursor:pointer;";
    });
    warmBtn.addEventListener("click", function () {
      if (state.complete) { say("草甸已经看清了。"); return; }
      if (state.warmed) { say("已经背靠背暖过了，再点「互相递水」。"); return; }
      state.warmed = true;
      warmBtn.style.background = "#cfe9c0";
      say("大家背靠背取暖，夜里冷也不怕。");
      status.textContent = "已背靠背取暖，再点「互相递水」。";
    });
    waterBtn.addEventListener("click", function () {
      if (state.complete) { say("草甸已经看清了。"); return; }
      if (!state.warmed) { say("先「背靠背取暖」，再「互相递水」。", true); return; }
      waterBtn.style.background = "#cfe9c0";
      state.complete = true;
      root.classList.add("complete");
      root.style.outline = "4px solid #7fa86c";
      root.style.outlineOffset = "2px";
      say("互相递水，谁渴了都有人照顾——看清草甸再下脚！");
      status.textContent = "踏草甸过草地完成！";
    });
    helpRow.appendChild(warmBtn);
    helpRow.appendChild(waterBtn);
    root.appendChild(helpRow);

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    function onCellClick(key, isSafe, btn) {
      if (state.complete) { say("草甸已经看清了。"); return; }
      if (btn.classList.contains("walked")) { return; }
      if (!isSafe) {
        /* 泥潭：不清空已走路径，温和提示，可换格重试 */
        btn.style.outline = "2px dashed #cf5a4f";
        say("泥潭下陷——大家拉住你，重新找一块草甸。", true);
        return;
      }
      btn.classList.add("walked");
      btn.style.background = "#a6d194";
      btn.style.outline = "3px solid #4f7a3e";
      btn.textContent = "✓";
      state.walked++;
      say("踩上草甸，根须厚厚的，站得很稳。");
      status.textContent = "已走过 " + state.walked + "/" + SAFE_COUNT + " 块草甸";
      if (state.walked === SAFE_COUNT) {
        helpRow.style.display = "flex";
        status.textContent = "从入口走到出口啦！现在帮一帮同伴。";
        say("草甸都踩稳了——再帮同伴一把。");
      }
    }

    return root;
  }

  /* ===================================================
     腊子口站 · 正面牵制、侧崖迂回（cliffRoute / 侧崖迂回）
     隘口示意 + 正面牵制点 / 侧崖攀爬点两个标记；
     先在侧崖候选点选可攀路线，再按「先正面、后侧崖」
     放标记，最后点「发信号」完成。
     =================================================== */
  function cliffRouteGame(stationData, engine) {
    var candidates = [
      { key: "smooth", label: "光滑陡坡", correct: false },
      { key: "vines",  label: "藤蔓挂壁", correct: false },
      { key: "route",  label: "岩缝+落脚点", correct: true }
    ];

    var state = { picked: false, front: false, side: false, complete: false };

    var root = h("div", "cliffroute-game");
    root.style.cssText = "border:1px solid #c7b78a;border-radius:14px;padding:16px;background:#fdfaf2;";

    var msg = h("div", "cliff-msg", "两山夹一沟，正面很窄，先找侧崖的路。");
    root.appendChild(msg);

    var sciText = (stationData && stationData.sciExplanation) ||
      "隘口正面易守难攻，侧崖小径是突破关键。";
    root.appendChild(h("div", "cliff-sci", "🔵 " + sciText));

    var routeBox = h("div", "cliff-routes");
    routeBox.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin:10px 0;";
    root.appendChild(routeBox);

    var markRow = h("div", "cliff-marks");
    markRow.style.cssText = "display:none;gap:10px;flex-wrap:wrap;margin:10px 0;";
    var frontBtn = h("button", "secondary mark-btn", "正面牵制点");
    var sideBtn = h("button", "secondary mark-btn", "侧崖攀爬点");
    var signalBtn = h("button", "primary signal-btn", "📣 发信号");
    [frontBtn, sideBtn, signalBtn].forEach(function (b) {
      b.style.cssText = "min-height:48px;font-size:20px;padding:8px 16px;cursor:pointer;";
    });
    signalBtn.style.display = "none";

    frontBtn.addEventListener("click", function () {
      if (state.complete) { say("隘口已经打通。"); return; }
      if (frontBtn.classList.contains("done")) { say("正面牵制已经放好了。"); return; }
      frontBtn.classList.add("done");
      frontBtn.style.background = "#f0d9a8";
      state.front = true;
      say("正面先吸引注意，把敌人牵在这里。");
    });
    sideBtn.addEventListener("click", function () {
      if (state.complete) { say("隘口已经打通。"); return; }
      if (sideBtn.classList.contains("done")) { say("侧崖攀爬点已经放好了。"); return; }
      if (!state.front) { say("先放「正面牵制点」吸引注意，再走侧崖。", true); return; }
      sideBtn.classList.add("done");
      sideBtn.style.background = "#f0d9a8";
      state.side = true;
      signalBtn.style.display = "";
      say("侧崖路打开了——可以发信号了！");
    });
    signalBtn.addEventListener("click", function () {
      if (state.complete) { say("隘口已经打通。"); return; }
      if (!state.side) { say("侧崖路还没放好，先放完标记。", true); return; }
      state.complete = true;
      root.classList.add("complete");
      root.style.outline = "4px solid #c7b78a";
      root.style.outlineOffset = "2px";
      say("正面吸引注意，侧崖打开通道——隘口打通了！");
    });
    markRow.appendChild(frontBtn);
    markRow.appendChild(sideBtn);
    markRow.appendChild(signalBtn);
    root.appendChild(markRow);

    var status = h("div", "cliff-status", "先在侧崖选一条能攀的路。");
    root.appendChild(status);

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    candidates.forEach(function (cd) {
      var b = h("button", "cliff-route-btn", cd.label);
      b.style.cssText = "padding:10px 14px;border:2px solid #d6c79b;border-radius:10px;background:#fff;cursor:pointer;font-size:20px;min-height:48px;";
      b.addEventListener("click", function () {
        if (state.complete) { say("隘口已经打通。"); return; }
        if (state.picked) { say("路线已经选好，开始放标记吧。"); return; }
        if (!cd.correct) {
          b.style.opacity = "0.55";
          b.disabled = true;
          say("这里坡面太陡，再找有岩缝和落脚处的路线。", true);
          return;
        }
        b.style.background = "#cfe9c0";
        b.style.borderColor = "#5f8f4e";
        state.picked = true;
        markRow.style.display = "flex";
        say("找到「岩缝+落脚点」的可攀路线——开始放标记。");
        status.textContent = "先放「正面牵制点」，再放「侧崖攀爬点」。";
      });
      routeBox.appendChild(b);
    });

    return root;
  }

/* ===================================================
     会师站 · 三路汇流（经典：连线一笔画）
     红一/红二/红四三支红军从三边出发，各绕开「山」走一条路，
     汇到中央会宁火炬。⇄ 切换当前指挥哪路；←↑↓→ 让它走一步。
     三路都到火炬即「三路星火相聚」。
     =================================================== */
  function rtJoinGame(stationData, engine) {
    var N = 9, CENTER = { r: 4, c: 4 };
    var ST = [ { r: 0, c: 4, c: "#b3202a" }, { r: 4, c: 0, c: "#d98a1f" }, { r: 4, c: 8, c: "#3a7a3a" } ];
    var MOUNT = { "3_4": 1, "5_4": 1, "4_3": 1, "4_5": 1 };
    function build() {
      var wrap = rttMake({
        height: 330,
        tip: "💡 ⇄ 切换当前队伍，←↑↓→ 让它绕开山走向中央火炬",
        initialMsg: "让三支队伍分别汇到会宁火炬",
        init: function () {
          var paths = ST.map(function (st) { return [{ r: st.r, c: st.c }]; });
          return { paths: paths, active: 0, reached: 0, won: false };
        },
        draw: function (c, s, W, H, t) {
          var d = s.data, cw = W / N, ch = H / N;
          c.fillStyle = "#f5efdd"; c.fillRect(0, 0, W, H);
          for (var key in MOUNT) {
            var p = key.split("_"); var mr = +p[0], mc = +p[1];
            c.fillStyle = "#5a6a3a"; rr(c, mc * cw + 1, mr * ch + 1, cw - 2, ch - 2, 6); c.fill();
            c.fillStyle = "#fff"; c.font = "13px sans-serif"; c.textAlign = "center"; c.fillText("山", mc * cw + cw / 2, mr * ch + ch / 2 + 5);
          }
          /* 火炬 */
          c.fillStyle = "#e6a23c"; c.beginPath(); c.arc(CENTER.c * cw + cw / 2, CENTER.r * ch + ch / 2, cw * 0.4, 0, 6.283); c.fill();
          c.fillStyle = "#fff"; c.font = "14px sans-serif"; c.textAlign = "center"; c.fillText("会师", CENTER.c * cw + cw / 2, CENTER.r * ch + ch / 2 + 5);
          /* 三路 */
          d.paths.forEach(function (path, i) {
            path.forEach(function (cell, j) {
              var x = cell.c * cw + cw / 2, y = cell.r * ch + ch / 2;
              c.fillStyle = ST[i].c;
              c.beginPath(); c.arc(x, y, j === path.length - 1 ? cw * 0.34 : cw * 0.26, 0, 6.283); c.fill();
            });
          });
          c.fillStyle = "#4a2f1a"; c.font = "15px sans-serif"; c.textAlign = "center";
          c.fillText("当前指挥：第 " + (d.active + 1) + " 路 · 已汇合 " + d.reached + " / 3", W / 2, H - 6);
        }
      });
      var btns = h("div", "frog-btns");
      [["⇄",9,9],["◀",0,-1],["▲",-1,0],["▼",1,0],["▶",0,1]].forEach(function (grp) {
        var b = h("button", "frog-btn", grp[0]);
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); act(grp[1], grp[2]); });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);
      function act(ar, ac) {
        var d = wrap.__state.data; if (d.won) return;
        if (ar === 9) { d.active = (d.active + 1) % 3; var w0 = wrap._say; if (w0) w0("切到第 " + (d.active + 1) + " 路。"); return; }
        var path = d.paths[d.active];
        var head = path[path.length - 1];
        var nr = head.r + ar, nc = head.c + ac;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N || MOUNT[nr + "_" + nc]) {
          d.paths[d.active] = [{ r: ST[d.active].r, c: ST[d.active].c }];
          var w1 = wrap._say; if (w1) w1("撞到山/走出路了，这一路退回起点重来。", true); return;
        }
        if (path.some(function (cell) { return cell.r === nr && cell.c === nc; })) {
          var w2 = wrap._say; if (w2) w2("这条路自己缠起来了，退回去。", true); return;
        }
        path.push({ r: nr, c: nc });
        if (nr === CENTER.r && nc === CENTER.c && !d.reached) {
          d.reached++; var w3 = wrap._say; if (w3) w3("第 " + (d.active + 1) + " 路抵达会宁！");
          if (d.reached >= 3) { d.won = true; wrap.__win(); var w4 = wrap._say; if (w4) w4("三路星火终于相聚！"); }
        }
      }
      return wrap;
    }
    return build();
  }

  function rendezvousGame(stationData, engine) {
    var rows = [
      { key: "red1", label: "红一方面军", route: null },
      { key: "red2", label: "红二方面军", route: null },
      { key: "red4", label: "红四方面军", route: null }
    ];

    var routes = {
      valley: { label: "沿河谷", ok: true },
      open:   { label: "开阔地", ok: true },
      mountain: { label: "穿难行山地", ok: false }
    };

    var state = { chosen: {}, torch: false, complete: false };

    var root = h("div", "rendezvous-game");
    root.style.cssText = "border:1px solid #c7b78a;border-radius:14px;padding:16px;background:#fdfaf2;";

    var msg = h("div", "rendezvous-msg",
      "三路北上，各自选一条好走的路，朝会宁与将台堡汇聚。");
    root.appendChild(msg);

    var sciText = (stationData && stationData.sciExplanation) ||
      "会宁和将台堡相对开阔，便于三路汇聚。";
    root.appendChild(h("div", "rendezvous-sci", "🔵 " + sciText));

    var pickRow = h("div", "rendezvous-pick");
    pickRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin:10px 0;";
    var torchBtn = h("button", "primary torch-btn", "🔥 点燃会师火炬");
    torchBtn.style.cssText = "min-height:48px;font-size:20px;padding:8px 16px;cursor:pointer;";
    torchBtn.style.display = "none";
    root.appendChild(pickRow);
    root.appendChild(torchBtn);

    rows.forEach(function (rd) {
      var box = h("div", "rendezvous-row");
      box.style.cssText = "border:2px solid #d6c79b;border-radius:10px;padding:10px;margin:8px 0;" +
        "display:flex;flex-wrap:wrap;align-items:center;gap:10px;";
      var label = h("span", "rendezvous-label", "🔴 " + rd.label);
      label.style.cssText = "font-size:20px;font-weight:600;min-width:140px;";
      box.appendChild(label);

      var routeBtns = {};
      Object.keys(routes).forEach(function (rk) {
        var rt = routes[rk];
        var b = h("button", "rendezvous-route", rt.label);
        b.style.cssText = "padding:8px 12px;border:2px solid #d6c79b;border-radius:8px;" +
          "background:#fff;cursor:pointer;font-size:20px;min-height:48px;";
        b.addEventListener("click", function () {
          if (state.complete) { say("三路已经会师，火炬点亮了。"); return; }
          if (state.chosen[rd.key]) { say(rd.label + "的路线已经选好，可以换选。", true); }
          if (!rt.ok) {
            say("换一条沿河谷或开阔地的路线，穿过难行山地太慢。", true);
            return;
          }
          Object.keys(routeBtns).forEach(function (k) {
            routeBtns[k].style.background = "#fff";
            routeBtns[k].style.borderColor = "#d6c79b";
          });
          b.style.background = "#cfe9c0";
          b.style.borderColor = "#5f8f4e";
          state.chosen[rd.key] = rk;
          checkReady();
        });
        routeBtns[rk] = b;
        box.appendChild(b);
      });
      pickRow.appendChild(box);
    });

    function checkReady() {
      var all = rows.every(function (rd) { return !!state.chosen[rd.key]; });
      if (all) {
        torchBtn.style.display = "";
        say("三路都选好了沿河谷或开阔地的路——可以点燃会师火炬了。");
      }
    }

    torchBtn.addEventListener("click", function () {
      if (state.complete) { say("三路已经会师，火炬点亮了。"); return; }
      if (!rows.every(function (rd) { return !!state.chosen[rd.key]; })) {
        say("还有一路没选好路线，先给三路各挑一条好走的路。", true);
        return;
      }
      state.complete = true;
      root.classList.add("complete");
      root.style.outline = "4px solid #c7b78a";
      root.style.outlineOffset = "2px";
      say("会宁与将台堡，三路星火终于相聚！1935.10 吴起镇初见锋芒，1936.10 三大主力终在西北会师。");
    });

    var status = h("div", "rendezvous-status", "三路各选一条能通过的路：沿河谷或开阔地。");
    root.appendChild(status);

    function say(text, shake) {
      msg.textContent = text;
      msg.classList.remove("shake");
      if (shake) { void msg.offsetWidth; msg.classList.add("shake"); }
    }

    return root;
  }

  var REGISTRY = { bridge: rtHuarongGame,
    ferry: rtFroggerGame,
    channel: rtSnakeGame,
    maze: rtPacGame,
    boarding: rtTetrisGame,
    snowPass: rtSnowSimon,
    plankBridge: rtWhackGame,
    marsh: rtMarshTiles,
    cliffRoute: rtCliffSimon,
    rendezvous: rtJoinGame };

  function renderDanger(container, stationData, engine) {
    var type = stationData && stationData.interactive && stationData.interactive.type;
    var fn = type && REGISTRY[type];
    if (fn) container.appendChild(fn(stationData, engine));
    else container.appendChild(placeholder(type));
    return container;
  }

  global.renderDanger = renderDanger;
})(window);
