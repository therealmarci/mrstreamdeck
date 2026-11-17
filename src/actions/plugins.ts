import { type Action, action } from "@elgato/streamdeck";
import type { JsonValue } from "@elgato/utils";
import type { DeckState, DeckTile } from "../lib/connection";
import { t } from "../lib/i18n";
import { type Icon, type Tile, tone } from "../lib/render";
import { MRadminAction } from "./base";

type Settings = { tile?: string };

const ICONS: Record<string, Icon> = { mrchunks: "grid", mrpvp: "swords", mrsleep: "moon", mrwaypoints: "pin" };

/**
 * A key a plugin offers through MRadmin (module API 17): the plugin decides what it shows and what a press does. The
 * settings choose which of the plugin's keys (e.g. which chunk loader); subclasses limit the choice to their kinds.
 */
abstract class PluginTileAction extends MRadminAction<Settings> {
	/** Kinds of keys this action offers (empty = all). */
	protected abstract kinds: string[];
	/** Symbol and title while nothing is there to choose. */
	protected abstract icon: Icon;
	protected abstract empty: string;

	private matching(state: DeckState | null): DeckTile[] {
		return (state?.tiles ?? []).filter((tile) => this.kinds.length === 0 || this.kinds.includes(tile.kind));
	}

	private chosen(state: DeckState, settings: Settings): DeckTile | undefined {
		const list = this.matching(state);
		return settings.tile ? list.find((tile) => `${tile.module}/${tile.id}` === settings.tile) : list[0];
	}

	protected override view(state: DeckState, settings: Settings): Tile | null {
		const tile = this.chosen(state, settings);
		if (!tile) {
			if (this.matching(state).length === 0 && !settings.tile) {
				return null;
			}
			return { icon: this.icon, title: this.empty, value: "–", detail: t("tile.none"), tone: "off" };
		}
		const shown: Tile = { icon: ICONS[tile.module] ?? this.icon, title: tile.title, value: tile.value, detail: tile.detail, tone: tone(tile.tone) };
		return tile.pressable && !this.mayControl(state) ? this.viewOnly(shown) : shown;
	}

	protected override async pressed(action: Action<Settings>, state: DeckState, settings: Settings): Promise<void> {
		const tile = this.chosen(state, settings);
		if (!tile) {
			if (action.isKey()) {
				await action.showAlert();
			}
			return;
		}
		if (!tile.pressable) {
			await super.pressed(action, state, settings);
			return;
		}
		if (!this.mayControl(state)) {
			await this.refuse(action);
			return;
		}
		if (tile.confirm && !this.confirm(action, settings)) {
			return;
		}
		await this.act(action, { action: "module", module: tile.module, tile: tile.id });
	}

	protected override page(state: DeckState, settings: Settings): string {
		return this.chosen(state, settings)?.link ?? "/";
	}

	protected override options(state: DeckState | null): JsonValue {
		return { tiles: this.matching(state).map((tile) => ({ value: `${tile.module}/${tile.id}`, label: `${tile.title} (${tile.module})` })) };
	}
}

/** Chunk loader on/off (MRchunks): one of the player's loaders, press switches it. */
@action({ UUID: "at.marcelr.mradmin.chunkloader" })
export class ChunkloaderAction extends PluginTileAction {
	protected kinds = ["chunkloader"];
	protected icon: Icon = "grid";
	protected empty = "Chunkloader";
}

/** Warnings of the chunk loaders for the team (MRchunks): locked, disabled by lag, conspicuous. */
@action({ UUID: "at.marcelr.mradmin.chunkwarnings" })
export class ChunkWarningsAction extends PluginTileAction {
	protected kinds = ["chunk-warnings"];
	protected icon: Icon = "grid";
	protected empty = "Chunkloader";
}

/** Last duel or own duel record (MRpvp). */
@action({ UUID: "at.marcelr.mradmin.duel" })
export class DuelAction extends PluginTileAction {
	protected kinds = ["duel", "duel-stats"];
	protected icon: Icon = "swords";
	protected empty = "Duell";
}

/** Rounds waiting for a review (MRpvp, team). */
@action({ UUID: "at.marcelr.mradmin.review" })
export class ReviewAction extends PluginTileAction {
	protected kinds = ["review"];
	protected icon: Icon = "swords";
	protected empty = "Review";
}

/** Any key of any plugin (also plugins that come later). */
@action({ UUID: "at.marcelr.mradmin.plugin" })
export class PluginAction extends PluginTileAction {
	protected kinds: string[] = [];
	protected icon: Icon = "box";
	protected empty = "Plugin";
}
