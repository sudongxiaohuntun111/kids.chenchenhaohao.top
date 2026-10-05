/* =====================================================
   小红军长征记 2.0 · 入口（P0a 骨架）
   - hash 路由：#/intro 引章五幕，#/map 地图，
     #/station/<id> 站点，#/ending 会师结局
   - 引章五幕：逐幕「我已明白」，末幕碎片归位 → 开始长征
   - 无 minigame 引擎（险阻交互 P0b 实现）
   ===================================================== */

var app = document.getElementById("app");

var STATION_IDS = [
  "yudu", "wujiang", "zunyi", "chishui", "jinshajiang",
  "ludingqiao", "jiajinshan", "caodi", "lazikou", "huishi"
];
function getStation(id) {
  var i;
  for (i = 0; i < STATIONS.length; i++) { if (STATIONS[i].id === id) return STATIONS[i]; }
  return null;
}


/* ---------- 工具 ---------- */
function el(tag, props, children) {
  var node = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach(function (k) {
      if (k === "class") node.className = props[k];
      else if (k === "text") node.textContent = props[k];
      else if (k === "html") node.innerHTML = props[k];
      else node.setAttribute(k, props[k]);
    });
  }
  (children || []).forEach(function (c) {
    if (c) node.appendChild(c);
  });
  return node;
}

/* 主图：本地真实插画 <img>，加载失败时文字 fallback，不黑屏 */
function heroImage(src, alt, cls, fallback) {
  var holder = el("div", { class: "hero-figure" });
  var img = el("img", { class: cls, alt: alt });
  var done = false;
  function showFallback() {
    if (done) return;
    done = true;
    img.style.display = "none";
    holder.appendChild(el("div", { class: "hero-fallback", text: fallback }));
  }
  img.addEventListener("error", showFallback);
  img.src = src;
  if (img.complete && img.naturalWidth === 0) showFallback();
  holder.appendChild(img);
  return holder;
}

function clearApp() { app.innerHTML = ""; }

function scrollTop() { window.scrollTo(0, 0); }

/* 站点主图映射：按站点 id 接入现有 11 张图片（见 P1 规格） */
var STATION_ART = {
  yudu:       { file: "yudu-1-qiaiban.png",       scene: "于都渡桥" },
  wujiang:    { file: "wujiang-2-dujiang.png",    scene: "强渡乌江" },
  zunyi:      { file: "zunyi-3-youdao.png",       scene: "遵义找到新出路" },
  chishui:    { file: "chishui-4-jizhi.png",      scene: "四渡赤水奇制胜" },
  jinshajiang:{ file: "jinshajiang-5-baidu.png",  scene: "巧渡金沙江" },
  ludingqiao: { file: "ludingqiao-6-tiesuo.png",  scene: "飞夺泸定桥" },
  jiajinshan: { file: "jiajinshan-7-xueshan.png", scene: "翻越夹金山" },
  caodi:      { file: "caodi-8-caodian.png",      scene: "穿越草地" },
  lazikou:    { file: "lazikou-9-yubi.png",       scene: "腊子口天险" },
  huishi:     { file: "huishi-10-sanshi.png",     scene: "会师于都集结" }
};

/* 审图号（固定底部，标出底图来源与审图号） */
function renderFooter() {
  var foot = el("div", { class: "review-no", text: "审图号：GS(2023)2767号｜底图来源：自然资源部标准地图服务" });
  document.body.appendChild(foot);
}

/* ---------- 标准底图 + 独立路线叠加层（P0-map） ----------
   底图：assets/map/china_basemap_745.jpg（object-fit:contain，不裁南海附图与审图号）
   红飘带与站点标记：独立 SVG/DOM 叠加层，绝不写入 JPG 底图。 */
var MAP_ROUTE = [
  { id: "yudu",        x: 68.4, y: 77.4 },
  { id: "wujiang",     x: 53.2, y: 72.9 },
  { id: "zunyi",       x: 54.7, y: 72.3 },
  { id: "chishui",     x: 52.7, y: 70.0 },
  { id: "jinshajiang", x: 47.7, y: 75.4 },
  { id: "ludingqiao",  x: 47.1, y: 66.0 },
  { id: "jiajinshan",  x: 47.9, y: 64.0 },
  { id: "caodi",       x: 48.4, y: 58.6 },
  { id: "lazikou",     x: 49.0, y: 54.0 },
  { id: "huishi",      x: 51.6, y: 49.4 }
];

