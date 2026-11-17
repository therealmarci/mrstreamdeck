import {
	action,
	type DialDownEvent,
	type DialRotateEvent,
	SingletonAction,
	type TouchTapEvent,
	type WillAppearEvent,
	type WillDisappearEvent,
	type DialAction as Dial,
} from "@elgato/streamdeck";
import { connection, type DeckState } from "../lib/connection";
import { t } from "../lib/i18n";
import { renderDial, type Tile } from "../lib/render";
import type { MRadminAction } from "./base";
import { CountdownAction, InboxAction } from "./player";
import { ServerAction } from "./server";
import { AlertsAction, PerformanceAction } from "./team";
import { TicketsAction } from "./tickets";

type Settings = { page?: number };

/**
 * Overview on a dial of the Stream Deck +: turning goes through server, performance, tickets, warnings, inbox and the
 * next restart (only the pages the player may see); pressing or tapping opens the page in the browser.
 */
@action({ UUID: "at.marcelr.mradmin.dial" })
export class OverviewDialAction extends SingletonAction<Settings> {
	/** The key views reused for the pages (not registered as actions of their own). */
	private readonly pages: MRadminAction<any>[] = [new ServerAction(), new PerformanceAction(), new TicketsAction(),
		new AlertsAction(), new InboxAction(), new CountdownAction()];
	private shown = new Map<string, { action: Dial<Settings>; page: number }>();

	constructor() {
		super();
		connection.onChange(() => {
			for (const entry of this.shown.values()) {
				void this.draw(entry.action, entry.page);
			}
		});
	}

	private available(state: DeckState): { tile: Tile; page: string }[] {
		const list: { tile: Tile; page: string }[] = [];
		for (const view of this.pages) {
			const p = view.preview(state, {});
			if (p.tile) {
				list.push({ tile: p.tile, page: p.page });
			}
		}
		return list;
	}

	private async draw(dial: Dial<Settings>, page: number): Promise<void> {
		const state = connection.state;
		let tile: Tile;
		let index = 0;
		let count = 1;
		if (connection.status !== "ok" || !state) {
			tile = { icon: "link", title: t("setup.title"), value: connection.status === "linking" ? connection.link?.code ?? "…"
				: t(connection.status === "offline" ? "offline.value" : "setup.value"), tone: "info" };
		} else {
			const list = this.available(state);
			count = Math.max(1, list.length);
			index = ((page % count) + count) % count;
			tile = list[index]?.tile ?? { icon: "server", title: t("setup.title"), value: "–", tone: "off" };
		}
		await dial.setFeedback({ canvas: renderDial(tile, index, count) });
	}

	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		if (!ev.action.isDial()) {
			return;
		}
		await ev.action.setFeedbackLayout("layouts/dial.json");
		const page = ev.payload.settings.page ?? 0;
		this.shown.set(ev.action.id, { action: ev.action, page });
		connection.show();
		await this.draw(ev.action, page);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		if (this.shown.delete(ev.action.id)) {
			connection.hide();
		}
	}

	override async onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> {
		const entry = this.shown.get(ev.action.id);
		if (!entry) {
			return;
		}
		entry.page += ev.payload.ticks;
		await ev.action.setSettings({ page: entry.page });
		await this.draw(ev.action, entry.page);
	}

	private async open(id: string): Promise<void> {
		const entry = this.shown.get(id);
		const state = connection.state;
		if (!entry || !state || connection.status !== "ok") {
			return;
		}
		const list = this.available(state);
		const target = list[((entry.page % list.length) + list.length) % list.length];
		if (target) {
			await connection.open(target.page);
		}
	}

	override async onDialDown(ev: DialDownEvent<Settings>): Promise<void> {
		await this.open(ev.action.id);
	}

	override async onTouchTap(ev: TouchTapEvent<Settings>): Promise<void> {
		await this.open(ev.action.id);
	}
}

