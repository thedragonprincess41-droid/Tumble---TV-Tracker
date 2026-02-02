Tumble


Keep track of all your movies and TV shows.


You can try the app at


this website is about a database of movies and shows.


That looks better database of the movies and tv shows. better than simkl or trakt

# Tumble.tv — TV & Movies Tracker (Template)

[![PR Cache Report](https://github.com/thedragonprincess41-droid/Tumble---TV-Tracker/actions/workflows/cache-report.yml/badge.svg)](https://github.com/thedragonprincess41-droid/Tumble---TV-Tracker/actions/workflows/cache-report.yml)

A lightweight single-page application template for tracking movies and TV shows using the TMDB API.

Features
- Home page with trending and features
- Browse **Movies** and **TV Shows** with: sort by rating/title/release, order asc/desc, genre filters, service filters, year filters, and 100 results per page
- Search across movies and TV shows
- Login / Register (browser localStorage demo) — when signed in, Login/Register becomes **Library**
- Library: Watchlist, Likes, Watched, Friends, Lists, Reviews
- Poster card is a poster-only card; clicking a poster opens a details view with backdrop, description, release date, genres, services it's on, reviews, and list membership
- Account actions (when signed in): Mark as watched, Like, Add to watchlist, Write a review, Add to lists

How to run locally
- Install Node.js (>=16) and then install dependencies: `npm ci`.
- Copy `.env.example` to `.env` and add `VITE_TMDB_API_KEY=your_tmdb_api_key_here`.
- Run the dev server: `npm run dev` and open `http://localhost:5173` (Vite default) or the URL printed by Vite.
- To test the production build locally: `npm run build` then `npm run preview` (preview serves the `dist` output).

TMDB API key
The app reads the TMDB key from the build environment variable `VITE_TMDB_API_KEY` (set in `.env` or CI). A fallback demo key is included in `app.js` for development convenience. For production, store the key in CI secrets or an API proxy on the server-side.

Notes
- This is a template and demo. User accounts and library are stored locally in the browser's `localStorage`.
- Replace or remove the demo API key before publishing publicly if you prefer not to expose it.

Deployment
- GitHub Pages: The GH Actions workflow (`.github/workflows/deploy-gh-pages.yml`) now runs `npm ci && npm run build` and publishes the built `./dist` directory to the `gh-pages` branch. Enable GitHub Pages in repo settings and set the source to the `gh-pages` branch. A `CNAME` file is included with `www.tumble.tv` if you want to use that custom domain (ensure DNS is configured). If you want the root domain (`tumble.tv`) to also serve the site, configure an A record pointing to GitHub Pages' IPs (185.199.108.153 and related IPs) or use your DNS provider's ALIAS/ANAME to point the apex to the pages endpoint.

- Netlify: The Netlify workflow (`.github/workflows/deploy-netlify.yml`) runs `npm ci && npm run build` and deploys the `./dist` folder to Netlify using the Netlify CLI. The included `netlify.toml` has the build command and `dist` as publish directory. To use it, add the repository secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` in the repo settings (Secrets → Actions). Netlify supports both `www` and root domains — add both in your Netlify site domain settings and add DNS records: a CNAME for `www` to your Netlify subdomain and an ALIAS/A record for the apex to the Netlify load balancer IPs (or follow Netlify's DNS instructions).

Tips
- For GH Pages, after the action runs, enable Pages in repo settings if not already and confirm the site is published from `gh-pages` branch. Add a repo secret named `VITE_TMDB_API_KEY` (Settings → Secrets → Actions) so the build has access to your TMDB API key.
- For Netlify, create a site in Netlify and copy the `Site ID` and create a Personal Access Token (Netlify UI) to use as `NETLIFY_AUTH_TOKEN`. Also add `VITE_TMDB_API_KEY` as a repository secret so the workflow can build with your key.

Domain & security headers
- The site is configured to be served at `https://www.tumble.tv`. The Vite build uses `VITE_BASE_URL=https://www.tumble.tv/` so assets will be referenced from that domain at build time. Netlify will also set a security `Content-Security-Policy` header for the site (see `netlify.toml`). If you use GitHub Pages, note that Pages doesn't allow custom headers — Netlify's header config will only apply on Netlify deployments.

Powered by TMDB
