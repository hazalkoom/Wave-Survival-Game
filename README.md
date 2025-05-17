# 🧟‍♂️ Wave Survival Game (Built with p5.js + p5.sound)

Welcome to **Wave Survival**, a 2D top-down survival game built using **p5.js** and the **p5.sound** library. This project demonstrates core gameplay mechanics like enemy waves, boss battles, combat, item pickups, scaling difficulty, and audio feedback — all done in JavaScript using creative coding tools.

---

## 🎮 Gameplay Overview

You are dropped into an endless battleground where enemies spawn in increasingly difficult waves. Your goal is to:

- Survive as many waves as possible
- Defeat mini-bosses and major bosses
- Pick up weapons and power-ups
- Use both melee and ranged attacks to hold your ground

The game dynamically gets harder over time, with larger, stronger enemies and increasingly frequent boss encounters.

---

## 🧠 Features & Systems

### ✅ Core Mechanics
- Procedural enemy wave generation
- Wave scaling (size, speed, health, count)
- Boss system:
  - Mini-bosses (every few waves)
  - Major bosses (every 10 waves)
  - Unique boss appearance and scaling
- Melee and ranged combat systems
- Inventory and weapon stacking (each pickup boosts stats)
- Hunger system and food pickups
- Game over state with health & hunger logic

### 🎨 Visuals
- Top-down grid-based movement
- Flash and damage effects
- Bosses have special colors, outlines, and size
- Enemies visually change based on behavior (wander/chase/flee)

### 🔊 Sound & Voice Integration
Using `p5.sound`, the game features:
- Ambient background music
- Sound effects for:
  - Collecting items
  - Shooting
  - Melee attacks
  - Damage feedback
- Voice lines:
  - "Boss Incoming"
  - "Wave Started"
  - "Victory"
  - "Game Over"

All audio is loaded and triggered contextually through game events.

---

## 🛠 Technologies Used

| Tool | Purpose |
|------|---------|
| **p5.js** | Canvas drawing, game loop, input handling |
| **p5.sound** | Audio playback, MP3 loading |
| **JavaScript** | Game logic, wave system, player and enemy behavior |
| **HTML** | Game bootstrapping via `index.html` |
| **GitHub Pages** *(optional)* | Hosting the playable game online |

---

## 📁 Folder Structure

<pre> ``` my-game/ ├── index.html # HTML entry point ├── game.js # Main game code (renamed from game (1).js) └── assets/ # All sound files (MP3s) ├── ambient_loop.mp3 ├── boss_intro.mp3 ├── wave_start.mp3 ├── collect.mp3 ├── slash.mp3 └── gunshot.mp3 ``` </pre>


---

## 🧪 How to Play the Game

> ⚠️ Note: Some browsers block local MP3s due to security (CORS). Please use one of the following options to run the game correctly.

### Option 1: Run via p5.js Web Editor (Easiest)
1. Visit [https://editor.p5js.org](https://editor.p5js.org)
2. Upload `game.js` and the `assets/` folder
3. Click **Run** to start the game

### Option 2: Use Local Server (for advanced users)
- Install VS Code and Live Server extension
- Or run this in terminal:
  ```bash
  python -m http.server
### 📣 Credits
Game Code: [Mohamed Ahmed](https://github.com/hazalkoom), [Yousef Mohamed](https://github.com/Yousefuwk20) 

Sounds: Pixabay, Freesound.org, or wherever you got them

Built using p5.js and p5.sound
