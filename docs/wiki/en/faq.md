# FAQ

## The key shows "Offline"
The server does not answer at the address you entered. Check the **server address** in the settings of the key - it must be exactly the one you open the web interface with in the browser (with `https://`). If the server is restarting, the key comes back by itself after the start. Pressing the key tries again right away.

## The key shows "No right"
You lack the permission for this key. For all keys: `mradmin.deck`. Team keys also need the permission of the page **and** an own sign-in in the web interface (see [Keys for the team](team-tasten.md)).

## The code is not accepted
A code works for **5 minutes** and only once. Simply click **Connect with a code** in the settings of the key again.

## How often does the Stream Deck ask?
Every 3 seconds, and only while an MRadmin key is visible. The server keeps the answer for a moment - even many Stream Decks hardly load it.

## Where is my key stored?
In the settings of the Stream Deck app on your computer. The server only knows a hash of it. The plugin never writes it into its log.

## Does it work with several servers?
For now the plugin connects to **one** server.
