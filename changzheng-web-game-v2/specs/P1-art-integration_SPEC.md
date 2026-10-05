# P1-art-integration SPEC：接入现有 11 张主融字图

## 目标
把 `assets/img/` 中现有 11 张图片真正接入页面，消除引章/过场/站点的“插画占位”。不生成新图，不修改玩法逻辑。

## 映射
- 引章第一幕：`intro-0-fenghuo.png`
- 站点主图：按站点 id 使用：
  - yudu → yudu-1-qiaiban.png
  - wujiang → wujiang-2-dujiang.png
  - zunyi → zunyi-3-youdao.png
  - chishui → chishui-4-jizhi.png
  - jinshajiang → jinshajiang-5-baidu.png
  - ludingqiao → ludingqiao-6-tiesuo.png
  - jiajinshan → jiajinshan-7-xueshan.png
  - caodi → caodi-8-caodian.png
  - lazikou → lazikou-9-yubi.png
  - huishi → huishi-10-sanshi.png

## 要求
- 修改 `js/main.js` 和 `css/main.css`，只做视觉接入；不得改游戏逻辑、路由、数据、引擎。
- 引章第一幕 visual 区替换为真实 `<img>`；其他引章幕没有对应图时保留文字视觉，但不得继续写“插画占位”，改成“路线示意/交互预览”等非虚假文本。
- 站点页在站点标题/故事区域加入主图 `<img>`，alt 使用站点名称+场景，不把 AI 图当准确地图。
- 过场页没有对应图片时使用“过场画面”而不是“插画占位”。
- 图片加载失败要有文本 fallback，不得黑屏。
- 移动端响应式，主图宽度 100%，高度合理，object-fit:cover 或 contain；不得遮挡交互按钮。
- 图片必须用相对路径 `assets/img/...`，确保离线包和公网均可用。
- 运行 `node --check js/*.js`，用浏览器确认引章第一幕及 10 个站点均能看到对应 img。
