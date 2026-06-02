const ACTION_IMAGES = {
  idle: "assets/pet-idle.png",
  happy: "assets/pet-happy.png",
  sad: "assets/pet-sad.png",
  eating: "assets/pet-eating.png",
  sleeping: "assets/pet-sleeping.png",
  working: "assets/pet-working.png",
  excited: "assets/pet-happy.png",
  angry: "assets/pet-sad.png"
};

const ACTION_PROPS = {
  idle: "",
  happy: "*",
  sad: "",
  eating: "o",
  sleeping: "Z",
  working: "...",
  excited: "*",
  angry: "!"
};

const CHARACTER_THEMES = {
  sakura: {
    name: "Sakura Haruno",
    actionWords: {
      feed: "Soldier pill snack secured.",
      sleep: "Medical recovery mode.",
      play: "Chakra punch jump!",
      focus: "Team 7 focus.",
      complete: "Task complete. Nice chakra control.",
      reminder: "Reminder delivered."
    },
    messages: [
      "Team 7 desktop watch is on.",
      "Medical check: you are doing okay.",
      "One focused hit at a time.",
      "Chakra control steady.",
      "Strong heart, clean notes."
    ]
  },
  tsunade: {
    name: "Tsunade",
    actionWords: {
      feed: "Hokage snack break approved.",
      sleep: "Hokage desk nap.",
      play: "Legendary power bounce.",
      focus: "Office hours begin.",
      complete: "Approved by the Fifth Hokage.",
      reminder: "Listen up. Reminder time."
    },
    messages: [
      "Stand tall. Then do the next thing.",
      "I am supervising this desktop.",
      "A break is strategy, not weakness.",
      "Your focus stats are acceptable.",
      "No slacking. Unless it is a nap."
    ]
  },
  hinata: {
    name: "Hinata Hyuga",
    actionWords: {
      feed: "Warm tea and a snack.",
      sleep: "Quiet recovery time.",
      play: "Gentle Fist step.",
      focus: "Byakugan focus.",
      complete: "You did it. I knew you could.",
      reminder: "Soft reminder."
    },
    messages: [
      "I am cheering for you.",
      "Small steps still count.",
      "Breathe. Then continue.",
      "Your notes are safe with me.",
      "Quiet courage mode is on."
    ]
  }
};

const SIZE_SCALE = {
  small: 0.82,
  medium: 1,
  large: 1.16
};

const DEFAULT_STATS = {
  hunger: 80,
  happiness: 80,
  energy: 80,
  bond: 20
};

const DEFAULT_SETTINGS = {
  selectedCharacter: "sakura",
  petSize: "medium",
  alwaysOnTop: true,
  startWithWindows: false,
  sound: false
};

const state = {
  stats: { ...DEFAULT_STATS },
  settings: { ...DEFAULT_SETTINGS },
  lastFedTime: null,
  currentAction: "idle",
  panelOpen: false,
  timerSeconds: 25 * 60,
  timerId: null,
  reminders: []
};

const elements = {
  body: document.body,
  petCharacter: document.getElementById("petCharacter"),
  petImage: document.getElementById("petImage"),
  cssPet: document.getElementById("cssPet"),
  petProp: document.getElementById("petProp"),
  speechBubble: document.getElementById("speechBubble"),
  actionMenu: document.getElementById("actionMenu"),

  feedPetButton: document.getElementById("feedPetButton"),
  sleepPetButton: document.getElementById("sleepPetButton"),
  playPetButton: document.getElementById("playPetButton"),
  openPanelButton: document.getElementById("openPanelButton"),
  closePanelButton: document.getElementById("closePanelButton"),

  hungerMeter: document.getElementById("hungerMeter"),
  happinessMeter: document.getElementById("happinessMeter"),
  energyMeter: document.getElementById("energyMeter"),
  bondMeter: document.getElementById("bondMeter"),
  hungerValue: document.getElementById("hungerValue"),
  happinessValue: document.getElementById("happinessValue"),
  energyValue: document.getElementById("energyValue"),
  bondValue: document.getElementById("bondValue"),

  websiteInput: document.getElementById("websiteInput"),
  openWebsiteButton: document.getElementById("openWebsiteButton"),

  noteInput: document.getElementById("noteInput"),
  saveNoteButton: document.getElementById("saveNoteButton"),
  notesList: document.getElementById("notesList"),

  timerDisplay: document.getElementById("timerDisplay"),
  startTimerButton: document.getElementById("startTimerButton"),
  resetTimerButton: document.getElementById("resetTimerButton"),

  reminderTextInput: document.getElementById("reminderTextInput"),
  reminderMinutesInput: document.getElementById("reminderMinutesInput"),
  addReminderButton: document.getElementById("addReminderButton"),
  remindersList: document.getElementById("remindersList"),

  folderPathInput: document.getElementById("folderPathInput"),
  chooseFolderButton: document.getElementById("chooseFolderButton"),
  openFolderButton: document.getElementById("openFolderButton"),

  characterSelect: document.getElementById("characterSelect"),
  petSizeSelect: document.getElementById("petSizeSelect"),
  alwaysOnTopToggle: document.getElementById("alwaysOnTopToggle"),
  startWithWindowsToggle: document.getElementById("startWithWindowsToggle"),
  soundToggle: document.getElementById("soundToggle")
};

