// Builds the PNG pictures the manifest needs (plugin, category, one per action) from SVG - run with "npm run icons"
// after adding an action. The keys themselves are drawn at runtime (src/lib/render.ts).
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const out = "at.marcelr.mradmin.sdPlugin/imgs";
const crown = fs.readFileSync("scripts/crown.svg", "utf8");

/** Line symbols - the same as src/lib/render.ts. */
const ICONS = {
	"server": "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01M12 7h4M12 17h4",
	"ticket": "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z",
	"mail": "M3 6h18v12H3zM3 7l9 6 9-6",
	"clock": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
	"chart": "M4 20V10M10 20V4M16 20v-7M22 20H2",
	"moon": "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
	"grid": "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
	"swords": "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2",
	"pulse": "M3 12h4l2-6 4 12 2-6h6",
	"alert": "M12 3 2 20h20zM12 9v5M12 17h.01",
	"tool": "M14.7 6.3a4 4 0 0 0-5.4 5.2L4 16.8V20h3.2l5.3-5.3a4 4 0 0 0 5.2-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
	"users": "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c0-3.3 3.1-6 7-6s7 2.7 7 6M16 3.5a4 4 0 0 1 0 7M18 14c2.4.6 4 2.6 4 5",
	"chat": "M4 5h16v11H9l-5 4z",
	"shield": "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z",
	"power": "M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0",
	"megaphone": "M3 10v4h3l7 4V6L6 10zM16 9a3 3 0 0 1 0 6M18.5 6.5a7 7 0 0 1 0 11",
	"box": "M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"
};

/** action id -> symbol */
const ACTIONS = {"server":"server","tickets":"ticket","inbox":"mail","countdown":"clock","stats":"chart","sleep":"moon","chunkloader":"grid","duel":"swords","performance":"pulse","alerts":"alert","chunkwarnings":"grid","review":"swords","maintenance":"tool","waitroom":"users","staffchat":"chat","adminmode":"shield","restart":"power","announce":"megaphone","plugin":"box","dial":"pulse","dial-players":"users","dial-chunkloader":"grid","dial-performance":"pulse","dial-restart":"power"};

function png(svg, size, file) {
	const data = new Resvg(svg, { fitTo: { mode: "width", value: size }, background: "rgba(0,0,0,0)" }).render().asPng();
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, data);
}

/** Plugin icon (marketplace and store) and the category in the action list. */
png(crown, 288, `${out}/plugin/marketplace.png`);
png(crown, 576, `${out}/plugin/marketplace@2x.png`);
const white = crown.replace(/fill="#17171c"/, 'fill="none"').replace(/fill="#[0-9a-f]{6}"/gi, 'fill="#ffffff"');
png(white, 28, `${out}/plugin/category-icon.png`);
png(white, 56, `${out}/plugin/category-icon@2x.png`);

for (const [id, icon] of Object.entries(ACTIONS)) {
	const line = (color, width) =>
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${ICONS[icon]}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
	// The list of actions: white lines on nothing.
	png(line("#ffffff", 2), 20, `${out}/actions/${id}/icon.png`);
	png(line("#ffffff", 2), 40, `${out}/actions/${id}/icon@2x.png`);
	// The key before the plugin draws it: dark with the symbol in the accent colour.
	const key = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" fill="#14171c"/><g transform="translate(36 36) scale(3)" fill="none" stroke="#3b8bf0" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[icon]}"/></g><rect y="134" width="144" height="10" fill="#3b8bf0"/></svg>`;
	png(key, 72, `${out}/actions/${id}/key.png`);
	png(key, 144, `${out}/actions/${id}/key@2x.png`);
}
console.log("Icons written to " + out);