function buildMapStage() {
  var wrap = el("div", { class: "map-stage" });
  var base = el("div", { class: "map-base" }, [
    el("img", {
      class: "map-basemap",
      src: "assets/map/china_basemap_745.jpg",
      alt: "中国地图底图（审图号：GS(2023)2767号，自然资源部标准地图服务）"
    })
  ]);

  /* 底图加载失败时给出明确本地资源提示，不黑屏 */
  base.querySelector("img").addEventListener("error", function () {
    var fb = el("p", {
      class: "map-fallback",
      text: "底图加载失败：未找到本地资源 assets/map/china_basemap_745.jpg。请确认地图资源文件已随站点一起发布。"
    });
    base.appendChild(fb);
  });

  /* 独立 SVG 红飘带叠加层（不写入 JPG） */
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "route-overlay");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  var pts = MAP_ROUTE.map(function (m) { return m.x + "," + m.y; }).join(" ");
  var outer = document.createElementNS(svgNS, "polyline");
  outer.setAttribute("class", "route-line route-line-outer");
  outer.setAttribute("points", pts);
  var inner = document.createElementNS(svgNS, "polyline");
  inner.setAttribute("class", "route-line route-line-inner");
  inner.setAttribute("points", pts);
  svg.appendChild(outer);
  svg.appendChild(inner);

  /* 独立 DOM 站点标记层（可点、保留已走通状态） */
  var markers = el("div", { class: "route-markers" });
  MAP_ROUTE.forEach(function (m, i) {
    var s = getStation(m.id);
    var cleared = stationCleared(m.id);
    var cls = "route-marker" + (cleared ? " cleared" : "");
    var btn = el("button", {
      class: cls,
      "data-href": "#/station/" + m.id,
      style: "left:" + m.x + "%;top:" + m.y + "%;"
    }, [ el("span", { class: "route-dot", text: String(i + 1) }) ]);
    if (s) btn.appendChild(el("span", { class: "route-label", text: s.name }));
    if (cleared) btn.appendChild(el("span", { class: "route-cleared", text: "✓ 已走通" }));
    markers.appendChild(btn);
  });
  markers.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-href]");
    if (b) location.hash = b.getAttribute("data-href");
  });

  base.appendChild(svg);
  base.appendChild(markers);
  wrap.appendChild(base);
  wrap.appendChild(el("div", {
    class: "map-source-line",
    text: "底图来源：自然资源部标准地图服务｜审图号：GS(2023)2767号"
  }));
  return wrap;
}

function drawRibbon(stationIndex) {
  var wrap = el("div", { class: "red-ribbon" },
    [ el("div", { class: "ribbon-line" }),
      el("div", { class: "map-stations" },
        STATIONS.map(function (s, i) {
          var num = el("div", { class: "num", text: String(i + 1) });
          var cls = "map-station";
          var style = "";
          var cleared = stationCleared(s.id);
          if (cleared) cls += " cleared";
          if (i === stationIndex) style = "background:#f6d9d3;border-color:#b3202a;";
          var btn = el("button", { class: cls, "data-href": "#/station/" + s.id, style: style },
            [ num, el("span", { text: s.name }) ]);
          if (cleared) btn.appendChild(el("span", { class: "cleared-mark", text: "已走通" }));
          return btn;
        })
      )
    ]);
  wrap.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-href]");
    if (b) location.hash = b.getAttribute("data-href");
  });
  return wrap;
}

