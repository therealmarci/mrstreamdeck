import streamDeck from "@elgato/streamdeck";
import { OverviewDialAction } from "./actions/dial";
import { ChunkloaderDial, PerformanceDial, PlayersDial, RestartDial } from "./actions/dials";
import { CountdownAction, InboxAction, SleepAction, StatsAction } from "./actions/player";
import { ChunkloaderAction, ChunkWarningsAction, DuelAction, PluginAction, ReviewAction } from "./actions/plugins";
import { ServerAction } from "./actions/server";
import {
	AdminModeAction,
	AlertsAction,
	AnnounceAction,
	MaintenanceAction,
	PerformanceAction,
	RestartAction,
	StaffChatAction,
	WaitroomAction,
} from "./actions/team";
import { TicketsAction } from "./actions/tickets";
import { connection } from "./lib/connection";

// Never "trace": it would write the messages with the key of the Stream Deck into the log.
streamDeck.logger.setLevel("info");

for (const action of [
	// everyone
	new ServerAction(), new TicketsAction(), new InboxAction(), new CountdownAction(), new StatsAction(), new SleepAction(),
	new ChunkloaderAction(), new DuelAction(),
	// team
	new PerformanceAction(), new AlertsAction(), new ChunkWarningsAction(), new ReviewAction(), new MaintenanceAction(),
	new WaitroomAction(), new StaffChatAction(), new AdminModeAction(), new RestartAction(), new AnnounceAction(),
	// any plugin, the dial of the Stream Deck +
	new PluginAction(), new OverviewDialAction(), new PlayersDial(), new ChunkloaderDial(), new PerformanceDial(), new RestartDial(),
]) {
	streamDeck.actions.registerAction(action);
}

await streamDeck.connect();
await connection.init();