let speechTimeout;
let actionTimeout;
let isDragging = false;
let dragStarted = false;
let lastPointer = { x: 0, y: 0 };

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function changeStat(name, amount) {
  state.stats[name] = clamp((state.stats[name] || 0) + amount);
  renderStats();
  savePetState();
}

function getTheme() {
  return CHARACTER_THEMES[state.settings.selectedCharacter] || CHARACTER_THEMES.sakura;
}

function setAction(action, duration = 0) {
  state.currentAction = action;
  elements.petCharacter.className = `pet-character character-${state.settings.selectedCharacter} is-${action}`;
  elements.petProp.textContent = ACTION_PROPS[action] || "";
  loadPetImage(action);

  clearTimeout(actionTimeout);
  if (duration > 0) {
    actionTimeout = setTimeout(() => {
      setAction(pickMoodAction());
    }, duration);
  }
}

function pickMoodAction() {
  if (state.stats.hunger < 20 || state.stats.happiness < 20) return "sad";
  if (state.stats.energy < 12) return "sleeping";
  return "idle";
}

function loadPetImage(action) {
  const imagePath = ACTION_IMAGES[action] || ACTION_IMAGES.idle;
  elements.petImage.style.display = "none";
  elements.cssPet.style.display = "block";

  elements.petImage.onload = () => {
    elements.petImage.style.display = "block";
    elements.cssPet.style.display = "none";
  };

  elements.petImage.onerror = () => {
    elements.petImage.style.display = "none";
    elements.cssPet.style.display = "block";
  };

  elements.petImage.src = imagePath;
}

function showSpeech(message, duration = 2600) {
  clearTimeout(speechTimeout);
  elements.speechBubble.textContent = message;
  elements.speechBubble.classList.add("show");

  speechTimeout = setTimeout(() => {
    elements.speechBubble.classList.remove("show");
  }, duration);
}

function randomPetMessage() {
  const messages = getTheme().messages;
  const message = messages[Math.floor(Math.random() * messages.length)];
  showSpeech(message);
}

function feedPet() {
  changeStat("hunger", 24);
  changeStat("happiness", 8);
  state.lastFedTime = new Date().toISOString();
  setAction("eating", 3000);
  showSpeech(getTheme().actionWords.feed);
  savePetState();
}

function sleepPet() {
  changeStat("energy", 24);
  setAction("sleeping", 9000);
  showSpeech(getTheme().actionWords.sleep);
}

function playWithPet() {
  changeStat("happiness", 14);
  changeStat("energy", -8);
  setAction("excited", 2600);
  showSpeech(getTheme().actionWords.play);
}

function completeUsefulTask(amount = 3) {
  changeStat("bond", amount);
}

function renderStats() {
  const statPairs = [
    ["hunger", elements.hungerMeter, elements.hungerValue],
    ["happiness", elements.happinessMeter, elements.happinessValue],
    ["energy", elements.energyMeter, elements.energyValue],
    ["bond", elements.bondMeter, elements.bondValue]
  ];

  statPairs.forEach(([name, meter, label]) => {
    meter.value = state.stats[name];
    label.textContent = `${state.stats[name]}%`;
  });
}

function renderSettings() {
  elements.characterSelect.value = state.settings.selectedCharacter;
  elements.petSizeSelect.value = state.settings.petSize;
  elements.alwaysOnTopToggle.checked = state.settings.alwaysOnTop;
  elements.startWithWindowsToggle.checked = state.settings.startWithWindows;
  elements.soundToggle.checked = state.settings.sound;
  document.documentElement.style.setProperty("--pet-scale", String(SIZE_SCALE[state.settings.petSize] || 1));
  elements.body.dataset.character = state.settings.selectedCharacter;
  setAction(state.currentAction);
}

