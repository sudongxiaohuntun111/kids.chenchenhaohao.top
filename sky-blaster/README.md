# Sky Blaster - 天空突击者

2D竖版卷轴射击游戏 + Roguelike技能升级系统

## 如何运行

1. 打开浏览器（推荐 Chrome 或 Firefox）
2. 打开 `index.html` 文件
3. 选择难度开始游戏

## 操作说明

- **WASD / 方向键**：移动战机
- **自动射击**：战机自动开火
- **ESC**：暂停游戏
- **M**：静音/取消静音
- **1/2/3**：在菜单中快速选择

## 游戏特色

- 3种难度选择，适合不同水平玩家
- 8种可升级技能，每次升级随机3选1
- 3个关卡，每关有独特Boss
- 像素风格画面，适合儿童
- 基础音效反馈

## 技术栈

- HTML5 Canvas
- 原生 JavaScript (ES6)
- Web Audio API (音效)

## 项目结构

```
├── index.html          # 游戏入口
├── css/style.css       # 样式
├── js/
│   ├── main.js         # 游戏主循环
│   ├── config.js       # 配置数据
│   ├── player.js       # 玩家系统
│   ├── enemies.js      # 敌人系统
│   ├── boss.js         # Boss系统
│   ├── skills.js       # 技能系统
│   ├── bullets.js      # 子弹系统
│   ├── experience.js   # 经验系统
│   ├── levels.js       # 关卡系统
│   ├── particles.js    # 粒子特效
│   ├── audio.js        # 音效系统
│   ├── ui.js           # UI系统
│   └── utils.js        # 工具函数
└── assets/             # 资源文件
```