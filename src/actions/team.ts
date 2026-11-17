import { type Action, action } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { connection, type DeckState } from "../lib/connection";
import { countdown, decimal } from "../lib/format";
import { lang, t, type TextKey } from "../lib/i18n";
import type { Tile, Tone } from "../lib/render";
import { MRadminAction } from "./base";

const clock = (millis: number) =>
	new Date(millis).toLocaleTimeString(lang() === "de" ? "de-AT" : "en-GB", { hour: "2-digit", minute: "2-digit" });

/** Performance: TPS (or tick time, RAM) with the curve of the last ten minutes. */
@action({ UUID: "at.marcelr.mradmin.performance" })
export class PerformanceAction extends MRadminAction<{ metric?: "tps" | "mspt" | "ram" }> {
	protected override view(state: DeckState, settings: { metric?: string }): Tile | null {
		const server = state.team?.server;
		if (!server) {
			return null;
		}
		const history = state.team?.history;
		const metric = settings.metric ?? "tps";
		if (metric === "ram") {
			const share = server.ramMax > 0 ? Math.round((server.ramUsed * 100) / server.ramMax) : 0;
			return { icon: "pulse", title: t("perf.title"), value: `${share} %`,
				detail: `${t("perf.ram")} ${(server.ramUsed / 1024).toFixed(1)}/${(server.ramMax / 1024).toFixed(1)} GB`,
				tone: share >= 95 ? "bad" : share >= 85 ? "warn" : "good" };
		}
		if (metric === "mspt") {
			return { icon: "pulse", title: t("perf.title"), value: `${decimal(server.mspt, lang())}`, detail: "ms / Tick",
				tone: server.mspt >= 50 ? "bad" : server.mspt >= 40 ? "warn" : "good", chart: history?.mspt };
		}
		const tps = server.tps[0];
		return { icon: "pulse", title: t("perf.title"), value: decimal(tps, lang()),
			detail: `TPS · ${Math.round(server.mspt)} ms`, tone: tps < 15 ? "bad" : tps < 18 ? "warn" : "good", chart: history?.tps };
	}

	protected override page(): string {
		return "/admin/server/performance";
	}
}

/** Warnings of the dashboard (server, tickets, plugins, maintenance ...): how many, the most urgent one below. */
@action({ UUID: "at.marcelr.mradmin.alerts" })
export class AlertsAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		const alerts = state.team?.alerts;
		if (!alerts) {
			return null;
		}
		const urgent = alerts.filter((a) => a.tone === "bad" || a.tone === "warn");
		const first = alerts[0];
		const text = first ? first.text ?? t(("alert." + first.key) as TextKey) : t("alerts.none");
		const tone: Tone = urgent.some((a) => a.tone === "bad") ? "bad" : urgent.length ? "warn" : alerts.length ? "info" : "good";
		return { icon: "alert", title: t("alerts.title"), value: String(alerts.length), detail: text, tone };
	}

	protected override page(): string {
		return "/admin";
	}
}

/** Maintenance: running (until when), coming (in how long) or none. */
@action({ UUID: "at.marcelr.mradmin.maintenance" })
export class MaintenanceAction extends MRadminAction {
	protected override view(state: DeckState): Tile {
		const m = state.team?.maintenance ?? state.maintenance;
		if (m?.phase === "active") {
			return { icon: "tool", title: t("maint.title"), value: t("maint.active"),
				detail: m.end ? t("maint.until", { time: clock(m.end) }) : m.title ?? "", tone: "warn" };
		}
		if ((m?.phase === "upcoming" || m?.phase === "planned") && m.start) {
			return { icon: "tool", title: t("maint.title"), value: countdown(m.start - connection.now()),
				detail: m.title || clock(m.start), tone: "info" };
		}
		return { icon: "tool", title: t("maint.title"), value: t("maint.none"), tone: "off" };
	}

	protected override page(state: DeckState): string {
		return state.me.team ? "/admin/server/maintenance" : "/";
	}
}

/** The waiting room server: online, restarting or gone, how many are waiting. */
@action({ UUID: "at.marcelr.mradmin.waitroom" })
export class WaitroomAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		if (!state.team) {
			return null;
		}
		const room = state.team.room;
		if (!room) {
			return { icon: "users", title: t("room.title"), value: "–", detail: t("room.none"), tone: "off" };
		}
		const value = room.restarting ? t("room.restarting") : room.online ? t("room.online") : t("room.offline");
		return { icon: "users", title: t("room.title"), value, detail: t("room.waiting", { n: room.players ?? 0 }),
			tone: room.restarting ? "warn" : room.online ? "good" : "bad" };
	}

	protected override page(): string {
		return "/admin/server/room";
	}
}

