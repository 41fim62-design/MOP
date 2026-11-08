# MOP — Music of People

MOP is a Russian-language, mobile-friendly music player for independent artists.

## Current features
- Import audio files from the device.
- Store the music library locally in the browser with IndexedDB.
- Search tracks and manage favorites.
- Share audio files with the device share sheet where supported, or download them for manual sharing.
- Create playlists, add or remove tracks, and play a selected playlist in order.
- Edit the artist profile.
- Share a link to an artist profile card (name and bio only).
- Export a full JSON backup containing local audio files, artist profile, favorites, and playlists; restore that backup on another browser/device.
- Cassette-style player with animated reels and tape-pack movement.
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
