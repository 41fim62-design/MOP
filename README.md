# MOP — Music of People

MOP is a Russian-language, mobile-friendly music player for independent artists.

## Current features
- Import audio files from the device; automatically read MP3 ID3 title, artist, album, and embedded lyrics (ID3v2.2/v2.3/v2.4 plus ID3v1 fallback).
- Store the music library locally in the browser with IndexedDB.
- Search across track titles, artist names, album names, and saved lyrics/notes; sort tracks by title, artist, album, or duration; play the currently filtered list in order, edit track titles and artist names, and manage favorites.
- Share audio files with the device share sheet where supported, or download them for manual sharing.
- Browse a generated artist directory with avatars, track counts, artist-specific library filtering, one-tap playback, local follow/unfollow controls with a followed-artists view, and an artist detail page listing playable local tracks. Follows are saved only on this device.
- Browse a generated album shelf with cover art, artist names, track counts, and one-tap album playback; open an album to filter the library.
- Create playlists, add or remove tracks, and play a selected playlist in order.
- View the current track's saved lyrics in the player, with a quick edit shortcut.
- Edit the artist profile, upload a local profile photo, and choose an accent color.
- Preview or remove the profile photo; include profile photo and accent in local backups.
- Share a link to an artist profile card (name and bio only).
- Export a full JSON backup containing local audio files, artist profile, favorites, and playlists; restore that backup on another browser/device.
- Cassette-style player with animated reels and tape-pack movement, shuffle, repeat modes, and playback speed controls (0.75× to 2×).
- Installable PWA shell and offline app interface.

## Important
The current version is a **local-first prototype**. Audio files and the artist profile are stored in the browser on the current device. They are not uploaded to a shared server, and other users cannot yet discover or stream them. The shareable artist card places the artist name and bio in the link; it does not publish or transfer audio files. Clearing browser storage can remove the local music library. Use **↓ Резервная копия** regularly: it packages audio and settings into one JSON file. Keep the backup somewhere outside the browser. Importing a backup replaces the current local library and playlists. Use the same browser and device to access saved tracks.

## Run
Open the GitHub Pages site over HTTPS in a modern browser. On supported browsers, use **Установить MOP** or the browser's install option to add it to the home screen.

## Project files
- `index.html` — application layout
- `style.css` — visual design and responsive layout
- `app.js` — playback, library, playlists, and PWA install flow
- `sw.js` — service worker and app-shell cache
- `manifest.json` / `icon.svg` — PWA metadata and icon


### Длительность композиций
Длительность аудиофайлов определяется автоматически и сохраняется в локальной IndexedDB-библиотеке вместе с записью трека. При следующих запусках MOP уже известные значения не требуется повторно сканировать.

### Быстрый фильтр «Недавние»
Кнопка «Недавние» показывает до десяти последних добавленных композиций по возрастанию ID локальной базы. Фильтр сочетается с поиском, исполнителем, избранным и плейлистом.

Историю прослушивания можно очистить отдельной кнопкой в каталоге. Перед очисткой приложение просит подтверждение.

- Album detail pages show the album artwork, artists, track count, and playable track list, with one-tap album playback.

- A private listening activity feed shows up to eight recently played local tracks and lets the listener replay them. This activity is stored only on the current device.

- Artist profiles support external VK, Telegram, and Yandex Music links. Valid HTTPS links appear on the local profile and are included in shareable profile URLs and JSON backups. Shared cards never expose local audio files.

- Shared artist cards include a follow/unfollow action. Followed shared profiles are saved locally, listed in My subscriptions, and can be reopened or unfollowed. This is device-local; cross-device synchronized subscriptions require a shared backend.

- Artist publication feed: create short local posts about releases and music, optionally referencing the currently selected track, then share a standalone read-only post URL. Posts remain on the creator's device; shared URLs carry only text and metadata, never audio files.

- Shared post interactions: local emoji reaction counters and shareable reply links. Reactions are stored only in the reacting browser; replies are generated as separate links that the listener sends to the author. There is no automatic cross-user comment feed or server synchronization.

- Local artist inbox: when an artist opens a listener's reply link, they can save that reply into a local inbox on their device. Inbox supports up to 100 saved replies and individual deletion. This is manual link-based delivery, not automatic server messaging.

- Full backup now also includes followed artists, shared-profile subscriptions, local artist publications and saved listener replies. Import restores these local social records with validation and size limits. Older version-1 backups without the optional social object remain compatible.

- Artist publications support one pinned announcement. Pinning moves it to the top of the local feed; pin state is included in backup/restore. This remains device-local until a shared backend exists.

- Artist posts can now be edited in place (up to 500 characters); edits keep the post ID and pin state, and shared links can be regenerated with the updated text. The composer displays a live character count.


- Artist inbox now supports searching saved listener replies by author, date, message text, or original post, and exporting all saved replies as a UTF-8 CSV file for spreadsheet apps. The inbox remains local to the current browser.


- The artist post composer now shows a live preview and automatically saves an unfinished draft locally while typing. The draft is restored when the page is reopened and cleared after publishing. Drafts remain in the current browser only.

- Artist post editing now uses an accessible native dialog instead of a browser prompt, with a live 500-character counter, inline validation, and cancel-safe editing.

- The local artist feed now has instant search across publication text, linked track titles, and album names, with a live visible/total post count and a clear no-results state. Search remains local to the current browser.

- Local artist publications can now be exported to a UTF-8 CSV file for spreadsheet apps. The export includes post date, artist, text, linked track and album, pinned status, and edit date; it exports the complete local feed rather than only currently filtered results.

- The artist publication composer now has a dedicated clear-draft control. It is disabled when no draft exists, asks for confirmation before clearing, updates the live preview, and removes the saved local draft without touching published posts.

- The artist publication feed now includes a persistent “Pinned only” filter. It can be combined with publication search, shows the count within the pinned subset, and does not modify or delete posts.

- The listener inbox search now reports the number of matching replies out of the total and clears the result hint when the query is empty. Search remains local and does not change stored messages.
