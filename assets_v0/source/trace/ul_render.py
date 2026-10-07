"""Vector rendering helpers (matplotlib Agg, true anti-aliasing, no snapping)."""
import numpy as np
import matplotlib

matplotlib.use("Agg")
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.figure import Figure
from matplotlib.patches import PathPatch
from matplotlib.path import Path


def segs_to_path(segs):
    verts, codes = [], []
    for s in segs:
        k = s[0]
        if k == "M":
            verts.append((s[1], s[2])); codes.append(Path.MOVETO)
        elif k == "L":
            verts.append((s[1], s[2])); codes.append(Path.LINETO)
        elif k == "C":
            verts += [(s[1], s[2]), (s[3], s[4]), (s[5], s[6])]
            codes += [Path.CURVE4] * 3
        elif k == "Z":
            verts.append((0.0, 0.0)); codes.append(Path.CLOSEPOLY)
    return verts, codes


def render(layers, W, H, view, bg=None, dpi=100):
    """layers: [(list_of_segs_lists, '#rrggbb'), ...]; view=(x0,y0,x1,y1) in geometry units."""
    fig = Figure(figsize=(W / dpi, H / dpi), dpi=dpi)
    canvas = FigureCanvasAgg(fig)
    ax = fig.add_axes([0, 0, 1, 1])
    x0, y0, x1, y1 = view
    ax.set_xlim(x0, x1)
    ax.set_ylim(y1, y0)
    ax.axis("off")
    if bg is None:
        fig.patch.set_alpha(0.0)
    else:
        fig.patch.set_facecolor(bg)
    for contours, color in layers:
        verts, codes = [], []
        for segs in contours:
            v, c = segs_to_path(segs)
            verts += v; codes += c
        p = PathPatch(Path(verts, codes), facecolor=color, edgecolor="none", linewidth=0, antialiased=True)
        p.set_snap(False)
        ax.add_patch(p)
    canvas.draw()
    arr = np.asarray(canvas.buffer_rgba()).copy()
    assert arr.shape[:2] == (H, W), (arr.shape, (H, W))
    return arr
