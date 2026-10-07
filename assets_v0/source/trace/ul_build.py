import json, os, sys, shutil
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ul_render import render
OUT = sys.argv[3]; GEO = sys.argv[1]; SRC = sys.argv[2]
geo = json.load(open(GEO))
# ---- colours (measured from the supplied logo; change GOLD here to switch to palette #D89B46) ----
GOLD = "#CAA16D"; SILVER = "#D9D9D9"; WHITE = "#FFFFFF"; BLACK = "#1E1E1E"; DEEP = "#111111"
G = {k: [c["segs"] for c in geo["contours"] if c["group"] == k] for k in ["ul", "brackets", "ultima", "linha"]}
BB = {"ul": (129.02, 261.94, 410.27, 431.38), "brackets": (450.27, 262.70, 794.24, 429.96),
      "ultima": (165.64, 522.57, 477.47, 600.51), "linha": (512.70, 540.42, 766.35, 599.89)}
SCHEMES = {
    "dark":  dict(ul=SILVER, brackets=GOLD, ultima=WHITE, linha=GOLD),
    "light": dict(ul=BLACK, brackets=GOLD, ultima=BLACK, linha=GOLD),
    "white": dict(ul=WHITE, brackets=WHITE, ultima=WHITE, linha=WHITE),
    "black": dict(ul=BLACK, brackets=BLACK, ultima=BLACK, linha=BLACK),
}
def xf(segs, dx, dy, s):
    o = []
    for q in segs:
        k = q[0]; v = q[1:]
        o.append([k] + [ (v[i]*s + (dx if i % 2 == 0 else dy)) for i in range(len(v))])
    return o
def place(groups, scheme, dx, dy, s):
    """groups -> list of (segs_list, colour) after transform p' = p*s + d"""
    return [([xf(c, dx, dy, s) for c in G[g]], SCHEMES[scheme][g]) if True else None for g in groups]
def bbox_of(groups):
    return (min(BB[g][0] for g in groups), min(BB[g][1] for g in groups), max(BB[g][2] for g in groups), max(BB[g][3] for g in groups))
def svg_doc(W, H, layers, bg=None, rx=0, title=""):
    p = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" width="%g" height="%g" role="img" aria-label="%s">' % (W, H, W, H, title)]
    if bg: p.append('<rect width="%g" height="%g" rx="%g" fill="%s"/>' % (W, H, rx, bg))
    for contours, col in layers:
        d = ""
        for segs in contours:
            for q in segs:
                k = q[0]
                if k == "Z": d += "Z"
                else: d += k + " ".join("%.2f" % x for x in q[1:])
        p.append('<path fill="%s" fill-rule="evenodd" d="%s"/>' % (col, d))
    p.append("</svg>")
    return "\n".join(p)
def layout(groups, scheme, W, H, scale, off=(0, 0)):
    """centre the bbox of `groups` in WxH at `scale`."""
    x0, y0, x1, y1 = bbox_of(groups)
    dx = (W - (x1 - x0) * scale) / 2 - x0 * scale + off[0]
    dy = (H - (y1 - y0) * scale) / 2 - y0 * scale + off[1]
    return place(groups, scheme, dx, dy, scale)
def save(rel, W, H, layers, bg=None, rx=0, png=True, svg=True, title="Última Linha", png_sizes=None, opaque=False):
    path = os.path.join(OUT, rel); os.makedirs(os.path.dirname(path), exist_ok=True)
    if svg: open(path + ".svg", "w").write(svg_doc(W, H, layers, bg, rx, title))
    for (pw, ph) in (png_sizes or ([(W, H)] if png else [])):
        k = pw / W
        ls = [([xf(c, 0, 0, 1) for c in cs], col) for cs, col in layers]
        arr = render(ls, pw, ph, (0, 0, W, H), bg=bg if opaque else None)
        if opaque: arr = np.dstack([arr[:, :, :3], np.full((ph, pw), 255, np.uint8)])
        Image.fromarray(arr, "RGBA").save(path + ("-%dx%d" % (pw, ph) if png_sizes else "") + ".png")
os.makedirs(OUT, exist_ok=True)
ALL = ["ul", "brackets", "ultima", "linha"]; MARK = ["ul", "brackets"]; WORD = ["ultima", "linha"]
# primary lockup
x0, y0, x1, y1 = bbox_of(ALL); PAD = 40
PW, PH = int(round(x1 - x0 + 2 * PAD)), int(round(y1 - y0 + 2 * PAD))
for sch in SCHEMES:
    bg = BLACK if sch in ("dark", "white") else None
    layers = layout(ALL, sch, PW, PH, 1.0)
    save("logo/ul-logo-primary-%s" % sch, PW, PH, layers, bg=bg, png=False, svg=True)
    for k in (1, 2):
        save("logo/ul-logo-primary-%s@%dx" % (sch, k), PW, PH, layers, bg=bg, svg=False, png_sizes=[(PW * k, PH * k)]) if False else None
