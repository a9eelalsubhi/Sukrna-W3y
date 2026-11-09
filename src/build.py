import json, os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
P = json.load(open(os.path.join(here, "logo-parts.json"), encoding="utf8"))
r = lambda n: open(os.path.join(here, n), encoding="utf8").read()
cover = f'''<svg id="coverLogo" viewBox="28 50 520 330" role="img" aria-label="شعار سكّرنا وعي">
<defs><mask id="cvM" maskUnits="userSpaceOnUse" x="-100" y="-100" width="800" height="600"><rect x="-100" y="-100" width="800" height="600" fill="#fff"/>
<g clip-path="url(#cvClip)"><path d="{P["WM"]}" stroke="#000" stroke-width="16" stroke-linejoin="round"/></g><path id="cvDropMask" d="{P["DROP"]}" stroke="#000" stroke-width="0" stroke-linejoin="round"/></mask>
<clipPath id="cvClip" clipPathUnits="userSpaceOnUse"><rect id="cvWipe" x="560" y="0" width="0" height="500"/></clipPath></defs>
<g mask="url(#cvM)"><g transform="{P["PT"]}">
<path id="cvOut" d="{P["OUT"]}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" stroke="#fff" stroke-width="{P["SW"]}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path id="cvDuo" d="{P["DUO"]}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1" stroke="#fff" stroke-width="{P["SW"]}" stroke-linecap="round" fill="none"/></g></g>
<g clip-path="url(#cvClip)"><path id="cvWm" d="{P["WM"]}" fill="#fff"/></g>
<path id="cvDrop" d="{P["DROP"]}" fill="#CC338B" style="opacity:0"/>
<path id="cvTag" d="{P["TAG"]}" fill="#fff" style="opacity:0"/></svg>'''
slides = r("slides.html").replace("{{COVERLOGO}}", cover).replace("{{ROOM}}", r("room.svg")).replace("{{BODY}}", r("body.svg"))
out = r("template.html").replace("{{SLIDES}}", slides).replace("{{SCRIPT}}", "const PANC_OUT=" + json.dumps(P["OUT"]) + ", PANC_DUO=" + json.dumps(P["DUO"]) + ";" + chr(10) + r("script.js"))
open(os.path.join(root, "index.html"), "w", encoding="utf8").write(out)
print("index.html", len(out))
