# yzc-666.github.io

个人主页 + 博客，基于 [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) 主题，由 GitHub Actions 构建并部署到 GitHub Pages。

## 上线步骤（只做一次）

1. 在 GitHub 上新建一个**空**仓库，名字必须是 `yzc-666.github.io`（不要勾选 README / .gitignore / license）。
2. 推送本地代码（remote 已配好 SSH 地址，首次提交也已在 `main` 分支上）：

   ```bash
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**，把 **Source** 改成 **GitHub Actions**。
4. 到 **Actions** 标签页看构建，跑完后访问 <https://yzc-666.github.io>。

首次构建大约 1–2 分钟。之后每次 push 到 `main` 都会自动重新部署。

## 日常使用

写文章：在 `_posts/` 下新建 `YYYY-MM-DD-标题.md`，写好 front matter 后提交推送即可。

```bash
git add . && git commit -m "新文章：xxx" && git push
```

改站点信息：编辑 `_config.yml`。目前还留着几处待填：

- `social.email` — 填邮箱后，把 `_data/contact.yml` 里的 `email` 项取消注释
- `twitter.username` — 同理，填完再取消注释 `twitter` 项
- `avatar` — 头像，放到 `assets/img/` 后填相对路径，例如 `/assets/img/avatar.jpg`

改导航栏页面：编辑 `_tabs/` 下的文件，`order` 决定顺序。

图片放 `assets/img/`，正文里用 `/assets/img/xxx.png` 引用。

## 关于认证

远程仓库走 SSH（`git@github.com:...`），用的是 `~/.ssh/id_ed25519`，已验证可用。
HTTPS 方式不能用密码，需要 Personal Access Token，所以这里统一用 SSH。

## 本地预览（可选）

系统自带的 Ruby 2.6 版本太旧，跑不了 Jekyll 4。要本地预览得先装新版 Ruby：

```bash
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
exec zsh
bundle install
bundle exec jekyll serve
```

然后访问 <http://127.0.0.1:4000>。不预览也完全可以，直接推上去看线上效果。
