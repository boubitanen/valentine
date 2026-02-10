"use strict";

const SECRET_CODE = "11122008"; // <-- code secret (case-insensitive, trims spaces)

const PLEA_MESSAGES = [
  "Please Tanen? 🥺",
  "T’es sûre mon coeur?? 😭",
  "Allez… réfléchis deux fois 😶‍🌫️",
  "Je vais pas te croquer (promis) 😇",
  "Pauvre Boubi 💔",
  "Dis oui et je te fais un GROS câlin 🤗",
  "On peut négocier avec des bisous ? 😘",
  "Dernière chance… (non) 😅",
  "Gare à toi si je t'attrape 😼",
  "Boubi est triste 😢",
  "Ok… maintenant clique YES 😇",
];

const $ = (sel) => document.querySelector(sel);

const screens = {
  gate: $("#screenGate"),
  congrats: $("#screenCongrats"),   
  ask: $("#screenAsk"),
  woohoo: $("#screenWoohoo"),
  coupons: $("#screenCoupons"),   
  memories: $("#screenMemories"), 
};

const gateForm = $("#gateForm");
const secretInput = $("#secretInput");
const gateError = $("#gateError");

const yesBtn = $("#yesBtn");
const noBtn = $("#noBtn");
const pleaMsg = $("#pleaMsg");

const resetBtn = $("#resetBtn");

// Tab bar
const tabbar = $("#tabbar");
const tabHome = $("#tabHome");
const tabCoupons = $("#tabCoupons");
const tabMemories = $("#tabMemories");     
const memoriesGridEl = $("#memoriesGrid");

function setActiveTab(name) {
  if (!tabHome || !tabCoupons || !tabMemories) return;
  tabHome.classList.toggle("is-active", name === "woohoo");
  tabCoupons.classList.toggle("is-active", name === "coupons");
  tabMemories.classList.toggle("is-active", name === "memories");
}

// Coupons UI
const couponsRemainingEl = $("#couponsRemaining");
const couponsDateEl = $("#couponsDate");
const couponGridEl = $("#couponGrid");
const couponMsgEl = $("#couponMsg");

let noClicks = 0;

const woohooToCoupons = $("#woohooToCoupons");
const woohooToMemories = $("#woohooToMemories");

function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

function setGateError(msg) {
  gateError.textContent = msg || "";
}

/**
 * ✅ No transitions at all: instant screen switch
 */
let currentScreen = "gate";

