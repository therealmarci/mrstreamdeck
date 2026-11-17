# Keys for the team

Team keys show the same as the administration of the web interface - with the same permissions. You also need **`mradmin.deck.team`** and, as in the administration, an **own sign-in** in the web interface (password, passkey or Discord); without them the keys show "No right". In the key list of the Stream Deck app they are at the bottom with **Team:** in front.

> [!WARNING]
> Keys with an effect (restart, admin mode, announcement) only work if the Stream Deck **may switch things** - see [Connecting](verbinden.md#view-only-or-also-switch). Every such action ends up in the log, in the Discord admin log and in the team's inbox.

| Key | Shows | Press | Permission |
|---|---|---|---|
| **Performance** | TPS, tick time or RAM (adjustable) with the curve of the last 10 minutes | performance page | `mradmin.status.health` |
| **Warnings** | number of warnings of the dashboard, the most urgent below | overview | per warning as on the dashboard |
| **Tickets** | open tickets, yellow with unread ones | tickets | `mradmin.tickets.view` |
| **Chunk loader warnings** | locked, lag-disabled and conspicuous chunk loaders | chunk loader page | `mrchunks.admin.gui` |
| **Duels to review** | rounds waiting for a review | review | `mrpvp.admin.review` |
| **Maintenance** | running (until when) or coming (in how long) | maintenance | `mradmin.maintenance.view` |
| **Waiting room** | online, restarting or gone; how many are waiting | waiting room | `mradmin.status` |
| **Staff chat** | new messages, the newest below | **mark as read** | `mradmin.staffchat` |
| **Admin mode** | on or off (only while you are online) | **twice: switch** | `mradmin.mode` |
| **Restart** | countdown time; while one runs, the time left | **twice: start or cancel** | `mradmin.server.restart` |
| **Announcement** | the chosen template | **twice: send** | `mradmin.announce` |

## Press twice
Keys with an effect light up in their colour on the first press ("Press again"). Only a second press **within 5 seconds** runs the action. Then the Stream Deck shows a tick - or a warning triangle if the server refuses (e.g. a restart is already running).

## Restart
- You choose the time in the settings of the key from the server's normal restart times (`versions.restart-delays`, by default 15, 30 and 60 minutes).
- **Emergency restarts** (1 or 5 minutes, now) are not on the Stream Deck - they only work in the browser with a fresh confirmation.
- While the waiting room waits for its own restart, the key is blocked.

## Announcement
Only own templates without values to fill in (made under **Content → Announcements**). Discord gets them if the template says so.
