/**
 * Draws a key in the quiet look of MRadmin: dark background, symbol and title at the top, a big value in the middle,
 * a short line below and the state as a stripe at the bottom. Keys are 144 x 144 pixels; the Stream Deck scales them.
 */

/** Line symbols (24 x 24) - the same as in MRadmin's web interface (web/src/lib/icons.js). */
export const ICONS = {
	server: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01M12 7h4M12 17h4",
	ticket: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z",
	pulse: "M3 12h4l2-6 4 12 2-6h6",
	grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
	moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
	swords: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2",
	users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c0-3.3 3.1-6 7-6s7 2.7 7 6M16 3.5a4 4 0 0 1 0 7M18 14c2.4.6 4 2.6 4 5",
	chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
	shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z",
	mail: "M3 6h18v12H3zM3 7l9 6 9-6",
	chat: "M4 5h16v11H9l-5 4z",
	megaphone: "M3 10v4h3l7 4V6L6 10zM16 9a3 3 0 0 1 0 6M18.5 6.5a7 7 0 0 1 0 11",
	power: "M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0",
	tool: "M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
	alert: "M12 3 2 20h20zM12 9v5M12 17h.01",
	link: "M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1",
	box: "M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9",
	clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
	pin: "M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21ZM12 12.3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
} as const;

export type Icon = keyof typeof ICONS;
export type Tone = "good" | "warn" | "bad" | "off" | "info";

/** The colours of MRadmin's dark theme: one accent (hue 210), colour only for states. */
const COLORS = {
	background: "#14171c",
	text: "#f1f3f6",
	muted: "#9aa3b2",
	good: "#22c55e",
	warn: "#f59e0b",
	bad: "#ef4444",
	off: "#4b5563",
	info: "#3b8bf0",
};

export type Tile = {
	icon: Icon;
	title: string;
	value: string;
	detail?: string;
	tone?: Tone;
	/** a small curve under the value (e.g. TPS of the last minutes), newest last */
	chart?: number[];
	/** highlights the whole key for a moment (second press asked, alarm) */
	flash?: boolean;
};

const FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

function escape(text: string): string {
	return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
}

/** Cuts a text to fit (rough width per character at that size). */
/** Rough width of a text in pixels (Segoe UI and similar; bold a little wider) - to fit it before drawing. */
function measure(text: string, size: number, bold = false): number {
	let units = 0;
	for (const c of text) {
		units += "iIl.,:;!|'1 ()[]·".includes(c) ? 0.3 : "mwMW%".includes(c) ? 0.88
			: c >= "A" && c <= "Z" || "ÄÖÜ".includes(c) ? 0.66 : c >= "0" && c <= "9" ? 0.56 : 0.52;
	}
	return units * size * (bold ? 1.08 : 1);
}

/** The text at the biggest size from max down to min that fits; if even min is too wide, cut with "…". */
function fit(text: string, max: number, min: number, width: number, bold = false): { text: string; size: number } {
	for (let size = max; size >= min; size--) {
		if (measure(text, size, bold) <= width) {
			return { text, size };
		}
	}
	let cut = text;
	while (cut.length > 1 && measure(cut + "…", min, bold) > width) {
		cut = cut.slice(0, -1);
	}
	return { text: cut.trimEnd() + "…", size: min };
}

/** Normalises a tone given by MRadmin or a module ("good", "warn", "bad", "off", others = info). */
export function tone(value: string | undefined | null): Tone {
	return value === "good" || value === "warn" || value === "bad" || value === "off" ? value : "info";
}

function curve(values: number[], x: number, y: number, w: number, h: number, color: string): string {
	if (values.length < 2) {
		return "";
	}
	const min = Math.min(...values);
	const max = Math.max(...values);
	const span = max - min || 1;
	const points = values
		.map((v, i) => `${(x + (i / (values.length - 1)) * w).toFixed(1)},${(y + h - ((v - min) / span) * h).toFixed(1)}`)
		.join(" ");
	return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`;
}

/** The key as an SVG data URL for setImage. */
export function render(tile: Tile): string {
	const color = COLORS[tile.tone ?? "info"];
	const value = fit(tile.value, 46, 18, 130, true);
	const title = fit(tile.title, 17, 13, 98, true);
	const detail = fit(tile.detail ?? "", 15, 11, 134);
	const chart = tile.chart && tile.chart.length > 1;
	const valueY = chart ? 74 : 86;
	const parts = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">`,
		`<rect width="144" height="144" fill="${tile.flash ? color : COLORS.background}"/>`,
		tile.flash ? "" : `<rect x="0" y="0" width="144" height="144" fill="${color}" opacity="0.07"/>`,
		`<g transform="translate(10 10) scale(0.92)" fill="none" stroke="${tile.flash ? COLORS.background : color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[tile.icon]}"/></g>`,
		`<text x="40" y="29" font-family="${FONT}" font-size="${title.size}" font-weight="600" fill="${tile.flash ? COLORS.background : COLORS.muted}">${escape(title.text)}</text>`,
		`<text x="72" y="${valueY}" text-anchor="middle" font-family="${FONT}" font-size="${value.size}" font-weight="700" fill="${tile.flash ? COLORS.background : COLORS.text}">${escape(value.text)}</text>`,
		chart ? curve(tile.chart!, 14, 86, 116, 22, color) : "",
		tile.detail
			? `<text x="72" y="${chart ? 125 : 116}" text-anchor="middle" font-family="${FONT}" font-size="${detail.size}" fill="${tile.flash ? COLORS.background : COLORS.muted}">${escape(detail.text)}</text>`
			: "",
		tile.flash ? "" : `<rect x="0" y="134" width="144" height="10" fill="${color}"/>`,
		`</svg>`,
	];
	return "data:image/svg+xml;charset=utf8," + encodeURIComponent(parts.join(""));
}

/**
 * The touch strip of a dial (Stream Deck +, 200 x 100): the same parts side by side, with dots for the pages the dial
 * turns through.
 */
export function renderDial(tile: Tile, page: number, pages: number): string {
	const color = COLORS[tile.tone ?? "info"];
	const value = fit(tile.value, 34, 16, 186, true);
	const title = fit(tile.title, 14, 11, 162, true);
	const detail = fit(tile.detail ?? "", 13, 10, 190);
	const dots = Array.from({ length: pages }, (_, i) =>
		`<circle cx="${100 - (pages - 1) * 6 + i * 12}" cy="86" r="3" fill="${i === page ? COLORS.text : COLORS.off}"/>`).join("");
	const parts = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">`,
		`<rect width="200" height="100" fill="${COLORS.background}"/>`,
		`<rect width="200" height="100" fill="${color}" opacity="0.07"/>`,
		`<g transform="translate(8 6) scale(0.75)" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[tile.icon]}"/></g>`,
		`<text x="30" y="21" font-family="${FONT}" font-size="${title.size}" font-weight="600" fill="${COLORS.muted}">${escape(title.text)}</text>`,
		`<text x="100" y="54" text-anchor="middle" font-family="${FONT}" font-size="${value.size}" font-weight="700" fill="${COLORS.text}">${escape(value.text)}</text>`,
		tile.detail ? `<text x="100" y="73" text-anchor="middle" font-family="${FONT}" font-size="${detail.size}" fill="${COLORS.muted}">${escape(detail.text)}</text>` : "",
		dots,
		`<rect x="0" y="94" width="200" height="6" fill="${color}"/>`,
		`</svg>`,
	];
	return "data:image/svg+xml;charset=utf8," + encodeURIComponent(parts.join(""));
}
