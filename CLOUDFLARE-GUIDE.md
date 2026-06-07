# ☁️ 作品集网站配置指南

## 当前状态

- **服务器**: 阿里云 VPS (47.94.161.94)，nginx 端口 18080
- **域名**: kids.chenchenhaohao.top
- **网站根目录**: `/var/www/kids/`
- **已部署**: 火柴人大乱斗、燃尽星河 MV、20以内加减法

## 步骤：DNS 指向

打开 https://dash.cloudflare.com/ → **DNS** → **chenchenhaohao.top**

添加一条记录：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|---------|
| A | `kids` | `47.94.161.94` | ✅ 开启代理（橙色云朵） |

然后在 **规则 → Origin Rules** 中添加一条（或直接在 DNS 条目上设置）：

| 字段 | 值 |
|------|---|
| 主机名 | `kids.chenchenhaohao.top` |
| 端口 | `18080` |

> 如果不支持 Origin Rules，另一种方式是在 Cloudflare Zero Trust 中创建 Tunnel（与本机 wiki 相同的方式），但我实测 nginx + 直接代理的方式更简单。

保存后 1-2 分钟生效。

## 验证

浏览器打开 https://kids.chenchenhaohao.top 查看。

## 后续：上传 20以内加减法（如果文件在笔记本上）

```bash
# 在 WSL 终端中执行
scp /path/to/20以内加减法.html root@47.94.161.94:/var/www/kids/math20/index.html
```

## 新增作品

```bash
# 1. VPS 上建目录
ssh root@47.94.161.94 "mkdir /var/www/kids/xxx"

# 2. 上传文件
scp your-file root@47.94.161.94:/var/www/kids/xxx/index.html

# 3. 在主页 index.html 中加一张卡片（卡片格式参考已有卡片）
# 4. 上传更新后的主页
scp index.html root@47.94.161.94:/var/www/kids/
```

无需重启 nginx。