/* ---------- 引章五幕 ---------- */
var INTRO_ACTS = [
  {
    title: "第一幕 · 烽火启程",
    visual: "烽火启程",
    body: "1934 年 10 月，一支队伍从于都出发。路上遇到了出发以来最艰难的一战，队伍经历了巨大困难，但依然继续向前。",
    action: "轻轻点击马灯，为夜色里出发的队伍照亮"
  },
  {
    title: "第二幕 · 地图展开",
    visual: "长征红飘带",
    body: "一条红飘带连接 10 个站，从于都出发，一路走到会师。先看地图，再进站。",
    action: "滑动手指，沿红飘带认一认「于都 → 会师」的路线"
  },
  {
    title: "第三幕 · 险阻四色",
    visual: "四色胶囊",
    body: "沿途用四种颜色帮你认路：红色讲历史故事，黄色教你怎么走，绿色解开发险阻，蓝色看历史科普。",
    action: "依次点一点四色胶囊，认识每一站的样子"
  },
  {
    title: "第四幕 · 行走与选择",
    visual: "选择路标",
    body: "这一路没有体力条，也没有资源条。你的每一次选择，都会改变下一段旅程。",
    action: "点下一个路标，看看选择会带来什么变化"
  },
  {
    title: "第五幕 · 你的长征",
    visual: "长征画卷",
    body: "每一站都能收集：风物拼图、知识卡、金句卡、站点勋章。集齐就能拼成完整的长征画卷。",
    action: "把 4 块地图碎片拖回拼图框，地图归位"
  }
];

var introIndex = 0;
var introPiecesPlaced = 0;

function renderIntro() {
  var act = INTRO_ACTS[introIndex];
  var isLast = (introIndex === INTRO_ACTS.length - 1);

  /* 第一幕接入真实烽火图；其余幕无对应图，用非虚假的路线示意文字 */
  var introVisual;
  if (introIndex === 0) {
    introVisual = heroImage(
      "assets/img/intro-0-fenghuo.png",
      "红军从于都出发的烽火启程画面",
      "hero-img",
      "路线示意 · 烽火启程图未加载，请检查本地图片资源"
    );
  } else {
    introVisual = el("div", { class: "intro-visual", text: act.visual + " · 路线示意/交互预览" });
  }

  var screen = el("div", { class: "screen" }, [
    el("div", { class: "intro-wrap" }, [
      el("div", { class: "kicker", text: "《小红军长征记》2.0 · 从烽火到星辰" }),
      introVisual,
      el("div", { class: "paper-title", text: act.title }),
      el("p", { class: "body", text: act.body }),
      el("div", { class: "quote-card", text: INTRO_QUOTES[0].poem })
    ])
  ]);
  var wrap = screen.querySelector(".intro-wrap");
  var hint = el("div", { class: "hint", text: act.action });

  if (isLast) {
    /* 第五幕：手部操作 = 地图碎片归位，归位后出现「开始长征」 */
    var pieces = [
      { k: "于都", v: "起点" },
      { k: "泸定桥", v: "铁索" },
      { k: "草地", v: "草甸" },
      { k: "会师", v: "火炬" }
    ];
    var slot = el("div", { class: "puzzle-slot" });
    var placedPieces = pieces.map(function (p) {
      return el("button", { class: "puzzle-piece" }, [ el("span", { text: p.k }) ]);
    });
    placedPieces.forEach(function (p, i) {
      p.addEventListener("click", function () {
        if (p.className.indexOf("placed") === -1) {
          introPiecesPlaced++;
          p.classList.add("placed");
          p.querySelector("span").textContent = pieces[i].v;
        }
        refreshStart();
      });
    });
    slot.append(placedPieces[0], placedPieces[1], placedPieces[2], placedPieces[3]);

    var startBtn = el("button", { class: "full secondary", text: "开始长征" });
    var refreshStart = function () {
      var done = introPiecesPlaced >= 4;
      startBtn.disabled = !done;
      startBtn.style.opacity = done ? "1" : ".4";
      startBtn.textContent = done ? "开始长征" : "请先放入 " + introPiecesPlaced + " / 4 块碎片";
    };
    startBtn.addEventListener("click", function () { location.hash = "#/map"; });

    wrap.append(hint, slot, startBtn);
    refreshStart();
  } else {
    var nextBtn = el("button", { text: "我已明白" });
    nextBtn.addEventListener("click", function () {
      introIndex++;
      introPiecesPlaced = 0;
      renderIntro();
    });
    wrap.append(hint, nextBtn);
  }

  clearApp();
  app.appendChild(screen);
}

