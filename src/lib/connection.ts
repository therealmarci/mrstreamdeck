import streamDeck from "@elgato/streamdeck";
import { lang } from "./i18n";

/** What is stored in the global settings of the plugin (shared by all keys, kept by the Stream Deck app). */
export type GlobalSettings = {
	url?: string;
	token?: string;
	player?: string;
};

/**
 * Where the plugin stands: not set up, waiting for a code to be confirmed, connected (with data), the server cannot
 * be reached, the key was signed out, the player lacks mradmin.deck, or the server has Stream Decks switched off.
 */
export type Status = "setup" | "linking" | "ok" | "offline" | "signed-out" | "no-permission" | "off";

/** The answer of GET /api/deck/state (see MRadmin's DeckRoutes) - only the parts the keys read. */
export type DeckState = {
	time: number;
	url: string;
	serverName: string;
	me: { name: string; uuid: string; online: boolean; team: boolean };
	server?: { online: number; max: number };
	restart?: { at: number; restart: boolean; countdown: boolean; planned: boolean; reason: string };
	maintenance?: { phase: string; title?: string; start?: number; end?: number };
	inbox?: { unread: number; alarm: boolean };
	stats?: { key: string; value: string }[];
	myTickets?: { open: number; unread: number };
	sleep?: { world: string; night: boolean; sleeping: number; needed: number };
	tiles: DeckTile[];
	team?: TeamState;
};

export type DeckTile = {
	module: string;
	id: string;
	kind: string;
	title: string;
	value: string;
	detail: string;
	tone: string;
	link: string | null;
	pressable: boolean;
	confirm: boolean;
};

export type TeamState = {
	server?: { tps: number[]; mspt: number; online: number; max: number; ramUsed: number; ramMax: number };
	tickets?: { open: number; unread: number; mine: number };
	alerts?: { tone: string; key: string; page: string | null; values: Record<string, unknown>; module?: string; text?: string }[];
	tiles?: { id: string; label: string; value: string; unit: string; tone: string; headline: string }[];
	maintenance?: { phase: string; title?: string; start?: number; end?: number };
	room?: { online: boolean; restarting: boolean; players: number; max: number; tps?: number };
	history?: { tps: number[]; mspt: number[] };
	staffChat?: { unread: number; last?: { from: string; text: string; time: number } };
	adminMode?: { online: boolean; active: boolean };
	restartControl?: { enabled: boolean; delays: number[]; running: number; roomRestarting: boolean };
	announce?: { name: string; values: boolean }[];
};

/** A code shown on the keys while the player confirms it (in game or in the browser). */
export type Link = { code: string; url: string; expires: number };

const POLL_MILLIS = 3_000;

/** The connection to MRadmin: settings, the current state, polling while keys are visible. */
class Connection {
	settings: GlobalSettings = {};
	state: DeckState | null = null;
	/** Local clock minus MRadmin's clock (for countdowns). */
	skew = 0;
	status: Status = "setup";
	link: Link | null = null;
	/** Last error of a connect attempt (shown in the settings). */
	lastError = "";

	private listeners = new Set<() => void>();
	private visible = 0;
	private timer: NodeJS.Timeout | null = null;
	private linkTimer: NodeJS.Timeout | null = null;
	private loaded = false;

	/** MRadmin's time right now (milliseconds). */
	now(): number {
		return Date.now() - this.skew;
	}

	async init(): Promise<void> {
		this.settings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		this.loaded = true;
		this.status = this.settings.token ? "ok" : "setup";
		this.changed();
		if (this.settings.token && this.visible > 0) {
			await this.refresh();
		}
	}

