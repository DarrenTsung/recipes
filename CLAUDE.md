# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal recipe collection site built with Jekyll and hosted on GitHub Pages, with custom layouts (see Architecture).

## Local Development

```bash
bundle exec jekyll serve
```

## Architecture

- `_config.yml` — Jekyll config. Recipes are a Jekyll **collection** (`site.recipes`) with `output: true` and permalink `/:name`. `fonts_url` sets the Google Fonts stylesheet.
- `_recipes/` — Each recipe is a Markdown file with YAML front matter (`title`, `category`, optional `native_name` shown under the title, e.g. `魚香茄子 (yú xiāng qiézi)`). Filenames use `snake_case`.
- `index.md` — Home page; just front matter. Everything is rendered by `_layouts/home.html`: a searchable recipe index grouped by category, ending with a **Want to Try** group (also a filter chip).
- **Want to Try:** recipes with `want_to_try: true` in front matter are listed in that group instead of their normal category (remove the flag once tried). Link-only entries (videos, untested web recipes) go in `_data/want_to_try.yml` as `title` / `url` / `source`.
- **Categories:** `_data/categories.yml` sets the category list and order on the home page. Every recipe should have a `category:` matching one of them (anything else shows under "Other").
- Site design is custom (the `minima` theme is still set but its layouts are overridden): `_layouts/default.html`, `home.html`, `page.html` (recipe pages), `_includes/recipe-item.html`, `assets/css/site.css`, `assets/js/site.js` (search, category filter, tap-to-check ingredients/steps, screen kept awake on recipe pages, light/dark toggle saved in localStorage). Recipe pages split content on `##` headings into sections (a `## Notes` section always renders just above Ingredients; put servings and other remarks there rather than as loose text under the title); `## Ingredients` and `## Instructions` get the checklist behavior, so keep those heading names.
- CLAUDE.md and README.md are excluded from the built site via `_config.yml`.

## Adding a Recipe

Create a new `.md` file in `_recipes/` with this structure:

```markdown
---
title: Recipe Name
category: Soups & Stews
---

## Source

<link>

## Ingredients:

- ...

## Instructions:

1. ...
```

The default layout for recipes is `page` (set in `_config.yml` defaults), so no `layout` front matter is needed.

Not all sections are required — some recipes omit Source or Instructions. Use `Adapted from: <link>` inline instead of a Source section when there are significant modifications.

Consistency rules (the layout depends on them):
- Source is either a `## Source` section or an `Adapted from:` line; the page shows it as a small "Source" link (or a tooltip when there's no URL, e.g. a cookbook page).
- Servings, yield, storage and other remarks go in `## Notes` (rendered above Ingredients), not as loose lines in Ingredients/Instructions.
- Ingredient sub-groups use `###` headings. For an optional/timing label inside one list, put it on its own line with blank lines around it, e.g. `(Optional)`.

## Writing Style

- **Terse and practical.** No prose, no backstory, no filler. Just the recipe.
- **Personal notes are parenthetical asides**, not full sentences (e.g., "that's an 8 on my induction stove-top").
- **Ingredients are brief:** `1 fillet baked salmon, flaked into bite-size pieces` — not "Take one fillet of baked salmon and flake it..."
- **Measurements:** mix of metric and imperial is fine. Include gram weights where precision matters (e.g., `50g oyster sauce`). Mention specific brands/products when relevant.
- **Cross-link other recipes** using Jekyll-relative paths: `[baked salmon](/baked_salmon)`.
- **Sub-sections in ingredients** use `###` headings (e.g., `### For Dashi:`).

## Commit Conventions

Prefix recipe commits with `recipes:` (e.g., `recipes: add chili oil`). Prefix site infrastructure commits with `site:`.
