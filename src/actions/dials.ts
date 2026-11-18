import {
	action,
	type DialAction as Dial,
	type DialDownEvent,
	type DialRotateEvent,
	SingletonAction,
	type TouchTapEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { connection, type DeckState, type DeckTile } from "../lib/connection";
import { countdown, decimal } from "../lib/format";
import { lang, t } from "../lib/i18n";
import { renderDial, tone } from "../lib/render";
import { dialChart, dialList, dialValue } from "../lib/render-dial";

/** How long a second press counts as confirmation. */
const CONFIRM_MILLIS = 5_000;

type Entry<S extends JsonObject> = { action: Dial<S>; settings: S; index: number; asked: number };

/**
 * A dial of the Stream Deck + with its part of the touch strip: draws itself from the state of the connection,
 * turning changes {@code index}, pressing or tapping calls {@link press}. Not connected: the same notes as the keys.
 */
abstract class MRadminDial<S extends JsonObject = JsonObject> extends SingletonAction<S> {
	protected shown = new Map<string, Entry<S>>();

	constructor() {
		super();
		connection.onChange(() => {
			for (const entry of this.shown.values()) {
				void this.draw(entry);
			}
		});
	}

	/** The picture of the touch strip when connected. */
	protected abstract picture(state: DeckState, entry: Entry<S>): string;

	/** Pressing or tapping when connected - by default opens {@link page}. */
	protected async press(entry: Entry<S>, state: DeckState): Promise<void> {
		await connection.open(this.page(state, entry));
	}

	protected page(_state: DeckState, _entry: Entry<S>): string {
		return "/";
	}

	/** How many places turning goes through (0 = turning does nothing). */
	protected places(_state: DeckState, _entry: Entry<S>): number {
		return 0;
	}

	protected async draw(entry: Entry<S>): Promise<void> {
		const state = connection.state;
		let picture: string;
		if (connection.status !== "ok" || !state) {
			const value = connection.status === "linking" ? connection.link?.code ?? "…"
				: t(connection.status === "offline" ? "offline.value" : connection.status === "setup" ? "setup.value" : "noPermission.value");
			picture = renderDial({ icon: "link", title: t("setup.title"), value, tone: "info" }, 0, 1);
		} else {
			picture = this.picture(state, entry);
		}
		await entry.action.setFeedback({ canvas: picture });
	}

	/** Second press within 5 seconds? Otherwise the strip lights up and asks. */
	protected confirm(entry: Entry<S>): boolean {
		if (entry.asked > Date.now()) {
			entry.asked = 0;
			return true;
		}
		entry.asked = Date.now() + CONFIRM_MILLIS;
		void this.draw(entry);
		setTimeout(() => void this.draw(entry), CONFIRM_MILLIS + 50);
		return false;
	}

	protected asking(entry: Entry<S>): boolean {
		return entry.asked > Date.now();
	}

	protected async act(entry: Entry<S>, body: Record<string, unknown>): Promise<void> {
		const refused = await connection.press(body);
		if (refused) {
			await entry.action.showAlert();
		}
	}

	override async onWillAppear(ev: WillAppearEvent<S>): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}
		await ev.action.setFeedbackLayout("layouts/dial.json");
		const entry: Entry<S> = { action: ev.action, settings: ev.payload.settings, index: 0, asked: 0 };
		this.shown.set(ev.action.id, entry);
		connection.show();
		await this.draw(entry);
	}

	override onWillDisappear(ev: WillDisappearEvent<S>): void {
		if (this.shown.delete(ev.action.id)) {
			connection.hide();
		}
	}

	override async onDialRotate(ev: DialRotateEvent<S>): Promise<void> {
		const entry = this.shown.get(ev.action.id);
		const state = connection.state;
		if (!entry || !state) {
			return;
		}
		const places = this.places(state, entry);
		if (places > 0) {
			entry.index = (((entry.index + ev.payload.ticks) % places) + places) % places;
			entry.asked = 0;
			await this.draw(entry);
		}
	}

	private async pressed(id: string): Promise<void> {
		const entry = this.shown.get(id);
		const state = connection.state;
		if (!entry) {
			return;
		}
		if (connection.status === "linking" && connection.link?.url) {
			await connection.open(connection.link.url.replace(/^https?:\/\/[^/]+/, ""));
			return;
		}
		if (connection.status !== "ok" || !state) {
			await connection.refresh();
			return;
		}
		await this.press(entry, state);
	}

	override async onDialDown(ev: DialDownEvent<S>): Promise<void> {
		await this.pressed(ev.action.id);
	}

	override async onTouchTap(ev: TouchTapEvent<S>): Promise<void> {
		await this.pressed(ev.action.id);
	}
}

