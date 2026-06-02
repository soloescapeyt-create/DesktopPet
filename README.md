# RomDesktopPet

Naruto-inspired chibi desktop pet for Windows, built with Electron and plain HTML/CSS/JS.

RomDesktopPet floats above your desktop, can be dragged around, reacts to clicks, changes moods, saves local stats, and includes small useful tools like notes, reminders, folder opening, website opening, and a focus timer.

[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-47848f?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Plain%20JS-f7df1e?logo=javascript&logoColor=111)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078d4?logo=windows&logoColor=white)](https://www.microsoft.com/windows)

> Fan-made project. Not affiliated with Naruto, Shonen Jump, Studio Pierrot, Viz Media, or any rights holders.

## Why Star It?

- Cute transparent desktop overlay, not a normal web page
- Naruto-inspired Sakura Haruno, Tsunade, and Hinata Hyuga chibi modes
- Dynamic CSS pet: breathing, bouncing, sleeping, eating, working, aura, and hand animations
- Beginner-friendly Electron code with no React
- Local JSON storage for stats, settings, notes, and position
- Portable Windows build support

## Requirements

- Node.js
- npm
- Windows is the main target

## Download

The easiest way to try it is the portable `.exe` from GitHub Releases.

If no release is available yet, clone the repo and run it locally with `npm start`.

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

## Features

- Frameless transparent pet window
- Always-on-top desktop overlay
- Drag the pet body to move it
- Saves position and settings
- Tray menu for show, hide, feed, task panel, and quit
- Pet stats: hunger, happiness, energy, and bond
- Actions: idle, happy, sad, eating, sleeping, working, excited, and angry
- Task panel with website opener, quick notes, focus timer, reminders, folder opener, and settings
- Safe Electron APIs only: no arbitrary command execution

## Characters

Choose the active pet from the task panel settings:

- Sakura Haruno: pink hair, forehead protector, red outfit, Team 7 / medical ninja themed lines
- Tsunade: blonde twin-lock look, forehead diamond, green Hokage-style outfit, Fifth Hokage themed lines
- Hinata Hyuga: dark hair, pale Byakugan-style eyes, lavender jacket, Gentle Fist / Byakugan themed lines

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

## GitHub Topics

Suggested repo topics:

`electron`, `desktop-pet`, `javascript`, `windows`, `desktop-app`, `chibi`, `naruto-inspired`, `html-css-javascript`, `overlay`, `productivity`
