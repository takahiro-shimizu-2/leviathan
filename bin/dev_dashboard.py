#!/usr/bin/env python3
import os
import re
import json
from wsgiref.simple_server import make_server
from urllib.parse import parse_qs

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def _runs_base_dir():
    alt_runs = os.path.join(ROOT, 'runs')
    agi_runs = os.path.join(ROOT, 'src', 'agi_poc', 'runs')
    return alt_runs if os.path.isdir(alt_runs) else agi_runs


def _scan_cost_from_log(log_path: str) -> float:
    try:
        with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = f.read()
    except Exception:
        return 0.0
    m = re.search(r"cost_usd\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)", text, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except Exception:
            pass
    dollars = re.findall(r"(?:total\s+)?cost[^\n$]*\$\s*([0-9]+(?:\.[0-9]+)?)", text, re.IGNORECASE)
    if dollars:
        try:
            return float(dollars[-1])
        except Exception:
            pass
    dollars = re.findall(r"\$\s*([0-9]+(?:\.[0-9]+)?)", text)
    if dollars:
        try:
            return float(dollars[-1])
        except Exception:
            pass
    return 0.0


def _parse_validation(vpath: str):
    try:
        with open(vpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        return (None, None)
    if isinstance(data, dict):
        if isinstance(data.get('ok'), bool):
            return (data['ok'], data)
        if isinstance(data.get('checks'), list):
            oks = [bool(c.get('ok')) for c in data['checks'] if isinstance(c, dict) and 'ok' in c]
            if oks:
                return (all(oks), data)
    return (None, data if isinstance(data, dict) else None)


def summarize_run(run_id: str) -> dict:
    base = os.path.join(_runs_base_dir(), run_id)
    log_path = os.path.join(base, 'langstack.txt')
    vpath = os.path.join(base, 'validation.json')
    demo_path = os.path.join(base, 'demo', 'index.html')
    spec_path = os.path.join(base, 'SPEC.md')
    ok = None
    phase = ''
    validation = ''
    if os.path.exists(vpath):
        ok, _ = _parse_validation(vpath)
    if ok is None and os.path.exists(demo_path):
        ok = True
    if os.path.exists(log_path):
        try:
            with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
        except Exception:
            lines = []
        key_map = [
            ('validated', 'validated'),
            ('executed', 'executed'),
            ('planned', 'planned'),
            ('intent', 'intent_detected'),
        ]
        for ln in reversed(lines[-300:]):
            low = ln.lower()
            if 'approved' in low:
                validation = 'approved'
            elif 'changes_requested' in low or 'changes requested' in low:
                validation = 'changes_requested'
            for pat, ph in key_map:
                if pat in low:
                    phase = ph
                    break
            if phase:
                break
        if ok is None:
            tail = ''.join(lines[-400:]).lower() if lines else ''
            if any(b in tail for b in ['traceback', 'error', 'exception']):
                ok = False
    cost = _scan_cost_from_log(log_path) if os.path.exists(log_path) else 0.0
    return {
        'run_id': run_id,
        'phase': phase,
        'validation': validation,
        'ok': bool(ok) if isinstance(ok, bool) else False,
        'cost_usd': round(cost, 4),
        'spec_exists': os.path.exists(spec_path),
        'log_exists': os.path.exists(log_path),
        'demo_exists': os.path.exists(demo_path),
    }


def compute_metrics(limit: int = 20) -> dict:
    base = _runs_base_dir()
    if not os.path.isdir(base):
        return {'active_run_id': '', 'phase': '', 'failure_rate': 0.0, 'total_cost_usd': 0.0, 'runs': []}
    entries = []
    for name in os.listdir(base):
        p = os.path.join(base, name)
        try:
            st = os.stat(p)
            if os.path.isdir(p):
                entries.append((st.st_mtime, name))
        except Exception:
            pass
    entries.sort(reverse=True)
    run_ids = [name for _, name in entries[:limit]]
    summaries = [summarize_run(rid) for rid in run_ids]
    decided = [s for s in summaries if isinstance(s.get('ok'), bool)]
    fails = sum(1 for s in decided if not s['ok'])
    denom = len(decided) or 1
    failure_rate = fails / denom
    total_cost = sum(float(s.get('cost_usd') or 0.0) for s in summaries)
    active = summaries[0] if summaries else None
    return {
        'active_run_id': active['run_id'] if active else '',
        'phase': active['phase'] if active else '',
        'failure_rate': round(failure_rate, 4),
        'total_cost_usd': round(total_cost, 4),
        'runs': summaries,
    }


from string import Template


def render_html(body: str, title: str = 'Dev Dashboard') -> bytes:
    tpl = Template("""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>$title</title>
  <style>
    :root { --bg:#0f1026; --panel:#14163a; --border:#292c6b; --text:#e7e8ff; --muted:#a8a9d8; --ok:#3dd68c; --err:#f25f7c; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin:0; padding:0; background:radial-gradient(1200px 700px at 50% -10%, rgba(120,105,255,0.18), transparent 55%), var(--bg); color:var(--text); }
    header { position:sticky; top:0; background:#1a1d52; border-bottom:1px solid var(--border); padding:12px 20px; color:#fff; font-weight:650; letter-spacing:.2px; display:flex; align-items:center; justify-content:space-between; }
    header .small { font-weight:500; color:#d0d2ff; margin-left:10px; }
    header nav a { color:#e7e8ff; text-decoration:none; margin-left:16px; font-weight:600; }
    header nav a:hover { text-decoration:underline; }
    .wrap { padding:24px; }
    .frame { max-width: 960px; margin:0 auto; background:linear-gradient(180deg, rgba(38,40,110,0.35), rgba(22,24,70,0.6)), var(--panel); border:1px solid var(--border); border-radius:12px; padding:16px; box-shadow: 0 0 0 1px rgba(138,139,255,0.08) inset, 0 0 60px rgba(120,105,255,0.12); }
    .label { font-size:14px; color:var(--muted); margin-bottom:8px; }
    .row { margin:12px 0; }
    .ok { color:var(--ok); font-weight:600; }
    .err { color:var(--err); font-weight:600; }
    table { width:100%; border-collapse: collapse; }
    th,td { padding:6px; border-bottom:1px solid var(--border); text-align:left; }
    code { background:#10123a; padding:2px 6px; border-radius:6px; border:1px solid var(--border); }
  </style>
</head>
<body>
<header>
  <div>DEVELOPER DASHBOARD <span class="small">LOCAL ONLY</span></div>
  <nav>
    <a href="/">Home</a>
    <a href="/whoami" target="_blank">whoami</a>
    <a href="#" onclick="location.reload();return false;">Refresh</a>
  </nav>
</header>
<div class="wrap">
$body
</div>
<!-- Manual refresh only (use the header Refresh link) -->
</body>
</html>""")
    return tpl.substitute(title=title, body=body).encode('utf-8')


def page_index(environ=None):
    stats = compute_metrics(limit=20)
    port = ''
    try:
        if environ and isinstance(environ, dict):
            port = environ.get('SERVER_PORT') or ''
    except Exception:
        port = ''
    h = []
    h.append('<div class="frame">')
    h.append('<div class="label">Developer Dashboard (Local) {}{}</div>'.format(
        '(port ' if port else '', (str(port)+')') if port else ''))
    h.append('<div class="row">Active Run: <code>{}</code></div>'.format(stats.get('active_run_id','-')))
    h.append('<div class="row">Phase: <span class="ok">{}</span></div>'.format(stats.get('phase','-') or '-'))
    h.append('<div class="row">Failure Rate: <strong>{:.1f}%</strong></div>'.format((stats.get('failure_rate') or 0)*100))
    h.append('<div class="row">Total Cost (recent): ${:.4f}</div>'.format(stats.get('total_cost_usd') or 0.0))
    # Table
    rows = ['<tr><th>Run ID</th><th>Phase</th><th>OK</th><th>Cost</th></tr>']
    for s in stats.get('runs', []):
        rows.append('<tr><td><code>{}</code></td><td>{}</td><td>{}</td><td>${:.4f}</td></tr>'.format(
            s.get('run_id',''), s.get('phase',''), 'ok' if s.get('ok') else 'ng', float(s.get('cost_usd') or 0)))
    h.append('<div class="row"><div class="label">Recent Runs</div><table>{}</table></div>'.format(''.join(rows)))
    h.append('</div>')
    return render_html('\n'.join(h))


def app(environ, start_response):
    method = environ.get('REQUEST_METHOD', 'GET').upper()
    path = environ.get('PATH_INFO', '/')
    if method == 'GET' and path == '/':
        start_response('200 OK', [('Content-Type', 'text/html; charset=utf-8')])
        return [page_index(environ)]
    if method == 'GET' and path == '/whoami':
        start_response('200 OK', [('Content-Type', 'text/plain; charset=utf-8')])
        return [b'dev_dashboard']
    if method == 'GET' and path == '/stats':
        start_response('200 OK', [('Content-Type', 'application/json')])
        return [json.dumps(compute_metrics(limit=20)).encode('utf-8')]
    start_response('404 Not Found', [('Content-Type', 'text/plain; charset=utf-8')])
    return [b'Not Found']


def main():
    port = int(os.environ.get('DEV_DASHBOARD_PORT', '8010'))
    with make_server('127.0.0.1', port, app) as httpd:
        print(f"Dev dashboard on http://127.0.0.1:{port}")
        httpd.serve_forever()


if __name__ == '__main__':
    main()
