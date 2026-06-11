"""Minimal landing + login/signup page (placeholder until the Next.js/TypeScript frontend).

Single self-contained HTML string served at `/`. After login it stores the JWT in localStorage and shows
a small panel that calls the protected API with the token (catalog coverage + health). No build step.
"""

LANDING_HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AutoSentinx</title>
<style>
  :root { --bg:#0b0f1a; --card:#141a2b; --line:#26304a; --fg:#e6ecff; --muted:#8ea2c8; --accent:#4f7cff; --ok:#34d399; --bad:#f87171; }
  * { box-sizing:border-box; } body { margin:0; font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--fg); }
  .wrap { max-width:880px; margin:0 auto; padding:48px 20px; }
  .brand { font-size:30px; font-weight:800; letter-spacing:-.5px; } .brand span { color:var(--accent); }
  .tag { color:var(--muted); margin:6px 0 28px; max-width:620px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:22px; margin:16px 0; }
  .tabs { display:flex; gap:8px; margin-bottom:14px; } .tabs button { flex:1; }
  label { display:block; font-size:13px; color:var(--muted); margin:10px 0 4px; }
  input { width:100%; padding:11px 12px; border-radius:9px; border:1px solid var(--line); background:#0e1424; color:var(--fg); }
  button { padding:11px 14px; border-radius:9px; border:1px solid var(--line); background:#0e1424; color:var(--fg); cursor:pointer; font-weight:600; }
  button.primary { background:var(--accent); border-color:var(--accent); color:#fff; width:100%; margin-top:16px; }
  button.ghost.active { background:var(--accent); border-color:var(--accent); color:#fff; }
  .msg { min-height:20px; font-size:13px; margin-top:10px; } .err { color:var(--bad); } .ok { color:var(--ok); }
  .row { display:flex; gap:18px; flex-wrap:wrap; } .row > div { flex:1; min-width:200px; }
  .k { color:var(--muted); font-size:13px; } .v { font-size:22px; font-weight:700; }
  .hidden { display:none; } a { color:var(--accent); } code { background:#0e1424; padding:2px 6px; border-radius:6px; }
  .foot { color:var(--muted); font-size:12px; margin-top:26px; }
</style>
</head>
<body><div class="wrap">
  <div class="brand">Auto<span>Sentinx</span></div>
  <div class="tag">Autonomous black-box red-teaming for Indian NBFC Hindi/Hinglish voice AI agents —
     testing security <b>and</b> regulatory compliance (RBI · DPDP · TRAI), with full transcript evidence
     and a defensible coverage map.</div>

  <div id="authCard" class="card">
    <div class="tabs">
      <button class="ghost active" id="tabLogin" onclick="setMode('login')">Log in</button>
      <button class="ghost" id="tabSignup" onclick="setMode('signup')">Sign up</button>
    </div>
    <label>Email</label><input id="email" type="email" placeholder="you@company.com">
    <label>Password</label><input id="password" type="password" placeholder="••••••••">
    <button class="primary" id="submitBtn" onclick="submitAuth()">Log in</button>
    <div class="msg" id="msg"></div>
  </div>

  <div id="dash" class="card hidden">
    <div class="row" style="align-items:center">
      <div><div class="k">Signed in as</div><div class="v" id="who" style="font-size:16px"></div></div>
      <div style="flex:0"><button onclick="logout()">Log out</button></div>
    </div>
    <hr style="border-color:var(--line); margin:18px 0">
    <div class="row">
      <div><div class="k">Objectives in catalog</div><div class="v" id="mObj">–</div></div>
      <div><div class="k">Gradeable modes</div><div class="v" id="mGrade">–</div></div>
      <div><div class="k">Objective×technique pairs</div><div class="v" id="mPairs">–</div></div>
      <div><div class="k">Health</div><div class="v" id="mHealth">–</div></div>
    </div>
    <div class="foot">Explore the full API at <a href="/docs" target="_blank">/docs</a>
      (click <b>Authorize</b> and paste your token). Your token:<br><code id="tok" style="word-break:break-all"></code></div>
  </div>

  <div class="foot">© 2026 VipraTech Global · Proprietary &amp; confidential · the polished frontend ships in Next.js.</div>
</div>
<script>
  let mode = 'login';
  function setMode(m){ mode=m;
    document.getElementById('tabLogin').classList.toggle('active', m==='login');
    document.getElementById('tabSignup').classList.toggle('active', m==='signup');
    document.getElementById('submitBtn').textContent = m==='login' ? 'Log in' : 'Create account';
    document.getElementById('msg').textContent=''; }
  function msg(t, ok){ const e=document.getElementById('msg'); e.textContent=t; e.className='msg '+(ok?'ok':'err'); }
  async function submitAuth(){
    const email=document.getElementById('email').value.trim(), password=document.getElementById('password').value;
    if(!email||!password){ msg('Enter email and password'); return; }
    const path = mode==='login' ? '/auth/login' : '/auth/signup';
    try {
      const r = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const d = await r.json();
      if(!r.ok){ msg(d.detail||'Failed'); return; }
      localStorage.setItem('asx_token', d.access_token); localStorage.setItem('asx_email', d.email);
      showDash();
    } catch(e){ msg('Network error'); }
  }
  function logout(){ localStorage.removeItem('asx_token'); localStorage.removeItem('asx_email'); location.reload(); }
  async function api(path){ const t=localStorage.getItem('asx_token');
    const r=await fetch(path,{headers:{'Authorization':'Bearer '+t}}); if(!r.ok) throw new Error(r.status); return r.json(); }
  async function showDash(){
    document.getElementById('authCard').classList.add('hidden');
    document.getElementById('dash').classList.remove('hidden');
    document.getElementById('who').textContent = localStorage.getItem('asx_email');
    document.getElementById('tok').textContent = localStorage.getItem('asx_token');
    try { const c = await api('/catalog/coverage');
      document.getElementById('mObj').textContent = c.totals.objectives;
      document.getElementById('mGrade').textContent = c.totals.gradeable;
      document.getElementById('mPairs').textContent = c.totals.objective_technique_pairs; } catch(e){}
    try { const h = await api('/health'); document.getElementById('mHealth').textContent = h.ok ? 'OK' : 'degraded';
      document.getElementById('mHealth').style.color = h.ok ? 'var(--ok)' : 'var(--bad)'; } catch(e){}
  }
  if(localStorage.getItem('asx_token')) showDash();
</script>
</body></html>
"""