/* ---------- 地图 ---------- */
function renderMap() {
  var cn = currentAndNext(STATION_IDS);
  var cur = getStation(cn.currentId);
  var nextName = cn.nextId === "ending" ? "会师 · 凯旋" : (getStation(cn.nextId) ? getStation(cn.nextId).name : "会师");

  var targetRow = el("div", { class: "map-target" }, [
    el("div", { class: "target-item" }, [ el("span", { class: "target-label", text: "当前站点" }), el("span", { class: "target-name", text: cur ? cur.name : "" }) ]),
    el("div", { class: "target-item" }, [ el("span", { class: "target-label", text: "下一站" }), el("span", { class: "target-name", text: nextName }) ])
  ]);

  var cards = el("div", { class: "station-cards" });
  STATIONS.forEach(function (s, i) {
    var cleared = stationCleared(s.id);
    cards.appendChild(el("button", {
      class: "station-card" + (cleared ? " cleared" : ""),
      "data-href": "#/station/" + s.id
    }, [
      el("div", { class: "card-num", text: String(i + 1) }),
      el("div", { class: "card-name", text: s.name }),
      el("div", { class: "card-time", text: s.time }),
      el("div", { class: "card-badge", text: cleared ? "已走通" : "待出发" })
    ]));
  });
  cards.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-href]");
    if (b) location.hash = b.getAttribute("data-href");
  });

  var transRow = el("div", { class: "transition-row" });
  TRANSITIONS.forEach(function (t) {
    transRow.appendChild(el("button", {
      class: "transition-star",
      "data-href": "#/trans/" + t.id
    }, [
      el("span", { class: "star-icon", text: "★" }),
      el("span", { class: "star-name", text: t.name }),
      el("span", { class: "star-time", text: t.time })
    ]));
  });
  transRow.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-href]");
    if (b) location.hash = b.getAttribute("data-href");
  });

  var screen = el("div", { class: "screen" }, [
    el("div", { class: "map-wrap" }, [
      el("div", { class: "kicker", text: "长征红飘带总览" }),
      el("div", { class: "paper-title", text: "长征地图" }),
      el("p", { class: "body", text: "从于都出发，沿着红飘带一站一站走到会师。点一站，就进入那一站的故事；点小星点，看沿途过场。" }),
      buildMapStage(),
      targetRow,
      cards,
      transRow,
      el("p", { class: "map-note", text: "红飘带会随你走过的一站一站，一段一段向前延伸。" })
    ])
  ]);
  clearApp();
  app.appendChild(screen);
}

