// ai-coach — one analyst for the whole diary.
//
// Reads everything (what Yuki ate today, the week's diet, weight, cleaning,
// water), turns it into hard findings with a rule engine, then asks the model
// to phrase the most important one. The engine decides WHAT is true and what
// to do; the model only writes — so advice stays concrete and can't drift.
// Focus rotates between calls and past texts are fed back, so tips don't repeat.
//
// POST { scope: 'home'|'food'|'water'|'clean'|'weight', today: 'YYYY-MM-DD',
//        hour: 0-23, measured_on?: 'YYYY-MM-DD', force?: boolean }
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const AI_URL = Deno.env.get("BARABASH_AI_URL") || "https://barabash-ai.tailcd3444.ts.net/v1";
const AI_KEY = Deno.env.get("BARABASH_AI_KEY") || "";
const AI_MODEL = Deno.env.get("BARABASH_AI_MODEL") || "qwen3.5:9b";

const DAY = 86400000;
const FRESH_MIN = 80; // g of fresh food per day
const FRESH_MAX = 150;
const W_MIN = 900; // adult boar
const W_MAX = 1200;

// ---- nutrition reference (per slug) ----
// vitamin C, mg per 100 g
const VITC: Record<string, number> = {
  "bell-pepper-red": 128, "bell-pepper-yellow": 184, "bell-pepper-orange": 150, "bell-pepper-green": 80,
  parsley: 133, kale: 93, broccoli: 89, "brussels-sprouts": 85, kohlrabi: 62, cauliflower: 48, dill: 85,
  strawberry: 59, "wild-strawberry": 59, orange: 53, kiwi: 93, mandarin: 27, clementine: 49, grapefruit: 31,
  lemon: 53, pomelo: 61, cabbage: 37, "red-cabbage": 57, "savoy-cabbage": 31, "napa-cabbage": 27, spinach: 28,
  tomato: 14, cucumber: 3, carrot: 6, zucchini: 18, cilantro: 27, "romaine-lettuce": 4, "green-leaf-lettuce": 9,
  "red-leaf-lettuce": 4, "butterhead-lettuce": 4, "iceberg-lettuce": 3, celery: 3, apple: 5, pear: 4, banana: 9,
  watermelon: 8, melon: 37, blueberry: 10, "highbush-blueberry": 10, raspberry: 26, blackcurrant: 181,
  redcurrant: 41, gooseberry: 28, cranberry: 14, rosehip: 400, "dandelion-greens": 35, arugula: 15,
  "swiss-chard": 30, "beet-greens": 30, beetroot: 5, radish: 15, turnip: 21, rutabaga: 25, pumpkin: 9, squash: 21,
  "sweet-potato": 2, peas: 40, "green-beans": 12, corn: 7, mango: 36, pineapple: 48, papaya: 61, guava: 228,
  peach: 7, apricot: 10, plum: 10, cherry: 7, grape: 3, fennel: 12, asparagus: 6, "bok-choy": 45,
  "mustard-greens": 70, "collard-greens": 35, "turnip-greens": 60, watercress: 43, basil: 18, mint: 32,
  "sea-buckthorn": 200, endive: 7, pattypan: 18, "carrot-tops": 30, sprouts: 13,
};
const HIGH_CA = new Set([
  "parsley", "dill", "spinach", "kale", "swiss-chard", "beet-greens", "dandelion-greens", "collard-greens",
  "turnip-greens", "mustard-greens", "watercress", "cilantro", "mint", "basil", "clover", "carrot-tops",
]);
const SWEET_VEG = new Set(["carrot", "beetroot", "corn", "sweet-potato", "parsnip", "pumpkin", "squash"]);
const GASSY = new Set([
  "cabbage", "red-cabbage", "savoy-cabbage", "brussels-sprouts", "broccoli", "cauliflower", "kohlrabi", "bok-choy",
]);
const WATERY = new Set(["cucumber", "iceberg-lettuce", "watermelon", "celery", "zucchini"]);
const LEAFY = new Set([
  "romaine-lettuce", "green-leaf-lettuce", "red-leaf-lettuce", "butterhead-lettuce", "endive", "arugula",
  "dandelion-greens", "plantain", "meadow-grass", "timothy", "napa-cabbage", "swiss-chard", "carrot-tops",
]);

