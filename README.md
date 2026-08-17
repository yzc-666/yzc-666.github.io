# yzc-666.github.io

Personal academic homepage for Zichao Yu. Dark cyberpunk theme, hand-written
static HTML/CSS/JS — no framework, no build step, no dependencies beyond two
Google webfonts.

Live at <https://yzc-666.github.io>.

## Layout

```
index.html              单页主页：About / News / Research / Publications / CV / Notes / Contact
404.html                找不到页面时的赛博朋克 404
robots.txt              搜索引擎抓取规则
sitemap.xml             新增页面时记得同步这里
blog/
  index.html            文章列表页
  hello-world.html      示例文章，同时是排版参考
  _template.html        新文章模板，复制它开始写
assets/
  css/style.css         全站样式（配色、背景特效、导航、各板块）
  css/post.css          文章正文排版
  js/main.js            打字效果、滚动高亮、进度条、入场动画、移动端菜单
  img/favicon.svg       站点图标
.github/workflows/      推送到 main 后自动部署
```

## 需要你填的内容

主页 `index.html` 里所有待替换的地方都标了 `<!-- EDIT: ... -->` 注释。按板块列一下：

| 位置 | 现在是什么 | 要改成 |
|---|---|---|
| Hero | Your Lab / Your University | 实验室和学校 |
| Hero | 两段 bio | 你的自我介绍 |
| Hero 按钮 | `you@example.com`、Scholar 链接 `#` | 真实邮箱和 Google Scholar 地址 |
| Hero 卡片 | 首字母 `ZY` 占位方块 | 照片，见下方说明 |
| Hero 卡片 | Your City | 所在城市 |
| News | 三条占位动态 | 真实动态 |
| Research | 三张卡片 | 你的研究方向 |
| Publications | 三条占位论文 | 真实论文，`#` 链接换成 PDF/arXiv/Code |
| CV | 学历和经历 | 真实经历 |
| Contact | 邮箱、Scholar、办公室 | 真实信息 |

打字机效果的那几句话在 `index.html` 的 `data-typed` 属性里，是一个 JSON 数组，改成你自己的标签就行。

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

样式已经写好了，图片会自动裁切成正方形并带一点灰度处理。

### 放 CV

把 PDF 放到 `assets/cv.pdf`，Hero 里的 CV 按钮就能用了。

## 写一篇新文章

1. 复制 `blog/_template.html`，改名成 `blog/你的标题.html`
2. 填标题、描述、canonical 链接、日期、正文（每处都有 `<!-- EDIT -->` 注释），并删掉那行 `noindex`
3. 在 `blog/index.html` 的列表里加一行，需要的话主页 Notes 板块也加一行
4. 在 `sitemap.xml` 里补一条

正文直接写语义化 HTML 就行，`h2` `h3` `p` `ul` `ol` `blockquote` `pre` `table` `img` 都已经配好样式，参考 `blog/hello-world.html`。

## 本地预览

不需要 Ruby 或 Node，Python 自带的服务器就够：

```bash
python3 -m http.server 8000
```

然后打开 <http://localhost:8000>。改完文件刷新即可。

## 部署

推送到 `main` 就会自动部署：

```bash
git add . && git commit -m "..." && git push
```

`.github/workflows/pages-deploy.yml` 直接把整个仓库当静态产物上传，不跑 Jekyll，
所以构建只要十几秒。GitHub 仓库的 Settings → Pages 里 Source 需要保持
**GitHub Actions**。

远程仓库走 SSH，用的是 `~/.ssh/id_ed25519`。

## 设计说明

配色是青（`#00f0ff`）配品红（`#ff2bd6`），底色接近纯黑。视觉效果包括透视网格背景、
CRT 扫描线加轻微闪烁、标题的故障（glitch）动画、霓虹辉光边框和悬停扫光。
所有动画都在 `prefers-reduced-motion` 下自动关闭，键盘焦点样式和跳转链接也都保留了。