function showScreen(nextName) {
  const nextEl = screens[nextName];
  if (!nextEl) {
    console.error("Screen not found:", nextName);
    return;
  }
  Object.values(screens).forEach((el) => {
    if (!el) return;
    el.classList.remove("is-active");
  });
  nextEl.classList.add("is-active");
  currentScreen = nextName;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function resetAskUI() {
  noClicks = 0;
  pleaMsg.textContent = "";

  yesBtn.style.flex = "1";
  noBtn.style.flex = "1";
  yesBtn.style.setProperty("--btn-scale", "1");
  noBtn.style.setProperty("--btn-scale", "1");

  noBtn.style.opacity = "0.92";
  noBtn.disabled = false;
}

/**
 * Persist unlock so she doesn't have to retype code if she refreshes
 */
// ✅ Tracks if she answered YES (controls tabbar visibility)
const STORAGE_KEY = "valentine_unlocked_v1";
function setUnlocked(v) {
  try {
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  } catch {}
}
function isUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const ACCEPT_KEY = "valentine_accepted_v1";
function setAccepted(v) {
  try {
    localStorage.setItem(ACCEPT_KEY, v ? "1" : "0");
  } catch {}
}
function isAccepted() {
  try {
    return localStorage.getItem(ACCEPT_KEY) === "1";
  } catch {
    return false;
  }
}


/* -----------------------------
   Coupons logic 
------------------------------ */
const COUPON_KEY = "valentine_coupons_v1";
const DAILY_LIMIT = 3;

const COUPONS = [
  { id: "hug", emoji: "🤗", title: "Bon pour un câlin", desc: "Un câlin où Boubi sert très fort." },
  { id: "kiss", emoji: "😘", title: "Bon pour un bisou", desc: "Un bisou baveux !" },
  {id: "kisses", emoji: "😘😘😘", title: "Bon pour pleins de bisous", desc: "PLEINS D'ENORMES BISOUS !" },
  { id: "bite", emoji: "😼", title: "Bon pour un croquage", desc: "Boubi te croque tout cru." },
  { id: "massage", emoji: "💆‍♀️", title: "Bon pour un massage", desc: "Massage relaxant fait maison par Boubi." },
  { id: "date", emoji: "🍓", title: "Bon pour un date", desc: "Nos dates sont toujours les meilleurs!" },
  { id: "sleepover", emoji: "💤", title: "Bon pour un sleepover", desc: "Un sleepover à la maison avec Boubi!" },
];

/* -----------------------------
   Memories
   ✅ To add photos: just add items to MEMORIES array
------------------------------ */

const MEMORIES = [
  {
    src: "1.jpeg",
    caption: "Côté Sushi 🍣",
    meta: "5 Février 2026",
  },
  {
    src: "2.jpeg",
    caption: "Côté Sushi 🍣",
    meta: "30 Janvier 2026",
  },
  {
    src: "3.jpeg",
    caption: "Tigermilk 🐯🥛",
    meta: "13 Décembre 2025",
  },
  {
    src: "4.jpeg",
    caption: "Memphis Burger 🍔",
    meta: "24 Janvier 2026",
  },
  {
    src: "5.jpeg",
    caption: "Le Tigre 🐯",
    meta: "29 Décembre 2025",
  },
  {
    src: "6.jpeg",
    caption: "Chez Boubi 🏠",
    meta: "31 Octobre 2025",
  },
  {
    src: "7.jpeg",
    caption: "Marché de Noël 🎄",
    meta: "19 Décembre 2025",
  },
  {
    src: "8.jpeg",
    caption: "Sushi Shop 🍣",
    meta: "29 Novembre 2025",
  },
  {
    src: "9.jpeg",
    caption: "ICHINISAN&GO 🍣",
    meta: "10 Février 2026",
  },
  {
    src: "10.jpeg",
    caption: "Flams🍕",
    meta: "11 Décembre 2025",
  },
];

function renderMemories() {
  if (!memoriesGridEl) return;

  memoriesGridEl.innerHTML = "";

  // Load likes from storage
  const likes = loadLikes();

  MEMORIES.forEach((m) => {
    const id = m.src || JSON.stringify(m);

    const card = document.createElement("div");
    card.className = "memory-card";

    const img = document.createElement("img");
    img.className = "memory-img";
    img.src = m.src;
    img.alt = m.caption || "Memory";

    // Heart overlay for double-click animation
    const overlay = document.createElement("div");
    overlay.className = "memory-heart-overlay";
    overlay.innerHTML = "💖";

    const body = document.createElement("div");
    body.className = "memory-body";

    const cap = document.createElement("p");
    cap.className = "memory-caption";
    cap.textContent = m.caption || "";

    const meta = document.createElement("p");
    meta.className = "memory-meta";
    meta.textContent = m.meta || "";

    // Like button (heart-only, placed over the card bottom-right)
    const likeBtn = document.createElement("button");
    likeBtn.className = "memory-like";
    likeBtn.type = "button";
    likeBtn.setAttribute("aria-label", "J'aime");
    likeBtn.setAttribute("aria-pressed", likes[id] ? "true" : "false");
    likeBtn.textContent = likes[id] ? "💖" : "🤍";
    if (likes[id]) likeBtn.classList.add("is-liked");

    likeBtn.addEventListener("click", () => {
      const newVal = !Boolean(loadLikes()[id]);
      setLiked(id, newVal);
      // update UI immediately
      likeBtn.textContent = newVal ? "💖" : "🤍";
      likeBtn.classList.toggle("is-liked", newVal);
      likeBtn.setAttribute("aria-pressed", newVal ? "true" : "false");
    });

    body.appendChild(cap);
    body.appendChild(meta);
    // append like button to the card so it's positioned bottom-right
    card.appendChild(likeBtn);

    card.appendChild(img);
    card.appendChild(overlay);
    card.appendChild(body);

    // Pointer-based double-tap detection (works on mobile and desktop)
    img._lastTap = 0;
    img.addEventListener("pointerup", (ev) => {
      const now = Date.now();
      const DT = 300; // ms threshold for double-tap
      if (now - (img._lastTap || 0) <= DT) {
        // double-tap detected
        const currentlyLiked = Boolean(loadLikes()[id]);
        if (!currentlyLiked) {
          setLiked(id, true);
          likeBtn.textContent = "💖";
          likeBtn.classList.add("is-liked");
          likeBtn.setAttribute("aria-pressed", "true");
        }

        // animate overlay
        overlay.classList.add("is-visible");
        window.setTimeout(() => overlay.classList.remove("is-visible"), 520);
        img._lastTap = 0;
      } else {
        img._lastTap = now;
      }
    });

    memoriesGridEl.appendChild(card);
  });
}

/* Likes storage helpers */
const LIKES_KEY = "valentine_likes_v1";
function loadLikes() {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
}
function saveLikes(obj) {
  try { localStorage.setItem(LIKES_KEY, JSON.stringify(obj)); } catch {}
}
function setLiked(id, v) {
  const s = loadLikes();
  if (v) s[id] = true; else delete s[id];
  saveLikes(s);
}


function todayKey() {
  const d = new Date();
  // Stable day key in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadCouponState() {
  const tk = todayKey();
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    if (!raw) return { day: tk, used: 0, history: [] };

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.day !== tk) {
      return { day: tk, used: 0, history: [] };
    }
    if (typeof parsed.used !== "number") parsed.used = 0;
    if (!Array.isArray(parsed.history)) parsed.history = [];
    return parsed;
  } catch {
    return { day: tk, used: 0, history: [] };
  }
}

