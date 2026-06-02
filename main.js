const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog, nativeImage, screen } = require("electron");
const fs = require("fs");
const path = require("path");

const DEFAULT_WINDOW = { width: 260, height: 320 };
const PANEL_WINDOW = { width: 420, height: 620 };

const DEFAULT_STATE = {
  position: null,
  stats: {
    hunger: 80,
    happiness: 80,
    energy: 80,
    bond: 20
  },
  settings: {
    selectedCharacter: "sakura",
    petSize: "medium",
    alwaysOnTop: true,
    startWithWindows: false,
    sound: false
  },
  lastFedTime: null,
  lastUpdatedAt: null
};

let mainWindow;
let tray;
let isQuitting = false;

if (!app.isPackaged) {
  app.setPath("userData", path.join(__dirname, "data", "electron-user-data"));
}

function getDataDir() {
  // During development, data lives in the project folder as requested.
  // After packaging, Windows apps should write inside userData instead.
  return app.isPackaged ? path.join(app.getPath("userData"), "data") : path.join(__dirname, "data");
}

function ensureDataFiles() {
  const dataDir = getDataDir();
  fs.mkdirSync(dataDir, { recursive: true });

  const statePath = path.join(dataDir, "pet-state.json");
  const notesPath = path.join(dataDir, "notes.json");

  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, JSON.stringify(DEFAULT_STATE, null, 2));
  }

  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(notesPath, JSON.stringify([], null, 2));
  }
}

