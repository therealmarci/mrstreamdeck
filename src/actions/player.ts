import { action } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import { connection, type DeckState } from "../lib/connection";
import { countdown } from "../lib/format";
import { lang, t } from "../lib/i18n";
import type { Tile } from "../lib/render";
import { MRadminAction } from "./base";

/** Inbox: unread notifications (news, changelogs, answers, team notices) - red on a crash. */
@action({ UUID: "at.marcelr.mradmin.inbox" })
export class InboxAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		const inbox = state.inbox;
		if (!inbox) {
			return null;
		}
		return {
			icon: "mail",
			title: t("inbox.title"),
			value: String(inbox.unread),
			detail: inbox.alarm ? t("inbox.alarm") : inbox.unread > 0 ? t("inbox.unread") : t("inbox.none"),
			tone: inbox.alarm ? "bad" : inbox.unread > 0 ? "info" : "off",
		};
	}
}

/** What comes next: a restart or stop countdown, a planned restart, a maintenance (running or coming). */
@action({ UUID: "at.marcelr.mradmin.countdown" })
export class CountdownAction extends MRadminAction {
	protected override view(state: DeckState): Tile {
		const now = connection.now();
		const maintenance = state.maintenance;
		if (maintenance?.phase === "active") {
			return { icon: "tool", title: t("countdown.title"), value: maintenance.end ? countdown(maintenance.end - now) : "∞",
				detail: t("countdown.maintenanceNow"), tone: "warn" };
		}
		const restart = state.restart;
		const soonMaintenance = maintenance && (maintenance.phase === "upcoming" || maintenance.phase === "planned") && maintenance.start
			? maintenance.start : 0;
		if (restart && (!soonMaintenance || restart.at < soonMaintenance)) {
			return {
				icon: "power",
				title: t("countdown.title"),
				value: countdown(restart.at - now),
				detail: t(restart.restart ? "countdown.restart" : "countdown.stop") + (restart.countdown ? "" : " · " + t("countdown.planned")),
				tone: restart.countdown ? "warn" : "info",
			};
		}
		if (soonMaintenance) {
			return { icon: "tool", title: t("countdown.title"), value: countdown(soonMaintenance - now),
				detail: t("countdown.maintenance"), tone: "info" };
		}
		return { icon: "clock", title: t("countdown.title"), value: t("countdown.none"), detail: t("countdown.nothing"), tone: "off" };
	}
}

/** Names of the game's statistics (keys of MRadmin's VanillaStats). */
const STATS: Record<string, { de: string; en: string }> = {
	"play-time": { de: "Spielzeit", en: "Play time" },
	"blocks-mined": { de: "Abgebaut", en: "Mined" },
	"blocks-placed": { de: "Gebaut", en: "Placed" },
	"mob-kills": { de: "Mobs besiegt", en: "Mob kills" },
	"xp-level": { de: "XP-Level", en: "XP level" },
	deaths: { de: "Tode", en: "Deaths" },
	distance: { de: "Gelaufen", en: "Walked" },
	"distance-swum": { de: "Geschwommen", en: "Swum" },
	"distance-flown": { de: "Geflogen", en: "Flown" },
	"fish-caught": { de: "Fische", en: "Fish" },
	jumps: { de: "Sprünge", en: "Jumps" },
	"items-crafted": { de: "Hergestellt", en: "Crafted" },
	totems: { de: "Totems", en: "Totems" },
	"times-slept": { de: "Geschlafen", en: "Slept" },
};

const statName = (key: string) => STATS[key]?.[lang()] ?? key;

/** One of the own game statistics (chosen in the settings of the key). */
@action({ UUID: "at.marcelr.mradmin.stats" })
export class StatsAction extends MRadminAction<{ stat?: string }> {
	protected override view(state: DeckState, settings: { stat?: string }): Tile | null {
		if (!state.stats) {
			return null;
		}
		const key = settings.stat ?? "play-time";
		const stat = state.stats.find((s) => s.key === key);
		return { icon: "chart", title: t("stats.title"), value: stat?.value ?? "–", detail: statName(key), tone: "info" };
	}

	protected override page(): string {
		return "/stats";
	}

	protected override options(state: DeckState | null): JsonValue {
		return { stats: (state?.stats ?? []).map((s) => ({ value: s.key, label: statName(s.key) })) };
	}
}

/** Sleep vote in the player's world (or the main world): sleeping / needed, only at night. */
@action({ UUID: "at.marcelr.mradmin.sleep" })
export class SleepAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		const sleep = state.sleep;
		if (!sleep) {
			return null;
		}
		if (!sleep.night) {
			return { icon: "moon", title: t("sleep.title"), value: t("sleep.day"), detail: sleep.world, tone: "off" };
		}
		return {
			icon: "moon",
			title: t("sleep.title"),
			value: `${sleep.sleeping}/${sleep.needed}`,
			detail: t("sleep.night", { world: sleep.world }),
			tone: sleep.needed > 0 && sleep.sleeping >= sleep.needed ? "good" : "info",
		};
	}
}
