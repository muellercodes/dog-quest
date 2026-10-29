# Dog Quest

An open-world action RPG starring a very good dog. Explore the kingdom of Barkadia, learn new tricks,
dig up treasure, and get the Golden Ball back from Lord Mittens.

**Play:** https://muellercodes.github.io/dog-quest/

## The game

- **Barkadia**, an island of eight regions: Waggle Meadows, Nutwood Forest, the Royal Plains, Fetchwick Coast,
  Mount Barkmore, Howlow Woods, the Bone Dry Desert and Scratchpost Isle. Seven towns and a ranger camp.
- **Pick your pup:** Corgi, Beagle, Husky, Golden, Dalmatian, Pug, Dachshund or Poodle, and name them.
- **Combat:** a three-swing combo, a dodge roll, and red warning areas that show where every attack will land.
  Swinging at foes fills your Woof for tricks.
- **Six tricks** from trainers in towns: Bark Blast, Fetch!, Belly Rub, Zoomies, Howl and Dig. Trainers level them up.
- **Gear** for your mouth, head, and neck and back. Finding the same gear again levels it up. Hats and capes show on your dog.
- **Story:** five chapters and four Golden Pieces, each guarded by one of Mittens' friends (Nutsworth the Squirrel King,
  Captain Whiskers, Snowball the Snow Leopard and Cleocatra), then Clawhold Keep and the Dread Vacuum.
- **Side quests, bounties and treasure:** 12 side quests, 6 bounties on town boards, 7 burrows, 12 chests (some on
  islets you swim to) and sparkly dig spots everywhere.
- Plays with keyboard, mouse, game controller or touch. Saves on the device, and to an account when signed in.

## Controls

| | Keyboard | Controller | Touch |
|---|---|---|---|
| Move | WASD or arrows | Left stick | Drag on the left |
| Swing / talk | J, Space or click (E to talk) | A | Paw button |
| Roll | K or Shift | B | Roll button |
| Tricks | 1 to 4 | X, Y, LB, RB | Trick buttons |
| Menu / map | Tab or Esc / M | Start / Back | Top-right buttons |

## How it is built

- `game/` holds the source: `game/src/*.js` (joined in name order), `head.html`, `body.html` and `style.css`.
  `node build.mjs` joins it into one page, `docs/index.html`, which GitHub Pages serves. The build stops on an em dash.
- Everything is drawn in code on a canvas (no image files) and every sound and tune is made with Web Audio.
- `worker/` is the accounts backend: a Cloudflare Worker (`dog-quest-api`) with a D1 database (`dog-quest-db`).
  Accounts are a name and a password, no email. Passwords are hashed with PBKDF2. Saves sync to the account, and a
  device with less play time can never quietly overwrite newer progress (the server answers 409 and the player chooses).
- `docs/admin.html` is the admin page for the accounts in `ADMIN_USERS` (in `worker/wrangler.toml`): reset a forgotten
  password, pause or delete an account, and restore save backups.

### Deploying the backend (from the Mac, where wrangler is signed in)

```
cd ~/code/dog-quest && git pull --ff-only
cd worker && npm install
npx wrangler d1 migrations apply dog-quest-db --remote
npx wrangler deploy
```

## License

Story and art: all rights reserved, Andrew Mueller. Code (engine, tools, backend): MIT. See `LICENSE`.
