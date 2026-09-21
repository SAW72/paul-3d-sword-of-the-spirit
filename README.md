# PAUL: From Hunted to Hunter — Sword of the Spirit

**Project code:** `PAUL-3D-SWORD-2026`  
Full **3D third-person** Bible adventure for ages **8–15**.

## Play now
- Open `index.html` locally, **or**
- **GitHub Pages:** after deploy → `https://SAW72.github.io/paul-3d-sword-of-the-spirit/`

## Features
- 8 full 3D levels (Three.js) — Jerusalem → Nero’s court
- Controllable characters with walk cycles
- Mobile joystick + Safari-safe look
- Faith Stickers achievements + confetti
- Save / Continue (localStorage)
- PWA installable when hosted on HTTPS


**Realistic cinematic faith adventure game** for ages 8–15.

Play the full arc of the Apostle Paul — from hunted young disciple to the man who finishes the race with the crown of righteousness.

## Play Now
Just open **`index.html`** in any modern browser (Chrome, Edge, Firefox, Safari).  
Works completely offline. No install. No account.

## Features
- 8 story levels matching the full script
- **Photorealistic character portraits** (Young Disciple, Ananias, Saul → Paul, Peter, Guard, Final crowned Paul)
- Stealth mini-game with real character sprites
- Verse-matching challenges from Acts, Galatians, Ephesians, 2 Timothy
- Beautiful modern game UI (Cinzel + Inter fonts, gold theme, smooth animations)
- Lives system, score, progress bar
- Character gallery
- Victory screen with the crown of righteousness

## Characters (realistic art)
- Young Disciple (you in Level 1)
- Ananias of Damascus
- Young Saul the persecutor
- Paul the mature apostle
- Peter
- Saul’s temple guard
- Final Paul with the crown

## Deploy to GitHub Pages (free public game)
1. Create a new repository on GitHub
2. Upload **everything** inside this `paul-game` folder
3. Go to Settings → Pages → Source: Deploy from branch `main` / root
4. Your game goes live at `https://yourusername.github.io/repo-name/`

## Tech
Pure HTML5 + CSS3 + Vanilla JS. No frameworks. No build tools.  
Cover art + all character art generated with Grok Imagine (xAI).

## Credits
- Original game script & concept: You
- Implementation, polish & realistic character art: Grok (xAI)
- Source: Book of Acts + Pauline Epistles

> “I have fought the good fight, I have finished the race, I have kept the faith.”  
> — 2 Timothy 4:7

## NEW: Controllable Animated Character (Level 1)

Level 1 is now a **real-time playable stealth level**:
- **WASD or Arrow keys** to move the Young Disciple
- **Camera follows** the character (third-person style follow)
- **Animated walk cycle** using realistic full-body sprites
- Patrolling guards with collision detection
- Hide zones (stalls, cart, doorway, arch)
- Reach the City Gate to complete the level
- Lives shared with the rest of the game

Powered by Phaser 3. Works in any modern browser.

## FULL 3D Third-Person Mode (NEW)

Level 1 is now a **real 3D third-person stealth game**:
- Three.js powered 3D Jerusalem alley at night
- True third-person camera that follows behind the Young Disciple
- Mouse look (click to capture pointer) + WASD movement
- Animated realistic character (idle + walk cycle sprites as 3D billboards)
- Dynamic torch lights, shadows, fog
- Wooden stalls as hide cover
- Patrolling guards with collision
- Glowing green City Gate exit
- Switch button to classic 2D Phaser version if preferred

This is the "awesome" mode kids will love.

## Levels 1–5: FULL 3D Third-Person (DONE)

| Level | 3D Scene | You control | Goal |
|-------|----------|-------------|------|
| 1 Jerusalem | Night alley, torches, stalls | Young Disciple (animated walk) | Hide from guards → City Gate |
| 2 Damascus | Daytime street | Ananias | Reach House of Judas → Trust/Run choice |
| 3 Lystra | Day plaza | Paul | Reach the lame man → verse choice |
| 4 Malta | Beach + fire | Paul | Reach the fire → courage vs viper |
| 5 Antioch | Market | Paul | Reach Peter → Galatians confrontation |

**Controls:** Click the 3D view → WASD move + mouse look  
**Skip** button available if someone only wants the story UI.

Levels 6–8 remain the polished narrative/verse UI (can be upgraded to 3D next).

## ALL 8 LEVELS: FULL 3D (COMPLETE)

| # | Level | 3D Environment | You play as | Goal |
|---|-------|----------------|-------------|------|
| 1 | Jerusalem Escape | Night alley + torches | Young Disciple | Hide → City Gate |
| 2 | Damascus | Day street | Ananias | House of Judas → Trust/Run |
| 3 | Lystra | Plaza | Paul | Lame man → Acts 14 words |
| 4 | Malta | Beach + fire | Paul | Viper courage |
| 5 | Antioch | Market | Paul + Peter | Galatians confrontation |
| 6 | Ephesus | Temple ruins + columns | Paul | Armor of God (not formula) |
| 7 | Rome House Arrest | Mosaic room + desk | Paul | Match Prison Letters |
| 8 | Final Stand | Marble court + pillars | Paul | 2 Timothy 4:6-8 → crown |

**Controls every level:** Click 3D view → WASD move + mouse look → walk to green goal → make the faith choice.



## Progress save
- Auto-saves to browser `localStorage` key `PAUL_3D_SWORD_2026`
- **Continue** on title screen resumes your level / lives / score
- **Settings** → volume presets (Mute / Low / Normal / High) + Clear Save

## GitHub Pages (free public link)
```bash
# from the paul-game folder contents at repo root:
# 1. Create empty repo on github.com
# 2. Upload ALL files inside paul-game/ (index.html must be at repo root OR in /docs)
# 3. Settings → Pages → Deploy from branch: main → / (root)
# 4. Wait 1–2 min → open https://YOURUSER.github.io/REPO/
```

Or drag-and-drop the extracted `paul-game` folder into a new repo via the GitHub web UI.

## Project code for Grok
`PAUL-3D-SWORD-2026`


## Faith Stickers & PWA
- Title → **Faith Stickers** — 12 collectible achievements
- Level clear & final victory → confetti + sticker toasts
- **PWA:** `manifest.json` + `sw.js` — installable / offline when hosted on https (or localhost)
