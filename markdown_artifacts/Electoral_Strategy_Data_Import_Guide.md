# Electoral Strategy - Data Import Guide
## Using JSON and CSV Files for Batch Production

**Version**: 1.0
**Created**: 2026-08-14

---

## 📦 AVAILABLE DATA FILES

You now have structured data exports for easy batch processing:

### 1. **Electoral_Strategy_Cards.json** (Large)
Complete card database in JSON format with all 85 cards, including:
- Full card effects and mechanics
- Dice roll specifications
- Target states and backlash states
- Structured data for programmatic access

**Best for**: Web apps, game engines, custom tools, API integrations

### 2. **Electoral_Strategy_Cards.csv** (85 rows)
All cards in spreadsheet format with columns:
- id, name, type, subtype, cost
- primary_effect, backlash, special
- requires_dice, dice_type
- flavor_text, target_states, backlash_states
- duration (for events), is_crisis

**Best for**: Excel, Google Sheets, nanDECK, database imports

### 3. **Electoral_Strategy_States.json** (51 states)
Complete state data including:
- Electoral votes per state
- Starting lean positions
- Priority issues
- Regional groupings
- Special rules (ME, NE split votes)

**Best for**: Building the game board, state logic, web visualizations

### 4. **Electoral_Strategy_States.csv** (51 rows)
State data in spreadsheet format with columns:
- abbreviation, name, electoral_votes
- starting_lean, lean_category
- priority_issues, region, special_notes

**Best for**: Excel charts, Google Sheets maps, board design

### 5. **Electoral_Strategy_Components.json**
Complete component specifications:
- Token quantities and sizes
- Board dimensions
- Print specifications
- Production cost estimates

**Best for**: Manufacturing quotes, component checklists, shopping lists

---

## 🎯 USE CASES

### Use Case 1: Mass-Produce Cards with nanDECK

**nanDECK** is free software that generates card images from spreadsheet data.

**Steps:**
1. Download nanDECK: http://www.nand.it/nandeck/
2. Open `Electoral_Strategy_Cards.csv` in Excel
3. Create nanDECK script (see example below)
4. Generate all 85 card images automatically
5. Export as print-ready PDFs

**Sample nanDECK Script:**
```
; Electoral Strategy Cards
BORDER=RECTANGLE,0,0,100%,100%,#000000,0.1
CARDSIZE=2.5,3.5
DPI=300

LINK=Electoral_Strategy_Cards.csv

RECTANGLE=0,0,100%,20%,{type_color}
TEXT="[name]",0,2%,100%,18%,Arial,18,B,#FFFFFF,CENTER

IMAGE="[icon]",25%,22%,50%,30%

TEXT="[primary_effect]",5%,55%,90%,20%,Arial,12,,#000000,LEFT

TEXT="[flavor_text]",5%,85%,90%,10%,Arial,10,I,#666666,CENTER
```

**Time to generate 85 cards**: ~5 minutes

---

### Use Case 2: Import into Google Sheets for Balancing

**Steps:**
1. Open Google Sheets
2. File → Import → Upload `Electoral_Strategy_Cards.csv`
3. Now you can:
   - Sort by cost to see card balance
   - Filter by type (Policy, Campaign, Event)
   - Create pivot tables to analyze card distribution
   - Chart card costs vs effects

**Example Analysis:**
```
=AVERAGE(D2:D86)  // Average card cost
=COUNTIF(C2:C86,"Policy")  // Count policy cards
=FILTER(A2:K86, I2:I86=TRUE)  // Show only dice cards
```

**Use this to**:
- Adjust card costs after playtesting
- Ensure balanced distribution across subtypes
- Track which cards need dice rolls
- Export updated CSV for re-import

---

### Use Case 3: Build Interactive Web App

**Using the JSON files, you can create a digital version:**

**Example: React Component**
```javascript
import cardsData from './Electoral_Strategy_Cards.json';
import statesData from './Electoral_Strategy_States.json';

function CardDisplay({ cardId }) {
  const card = cardsData.cards.find(c => c.id === cardId);

  return (
    <div className="card" style={{borderColor: getCardColor(card.type)}}>
      <h2>{card.name}</h2>
      <p className="subtype">{card.type} · {card.subtype}</p>
      <div className="cost">{card.cost}</div>
      <p className="effect">{card.primary_effect}</p>
      {card.requires_dice && <DiceRoller card={card} />}
      <p className="flavor"><em>{card.flavor_text}</em></p>
    </div>
  );
}

function StateMap() {
  return (
    <svg viewBox="0 0 1000 600">
      {statesData.states.map(state => (
        <State
          key={state.abbreviation}
          data={state}
          lean={gameState.leans[state.abbreviation]}
        />
      ))}
    </svg>
  );
}
```

