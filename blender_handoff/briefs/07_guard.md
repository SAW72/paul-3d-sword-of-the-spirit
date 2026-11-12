# Brief: Saul’s Guard / Temple Soldier (Enemy — Level 1)

**ID:** `guard`  
**Role key:** `guard`  
**Reference:** `../references/guard.jpg`  
**Export:** `guard.glb`  
**Instances:** Multiple in Level 1 — keep polycount conservative

## Identity
Fully armored Roman-style / temple soldier. Torch and spear in story art. Stealth enemy for Jerusalem escape. Intimidating, not cartoonish.

## Face & hair
- Olive skin, stern square face
- Dark eyes under helmet shadow
- Short dark hair (mostly hidden by helmet)
- Stubble / short beard OK
- Jaw set, duty-bound scowl

## Body
- ~1.78 m, bulkier than civilians
- Armor adds volume

## Armor & clothing (match portrait closely)
| Part | Look | Hex base |
|------|------|----------|
| Helmet | Bronze / brass with cheek guards, crest plume (red) | `#6A6050` / metal `#8A7A58` |
| Breastplate | Segmented bronze / brass, ornate | `#8A7A58` |
| Shoulder guards | Matching metal | bronze |
| Tunic under armor | Deep crimson / dark red | `#6A1814` |
| Cape | Dark red / maroon draped back | crimson |
| Greaves / arm guards | Bronze | metal |
| Belt | Leather + metal plates | brown + bronze |

## Props
1. **Spear** — long wooden shaft + metal tip (code already attaches spear to right hand)
2. Optional **torch** for alternate variant (or separate attachment)

Export spear as child of `hand_R` bone or separate object named `spear`.

## Silhouette
bronze helmet + plume · crimson cape · spear · armored bulk

## Performance
Target **≤ 7k tris** including armor. Prefer reusable armor pieces.
