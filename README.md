# RomDesktopPet

RomDesktopPet is a small Windows Electron desktop pet. It runs as a frameless, transparent, always-on-top overlay and saves pet stats, notes, settings, and window position locally.

## Requirements

- Node.js
- npm
- Windows is the main target

## Run The App

1. Open a terminal in this folder.
2. Install dependencies:

```bash
npm install
```

3. Start RomDesktopPet:

```bash
npm start
```

If PowerShell blocks `npm.ps1` because of execution policy, use `npm.cmd install`, `npm.cmd start`, and `npm.cmd run build` instead.

For development, you can also run:

```bash
npm run dev
```

## Build

This project includes an Electron Builder script.

```bash
npm run build
```

Electron Builder creates both an installer and a portable `.exe` in `dist`. If the installer is blocked by Windows, open the portable file instead.

## Controls

- Left click the pet to hear a random message.
- Double click the pet for a happy/excited reaction.
- Right click the pet to open the mini action menu.
- Drag the pet body to move the whole overlay window.
- Use the tray icon menu for Show Pet, Hide Pet, Feed Pet, Open Task Panel, and Quit.
- In Settings, choose Sakura Haruno, Tsunade, or Hinata Hyuga for Naruto-inspired chibi animated themes with different colors, messages, and action text.

## Local Data

During development, local files are saved in:

- `data/pet-state.json`
- `data/notes.json`

When the app is packaged, Electron writes user data to the Windows app data folder so the installed app can save normally.

## Optional Pet Images

Place these PNG files in the `assets` folder if you want custom art:

- `pet-idle.png`
- `pet-happy.png`
- `pet-sad.png`
- `pet-eating.png`
- `pet-sleeping.png`
- `pet-working.png`

If they are missing, the app uses the built-in CSS pet fallback.

## Safety Notes

The task panel uses safe Electron APIs:

- Websites open with `shell.openExternal`.
- Folders open with `shell.openPath`.
- Notes and pet state are written only to local JSON files.

The app does not run terminal commands from the UI and does not delete files.
