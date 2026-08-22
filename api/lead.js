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
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!r.ok) {
    res.status(502).json({ error: "could not file the lead" });
    return;
  }
  res.status(200).json({ ok: true });
}