// ------------------------------------------------------------------ performance

const METRICS = ["tps", "mspt", "ram"] as const;

/** Performance live (team): a wide curve of the last ten minutes - turning switches TPS, tick time and RAM. */
@action({ UUID: "at.marcelr.mradmin.dial-performance" })
export class PerformanceDial extends MRadminDial {
	protected override places(): number {
		return METRICS.length;
	}

	protected override picture(state: DeckState, entry: Entry<JsonObject>): string {
		const server = state.team?.server;
		const history = state.team?.history;
		if (!server || !history) {
			return dialValue("pulse", t("perf.title"), t("noPermission.value"), "off");
		}
		const metric = METRICS[entry.index];
		if (metric === "mspt") {
			const v = server.mspt;
			return dialChart("pulse", `${t("perf.title")} · ms/Tick`, decimal(v, lang()), v >= 50 ? "bad" : v >= 40 ? "warn" : "good",
				history.mspt, t("dial.tenMinutes"));
		}
		if (metric === "ram") {
			const share = server.ramMax > 0 ? Math.round((server.ramUsed * 100) / server.ramMax) : 0;
			return dialChart("pulse", `${t("perf.title")} · RAM`, `${share} %`, share >= 95 ? "bad" : share >= 85 ? "warn" : "good",
				history.ram ?? [], `${(server.ramUsed / 1024).toFixed(1)} / ${(server.ramMax / 1024).toFixed(1)} GB`, [0, 100]);
		}
		const tps = server.tps[0];
		return dialChart("pulse", `${t("perf.title")} · TPS`, decimal(tps, lang()), tps < 15 ? "bad" : tps < 18 ? "warn" : "good",
			history.tps, t("dial.tenMinutes"), [Math.min(15, ...history.tps), 20]);
	}

	protected override page(): string {
		return "/admin/server/performance";
	}
}

// ------------------------------------------------------------------ chunk loaders

/** Chunk loaders: turning goes through the player's loaders, pressing switches the one shown (with approval). */
@action({ UUID: "at.marcelr.mradmin.dial-chunkloader" })
export class ChunkloaderDial extends MRadminDial {
	private loaders(state: DeckState): DeckTile[] {
		return state.tiles.filter((tile) => tile.kind === "chunkloader");
	}

	protected override places(state: DeckState): number {
		return this.loaders(state).length;
	}

	protected override picture(state: DeckState, entry: Entry<JsonObject>): string {
		const list = this.loaders(state);
		const tile = list[Math.min(entry.index, list.length - 1)];
		if (!tile) {
			return dialValue("grid", "Chunkloader", "–", "off", t("dial.noLoaders"));
		}
		const position = `${Math.min(entry.index, list.length - 1) + 1}/${list.length}`;
		const detail = !state.me.control ? `${tile.detail} · ${t("viewOnly")}` : tile.detail;
		return dialValue("grid", `${tile.title}  ${position}`, tile.value, tone(tile.tone), detail);
	}