**Frameworks to use:**
- React + Vite (web app)
- Unity + C# (mobile game)
- Tabletop Simulator (Lua scripting)
- Python + Pygame (desktop app)

---

### Use Case 4: Create Tabletop Simulator Mod

**Steps:**
1. Load `Electoral_Strategy_Cards.json` into a script
2. Generate card images programmatically
3. Create TTS deck JSON:

```json
{
  "ObjectStates": [
    {
      "Name": "DeckCustom",
      "ContainedObjects": [
        {
          "CardID": 100,
          "Name": "Card",
          "Nickname": "Universal Healthcare Plan",
          "Description": "Policy - Healthcare\n+3 lean in MA, NY, CA, OR, WA",
          "Transform": {...}
        },
        // ... repeat for all 85 cards
      ]
    }
  ]
}
```

**Benefit**: Playtest remotely with friends before printing!

---

### Use Case 5: Database Import for Online Multiplayer

**If building a server-based multiplayer game:**

**PostgreSQL Example:**
```sql
CREATE TABLE cards (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(20),
    subtype VARCHAR(30),
    cost INTEGER,
    primary_effect TEXT,
    backlash TEXT,
    special TEXT,
    requires_dice BOOLEAN,
    flavor_text TEXT
);

COPY cards FROM '/path/to/Electoral_Strategy_Cards.csv'
DELIMITER ',' CSV HEADER;

CREATE TABLE states (
    abbreviation VARCHAR(2) PRIMARY KEY,
    name VARCHAR(50),
    electoral_votes INTEGER,
    starting_lean INTEGER,
    lean_category VARCHAR(20),
    priority_issues TEXT,
    region VARCHAR(20)
);

COPY states FROM '/path/to/Electoral_Strategy_States.csv'
DELIMITER ',' CSV HEADER;
```

**Then query:**
```sql
-- Get all swing state cards
SELECT * FROM cards
WHERE target_states LIKE '%PA%'
   OR target_states LIKE '%MI%'
   OR target_states LIKE '%WI%';

-- Calculate total electoral votes
SELECT SUM(electoral_votes) FROM states;

-- Get all crisis events
SELECT * FROM cards
WHERE type = 'Event' AND is_crisis = 'TRUE';
```

---

### Use Case 6: Excel Pivot Tables for Analysis

**Open `Electoral_Strategy_Cards.csv` in Excel:**

**Analysis 1: Card Cost Distribution**
1. Insert → PivotTable
2. Rows: `type`
3. Columns: `cost`
4. Values: `COUNT of id`

Result:
```
         Cost 0  Cost 1  Cost 2  Cost 3
Policy     0      1       17      12
Campaign   4      5       8       3
Event      25     0       0       0
Special    10     0       0       0
```

**Analysis 2: Dice Requirement by Type**
1. Rows: `type`
2. Columns: `requires_dice`
3. Values: `COUNT of id`

**Analysis 3: Average Card Cost**
```
=AVERAGEIF(C2:C86,"Policy",E2:E86)  // Average Policy cost: 2.17
=AVERAGEIF(C2:C86,"Campaign",E2:E86)  // Average Campaign cost: 1.55
```

---

### Use Case 7: Print Shop Batch Order

**Send CSV to print shop for custom order:**

**Example email to print shop:**
```
Hi,

I need 85 custom game cards printed. Specifications:
- Size: 2.5" x 3.5" (poker size)
- Stock: 350gsm cardstock
- Finish: Linen or smooth
- Quantity: 100 copies of each card (8,500 total)

I've attached Electoral_Strategy_Cards.csv with:
- Card names in column B
- Card IDs in column A
- Design notes in columns F-H

I'll provide print-ready PDFs for each card ID.

Total quote for 8,500 cards?
```

**They can import the CSV to track your order**

---

## 🛠️ TOOLS THAT ACCEPT CSV/JSON

### Design & Production Tools

| Tool | Format | Use Case |
|------|--------|----------|
| **nanDECK** | CSV | Auto-generate card images |
| **Card Conjurer** | CSV | MTG-style card creator |
| **Squib** (Ruby) | CSV/JSON | Code-based card generation |
| **Excel / Google Sheets** | CSV | Analysis, balancing, charts |
| **Airtable** | CSV | Database management |
| **TableTop.to** | JSON | Online card game builder |

