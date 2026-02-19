/**
 * 🏡 Whitehorse Real Estate Telegram Bot
 * Searches Domain.com.au & REA via Apify scrapers
 * 
 * Commands:
 *   /search box hill 3 bed 2 bath 2 car house
 *   /domain nunawading 4 bed 2 bath unit
 *   /rea blackburn 3 bed house
 *   /help
 */

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// ─── CONFIG (set in .env) ────────────────────────────────────────────────────
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const APIFY_TOKEN = process.env.APIFY_TOKEN;

// Apify Actor IDs
const DOMAIN_ACTOR = "easyapi~domain-com-au-property-scraper";
const REA_ACTOR = "pythonscraper~realestate-au"; // realestate.com.au scraper

// ─── BOT SETUP ───────────────────────────────────────────────────────────────
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log("🏡 Whitehorse RE Bot started...");

// ─── MESSAGE PARSER ──────────────────────────────────────────────────────────
function parseQuery(text) {
  const lower = text.toLowerCase();

  // Extract bedrooms
  const bedMatch = lower.match(/(\d+)\s*(?:bed(?:room)?s?|br)/);
  const beds = bedMatch ? parseInt(bedMatch[1]) : null;

  // Extract bathrooms
  const bathMatch = lower.match(/(\d+)\s*(?:bath(?:room)?s?|ba)/);
  const baths = bathMatch ? parseInt(bathMatch[1]) : null;

  // Extract car spaces
  const carMatch = lower.match(/(\d+)\s*(?:car|garage|parking)/);
  const cars = carMatch ? parseInt(carMatch[1]) : null;

  // Extract property type
  const typeMap = {
    house: "House",
    houses: "House",
    unit: "Unit",
    units: "Unit",
    apartment: "ApartmentUnitFlat",
    apartments: "ApartmentUnitFlat",
    apt: "ApartmentUnitFlat",
    townhouse: "Townhouse",
    townhouses: "Townhouse",
    villa: "Villa",
    villas: "Villa",
    land: "VacantLand",
    duplex: "Duplex",
  };

  let propertyType = null;
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (lower.includes(keyword)) {
      propertyType = type;
      break;
    }
  }

  // Extract suburb — remove known keywords to isolate suburb name
  let suburb = lower
    .replace(/\d+\s*(?:bed(?:room)?s?|br|bath(?:room)?s?|ba|car|garage|parking)/g, "")
    .replace(/\b(house|unit|apartment|apt|townhouse|villa|land|duplex|search|domain|rea|for\s*sale|buy|buying)\b/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  // Whitehorse default suburbs if none detected
  const whitehorseSubs = [
    "box hill", "blackburn", "nunawading", "mitcham", "ringwood",
    "vermont", "forest hill", "burwood", "mont albert", "surrey hills",
    "box hill north", "box hill south", "blackburn north", "blackburn south",
    "ringwood east", "ringwood north", "heathmont", "croydon"
  ];

  let detectedSuburb = null;
  for (const s of whitehorseSubs) {
    if (lower.includes(s)) {
      detectedSuburb = s;
      break;
    }
  }

  // If not a known suburb, use whatever text is left
  if (!detectedSuburb && suburb.length > 2) {
    detectedSuburb = suburb.split(" ").slice(0, 3).join(" ");
  }

  return { suburb: detectedSuburb, beds, baths, cars, propertyType };
}

// ─── BUILD DOMAIN URL ────────────────────────────────────────────────────────
function buildDomainUrl({ suburb, beds, baths, cars, propertyType }) {
  const suburbSlug = suburb
    ? suburb.replace(/\s+/g, "-").toLowerCase() + "-vic-3000"
    : "whitehorse-region-vic";

  // Domain uses path-based filters
  const typeSlug = propertyType ? propertyType.toLowerCase() : "house";
  let url = `https://www.domain.com.au/sale/${suburbSlug}/?property-type=${encodeURIComponent(typeSlug || "house")}`;

  if (beds) url += `&bedrooms=${beds}-any`;
  if (baths) url += `&bathrooms=${baths}-any`;
  if (cars) url += `&carspaces=${cars}-any`;

  return url;
}