/** Staff chat: messages since the last press, the newest below. Press = marked as read. */
@action({ UUID: "at.marcelr.mradmin.staffchat" })
export class StaffChatAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		const chat = state.team?.staffChat;
		if (!chat) {
			return null;
		}
		return { icon: "chat", title: t("chat.title"), value: String(chat.unread),
			detail: chat.unread > 0 && chat.last ? `${chat.last.from}: ${chat.last.text}` : t("chat.none"),
			tone: chat.unread > 0 ? "info" : "off" };
	}

	protected override async pressed(action: Action<{}>): Promise<void> {
		await this.act(action, { action: "staffchat-seen" });
	}
}

/** Admin mode on/off (only while online in game) - press twice. */
@action({ UUID: "at.marcelr.mradmin.adminmode" })
export class AdminModeAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		const mode = state.team?.adminMode;
		if (!mode) {
			return null;
		}
		if (!mode.online) {
			return { icon: "shield", title: t("admin.title"), value: "–", detail: t("admin.offline"), tone: "off" };
		}
		const tile: Tile = { icon: "shield", title: t("admin.title"), value: t(mode.active ? "admin.on" : "admin.off"),
			tone: mode.active ? "good" : "off" };
		return this.mayControl(state) ? tile : this.viewOnly(tile);
	}

	protected override async pressed(action: Action<{}>, state: DeckState): Promise<void> {
		if (!state.team?.adminMode?.online || !this.mayControl(state)) {
			await this.refuse(action);
			return;
		}
		if (this.confirm(action, {})) {
			await this.act(action, { action: "admin-mode" });
		}
	}
}

type RestartSettings = { minutes?: string };

/** Restart with the countdown chosen in the settings (15/30/60 min) - press twice; while one runs, press twice cancels it. */
@action({ UUID: "at.marcelr.mradmin.restart" })
export class RestartAction extends MRadminAction<RestartSettings> {
	private minutes(state: DeckState, settings: RestartSettings): number {
		const delays = (state.team?.restartControl?.delays ?? []).map((d) => d / 60_000).filter((m) => m > 0);
		const wanted = Number(settings.minutes ?? 15);
		return delays.includes(wanted) ? wanted : delays[0] ?? 15;
	}

	protected override view(state: DeckState, settings: RestartSettings): Tile | null {
		const control = state.team?.restartControl;
		if (!control) {
			return null;
		}
		if (state.restart?.countdown) {
			return { icon: "power", title: t("restart.title"), value: countdown(state.restart.at - connection.now()),
				detail: t("restart.cancel"), tone: "warn" };
		}
		if (!control.enabled || control.roomRestarting) {
			return { icon: "power", title: t("restart.title"), value: "–", detail: t("restart.disabled"), tone: "off" };
		}
		const minutes = this.minutes(state, settings);
		const tile: Tile = { icon: "power", title: t("restart.title"), value: `${minutes} min`, detail: t("restart.twice"), tone: "info" };
		return this.mayControl(state) ? tile : this.viewOnly(tile);
	}

	protected override async pressed(action: Action<RestartSettings>, state: DeckState, settings: RestartSettings): Promise<void> {
		const control = state.team?.restartControl;
		if (!control || !this.mayControl(state) || (!state.restart?.countdown && (!control.enabled || control.roomRestarting))) {
			await this.refuse(action);
			return;
		}
		if (!this.confirm(action, settings)) {
			return;
		}
		if (state.restart?.countdown) {
			await this.act(action, { action: "restart-cancel" });
		} else {
			await this.act(action, { action: "restart", delay: String(this.minutes(state, settings) * 60_000) });
		}
	}

	protected override options(state: DeckState | null): JsonValue {
		return { minutes: (state?.team?.restartControl?.delays ?? []).map((d) => d / 60_000).filter((m) => m > 0) };
	}
}

/** Sends an announcement template of the server (one without values to fill in) - press twice. */
@action({ UUID: "at.marcelr.mradmin.announce" })
export class AnnounceAction extends MRadminAction<{ preset?: string }> {
	protected override view(state: DeckState, settings: { preset?: string }): Tile | null {
		const list = state.team?.announce;
		if (!list) {
			return null;
		}
		const preset = list.find((p) => p.name === settings.preset && !p.values);
		const tile: Tile = { icon: "megaphone", title: t("announce.title"), value: preset ? preset.name : "–",
			detail: preset ? "" : t("announce.choose"), tone: preset ? "info" : "off" };
		return preset && !this.mayControl(state) ? this.viewOnly(tile) : tile;
	}

	protected override async pressed(action: Action<{ preset?: string }>, state: DeckState, settings: { preset?: string }): Promise<void> {
		const ok = state.team?.announce?.some((p) => p.name === settings.preset && !p.values);
		if (!ok || !this.mayControl(state)) {
			await this.refuse(action);
			return;
		}
		if (this.confirm(action, settings)) {
			await this.act(action, { action: "announce", preset: settings.preset });
		}
	}

	protected override options(state: DeckState | null): JsonValue {
		return { presets: (state?.team?.announce ?? []).filter((p) => !p.values).map((p) => p.name) };
	}
}