### Game Development Tools

| Tool | Format | Use Case |
|------|--------|----------|
| **Unity** | JSON | Import game data into C# scripts |
| **Godot** | JSON | Load card definitions |
| **Tabletop Simulator** | JSON | Create TTS mod |
| **Board Game Arena** | JSON | Online multiplayer platform |
| **Vassal Engine** | CSV/XML | Digital board game module |

### Database Tools

| Tool | Format | Use Case |
|------|--------|----------|
| **PostgreSQL** | CSV | Import with COPY command |
| **MySQL** | CSV | LOAD DATA INFILE |
| **MongoDB** | JSON | mongoimport --file cards.json |
| **SQLite** | CSV | .import cards.csv cards |
| **Firebase** | JSON | Direct JSON import |

---

## 📊 DATA STRUCTURE REFERENCE

### Cards JSON Structure
```json
{
  "id": "POL-HEA-001",
  "name": "Universal Healthcare Plan",
  "type": "Policy",
  "subtype": "Healthcare",
  "cost": 3,
  "primary_effect": "...",
  "backlash": "...",
  "special": null,
  "requires_dice": false,
  "dice_mechanic": {...},
  "flavor_text": "...",
  "target_states": ["MA", "NY", "CA"],
  "backlash_states": ["TX", "FL"]
}
```

### States JSON Structure
```json
{
  "abbreviation": "PA",
  "name": "Pennsylvania",
  "electoral_votes": 19,
  "starting_lean": 0,
  "lean_category": "Swing",
  "priority_issues": ["Economy", "Healthcare", "Manufacturing"],
  "region": "Northeast"
}
```

---

## 🔧 COMMON WORKFLOWS

### Workflow 1: Design → Test → Revise

1. **Edit cards in Google Sheets**
   - Import `Electoral_Strategy_Cards.csv`
   - Adjust costs, effects after playtesting
   - Export as CSV

2. **Re-import into nanDECK**
   - Generate new card images
   - Print updated prototypes

3. **Playtest again**
   - Record notes in spreadsheet
   - Repeat until balanced

### Workflow 2: Digital → Physical

1. **Build web prototype** using JSON
2. **Playtest online** with friends
3. **Export final card list** as CSV
4. **Send to print shop** for physical production

### Workflow 3: Localization

1. **Duplicate CSV file** for each language
2. **Translate columns**: name, primary_effect, backlash, flavor_text
3. **Keep IDs identical** (e.g., POL-HEA-001 in all versions)
4. **Generate cards** in multiple languages

**Example:**
- `Electoral_Strategy_Cards_EN.csv` (English)
- `Electoral_Strategy_Cards_ES.csv` (Spanish)
- `Electoral_Strategy_Cards_FR.csv` (French)

---

## 💡 ADVANCED TIPS

### Tip 1: Version Control with Git

```bash
git add Electoral_Strategy_Cards.csv
git commit -m "Balanced Policy card costs after playtest"
git push

# Later, compare versions
git diff v1.0 v1.1 Electoral_Strategy_Cards.csv
```

**Track changes** to card balance over time!

### Tip 2: Automated Testing

**Python script to validate card data:**
```python
import json

with open('Electoral_Strategy_Cards.json') as f:
    data = json.load(f)

# Check for duplicates
ids = [card['id'] for card in data['cards']]
assert len(ids) == len(set(ids)), "Duplicate card IDs found!"

# Validate costs
for card in data['cards']:
    assert 0 <= card['cost'] <= 3, f"{card['name']} has invalid cost"

# Check total count
assert len(data['cards']) == 85, "Expected 85 cards!"

print("✓ All validations passed!")
```

### Tip 3: Dynamic Card Generation

**Generate variant cards programmatically:**
```python
import csv

base_card = {
    'id': 'POL-ECO-XXX',
    'type': 'Policy',
    'subtype': 'Economy',
    'cost': 2,
    'requires_dice': False
}

states = ['PA', 'MI', 'WI', 'OH']

for state in states:
    card = base_card.copy()
    card['id'] = f'POL-ECO-{state}'
    card['name'] = f'{state} Jobs Program'
    card['primary_effect'] = f'+3 lean in {state}'
    # ... write to CSV
```

**Create expansion packs** automatically!

### Tip 4: Merge with External Data

**Example: Add real election results**
```python
import pandas as pd

# Load game states
states = pd.read_csv('Electoral_Strategy_States.csv')

# Load real 2024 results (from external source)
results_2024 = pd.read_csv('2024_election_results.csv')

# Merge
merged = states.merge(results_2024, on='abbreviation')

# Adjust starting lean based on real data
merged['starting_lean'] = merged['actual_2024_margin']

# Export updated version
merged.to_csv('Electoral_Strategy_States_2024.csv', index=False)
```

