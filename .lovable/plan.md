

## Plan: Pergola Configurator — Terminology, Dimension Swap & Slat Calculation Overhaul

### Summary
Rename labels (נשאים → קורת חלוקה, רוחב/יציאה → טול/רוחב), add 20×100 slat size option, change the slat calculation formula to account for frame deduction, and restructure the per-carrier (קורת חלוקה) editing flow so each division beam independently configures slat size, gap, color, and lighting.

---

### Changes

#### 1. Translations — rename labels (both HE and AR)
- **רוחב** → stays as **רוחב** (width) but becomes the shorter dimension
- **עומק / הטלה** → rename to **אורך** (length) — so the form shows אורך + רוחב instead of רוחב + עומק
- **נשאים** → **קורות חלוקה** (everywhere: translations, specs summary, SVG labels, element editor)
- **שלבים לכל נשא** → **שלבים לכל קורת חלוקה**
- Arabic equivalents updated similarly (الحوامل → قوارص التقسيم, etc.)

**Files:** `src/i18n/translations.ts`

#### 2. Add 20×100 slat size option
- Add `{ id: '20x100', label: '20 × 100 mm', widthMm: 20, heightMm: 100 }` to `SLAT_SIZES` in `src/types/pergola.ts`
- Update `SlatSizeId` type
- Update `getSlatProfileHeight` in `src/lib/pergolaRules.ts` to handle '20x100'

**Files:** `src/types/pergola.ts`, `src/lib/pergolaRules.ts`

#### 3. New slat calculation formula
Current formula doesn't account for frame deduction. New formula:

```text
FRAME_DEDUCTION = 90mm (9cm total frame)
usableWidth = widthMm - FRAME_DEDUCTION

slatProfileWidth = 20mm (face width, same for all sizes)
gapMm = slatGapCm × 10

unitSize = slatProfileWidth + gapMm
slatCount = floor(usableWidth / unitSize)
```

Example: width=3000mm, gap=30mm, slat=70mm → usable=2910mm → unit=20+30=50 → 58 slats.

Wait — re-reading the user's message: "70 + 30 = 100, 291/100 = 29". The user means the **height** of the slat profile (70mm) is what counts in the spacing calculation, not the face width (20mm). So the unit = slatHeight + gapMm.

Updated formula:
```text
usableWidth = widthMm - 90  (frame deduction)
slatHeight = getSlatProfileHeight(slatSize)  // 40, 70, or 100
gapMm = slatGapCm × 10
unitSize = slatHeight + gapMm
slatCount = floor(usableWidth / unitSize)
```

**Files:** `src/lib/pergolaRules.ts` — update `calcSlatCount` and `calcSlatGapFromCount`

#### 4. SVG dimension labels swap
In the top view SVG, the horizontal dimension currently shows "רוחב" and vertical shows "יציאה/אורך". Swap so:
- Horizontal (width axis) = **רוחב**
- Vertical (length/depth axis) = **אורך**

The dimension values already use `widthMm` and `lengthMm` correctly, just the labels in the summary/specs need updating.

**Files:** `src/components/pergola/PergolaTopView.tsx` (label text), `src/components/pergola/PergolaSpecsSummary.tsx`

#### 5. Element editor — rename נשא → קורת חלוקה
All hardcoded Hebrew strings in `PergolaElementEditor.tsx` (like `נשא ${secIdx + 1}`, `תאורה בנשא`, `מרווח בין נשאים`) will be updated to use `קורת חלוקה` terminology and pulled from translations where possible.

**Files:** `src/components/pergola/PergolaElementEditor.tsx`

#### 6. SVG hover label update
In `PergolaTopView.tsx`, the section label on hover currently says `נשא {secIdx + 1} — {secSlatCount} שלבים`. Update to `קורת חלוקה {secIdx + 1} — {secSlatCount} שלבים`.

**Files:** `src/components/pergola/PergolaTopView.tsx`

---

### Technical Details

| File | What changes |
|------|-------------|
| `src/i18n/translations.ts` | Rename carriers→קורות חלוקה, length label, add new translation keys |
| `src/types/pergola.ts` | Add 20×100 to SLAT_SIZES |
| `src/lib/pergolaRules.ts` | New slat formula with 90mm frame deduction, use slatHeight instead of slatWidth for unit calculation |
| `src/components/pergola/PergolaElementEditor.tsx` | Rename נשא→קורת חלוקה, add 20×100 option (already uses SLAT_SIZES dynamically) |
| `src/components/pergola/PergolaTopView.tsx` | Update hover labels |
| `src/components/pergola/PergolaSpecsSummary.tsx` | Update carrier terminology |

