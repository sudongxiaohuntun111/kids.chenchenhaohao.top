/* =====================================================
   小红军长征记 2.0 · 核心引擎框架（P0b1）
   - 旅程印记：localStorage `cz_journey`，每站只存 0/1/2
   - 收集系统：localStorage `cz_collect`，空槽表示未收集
   - 轻补救：老班长提示 / 换一种过法（不做数字计数）
   - 红飘带地图：通关点亮、当前站 / 下一站
   - 通用站点流程控制器：故事→抉择→险阻→科普→收集→点亮
   红线：无数值、无进度、无挫败，全部中文。
   ===================================================== */

var CZ_JOURNEY_KEY = "cz_journey";
var CZ_COLLECT_KEY = "cz_collect";

/* ---------- 本地存储封装 ---------- */
function readStore(key) {
  try {
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function writeStore(key, obj) {
  try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) { /* 隐私模式忽略 */ }
}

/* =====================================================
   旅程印记系统
   格式：{ [stationId]: choiceIndex }，choiceIndex 仅 0/1/2
   ===================================================== */
function journeyGet() { return readStore(CZ_JOURNEY_KEY); }

function journeySet(id, idx) {
  var j = journeyGet();
  if (idx === undefined || idx === null) { delete j[id]; }
  else { j[id] = Math.max(0, Math.min(2, Math.floor(idx))); } /* 只保留 0/1/2 */
  writeStore(CZ_JOURNEY_KEY, j);
  return j;
}

function journeyHas(id) {
  var j = journeyGet();
  return Object.prototype.hasOwnProperty.call(j, id);
}

/* =====================================================
   收集系统（无进度条，空槽表示未收集）
   每站通关解锁四件套，存为 { [stationId]: true }
   ===================================================== */
function collectGet() { return readStore(CZ_COLLECT_KEY); }

function collectUnlock(stationId) {
  var c = collectGet();
  c[stationId] = true;
  writeStore(CZ_COLLECT_KEY, c);
  return c;
}

function stationCleared(id) {
  return collectGet()[id] === true;
}

/* 四件套卡槽定义（顺序固定） */
function collectSlots() {
  return [
    { key: "fengwu",   label: "风物拼图", icon: "🧩" },
    { key: "zhishi",   label: "知识卡",   icon: "📖" },
    { key: "jinyu",    label: "金句卡",   icon: "✒️" },
    { key: "xunzhang", label: "站点勋章", icon: "🎖️" }
  ];
}

/* =====================================================
   红飘带地图：当前站 / 下一站（无百分比、无数字进度）
   ===================================================== */
function currentAndNext(stationIds) {
  var idx = -1, i;
  for (i = 0; i < stationIds.length; i++) {
    if (!stationCleared(stationIds[i])) { idx = i; break; }
  }
  if (idx === -1) idx = stationIds.length - 1; /* 全部通关，当前即最后一站 */
  var nextId = stationIds[idx + 1] || "ending";
  return { currentIndex: idx, currentId: stationIds[idx], nextId: nextId };
}

/* =====================================================
   轻补救系统（不挫败，无数值）
   - 老班长提示：第一次行动线索；第二次历史解法 + 收尾句
   - 换一种过法：返回初始标记（由页面重置交互），不清印记
   ===================================================== */
function remedyCopy(interactive) {
  var scene = (interactive && interactive.desc) || "这一段险阻";
  var action = String(scene).split("：")[0].trim() || "这一段险阻";
  return {
    first: "先别急着动手：" + action + "，留意画面里水流、山形、天色给出的线索，再试一次。",
    second: "当年红军稳扎稳打、分清主次，把最难的一步拆开，一步步走通这条路。当年红军就是这样做的。"
  };
}

/* 换一种过法：返回一个自增标记，供页面重建险阻区为初始状态 */
var _resetToken = 0;
function resetInteraction() {
  _resetToken++;
  return _resetToken;
}

/* =====================================================
   通用站点流程控制器
   提供标准流程的顺序与文案，供入口页按
   🔴→🟡→🟢→🔵→收集→点亮 渲染。
   ===================================================== */
var STATION_FLOW = {
  order: ["story", "choice", "danger", "science", "collect"],
  stepTitle: {
    story:   "🔴 历史故事",
    choice:  "🟡 该怎么走 · 推演一下：如果你是红军，会怎么选？",
    danger:  "🟢 险阻解码",
    science: "🔵 历史科普",
    collect: "通关收集"
  }
};

/* 上一站影响叙述：取上一站已存印记，生成本站开场联动句 */
function impactLine(prevStationId, stations, stationIds) {
  if (!prevStationId || !journeyHas(prevStationId)) return null;
  var prev = null, i;
  for (i = 0; i < stations.length; i++) { if (stations[i].id === prevStationId) prev = stations[i]; }
  if (!prev) return null;
  var idx = journeyGet()[prevStationId];
  var choice = prev.choice[idx];
  if (!choice) return null;
  return {
    title: "上一站 · " + prev.name + " 的选择还在影响你",
    body: "因为上一站你选择了「" + choice.text + "」：" + choice.effect + "。带着这份经验，走进这一站。"
  };
}