**Create historical scenarios!**

---

## 🎨 INTEGRATION WITH DESIGN TOOLS

### Canva Bulk Create (Canva Pro)

1. Upload `Electoral_Strategy_Cards.csv`
2. Use Canva's **Bulk Create** feature
3. Map CSV columns to design elements:
   - Column B (name) → Card title text
   - Column F (primary_effect) → Effect text box
   - Column K (flavor_text) → Flavor text box
4. Generate all 85 cards automatically
5. Export as individual PNGs

**Time saved**: Hours vs. manually creating each card!

### Figma Variables

1. Import JSON into Figma plugin
2. Use Figma Variables to populate card templates
3. Auto-generate instances for all 85 cards
4. Export for production

---

## 📦 EXPORTING FOR DIFFERENT PLATFORMS

### TheGameCrafter.com

**Required format**: Individual PNG files (one per card)

**Workflow:**
1. Use nanDECK + CSV to generate 85 PNG files
2. Name files: `POL-HEA-001.png`, `POL-HEA-002.png`, etc.
3. Upload to TheGameCrafter
4. Order prints

### Tabletop Simulator

**Required format**: 10×7 card sheet (70 cards per image)

**Workflow:**
1. Generate individual cards from CSV
2. Use ImageMagick to create sheet:
```bash
montage POL-*.png -tile 10x7 -geometry 300x420+0+0 policy_sheet.png
```
3. Import into TTS

### Print & Play (Home)

**Required format**: 3×3 print sheets (9 cards per page)

**Workflow:**
1. Generate cards from CSV
2. Arrange 9 per page in PowerPoint or Canva
3. Export as PDF
4. Print on cardstock

---

## 🔍 QUERY EXAMPLES

### JSON (JavaScript)
```javascript
const data = require('./Electoral_Strategy_Cards.json');

// All risky cards that require dice
const riskyCards = data.cards.filter(c => c.requires_dice);

// All events that are crises
const crises = data.cards.filter(c => c.type === "Event" && c.is_crisis);

// Average policy card cost
const policyCosts = data.cards
  .filter(c => c.type === "Policy")
  .map(c => c.cost);
const avgCost = policyCosts.reduce((a,b) => a+b) / policyCosts.length;
```

### CSV (SQL via csvkit)
```bash
# Install csvkit
pip install csvkit

# Query CSV files like a database
csvsql --query "SELECT type, COUNT(*) FROM Electoral_Strategy_Cards GROUP BY type" Electoral_Strategy_Cards.csv

# Filter for high-cost cards
csvsql --query "SELECT name, cost FROM Electoral_Strategy_Cards WHERE cost >= 3" Electoral_Strategy_Cards.csv

# Join cards with states
csvsql --query "
  SELECT c.name, s.electoral_votes
  FROM cards c
  JOIN states s ON c.target_states LIKE '%' || s.abbreviation || '%'
" Electoral_Strategy_Cards.csv Electoral_Strategy_States.csv
```

---

## ✅ DATA VALIDATION CHECKLIST

Before using the data files:

- [ ] Verify total card count (should be 85)
- [ ] Check for duplicate IDs
- [ ] Validate all costs are 0-3
- [ ] Ensure all states have electoral votes
- [ ] Total electoral votes = 538
- [ ] All target_states use valid abbreviations
- [ ] All CSV files open without errors
- [ ] JSON files validate with JSONLint
- [ ] No special characters break imports

---

## 🚀 NEXT STEPS

1. **Choose your workflow** based on use case above
2. **Import data** into your tool of choice
3. **Generate prototypes** or digital version
4. **Iterate and improve** using the structured data
5. **Export updated CSVs/JSONs** after changes

---

## 📖 ADDITIONAL RESOURCES

**Data Formats:**
- JSON validator: https://jsonlint.com
- CSV editor: https://www.convertcsv.com/csv-viewer-editor.htm

**Tools:**
- nanDECK: http://www.nand.it/nandeck/
- Squib (Ruby): https://squib.rocks
- csvkit: https://csvkit.readthedocs.io

**Tutorials:**
- nanDECK tutorial: https://www.youtube.com/results?search_query=nandeck+tutorial
- Google Sheets import: https://support.google.com/docs/answer/40608

---

**Your data is now ready for batch production, automation, and digital integration!** 🎉
