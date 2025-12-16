---
layout: home
title: Home
---

# Recipes

A collection of recipes I like from various sources.

{% for recipe in site.recipes %}
- [{{ recipe.title }}]({{ recipe.url | relative_url }})
{% endfor %}
