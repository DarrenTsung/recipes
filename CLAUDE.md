# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a personal recipe collection site built with Jekyll and hosted on GitHub Pages. It uses the `minima` theme.

## Local Development

```bash
bundle exec jekyll serve
```

## Architecture

- `_config.yml` — Jekyll config. Recipes are a Jekyll **collection** (`site.recipes`) with `output: true` and permalink `/:name`.
- `_recipes/` — Each recipe is a Markdown file with YAML front matter (at minimum, `title`). Filenames use `snake_case`.
- `index.md` — Home page that lists all recipes via `site.recipes`.
- CLAUDE.md and README.md are excluded from the built site via `_config.yml`.

## Adding a Recipe

Create a new `.md` file in `_recipes/` with this structure:

```markdown
---
title: Recipe Name
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

## Writing Style

- **Terse and practical.** No prose, no backstory, no filler. Just the recipe.
- **Personal notes are parenthetical asides**, not full sentences (e.g., "that's an 8 on my induction stove-top").
- **Ingredients are brief:** `1 fillet baked salmon, flaked into bite-size pieces` — not "Take one fillet of baked salmon and flake it..."
- **Measurements:** mix of metric and imperial is fine. Include gram weights where precision matters (e.g., `50g oyster sauce`). Mention specific brands/products when relevant.
- **Cross-link other recipes** using Jekyll-relative paths: `[baked salmon](/baked_salmon)`.
- **Sub-sections in ingredients** use `###` headings (e.g., `### For Dashi:`).

## Commit Conventions

Prefix recipe commits with `recipes:` (e.g., `recipes: add chili oil`). Prefix site infrastructure commits with `site:`.
