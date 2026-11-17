import { action } from "@elgato/streamdeck";
import { connection, type DeckState } from "../lib/connection";
import { countdown, decimal } from "../lib/format";
import { lang, t } from "../lib/i18n";
import type { Tile } from "../lib/render";
import { MRadminAction } from "./base";

/**
 * Server overview: players online, and what is going on - a maintenance, a restart countdown, for the team the TPS.
 * Press = the start page (team: the administration).
 */
@action({ UUID: "at.marcelr.mradmin.server" })
export class ServerAction extends MRadminAction {
	protected override view(state: DeckState): Tile | null {
		const server = state.server;
		if (!server) {
			return null;
		}
		const tile: Tile = { icon: "server", title: state.serverName || t("server.title"), value: `${server.online}/${server.max}`,
			detail: t("server.players"), tone: "good" };
		const tps = state.team?.server?.tps?.[0];
		if (tps !== undefined) {
			tile.detail = `${decimal(tps, lang())} TPS`;
			tile.tone = tps < 15 ? "bad" : tps < 18 ? "warn" : "good";
		}
		const restart = state.restart;
		if (restart?.countdown) {
			tile.detail = `${t(restart.restart ? "server.restart" : "server.stop")} ${countdown(restart.at - connection.now())}`;
			tile.tone = "warn";
		}
		if (state.maintenance?.phase === "active") {
			tile.detail = t("server.maintenance");
			tile.tone = "warn";
		}
		return tile;
	}

	protected override page(state: DeckState): string {
		return state.me.team ? "/admin" : "/";
	}
}