function readJson(fileName, fallback) {
  ensureDataFiles();
  try {
    const filePath = path.join(getDataDir(), fileName);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Could not read ${fileName}:`, error);
    return fallback;
  }
}

function writeJson(fileName, data) {
  ensureDataFiles();
  const filePath = path.join(getDataDir(), fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function clampStat(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function sanitizeState(input, options = {}) {
  const current = readJson("pet-state.json", DEFAULT_STATE);
  const next = {
    ...DEFAULT_STATE,
    ...current,
    ...input,
    stats: {
      ...DEFAULT_STATE.stats,
      ...(current.stats || {}),
      ...(input && input.stats ? input.stats : {})
    },
    settings: {
      ...DEFAULT_STATE.settings,
      ...(current.settings || {}),
      ...(input && input.settings ? input.settings : {})
    }
  };

  next.stats.hunger = clampStat(next.stats.hunger);
  next.stats.happiness = clampStat(next.stats.happiness);
  next.stats.energy = clampStat(next.stats.energy);
  next.stats.bond = clampStat(next.stats.bond);

  const allowedSizes = ["small", "medium", "large"];
  const allowedCharacters = ["sakura", "tsunade", "hinata"];
  if (!allowedCharacters.includes(next.settings.selectedCharacter)) next.settings.selectedCharacter = "sakura";
  if (!allowedSizes.includes(next.settings.petSize)) next.settings.petSize = "medium";
  next.settings.alwaysOnTop = Boolean(next.settings.alwaysOnTop);
  next.settings.startWithWindows = Boolean(next.settings.startWithWindows);
  next.settings.sound = Boolean(next.settings.sound);

  if (next.position) {
    next.position.x = Number(next.position.x);
    next.position.y = Number(next.position.y);
    if (!Number.isFinite(next.position.x) || !Number.isFinite(next.position.y)) {
      next.position = null;
    }
  }

  if (next.lastUpdatedAt && Number.isNaN(Date.parse(next.lastUpdatedAt))) {
    next.lastUpdatedAt = null;
  }

  if (options.touchUpdatedAt) {
    next.lastUpdatedAt = new Date().toISOString();
  }

  return next;
}

function getSavedState() {
  return sanitizeState(readJson("pet-state.json", DEFAULT_STATE));
}

function saveState(partialState) {
  const next = sanitizeState(partialState || {}, { touchUpdatedAt: true });
  writeJson("pet-state.json", next);
  return next;
}

function getInitialBounds() {
  const state = getSavedState();
  const position = state.position;

  if (!position) {
    const display = screen.getPrimaryDisplay().workArea;
    return {
      width: DEFAULT_WINDOW.width,
      height: DEFAULT_WINDOW.height,
      x: display.x + display.width - DEFAULT_WINDOW.width - 40,
      y: display.y + display.height - DEFAULT_WINDOW.height - 60
    };
  }

  return {
    width: DEFAULT_WINDOW.width,
    height: DEFAULT_WINDOW.height,
    x: Math.round(position.x),
    y: Math.round(position.y)
  };
}

function makeTrayImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="#ffd6e7"/>
      <circle cx="16" cy="17" r="10" fill="#fff7ad" stroke="#3b2f36" stroke-width="2"/>
      <circle cx="12" cy="16" r="1.8" fill="#3b2f36"/>
      <circle cx="20" cy="16" r="1.8" fill="#3b2f36"/>
      <path d="M12 21c2.3 2 5.7 2 8 0" fill="none" stroke="#3b2f36" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

  return nativeImage.createFromDataURL(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

function buildTrayMenu() {
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Show Pet",
      click: () => {
        mainWindow.showInactive();
      }
    },
    {
      label: "Hide Pet",
      click: () => {
        mainWindow.hide();
      }
    },
    {
      label: "Feed Pet",
      click: () => {
        mainWindow.showInactive();
        mainWindow.webContents.send("tray:feed-pet");
      }
    },
    {
      label: "Open Task Panel",
      click: () => {
        mainWindow.showInactive();
        mainWindow.webContents.send("tray:open-task-panel");
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));
}

function createWindow() {
  ensureDataFiles();
  const state = getSavedState();

  mainWindow = new BrowserWindow({
    ...getInitialBounds(),
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: state.settings.alwaysOnTop,
    resizable: false,
    maximizable: false,
    minimizable: false,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.setAlwaysOnTop(state.settings.alwaysOnTop, "screen-saver");
  mainWindow.loadFile("index.html");

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(makeTrayImage());
  tray.setToolTip("RomDesktopPet");
  buildTrayMenu();
}

function saveWindowPosition() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [x, y] = mainWindow.getPosition();
  const current = getSavedState();
  saveState({ ...current, position: { x, y } });
}

function setPanelMode(isOpen) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const target = isOpen ? PANEL_WINDOW : DEFAULT_WINDOW;
  mainWindow.setSize(target.width, target.height, true);
  saveWindowPosition();
}

function setupIpc() {
  ipcMain.handle("state:get", () => {
    return getSavedState();
  });

  ipcMain.handle("state:save", (_event, partialState) => {
    return saveState(partialState);
  });

  ipcMain.handle("notes:get", () => {
    const notes = readJson("notes.json", []);
    return Array.isArray(notes) ? notes : [];
  });

  ipcMain.handle("notes:add", (_event, noteText) => {
    const text = String(noteText || "").trim().slice(0, 500);
    if (!text) return readJson("notes.json", []);

    const notes = readJson("notes.json", []);
    const nextNotes = [
      {
        id: Date.now(),
        text,
        createdAt: new Date().toISOString()
      },
      ...(Array.isArray(notes) ? notes : [])
    ].slice(0, 30);

    writeJson("notes.json", nextNotes);
    return nextNotes;
  });

  ipcMain.on("window:drag-move", (_event, delta) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const dx = Number(delta && delta.dx);
    const dy = Number(delta && delta.dy);
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;

    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy), false);
  });

  ipcMain.handle("window:drag-end", () => {
    saveWindowPosition();
  });

  ipcMain.handle("window:set-always-on-top", (_event, shouldStayOnTop) => {
    const enabled = Boolean(shouldStayOnTop);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(enabled, "screen-saver");
    }
    const state = getSavedState();
    return saveState({
      ...state,
      settings: {
        ...state.settings,
        alwaysOnTop: enabled
      }
    });
  });

  ipcMain.handle("window:set-panel-mode", (_event, isOpen) => {
    setPanelMode(Boolean(isOpen));
  });

  ipcMain.handle("shell:open-website", async (_event, rawUrl) => {
    let url = String(rawUrl || "").trim();
    if (!url) return { ok: false, message: "Enter a website first." };

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { ok: false, message: "Only http and https links are allowed." };
      }
      await shell.openExternal(parsed.toString());
      return { ok: true };
    } catch (error) {
      return { ok: false, message: "That website address does not look valid." };
    }
  });

  ipcMain.handle("dialog:choose-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose a folder",
      properties: ["openDirectory"]
    });

    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("shell:open-folder", async (_event, folderPath) => {
    const rawPath = String(folderPath || "").trim();
    if (!rawPath) {
      return { ok: false, message: "Choose an existing folder." };
    }

    const safePath = path.resolve(rawPath);
    if (!safePath || !fs.existsSync(safePath) || !fs.statSync(safePath).isDirectory()) {
      return { ok: false, message: "Choose an existing folder." };
    }

    const errorMessage = await shell.openPath(safePath);
    return errorMessage ? { ok: false, message: errorMessage } : { ok: true };
  });
}

app.whenReady().then(() => {
  setupIpc();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  saveWindowPosition();
});

app.on("window-all-closed", () => {
  // The close handler hides the pet, so this usually only runs while quitting.
  if (isQuitting) app.quit();
});
