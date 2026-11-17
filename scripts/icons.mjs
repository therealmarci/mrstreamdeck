// Builds the PNG pictures the manifest needs (plugin, category, one per action) from SVG - run with "npm run icons"
// after adding an action. The keys themselves are drawn at runtime (src/lib/render.ts).
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import path from "node:path";

const out = "at.marcelr.mradmin.sdPlugin/imgs";
const crown = fs.readFileSync("scripts/crown.svg", "utf8");

/** Line symbols - the same as src/lib/render.ts. */
const ICONS = {
	server: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01M12 7h4M12 17h4",
	ticket: "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z",
};

/** action id -> symbol */
const ACTIONS = { server: "server", tickets: "ticket" };

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