	protected override async press(entry: Entry<JsonObject>, state: DeckState): Promise<void> {
		const list = this.loaders(state);
		const tile = list[Math.min(entry.index, list.length - 1)];
		if (!tile || !tile.pressable || !state.me.control) {
			await entry.action.showAlert();
			return;
		}
		await this.act(entry, { action: "module", module: tile.module, tile: tile.id });
	}
}

// ------------------------------------------------------------------ restart

/**
 * Restart (team): turning chooses the countdown (the server's normal restart times), pressing twice starts it; while
 * one runs, the strip shows the time left as a bar and pressing twice cancels it.
 */
@action({ UUID: "at.marcelr.mradmin.dial-restart" })
export class RestartDial extends MRadminDial {
	/** Start of the countdown as seen here (for the bar). */
	private started = 0;
	private total = 0;

	private minutes(state: DeckState): number[] {
		return (state.team?.restartControl?.delays ?? []).map((d) => d / 60_000).filter((m) => m > 0);
	}

	protected override places(state: DeckState): number {
		return state.restart?.countdown ? 0 : this.minutes(state).length;
	}

	protected override picture(state: DeckState, entry: Entry<JsonObject>): string {
		const control = state.team?.restartControl;
		if (!control) {
			return dialValue("power", t("restart.title"), t("noPermission.value"), "off");
		}
		const ask = this.asking(entry);
		if (state.restart?.countdown) {
			const left = state.restart.at - connection.now();
			if (!this.started || left > this.total) {
				this.started = connection.now();
				this.total = Math.max(left, 1);
			}
			return dialValue("power", t("restart.title"), countdown(left), "warn",
				ask ? t("admin.ask") : t("dial.cancelTwice"), left / this.total, ask);
		}
		this.started = 0;
		if (!control.enabled || control.roomRestarting) {
			return dialValue("power", t("restart.title"), "–", "off", t("restart.disabled"));
		}
		const choices = this.minutes(state);
		const minutes = choices[Math.min(entry.index, choices.length - 1)] ?? 15;
		const detail = !state.me.control ? t("viewOnly") : ask ? t("admin.ask") : t("dial.turnPress");
		return dialValue("power", t("restart.title"), `${minutes} min`, "info", detail, undefined, ask);
	}

	protected override async press(entry: Entry<JsonObject>, state: DeckState): Promise<void> {
		const control = state.team?.restartControl;
		if (!control || !state.me.control || (!state.restart?.countdown && (!control.enabled || control.roomRestarting))) {
			await entry.action.showAlert();
			return;
		}
		if (!this.confirm(entry)) {
			return;
		}
		if (state.restart?.countdown) {
			await this.act(entry, { action: "restart-cancel" });
		} else {
			const choices = this.minutes(state);
			const minutes = choices[Math.min(entry.index, choices.length - 1)] ?? 15;
			await this.act(entry, { action: "restart", delay: String(minutes * 60_000) });
		}
	}
}

// ------------------------------------------------------------------ players

/** Players online with their heads, turning scrolls; for the team with ping and world. Press opens the start page. */
@action({ UUID: "at.marcelr.mradmin.dial-players" })
export class PlayersDial extends MRadminDial {
	protected override places(state: DeckState): number {
		return Math.max(1, (state.players?.length ?? 0) - 2);
	}

	protected override picture(state: DeckState, entry: Entry<JsonObject>): string {
		const players = state.players ?? [];
		const start = Math.min(entry.index, Math.max(0, players.length - 3));
		const rows = players.slice(start, start + 3).map((p) => ({
			image: connection.head(p.uuid),
			name: p.name,
			info: p.ping !== undefined ? `${p.ping} ms · ${p.world ?? ""}` : undefined,
		}));
		const server = state.server;
		return dialList("users", t("dial.players"), players.length > 0 ? "good" : "off", rows,
			server ? `${server.online}/${server.max}` : "", t("dial.nobody"));
	}

	protected override page(state: DeckState): string {
		return state.me.team ? "/admin/community/players" : "/";
	}
}