/* ---------- 站点 ---------- */
function renderStation(id) {
  var s = getStation(id);
  if (!s) { renderNotFound(); return; }
  var index = STATION_IDS.indexOf(id);

  var belt = el("div", { class: "capsules-wrap" }, [
    el("span", { class: "capsule red", text: "历史故事" }),
    el("span", { class: "capsule yellow", text: "该怎么走" }),
    el("span", { class: "capsule green", text: "险阻解码" }),
    el("span", { class: "capsule blue", text: "历史科普" })
  ]);

  var meta = el("div", { class: "station-meta" }, [
    el("span", { class: "tag", text: "时间 " + s.time }),
    el("span", { class: "tag", text: "科学 " + s.sciTag }),
    el("span", { class: "tag", text: "勋章 · " + s.badge })
  ]);

  /* 站点主图：按 id 接入现有插画，alt 用站点名 + 场景 */
  var art = STATION_ART[id];
  var hero = art
    ? heroImage(
        "assets/img/" + art.file,
        s.name + " · " + art.scene + "（历史插画，非精确地图）",
        "hero-img hero-img-station",
        "站点主图未加载 · 请查看「" + s.name + "」的故事文字"
      )
    : null;

  /* 🔴 背景故事 + 上一站印记联动叙事 */
  var storyCard = el("div", { class: "card" }, [
    el("h3", { text: "🔴 历史故事" }),
    el("p", { class: "body", text: s.story })
  ]);
  var impact = (index > 0) ? impactLine(STATION_IDS[index - 1], STATIONS, STATION_IDS) : null;
  if (impact) {
    var impactCard = el("div", { class: "impact-card" }, [
      el("div", { class: "impact-title", text: impact.title }),
      el("p", { class: "body", text: impact.body })
    ]);
    storyCard.insertBefore(impactCard, storyCard.querySelector("h3").nextSibling);
  }

  var quote = el("div", { class: "quote-card", text: "「" + s.quote + "」" });

  /* 🟡 抉择：保存印记、高亮、本站内可改选 */
  var selected = journeyHas(id) ? journeyGet()[id] : -1;
  var choices = el("div", { class: "choice-grid" });
  s.choice.forEach(function (c, idx) {
    var btn = el("button", { class: idx === selected ? "chosen" : "", "data-idx": String(idx) }, [
      el("div", { text: c.text }),
      el("div", { style: "font-size:18px;font-weight:400;opacity:.9;margin-top:6px;", text: "影响：" + c.effect })
    ]);
    btn.addEventListener("click", function () {
      journeySet(id, idx);
      renderStation(id);
    });
    choices.appendChild(btn);
  });
  var choiceCard = el("div", { class: "card" }, [
    el("h3", { text: "🟡 该怎么走 · 推演一下：如果你是红军，会怎么选？" }),
    el("p", { class: "choice-tip", text: selected >= 0 ? "你的选择已经记进旅程印记了，可以在这里改选。" : "点一个选项：它不会扣分，只会记下你的选择，并影响下一站的开场。" }),
    choices
  ]);

  /* 🟢 险阻解码 + 轻补救 */
  var remedy = remedyCopy(s.interactive);
  var remedyState = 0;
  var hintBox = el("div", { class: "remedy-hint" });
  var hintBtn = el("button", { class: "secondary remedy-btn", text: "老班长提示" });
  var retryBtn = el("button", { class: "ghost remedy-btn", text: "换一种过法" });
  hintBtn.addEventListener("click", function () {
    remedyState++;
    hintBox.textContent = remedyState >= 2 ? remedy.second : remedy.first;
  });
  retryBtn.addEventListener("click", function () {
    resetInteraction();          /* 生成初始标记，交互区回到最初 */
    renderStation(id);           /* 重建险阻区；旅程印记不清空 */
  });

  /* 险阻区：有已注册玩法则渲染小游戏，否则保持占位 */
  var dangerArea = el("div", { class: "danger-area" });
  if (s.interactive && s.interactive.type && s.interactive.type !== "TODO") {
    renderDanger(dangerArea, s, null);   /* 玩法只做完成判定；点亮由“我通过了这一站”触发 */
  } else {
    var dangerSeal = el("div", { class: "seal", text: "玩法：待实现（P0b）" });
    dangerArea.appendChild(dangerSeal);
  }

  var interCard = el("div", { class: "card" }, [
    el("h3", { text: "🟢 险阻解码" }),
    el("p", { class: "body", text: s.interactive.desc }),
    dangerArea,
    hintBox,
    el("div", { class: "danger-actions" }, [ hintBtn, retryBtn ])
  ]);

  var sciCard = el("div", { class: "card" }, [
    el("h3", { text: "🔵 历史科普" }),
    el("p", { class: "body", text: s.trivia })
  ]);

  var understandingCard = el("div", { class: "card" }, [
    el("h3", { text: "孩子获得的理解" }),
    el("p", { class: "body", text: s.understanding })
  ]);

  /* 通关收集：四件套卡槽，空槽表示未收集 */
  var cleared = stationCleared(id);
  var collectCard = el("div", { class: "card collect-card" }, [
    el("h3", { text: "通关收集" }),
    el("p", { class: "body", text: "这一站的四件套：走通了才会点亮，没走通就是空槽。集齐四件套，就能拼成完整的长征画卷。" }),
    el("div", { class: "collect-slots" }, collectSlots().map(function (slot) {
      return el("div", { class: "collect-slot" + (cleared ? " lit" : "") }, [
        el("div", { class: "slot-icon", text: cleared ? slot.icon : "?" }),
        el("div", { class: "slot-label", text: slot.label })
      ]);
    }))
  ]);

  var passBtn = el("button", {
    class: "full secondary pass-btn",
    text: cleared ? "已走过这一站 · 返回地图" : "我通过了这一站"
  });
  passBtn.addEventListener("click", function () {
    if (!cleared) collectUnlock(id);
    location.hash = "#/map";
  });

  var nav = el("div", { style: "display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-top:20px;" }, [
    el("button", { class: "ghost", text: "← 返回地图" }),
    el("button", { text: "下一站 →" })
  ]);
  nav.addEventListener("click", function (e) {
    var btns = nav.querySelectorAll("button");
    var which = Array.prototype.indexOf.call(btns, e.target);
    if (which === 0) location.hash = "#/map";
    else {
      var nextId = STATION_IDS[index + 1];
      if (nextId) location.hash = "#/station/" + nextId;
      else location.hash = "#/ending";
    }
  });

  var screen = el("div", { class: "screen" }, [
    el("div", { class: "kicker", text: "第 " + (index + 1) + " 站 / 10" }),
    el("div", { class: "paper-title", text: s.name }),
    el("div", { class: "station-header" }, [belt, meta]),
    hero,
    storyCard,
    quote,
    choiceCard,
    interCard,
    sciCard,
    understandingCard,
    collectCard,
    passBtn,
    drawRibbon(index),
    nav
  ]);

  clearApp();
  app.appendChild(screen);
}

