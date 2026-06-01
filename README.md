# kids.chenchenhaohao.top

儿童游戏合集网站，部署在 `kids.chenchenhaohao.top`。

## 🎮 包含的游戏

| 游戏 | 目录 | 说明 |
|------|------|------|
| **深海进化大冒险** | `deep-evolution/` | Canvas 深海进化游戏，小丑鱼吃小鱼→进化→选能力 |
| **数学20** | `math20/` | 数学练习游戏 |
| **太空之星 MV** | `mv-space-star/` | 太空主题 MV（含 video.mp4） |
| **火柴人格斗** | `stickman-fighter/` | 火柴人战斗游戏 |

## 🌐 访问地址

`https://kids.chenchenhaohao.top`

## 🏗️ 部署架构

- **VPS**: 47.94.161.94 (阿里云北京)
- **Nginx**: 端口 18080, `/var/www/kids/`
- **Cloudflare Tunnel**: 6d839fba-a5fe-4af9-a46f-7137ca6259fb
- **DNS**: CNAME 指向 `6d839fba...cfargotunnel.com` (Proxied)

## 📝 部署说明

完整的部署指南见 [chenchenhaohao-top-deployment](https://github.com/sudongxiaohuntun111/chenchenhaohao-top-deployment)
