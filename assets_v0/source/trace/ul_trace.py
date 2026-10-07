#!/usr/bin/env python3
"""Stage 1: trace the UL logo raster into clean vector geometry (JSON).

Method: per-component colour projection -> sub-pixel iso-contour (marching
squares on a 4x cubic upsample) -> corner detection -> straight runs become
exact lines (corners = intersection of fitted lines), curved runs become
least-squares cubic Beziers (Schneider). Output coordinates are in source
pixel units (origin at the top-left corner of the source image).

usage: ul_trace.py <source.png> <out.json>
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

SRC, OUT = sys.argv[1], sys.argv[2]

BG = np.array([30.0, 30.0, 30.0])
UP = 4            # upsample factor before iso-contouring
STEP = 0.4        # resample spacing along contours (source px)
CORNER_WIN = float(os.environ.get('CW', 2.2))  # px, arc length each side for the turn angle
CORNER_DEG = float(os.environ.get('CD', 40.0))
SIGMA_S = float(os.environ.get('SG', 2.0))   # smoothing (samples) for corner/line work
TRIM_PX = float(os.environ.get('TR', 2.5))   # px ignored around corners
SNAP = float(os.environ.get('SN', 7.0)); EPS_RDP = 0.35
MIN_LINE = 14.0
LINE_DEV = 0.5
CURVE_TOL = 0.35


def unit(v):
    n = float(np.hypot(v[0], v[1]))
    return v / n if n > 1e-12 else v


# ----------------------------------------------------------------- Schneider
def _t(t):
    return np.atleast_1d(np.asarray(t, float))[:, None]


def bez_pt(b, t):
    t = _t(t)
    m = 1 - t
    return m**3 * b[0] + 3 * m**2 * t * b[1] + 3 * m * t**2 * b[2] + t**3 * b[3]


def bez_d1(b, t):
    t = _t(t)
    m = 1 - t
    return 3 * m**2 * (b[1] - b[0]) + 6 * m * t * (b[2] - b[1]) + 3 * t**2 * (b[3] - b[2])


def bez_d2(b, t):
    t = _t(t)
    return 6 * (1 - t) * (b[2] - 2 * b[1] + b[0]) + 6 * t * (b[3] - 2 * b[2] + b[1])


def chord_param(pts):
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]
    return d / d[-1] if d[-1] > 0 else np.linspace(0, 1, len(pts))


def gen_bez(pts, u, t1, t2):
    u = np.asarray(u)
    b0, b1, b2, b3 = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u**2 * (1 - u), u**3
    a1 = t1[None, :] * b1[:, None]
    a2 = t2[None, :] * b2[:, None]
    tmp = pts - (pts[0] * (b0 + b1)[:, None] + pts[-1] * (b2 + b3)[:, None])
    c00, c01, c11 = np.sum(a1 * a1), np.sum(a1 * a2), np.sum(a2 * a2)
    x0, x1 = np.sum(a1 * tmp), np.sum(a2 * tmp)
    det = c00 * c11 - c01 * c01
    al = (x0 * c11 - x1 * c01) / det if abs(det) > 1e-12 else 0.0
    ar = (c00 * x1 - c01 * x0) / det if abs(det) > 1e-12 else 0.0
    seg = float(np.hypot(*(pts[0] - pts[-1])))
    if al < 1e-6 * seg or ar < 1e-6 * seg:
        al = ar = seg / 3.0
    return np.array([pts[0], pts[0] + t1 * al, pts[-1] + t2 * ar, pts[-1]])


def max_err(pts, b, u):
    d = np.sum((bez_pt(b, u) - pts) ** 2, axis=1)
    i = int(np.argmax(d))
    return float(d[i]), min(max(i, 1), len(pts) - 2)


def reparam(b, pts, u):
    d = bez_pt(b, u) - pts
    d1, d2 = bez_d1(b, u), bez_d2(b, u)
    num = np.sum(d * d1, axis=1)
    den = np.sum(d1 * d1, axis=1) + np.sum(d * d2, axis=1)
    out = np.where(np.abs(den) > 1e-12, u - num / np.where(den == 0, 1, den), u)
    return np.clip(out, 0, 1)


def fit_curve(pts, t1, t2, err2, depth=0):
    n = len(pts)
    if n == 2:
        d = float(np.hypot(*(pts[0] - pts[1]))) / 3.0
        return [np.array([pts[0], pts[0] + t1 * d, pts[1] + t2 * d, pts[1]])]
    u = chord_param(pts)
    b = gen_bez(pts, u, t1, t2)
    e, sp = max_err(pts, b, u)
    if e < err2:
        return [b]
    if e < err2 * 16:
        for _ in range(12):
            u2 = reparam(b, pts, u)
            b = gen_bez(pts, u2, t1, t2)
            e, sp = max_err(pts, b, u2)
            if e < err2:
                return [b]
            u = u2
    if n < 4 or depth > 12:
        return [b]
    ct = unit(pts[sp - 1] - pts[sp + 1])
    return fit_curve(pts[: sp + 1], t1, ct, err2, depth + 1) + fit_curve(pts[sp:], -ct, t2, err2, depth + 1)


# ------------------------------------------------------------------ helpers
def rdp_idx(pts, eps):
    n = len(pts)
    keep = np.zeros(n, bool)
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        p0, p1 = pts[i], pts[j]
        d = p1 - p0
        L = float(np.hypot(*d))
        seg = pts[i + 1 : j]
        if L < 1e-9:
            dist = np.linalg.norm(seg - p0, axis=1)
        else:
            dist = np.abs(d[0] * (seg[:, 1] - p0[1]) - d[1] * (seg[:, 0] - p0[0])) / L
        k = int(np.argmax(dist))
        if dist[k] > eps:
            m = i + 1 + k
            keep[m] = True
            stack += [(i, m), (m, j)]
    return np.where(keep)[0]


def resample_closed(P, step):
    if np.allclose(P[0], P[-1]):
        P = P[:-1]
    Q = np.vstack([P, P[:1]])
    seg = np.hypot(*np.diff(Q, axis=0).T)
    s = np.r_[0, np.cumsum(seg)]
    L = s[-1]
    n = max(int(round(L / step)), 24)
    t = np.linspace(0, L, n, endpoint=False)
    return np.stack([np.interp(t, s, Q[:, 0]), np.interp(t, s, Q[:, 1])], 1), L / n


def area(P):
    x, y = P[:, 0], P[:, 1]
    return 0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))


def fit_line(pts, ref):
    c = pts.mean(0)
    _, _, vt = np.linalg.svd(pts - c, full_matrices=False)
    d = vt[0]
    if np.dot(d, ref) < 0:
        d = -d
    return c, d


def intersect(l1, l2):
    (c1, d1), (c2, d2) = l1, l2
    A = np.array([d1, -d2]).T
    if abs(np.linalg.det(A)) < 1e-6:
        return None
    s, _ = np.linalg.solve(A, c2 - c1)
    return c1 + s * d1


def project(p, line):
    c, d = line
    return c + np.dot(p - c, d) * d


def find_corners(Ps, step):
    n = len(Ps)
    k = max(2, int(round(CORNER_WIN / step)))
    a = Ps - np.roll(Ps, k, axis=0)
    b = np.roll(Ps, -k, axis=0) - Ps
    cross = a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0]
    dot = np.sum(a * b, axis=1)
    aa = np.abs(np.degrees(np.arctan2(cross, dot)))
    above = aa > CORNER_DEG
    corners, run = [], []
    if above.any():
        i0 = int(np.argmin(aa))
        for t in range(n):
            i = (i0 + t) % n
            if above[i]:
                run.append(i)
            elif run:
                corners.append(run[int(np.argmax(aa[run]))])
                run = []
        if run:
            corners.append(run[int(np.argmax(aa[run]))])
    return sorted(set(corners))


# ------------------------------------------------------------ main pipeline
rgb = np.asarray(Image.open(SRC).convert("RGB"), dtype=float)
H, W, _ = rgb.shape
dist = np.linalg.norm(rgb - BG, axis=2)
mask = dist > 16
mask[:, 870:] = False   # stray artefact at the right edge of the source
mask[700:, :] = False   # url line + anything below the wordmark
n_lab, labels, stats, cents = cv2.connectedComponentsWithStats(mask.astype(np.uint8), connectivity=8)
comp_ids = [i for i in range(1, n_lab) if stats[i, cv2.CC_STAT_AREA] > 120]
print("components:", len(comp_ids))


def group_of(cx, cy):
    if cy < 450:
        return "ul" if cx < 430 else "brackets"
    return "ultima" if cx < 495 else "linha"


raw = []   # (group, P_resampled, step)
colors = {}
for cid in comp_ids:
    m = labels == cid
    ys, xs = np.where(m)
    y0, y1 = max(ys.min() - 8, 0), min(ys.max() + 9, H)
    x0, x1 = max(xs.min() - 8, 0), min(xs.max() + 9, W)
    sub, sm = rgb[y0:y1, x0:x1], m[y0:y1, x0:x1]
    d = np.linalg.norm(sub - BG, axis=2)
    strong = sm & (d >= np.percentile(d[sm], 80))
    fg = np.median(sub[strong], axis=0)
    v = fg - BG
    a = np.clip(((sub - BG) @ v) / (v @ v), 0, 1) * ndi.binary_dilation(sm, iterations=5)
    a = cv2.resize(a.astype(np.float32), None, fx=UP, fy=UP, interpolation=cv2.INTER_CUBIC)
    a = ndi.gaussian_filter(a, 1.2)
    ccx, ccy = cents[cid]
    colors.setdefault(group_of(ccx, ccy), []).append(fg)
    for C in measure.find_contours(a, 0.5):
        pts = np.stack([(C[:, 1] + 0.5) / UP + x0, (C[:, 0] + 0.5) / UP + y0], 1)
        if len(pts) < 20 or abs(area(pts[:-1] if np.allclose(pts[0], pts[-1]) else pts)) < 20:
            continue
        P, st = resample_closed(pts, STEP)
        bb = (P[:, 0].min(), P[:, 1].min(), P[:, 0].max(), P[:, 1].max())
        raw.append((group_of((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), P, st))

# orientation: outer contours positive area, holes negative (even-odd depth)
polys = [r[1].astype(np.float32).reshape(-1, 1, 2) for r in raw]
fixed = []
for i, (g, P, st) in enumerate(raw):
    depth = sum(1 for j, pj in enumerate(polys) if j != i and cv2.pointPolygonTest(pj, (float(P[0, 0]), float(P[0, 1])), False) > 0)
    want_pos = depth % 2 == 0
    if (area(P) > 0) != want_pos:
        P = P[::-1].copy()
    fixed.append((g, P, st, depth))

out_contours = []
for g, P, st, depth in fixed:
    n = len(P)
    Ps = ndi.gaussian_filter1d(P, sigma=SIGMA_S, axis=0, mode="wrap")
    bbx=(P[:,0].min(),P[:,1].min(),P[:,0].max(),P[:,1].max())
    if g=="linha" or (g=="ultima" and bbx[0]>200) or (g=="ultima" and (bbx[3]-bbx[1])<30):
        Pp = ndi.gaussian_filter1d(P, sigma=1.0, axis=0, mode="wrap")
        c0 = int(np.argmax(np.linalg.norm(Pp - Pp.mean(0), axis=1)))
        Q = np.roll(Pp, -c0, axis=0); Q = np.vstack([Q, Q[:1]])
        ri = list(rdp_idx(Q, float(os.environ.get("PE", 0.8))))
        # drop closing duplicate; merge tiny edges
        ri = ri[:-1]
        while True:
            V = Q[ri]
            el = np.linalg.norm(np.roll(V, -1, axis=0) - V, axis=1)
            k = int(np.argmin(el))
            if el[k] < 3.0 and len(ri) > 3:
                del ri[k]   # vertex merge; line refit below repairs geometry
            else:
                break
        while len(ri) > 3:
            V = Q[ri]; a_ = V - np.roll(V, 1, axis=0); b_ = np.roll(V, -1, axis=0) - V
            ang = np.abs(np.degrees(np.arctan2(a_[:,0]*b_[:,1]-a_[:,1]*b_[:,0], np.sum(a_*b_, axis=1))))
            k = int(np.argmin(ang))
            if ang[k] < float(os.environ.get("PA", 18)): del ri[k]
            else: break
        while True:
            nv = len(ri); lines = []
            for e in range(nv):
                a, b = ri[e], ri[(e + 1) % nv]
                nQ = len(Q) - 1
                if b <= a: b += nQ
                seg = Q[np.arange(a, b + 1) % nQ]
                tr = int(round(2.5 / st))
                if len(seg) > 2 * tr + 6: seg = seg[tr:len(seg) - tr]
                c_, d_ = fit_line(seg, seg[-1] - seg[0])
                ad = np.degrees(np.arctan2(abs(d_[1]), abs(d_[0])))
                if ad < SNAP: d_ = np.array([np.sign(d_[0]) or 1.0, 0.0]); c_ = c_.copy(); c_[1] = seg[:, 1].mean()
                elif ad > 90 - SNAP: d_ = np.array([0.0, np.sign(d_[1]) or 1.0]); c_ = c_.copy(); c_[0] = seg[:, 0].mean()
                lines.append((c_, d_))
            verts = [intersect(lines[e - 1], lines[e]) for e in range(nv)]
            verts = [v if v is not None else Q[ri[e]] for e, v in enumerate(verts)]
            V = np.array(verts)
            el = np.linalg.norm(np.roll(V, -1, axis=0) - V, axis=1)
            a_ = V - np.roll(V, 1, axis=0); b_ = np.roll(V, -1, axis=0) - V
            ang = np.abs(np.degrees(np.arctan2(a_[:,0]*b_[:,1]-a_[:,1]*b_[:,0], np.sum(a_*b_, axis=1))))
            k1, k2 = int(np.argmin(el)), int(np.argmin(ang))
            if nv > 3 and el[k1] < 4.5: ri.pop((k1 + 1) % nv)
            elif nv > 3 and ang[k2] < 25: del ri[k2]
            else: break
        segs = [["M", *map(float, verts[0])]] + [["L", *map(float, v)] for v in verts[1:]] + [["Z"]]
        bb = [float(P[:, 0].min()), float(P[:, 1].min()), float(P[:, 0].max()), float(P[:, 1].max())]
        out_contours.append(dict(group=g, hole=depth % 2 == 1, bbox=bb, corners_xy=[[round(float(v[0]),2),round(float(v[1]),2)] for v in verts],
                                 segs=[[s_[0]] + [round(v, 3) for v in s_[1:]] for s_ in segs]))
        print("%-8s x=%4d hole=%d POLY verts=%d" % (g, bb[0], depth % 2, nv))
        continue
    corners = find_corners(Ps, st)
    if len(corners) < 2:
        corners = sorted({0, n // 2} | set(corners))
    m = len(corners)
    trim = int(round(TRIM_PX / st))   # samples discarded around corners (blur rounding zone)

    def pca_dev(q):
        if len(q) < 3:
            return 0.0
        c = q.mean(0)
        _, _, vt = np.linalg.svd(q - c, full_matrices=False)
        return float(np.abs((q - c) @ vt[1]).max())

    items = []
    for s_ in range(m):
        c0, c1 = corners[s_], corners[(s_ + 1) % m]
        length = (c1 - c0) % n or n
        idx = [(c0 + t) % n for t in range(length + 1)]
        full = Ps[idx]
        lo, hi = (trim, len(idx) - 1 - trim) if len(idx) > 2 * trim + 8 else (0, len(idx) - 1)
        sp = full[lo : hi + 1]
        r = rdp_idx(sp, EPS_RDP)
        runs = []
        for e in range(len(r) - 1):
            L = float(np.hypot(*(sp[r[e + 1]] - sp[r[e]])))
            straight = L >= MIN_LINE
            if runs and not straight and not runs[-1][2]:
                runs[-1][1] = int(r[e + 1])
            else:
                runs.append([int(r[e]), int(r[e + 1]), straight])
        for q in runs:
            if not q[2] and pca_dev(sp[q[0] : q[1] + 1]) < LINE_DEV:
                q[2] = True
        merged = True
        while merged:
            merged = False
            for q in range(len(runs) - 1):
                a_, b_ = runs[q], runs[q + 1]
                if a_[2] and b_[2] and pca_dev(sp[a_[0] : b_[1] + 1]) < 0.8:
                    runs[q : q + 2] = [[a_[0], b_[1], True]]
                    merged = True
                    break
        for k_, (i0, i1, straight) in enumerate(runs):
            pts = sp[i0 : i1 + 1]
            line = fit_line(pts, pts[-1] - pts[0]) if straight else None
            items.append(dict(kind="L" if straight else "C", pts=pts, line=line, seg=s_,
                              seg_first=(k_ == 0), seg_last=(k_ == len(runs) - 1),
                              corner_pt=Ps[c0], ))
    K = len(items)
    for k, it in enumerate(items):
        it["corner_after"] = it["seg_last"]

    verts = []
    for k in range(K):                       # vertex at the START of item k
        prev, cur = items[k - 1], items[k]
        if prev["corner_after"]:
            cp = cur["corner_pt"]
            v = None
            if prev["kind"] == "L" and cur["kind"] == "L":
                v = intersect(prev["line"], cur["line"])
                if v is not None and np.hypot(*(v - cp)) > 4.0:
                    v = None
            verts.append(v if v is not None else cp)
        else:
            cp = cur["pts"][0]
            if prev["kind"] == "L":
                verts.append(project(cp, prev["line"]))
            elif cur["kind"] == "L":
                verts.append(project(cp, cur["line"]))
            else:
                verts.append(cp)

    segs = [["M", float(verts[0][0]), float(verts[0][1])]]
    desc = []
    for k in range(K):
        it, vs, ve = items[k], verts[k], verts[(k + 1) % K]
        if it["kind"] == "L":
            segs.append(["L", float(ve[0]), float(ve[1])])
            desc.append("L")
            continue
        pts = np.vstack([vs[None, :], it["pts"], ve[None, :]])
        prev, nxt = items[k - 1], items[(k + 1) % K]
        j = min(6, len(pts) - 1)
        t1 = unit(pts[j] - pts[0])
        t2 = unit(pts[-1 - j] - pts[-1])
        if not prev["corner_after"] and prev["kind"] == "L":
            t1 = prev["line"][1]
        if not it["corner_after"] and nxt["kind"] == "L":
            t2 = -nxt["line"][1]
        bz = fit_curve(pts, t1, t2, CURVE_TOL**2)
        for b in bz:
            segs.append(["C"] + [float(v) for v in np.r_[b[1], b[2], b[3]]])
        desc.append("C%d" % len(bz))
    segs.append(["Z"])
    bb = [float(P[:, 0].min()), float(P[:, 1].min()), float(P[:, 0].max()), float(P[:, 1].max())]
    out_contours.append(dict(group=g, hole=depth % 2 == 1, bbox=bb, corners_xy=[[round(float(P[c,0]),2),round(float(P[c,1]),2)] for c in corners],
                             segs=[[s_[0]] + [round(v, 3) for v in s_[1:]] for s_ in segs]))
    print("%-8s x=%4d hole=%d corners=%2d items=%s" % (g, bb[0], depth % 2, m, " ".join(desc)))

order = {"ul": 0, "brackets": 1, "ultima": 2, "linha": 3}
out_contours.sort(key=lambda c: (order[c["group"]], c["bbox"][0], c["bbox"][1]))
cols = {g: [int(round(x)) for x in np.median(np.array(v), axis=0)] for g, v in colors.items()}
print("source colours:", cols)
cnt = {}
for c in out_contours:
    cnt[c["group"]] = cnt.get(c["group"], 0) + 1
print("contours per group:", cnt, "(expected ul 2, brackets 3, ultima 8, linha 6)")
json.dump(dict(contours=out_contours, source_colors=cols), open(OUT, "w"))