function saveCouponState(state) {
  try {
    localStorage.setItem(COUPON_KEY, JSON.stringify(state));
  } catch {}
}

function remainingCoupons(state) {
  return Math.max(0, DAILY_LIMIT - state.used);
}

function formatTodayForUI() {
  const d = new Date();
  return d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function renderCoupons() {
  const state = loadCouponState();
  const remaining = remainingCoupons(state);

  couponsRemainingEl.textContent = String(remaining);
  couponsDateEl.textContent = formatTodayForUI();
  couponMsgEl.textContent = "";

  // Build list
  couponGridEl.innerHTML = "";
  COUPONS.forEach((c) => {
    const item = document.createElement("div");
    item.className = "coupon-item";
    const usedToday = state.history.some((h) => h.id === c.id);
    if (usedToday) item.classList.add("is-used");

    const left = document.createElement("div");
    left.className = "coupon-left";

    const title = document.createElement("div");
    title.className = "coupon-title";
    title.textContent = `${c.emoji} ${c.title}`;

    const desc = document.createElement("div");
    desc.className = "coupon-desc";
    desc.textContent = c.desc;

    left.appendChild(title);
    left.appendChild(desc);

    const btn = document.createElement("button");
    btn.className = "btn coupon-use";
    btn.type = "button";
    btn.textContent = usedToday ? "Utilisé ✅" : "Utiliser";

    if (remaining <= 0 || usedToday) btn.disabled = true;

    btn.addEventListener("click", () => {
      const s = loadCouponState();
      if (s.history.some((h) => h.id === c.id)) {
        couponMsgEl.textContent = "Celui-là est déjà utilisé aujourd’hui 😇";
        renderCoupons();
        return;
      }
      if (remainingCoupons(s) <= 0) {
        couponMsgEl.textContent = "Plus de bons pour aujourd’hui 😇 (ça revient demain)";
        renderCoupons();
        return;
      }

      s.used += 1;
      s.history.push({ id: c.id, t: Date.now() });
      saveCouponState(s);

      const leftNow = remainingCoupons(s);
      couponMsgEl.textContent = `✅ Utilisé : ${c.title} — il te reste ${leftNow} bon(s) aujourd’hui.`;
      renderCoupons();
    });

    item.appendChild(left);
    item.appendChild(btn);

    couponGridEl.appendChild(item);
  });
}

/** Gate submit */
gateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  setGateError("");

  const entered = normalize(secretInput.value);
  const expected = normalize(SECRET_CODE);

  if (!entered) {
    setGateError("Entre un code 😌");
    secretInput.focus();
    return;
  }

  if (entered !== expected) {
    setGateError("NOPINOP MAUVAIS CODE! 😅");
    try {
      screens.gate.animate(
        [
          { transform: "translateX(0px)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(-6px)" },
          { transform: "translateX(6px)" },
          { transform: "translateX(0px)" },
        ],
        { duration: 320, easing: "ease-in-out" }
      );
    } catch {}
    secretInput.select();
    return;
  }

  setUnlocked(true);

  // ✅ Flow required: gate -> congrats -> ask (no transitions)
  showScreen("congrats");
  window.setTimeout(() => {
    resetAskUI();
    showScreen("ask");
    // show tabbar after Congrats
    if (tabbar) tabbar.hidden = true;
  }, 2500);
});

