# Dog Quest

An open-world action RPG starring a very good dog. Explore the kingdom of Barkadia, learn new tricks,
dig up treasure, and get the Golden Ball back from Lord Mittens.

Play: https://muellercodes.github.io/dog-quest/

## How it is built

- `game/` holds the source. `node build.mjs` joins it into one page, `docs/index.html`, which GitHub Pages serves.
- `worker/` is the accounts backend: a Cloudflare Worker (`dog-quest-api`) with a D1 database (`dog-quest-db`).
  Accounts are a name and a password, no email. Saves sync to the account and never let an older device
  overwrite newer progress.
- `docs/admin.html` is the admin page (accounts listed in `ADMIN_USERS` in `worker/wrangler.toml`).

### Deploying the backend (from the Mac, where wrangler is signed in)

```
cd ~/code/dog-quest && git pull --ff-only
cd worker && npm install
npx wrangler d1 migrations apply dog-quest-db --remote
npx wrangler deploy
```