	/** Called on every change of state or status - the keys draw themselves again. */
	onChange(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private changed(): void {
		for (const listener of this.listeners) {
			try {
				listener();
			} catch (e) {
				streamDeck.logger.error(`Drawing failed: ${e}`);
			}
		}
	}

	/** A key became visible / was hidden: poll only while at least one is shown. */
	show(): void {
		this.visible++;
		if (this.visible === 1) {
			this.timer = setInterval(() => void this.refresh(), POLL_MILLIS);
			if (this.loaded) {
				void this.refresh();
			}
		}
	}

	hide(): void {
		this.visible = Math.max(0, this.visible - 1);
		if (this.visible === 0 && this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	// ------------------------------------------------------------- requests

	private async request(method: string, path: string, body?: unknown, auth = true): Promise<{ status: number; data: any }> {
		const base = this.settings.url;
		if (!base) {
			throw new Error("no-url");
		}
		const headers: Record<string, string> = { "X-MRadmin": "1", "Content-Type": "application/json" };
		if (auth && this.settings.token) {
			headers.Authorization = `Bearer ${this.settings.token}`;
		}
		const response = await fetch(base + "/api" + path, {
			method,
			headers,
			body: body === undefined ? undefined : JSON.stringify(body),
			signal: AbortSignal.timeout(8_000),
		});
		let data: any = null;
		try {
			data = await response.json();
		} catch {
			// empty answer
		}
		return { status: response.status, data };
	}

	/** Fetches the state now (also after a press). */
	async refresh(): Promise<void> {
		if (!this.settings.token || !this.settings.url) {
			if (this.status !== "linking") {
				this.status = "setup";
			}
			this.changed();
			return;
		}
		try {
			const { status, data } = await this.request("GET", `/deck/state?lang=${lang()}`);
			if (status === 200) {
				this.state = data as DeckState;
				this.skew = Date.now() - this.state.time;
				this.status = "ok";
			} else if (status === 401) {
				this.status = "signed-out";
			} else if (status === 403) {
				this.status = "no-permission";
			} else if (status === 404 && data?.error === "deck-off") {
				this.status = "off";
			} else {
				this.status = "offline";
			}
		} catch {
			this.status = "offline";
		}
		this.changed();
	}

	/** A key with an effect (POST /api/deck/press). @returns null if done, otherwise the reason */
	async press(body: Record<string, unknown>): Promise<string | null> {
		try {
			const { status, data } = await this.request("POST", "/deck/press", { lang: lang(), ...body });
			void this.refresh();
			if (status === 200) {
				return null;
			}
			return data?.message ?? data?.error ?? String(status);
		} catch {
			return "offline";
		}
	}

	// ------------------------------------------------------------- connecting

	/** "mc.example.org" -> "https://mc.example.org" (no slash at the end). */
	static normalise(raw: string): string {
		let url = (raw ?? "").trim().replace(/\/+$/, "");
		if (url && !/^https?:\/\//i.test(url)) {
			url = "https://" + url;
		}
		return url.replace(/\/(me|admin|account|link)(\/.*)?$/, "");
	}

	private async save(next: GlobalSettings): Promise<void> {
		this.settings = next;
		await streamDeck.settings.setGlobalSettings(next);
	}

	/** Checks the address: is there an MRadmin with Stream Decks switched on? @returns the server name or throws */
	private async hello(url: string): Promise<string> {
		this.settings = { ...this.settings, url };
		let answer;
		try {
			answer = await this.request("GET", "/deck/hello", undefined, false);
		} catch {
			throw new Error("unreachable");
		}
		if (answer.status !== 200 || !answer.data?.mradmin) {
			throw new Error("no-mradmin");
		}
		if (!answer.data.enabled) {
			throw new Error("deck-off");
		}
		return answer.data.name;
	}

	/** Asks MRadmin for a code and waits until the player confirms it (keys and settings show the code). */
	async connect(rawUrl: string, name: string): Promise<void> {
		this.stopLink();
		this.lastError = "";
		const url = Connection.normalise(rawUrl);
		if (!url) {
			this.lastError = "no-url";
			this.changed();
			return;
		}
		try {
			await this.hello(url);
			const { status, data } = await this.request("POST", "/deck/link", { name }, false);
			if (status !== 200) {
				throw new Error(data?.error ?? "server");
			}
			await this.save({ url });
			this.link = { code: data.code, url: data.url, expires: data.expires };
			this.status = "linking";
			this.changed();
			const poll = data.poll as string;
			this.linkTimer = setInterval(() => void this.pollLink(poll), 3_000);
		} catch (e) {
			this.lastError = (e as Error).message;
			this.status = this.settings.token ? this.status : "setup";
			this.changed();
		}
	}

	private async pollLink(poll: string): Promise<void> {
		if (!this.link) {
			return;
		}
		try {
			const { status, data } = await this.request("POST", "/deck/link/poll", { poll }, false);
			if (status !== 200) {
				return;
			}
			if (data.state === "done") {
				this.stopLink();
				await this.save({ url: this.settings.url, token: data.token, player: data.player });
				this.status = "ok";
				await this.refresh();
			} else if (data.state === "expired" || Date.now() > (this.link?.expires ?? 0)) {
				this.stopLink();
				this.lastError = "expired";
				this.status = "setup";
				this.changed();
			}
		} catch {
			// try again with the next round
		}
	}

	private stopLink(): void {
		if (this.linkTimer) {
			clearInterval(this.linkTimer);
			this.linkTimer = null;
		}
		this.link = null;
	}

	/** Stops waiting for a code. */
	cancelLink(): void {
		this.stopLink();
		this.status = this.settings.token ? "ok" : "setup";
		this.changed();
	}

	/** Connects with a key made in the browser (Account -> Devices). */
	async useKey(rawUrl: string, key: string): Promise<void> {
		this.stopLink();
		this.lastError = "";
		const url = Connection.normalise(rawUrl);
		if (!url) {
			this.lastError = "no-url";
			this.changed();
			return;
		}
		try {
			await this.hello(url);
			await this.save({ url, token: key.trim() });
			await this.refresh();
			if (this.status === "ok" && this.state) {
				await this.save({ url, token: key.trim(), player: this.state.me.name });
			} else if (this.status === "signed-out") {
				await this.save({ url });
				this.lastError = "key-wrong";
				this.status = "setup";
			}
		} catch (e) {
			this.lastError = (e as Error).message;
		}
		this.changed();
	}

	/** Signs this Stream Deck out at MRadmin and forgets the key. */
	async disconnect(): Promise<void> {
		this.stopLink();
		try {
			await this.request("POST", "/deck/logout");
		} catch {
			// gone anyway
		}
		await this.save({ url: this.settings.url });
		this.state = null;
		this.status = "setup";
		this.changed();
	}

	/** Opens a page of the web interface (path like "/admin/community/tickets") in the browser. */
	async open(path = "/"): Promise<void> {
		const base = this.state?.url || this.settings.url;
		if (base) {
			await streamDeck.system.openUrl(base + path);
		}
	}
}

export const connection = new Connection();
