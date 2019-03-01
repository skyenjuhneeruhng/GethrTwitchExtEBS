# API Endpoints

| Request Type | Endpoint | Description |
| ------------ | -------- | ----------- |
| GET | `config` | Gets the user's/broadcaster's config for the extension. Returns null if the broadcaster has not auth'd Spotify. |
| GET | `spotify/auth` | Redirect URI for Spotify OAuth. Validates data from Spotify then stores the user's credentials. Serves a basic HTML page that the extension can use to listen for events in the form of a popup. |
| GET | `spotify/current` | Gets the current playlist and song/track that the user is listening to. |
| GET | `spotify/playlists` | Gets the user's playlists from the Spotify API. Alternatively, only fetch the playlists that Gethr has created from however we have stored them. |
| POST | `spotify/playlists` | Creates a new playlist for the user. This will then ping the ML algorithm to crunch on filling the playlist with tracks. |
| GET | `spotify/playlists/{playlist_id}` | Gets the playlist information for the given ID. |
| DELETE | `spotify/playlists/{playlist_id}` | Deletes the playlist. |
| POST | `spotify/playlists/{playlist_id}/tracks/{track_id}/vote` | Votes on a specific track (up or down vote). |
| DELETE | `spotify/revoke` | Revokes Spotify OAuth for the user. |

**NOTE:** All routes, except `spotify/auth` are protected by an "authenticate" middleware that verifies a JSON Web Token from Twitch. `spotify/auth` receives the JWT as a `state` query parameter from the Spotify OAuth redirect.
