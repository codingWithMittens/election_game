# ELECTORAL STRATEGY
## Game Board Specification & Design Guide

**For Figma, Canva, or Print Production**

---

## BOARD OVERVIEW

The Electoral Strategy game board is a **US Electoral Map** with state tracking mechanisms. This document provides specifications for creating a professional game board.

---

## BOARD DIMENSIONS

### Standard Board Size
- **Dimensions**: 24" × 18" (landscape orientation)
- **Material**: Heavy cardstock or folding game board
- **Finish**: Matte (to reduce glare)

### Digital Design Specs (for Figma/Canva)
- **Resolution**: 300 DPI
- **Dimensions**: 7200px × 5400px
- **Bleed**: Add 0.125" (37.5px) on all sides for professional printing
- **Safe Zone**: Keep critical text/numbers 0.25" (75px) from edges

---

## BOARD LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│  ELECTORAL STRATEGY: Campaign for the Presidency           │
│                                                             │
│  ┌─────────────────┐  ┌────────── US MAP ──────────┐      │
│  │  ROUND TRACKER  │  │                             │      │
│  │                 │  │  [Individual states with    │      │
│  │  Rounds 1-12    │  │   electoral vote counts     │      │
│  │  [●○○○○○○○○○○○] │  │   and lean trackers]        │      │
│  │                 │  │                             │      │
│  │  DEBATE ROUNDS: │  │                             │      │
│  │  • Round 4      │  │                             │      │
│  │  • Round 8      │  │                             │      │
│  │  • Round 12     │  │                             │      │
│  └─────────────────┘  └─────────────────────────────┘      │
│                                                             │
│  ┌────────── ACTIVE EVENTS ──────────┐  ┌── SCORE ───┐    │
│  │  Slot 1: [Event card space]       │  │ Player 1:  │    │
│  │  Slot 2: [Event card space]       │  │ ___/270    │    │
│  │  Slot 3: [Event card space]       │  │            │    │
│  │  Slot 4: [Event card space]       │  │ Player 2:  │    │
│  └────────────────────────────────────┘  │ ___/270    │    │
│                                          └────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## SECTION 1: US ELECTORAL MAP

