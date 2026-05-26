import { ThemePalette } from "../theme";

const NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

export function renderRouteMap(
  container: HTMLElement,
  route: [number, number][],
  palette: ThemePalette,
  widthPx = 400,
  heightPx = 250
): void {
  if (route.length < 2) {
    container.createEl("p", { cls: "running-log-empty", text: "No GPS data for this run." });
    return;
  }

  const lats = route.map(([lat]) => lat);
  const lons = route.map(([, lon]) => lon);

  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);

  // Equirectangular projection: scale longitude by cos(center latitude)
  const latCenter = (latMin + latMax) / 2;
  const cosLat = Math.cos((latCenter * Math.PI) / 180);

  const projLon = (lon: number) => lon * cosLat;
  const projLons = lons.map(projLon);
  const projLonMin = Math.min(...projLons);
  const projLonMax = Math.max(...projLons);

  const latRange = latMax - latMin || 1e-6;
  const lonRange = projLonMax - projLonMin || 1e-6;

  const pad = 16;
  const W = widthPx - pad * 2;
  const H = heightPx - pad * 2;

  // Fit to bounding box preserving aspect ratio
  const scale = Math.min(W / lonRange, H / latRange);

  function project([lat, lon]: [number, number]): [number, number] {
    const x = (projLon(lon) - projLonMin) * scale + pad;
    const y = (latMax - lat) * scale + pad; // invert: higher lat = lower y
    return [x, y];
  }

  const points = route.map(project);
  const pointsStr = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const svgW = (lonRange * scale + pad * 2).toFixed(1);
  const svgH = (latRange * scale + pad * 2).toFixed(1);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${svgW} ${svgH}`,
    class: "running-log-route-svg",
    "aria-label": "Route map",
  });

  svg.appendChild(svgEl("polyline", {
    points: pointsStr,
    fill: "none",
    stroke: palette.accent,
    "stroke-width": "2.5",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  }));

  // Start marker (green circle)
  const [sx, sy] = points[0];
  const startCircle = svgEl("circle", {
    cx: String(sx.toFixed(1)),
    cy: String(sy.toFixed(1)),
    r: "4",
    fill: "#22c55e",
    stroke: "white",
    "stroke-width": "1",
  });
  svg.appendChild(startCircle);

  // End marker (accent-colored square-ish circle)
  const [ex, ey] = points[points.length - 1];
  const endCircle = svgEl("circle", {
    cx: String(ex.toFixed(1)),
    cy: String(ey.toFixed(1)),
    r: "4",
    fill: palette.accent,
    stroke: "white",
    "stroke-width": "1",
  });
  svg.appendChild(endCircle);

  const wrap = container.createEl("div", { cls: "running-log-route" });
  wrap.appendChild(svg);
}
