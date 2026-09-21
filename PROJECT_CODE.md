# PAUL: From Hunted to Hunter — Resume Code

## 🔑 PROJECT CODE
```
PAUL-3D-SWORD-2026
```

**Tell Grok:** Continue project **PAUL-3D-SWORD-2026**. Read `paul-game/PROJECT_CODE.md`.

## Status (current)
- ✅ 8 levels full 3D third-person (Three.js)
- ✅ Walk: Disciple, Paul, Ananias, Peter
- ✅ Mobile joystick + LOOK + Safari drag-look
- ✅ Music/SFX + volume presets
- ✅ localStorage save + Continue
- ✅ Level Select + Settings
- ✅ **Faith Stickers (12 achievements)** + toast unlocks
- ✅ **Confetti VFX** on level clear & final victory
- ✅ **PWA** — manifest + service worker + icons (Add to Home Screen / offline)

## Play
Open `paul-game/index.html`  
Or install as PWA from browser menu when served over http(s).

## Keys
- Save: `PAUL_3D_SWORD_2026`
- Achievements: `PAUL_3D_SWORD_2026_ACH`
- Volume: `PAUL_3D_VOL` / `PAUL_3D_VOL_PRESET`

## Main files
| File | Role |
|------|------|
| `js/game.js` | Story, UI, save, routing |
| `js/adventure-3d.js` | 3D engine levels 1–8 |
| `js/audio-mobile.js` | Audio + mobile controls |
| `js/achievements.js` | Stickers system |
| `js/vfx.js` | Confetti |
| `sw.js` + `manifest.json` | PWA offline |

## Next ideas
- More particle trails in 3D
- Daily challenge mode
- Leaderboard (optional, local only)
- GitHub Pages publish
- Multiplayer scripture quiz (future)

## Package
`/workspace/artifacts/paul-from-hunted-to-hunter-game.tar.gz`
