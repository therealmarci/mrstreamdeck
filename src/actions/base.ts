import streamDeck, {
	type Action,
	type DidReceiveSettingsEvent,
	type KeyDownEvent,
	type PropertyInspectorDidAppearEvent,
	type SendToPluginEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";
import type { JsonObject, JsonValue } from "@elgato/utils";
import { connection, type DeckState } from "../lib/connection";
import { t } from "../lib/i18n";
import { render, type Tile } from "../lib/render";

/** How long a second press counts as confirmation. */
const CONFIRM_MILLIS = 5_000;

/**
 * Every MRadmin key: draws itself from the state of the connection (every few seconds while visible), shows set-up,
 * code, offline and signed-out states the same way, and answers the settings window (connect, key, sign out).
 * Subclasses only say what they show ({@link view}) and what a press does ({@link pressed}).
 */
export abstract class MRadminAction<S extends JsonObject = JsonObject> extends SingletonAction<S> {
	private shown = new Map<string, { action: Action<S>; settings: S }>();
	private asked = new Map<string, number>();

	constructor() {
		super();
		connection.onChange(() => {
			this.drawAll();
			void this.status();
		});
	}

	/** What the key shows when connected; null = the player may not see it (key shows "no right"). */
	protected abstract view(state: DeckState, settings: S): Tile | null;

	/** A press while connected - by default opens {@link page} in the browser. */
	protected async pressed(action: Action<S>, state: DeckState, settings: S): Promise<void> {
		await connection.open(this.page(state, settings));
	}

	/** The page of the web interface the key opens. */
	protected page(_state: DeckState, _settings: S): string {
		return "/";
	}

	/** Extra things for the settings window of this key (e.g. the chunk loaders to choose from). */
	protected options(_state: DeckState | null): JsonValue {
		return null;
	}

	// --------------------------------------------------------------- drawing

	private drawAll(): void {
		for (const { action, settings } of this.shown.values()) {
			void this.draw(action, settings);
		}
	}

	protected async draw(action: Action<S>, settings: S): Promise<void> {
		if (!action.isKey()) {
			return;
		}
		const tile = this.tile(settings, action.id);
		await action.setImage(render(tile));
		await action.setTitle("");
	}

	private tile(settings: S, id: string): Tile {
		switch (connection.status) {
			case "setup":
				return { icon: "link", title: t("setup.title"), value: t("setup.value"), detail: t("setup.detail"), tone: "info" };
			case "linking":
				return { icon: "link", title: t("link.title"), value: connection.link?.code ?? "…", detail: t("link.detail"), tone: "info" };
			case "offline":
				return { icon: "server", title: t("setup.title"), value: t("offline.value"), detail: t("offline.detail"), tone: "off" };
			case "signed-out":
				return { icon: "link", title: t("setup.title"), value: t("signedOut.value"), detail: t("signedOut.detail"), tone: "warn" };
			case "no-permission":
				return { icon: "shield", title: t("setup.title"), value: t("noPermission.value"), detail: "mradmin.deck", tone: "off" };
			case "off":
				return { icon: "server", title: t("setup.title"), value: t("off.value"), detail: t("off.detail"), tone: "off" };
		}
		const state = connection.state;
		const tile = state ? this.view(state, settings) : null;
		if (!tile) {
			return { icon: "shield", title: t("setup.title"), value: t("noPermission.value"), tone: "off" };
		}
		const until = this.asked.get(id) ?? 0;
		return until > Date.now() ? { ...tile, flash: true } : tile;
	}

	// --------------------------------------------------------- confirmation

	/**
	 * For keys with an effect: the first press asks (the key lights up for 5 seconds), the second within that time
	 * confirms. @returns whether this press is the confirmation
	 */
	protected confirm(action: Action<S>, settings: S): boolean {
		const until = this.asked.get(action.id) ?? 0;
		if (until > Date.now()) {
			this.asked.delete(action.id);
			return true;
		}
		this.asked.set(action.id, Date.now() + CONFIRM_MILLIS);
		void this.draw(action, settings);
		setTimeout(() => {
			if ((this.asked.get(action.id) ?? 0) <= Date.now()) {
				this.asked.delete(action.id);
				void this.draw(action, settings);
			}
		}, CONFIRM_MILLIS + 50);
		return false;
	}

	/** Runs a press at MRadmin and shows the result (tick or warning triangle). */
	protected async act(action: Action<S>, body: Record<string, unknown>): Promise<void> {
		const refused = await connection.press(body);
		if (!action.isKey()) {
			return;
		}
		if (refused) {
			streamDeck.logger.warn(`Press refused: ${refused}`);
			await action.showAlert();
		} else {
			await action.showOk();
		}
	}

	// --------------------------------------------------------------- events

	override async onWillAppear(ev: WillAppearEvent<S>): Promise<void> {
		this.shown.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
		connection.show();
		await this.draw(ev.action, ev.payload.settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<S>): void {
		if (this.shown.delete(ev.action.id)) {
			connection.hide();
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<S>): Promise<void> {
		this.shown.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
		await this.draw(ev.action, ev.payload.settings);
	}

	override async onKeyDown(ev: KeyDownEvent<S>): Promise<void> {
		const state = connection.state;
		switch (connection.status) {
			case "ok":
				if (state) {
					await this.pressed(ev.action, state, ev.payload.settings);
				}
				return;
			case "linking":
				if (connection.link?.url) {
					await streamDeck.system.openUrl(connection.link.url);
				}
				return;
			case "offline":
				await connection.refresh();
				return;
			default:
				if (ev.action.isKey()) {
					await ev.action.showAlert();
				}
		}
	}

	override async onPropertyInspectorDidAppear(_ev: PropertyInspectorDidAppearEvent<S>): Promise<void> {
		await this.status();
	}

	/** Messages of the settings window: connect (code), key, cancel, disconnect, status. */
	override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, S>): Promise<void> {
		const message = (ev.payload ?? {}) as Record<string, string>;
		switch (message.type) {
			case "connect":
				await connection.connect(message.url, message.name || "Stream Deck");
				break;
			case "key":
				await connection.useKey(message.url, message.key);
				break;
			case "cancel":
				connection.cancelLink();
				break;
			case "disconnect":
				await connection.disconnect();
				break;
			case "open-link":
				if (connection.link?.url) {
					await streamDeck.system.openUrl(connection.link.url);
				}
				break;
		}
		await this.status();
	}

	/** Tells the open settings window where the connection stands (never the key itself). */
	private async status(): Promise<void> {
		const current = streamDeck.ui.action;
		if (!current || current.manifestId !== this.manifestId) {
			return;
		}
		try {
			await streamDeck.ui.sendToPropertyInspector({
				type: "status",
				status: connection.status,
				url: connection.settings.url ?? "",
				player: connection.settings.player ?? "",
				server: connection.state?.serverName ?? "",
				team: connection.state?.me.team ?? false,
				code: connection.link?.code ?? "",
				linkUrl: connection.link?.url ?? "",
				error: connection.lastError,
				options: this.options(connection.state),
			});
		} catch {
			// the window just closed
		}
	}
}