### Map Style
- **Base Style**: Simplified political map (no topography)
- **State Borders**: Clear, bold lines (3px width, #2C3E50 color)
- **State Fill**: Neutral light gray (#E8E8E8) as default
- **Water/Background**: Very light blue (#F0F8FF)

### State Information Display

Each state should show:
1. **State Abbreviation** (large, bold)
2. **Electoral Vote Count** (in a badge)
3. **Lean Tracker** (slider or marker track)
4. **Issue Priority Icons** (optional, for advanced play)

#### Example: Pennsylvania
```
┌─────────────────────┐
│        PA           │ ← State abbreviation (Oswald Bold, 24px)
│       ┌────┐        │
│       │ 19 │        │ ← Electoral votes (badge)
│       └────┘        │
│  ◄─────●─────►      │ ← Lean tracker (-15 to +15)
│   R    0    B       │
│                     │
│  Icons: 🏭 ⚕️       │ ← Priority: Economy, Healthcare
└─────────────────────┘
```

### Lean Tracker Design Options

**Option A: Linear Slider Track**
```
States lean left (-15) to right (+15)

-15  -10   -5    0    +5   +10   +15
 ├─────┼─────┼─────●─────┼─────┼─────┤
 RED         TOSS-UP         BLUE

● = Current lean position (movable marker)
```

**Option B: Circular Dial**
```
     BLUE (+15)
         │
    ┌────┼────┐
    │    ●    │  ← Rotatable dial
    └────┼────┘
         │
     RED (-15)
```

**Recommended**: Option A (linear slider) - easier to read and adjust

### Color Coding for Lean

| Lean Range | Color | Hex Code |
|------------|-------|----------|
| -15 to -10 | Strong Red | `#B91C1C` |
| -9 to -7 | Lean Red | `#EF4444` |
| -6 to -1 | Light Red | `#FCA5A5` |
| 0 | Neutral | `#F3F4F6` |
| +1 to +6 | Light Blue | `#93C5FD` |
| +7 to +9 | Lean Blue | `#3B82F6` |
| +10 to +15 | Strong Blue | `#1E40AF` |

**Control Threshold Markers**:
- Mark -7 and +7 with bold lines (these are control thresholds)
- States at ±7 or more are controlled by that player

---

## STATE LIST WITH STARTING POSITIONS

### Safe Blue States (Lean +10 to +15)
| State | Electoral Votes | Starting Lean |
|-------|-----------------|---------------|
| California (CA) | 54 | +12 |
| New York (NY) | 28 | +11 |
| Illinois (IL) | 19 | +10 |
| Washington (WA) | 12 | +11 |
| Massachusetts (MA) | 11 | +13 |
| Maryland (MD) | 10 | +12 |
| New Jersey (NJ) | 14 | +10 |
| Connecticut (CT) | 7 | +11 |
| Oregon (OR) | 8 | +10 |
| Hawaii (HI) | 4 | +14 |
| Vermont (VT) | 3 | +15 |
| Delaware (DE) | 3 | +11 |
| Rhode Island (RI) | 4 | +12 |

### Safe Red States (Lean -10 to -15)
| State | Electoral Votes | Starting Lean |
|-------|-----------------|---------------|
| Texas (TX) | 40 | -10 |
| Alabama (AL) | 9 | -13 |
| Mississippi (MS) | 6 | -14 |
| West Virginia (WV) | 4 | -15 |
| Oklahoma (OK) | 7 | -12 |
| Wyoming (WY) | 3 | -14 |
| Idaho (ID) | 4 | -12 |
| Utah (UT) | 6 | -11 |
| North Dakota (ND) | 3 | -12 |
| South Dakota (SD) | 3 | -11 |
| Nebraska (NE) | 5 | -11 |
| Kansas (KS) | 6 | -10 |
| Tennessee (TN) | 11 | -11 |
| Kentucky (KY) | 8 | -12 |
| Arkansas (AR) | 6 | -12 |
| Louisiana (LA) | 8 | -10 |
| Indiana (IN) | 11 | -10 |
| Missouri (MO) | 10 | -10 |
| South Carolina (SC) | 9 | -10 |
| Alaska (AK) | 3 | -11 |

### Lean Blue States (Lean +5 to +9)
| State | Electoral Votes | Starting Lean |
|-------|-----------------|---------------|
| Virginia (VA) | 13 | +6 |
| Colorado (CO) | 10 | +7 |
| New Mexico (NM) | 5 | +6 |
| Minnesota (MN) | 10 | +5 |
| New Hampshire (NH) | 4 | +5 |
| Maine (ME) | 4 | +6 |

### Lean Red States (Lean -5 to -9)
| State | Electoral Votes | Starting Lean |
|-------|-----------------|---------------|
| Florida (FL) | 30 | -6 |
| Ohio (OH) | 17 | -7 |
| Iowa (IA) | 6 | -6 |
| Montana (MT) | 4 | -8 |

### Swing States (Lean 0 to ±4)
| State | Electoral Votes | Starting Lean |
|-------|-----------------|---------------|
| Pennsylvania (PA) | 19 | 0 |
| Georgia (GA) | 16 | +1 |
| North Carolina (NC) | 16 | -2 |
| Michigan (MI) | 15 | +1 |
| Arizona (AZ) | 11 | 0 |
| Wisconsin (WI) | 10 | 0 |
| Nevada (NV) | 6 | +2 |

---

## SECTION 2: ROUND TRACKER

### Design Specifications

**Position**: Top-left corner of board
**Size**: 200px × 400px area
**Style**: Vertical track with 12 circles

```
┌─────────────────┐
│ ROUND TRACKER   │
├─────────────────┤
│  1  ●           │ ← Current round (filled circle)
│  2  ○           │ ← Future rounds (empty)
│  3  ○           │
│  4  ○ 🎯        │ ← Debate round icon
│  5  ○           │
│  6  ○ ⚡        │ ← Wild Cards enter
│  7  ○           │
│  8  ○ 🎯        │ ← Debate round
│  9  ○           │
│ 10  ○ 🏁        │ ← Final Stretch begins
│ 11  ○ 🏁        │
│ 12  ○ 🎯🏁      │ ← Final Debate + Game End
└─────────────────┘
```

**Typography**:
- Header: Oswald Bold, 18px, `#2C3E50`
- Round numbers: Inter Bold, 16px, `#2C3E50`
- Icons: 20px size

**Circle Markers**:
- Empty circle: 24px diameter, 3px border, `#CBD5E0`
- Filled circle: 24px diameter, solid `#2C5F99`

**Special Round Icons**:
- 🎯 Debate (Rounds 4, 8, 12)
- ⚡ Wild Cards (Round 6)
- 🏁 Final Stretch (Rounds 10-12)

---

## SECTION 3: ACTIVE EVENTS AREA

### Design Specifications

**Position**: Bottom-left of board
**Size**: 600px × 200px area
**Purpose**: Place drawn Event cards here

```
┌─────────────────────── ACTIVE EVENTS ────────────────────────┐
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │          │  │          │  │          │  │          │    │
│  │  Event   │  │  Event   │  │  Event   │  │  Event   │    │
│  │  Slot 1  │  │  Slot 2  │  │  Slot 3  │  │  Slot 4  │    │
│  │          │  │          │  │          │  │          │    │
│  │ Duration │  │ Duration │  │ Duration │  │ Duration │    │
│  │  [3]     │  │  [2]     │  │  [1]     │  │  [4]     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Event Card Slots**:
- Size: Each slot fits a standard poker card (2.5" × 3.5")
- Border: Dashed 2px, `#F39C12`
- Background: `#FFF9E6` (light yellow)
- Label: "Event Slot 1-4" (Inter Regular, 14px)

**Duration Tracker**:
- Below each slot
- Circle badges: Show remaining rounds (1-4)
- Style: Solid circle, `#F39C12` background, white text

---

## SECTION 4: SCORE TRACKER

### Design Specifications

**Position**: Bottom-right corner
**Size**: 200px × 200px area

```
┌────────────────────┐
│  ELECTORAL VOTES   │
├────────────────────┤
│                    │
│  Player 1:         │
│  ┌──────────────┐  │
│  │   215 / 270  │  │ ← Current / Goal
│  └──────────────┘  │
│                    │
│  Player 2:         │
│  ┌──────────────┐  │
│  │   198 / 270  │  │
│  └──────────────┘  │
│                    │
│  Player 3:         │
│  ┌──────────────┐  │
│  │   176 / 270  │  │
│  └──────────────┘  │
│                    │
│  Player 4:         │
│  ┌──────────────┐  │
│  │   143 / 270  │  │
│  └──────────────┘  │
│                    │
└────────────────────┘
```

**Typography**:
- Header: Oswald Bold, 18px, `#2C3E50`
- Player label: Inter Regular, 14px, `#2C3E50`
- Score numbers: Inter Bold, 24px, `#2C5F99`
- "/" and "270": Inter Regular, 18px, `#6C757D`

**Score Box**:
- Background: `#F8F9FA`
- Border: 2px solid, `#2C5F99`
- Padding: 10px
- Border-radius: 8px

**Victory Highlight**:
- When a player reaches 270+, highlight their box:
  - Background: `#10B981` (green)
  - Text: White
  - Add ⭐ icon

---

## SECTION 5: ISSUE PRIORITY ICONS (Optional Advanced)

If you want to show each state's policy priorities on the board:

### Icon Set
- 🏥 Healthcare
- 💼 Economy
- ⚡ Energy
- 🌍 Immigration
- 🎓 Education
- ⚖️ Social Issues
- 🛡️ Military/Defense
- 💻 Technology

### Display
- Show 1-3 priority icons per state
- Size: 16px each
- Position: Below electoral vote badge

**Example: Pennsylvania**
```
┌──────────┐
│    PA    │
│  ┌────┐  │
│  │ 19 │  │
│  └────┘  │
│ 💼 🏥 🛡️ │ ← Economy, Healthcare, Military priorities
└──────────┘
```

---

## SECTION 6: COLOR PALETTE

### Primary Colors
| Element | Color Name | Hex Code |
|---------|-----------|----------|
| Republican Red | Strong Red | `#B91C1C` |
| Democrat Blue | Strong Blue | `#1E40AF` |
| Neutral Gray | Medium Gray | `#9CA3AF` |
| Background | Off-White | `#F8F9FA` |

### UI Colors
| Element | Color Name | Hex Code |
|---------|-----------|----------|
| Text Primary | Almost Black | `#212529` |
| Text Secondary | Gray | `#6C757D` |
| Border | Medium Gray | `#CBD5E0` |
| Highlight | Gold | `#F59E0B` |

### State Lean Gradient
| Position | Description | Hex Code |
|----------|-------------|----------|
| -15 | Strong Red | `#B91C1C` |
| -10 | Medium Red | `#DC2626` |
| -5 | Light Red | `#FCA5A5` |
| 0 | Neutral | `#F3F4F6` |
| +5 | Light Blue | `#93C5FD` |
| +10 | Medium Blue | `#3B82F6` |
| +15 | Strong Blue | `#1E40AF` |

---

## SECTION 7: TYPOGRAPHY

### Font Stack
**Primary**: Oswald (Bold for headers)
**Secondary**: Inter (Regular and Bold for body text)
**Tertiary**: Roboto (for data/numbers)

### Text Hierarchy
| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Board Title | Oswald | 36px | Bold | `#2C3E50` |
| Section Headers | Oswald | 24px | Bold | `#2C3E50` |
| State Names | Oswald | 20px | Bold | `#212529` |
| Electoral Votes | Inter | 18px | Bold | `#2C5F99` |
| Lean Numbers | Roboto | 14px | Regular | `#6C757D` |
| Body Text | Inter | 16px | Regular | `#212529` |

---

## SECTION 8: GAME PIECES & TOKENS

### Lean Markers
**Design**: Small square/circular tokens
**Size**: 20mm × 20mm
**Material**: Cardboard or wooden tokens
**Colors**:
- Player 1: Blue (`#3B82F6`)
- Player 2: Red (`#EF4444`)
- Player 3: Green (`#10B981`)
- Player 4: Yellow (`#F59E0B`)

**Quantity Needed**:
- 15 markers per player (for tracking 15 different states max)

### Rally Markers
**Design**: Star-shaped tokens with "R" symbol
**Size**: 15mm diameter
**Material**: Cardboard tokens
**Style**:
- Background: `#8B5CF6` (purple)
- Icon: White star + "R"
- Border: 2px white

**Quantity Needed**: 12 total (3 per player max)

### Campaign Point Tokens
**Design**: Circular chips
**Denominations**:
- 1 point (white, 15mm)
- 5 points (blue, 20mm)
- 10 points (red, 25mm)

**Quantity Needed**:
- 40× 1-point tokens
- 20× 5-point tokens
- 10× 10-point tokens

### Round Tracker Marker
**Design**: Large circular token
**Size**: 30mm diameter
**Style**:
- Background: `#2C5F99`
- Icon: White "ROUND" text
- Border: 3px white

**Quantity Needed**: 1

---

## SECTION 9: BOARD PRODUCTION OPTIONS

### Option A: Print-and-Play (Home Use)
**Format**:
- PDF, 8.5" × 11" sheets
- Print on 4 sheets, tape together
- Laminate for durability

**Cost**: $5-10 (printing + lamination)

### Option B: Single-Piece Poster Board
**Format**:
- 24" × 18" poster
- Print through local print shop
- Mount on foam board

**Cost**: $15-30

### Option C: Professional Folding Board
**Format**:
- Bi-fold or quad-fold game board
- Heavy chipboard with linen finish
- Print through TheGameCrafter or PrintNinja

**Cost**: $30-60 per board (for prototypes)

### Option D: Neoprene Playmat
**Format**:
- 24" × 18" neoprene mat
- Print through InkedGaming or similar
- Rolls up for storage

**Cost**: $25-40

**Recommended for Prototype**: Option B (poster on foam board)
**Recommended for Production**: Option C (professional folding board)

---

## SECTION 10: FIGMA/CANVA WORKFLOW

### Step-by-Step Board Creation

**In Figma:**

1. **Create Frame**
   - 7200px × 5400px (24" × 18" at 300 DPI)
   - Add bleed guides (+37.5px all sides)

2. **Import US Map**
   - Use free vector map from:
     - Wikimedia Commons (SVG)
     - Vecteezy (free with attribution)
   - Or trace using Pen tool

3. **Style States**
   - Apply neutral gray fill (`#E8E8E8`)
   - Add state borders (3px, `#2C3E50`)
   - Label each state (abbreviation + electoral votes)

4. **Add Lean Trackers**
   - Create component for lean slider
   - Duplicate for each state
   - Set starting positions based on table above

5. **Design Sections**
   - Round Tracker (top-left)
   - Active Events (bottom-left)
   - Score Tracker (bottom-right)

6. **Add Typography & Icons**
   - Use specified fonts
   - Import icons (Feather Icons or Heroicons)

7. **Export**
   - PDF for print
   - PNG (high-res) for digital use

**In Canva:**

1. **Custom Size**
   - Create custom 24" × 18" document
   - Use "Print" quality setting

2. **US Map**
   - Search Canva's elements for "US map"
   - Use editable map element
   - Customize colors

3. **Add Elements**
   - Use shapes for lean trackers
   - Text boxes for state labels
   - Frames for event slots

4. **Use Canva AI**
   - Generate background textures
   - Create custom icons if needed

5. **Export**
   - Download as PDF (print)
   - Use Canva Print for professional printing

---

## SECTION 11: ACCESSIBILITY CONSIDERATIONS

### Colorblind-Friendly Design
- Don't rely solely on color for state control
- Add symbols/patterns:
  - Red states: Diagonal stripes
  - Blue states: Dots pattern
  - Neutral: Solid fill

### High-Contrast Mode
- Ensure text has 4.5:1 contrast ratio minimum
- Use bold borders for state divisions
- Increase font sizes if needed

### Large Print Version
- Create 36" × 24" version with 1.5× larger text
- Increase lean tracker markers to 30mm

---

## SECTION 12: DIGITAL BOARD (Optional)

For Tabletop Simulator or digital play:

**Specifications**:
- 4096px × 4096px (square format)
- PNG format
- RGB color mode
- Separate layers for:
  - Base map
  - Lean markers (movable objects)
  - Event slots
  - Score tracker (scripted)

---

## FINAL CHECKLIST

Before sending to production:

✅ All 50 states + DC labeled correctly
✅ Electoral vote counts accurate (totaling 538)
✅ Starting lean positions set
✅ Round tracker shows 12 rounds + special markers
✅ Event slots for 4 cards
✅ Score tracker for up to 4 players
✅ Bleed area added (if printing professionally)
✅ Safe zones respected (no critical text near edges)
✅ Colors in CMYK (if printing professionally)
✅ Typography clearly legible at actual size
✅ All icons/symbols included
✅ Legend/key for lean tracker included

---

## RESOURCE LINKS

**Free US Maps**:
- Wikimedia Commons: https://commons.wikimedia.org (search "blank US map SVG")
- Vecteezy: Free vector maps with attribution

**Icons**:
- Feather Icons: https://feathericons.com (free, MIT license)
- Heroicons: https://heroicons.com (free, MIT license)

**Fonts**:
- Oswald: Google Fonts (free)
- Inter: Google Fonts (free)
- Roboto: Google Fonts (free)

**Printing Services**:
- TheGameCrafter: https://www.thegamecrafter.com
- PrintNinja: https://www.printninja.com
- Local print shops: FedEx Office, Staples, etc.

---

**This board is the centerpiece of your game—make it beautiful and functional!**

Good luck with production! 🎨🗺️
