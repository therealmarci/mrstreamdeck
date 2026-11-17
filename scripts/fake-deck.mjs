// Test without a Stream Deck: plays the Stream Deck app (WebSocket), starts the built plugin, puts keys on a pretend
// device and saves what the plugin draws as one picture.
//   node scripts/fake-deck.mjs <server-url> <key> <out.png> [actions...] [--press <action>]...
// Only for development - the key is the one of a test device.
import { Resvg } from "@resvg/resvg-js";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { WebSocketServer } from "ws";

const [url, token, out, ...rest] = process.argv.slice(2);
const presses = [];
const actions = [];
for (let i = 0; i < rest.length; i++) {
	if (rest[i] === "--press") presses.push(rest[++i]);
	else actions.push(rest[i]);
}
const settingsOf = (a) => {
	const [name, json] = a.split("=");
	return { name, settings: json ? JSON.parse(json) : {} };
};
const port = 28_000 + Math.floor(Math.random() * 1000);
const server = new WebSocketServer({ port });
const images = new Map();
const log = [];

server.on("connection", (socket) => {
	const send = (o) => socket.send(JSON.stringify(o));
	socket.on("message", (raw) => {
		const m = JSON.parse(raw);
		if (m.event === "registerPlugin") {
			// keys appear
			actions.forEach((a, i) => {
				const { name, settings } = settingsOf(a);
				const controller = name === "dial" ? "Encoder" : "Keypad";
				send({ event: "willAppear", action: `at.marcelr.mradmin.${name}`, context: `ctx${i}`, device: "dev1",
					payload: { settings, coordinates: { column: i % 5, row: Math.floor(i / 5) }, controller, isInMultiAction: false } });
			});
		} else if (m.event === "getGlobalSettings") {
			send({ event: "didReceiveGlobalSettings", payload: { settings: { url, token, player: "test" } } });
		} else if (m.event === "setImage") {
			images.set(m.context, m.payload.image);
		} else if (m.event === "setFeedback") {
			images.set(m.context, m.payload.canvas);
		} else if (m.event === "showOk" || m.event === "showAlert" || m.event === "openUrl" || m.event === "logMessage") {
			log.push(`${m.event} ${m.context ?? ""} ${JSON.stringify(m.payload ?? "")}`);
		}
	});
	// presses after the first state arrived
	setTimeout(() => {
		for (const p of presses) {
			const index = actions.findIndex((a) => settingsOf(a).name === p);
			send({ event: "keyDown", action: `at.marcelr.mradmin.${p}`, context: `ctx${index}`, device: "dev1",
				payload: { settings: settingsOf(actions[index]).settings, coordinates: { column: 0, row: 0 }, isInMultiAction: false } });
		}
	}, 4000);
});

const info = {
	application: { font: "Segoe UI", language: "de", platform: "windows", platformVersion: "10", version: "7.1.0.0" },
	plugin: { uuid: "at.marcelr.mradmin", version: "0.1.0.0" },
	devicePixelRatio: 2,
	colors: {},
	devices: [{ id: "dev1", name: "Test", size: { columns: 5, rows: 3 }, type: 0 }],
};
const child = spawn(process.execPath, ["bin/plugin.js", "-port", String(port), "-pluginUUID", "at.marcelr.mradmin",
	"-registerEvent", "registerPlugin", "-info", JSON.stringify(info)], { cwd: "at.marcelr.mradmin.sdPlugin", stdio: "inherit" });

setTimeout(() => {
	child.kill();
	server.close();
	const cells = actions.map((a, i) => {
		const img = images.get(`ctx${i}`);
		if (!img) return "";
		const svg = decodeURIComponent(img.split(",")[1]).replace(/<svg [^>]*?viewBox="([^"]+)"[^>]*>/, (_, vb) => `<svg viewBox="${vb}" width="${vb.split(" ")[2]}" height="${vb.split(" ")[3]}">`);
		return `<g transform="translate(${(i % 5) * 152} ${Math.floor(i / 5) * 152})">${svg}</g>`;
	});
	const rows = Math.ceil(actions.length / 5);
	const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${5 * 152}" height="${rows * 152}"><rect width="100%" height="100%" fill="#000"/>${cells.join("")}</svg>`;
	fs.writeFileSync(out, new Resvg(sheet, { font: { loadSystemFonts: true } }).render().asPng());
	console.log(`${images.size}/${actions.length} keys drawn`);
	console.log(log.join("\n"));
	process.exit(0);
}, 9000);
