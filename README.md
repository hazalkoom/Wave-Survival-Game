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

