import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import yaml from 'yaml';

const site = 'https://yzc-666.github.io';
const { pages } = yaml.parse(fs.readFileSync('./site.config.yml', 'utf-8'));
const disabledPrefixes = Object.entries(pages)
  .filter(([name, enabled]) => !enabled && name !== 'about')
  .map(([name]) => `${site}/${name}/`);

export default defineConfig({
  site,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !disabledPrefixes.some((prefix) => page.startsWith(prefix)),
      customPages: pages.startups ? [`${site}/startups.html`] : [],
    }),
  ],
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
