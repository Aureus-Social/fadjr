name: FADJR Scraper — Restaurants Halal

on:
  schedule:
    - cron: '0 2 * * *'  # Tous les jours à 2h du matin
  workflow_dispatch:      # Lancement manuel possible

jobs:
  scrape:
    name: Scrape Halal Restaurants
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Run scraper
        env:
          SUPABASE_URL: ${{ secrets.FADJR_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.FADJR_SUPABASE_SERVICE_KEY }}
          GOOGLE_PLACES_API_KEY: ${{ secrets.GOOGLE_PLACES_API_KEY }}
        run: node fadjr-scraper.mjs --all
