# yzc-666.github.io

Personal homepage of **Zichao Yu**, PhD student at HKU CDS. Built with [Lumina](https://github.com/YY-GX/Lumina) (Astro + Tailwind CSS) and deployed to GitHub Pages by `.github/workflows/deploy.yml`.

- Profile, links, pages, and theme: `site.config.yml`
- Bio: `src/content/about.md`
- Publications: `src/content/publications/papers.bib` (`selected={true}` puts a paper on the homepage)
- News: `src/content/news/*.md`

```bash
npm ci
npm run dev
```

The [AI Startups](https://yzc-666.github.io/startups.html) page is plain HTML under `public/`. `.github/workflows/crawl-ai-startups.yml` refreshes `public/data/ai-startups.json` daily, and the deploy workflow republishes the site after each crawl.