/* ---------- 过场 ---------- */
function renderTransition(id) {
  var t = null;
  TRANSITIONS.forEach(function (x) { if (x.id === id) t = x; });
  if (!t) { renderNotFound(); return; }
  var screen = el("div", { class: "screen" }, [
    el("div", { class: "transition-wrap" }, [
      el("div", { class: "kicker", text: t.kind + " · " + t.time }),
      el("div", { class: "paper-title", text: t.name }),
      el("div", { class: "intro-visual", text: t.name + " · 过场画面" }),
      el("p", { class: "body", text: t.text }),
      el("button", { text: "继续前进" })
    ])
  ]);
  screen.querySelector("button").addEventListener("click", function () {
    location.hash = "#/map";
  });
  clearApp();
  app.appendChild(screen);
}

/* ---------- 结局 ---------- */
function renderEnding() {
  var screen = el("div", { class: "screen" }, [
    el("div", { class: "ending-wrap" }, [
      el("div", { class: "kicker", text: "三大主力会师 · 从烽火到星辰" }),
      el("div", { class: "paper-title", text: "长征胜利会师" }),
      el("div", { class: "intro-visual", text: "会师画卷 · 路线示意" }),
      el("p", { class: "body", text: "红一、红二、红四方面军三路北上，在甘肃会宁、宁夏将台堡会师，长征胜利结束。" }),
      el("div", { class: "quote-card", text: "「三路星火，终于聚成一把火炬。」" }),
      el("p", { class: "body", text: "你的长征走完了。红飘带在这里连成完整的长征画卷。" }),
      el("button", { text: "回到地图 再看看走过的路" })
    ])
  ]);
  screen.querySelector("button").addEventListener("click", function () {
    location.hash = "#/map";
  });
  clearApp();
  app.appendChild(screen);
}

/* ---------- 404 ---------- */
function renderNotFound() {
  var screen = el("div", { class: "screen" }, [
    el("div", { class: "intro-wrap" }, [
      el("div", { class: "paper-title", text: "没有找到这一站" }),
      el("p", { class: "body", text: "你走的路线好像出了点岔子。" }),
      el("button", { text: "返回长征地图" })
    ])
  ]);
  screen.querySelector("button").addEventListener("click", function () {
    location.hash = "#/map";
  });
  clearApp();
  app.appendChild(screen);
}

/* ---------- 路由 ---------- */
function route() {
  var removing = document.querySelector(".review-no");
  if (removing) removing.remove();

  var hash = location.hash || "#/intro";
  if (hash === "#/intro") renderIntro();
  else if (hash === "#/map") renderMap();
  else if (hash.indexOf("#/station/") === 0) {
    var id = hash.replace("#/station/", "");
    renderStation(id);
  }
  else if (hash.indexOf("#/trans/") === 0) {
    renderTransition(hash.replace("#/trans/", ""));
  }
  else if (hash === "#/ending") renderEnding();
  else renderNotFound();

  renderFooter();
  scrollTop();
}

window.addEventListener("hashchange", route);
route();