type Food = {
  id: string; slug: string; name_ru: string; category: string; safety: string; frequency: string;
  kind: string; is_staple: boolean; daily_target: number | null;
};
type Finding = { id: string; sev: number; area: string; title: string; text: string; action?: string };

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const dayNum = (d: string) => Math.round(Date.parse(d + "T00:00:00Z") / DAY);
const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
function plural(n: number, one: string, few: string, many: string) {
  n = Math.abs(Math.round(n));
  const d10 = n % 10, d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return few;
  return many;
}
const days = (n: number) => `${n} ${plural(n, "день", "дня", "дней")}`;
const times = (n: number) => `${n} ${plural(n, "раз", "раза", "раз")}`;
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const list = (a: string[], max = 4) => a.slice(0, max).join(", ");
function weekLimit(freq: string) {
  return freq === "weekly" ? 2 : freq === "occasional" ? 1 : freq === "never" ? 0 : 99;
}
function avgGap(ts: string[]) {
  const a = ts.slice(0, 12).map((t) => +new Date(t)).sort((x, y) => x - y);
  if (a.length < 2) return null;
  return (a[a.length - 1] - a[0]) / (a.length - 1) / DAY;
}
function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function analyse(today: string, hour: number, measuredOn?: string) {
  const tN = dayNum(today);
  const since30 = iso((tN - 30) * DAY);
  const [cfgR, foodsR, feedR, wR, cR, waR] = await Promise.all([
    admin.from("pet_config").select("name,birthdate").eq("id", 1).maybeSingle(),
    admin.from("foods").select("id,slug,name_ru,category,safety,frequency,kind,is_staple,daily_target"),
    admin.from("feedings").select("id,food_id,amount,unit,fed_on,created_at").gte("fed_on", since30).lte("fed_on", today).limit(3000),
    admin.from("weights").select("measured_on,grams").lte("measured_on", measuredOn || today).order("measured_on", { ascending: false }).limit(40),
    admin.from("cleanings").select("cleaned_at").order("cleaned_at", { ascending: false }).limit(40),
    admin.from("waterings").select("changed_at").order("changed_at", { ascending: false }).limit(40),
  ]);
  const name = cfgR.data?.name || "Юки";
  const foods = (foodsR.data || []) as Food[];
  const fmap = new Map(foods.map((f) => [f.id, f]));
  const feeds = (feedR.data || []).map((r) => ({ ...r, food: fmap.get(r.food_id), amount: Number(r.amount || 0), dn: dayNum(r.fed_on) }))
    .filter((r) => r.food) as { id: string; food: Food; amount: number; fed_on: string; dn: number }[];
  const vitTarget = Number(foods.find((f) => f.kind === "vitamin_c")?.daily_target || 3);

  // ---------- today ----------
  const tf = feeds.filter((r) => r.dn === tN);
  const todayMap = new Map<string, { food: Food; amount: number }>();
  for (const r of tf) {
    const e = todayMap.get(r.food.id) || { food: r.food, amount: 0 };
    e.amount += r.amount;
    todayMap.set(r.food.id, e);
  }
  const todayItems = [...todayMap.values()];
  const produceToday = todayItems.filter((x) => x.food.kind === "produce");
  const freshToday = sum(produceToday.map((x) => x.amount));
  const vitTabsToday = sum(todayItems.filter((x) => x.food.kind === "vitamin_c").map((x) => x.amount));
  const pelletsToday = sum(todayItems.filter((x) => x.food.kind === "feed").map((x) => x.amount));
  const vitcFoodToday = sum(produceToday.map((x) => ((VITC[x.food.slug] || 0) * x.amount) / 100));
  const isSweet = (f: Food) => f.category === "fruit" || f.category === "treat" || SWEET_VEG.has(f.slug);
  const sweetToday = produceToday.filter((x) => isSweet(x.food));
  const sweetTodayG = sum(sweetToday.map((x) => x.amount));
  const leafyToday = produceToday.some((x) => LEAFY.has(x.food.slug));

  // ---------- last 7 days (including today) ----------
  const wk = feeds.filter((r) => r.dn > tN - 7);
  const loggedDays = new Set(wk.map((r) => r.dn));
  const wkProduce = wk.filter((r) => r.food.kind === "produce");
  const per = new Map<string, { food: Food; days: Set<number>; grams: number }>();
  for (const r of wkProduce) {
    const e = per.get(r.food.id) || { food: r.food, days: new Set<number>(), grams: 0 };
    e.days.add(r.dn);
    e.grams += r.amount;
    per.set(r.food.id, e);
  }
  const wkFoods = [...per.values()].sort((a, b) => b.grams - a.grams);
  const wkFresh = sum(wkFoods.map((x) => x.grams));
  const freshPerDay = loggedDays.size ? wkFresh / loggedDays.size : 0;
  const wkSweetG = sum(wkFoods.filter((x) => isSweet(x.food)).map((x) => x.grams));
  const sweetShare = wkFresh ? wkSweetG / wkFresh : 0;
  const caDays = new Set<number>();
  const gasDays = new Set<number>();
  for (const r of wkProduce) {
    if (HIGH_CA.has(r.food.slug)) caDays.add(r.dn);
    if (GASSY.has(r.food.slug)) gasDays.add(r.dn);
  }
  const vitByDay = new Map<number, number>();
  for (const r of wk) if (r.food.kind === "vitamin_c") vitByDay.set(r.dn, (vitByDay.get(r.dn) || 0) + r.amount);
  const vitFullDays = [...vitByDay.values()].filter((v) => v >= vitTarget).length;
  const pelletsWk = sum(wk.filter((r) => r.food.kind === "feed").map((r) => r.amount));
  const pelletsPerDay = loggedDays.size ? pelletsWk / loggedDays.size : 0;
  const overLimit = wkFoods.filter((x) => x.food.safety !== "forbidden" && x.days.size > weekLimit(x.food.frequency));
  const forbiddenWk = wkFoods.filter((x) => x.food.safety === "forbidden");
  const lastFeedDn = feeds.length ? Math.max(...feeds.map((r) => r.dn)) : null;

  // ---------- 30 days: what's "usually at home" ----------
  const usual = new Map<string, { food: Food; n: number }>();
  for (const r of feeds) {
    if (r.food.kind !== "produce") continue;
    const e = usual.get(r.food.id) || { food: r.food, n: 0 };
    e.n++;
    usual.set(r.food.id, e);
  }
  const usualList = [...usual.values()].sort((a, b) => b.n - a.n).map((x) => x.food);

  // what is fine to offer next today / what to hold back
  const givenToday = new Set(produceToday.map((x) => x.food.id));
  const wkDays = (f: Food) => per.get(f.id)?.days.size || 0;
  const hold: string[] = [];
  for (const x of overLimit) hold.push(`${lower(x.food.name_ru)} (уже ${days(x.days.size)} из 7)`);
  for (const x of wkFoods) {
    const lim = weekLimit(x.food.frequency);
    if (lim < 99 && x.days.size === lim && !overLimit.includes(x)) hold.push(`${lower(x.food.name_ru)} (недельная норма выбрана)`);
  }
  const canOffer = usualList.filter(
    (f) => f.safety === "safe" && !givenToday.has(f.id) && wkDays(f) < weekLimit(f.frequency) && !(caDays.size >= 4 && HIGH_CA.has(f.slug)) && !(sweetShare > 0.15 && isSweet(f)),
  );
  const offerVitC = canOffer.filter((f) => (VITC[f.slug] || 0) >= 40);
  const offerLeafy = canOffer.filter((f) => LEAFY.has(f.slug));
  const offer: string[] = [];
  const full = freshToday >= FRESH_MAX;
  if (!full && vitcFoodToday < 20 && offerVitC[0]) offer.push(`${lower(offerVitC[0].name_ru)} (много вит. C)`);
  if (!full && !leafyToday && offerLeafy[0]) offer.push(`${lower(offerLeafy[0].name_ru)} (листовая зелень)`);
  for (const f of canOffer) {
    if (full || offer.length >= 3) break;
    if (!offer.some((o) => o.startsWith(lower(f.name_ru)))) offer.push(lower(f.name_ru));
  }

  // ---------- weight ----------
  const wDesc = (wR.data || []).map((w) => ({ on: w.measured_on as string, g: Number(w.grams) }));
  const wCur = wDesc[0] || null;
  const wPrev = wDesc[1] || null;
  const dSinceWeigh = wCur ? tN - dayNum(wCur.on) : null;
  let wBase = null as null | { on: string; g: number };
  if (wCur) for (const w of wDesc) if (dayNum(wCur.on) - dayNum(w.on) >= 25) { wBase = w; break; }
  const wChg = wCur && wBase ? wCur.g - wBase.g : null;
  const wChgPct = wChg !== null && wBase ? (wChg / wBase.g) * 100 : null;
  const wSpanDays = wCur && wBase ? dayNum(wCur.on) - dayNum(wBase.on) : null;
  const wDelta = wCur && wPrev ? wCur.g - wPrev.g : null;
  const wDesc0 = wCur ? wCur.g : 0;

  // ---------- care ----------
  const cl = (cR.data || []).map((r) => r.cleaned_at as string);
  const wa = (waR.data || []).map((r) => r.changed_at as string);
  const now = Date.now();
  const dClean = cl[0] ? Math.floor((now - +new Date(cl[0])) / DAY) : null;
  const dWater = wa[0] ? Math.floor((now - +new Date(wa[0])) / DAY) : null;
  const cleanGap = avgGap(cl);
  const waterGap = avgGap(wa);

  const wCur0 = wDesc0;
  // ================= findings =================
  const F: Finding[] = [];
  const add = (id: string, sev: number, area: string, title: string, text: string, action?: string) => F.push({ id, sev, area, title, text, action });
  const eatenTxt = produceToday.length
    ? list(produceToday.sort((a, b) => b.amount - a.amount).map((x) => `${lower(x.food.name_ru)} ${r0(x.amount)} г`), 6)
    : "";

  // -- food: today --
  if (!tf.length) {
    if (hour >= 10) {
      const gap = lastFeedDn === null ? null : tN - lastFeedDn;
      add("no-food-today", hour >= 17 ? 3 : 2, "food", "Еда сегодня не записана",
        gap && gap > 1 ? `Записей о еде нет уже ${days(gap)} — последний раз кормление отмечали ${iso(lastFeedDn! * DAY)}.` : "За сегодня в дневнике нет ни одного кормления.",
        offer.length ? `Дай и запиши свежую порцию: ${list(offer, 3)}.` : "Дай свежие овощи и запиши порцию.");
    }
  } else {
    if (produceToday.length) {
      if (freshToday > FRESH_MAX * 1.35) {
        add("fresh-high", 2, "food", "Сегодня много свежего",
          `Свежего уже ${r0(freshToday)} г (${eatenTxt}) — это выше ориентира ${FRESH_MIN}–${FRESH_MAX} г в день.`,
          "На сегодня свежего достаточно — остаток дня без добавок.");
      } else if (freshToday < FRESH_MIN && hour >= 18) {
        add("fresh-low", 2, "food", "Свежего сегодня маловато",
          `К вечеру свежего только ${r0(freshToday)} г (${eatenTxt}) при ориентире ${FRESH_MIN}–${FRESH_MAX} г.`,
          offer.length ? `Добавь ещё ${r0(FRESH_MIN - freshToday)}–${r0(FRESH_MAX - freshToday)} г: ${list(offer, 2)}.` : `Добавь ещё ${r0(FRESH_MIN - freshToday)} г овощей.`);
      } else if (freshToday < FRESH_MIN) {
        add("fresh-progress", 1, "food", "Дневная порция ещё не набрана",
          `Сегодня он съел ${r0(freshToday)} г свежего (${eatenTxt}); до ориентира ${FRESH_MIN}–${FRESH_MAX} г осталось ${r0(FRESH_MIN - freshToday)}–${r0(FRESH_MAX - freshToday)} г.`,
          offer.length ? `Вечером можно дать: ${list(offer, 2)}.` : undefined);
      } else {
        add("fresh-ok", 0, "food", "Свежая порция в норме",
          `Сегодня ${r0(freshToday)} г свежего (${eatenTxt}) — в пределах ориентира ${FRESH_MIN}–${FRESH_MAX} г.`);
      }
    } else if (hour >= 14) {
      add("no-fresh-today", 2, "food", "Сегодня без свежих овощей",
        "Сегодня записаны только корм или витамин, свежих овощей и зелени ещё не было.",
        offer.length ? `Дай порцию: ${list(offer, 3)}.` : "Дай порцию свежих овощей.");
    }
    const forbToday = produceToday.filter((x) => x.food.safety === "forbidden");
    if (forbToday.length) {
      add("forbidden-today", 3, "food", "В миске запрещённый продукт",
        `Сегодня записано: ${list(forbToday.map((x) => `${lower(x.food.name_ru)} ${r0(x.amount)} г`))} — свинкам это нельзя.`,
        "Убери остатки из клетки и понаблюдай за аппетитом и помётом сутки; при вялости — к врачу.");
    }
    if (sweetTodayG >= 25) {
      add("sweet-today", 2, "food", "Сегодня много сладкого",
        `Сладкого за сегодня уже ${r0(sweetTodayG)} г, это много: ${list(sweetToday.map((x) => `${lower(x.food.name_ru)} ${r0(x.amount)} г`))}.`,
        "Больше сладкого сегодня не давай, завтра сделай день без фруктов и моркови.");
    }
    const watery = produceToday.filter((x) => WATERY.has(x.food.slug));
    const wateryG = sum(watery.map((x) => x.amount));
    if (wateryG >= 90 && wateryG > freshToday * 0.6) {
      add("watery-today", 1, "food", "Рацион сегодня водянистый",
        `${r0(wateryG)} г из ${r0(freshToday)} г сегодня — ${list(watery.map((x) => lower(x.food.name_ru)))}: много воды и мало пользы.`,
        offerVitC[0] ? `Завтра часть замени на ${lower(offerVitC[0].name_ru)}.` : "Завтра часть замени на перец или листовой салат.");
    }
    if (produceToday.length && !leafyToday && hour >= 15 && offerLeafy[0]) {
      add("no-leafy-today", 1, "food", "Сегодня без листовой зелени",
        "Листовой зелени сегодня ещё не было — она нужна для зубов и пищеварения.",
        `Дай горсть: ${lower(offerLeafy[0].name_ru)}.`);
    }
  }
  if (tf.length || hour >= 12) {
    if (vitTabsToday < vitTarget) {
      add("vit-today", hour >= 18 ? 2 : 1, "food", "Витамин C не добран",
        `Витамин C сегодня: ${r0(vitTabsToday)} из ${vitTarget} таблеток${produceToday.length ? `, из еды ещё примерно ${r0(vitcFoodToday)} мг` : ""}.`,
        `Дай ещё ${r0(vitTarget - vitTabsToday)} ${plural(vitTarget - vitTabsToday, "таблетку", "таблетки", "таблеток")}${vitcFoodToday < 20 && offerVitC[0] ? ` и ${lower(offerVitC[0].name_ru)}` : ""}.`);
    } else {
      add("vit-ok", 0, "food", "Витамин C закрыт", `Витамин C сегодня полностью: ${r0(vitTabsToday)} из ${vitTarget}, плюс примерно ${r0(vitcFoodToday)} мг из еды.`);
    }
  }

  // -- food: week --
  if (loggedDays.size) {
    if (loggedDays.size <= 4) {
      add("log-gaps", 1, "food", "Дневник с пропусками",
        `За последние 7 дней еда записана только за ${days(loggedDays.size)} — анализ рациона неполный.`,
        "Отмечай кормление каждый день, хотя бы овощи и витамин.");
    }
    for (const x of overLimit.slice(0, 2)) {
      add("over-" + x.food.slug, 2, "food", `${x.food.name_ru}: слишком часто`,
        `${x.food.name_ru} был ${days(x.days.size)} из последних 7 (${r0(x.grams)} г), а норма — ${x.food.frequency === "weekly" ? "1–2 раза в неделю" : "изредка"}.`,
        `Сделай паузу с продуктом «${lower(x.food.name_ru)}» до конца недели.`);
    }
    if (forbiddenWk.length && !F.some((f) => f.id === "forbidden-today")) {
      add("forbidden-week", 2, "food", "На неделе был запрещённый продукт",
        `За неделю в дневнике: ${list(forbiddenWk.map((x) => lower(x.food.name_ru)))} — из списка «нельзя».`,
        "Больше не давай и следи за помётом.");
    }
    if (sweetShare > 0.2 && wkSweetG >= 60) {
      const top = wkFoods.filter((x) => isSweet(x.food)).slice(0, 3).map((x) => `${lower(x.food.name_ru)} ${r0(x.grams)} г`);
      add("sweet-week", 2, "food", "Многовато сахара за неделю",
        `Сладкое — ${r0(sweetShare * 100)}% свежего рациона за неделю (${r0(wkSweetG)} г: ${list(top)}).`,
        "Замени половину сладкого на перец, огурец и листовой салат.");
    }
    if (caDays.size >= 5) {
      const ca = wkFoods.filter((x) => HIGH_CA.has(x.food.slug)).map((x) => lower(x.food.name_ru));
      add("calcium", 2, "food", "Много кальциевой зелени",
        `Зелень с высоким кальцием (${list(ca)}) была ${days(caDays.size)} из 7 — при таком ритме растёт риск камней в мочевом.`,
        "Давай её через день, а в остальные дни — листовой салат.");
    }
    if (gasDays.size >= 4) {
      add("gassy", 1, "food", "Часто капустные",
        `Капустные овощи были ${days(gasDays.size)} из 7 — они дают вздутие.`,
        "Оставь капустные на 1–2 раза в неделю.");
    }
    if (loggedDays.size >= 4) {
      if (wkFoods.length <= 3) {
        add("variety-low", 1, "food", "Рацион однообразный",
          `За неделю всего ${wkFoods.length} ${plural(wkFoods.length, "продукт", "продукта", "продуктов")}: ${list(wkFoods.map((x) => lower(x.food.name_ru)))}.`,
          "Добавь 1–2 новых овоща или листовой салат.");
      } else if (wkFoods.length >= 7) {
        add("variety-ok", 0, "food", "Рацион разнообразный", `За неделю ${wkFoods.length} разных продуктов — отличное разнообразие.`);
      }
      if (freshPerDay < FRESH_MIN * 0.75) {
        add("fresh-week-low", 2, "food", "Мало свежего за неделю",
          `В среднем ${r0(freshPerDay)} г свежего в день (по ${days(loggedDays.size)} с записями) при ориентире ${FRESH_MIN}–${FRESH_MAX} г.`,
          "Увеличь ежедневную порцию овощей и зелени.");
      } else if (freshPerDay > FRESH_MAX * 1.4) {
        add("fresh-week-high", 1, "food", "Свежего больше нормы",
          `В среднем ${r0(freshPerDay)} г свежего в день — заметно выше ориентира ${FRESH_MIN}–${FRESH_MAX} г.`,
          "Чуть уменьши порции, особенно водянистых овощей.");
      }
      if (vitFullDays < loggedDays.size - 2) {
        add("vit-week", 2, "food", "Витамин C с пропусками",
          vitFullDays ? `Полная доза витамина C была только ${days(vitFullDays)} из ${loggedDays.size} с записями за неделю.` : `За неделю полной дозы витамина C (${vitTarget} таблетки в день) не было ни разу.`,
          "Привяжи таблетки к утреннему и вечернему кормлению.");
      } else if (vitFullDays >= 6) {
        add("vit-week-ok", 0, "food", "Витамин C стабильно", `Полная доза витамина C — ${days(vitFullDays)} из 7. Так держать.`);
      }
    }
    if (pelletsToday >= 3) {
      add("pellets-today", wCur0 > W_MAX - 80 ? 2 : 1, "food", "Много корма сегодня",
        `Корма сегодня уже ${r1(pelletsToday)} ${plural(pelletsToday, "порция", "порции", "порций")}${wCur0 ? ` при весе ${r0(wCur0)} г` : ""} — гранулы самые калорийные в рационе.`,
        "Сегодня корм больше не досыпай.");
    } else if (pelletsPerDay > 2 && wCur0 > W_MAX - 80) {
      add("pellets-week", 1, "food", "Корма больше, чем нужно",
        `В среднем ${r1(pelletsPerDay)} порции корма в день при весе ${r0(wCur0)} г у верхней границы нормы.`,
        "Сократи корм до 1–2 порций в день.");
    }
    const top = wkFoods[0];
    if (top && wkFresh > 0 && top.grams / wkFresh > 0.55 && wkFoods.length > 1) {
      add("one-food", 1, "food", `Слишком много: ${lower(top.food.name_ru)}`,
        `${top.food.name_ru} — ${r0((top.grams / wkFresh) * 100)}% всего свежего за неделю (${r0(top.grams)} г).`,
        "Раздели порцию с другими овощами.");
    }
  }

  // -- weight --
  if (!wCur) {
    add("no-weight", 2, "weight", "Нет взвешиваний", "В дневнике ещё нет ни одного веса.", "Взвесь его на кухонных весах и запиши.");
  } else {
    if (wChgPct !== null && wChgPct <= -5) {
      add("weight-loss", 3, "weight", wChgPct <= -10 ? "Резкая потеря веса" : "Вес снижается",
        `За ${days(wSpanDays!)} вес упал на ${r0(-wChg!)} г (${r1(wChgPct)}%): ${r0(wBase!.g)} → ${r0(wCur.g)} г.`,
        wChgPct <= -10 ? "Это повод показать его ветеринару в ближайшие дни." : "Взвешивай каждые 2–3 дня и проверь аппетит и зубы; если падение продолжится — к врачу.");
    } else if (wCur.g < W_MIN) {
      add("weight-under", 2, "weight", "Вес ниже нормы", `Вес ${r0(wCur.g)} г — ниже нормы взрослого самца ${W_MIN}–${W_MAX} г.`, "Добавь порцию корма и взвешивай раз в 3–4 дня.");
    } else if (wCur.g > W_MAX) {
      add("weight-over", 2, "weight", "Вес выше нормы",
        `Вес ${r0(wCur.g)} г — выше нормы ${W_MIN}–${W_MAX} г.`,
        pelletsPerDay > 1.2 ? `Сократи корм: сейчас в среднем ${r1(pelletsPerDay)} порции в день.` : "Убери сладкое и дай больше бегать вне клетки.");
    } else if (wChgPct !== null && wChgPct >= 4 && wCur.g > W_MAX - 80) {
      add("weight-gain", 2, "weight", "Вес подходит к верхней границе",
        `За ${days(wSpanDays!)} он набрал ${r0(wChg!)} г (+${r1(wChgPct)}%) и весит ${r0(wCur.g)} г — до верхней границы нормы ${W_MAX} г осталось ${r0(W_MAX - wCur.g)} г.`,
        sweetShare > 0.12 ? "Убери сладкое (фрукты, морковь, свёклу) на пару недель." : pelletsPerDay > 1.2 ? "Уменьши порцию корма и добавь прогулок." : "Добавь прогулок и держи порцию корма без добавок.");
    } else if (wCur.g > W_MAX - 60) {
      add("weight-edge", 1, "weight", "Вес у верхней границы",
        `Вес ${r0(wCur.g)} г — в норме, но у верхней границы (${W_MAX} г)${wDelta !== null ? `; к прошлому взвешиванию ${wDelta > 0 ? "+" : ""}${r0(wDelta)} г` : ""}.`,
        "Следи, чтобы не рос дальше: меньше сладкого, больше движения.");
    } else {
      add("weight-ok", 0, "weight", "Вес в норме",
        `Вес ${r0(wCur.g)} г — в норме ${W_MIN}–${W_MAX} г${wChg !== null ? `, за ${days(wSpanDays!)} ${wChg >= 0 ? "+" : ""}${r0(wChg)} г` : ""}.`);
    }
    if (dSinceWeigh !== null && dSinceWeigh > 10) {
      add("weigh-overdue", 2, "weight", "Давно не взвешивали", `Последнее взвешивание было ${days(dSinceWeigh)} назад (${r0(wCur.g)} г).`, "Взвесь его сегодня — вес первым показывает проблемы со здоровьем.");
    }
  }

  // -- cleaning --
  if (dClean === null) add("no-clean", 1, "clean", "Уборка не записана", "В дневнике нет ни одной уборки.", "Отметь следующую уборку.");
  else if (dClean > 2) add("clean-overdue", dClean > 4 ? 3 : 2, "clean", "Пора убирать клетку", `Клетку не убирали ${days(dClean)}${cleanGap ? `, обычно убираете раз в ${r1(cleanGap)} дня` : ""}.`, "Убери сегодня: сырая подстилка — это аммиак и риск для лап и дыхания.");
  else if (cleanGap !== null && cleanGap > 3) add("clean-rare", 1, "clean", "Уборка реже, чем нужно", `Клетку убирают в среднем раз в ${r1(cleanGap)} дня — это слишком редко, нужно не реже раза в 2 дня.`, "Старайся убирать не реже раза в 2 дня.");
  else add("clean-ok", 0, "clean", "В клетке чисто", `Последняя уборка ${dClean === 0 ? "сегодня" : days(dClean) + " назад"}${cleanGap ? `, средний интервал ${r1(cleanGap)} дня` : ""}.`);

  // -- water --
  if (dWater === null) add("no-water", 1, "water", "Смена воды не записана", "В дневнике нет ни одной смены воды.", "Отметь, когда меняешь воду.");
  else if (dWater > 2) add("water-overdue", dWater > 3 ? 3 : 2, "water", "Вода застоялась", `Воду не меняли ${days(dWater)}.`, "Вымой поилку и налей свежую воду сейчас.");
  else if (waterGap !== null && waterGap > 1.6) add("water-rare", 1, "water", "Воду лучше менять чаще", `Воду меняют в среднем раз в ${r1(waterGap)} дня — это редко, в стоячей воде быстро растут бактерии.`, "Меняй воду каждый день, а поилку мой раз в неделю.");
  else add("water-ok", 0, "water", "Вода свежая", `Вода менялась ${dWater === 0 ? "сегодня" : days(dWater) + " назад"}${waterGap ? `, в среднем раз в ${r1(waterGap)} дня` : ""}.`);

  const stats = {
    today: {
      items: todayItems.sort((a, b) => b.amount - a.amount).map((x) => ({ slug: x.food.slug, name: x.food.name_ru, kind: x.food.kind, amount: r1(x.amount) })),
      fresh_g: r0(freshToday), vitc_food_mg: r0(vitcFoodToday), vit_tabs: r0(vitTabsToday), vit_target: vitTarget, pellets: r1(pelletsToday),
    },
    week: { logged_days: loggedDays.size, fresh_per_day: r0(freshPerDay), variety: wkFoods.length, sweet_pct: r0(sweetShare * 100), vit_full_days: vitFullDays, pellets_per_day: r1(pelletsPerDay) },
    weight: wCur ? { grams: r0(wCur.g), on: wCur.on, delta: wDelta === null ? null : r0(wDelta), change: wChg === null ? null : r0(wChg), change_pct: wChgPct === null ? null : r1(wChgPct), span_days: wSpanDays } : null,
    care: { clean_days: dClean, clean_gap: cleanGap === null ? null : r1(cleanGap), water_days: dWater, water_gap: waterGap === null ? null : r1(waterGap) },
    fresh_range: [FRESH_MIN, FRESH_MAX],
    offer, hold,
  };
  const sig = hash([today, Math.floor(hour / 6), tf.map((r) => r.id).sort().join(","), cl[0], wa[0], wCur?.on, wCur?.g, measuredOn || ""].join("|"));
  return { name, findings: F, stats, sig };
}

