# Madar OS, public demo

Live at **https://tsb-os-demo.vercel.app**

Madar OS is an AI operating system for a company: a bench of specialist roles under
one coordinator, a memory graph of the business, runtime search across a large skill
library, and a permission ring that stops anything irreversible until the owner
approves it. It is a [TSB Labs](https://tsb-labs-portfolio.vercel.app) product.

This repository is the **public demo site only**. The operating system itself is a
private repository.

## What is in here

| Page | What it does |
|---|---|
| `index.html` | What Madar OS is, how a command runs, the plans |
| `os.html` | A scripted walkthrough of the interface. Four commands, each showing the context it pulled, the skills it searched, and the approval it waited for |
| `start.html` | A wizard that lets a visitor sketch the shape of their own deployment |
| `api/lead.js` | Serverless handler that files an enquiry |

## The demo is scripted, deliberately

Every company, person and number in `os.html` is fictional, and the page says so at
the top. A real deployment runs on a real business, and we would rather show a
convincing walkthrough than pretend a stranger's data is already loaded.

The one thing that is not fictional is the claim about how it behaves. The stream
naming what it is touching, the departments sitting a written examination before they
work, the doctor process and the rehearsed restore are all things the real system
does. The [case studies](https://tsb-labs-portfolio.vercel.app/case-studies.html)
carry the measurements, including the parts that are not yet proven.

## House rules for anyone editing this

- **No em dashes or en dashes.** Anywhere, in any copy.
- Void and copper. Never AI Founder Hub's volt, never DevMate's red.
- No invented clients, no invented testimonials, no numbers that are not measured.

## Running it locally

Static HTML, no build step.

```bash
python3 -m http.server 4190
```

Deploy is Vercel from disk:

```bash
npx vercel deploy --prod --yes --archive=tgz --scope akenterpriseom-5926s-projects
```
