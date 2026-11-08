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
