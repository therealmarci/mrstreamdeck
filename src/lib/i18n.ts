import streamDeck from "@elgato/streamdeck";

/** Language of the keys: German if the Stream Deck app runs in German, otherwise English. */
export function lang(): "de" | "en" {
	const app = streamDeck.info?.application?.language ?? "en";
	return String(app).toLowerCase().startsWith("de") ? "de" : "en";
}

const TEXTS = {
	de: {
		"setup.title": "MRadmin",
		"setup.value": "Verbinden",
		"setup.detail": "Einstellungen öffnen",
		"link.title": "Code",
		"link.detail": "/web link",
		"offline.value": "Offline",
		"offline.detail": "Server nicht erreichbar",
		"signedOut.value": "Abgemeldet",
		"signedOut.detail": "Neu verbinden",
		"noPermission.value": "Kein Recht",
		"off.value": "Aus",
		"off.detail": "Am Server ausgeschaltet",
		"server.title": "Server",
		"server.players": "Spieler",
		"server.restart": "Neustart",
		"server.stop": "Stopp",
		"server.maintenance": "Wartung",
		"tickets.title": "Tickets",
		"tickets.myTitle": "Meine Tickets",
		"tickets.open": "offen",
		"tickets.unread": "{n} ungelesen",
		"tickets.none": "keine offen",
		"tickets.answer": "neue Antwort",
	},
	en: {
		"setup.title": "MRadmin",
		"setup.value": "Connect",
		"setup.detail": "Open the settings",
		"link.title": "Code",
		"link.detail": "/web link",
		"offline.value": "Offline",
		"offline.detail": "Server unreachable",
		"signedOut.value": "Signed out",
		"signedOut.detail": "Connect again",
		"noPermission.value": "No right",
		"off.value": "Off",
		"off.detail": "Switched off on the server",
		"server.title": "Server",
		"server.players": "players",
		"server.restart": "Restart",
		"server.stop": "Stop",
		"server.maintenance": "Maintenance",
		"tickets.title": "Tickets",
		"tickets.myTitle": "My tickets",
		"tickets.open": "open",
		"tickets.unread": "{n} unread",
		"tickets.none": "none open",
		"tickets.answer": "new answer",
	},
} as const;

export type TextKey = keyof (typeof TEXTS)["de"];

/** A text in the language of the Stream Deck app, {name} replaced by values. */
export function t(key: TextKey, values: Record<string, string | number> = {}): string {
	let text: string = TEXTS[lang()][key] ?? key;
	for (const [k, v] of Object.entries(values)) {
		text = text.replaceAll(`{${k}}`, String(v));
	}
	return text;
}
