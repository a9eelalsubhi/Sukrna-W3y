"""Second copy of the site at /dw/ with the درهم وقاية logo beside the UQU College of Medicine logo.
The main site (index.html) is left untouched. Run after building index.html:  py src/make_dw.py"""
import os, re, subprocess
here = os.path.dirname(os.path.abspath(__file__)); site = os.path.dirname(here)
BASE = "https://a9eelalsubhi.github.io/Sukrna-W3y/"
os.makedirs(os.path.join(site, "dw"), exist_ok=True)

def relink(html):
    # everything under assets/ now lives one level up
    return re.sub(r'(?<=["\'(])assets/', "../assets/", html)

UQU = '<img src="assets/logos/uqu-med-white.png" alt="جامعة أم القرى، كلية الطب">'
DW = '<span class="sep"></span><img class="dw" src="assets/logos/derham-white.png" alt="جمعية درهم وقاية">'
CSS = (".partners img.dw{height:74px}body.portrait .partners img.dw{height:60px}"
       ".byline{margin-top:14px;font-size:17px;color:#C2C9E6}.byline b{color:#fff;font-weight:700}")
SRC_END = "(ADA).</div>"
BYLINE = '<div class="byline">إعداد: <b>أصيل الصبحي</b></div>'

h = open(os.path.join(site, "index.html"), encoding="utf8").read()
assert h.count(UQU) == 1, "partners block changed"
assert h.count(SRC_END) == 1, "last-slide sources line changed"
h = h.replace(UQU, UQU + DW).replace("</style>", CSS + "</style>", 1).replace(SRC_END, SRC_END + BYLINE)
h = h.replace(f'content="{BASE}"', f'content="{BASE}dw/"').replace(f"{BASE}og.jpg", f"{BASE}dw/og.jpg")
open(os.path.join(site, "dw", "index.html"), "w", encoding="utf8").write(relink(h))

# link preview with both logos
o = open(os.path.join(site, "og.html"), encoding="utf8").read()
o = o.replace('<img class="uqu" src="assets/logos/uqu-med-white.png" alt="جامعة أم القرى، كلية الطب">',
              '<div class="uqu"><img src="assets/logos/uqu-med-white.png" alt=""><i></i><img class="dw" src="assets/logos/derham-white.png" alt=""></div>')
o = o.replace(".uqu{position:absolute;right:76px;top:48px;height:104px}",
              ".uqu{position:absolute;right:76px;top:48px;display:flex;align-items:center;gap:24px}.uqu img{height:104px}.uqu img.dw{height:80px}"
              ".uqu i{width:1px;height:56px;background:rgba(255,255,255,.25)}")
o = relink(o)
p = os.path.join(site, "dw", "og.html"); open(p, "w", encoding="utf8").write(o)
chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe"
subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                f"--user-data-dir={os.path.join(os.environ.get('TEMP', here), 'dw_prof')}", "--window-size=1200,630",
                "--virtual-time-budget=3000", f"--screenshot={os.path.join(site, 'dw', 'og.png')}", "file:///" + p.replace("\\", "/")], capture_output=True)
from PIL import Image
Image.open(os.path.join(site, "dw", "og.png")).convert("RGB").save(os.path.join(site, "dw", "og.jpg"), quality=90)
os.remove(os.path.join(site, "dw", "og.png"))
print("dw/index.html + dw/og.jpg")