function renderTimer() {
  const minutes = Math.floor(state.timerSeconds / 60).toString().padStart(2, "0");
  const seconds = (state.timerSeconds % 60).toString().padStart(2, "0");
  elements.timerDisplay.textContent = `${minutes}:${seconds}`;
  elements.startTimerButton.textContent = state.timerId ? "Pause" : "Start";
}

function renderReminders() {
  elements.remindersList.innerHTML = "";
  state.reminders.forEach((reminder) => {
    const item = document.createElement("li");
    item.textContent = `${reminder.text} - ${reminder.minutes} min`;
    elements.remindersList.appendChild(item);
  });
}

function renderNotes(notes) {
  elements.notesList.innerHTML = "";

  notes.slice(0, 5).forEach((note) => {
    const item = document.createElement("li");
    item.textContent = note.text;
    elements.notesList.appendChild(item);
  });
}

function toggleActionMenu(forceOpen) {
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : !elements.actionMenu.classList.contains("open");
  elements.actionMenu.classList.toggle("open", shouldOpen);
}

async function togglePanel(forceOpen) {
  state.panelOpen = typeof forceOpen === "boolean" ? forceOpen : !state.panelOpen;
  elements.body.classList.toggle("panel-open", state.panelOpen);
  toggleActionMenu(false);
  await window.romPet.setPanelMode(state.panelOpen);
}

async function savePetState() {
  await window.romPet.saveState({
    stats: state.stats,
    settings: state.settings,
    lastFedTime: state.lastFedTime
  });
}

function applyOfflineStatChanges(savedState) {
  if (!savedState.lastUpdatedAt) return;
  const elapsedMinutes = Math.floor((Date.now() - new Date(savedState.lastUpdatedAt).getTime()) / 60000);
  if (elapsedMinutes <= 0) return;

  const hungerLoss = Math.min(25, Math.floor(elapsedMinutes / 8));
  const energyLoss = Math.min(18, Math.floor(elapsedMinutes / 20));
  state.stats.hunger = clamp(state.stats.hunger - hungerLoss);
  state.stats.energy = clamp(state.stats.energy - energyLoss);

  if (state.stats.hunger < 35) {
    state.stats.happiness = clamp(state.stats.happiness - Math.min(18, Math.floor(elapsedMinutes / 10)));
  }
}

function startStatLoop() {
  setInterval(() => {
    state.stats.hunger = clamp(state.stats.hunger - 1);

    if (state.currentAction === "sleeping") {
      state.stats.energy = clamp(state.stats.energy + 2);
    } else {
      state.stats.energy = clamp(state.stats.energy - 1);
    }

    if (state.stats.hunger < 30) {
      state.stats.happiness = clamp(state.stats.happiness - 1);
    }

    if (state.currentAction === "idle" || state.currentAction === "sad") {
      setAction(pickMoodAction());
    }

    renderStats();
    savePetState();
  }, 30000);
}

function startFocusTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
    setAction(pickMoodAction());
    renderTimer();
    return;
  }

  setAction("working");
  showSpeech(getTheme().actionWords.focus);

  state.timerId = setInterval(() => {
    state.timerSeconds -= 1;

    if (state.timerSeconds <= 0) {
      clearInterval(state.timerId);
      state.timerId = null;
      state.timerSeconds = 25 * 60;
      completeUsefulTask(8);
      setAction("excited", 5000);
      showSpeech(getTheme().actionWords.complete);
    }

    renderTimer();
  }, 1000);

  renderTimer();
}

function resetFocusTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.timerSeconds = 25 * 60;
  setAction(pickMoodAction());
  renderTimer();
}

function addReminder() {
  const text = elements.reminderTextInput.value.trim();
  const minutes = Number(elements.reminderMinutesInput.value);

  if (!text || !Number.isFinite(minutes) || minutes < 1) {
    showSpeech("Reminder needs words and minutes.");
    return;
  }

  const reminder = {
    id: Date.now(),
    text: text.slice(0, 120),
    minutes: Math.round(minutes)
  };

  state.reminders.push(reminder);
  renderReminders();
  elements.reminderTextInput.value = "";
  showSpeech("Reminder set.");

  setTimeout(() => {
    state.reminders = state.reminders.filter((item) => item.id !== reminder.id);
    renderReminders();
    setAction("excited", 3500);
    showSpeech(`${getTheme().actionWords.reminder}: ${reminder.text}`, 5200);
  }, reminder.minutes * 60 * 1000);
}

async function openWebsite() {
  const result = await window.romPet.openWebsite(elements.websiteInput.value);
  if (result.ok) {
    completeUsefulTask(1);
    showSpeech("Opened.");
  } else {
    showSpeech(result.message);
  }
}

