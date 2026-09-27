/**
 * Seed the RFQ inbox with realistic demo enquiries.
 *   node scripts/seed.mjs [baseUrl] [adminPassword]
 *
 * Posts through the real API so validation, scoring and the audit trail all
 * run exactly as they would for a live buyer.
 */
const BASE = process.argv[2] ?? "http://localhost:3100";
const PW = process.argv[3] ?? "tiruppur2026";

const RFQS = [
  {
    name: "Priya Raman", organisation: "Sunrise Matriculation School",
    phone: "+91 98765 43210", email: "priya@example.com", city: "Coimbatore",
    buyerType: "School or college", requiredBy: "2026-11-15",
    notes: "Annual sports day, four house colours. Repeat of last year's order — same shades if possible.",
    lines: [
      { product: "tee", fabric: "single-jersey", decoration: "screen", positions: 2, colour: "Red",
        sizes: { XS: 20, S: 60, M: 70, L: 50, XL: 20 }, qty: 220, est_low: 196, est_high: 240 },
      { product: "polo", fabric: "pique", decoration: "embroidery", positions: 1, colour: "Navy",
        sizes: { M: 12, L: 16, XL: 8 }, qty: 36, est_low: 286, est_high: 350 },
    ],
    advance: ["contacted:Called, sending rate today", "quoted:Rate sent on WhatsApp", "in_production:Fabric in, cutting started"],
  },
  {
    name: "Arun Kumar", organisation: "Kovai Strikers CC",
    phone: "9445566778", city: "Tiruppur", buyerType: "Sports team or club",
    requiredBy: "2026-10-20",
    notes: "Tournament kit. Names and numbers on back, sponsor logo on chest.",
    lines: [
      { product: "jersey", fabric: "performance-poly", decoration: "sublimation", positions: 3, colour: "Navy",
        sizes: { M: 6, L: 8, XL: 4 }, qty: 18, est_low: 330, est_high: 403 },
    ],
    advance: ["contacted:Asked for artwork in vector"],
  },
  {
    name: "Meera Nair", organisation: "Anvaya Interiors",
    phone: "9812340099", email: "meera@example.com", city: "Kochi",
    buyerType: "Company / corporate", requiredBy: "2026-10-30",
    notes: "Office team. Brand colour match needed against our identity guide.",
    lines: [
      { product: "polo", fabric: "pique", decoration: "embroidery", positions: 2, colour: "Bottle green",
        sizes: { S: 8, M: 22, L: 26, XL: 18, "2XL": 6 }, qty: 80, est_low: 298, est_high: 364 },
    ],
    advance: ["contacted:Shared pique swatches", "quoted:Rate + 2 colour options sent", "sampling:Sample dispatched"],
  },
  {
    name: "Vignesh S", organisation: "", phone: "9003344556", city: "Salem",
    buyerType: "Event organiser", notes: "Marathon, 5k and 10k. Need a rate before we confirm the date.",
    lines: [
      { product: "tee", fabric: "performance-poly", decoration: "dtf", positions: 2, colour: "Sky",
        sizes: { S: 40, M: 120, L: 130, XL: 80, "2XL": 30 }, qty: 400, est_low: 168, est_high: 206 },
    ],
    advance: [],
  },
  {
    name: "Fathima Begum", organisation: "Loom & Ledger",
    phone: "9776655443", email: "hello@example.com", city: "Bengaluru",
    buyerType: "Brand / private label", requiredBy: "2026-12-01",
    notes: "First production run for our label. Woven neck label and hang tag artwork ready.",
    lines: [
      { product: "hoodie", fabric: "loop-knit", decoration: "embroidery", positions: 1, colour: "Sand",
        sizes: { S: 15, M: 35, L: 35, XL: 20, "2XL": 5 }, qty: 110, est_low: 612, est_high: 748 },
      { product: "tee", fabric: "interlock", decoration: "dtg", positions: 1, colour: "Black",
        sizes: { S: 20, M: 40, L: 40, XL: 25 }, qty: 125, est_low: 262, est_high: 320 },
    ],
    advance: ["contacted:Discussed trims lead time"],
  },
  {
    name: "Ramesh Pillai", organisation: "Velan Logistics",
    phone: "9334455667", city: "Madurai", buyerType: "Company / corporate",
    notes: "Delivery staff. Needs to survive daily washing.",
    lines: [
      { product: "workwear", fabric: "interlock", decoration: "screen", positions: 2, colour: "Grey melange",
        sizes: { M: 30, L: 45, XL: 35, "2XL": 15, "3XL": 5 }, qty: 130, est_low: 214, est_high: 262 },
    ],
    advance: ["contacted:", "quoted:Rate sent", "lost:Went with a local supplier on price"],
  },
  {
    name: "Ananya Desai", organisation: "Crescent College of Engineering",
    phone: "9665544332", email: "culturals@example.com", city: "Chennai",
    buyerType: "School or college", requiredBy: "2026-11-05",
    notes: "Culturals fest. Department-wise colours, six departments.",
    lines: [
      { product: "tee", fabric: "single-jersey", decoration: "dtf", positions: 2, colour: "Royal blue",
        sizes: { XS: 15, S: 55, M: 85, L: 70, XL: 35, "2XL": 10 }, qty: 270, est_low: 182, est_high: 222 },
    ],
    advance: ["contacted:Waiting on final department counts"],
  },
  {
    name: "Karthik R", organisation: "Thread Theory", phone: "9556677889",
    email: "karthik@example.com", city: "Hyderabad", buyerType: "Retailer / reseller",
    notes: "Testing a small run before committing to a season.",
    lines: [
      { product: "tee", fabric: "interlock", decoration: "none", positions: 1, colour: "White",
        sizes: { S: 6, M: 10, L: 10, XL: 4 }, qty: 30, est_low: 236, est_high: 288 },
    ],
    advance: [],
  },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Seeding ${BASE}\n`);

  const login = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: PW }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
  if (!login.ok) { console.error("Admin login failed"); process.exit(1); }

  let n = 0;
  for (const r of RFQS) {
    const { advance, ...payload } = r;
    const res = await fetch(`${BASE}/api/rfq`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.0.${++n}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { console.error(`  ✗ ${r.name}: ${json.error}`); continue; }
    console.log(`  ✓ ${json.ref}  ${r.name.padEnd(18)} ${String(payload.lines.reduce((a, l) => a + l.qty, 0)).padStart(4)} pcs  [${json.priority}]`);

    for (const step of advance) {
      const [status, note] = step.split(":");
      await wait(15);
      await fetch(`${BASE}/api/admin/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie },
        body: JSON.stringify({ ref: json.ref, status, note: note ?? "" }),
      });
    }
  }
  // Two aged/unactioned enquiries so the triage panel has something to show.
  await fetch(`${BASE}/api/rfq`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.99" },
    body: JSON.stringify({
      name: "Suresh Menon", organisation: "Trivandrum Sports Council",
      phone: "9887766554", email: "suresh@example.com", city: "Trivandrum",
      buyerType: "School or college", requiredBy: "2026-12-10",
      notes: "State-level meet. Twelve teams, distinct colours per team.",
      lines: [{ product: "jersey", fabric: "performance-poly", decoration: "sublimation",
        positions: 3, colour: "Mixed", sizes: { S: 120, M: 280, L: 300, XL: 200, "2XL": 60 },
        qty: 960, est_low: 318, est_high: 388 }],
    }),
  });
  console.log("  ✓ high-value enquiry left unactioned (feeds the triage panel)");

  console.log("\nDone. Open /admin — password:", PW);
}

main();