/** Ask screen buttons */
yesBtn.addEventListener("click", () => {
  setAccepted(true);
  if (tabbar) tabbar.hidden = false;
  document.body.classList.add("has-tabbar");
  showScreen("woohoo");
  setActiveTab("woohoo");
});

noBtn.addEventListener("click", () => {
  noClicks += 1;

  // Update plea message (loops)
  const msg = PLEA_MESSAGES[(noClicks - 1) % PLEA_MESSAGES.length];
  pleaMsg.textContent = msg;

  // Complementary scaling: grows/shrinks but stays safe + doesn't overflow card
  const MAX_YES = 1.25;
  const MIN_NO = 0.65;
  const t = Math.min(1, noClicks / 10);

  let yesScale = 1 + t * (MAX_YES - 1);
  const noScale = 1 - t * (1 - MIN_NO);

  // Hard clamp by row width
  const cta = document.querySelector(".cta");
  if (cta) {
    const available = cta.clientWidth;
    const baseYesW = yesBtn.offsetWidth || 1;
    const maxScaleByWidth = (available * 0.9) / baseYesW;
    yesScale = Math.min(yesScale, maxScaleByWidth);
  }

  yesBtn.style.setProperty("--btn-scale", String(yesScale));
  noBtn.style.setProperty("--btn-scale", String(noScale));

  noBtn.style.opacity = String(Math.max(0.25, 0.92 - noClicks * 0.06));
});

/** Reset */
resetBtn.addEventListener("click", () => {
  setUnlocked(false);
  setAccepted(false);
  setGateError("");
  secretInput.value = "";
  resetAskUI();
  // Reset coupons state (NEW)
  try { localStorage.removeItem(COUPON_KEY); } catch {}

  // Reset likes on memories
  try { localStorage.removeItem(LIKES_KEY); } catch {}

  // If the memories screen is visible, re-render to clear UI
  try { renderMemories(); } catch {}

  // Hide tabbar again (NEW)
  if (tabbar) tabbar.hidden = true;
  document.body.classList.remove("has-tabbar");
  setActiveTab("woohoo");
  showScreen("gate");
});

/** On load */
document.addEventListener("DOMContentLoaded", () => {
  if (isUnlocked()) {
    resetAskUI();

    if (isAccepted()) {
      // She already said YES before: show nav + go to coupons
      if (tabbar) tabbar.hidden = false;
      document.body.classList.add("has-tabbar");
      showScreen("woohoo");
      setActiveTab("woohoo");
    } else {
      // Unlocked but not yet YES: no nav
      if (tabbar) tabbar.hidden = true;
      showScreen("ask");
    }
  } else {
    showScreen("gate");
    if (tabbar) tabbar.hidden = true;
    secretInput.focus();
  }
});

// Tab bar navigation (NEW)
if (tabHome) {
  tabHome.addEventListener("click", () => {
    showScreen("woohoo");
    setActiveTab("woohoo");
  });
}
if (tabCoupons) {
  tabCoupons.addEventListener("click", () => {
    showScreen("coupons");
    renderCoupons();
    setActiveTab("coupons");
  });
}
if (tabMemories) {
  tabMemories.addEventListener("click", () => {
    showScreen("memories");
    renderMemories();
    setActiveTab("memories");
  });
}
if (woohooToCoupons) {
  woohooToCoupons.addEventListener("click", () => {
    showScreen("coupons");
    renderCoupons();
    setActiveTab("coupons");
  });
}
if (woohooToMemories) {
  woohooToMemories.addEventListener("click", () => {
    showScreen("memories");
    renderMemories();
    setActiveTab("memories");
  });
}