async function saveNote() {
  const text = elements.noteInput.value.trim();
  if (!text) {
    showSpeech("Write a note first.");
    return;
  }

  const notes = await window.romPet.addNote(text);
  elements.noteInput.value = "";
  renderNotes(notes);
  completeUsefulTask(2);
  showSpeech("Note saved.");
}

async function chooseFolder() {
  const folderPath = await window.romPet.chooseFolder();
  if (folderPath) {
    elements.folderPathInput.value = folderPath;
  }
}

async function openFolder() {
  const result = await window.romPet.openFolder(elements.folderPathInput.value);
  if (result.ok) {
    completeUsefulTask(1);
    showSpeech("Folder opened.");
  } else {
    showSpeech(result.message);
  }
}

function saveSettingsFromControls() {
  state.settings.selectedCharacter = elements.characterSelect.value;
  state.settings.petSize = elements.petSizeSelect.value;
  state.settings.startWithWindows = elements.startWithWindowsToggle.checked;
  state.settings.sound = elements.soundToggle.checked;
  renderSettings();
  savePetState();
}

async function saveAlwaysOnTopSetting() {
  state.settings.alwaysOnTop = elements.alwaysOnTopToggle.checked;
  await window.romPet.setAlwaysOnTop(state.settings.alwaysOnTop);
  savePetState();
}

function handlePointerDown(event) {
  if (event.button !== 0) return;
  isDragging = true;
  dragStarted = false;
  lastPointer = { x: event.screenX, y: event.screenY };
  elements.petCharacter.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!isDragging) return;

  const dx = event.screenX - lastPointer.x;
  const dy = event.screenY - lastPointer.y;
  const distance = Math.abs(dx) + Math.abs(dy);

  if (distance > 2) {
    dragStarted = true;
    window.romPet.dragMove({ dx, dy });
    lastPointer = { x: event.screenX, y: event.screenY };
  }
}

async function handlePointerUp(event) {
  if (!isDragging) return;
  isDragging = false;
  elements.petCharacter.releasePointerCapture(event.pointerId);
  await window.romPet.dragEnd();

  if (!dragStarted) {
    randomPetMessage();
  }
}

function wireEvents() {
  elements.petCharacter.addEventListener("pointerdown", handlePointerDown);
  elements.petCharacter.addEventListener("pointermove", handlePointerMove);
  elements.petCharacter.addEventListener("pointerup", handlePointerUp);
  elements.petCharacter.addEventListener("pointercancel", handlePointerUp);

  elements.petCharacter.addEventListener("dblclick", () => {
    changeStat("happiness", 5);
    setAction("excited", 2400);
    showSpeech(`${getTheme().name} mode!`);
  });

  elements.petCharacter.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    toggleActionMenu();
  });

  elements.feedPetButton.addEventListener("click", feedPet);
  elements.sleepPetButton.addEventListener("click", sleepPet);
  elements.playPetButton.addEventListener("click", playWithPet);
  elements.openPanelButton.addEventListener("click", () => togglePanel(true));
  elements.closePanelButton.addEventListener("click", () => togglePanel(false));

  elements.openWebsiteButton.addEventListener("click", openWebsite);
  elements.saveNoteButton.addEventListener("click", saveNote);
  elements.startTimerButton.addEventListener("click", startFocusTimer);
  elements.resetTimerButton.addEventListener("click", resetFocusTimer);
  elements.addReminderButton.addEventListener("click", addReminder);
  elements.chooseFolderButton.addEventListener("click", chooseFolder);
  elements.openFolderButton.addEventListener("click", openFolder);

  elements.characterSelect.addEventListener("change", saveSettingsFromControls);
  elements.petSizeSelect.addEventListener("change", saveSettingsFromControls);
  elements.startWithWindowsToggle.addEventListener("change", saveSettingsFromControls);
  elements.soundToggle.addEventListener("change", saveSettingsFromControls);
  elements.alwaysOnTopToggle.addEventListener("change", saveAlwaysOnTopSetting);

  window.romPet.onFeedPet(feedPet);
  window.romPet.onOpenTaskPanel(() => togglePanel(true));
}

async function init() {
  const savedState = await window.romPet.getState();
  state.stats = { ...DEFAULT_STATS, ...(savedState.stats || {}) };
  state.settings = { ...DEFAULT_SETTINGS, ...(savedState.settings || {}) };
  state.lastFedTime = savedState.lastFedTime || null;

  applyOfflineStatChanges(savedState);
  renderSettings();
  renderStats();
  renderTimer();
  setAction(pickMoodAction());
  wireEvents();
  startStatLoop();
  savePetState();

  const notes = await window.romPet.getNotes();
  renderNotes(notes);
}

init();
