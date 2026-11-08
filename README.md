# MOP — Music of People

MOP is a Russian-language, mobile-friendly music player for independent artists.

## Current features
- Import audio files from the device.
- Store the music library locally in the browser with IndexedDB.
- Search tracks and manage favorites.
- Create playlists, add or remove tracks, and play a selected playlist in order.
- Edit the artist profile.
- Cassette-style player with animated reels and tape-pack movement.
- Installable PWA shell and offline app interface.

## Important
The current version is a **local-first prototype**. Audio files and the artist profile are stored in the browser on the current device. They are not uploaded to a shared server, and other users cannot yet discover or stream them. Clearing browser storage can remove the local music library. Use the same browser and device to access saved tracks.

## Run
Open the GitHub Pages site over HTTPS in a modern browser. On supported browsers, use **Установить MOP** or the browser's install option to add it to the home screen.

## Project files
- `index.html` — application layout
- `style.css` — visual design and responsive layout
- `app.js` — playback, library, playlists, and PWA install flow
- `sw.js` — service worker and app-shell cache
- `manifest.json` / `icon.svg` — PWA metadata and icon
