// Madar OS demo — lead intake. Receives the wizard blueprint and files it
// into the Madar OS Leads base with Status "new". Madar's SDR loop on the
// founder's machine picks it up from there: briefs the founder by email,
// sends the lead a personalized booking reply, and advances the status.

const BASE = "appyBaUBJa7woDynv";
const TABLE = "tblMKgWCdWANoJKdG";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const b = req.body || {};
  const email = String(b.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "valid email required" });
    return;
  }
  const clip = (v, n) => String(v || "").slice(0, n);
  const fields = {
    Name: clip(b.name, 120) || "unknown",
    Email: email,
    Company: clip(b.company, 120),
    Industry: clip(b.industry, 120),
    Team: clip(b.team, 60),
    Geo: clip(b.geo, 120),
    Plan: clip(b.plan, 60),
    Departments: clip(b.departments, 600),
    Channels: clip(b.channels, 200),
    Pain: clip(b.pain, 1200),
    Profession: clip(b.profession, 120),
    Tools: clip(b.tools, 600),
    Infra: clip(b.infra, 40) || "not sure",
    Status: "new",
    Received: new Date().toISOString(),
  };
  // Airtable allows five requests a second per base and answers a burst with
  // 429. Without a retry a single unlucky second loses a real lead: the
  // prospect sees an error and we never learn they existed. Retry the
  // transient codes quickly, staying well inside the function timeout.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const post = () =>
    fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });

  let r;
  for (const wait of [400, 1200, 2500]) {
    try {
      r = await post();
    } catch {
      r = null;
    }
    if (r && r.ok) {
      res.status(200).json({ ok: true });
      return;
    }
    // Only 429 and 5xx are worth repeating. A 401 or a bad field name will
    // fail identically every time, so fall straight through to the error.
    if (r && r.status !== 429 && r.status < 500) break;
    await sleep(wait);
  }

  try {
    const detail = r ? `${r.status} ${(await r.text()).slice(0, 200)}` : "network";
    console.error("lead intake failed:", detail, "|", email, fields.Company);
  } catch {
    console.error("lead intake failed for", email);
  }
  // 502 tells the wizard to surface its email fallback, so the blueprint
  // still reaches a human even when the base is unreachable.
  res.status(502).json({ error: "could not file the lead" });
}
