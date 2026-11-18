/**
 * The touch strip of a dial on the Stream Deck + (200 x 100 per dial) in the same quiet look as the keys: a header
 * with symbol and title, then a big curve, a list or a value with a bar - and the state as a stripe at the bottom.
 */
import { COLORS, escape, fit, FONT, ICONS, type Icon, type Tone } from "./render";

const W = 200;
const H = 100;

function frame(tone: Tone, body: string[]): string {
	const color = COLORS[tone];
	return "data:image/svg+xml;charset=utf8," + encodeURIComponent([
		`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
		`<rect width="${W}" height="${H}" fill="${COLORS.background}"/>`,
		`<rect width="${W}" height="${H}" fill="${color}" opacity="0.07"/>`,
		...body,
		`<rect x="0" y="${H - 5}" width="${W}" height="5" fill="${color}"/>`,
		`</svg>`,
	].join(""));
}

/** Symbol + title on the left of the header, a value on the right. */
function header(icon: Icon, title: string, tone: Tone, right = ""): string[] {
	const color = COLORS[tone];
	const value = fit(right, 18, 12, 90, true);
	const head = fit(title, 13, 10, right ? 92 : 168, true);
	return [
		`<g transform="translate(6 5) scale(0.7)" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[icon]}"/></g>`,
		`<text x="27" y="18" font-family="${FONT}" font-size="${head.size}" font-weight="600" fill="${COLORS.muted}">${escape(head.text)}</text>`,
		right ? `<text x="${W - 6}" y="20" text-anchor="end" font-family="${FONT}" font-size="${value.size}" font-weight="700" fill="${COLORS.text}">${escape(value.text)}</text>` : "",
	];
}

/** A wide curve (newest right) with a soft area below; {@code detail} small at the bottom left. */
export function dialChart(icon: Icon, title: string, value: string, tone: Tone, values: number[], detail = "", range?: [number, number]): string {
	const color = COLORS[tone];
	const top = 30;
	const bottom = 80;
	const parts = header(icon, title, tone, value);
	if (values.length > 1) {
		const min = range ? range[0] : Math.min(...values);
		const max = range ? range[1] : Math.max(...values);
		const span = max - min || 1;
		const points = values.map((v, i) => [6 + (i / (values.length - 1)) * (W - 12),
			bottom - (Math.min(max, Math.max(min, v)) - min) / span * (bottom - top)]);
		const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
		parts.push(`<polygon points="6,${bottom} ${line} ${W - 6},${bottom}" fill="${color}" opacity="0.15"/>`);
		parts.push(`<polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`);
	}
	if (detail) {
		const d = fit(detail, 11, 9, W - 12);
		parts.push(`<text x="6" y="${H - 9}" font-family="${FONT}" font-size="${d.size}" fill="${COLORS.muted}">${escape(d.text)}</text>`);
	}
	return frame(tone, parts);
}

export type DialRow = { image?: string; name: string; info?: string };

/** Up to three rows (e.g. players with their heads), a hint where in the list we are on the right of the header. */
export function dialList(icon: Icon, title: string, tone: Tone, rows: DialRow[], position: string, empty: string): string {
	const parts = header(icon, title, tone, position);
	if (rows.length === 0) {
		parts.push(`<text x="${W / 2}" y="58" text-anchor="middle" font-family="${FONT}" font-size="13" fill="${COLORS.muted}">${escape(empty)}</text>`);
	}
	rows.slice(0, 3).forEach((row, i) => {
		const y = 28 + i * 22;
		if (row.image) {
			parts.push(`<image href="${row.image}" x="6" y="${y}" width="18" height="18" style="image-rendering:pixelated"/>`);
		} else {
			parts.push(`<rect x="6" y="${y}" width="18" height="18" rx="3" fill="${COLORS.off}"/>`);
		}
		const info = row.info ? fit(row.info, 11, 9, 70) : null;
		const name = fit(row.name, 14, 10, info ? 100 : 166, true);
		parts.push(`<text x="30" y="${y + 14}" font-family="${FONT}" font-size="${name.size}" font-weight="600" fill="${COLORS.text}">${escape(name.text)}</text>`);
		if (info) {
			parts.push(`<text x="${W - 6}" y="${y + 14}" text-anchor="end" font-family="${FONT}" font-size="${info.size}" fill="${COLORS.muted}">${escape(info.text)}</text>`);
		}
	});
	return frame(tone, parts);
}

/** A big value in the middle, a line below and optionally a bar (0..1, e.g. time left of a countdown). */
export function dialValue(icon: Icon, title: string, value: string, tone: Tone, detail = "", bar?: number, flash = false): string {
	const color = COLORS[tone];
	const v = fit(value, 30, 14, W - 12, true);
	const d = fit(detail, 12, 9, W - 12);
	const parts = header(icon, title, tone);
	if (flash) {
		parts.unshift(`<rect width="${W}" height="${H}" fill="${color}" opacity="0.35"/>`);
	}
	parts.push(`<text x="${W / 2}" y="56" text-anchor="middle" font-family="${FONT}" font-size="${v.size}" font-weight="700" fill="${COLORS.text}">${escape(v.text)}</text>`);
	if (detail) {
		parts.push(`<text x="${W / 2}" y="74" text-anchor="middle" font-family="${FONT}" font-size="${d.size}" fill="${COLORS.muted}">${escape(d.text)}</text>`);
	}
	if (bar !== undefined) {
		const width = Math.max(0, Math.min(1, bar)) * (W - 12);
		parts.push(`<rect x="6" y="81" width="${W - 12}" height="6" rx="3" fill="${COLORS.off}"/>`);
		parts.push(`<rect x="6" y="81" width="${width.toFixed(1)}" height="6" rx="3" fill="${color}"/>`);
	}
	return frame(tone, parts);
}
