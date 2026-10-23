---
layout: home
title: Home
---

# Recipes

A collection of recipes I like from various sources.

{% for recipe in site.recipes %}
- [{{ recipe.title }}]({{ recipe.url | relative_url }})
{% endfor %}

## Want to Try

- [NYT Smashed Beef Koftas with Yogurt Sauce](https://www.youtube.com/watch?v=6CzTILbld1c) (RecipeTin Eats)