// ─── BUILD REA URL ───────────────────────────────────────────────────────────
function buildReaUrl({ suburb, beds, baths, cars, propertyType }) {
  const suburbSlug = suburb
    ? suburb.replace(/\s+/g, "+")
    : "Whitehorse";

  const typeMap = {
    House: "house",
    ApartmentUnitFlat: "unit+apartment",
    Townhouse: "townhouse",
    Villa: "villa",
    VacantLand: "land",
    Duplex: "duplex",
    Unit: "unit",
  };

  const typeSlug = propertyType ? typeMap[propertyType] || "house" : "house";
  let url = `https://www.realestate.com.au/buy/property-${typeSlug}-with-${beds || 3}-bedrooms-in-${suburbSlug},+vic/list-1`;

  return url;
}

// ─── APIFY RUNNER ────────────────────────────────────────────────────────────
async function runApifyActor(actorId, input, maxItems = 10) {
  const runUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=60&memory=512`;

  const response = await axios.post(runUrl, input, {
    headers: { "Content-Type": "application/json" },
    timeout: 90000,
  });

  return (response.data || []).slice(0, maxItems);
}

// ─── FORMAT DOMAIN RESULT ────────────────────────────────────────────────────
function formatDomainListing(item) {
  const addr = item.address || item.street || "Address not listed";
  const price = item.price || item.displayPrice || "Price on request";
  const beds = item.bedrooms ?? item.beds ?? "?";
  const baths = item.bathrooms ?? item.bath ?? "?";
  const cars = item.carSpaces ?? item.car ?? "?";
  const type = item.propertyType || item.type || "";
  const url = item.url || item.listingUrl || "";

  return `🏠 *${addr}*\n💰 ${price}\n🛏 ${beds} bed  🚿 ${baths} bath  🚗 ${cars} car  ${type}\n🔗 ${url}`;
}

// ─── FORMAT REA RESULT ───────────────────────────────────────────────────────
function formatReaListing(item) {
  const addr = item.address || item.street || "Address not listed";
  const price = item.price || item.priceText || "Price on request";
  const beds = item.bedrooms ?? item.beds ?? "?";
  const baths = item.bathrooms ?? item.bath ?? "?";
  const cars = item.carspaces ?? item.car ?? "?";
  const type = item.propertyType || item.type || "";
  const url = item.url || item.link || "";

  return `🏡 *${addr}*\n💰 ${price}\n🛏 ${beds} bed  🚿 ${baths} bath  🚗 ${cars} car  ${type}\n🔗 ${url}`;
}

// ─── SEARCH HANDLER ──────────────────────────────────────────────────────────
async function handleSearch(chatId, text, source = "both") {
  const params = parseQuery(text);

  if (!params.suburb) {
    return bot.sendMessage(chatId,
      "⚠️ I couldn't detect a suburb. Try:\n`search box hill 3 bed 2 bath house`",
      { parse_mode: "Markdown" }
    );
  }

  // Build summary of what we understood
  const summary = [
    `📍 *Suburb:* ${params.suburb}`,
    params.beds ? `🛏 *Beds:* ${params.beds}+` : "",
    params.baths ? `🚿 *Baths:* ${params.baths}+` : "",
    params.cars ? `🚗 *Cars:* ${params.cars}+` : "",
    params.propertyType ? `🏠 *Type:* ${params.propertyType}` : "",
  ].filter(Boolean).join("\n");

  await bot.sendMessage(chatId, `🔍 *Searching for:*\n${summary}\n\n⏳ Fetching listings, give me 30–60 seconds...`, { parse_mode: "Markdown" });

  const domainUrl = buildDomainUrl(params);
  const reaUrl = buildReaUrl(params);

  const promises = [];

  if (source === "both" || source === "domain") {
    promises.push(
      runApifyActor(DOMAIN_ACTOR, { startUrls: [{ url: domainUrl }], maxItems: 8 })
        .then(results => ({ source: "domain", results }))
        .catch(err => ({ source: "domain", error: err.message }))
    );
  }

  if (source === "both" || source === "rea") {
    promises.push(
      runApifyActor(REA_ACTOR, { startUrls: [{ url: reaUrl }], maxItems: 8 })
        .then(results => ({ source: "rea", results }))
        .catch(err => ({ source: "rea", error: err.message }))
    );
  }

  const responses = await Promise.allSettled(promises);

  for (const res of responses) {
    if (res.status === "rejected") continue;
    const { source: src, results, error } = res.value;

    const label = src === "domain" ? "🟦 *Domain.com.au*" : "🟥 *realestate.com.au*";
    const searchUrl = src === "domain" ? domainUrl : reaUrl;

    if (error) {
      await bot.sendMessage(chatId, `${label}\n❌ Error: ${error}\n\nSearch manually: ${searchUrl}`, { parse_mode: "Markdown" });
      continue;
    }

    if (!results || results.length === 0) {
      await bot.sendMessage(chatId,
        `${label}\n😕 No listings found matching your criteria.\n\nTry searching manually: ${searchUrl}`,
        { parse_mode: "Markdown" }
      );
      continue;
    }

    const header = `${label} — ${results.length} listings found\n\n`;
    const formatted = results.map(src === "domain" ? formatDomainListing : formatReaListing).join("\n\n─────────────────\n\n");

    // Split into chunks if too long
    const fullMsg = header + formatted;
    if (fullMsg.length > 4000) {
      const chunks = [];
      let chunk = header;
      for (const listing of results.map(src === "domain" ? formatDomainListing : formatReaListing)) {
        if ((chunk + listing).length > 3800) {
          chunks.push(chunk);
          chunk = "";
        }
        chunk += listing + "\n\n─────────────────\n\n";
      }
      if (chunk) chunks.push(chunk);

      for (const c of chunks) {
        await bot.sendMessage(chatId, c, { parse_mode: "Markdown" });
      }
    } else {
      await bot.sendMessage(chatId, fullMsg, { parse_mode: "Markdown" });
    }
  }
}

// ─── COMMAND HANDLERS ────────────────────────────────────────────────────────

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🏡 *Whitehorse Real Estate Bot*\n\nSearch Domain.com.au & realestate.com.au for current listings.\n\n*Commands:*\n\`/search [suburb] [beds] bed [baths] bath [cars] car [type]\`\n\`/domain [same format]\` — Domain only\n\`/rea [same format]\` — REA only\n\`/help\` — Show examples\n\n*Example:*\n/search box hill 3 bed 2 bath 2 car house`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🔍 *Search Examples*\n\n\`/search box hill 3 bed 2 bath house\`\n\`/search nunawading 4 bedroom 2 bathroom 2 car\`\n\`/search blackburn 2 bed unit\`\n\`/search forest hill townhouse\`\n\`/domain mont albert 5 bed house\`\n\`/rea surrey hills 3 bed\`\n\n*Suburbs I know:*\nBox Hill, Blackburn, Nunawading, Mitcham, Ringwood, Vermont, Forest Hill, Burwood, Mont Albert, Surrey Hills, Heathmont, Croydon + more\n\n*Property types:* house, unit, apartment, townhouse, villa, land, duplex`,
    { parse_mode: "Markdown" }
  );
});

bot.onText(/\/search (.+)/, async (msg, match) => {
  await handleSearch(msg.chat.id, match[1], "both");
});

bot.onText(/\/domain (.+)/, async (msg, match) => {
  await handleSearch(msg.chat.id, match[1], "domain");
});

bot.onText(/\/rea (.+)/, async (msg, match) => {
  await handleSearch(msg.chat.id, match[1], "rea");
});

// Handle plain messages that look like searches
bot.on("message", async (msg) => {
  if (msg.text && !msg.text.startsWith("/")) {
    const lower = msg.text.toLowerCase();
    // If it mentions beds or a known suburb, treat as a search
    const hasBeds = /\d+\s*bed/.test(lower);
    const hasSuburb = ["box hill","blackburn","nunawading","mitcham","ringwood","vermont","forest hill","burwood","mont albert","surrey hills","heathmont"].some(s => lower.includes(s));

    if (hasBeds || hasSuburb) {
      await handleSearch(msg.chat.id, msg.text, "both");
    }
  }
});

// Error handling
bot.on("polling_error", (err) => console.error("Polling error:", err.message));
process.on("unhandledRejection", (err) => console.error("Unhandled:", err));
