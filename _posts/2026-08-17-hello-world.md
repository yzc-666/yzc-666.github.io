---
title: 开张第一篇
date: 2026-08-17 23:00:00 +0800
categories: [杂记]
tags: [建站]
---

站点搭好了，这篇用来验证发布流程，同时留个语法参考。

## 写一篇新文章

在 `_posts/` 下新建文件，文件名必须是 `YYYY-MM-DD-标题.md` 的格式，然后写好 front matter：

```markdown
---
title: 文章标题
date: 2026-08-20 10:00:00 +0800
categories: [大类, 小类]
tags: [标签一, 标签二]
---
```

`categories` 最多两层，`tags` 数量不限，两者都会自动生成归档页面。

## 常用语法

行内代码用反引号，代码块标上语言就有高亮：

```python
def hello(name: str) -> str:
    return f"hello, {name}"
```

数学公式需要在 front matter 里加 `math: true`，然后就能写 $E = mc^2$。

图片放在 `assets/img/` 下引用：

```markdown
![说明文字](/assets/img/example.png)
```

Chirpy 还有几种提示框：

> 这是一条提示。
{: .prompt-tip }

> 这是一条警告。
{: .prompt-warning }

## 草稿

不想立刻发布的文章放到 `_drafts/`，文件名不需要日期前缀，推上去也不会出现在线上。
