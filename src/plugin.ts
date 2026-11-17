import streamDeck from "@elgato/streamdeck";
import { ServerAction } from "./actions/server";
import { TicketsAction } from "./actions/tickets";
import { connection } from "./lib/connection";

// Never "trace": it would write the messages with the key of the Stream Deck into the log.
streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new ServerAction());
streamDeck.actions.registerAction(new TicketsAction());

await streamDeck.connect();
await connection.init();
