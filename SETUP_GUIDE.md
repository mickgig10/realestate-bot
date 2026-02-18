# 🏡 Whitehorse Real Estate Telegram Bot
### Search Domain.com.au & realestate.com.au from Telegram

---

## What This Bot Does

Send a message like:
> `/search box hill 3 bed 2 bath 2 car house`

And the bot replies with current **for-sale listings** from both Domain.com.au and realestate.com.au showing address, price, beds/baths/cars, and a direct link to each listing.

---

## Step 1 — Create Your Telegram Bot (5 minutes, free)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Give it a name, e.g. `Whitehorse RE Search`
4. Give it a username, e.g. `whitehorse_re_bot`
5. BotFather will give you a **token** that looks like:
   `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Copy and save this token** — you'll need it shortly

---

## Step 2 — Create an Apify Account (5 minutes, free tier available)

Apify is a legitimate, managed web scraping platform. They have ready-made scrapers for Domain.com.au and realestate.com.au.

1. Go to **https://apify.com** and sign up (free)
2. Go to **Settings → Integrations** (or https://console.apify.com/account/integrations)
3. Copy your **API Token** — looks like `apify_api_xxxxxxxxxxxxx`
4. **Free tier** gives you $5/month credit — each property search costs roughly $0.02–0.05, so ~100–250 searches/month free

---

## Step 3 — Deploy the Bot (10 minutes, free)

### Option A: Railway (Recommended — easiest, free tier)

1. Go to **https://railway.app** and sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Upload the bot files to a GitHub repo first:
   - Create a new repo at github.com
   - Upload: `bot.js`, `package.json`, `railway.toml`
4. Back in Railway, select your repo
5. Go to **Variables** tab and add:
   ```
   TELEGRAM_TOKEN = (your token from Step 1)
   APIFY_TOKEN    = (your token from Step 2)
   ```
6. Railway will auto-deploy. Your bot is live! ✅

### Option B: Run Locally on Your Computer

Requirements: Node.js installed (https://nodejs.org)

```bash
# 1. Create a folder and add the bot files
mkdir realestate-bot && cd realestate-bot

# 2. Copy bot.js and package.json into this folder

# 3. Create your .env file
cp .env.example .env
# Edit .env with your tokens

# 4. Install and run
npm install
npm start
```

The bot runs while your computer is on. Use Railway for always-on.

---

## How to Use the Bot

### Basic Commands

| Message | What it does |
|---------|-------------|
| `/search box hill 3 bed 2 bath house` | Search both sites |
| `/domain nunawading 4 bed 2 bath 2 car` | Domain.com.au only |
| `/rea blackburn 3 bedroom townhouse` | REA only |
| `/help` | Show examples |

### You can also just type naturally:
> `3 bed 2 bath house in box hill`

The bot detects suburb + filters automatically.

### Supported Property Types
- house / houses
- unit / units  
- apartment / apartments
- townhouse / townhouses
- villa
- land
- duplex

### Whitehorse Suburbs Auto-Detected
Box Hill, Blackburn, Nunawading, Mitcham, Ringwood, Vermont, Forest Hill, Burwood, Mont Albert, Surrey Hills, Heathmont, Croydon, Box Hill North/South, Blackburn North/South, Ringwood East/North

---

## Real World Use Cases for You as an Agent

**Morning market scan:**
> `/search box hill 3 bed house` — see what new competition came on overnight

**Buyer matching:**
> `/search nunawading 4 bed 2 bath 2 car` — instant results to send a buyer who's been waiting

**Vendor appraisal prep:**
> `/domain mont albert 4 bed house` — pull comparables before a listing appointment

**Competing listings check:**
> `/rea forest hill townhouse` — see who else is competing before setting your price guide

**Quick CMA data:**
Run a few suburb searches and forward the results directly in Telegram to your vendor

---

## Troubleshooting

**Bot not responding?**
- Check your TELEGRAM_TOKEN is correct
- Check your Railway deployment logs

**"No listings found"?**
- Try broadening your search (remove some filters)
- The Apify scraper may need 30–60 seconds — be patient

**Apify errors?**
- Check your APIFY_TOKEN at console.apify.com
- Check your account has credit remaining
- Free tier is $5/month — very generous for personal use

---

## Cost Estimate

| Usage | Monthly Apify Cost |
|-------|-------------------|
| ~20 searches/day | ~$1.50–3.00 |
| ~50 searches/day | ~$3.00–7.50 |
| Free tier covers | ~100–250 searches |

Railway hosting: **Free** (hobby tier)

---

*Built for Whitehorse area real estate agents, Melbourne*
