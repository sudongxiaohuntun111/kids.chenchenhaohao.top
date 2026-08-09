# 威龙突袭 · AI 像素精灵图生成提示词

本文件指导你使用任意图像生成工具（Midjourney、Stable Diffusion、即梦、可灵、豆包 / ChatGPT 图像生成等）生成两张精灵图表（sprite sheet），替换 `assets/weilong.png` 与 `assets/warden.png`。

> **不用改一行代码**：只要 PNG 按下方规格命名并放到 `assets/` 目录，游戏会自动加载；如果文件不存在，则使用内置的程序化像素角色。

---

## 通用要求

- **画风**：复古像素艺术 / retro 16-bit game pixel art / SNES style
- **背景**：完全透明（transparent background / alpha channel），保存为 PNG
- **视角**：纯侧面（strict side view），默认面向右侧（face right）。游戏内会通过水平翻转实现面向左。
- **文件格式**：PNG，8-bit 或 32-bit 均可，建议无压缩失真
- **对齐方式**：每一帧必须尺寸严格一致，排成网格，禁止帧之间互相重叠或大小不一

---

## 1. 玩家：威龙（三角洲行动风格突击兵）

### 文件位置
```
assets/weilong.png
```

### 规格

| 项目 | 数值 |
|---|---|
| 单帧宽 × 高 | 64 × 64 像素 |
| 网格 | 4 行 × 6 列 |
| 整张图尺寸 | **384 × 256 像素** |

### 动画分配（行）

| 行 | 动画名 | 帧数 | 列范围 | 动作描述 |
|---|---|---|---|---|
| 0 | `idle` | 2 | 0–1 | 站立呼吸，身体轻微起伏，枪口略朝右前 |
| 1 | `run` | 6 | 0–5 | 向右奔跑循环，双腿交替大幅摆动，双臂配合 |
| 2 | `jump` | 2 | 0–1 | 腾空，一腿前伸一腿后收，身体略前倾 |
| 3 | `shoot` | 2 | 0–1 | 举枪射击，一帧枪口有黄色/橙色火光，一帧无火光 |

### 角色外观关键词（可替换进提示词）

> 亚洲男性特种兵，短发，戴战术头盔与深色护目镜，肤色中等，身穿橄榄绿/卡其色战术服，胸前有深色防弹背心（可带金色/黄色细节），护膝与战术靴，手持一把现代化突击步枪。整体肌肉结实、干练。

### 可直接复制的提示词

**英文版（推荐喂给 SD / Midjourney / Gemini / DALL·E）：**

```
Pixel art sprite sheet of a modern Chinese special forces soldier inspired by Weilong from Delta Force.
Side view, facing right, transparent background.
64x64 pixels per frame, 4 rows by 6 columns, total 384x256 pixels.
Row 1 idle: 2 frames, standing breathing.
Row 2 run: 6 frames, full running cycle.
Row 3 jump: 2 frames, airborne.
Row 4 shoot: 2 frames, one with muzzle flash.
Character has short dark hair, tactical helmet, dark goggles, olive-tan combat uniform, dark plate carrier with subtle gold accents, knee pads, boots, and holds a modern assault rifle.
Retro 16-bit SNES color palette, clean outlines, no anti-aliasing, consistent proportions across all frames.
```

**中文版（可喂给即梦 / 可灵 / 豆包等）：**

```
像素风游戏精灵图表：一名中国现代特种兵，参考三角洲行动中的威龙形象。
纯侧面，面向右侧，透明背景。
每帧 64×64 像素，共 4 行 6 列，整张图 384×256 像素。
第 1 行 idle 待机：2 帧，站立呼吸。
第 2 行 run 奔跑：6 帧，完整奔跑循环，双腿大幅交替摆动。
第 3 行 jump 跳跃：2 帧，空中腾跃，一腿前伸一腿后收。
第 4 行 shoot 射击：2 帧，举枪开火，其中一帧带枪口火光。
角色特征：短发、战术头盔、深色护目镜、橄榄绿或卡其色战术服、深色防弹背心（可带少量金色细节）、护膝、战术靴、手持现代突击步枪。
复古 16-bit SNES 配色，边缘清晰，无抗锯齿，所有帧比例一致。
```

---

## 2. Boss：典狱长

### 文件位置
```
assets/warden.png
```

### 规格

| 项目 | 数值 |
|---|---|
| 单帧宽 × 高 | 128 × 128 像素 |
| 网格 | 4 行 × 2 列 |
| 整张图尺寸 | **256 × 512 像素** |

### 动画分配（行）

| 行 | 动画名 | 帧数 | 列范围 | 动作描述 |
|---|---|---|---|---|
| 0 | `idle` | 2 | 0–1 | 重型装甲站立，胸口红色核心脉动，眼部发光 |
| 1 | `atk1` | 2 | 0–1 | 双肩炮抬起齐射，带炮口火光 |
| 2 | `atk2` | 2 | 0–1 | 单手/双臂前冲撞姿势，身体前倾 |
| 3 | `hurt` | 1 | 0 | 受击，身体后仰、眼部红光变暗 |

### 角色外观关键词

> 巨型重甲人形 Boss，全身深灰/黑钢装甲，红色点缀与肩甲，胸口有发光红色核心，戴全封闭面具头盔，双眼发出红光，双肩装备大型肩炮，四肢粗壮，整体压迫感强。

### 可直接复制的提示词

**英文版：**

```
Pixel art sprite sheet of a massive armored boss character "The Warden".
Side view, facing right, transparent background.
128x128 pixels per frame, 4 rows by 2 columns, total 256x512 pixels.
Row 1 idle: 2 frames, heavy breathing, glowing red chest core and red eyes.
Row 2 atk1: 2 frames, both shoulder cannons raising and firing with muzzle flash.
Row 3 atk2: 2 frames, charging/lunge pose, body leaning forward aggressively.
Row 4 hurt: 1 frame, hit reaction, leaning back, red lights dimmed.
Character is a hulking humanoid in dark steel armor with red trim, a full-face mask, shoulder cannons, thick limbs, menacing silhouette.
Retro 16-bit SNES pixel art, no anti-aliasing, consistent proportions, solid black outlines.
```

**中文版：**

```
像素风游戏 Boss 精灵图表：巨型重甲人形敌人「典狱长」。
纯侧面，面向右侧，透明背景。
每帧 128×128 像素，共 4 行 2 列，整张图 256×512 像素。
第 1 行 idle 待机：2 帧，重甲站立，胸口红色核心脉动，双眼发红光。
第 2 行 atk1 射击：2 帧，双肩大炮抬起并开火，带炮口火光。
第 3 行 atk2 冲锋：2 帧，身体前倾准备冲撞。
第 4 行 hurt 受击：1 帧，身体后仰，红光变暗。
角色特征：庞大的人形、深钢色重型装甲、红色肩甲与核心、全封闭面具头盔、双肩装备大炮、四肢粗壮、气势压迫感强。
复古 16-bit SNES 像素艺术，无抗锯齿，比例一致，黑色清晰描边。
```

---

## 替换方法

1. 生成 PNG 后分别命名为 `weilong.png` 与 `warden.png`。
2. 放到 `/workspace/assets/` 目录。
3. 刷新 `index.html`，游戏会自动加载。
4. 若发现帧偏移，打开 `index.html` 搜索 `SPRITE_CFG`，修改 `fw`、`fh` 为你的实际帧尺寸（例如 AI 生成的是 64×62，就改成 62）。

> 提示：AI 生成多帧一致性较低，建议先用 **1 张角色三视图/定稿图** 做风格参考，再要求工具生成动作帧，能得到更稳定的结果。
