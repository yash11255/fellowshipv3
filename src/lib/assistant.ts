// Rule-based shopping assistant (client-safe). Intent = keyword/regex match; product answers come from the live catalog index.
import { norm, search, type SearchItem } from "./search";
import type { StoreSettings } from "./pricing";

export type Reply = { text: string; products?: SearchItem[]; links?: { label: string; href: string }[]; chips?: string[] };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// concern → search phrase + the doctor's first-choice handles (mirrors stack-engine HERO)
const CONCERNS: { re: RegExp; label: string; heroes: string[]; href: string }[] = [
  { re: /joint|knee|cartilage|arthrit|stiff|back pain|mobility/, label: "joint comfort", heroes: ["collagen-joint-repair", "moringa-with-curcumin", "omega-3-fish-oil"], href: "/shop/joints-bones" },
  { re: /bone|osteo|calcium/, label: "bone health", heroes: ["collagen-bone-health-60-tablets-copy", "magnesium-complex"], href: "/shop/joints-bones" },
  { re: /sleep|insomnia|stress|anxi|calm|relax/, label: "sleep & stress", heroes: ["magnesium-complex"], href: "/shop/sleep-stress" },
  { re: /energy|tired|fatigue|stamina|lethargic|weak/, label: "energy", heroes: ["shilajit-gold", "nad-longevity-shots-10-bottle", "sports-multivitamin"], href: "/shop/energy" },
  { re: /skin|wrinkle|glow|collagen|fine line/, label: "skin", heroes: ["collagen-skin-age-rewind", "hair-skin-nail-multivitamin"], href: "/shop/skin-hair-nails" },
  { re: /hair|hairfall|nail|bald/, label: "hair & nails", heroes: ["hair-skin-nail-multivitamin", "collagen-skin-age-rewind"], href: "/shop/skin-hair-nails" },
  { re: /gut|bloat|digest|acidity|constipat|probiotic/, label: "gut health", heroes: ["pre-probiotic-gut-health"], href: "/shop/gut" },
  { re: /heart|cholesterol|bp|blood pressure|cardio/, label: "heart health", heroes: ["omega-3-fish-oil"], href: "/shop/heart" },
  { re: /sugar|diabet|glucose|insulin|metaboli/, label: "blood sugar", heroes: ["cinnamon-chromium-blood-sugar-balance-reverse-clinics-copy", "ala-300mg-boost-energy-antioxidant-support-reverse-clinics-60"], href: "/shop/metabolic" },
  { re: /muscle|gym|workout|recovery|strength|creatine|athlet/, label: "performance & recovery", heroes: ["micronised-creatine-monohydrate", "sports-multivitamin", "magnesium-complex"], href: "/shop/sport" },
  { re: /ageing|aging|longevity|nad|nmn|anti.?age|young/, label: "healthy ageing", heroes: ["nad-longevity-shots-10-bottle", "liposomal-nmn-with-trans-resveratrol", "quercetin-bromelain-immunity-allergy-relief-reverse-clinics-60"], href: "/shop/longevity" },
  { re: /weight|fat|slim|obes/, label: "weight management", heroes: ["cinnamon-chromium-blood-sugar-balance-reverse-clinics-copy", "shilajit-gold"], href: "/shop/weight" },
  { re: /immun|cold|allerg|infection/, label: "immunity", heroes: ["quercetin-bromelain-immunity-allergy-relief-reverse-clinics-60", "pre-probiotic-gut-health"], href: "/shop/immunity" },
];

export const START_CHIPS = ["Help me choose", "Joint pain", "Low energy", "Track my order", "Delivery & COD", "Talk to a human"];