const SCOPE_AREAS: Record<string, string[]> = {
  home: ["food", "weight", "clean", "water"],
  food: ["food"],
  weight: ["weight"],
  clean: ["clean"],
  water: ["water"],
};
const OPENERS = [
  "Начни с конкретной цифры.",
  "Начни с короткого вывода, потом подкрепи его цифрой.",
  "Начни с того, что именно ты заметил в дневнике.",
  "Начни сразу с того, что сделать, и объясни почему.",
  "Начни с самого факта, спокойно и без оценок.",
];

function cleanText(s: string) {
  let t = s.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*$/i, "").replace(/[*_#`>]+/g, "").replace(/\s+/g, " ").trim();
  t = t.replace(/^["«]+|["»]+$/g, "").trim();
  // hay is a given — drop any sentence that still talks about it
  const parts = t.split(/(?<=[.!?…])\s+/).filter((p) => !/(^|[^а-яё])сен(о|а|у|ом|е|ца|цо|ной|ную|ные|ных)([^а-яё]|$)/i.test(p));
  t = parts.join(" ").trim();
  if (t.length > 520) {
    const cut = t.slice(0, 520);
    t = cut.slice(0, Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!")) + 1) || cut;
  }
  return t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const b = await req.json().catch(() => ({}));
    const scope = SCOPE_AREAS[b.scope] ? String(b.scope) : "home";
    const today = /^\d{4}-\d{2}-\d{2}$/.test(b.today || "") ? b.today : iso(Date.now());
    const hour = Number.isFinite(Number(b.hour)) ? Math.min(23, Math.max(0, Number(b.hour))) : new Date().getUTCHours();
    const measuredOn = /^\d{4}-\d{2}-\d{2}$/.test(b.measured_on || "") ? b.measured_on : undefined;

    const a = await analyse(today, hour, measuredOn);
    const areas = SCOPE_AREAS[scope];
    const mine = a.findings.filter((f) => areas.includes(f.area)).sort((x, y) => y.sev - x.sev);
    const shown = mine.map(({ id, sev, area, title, text, action }) => ({ id, sev, area, title, text, action }));

    // cached answer for the same data → instant, and no repeated model calls
    if (!b.force) {
      const { data: hit } = await admin.from("ai_insights").select("title,body,actions,source,focus,created_at").eq("scope", scope).eq("day", today).eq("sig", a.sig).order("created_at", { ascending: false }).limit(1);
      if (hit?.[0]) return json({ title: hit[0].title, text: hit[0].body, actions: hit[0].actions || [], source: hit[0].source, findings: shown, stats: a.stats, cached: true, generated_at: hit[0].created_at });
    }

    // rotate the focus: the top problem always leads, the second angle changes between calls
    const { data: past } = await admin.from("ai_insights").select("focus,body").eq("scope", scope).order("created_at", { ascending: false }).limit(6);
    const usedFocus = new Set((past || []).slice(0, 4).flatMap((p) => String(p.focus || "").split("+")));
    const problems = mine.filter((f) => f.sev > 0);
    const fresh = problems.filter((f) => !usedFocus.has(f.id));
    const main = problems.find((f) => f.sev >= 3) || fresh[0] || problems[0] || mine[0];
    const second = (fresh.find((f) => f !== main) || problems.find((f) => f !== main) || mine.find((f) => f !== main && !usedFocus.has(f.id)) || null);
    const focusIds = [main?.id, second?.id].filter(Boolean).join("+");

    const third = scope === "home" ? problems.find((f) => f !== main && f !== second && f.sev >= 2 && f.area !== main?.area && f.area !== second?.area) : null;
    const actions = [...new Set([main, second, third].filter(Boolean).map((f) => f!.action).filter(Boolean))].slice(0, 3) as string[];
    const allGood = !problems.length;
    const title = allGood ? "Всё под контролем" : main!.title;
    // rule-based text: also the fallback when the model is unavailable
    let text = [main?.text, second && second.sev > 0 ? second.text : "", allGood && second ? second.text : ""].filter(Boolean).join(" ");
    let source = "rules";

    if (AI_KEY && main) {
      const facts = [
        `Наблюдение 1 (главное): ${main.text}${main.action ? "\nЧто сделать: " + main.action : ""}`,
        second ? `Наблюдение 2: ${second.text}${second.action && second.sev > 0 ? "\nЧто сделать: " + second.action : ""}` : "",
      ].filter(Boolean).join("\n\n");
      const sys = [
        `Ты — ветеринарный нутрициолог по морским свинкам и личный помощник хозяев свина по имени ${a.name}. Он самец: пиши о нём в мужском роде («он съел», «его вес»).`,
        "Тебе дают готовые выводы анализа его дневника (еда за сегодня и неделю, вес, уборка, вода). Твоя задача — пересказать их хозяину живым человеческим языком, как внимательный знакомый ветеринар.",
        "Правила:",
        "1. Сохрани все цифры, продукты и смысл наблюдений точно. Не добавляй новых фактов, чисел, выводов и советов, которых нет в тексте. Не переставляй причину и следствие.",
        "2. Сено у него есть всегда, круглосуточно и без ограничений — это данность. Никогда не упоминай сено.",
        "3. 2–4 коротких предложения по-русски. К хозяину обращайся на «ты» в единственном числе («дай», «убери», «взвесь»). Тепло, просто и по делу.",
        "4. Без markdown, списков, эмодзи, приветствий и общих фраз. Не начинай с имени питомца.",
        "5. Можно в полфразы объяснить, почему это важно для морской свинки, — только общеизвестное и без новых цифр.",
        "6. Сначала главное наблюдение, затем что сделать, второе наблюдение — короче. Не повторяй формулировки прошлых ответов.",
      ].join("\n");
      const prev = (past || []).slice(0, 3).map((p) => "— " + String(p.body || "").slice(0, 200)).join("\n");
      const usr = [
        facts,
        "",
        `Перескажи это хозяину. ${OPENERS[Math.floor(Math.random() * OPENERS.length)]}`,
        prev ? `\nПрошлые ответы (не повторяй их формулировки):\n${prev}` : "",
      ].filter((x) => x !== "").join("\n");
      // every number in the answer must come from the findings — otherwise the model made it up
      const allowed = new Set((facts.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(",", ".")));
      // …and a single-topic answer must stay on its topic
      const OFF: Record<string, RegExp> = {
        clean: /(^|[^а-яё])(вод[аыуе]|поилк|корм|вес[аиу]?|овощ|витамин)/i,
        water: /(^|[^а-яё])(уборк|клетк|подстилк|корм|вес[аиу]?|овощ|витамин)/i,
        weight: /(^|[^а-яё])(уборк|клетк|поилк|вод[аыуе])/i,
        food: /(^|[^а-яё])(уборк|клетк|поилк)/i,
      };
      const grounded = (t: string) =>
        (t.match(/\d+(?:[.,]\d+)?/g) || []).every((n) => allowed.has(n.replace(",", "."))) && !(OFF[scope] && OFF[scope].test(t)) && !/превыша|дольше (твоего|среднего)/i.test(scope === "clean" || scope === "water" ? t : "");
      try {
        const r = await fetch(AI_URL + "/chat/completions", {
          method: "POST",
          headers: { Authorization: "Bearer " + AI_KEY, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(50000),
          body: JSON.stringify({ model: AI_MODEL, stream: false, temperature: 0.7, max_tokens: 420, messages: [{ role: "system", content: sys }, { role: "user", content: usr }] }),
        });
        if (r.ok) {
          const d = await r.json();
          const out = cleanText(String(d?.choices?.[0]?.message?.content || ""));
          if (out.length >= 40 && grounded(out)) {
            text = out;
            source = "ai";
          }
        }
      } catch (_e) { /* fall back to the rule-based text */ }
    }

    await admin.from("ai_insights").insert({ scope, day: today, sig: a.sig, focus: focusIds, title, body: text, actions, source });
    if (scope === "weight" && measuredOn) {
      await admin.from("weights").update({ ai_rec: text, ai_status: "done" }).eq("measured_on", measuredOn);
    }
    // keep the table small
    admin.from("ai_insights").delete().lt("created_at", new Date(Date.now() - 45 * DAY).toISOString()).then(() => {});

    return json({ title, text, actions, source, findings: shown, stats: a.stats, cached: false, generated_at: new Date().toISOString() });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
