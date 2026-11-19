# yzc-666.github.io

Personal homepage of **Zichao Yu**, PhD student at HKU CDS. Built with [al-folio](https://github.com/alshedivat/al-folio) v1.2 (Jekyll) and deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Where things live

- Name, description, site settings: `_config.yml`
- Bio and homepage options: `_pages/about.md`
- Photo: `assets/img/prof_pic.jpg`
- Links (Google Scholar, GitHub, email): `_data/socials.yml`
- Publications: `_bibliography/papers.bib` (see the comment at the top of that file to turn the Publications page on)
- News: add `_news/YYYY-MM-DD-title.md` files, then set `announcements.enabled: true` in `_pages/about.md`

Theme code lives in the `al_folio_*` gems, not in this repo. See the [al-folio docs](https://github.com/alshedivat/al-folio/tree/main/docs) for customization.

## Local preview

Needs Ruby 3.3+ (for example `brew install ruby`, then put `/opt/homebrew/opt/ruby/bin` first on your `PATH`) and a UTF-8 locale.

```bash
bundle config set --local path vendor/bundle
bundle install
bundle exec jekyll serve --config _config.yml,_config.dev.yml --livereload
```

Then open http://localhost:4000. `_config.dev.yml` skips the responsive WebP images, so you don't need ImageMagick locally; the GitHub build installs it and generates them.
