# Connecting

The Stream Deck connects to the **MRadmin web interface** of your server - with your account. For that it gets its own key, which only works for the Stream Deck and does not run out.

## With a code
1. In the settings of an MRadmin key, enter the **server address** (the address you open the web interface with in the browser) and optionally a **name** for this Stream Deck (e.g. "Desk").
2. **Connect with a code** - all MRadmin keys show the code, e.g. `K7Q-4MX`. It works for **5 minutes**.
3. Confirm:
   - **in game** with `/web link K7Q-4MX` and a click on **[Connect]** - the hover shows the name and address of the Stream Deck, or
   - **in the browser:** **Confirm in the browser** (or press a key while it shows the code) opens the web interface; after signing in, click **Connect**.

## With a key
In the web interface under **Account → Devices → Stream Deck**, enter a name and **Make key**. The key (`mrd_…`) is shown **only once** - copy it and paste it in the settings of the key under **Connect with a key**.

## Disconnecting and signing out
- **On the Stream Deck:** **Disconnect** in the settings of a key - this also signs the Stream Deck out on the server.
- **In the web interface:** **Account → Devices → Stream Deck → Sign out** (e.g. when the Stream Deck is no longer yours).
- **In game:** `/web devices` shows how many Stream Decks are connected; `/web reset` signs out all devices including Stream Decks.

## What the keys show
| Shows | Meaning |
|---|---|
| **Connect** | not connected yet - open the settings of the key |
| **Code** | waiting for your confirmation |
| **Offline** | the server does not answer (pressing tries again right away) |
| **Signed out** | the Stream Deck was signed out - connect again |
| **No right** | you lack the permission for this key (for all keys: `mradmin.deck`) |
| **Off** | Stream Decks are switched off on the server |

## For the team on the server
- MRadmin needs the **web interface** (`web.enabled: true`) with a **public address** (`web.public-url`).
- `stream-deck.enabled` (on by default) allows Stream Decks, `stream-deck.max-devices` (default 5) limits them per player.
- The permission **`mradmin.deck`** (in `mradmin.player`) allows connecting. What a key shows depends on the permissions of the web interface - [keys for the team](team-tasten.md) also need an own sign-in in the web interface (password, passkey or Discord), like the administration itself.
- Everything else: [MRadmin wiki](https://mrtechnology.marcelr.at/wiki/mradmin/).
