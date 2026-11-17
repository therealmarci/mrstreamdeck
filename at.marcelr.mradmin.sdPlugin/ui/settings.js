// Settings window of every MRadmin key. Talks with the Stream Deck app over its WebSocket: the connection (address,
// code, key) goes to the plugin, which answers with its status - the key itself never comes back here. Settings of
// the single key (e.g. the tickets view) are stored with the key.

const TEXTS = {
	de: {
		connection: "Verbindung",
		address: "Server-Adresse",
		name: "Name",
		connectCode: "Mit Code verbinden",
		withKey: "Mit Schlüssel verbinden",
		key: "Schlüssel",
		connectKey: "Verbinden",
		keyHint: "Den Schlüssel erzeugst du in der Weboberfläche unter Konto → Geräte → Stream Deck.",
		openBrowser: "Im Browser bestätigen",
		cancel: "Abbrechen",
		disconnect: "Trennen",
		linkHint: "Bestätige den Code im Spiel mit <code>/web link {code}</code> oder im Browser. Er gilt 5 Minuten.",
		"status.setup": "Nicht verbunden",
		"status.linking": "Wartet auf Bestätigung",
		"status.ok": "Verbunden als {player}",
		"status.offline": "Server nicht erreichbar",
		"status.signed-out": "Abgemeldet - neu verbinden",
		"status.no-permission": "Kein Recht (mradmin.deck)",
		"status.off": "Am Server ausgeschaltet",
		"error.unreachable": "Unter dieser Adresse antwortet nichts.",
		"error.no-mradmin": "Unter dieser Adresse läuft keine MRadmin-Weboberfläche.",
		"error.deck-off": "Stream Decks sind auf diesem Server ausgeschaltet.",
		"error.expired": "Der Code ist abgelaufen - bitte neu verbinden.",
		"error.key-wrong": "Der Schlüssel stimmt nicht.",
		"error.rate-limit": "Zu viele Versuche - kurz warten.",
		"error.no-url": "Bitte die Adresse eingeben.",
		ticketsMode: "Anzeige",
		modeAuto: "Automatisch",
		modeTeam: "Tickets des Servers (Team)",
		modeMine: "Meine Tickets",
	},
	en: {
		connection: "Connection",
		address: "Server address",
		name: "Name",
		connectCode: "Connect with a code",
		withKey: "Connect with a key",
		key: "Key",
		connectKey: "Connect",
		keyHint: "Make the key in the web interface under Account → Devices → Stream Deck.",
		openBrowser: "Confirm in the browser",
		cancel: "Cancel",
		disconnect: "Disconnect",
		linkHint: "Confirm the code in game with <code>/web link {code}</code> or in the browser. It works for 5 minutes.",
		"status.setup": "Not connected",
		"status.linking": "Waiting for confirmation",
		"status.ok": "Connected as {player}",
		"status.offline": "Server unreachable",
		"status.signed-out": "Signed out - connect again",
		"status.no-permission": "No permission (mradmin.deck)",
		"status.off": "Switched off on the server",
		"error.unreachable": "Nothing answers at this address.",
		"error.no-mradmin": "There is no MRadmin web interface at this address.",
		"error.deck-off": "Stream Decks are switched off on this server.",
		"error.expired": "The code has expired - please connect again.",
		"error.key-wrong": "The key is wrong.",
		"error.rate-limit": "Too many attempts - wait a moment.",
		"error.no-url": "Please enter the address.",
		ticketsMode: "Show",
		modeAuto: "Automatic",
		modeTeam: "Tickets of the server (team)",
		modeMine: "My tickets",
	},
};

let socket;
let context;
let actionId;
let settings = {};
let texts = TEXTS.en;

const $ = (id) => document.getElementById(id);
const t = (key, values = {}) => (texts[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");
const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function send(event, payload) {
	socket.send(JSON.stringify({ event, context, action: actionId, payload }));
}

function toPlugin(payload) {
	send("sendToPlugin", payload);
}

/** Called by the Stream Deck app when the window opens. */
// eslint-disable-next-line no-unused-vars
function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, actionInfo) {
	context = uuid;
	const app = JSON.parse(info);
	const action = JSON.parse(actionInfo);
	actionId = action.action;
	settings = action.payload?.settings ?? {};
	texts = String(app.application?.language ?? "en").startsWith("de") ? TEXTS.de : TEXTS.en;

	for (const el of document.querySelectorAll("[data-t]")) {
		el.textContent = t(el.dataset.t);
	}
	for (const block of document.querySelectorAll("section.key")) {
		block.hidden = block.dataset.action !== actionId;
	}
	for (const field of document.querySelectorAll("[data-setting]")) {
		if (settings[field.dataset.setting] !== undefined) {
			field.value = settings[field.dataset.setting];
		}
		field.addEventListener("change", () => {
			settings[field.dataset.setting] = field.value;
			send("setSettings", settings);
		});
	}
	$("name").value = "Stream Deck";

	socket = new WebSocket("ws://127.0.0.1:" + port);
	socket.onopen = () => {
		socket.send(JSON.stringify({ event: registerEvent, uuid }));
		toPlugin({ type: "status" });
	};
	socket.onmessage = (message) => {
		const data = JSON.parse(message.data);
		if (data.event === "sendToPropertyInspector" && data.payload?.type === "status") {
			show(data.payload);
		}
	};
}

function show(s) {
	const tone = s.status === "ok" ? "ok" : s.status === "linking" ? "warn" : s.status === "setup" ? "" : "bad";
	$("status").className = "status " + tone;
	$("status").textContent = t("status." + s.status, { player: s.player + (s.server ? " · " + s.server : "") });
	$("setup").hidden = !["setup", "signed-out", "off", "offline", "no-permission"].includes(s.status) || (s.status === "offline" && s.player);
	$("linking").hidden = s.status !== "linking";
	$("connected").hidden = !["ok", "offline", "no-permission"].includes(s.status) || !s.player;
	if (s.url && !$("url").value) {
		$("url").value = s.url;
	}
	$("code").textContent = s.code;
	$("linkHint").innerHTML = t("linkHint", { code: escape(s.code) });
	$("openLink").hidden = !s.linkUrl;
	$("error").hidden = !s.error;
	$("error").textContent = s.error ? t("error." + s.error) : "";
	for (const b of document.querySelectorAll("button")) {
		b.disabled = false;
	}
}

function busy() {
	for (const b of document.querySelectorAll("button")) {
		b.disabled = true;
	}
}

$("connect").addEventListener("click", () => {
	busy();
	toPlugin({ type: "connect", url: $("url").value, name: $("name").value });
});
$("useKey").addEventListener("click", () => {
	busy();
	toPlugin({ type: "key", url: $("url").value, key: $("key").value });
	$("key").value = "";
});
$("openLink").addEventListener("click", () => toPlugin({ type: "open-link" }));
$("cancel").addEventListener("click", () => toPlugin({ type: "cancel" }));
$("disconnect").addEventListener("click", () => toPlugin({ type: "disconnect" }));