export function respond(input: string, items: SearchItem[], s: StoreSettings, whatsapp: string): Reply {
  const q = norm(input);
  const has = (re: RegExp) => re.test(q);

  // Safety first: medical situations → doctor, no product push
  if (has(/pregnan|breastfeed|nursing|lactat/)) return { text: "If you're pregnant or breastfeeding, please talk to your doctor before starting any supplement. Our clinic team can advise you personally.", links: [{ label: "Book a consultation", href: "/clinic" }] };
  if (has(/chest pain|emergency|faint|suicid|overdose|bleeding/)) return { text: "That sounds urgent. Please contact a doctor or call 112 right away. I'm a shopping assistant and can't help with medical emergencies." };
  if (has(/medicine|medication|warfarin|thinner|interact|side effect|kidney|liver|cancer|chemo/)) return { text: "I can't give medical advice, especially about medicines or conditions. Our stack builder leaves out formulas that may not suit common medications, and our clinic can review your case.", links: [{ label: "Find your stack (safety check)", href: "/stack-builder" }, { label: "Book a consultation", href: "/clinic" }] };

  if (has(/^(hi|hello|hey|namaste|hii+|good (morning|evening|afternoon))\b/)) return { text: "Hi! I'm the Reverse assistant. I can help you pick a formula, track an order, or answer delivery questions. What brings you here today?", chips: START_CHIPS };
  if (has(/thank|thanks|great|awesome|perfect/)) return { text: "Happy to help! Anything else?", chips: ["Help me choose", "Delivery & COD"] };

  if (has(/track|where is my order|order status|my order|awb|shipment|not received|delivered/)) {
    const num = input.match(/RC-?\s?(\d{6})/i);
    return { text: num ? `You can see live status and tracking for RC-${num[1]} in your account, or via the link in your confirmation email.` : "Sign in with the email you ordered with to see every order and its tracking. Your confirmation email also has a direct link.", links: [{ label: "My orders", href: "/account" }] };
  }
  if (has(/cod|cash on delivery|pay on delivery/)) return { text: s.codEnabled ? `Yes, Cash on Delivery is available on most pincodes${s.codFee ? ` (${inr(s.codFee)} COD fee)` : ""}. Check your pincode on any product page.` : "Right now we accept online payments only (UPI, cards, netbanking)." };
  if (has(/ship|deliver|dispatch|how long|when will|courier|pincode/)) return { text: `Orders dispatch within 1–2 working days and usually arrive in 2–7 days depending on your city. Shipping is free above ${inr(s.freeShippingAt)}, otherwise ${inr(s.shippingFee)}. Enter your pincode on a product page for an exact estimate.`, chips: ["Delivery & COD", "Track my order"] };
  if (has(/return|refund|exchange|cancel|damaged|wrong item/)) return { text: "Sorry if something isn't right. For damaged or wrong items, contact us within 48 hours of delivery with a photo and we'll replace or refund. Opened supplements can't be returned for hygiene reasons.", links: [{ label: "Refund policy", href: "/policies/refund" }, { label: "Contact us", href: whatsapp }] };
  if (has(/pay|upi|card|emi|netbank|razorpay/)) return { text: "You can pay by UPI, cards, netbanking or wallets via Razorpay (secure), or Cash on Delivery where available." };
  if (has(/discount|coupon|offer|promo|code|sale/)) return { text: "Every product shows its current saving, and 3- or 12-month supplies save up to 40%. Have a code? Apply it at checkout.", links: [{ label: "Shop 3-in-1 packs", href: "/shop/packs" }] };
  if (has(/how (to|do i) (take|use)|dosage|dose|when to take|how many|empty stomach/)) return { text: "Follow the dose on the label, usually with a meal, at the same time each day. Give it 8–12 weeks of consistent use to judge results. If you take medication, check with your doctor first." };
  if (has(/vegan|vegetarian|veg\b|gelatin|halal/)) return { text: "Most of our formulas are vegetarian (plant collagen, cellulose capsules). Omega-3 Fish Oil is not vegetarian. Each product page lists its ingredients." };
  if (has(/doctor|clinic|consult|appointment|manu bora/)) return { text: "Our formulas are designed by Dr. Manu Bora, orthopaedic and sports-medicine surgeon. You can book a consultation with the clinic team for a personal plan.", links: [{ label: "Book a consultation", href: "/clinic" }] };
  if (has(/human|agent|call|whatsapp|contact|support|talk to/)) return { text: "Sure, our team is on WhatsApp, Mon–Sat, 10am–7pm.", links: [{ label: "Chat on WhatsApp", href: whatsapp }] };
  if (has(/help me choose|recommend|suggest|which (one|product)|what should i|not sure|confused|quiz|stack/)) return { text: "Tell me what you'd like to improve (e.g. joints, energy, sleep, skin), or take the 60-second quiz for a personalised stack with reasons for every pick.", chips: ["Joint pain", "Low energy", "Poor sleep", "Ageing skin", "Gut health"], links: [{ label: "Take the quiz", href: "/stack-builder" }] };

  // Concern → curated picks
  const concern = CONCERNS.find((c) => c.re.test(q));
  if (concern) {
    const picks = concern.heroes.map((h) => items.find((i) => i.handle === h && i.available)).filter((x): x is SearchItem => !!x).slice(0, 3);
    const products = picks.length ? picks : search(items.filter((i) => i.available), concern.label, 3);
    return { text: `For ${concern.label}, these are Dr. Bora's go-to formulas. For a stack tailored to you, try the quiz.`, products, links: [{ label: `Shop ${concern.label}`, href: concern.href }, { label: "Take the quiz", href: "/stack-builder" }] };
  }

  // Product / ingredient lookup
  const hits = search(items, input, 3);
  if (hits.length) return { text: hits.length === 1 ? `Here's ${hits[0].title}:` : "Here's what I found:", products: hits };

  return { text: "I'm not sure I understood. I can help with choosing a formula, delivery, COD, returns and order tracking.", chips: START_CHIPS };
}