# PNG exports (opaque dark for dark variant is NOT used: transparent everywhere so the file works on any background)
for sch in SCHEMES:
    layers = layout(ALL, sch, PW, PH, 1.0)
    path = os.path.join(OUT, "logo/ul-logo-primary-%s.svg" % sch)
    open(path, "w").write(svg_doc(PW, PH, layers, None, 0, "Última Linha"))
    for tw in (1600,):
        th = int(round(PH * tw / PW)); ls = layers
        arr = render(ls, tw, th, (0, 0, PW, PH), bg=None)
        Image.fromarray(arr, "RGBA").save(os.path.join(OUT, "logo/ul-logo-primary-%s-%d.png" % (sch, tw)))
# horizontal lockup (mark | wordmark), pieces unchanged, same scale
mx0, my0, mx1, my1 = bbox_of(MARK); wx0, wy0, wx1, wy1 = bbox_of(WORD)
GAP = 90; HP = 40
HW = int(round((mx1 - mx0) + GAP + (wx1 - wx0) + 2 * HP)); HH = int(round((my1 - my0) + 2 * HP))
for sch in ("dark", "light"):
    mk = place(MARK, sch, HP - mx0, HP - my0, 1.0)
    cy = HH / 2 - (wy0 + wy1) / 2 + 0  # vertically centre wordmark (accent included) on the mark
    wd = place(WORD, sch, HP + (mx1 - mx0) + GAP - wx0, cy, 1.0)
    layers = mk + wd
    open(os.path.join(OUT, "logo/ul-logo-horizontal-%s.svg" % sch), "w").write(svg_doc(HW, HH, layers, None, 0, "Última Linha"))
    tw = 2000; th = int(round(HH * tw / HW))
    Image.fromarray(render(layers, tw, th, (0, 0, HW, HH)), "RGBA").save(os.path.join(OUT, "logo/ul-logo-horizontal-%s-%d.png" % (sch, tw)))
# mark "UL </>"
MP = 30; MW = int(round(mx1 - mx0 + 2 * MP)); MH = int(round(my1 - my0 + 2 * MP))
for sch in ("dark", "light"):
    layers = layout(MARK, sch, MW, MH, 1.0)
    open(os.path.join(OUT, "logo/ul-mark-%s.svg" % sch), "w").write(svg_doc(MW, MH, layers, None, 0, "UL"))
    Image.fromarray(render(layers, 1400, int(round(MH * 1400 / MW)), (0, 0, MW, MH)), "RGBA").save(os.path.join(OUT, "logo/ul-mark-%s-1400.png" % sch))
# app icon: full mark on UL Black, mark width = 70 % of canvas
def app_layers(S_, scale_w=0.70, groups=MARK):
    bx0, by0, bx1, by1 = bbox_of(groups)
    return layout(groups, "dark", S_, S_, scale_w * S_ / (bx1 - bx0))
os.makedirs(os.path.join(OUT, "icons"), exist_ok=True)
L = app_layers(1024)
open(os.path.join(OUT, "icons/ul-app-icon.svg"), "w").write(svg_doc(1024, 1024, L, BLACK, 230, "Última Linha"))
for sz in (1024, 512, 192, 180):
    arr = render(app_layers(sz) if False else [([xf(c, 0, 0, 1) for c in cs], col) for cs, col in L], sz, sz, (0, 0, 1024, 1024), bg=BLACK)
    Image.fromarray(np.dstack([arr[:, :, :3], np.full((sz, sz), 255, np.uint8)]), "RGBA").save(os.path.join(OUT, "icons/ul-app-icon-%d.png" % sz))
# favicon: "UL" letters only (legible at 16 px), rounded square on UL Black
FL = layout(["ul"], "dark", 64, 64, 0.80 * 64 / (BB["ul"][2] - BB["ul"][0]))
os.makedirs(os.path.join(OUT, "favicon"), exist_ok=True)
open(os.path.join(OUT, "favicon/favicon.svg"), "w").write(svg_doc(64, 64, FL, BLACK, 12, "UL"))
fav = {}
for sz in (16, 32, 48, 180, 192, 512):
    fr = 12 / 64
    arr = render(FL, sz, sz, (0, 0, 64, 64), bg=BLACK)
    img = Image.fromarray(np.dstack([arr[:, :, :3], np.full((sz, sz), 255, np.uint8)]), "RGBA")
    if sz <= 48:
        m = Image.new("L", (sz * 8, sz * 8), 0)
        from PIL import ImageDraw
        ImageDraw.Draw(m).rounded_rectangle((0, 0, sz * 8 - 1, sz * 8 - 1), radius=int(sz * 8 * fr), fill=255)
        img.putalpha(m.resize((sz, sz), Image.LANCZOS))
    fav[sz] = img
    img.save(os.path.join(OUT, "favicon/favicon-%d.png" % sz))
fav[48].save(os.path.join(OUT, "favicon/favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[fav[16], fav[32]])
# OG 1200x630 flat Deep Black + primary lockup
os.makedirs(os.path.join(OUT, "social"), exist_ok=True)
OL = layout(ALL, "dark", 1200, 630, 300 / (y1 - y0))
open(os.path.join(OUT, "social/ul-og-1200x630.svg"), "w").write(svg_doc(1200, 630, OL, DEEP, 0, "Última Linha"))
arr = render(OL, 1200, 630, (0, 0, 1200, 630), bg=DEEP)
Image.fromarray(arr[:, :, :3], "RGB").save(os.path.join(OUT, "social/ul-og-1200x630.png"))
print("built", OUT)
