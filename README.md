# Trivia Buzzer — Grad Party Edition

A realtime party trivia buzzer game: guests join from their phones, pick a table/team, and buzz in. The host runs the game; a projector shows the question, scores, and buzz queue.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Who |
|-------|-----|
| `/` | Landing — Join, Host, or Display |
| `/join` | Players — pick table → name |
| `/player` | Player buzzer (phone) |
| `/host` | Host controls |
| `/display` | Big-screen projector view |

## How to play

1. **Host** opens `/host` on your laptop (runs the game server).
2. **Display** opens `/display` on the projector.
3. **Players** go to `/join`, pick or create a table, enter their name.
4. Host adds questions, starts the game, shows each question, and **opens the buzzer**.
5. Players tap the big red buzzer to join the queue (first buzz per **table/team** counts; teammates can still tap but only lock in their team’s slot; buzzer stays open until the host judges).
6. Host marks **Correct** (team gets points) or **Incorrect** (next in queue gets a turn).
7. Host ends the game — display shows the winner.

Player sessions are stored in `localStorage` so refresh rejoins the same player.

## Tech stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Socket.io (custom Node server — room state lives on the server)
- `server.ts` runs Next.js + Socket.io together

## Deployment (Render + custom subdomain)

This app needs one **always-on Node server** (Next.js + Socket.io). Do not use Vercel alone for the live game.

### 1. Push to GitHub

Commit and push the repo to GitHub (or GitLab).

### 2. Create a Render Web Service

1. [dashboard.render.com](https://dashboard.render.com) → **New +** → **Web Service**
2. Connect the `trivia-buzzer` repo
3. Settings:

| Field | Value |
|--------|--------|
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance type** | **Starter** or higher (free tier sleeps after idle — bad mid-party) |

Render sets `PORT` automatically; the app reads it in `server.ts`.

### 3. Custom subdomain (e.g. `buzzer.yourdomain.com`)

1. In Render: your service → **Settings** → **Custom Domains** → **Add Custom Domain**
2. Enter `buzzer.yourdomain.com` (your subdomain)
3. Render shows a **CNAME target** (e.g. `trivia-buzzer-xxxx.onrender.com`)

At your DNS host (Cloudflare, Namecheap, etc.):

| Type | Name | Value |
|------|------|--------|
| CNAME | `buzzer` | the hostname Render gives you |

4. Wait for DNS + SSL (often 5–30 minutes). Render provisions HTTPS automatically.

### 4. Use the game

- **Players:** `https://buzzer.yourdomain.com/join`
- **Host:** `https://buzzer.yourdomain.com/host`
- **Projector:** `https://buzzer.yourdomain.com/display`

Edit `src/data/questions.json` and add images under `public/questions/` **before** you deploy (or redeploy after changes).

### Notes

- **Game state is in memory** — redeploying or restarting clears the room. Fine for one event.
- **Free Render** spins down when idle; first visit can take 30–60s to wake. Use a paid instance for the party night.
- Optional: repo includes `render.yaml` for **Blueprint** deploy (New → Blueprint).

## Pre-loaded questions

Edit **`src/data/questions.json`** before the party:

```json
[
  {
    "text": "What is Andy's favorite food?",
    "answer": "Pizza",
    "points": 100,
    "image": "pizza.jpg"
  }
]
```

- Put images in **`public/questions/`** (reference by filename like `"pizza.jpg"`).
- On the host, open **Questions & setup** → **Import from questions.json** (lobby only, replaces all questions).
- The image shows on the **display** when the answer is revealed.

You can still add or edit questions manually in the host UI.

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default `3000`) |
| `HOSTNAME` | Bind address (default `0.0.0.0`) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io URL if different from the page origin |

## Scripts

- `npm run dev` — development (Next + Socket.io)
- `npm run build` — production Next.js build
- `npm start` — production server
