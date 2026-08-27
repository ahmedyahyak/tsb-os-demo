/**
 * The redirect target for Instagram Business Login, and nothing more.
 *
 * Instagram requires an HTTPS redirect URI, and whether it accepts a localhost
 * one is inconsistent enough that betting the setup on it is not worth it. This
 * is a URL we already own and already serve over HTTPS.
 *
 * It deliberately does almost nothing. It does not hold the app secret, it does
 * not exchange the code, and it does not store anything. Meta hands it a
 * one hour, single use authorization code; it shows that code on screen and the
 * exchange happens on Ahmed's machine, where the secret lives. Putting the
 * secret in a Vercel environment variable would work and would mean the long
 * lived token is minted on a public server for a system that runs locally.
 *
 * A code on screen for an hour is a much smaller thing to protect than a
 * 60 day publishing token, so the blast radius here is deliberately tiny.
 */
export default function handler(req, res) {
  const code = typeof req.query.code === 'string' ? req.query.code : ''
  const error = typeof req.query.error_description === 'string' ? req.query.error_description : ''

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Nothing here should ever be indexed or cached.
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    )

  const body = error
    ? `<h1>Instagram said no</h1><p class="e">${esc(error)}</p>
       <p>Nothing was connected. Start the script again to retry.</p>`
    : code
      ? `<h1>Code received</h1>
         <p>Paste this back into the terminal. It is single use and expires in one hour.</p>
         <code id="c">${esc(code)}</code>
         <button onclick="navigator.clipboard.writeText(document.getElementById('c').textContent).then(()=>this.textContent='copied')">copy</button>
         <p class="n">Nothing was stored on this server. The token is minted on your machine.</p>`
      : `<h1>Nothing to do</h1><p>This page is the callback for Instagram Business Login.
         Open it from the connect script, not directly.</p>`

  res.status(error ? 400 : 200).send(`<!doctype html>
<meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Instagram connect</title>
<style>
  body{background:#06080C;color:#EAEEF6;font:15px/1.6 ui-monospace,Menlo,monospace;
    margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}
  main{max-width:640px}
  h1{font-size:20px;margin:0 0 12px}
  p{color:#8B95A8;margin:0 0 14px}
  .n{color:#7A8497;font-size:13px}
  .e{color:#E08585}
  code{display:block;word-break:break-all;background:#0D111A;border:1px solid rgba(155,193,224,.2);
    padding:14px;border-radius:8px;color:#F2926B;margin-bottom:12px}
  button{background:#F2926B;color:#06080C;border:0;border-radius:7px;padding:9px 16px;
    font:inherit;font-weight:600;cursor:pointer}
</style>
<main>${body}</main>`)
}
