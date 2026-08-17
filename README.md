# yzc-666.github.io

Zichao Yu 的个人学术主页。暗黑赛博朋克风格，手写静态 HTML/CSS/JS，
无框架、无构建步骤，除两个 Google 字体外没有任何依赖。

线上地址：<https://yzc-666.github.io>

## 结构

着陆页只做自我介绍，具体内容分在两个子页面里。

```
index.html            着陆页：姓名、身份、简介、研究关键词、两张入口卡片
publications.html     论文列表（当前是「暂无」状态，模板已备好）
experience.html       工作经历（目前为 Kling 实习）
404.html              找不到页面时的赛博朋克 404
robots.txt            搜索引擎抓取规则
sitemap.xml           新增页面时记得同步这里
assets/
  css/style.css       全站样式：配色、背景特效、导航、卡片、论文列表、时间线
  css/page.css        子页面的标题区、面包屑、空状态
  js/main.js          打字效果、滚动进度条、入场动画、移动端菜单
  img/favicon.svg     站点图标
```

## 已经填好的信息

- 姓名 Zichao Yu
- 身份 Incoming PhD Student, Fall 2026
- 单位 School of Computing and Data Science, The University of Hong Kong
- 导师 [Prof. Difan Zou](https://difanzou.github.io/)
- 研究兴趣 AI4AI、autoresearch、large language models、interdisciplinary AI
- 工作经历 [Kling](https://kling.ai/) Intern, June 2026 to Present
- GitHub <https://github.com/yzc-666>

## 还需要你填的

所有待补充的地方在 HTML 里都标了 `<!-- EDIT: ... -->` 注释。

| 文件 | 内容 |
|---|---|
| `index.html` | 邮箱按钮（现在整段注释掉了，有地址后取消注释） |
| `index.html` | Google Scholar 链接（现在指向 `#`） |
| `index.html` | 头像（见下方） |
| `publications.html` | 有论文后删掉 `.empty` 区块，取消下面 `.pubs` 列表的注释 |

### 换头像

把照片放到 `assets/img/avatar.jpg`，然后把 `index.html` 里这一段：

```html
<div class="portrait__frame">
  <span class="portrait__initials">ZY</span>
</div>
```

换成：

```html
<div class="portrait__frame">
  <img src="assets/img/avatar.jpg" alt="Zichao Yu" />
</div>
```

样式已经写好，图片会自动裁成正方形并带一点灰度处理。

### 加论文

`publications.html` 里有一段注释掉的 `<ol class="pubs">` 示例，直接照抄改内容即可。
`badge--cyan` 是会议/期刊，`badge--magenta` 是 preprint，不带修饰符是普通标签。
作者列表里用 `<strong>` 包住自己的名字，`<span class="asterisk">*</span>` 表示共同一作。

## 本地预览

不需要 Ruby 或 Node，Python 自带的服务器就够：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>，改完文件刷新即可。

## 部署

推送到 `main` 就会自动部署：

```bash
git add . && git commit -m "..." && git push
```

GitHub Pages 直接从 `main` 分支发布静态文件，不跑 Jekyll。仓库
Settings → Pages 的 Source 保持 **Deploy from a branch**，分支选择
`main`、目录选择 `/ (root)`。

远程走 SSH，用 `~/.ssh/id_ed25519`。

## 设计说明

青（`#00f0ff`）配品红（`#ff2bd6`），底色接近纯黑。视觉效果包括透视网格背景、
CRT 扫描线加轻微闪烁、姓名的故障（glitch）动画、霓虹辉光边框、卡片悬停扫光。
所有动画在 `prefers-reduced-motion` 下自动关闭；入场动画由 JS 添加 `js` 类来启用，
因此 JS 失效时内容依然可见。
