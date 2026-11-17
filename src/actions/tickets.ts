import { action } from "@elgato/streamdeck";
import type { DeckState } from "../lib/connection";
import { t } from "../lib/i18n";
import type { Tile } from "../lib/render";
import { MRadminAction } from "./base";

type Settings = { mode?: "auto" | "team" | "mine" };

/**
 * Tickets: for the team the open tickets of the server (unread ones in yellow), for players their own (a new answer in
 * blue). "auto" picks the team view when the player may see the tickets of the server.
 */
@action({ UUID: "at.marcelr.mradmin.tickets" })
export class TicketsAction extends MRadminAction<Settings> {
	private team(state: DeckState, settings: Settings): boolean {
		const mode = settings.mode ?? "auto";
		return mode === "team" || (mode === "auto" && !!state.team?.tickets);
	}

	protected override view(state: DeckState, settings: Settings): Tile | null {
		if (this.team(state, settings)) {
			const tickets = state.team?.tickets;
			if (!tickets) {
				return null;
			}
			return {
				icon: "ticket",
				title: t("tickets.title"),
				value: String(tickets.open),
				detail: tickets.unread > 0 ? t("tickets.unread", { n: tickets.unread }) : tickets.open > 0 ? t("tickets.open") : t("tickets.none"),
				tone: tickets.unread > 0 ? "warn" : tickets.open > 0 ? "info" : "good",
			};
		}
		const mine = state.myTickets;
		if (!mine) {
			return null;
		}
		return {
			icon: "ticket",
			title: t("tickets.myTitle"),
			value: String(mine.open),
			detail: mine.unread > 0 ? t("tickets.answer") : mine.open > 0 ? t("tickets.open") : t("tickets.none"),
			tone: mine.unread > 0 ? "info" : mine.open > 0 ? "good" : "off",
		};
	}

	protected override page(state: DeckState, settings: Settings): string {
		return this.team(state, settings) ? "/admin/community/tickets" : "/news/tickets";
	}
}
