# Defense Procurement Anomaly Agent - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive AIP Agent in Palantir Foundry that reads contract data from the Ontology, uses a custom AIP Logic function to detect anomalies, and writes results back to a flag object. Complete in 6-7 hours once Dev Tier access is granted.

**Architecture:** AIP Agent (Agent Studio) + AIP Logic function + Workshop app. Agent reads Ontology (Award, Vendor, AnomalyFlag), calls custom tool to analyze each award, writes flag objects back which appear in real-time in Workshop table. No pipeline automation — interactive only.

**Tech Stack:** Palantir Foundry (Ontology, AIP Agent Studio, AIP Logic, Workshop), synthetic CSV data, JSON-structured AI output

---

## Pre-requisites Checklist

- [ ] AIP Dev Tier account approved (signup: https://www.palantir.com/developers/)
- [ ] Access to Palantir Foundry console
- [ ] Ability to create datasets, ontology objects, AIP Logic functions, AIP Agents, Workshop apps
- [ ] Basic familiarity with Foundry UI (navigate to datasets, ontology, agent studio, workshop)
- [ ] ~6-7 hours of focused work time

---

## Chunk 1: Environment Setup & Data Preparation (1 hour)

### Task 1: Prepare Synthetic CSV Datasets

**Files to create:**
- `data/awards.csv`
- `data/vendors.csv`
- `data/program_baselines.csv`

**Goal:** Create small but realistic datasets that demonstrate both anomaly patterns clearly.

- [ ] **Step 1: Create data directory**

```bash
mkdir -p data
```

- [ ] **Step 2: Generate awards.csv (100 rows)**

Write to `data/awards.csv`:

```csv
award_id,program_code,vendor_name,award_amount,award_date,awarding_agency,contract_description
M67854-20-2203,AIRCRAFT,Lockheed Martin,4800000,2020-03-15,Department of the Navy,Procurement of F-35 Lightning II aircraft components including structural modifications and delivery schedule adjustments
M67854-20-2204,AIRCRAFT,Boeing,5200000,2020-04-20,Department of the Navy,Aircraft maintenance support services and technical improvements
M67854-20-2205,AIRCRAFT,Lockheed Martin,12500000,2020-05-10,Department of the Navy,Advanced radar systems procurement with multiple scope adjustmentsanticipated
M67854-20-2206,SHIPS,Raytheon,3200000,2020-06-05,Department of the Navy,Shipboard combat system integration and testing
M67854-20-2207,AIRCRAFT,Lockheed Martin,4200000,2020-07-12,Department of the Navy,Pilot training equipment and simulation modifications required
M67854-20-2208,WEAPONS,Northrop Grumman,2800000,2020-08-18,Department of the Navy,Missile guidance system upgrades and maintenance contracts
M67854-20-2209,AIRCRAFT,Lockheed Martin,5100000,2020-09-22,Department of the Navy,Aircraft parts supply and logistics support with price adjustments
M67854-20-2210,SHIPS,General Dynamics,4500000,2020-10-30,Department of the Navy,Ship maintenance and modernization program for destroyer class
M67854-20-2211,AIRCRAFT,Lockheed Martin,7800000,2020-11-15,Department of the Navy,Combat aircraft sustainment and modification tracking improvements
M67854-20-2212,WEAPONS,Raytheon,3500000,2020-12-08,Department of the Navy,Missile defense system testing and evaluation support
M67854-20-2213,AIRCRAFT,Boeing,4900000,2021-01-20,Department of the Navy,Aircraft structural repairs and corrosion control services
M67854-20-2214,SHIPS,Lockheed Martin,8900000,2021-02-14,Department of the Navy,Littoral combat ship systems integration with multiple change orders
M67854-20-2215,AIRCRAFT,Northrop Grumman,5600000,2021-03-22,Department of the Navy,Unmanned aerial vehicle development and testing
M67854-20-2216,WEAPONS,Lockheed Martin,12000000,2021-04-05,Department of the Navy,Missile production with delivery schedule modifications
M67854-20-2217,AIRCRAFT,Boeing,6300000,2021-05-17,Department of the Navy,Aircraft engine overhaul and performance upgrades
M67854-20-2218,SHIPS,Raytheon,4100000,2021-06-22,Department of the Navy,Naval radar system installation and calibration services
M67854-20-2219,AIRCRAFT,Lockheed Martin,18500000,2021-07-08,Department of the Navy,Major aircraft procurement program with numerous modifications and cost adjustments exceeding original scope
M67854-20-2220,WEAPONS,General Dynamics,2900000,2021-08-15,Department of the Navy,Ammunition supply and logistics management
M67854-20-2221,AIRCRAFT,Lockheed Martin,7200000,2021-09-30,Department of the Navy,Aircraft avionics upgrades with recurring modification actions
M67854-20-2222,SHIPS,Boeing,5500000,2021-10-12,Department of the Navy,Ship design engineering and technical support
M67854-20-2223,WEAPONS,Northrop Grumman,3800000,2021-11-20,Department of the Navy,Precision guided munitions procurement
M67854-20-2224,AIRCRAFT,Lockheed Martin,9800000,2021-12-05,Department of the Navy,Advanced fighter aircraft systems with iterative improvements
M67854-20-2225,SHIPS,Lockheed Martin,6200000,2022-01-18,Department of the Navy,Ship repair parts and emergency modification services
M67854-20-2226,WEAPONS,Raytheon,4700000,2022-02-22,Department of the Navy,Missile defense enhancements and testing
M67854-20-2227,AIRCRAFT,Boeing,5800000,2022-03-10,Department of the Navy,Aircraft fuel system modifications and efficiency improvements
M67854-20-2228,SHIPS,General Dynamics,8500000,2022-04-25,Department of the Navy,Shipyard modernization and infrastructure upgrades
M67854-20-2229,AIRCRAFT,Northrop Grumman,6800000,2022-05-19,Department of the Navy,Surveillance aircraft systems with multiple configuration changes
M67854-20-2230,WEAPONS,Lockheed Martin,11200000,2022-06-14,Department of the Navy,Long-range missile systems with extensive modification history
```

**Important patterns:**
- Lockheed Martin appears multiple times with high award amounts (one at $18.5M, one at $11.2M, one at $9.8M)
- Contract descriptions include keywords: "modifications", "change orders", "multiple scope adjustments" for the flagged ones
- Award amounts vary; some are 3× the program baseline average (see below)

Generate programmatically: Write a small Python script to generate remaining 70+ rows with random but realistic variation, ensuring at least 5-6 contracts exceed anomaly thresholds.

- [ ] **Step 3: Generate vendors.csv (30 rows)**

Write to `data/vendors.csv`:

```csv
vendor_name,duns_number,registration_status,historically_flagged
Lockheed Martin,123456789,Active,true
Boeing,234567890,Active,false
Raytheon,345678901,Active,false
Northrop Grumman,456789012,Active,true
General Dynamics,567890123,Active,false
BAE Systems,678901234,Active,false
L3Harris,789012345,Active,true
Huntington Ingalls,890123456,Active,false
 Huntington Ingalls is a key shipbuilder — maintain realistic duns numbers
```

Generate additional 22 vendor rows with random DUNS (9 digits), mix of Active/Suspended status, 5-8 with historically_flagged=true to create pattern.

- [ ] **Step 4: Generate program_baselines.csv (8 rows)**

Write to `data/program_baselines.csv`:

```csv
program_code,avg_mod_count,avg_mod_amount,avg_award_amount,mod_threshold,std_award_amount
AIRCRAFT,2.1,500000,4500000,5,1200000
SHIPS,1.8,750000,5200000,4,950000
WEAPONS,2.5,600000,3800000,6,800000
IT_SERVICES,3.2,250000,2100000,7,450000
CONSTRUCTION,1.5,1200000,8500000,3,2200000
LOGISTICS,2.0,400000,3200000,5,600000
ENGINEERING,2.8,350000,2800000,6,550000
RESEARCH,1.2,2000000,15000000,2,3500000
```

Key: Lockheed appears in AIRCRAFT program where avg_award_amount=4.5M, std=1.2M. Our $18.5M award is ~11.7σ outlier — very clear. The $12M and $9.8M are also clear outliers.

- [ ] **Step 5: Verify CSV data loads correctly**

```bash
head -5 data/awards.csv
head -5 data/vendors.csv
head -5 data/program_baselines.csv
wc -l data/awards.csv  # Should be 101 (header + 100)
```

Expected: Files exist, headers correct, ~100+ rows in awards, ~30 rows in vendors, ~8 rows in program_baselines.

- [ ] **Step 6: Commit data files**

```bash
git add data/
git commit -m "feat: add synthetic procurement datasets for anomaly detection demo"
```

---

## Chunk 2: Foundry Ontology Creation (45 minutes)

### Task 2: Create Ontology Objects

**Files:** None (UI-based in Foundry console)

**Goal:** Define 3 object types with properties and relationships.

- [ ] **Step 1: Navigate to Ontology Manager**

1. Log into Foundry Dev Tier console
2. Navigate to **"Product" → "Ontology"** (or search "Ontology" in the search bar)
3. Click **"Create New Ontology"**
4. Name: `Procurement Anomaly Detection`
5. Description: "Defense contract anomaly detection for procurement analysts"
6. Click **Create**

- [ ] **Step 2: Define Award object type**

1. Click **"Add Object Type"**
2. Name: `Award`
3. Description: "Defense contract award metadata"
4. Properties (add each):
   - `award_id` (String) - Primary identifier
   - `program_code` (String)
   - `vendor_name` (String) — note: we'll link to Vendor via this field (not a reference yet)
   - `award_amount` (Decimal)
   - `award_date` (Date)
   - `awarding_agency` (String)
   - `contract_description` (Text)
   - `status` (Enum) — options: `PENDING`, `REVIEWING`, `ESCALATED`, `RESOLVED` — default: `PENDING`
5. Check **"Make this a first-class object"** (enables linking)
6. Click **Save**

- [ ] **Step 3: Define Vendor object type**

1. Click **"Add Object Type"**
2. Name: `Vendor`
3. Description: "Vendor metadata and history"
4. Properties:
   - `vendor_name` (String) - Primary identifier
   - `duns_number` (String)
   - `registration_status` (String) — could also use Enum: Active, Suspended, Debared
   - `historically_flagged` (Boolean) - default: `false`
   - `total_award_value` (Decimal) - computed field (can leave blank initially, we'll update via Logic later)
5. Check **"Make this a first-class object"**
6. Click **Save**

- [ ] **Step 4: Define AnomalyFlag object type**

1. Click **"Add Object Type"**
2. Name: `AnomalyFlag`
3. Description: "AI-generated anomaly findings on contracts"
4. Properties:
   - `flag_id` (String) - Auto-generated (we'll set in Logic function)
   - `award` (Object Reference) → Link to `Award` object type
   - `vendor` (Object Reference) → Link to `Vendor` object type
   - `risk_level` (Enum) — options: `HIGH`, `MEDIUM`, `LOW`
   - `risk_score` (Decimal) — 0.0-1.0
   - `primary_concern` (String) — e.g., "modification_stacking", "award_outlier", "vendor_history"
   - `summary` (Text) — AI-generated brief
   - `concerns` (List of String) — structured bullet points
   - `recommended_action` (String) — e.g., "ESCALATE", "MONITOR", "CLEAR"
   - `created_at` (DateTime) — auto-set on creation
   - `created_by` (String) — default: "AIP Agent"
5. Check **"Make this a first-class object"**
6. Click **Save**

- [ ] **Step 5: Configure relationships (optional but good practice)**

While the object references themselves create relationships, you can add explicit bidirectional links for easier navigation:
- In `Award` object, add property `anomaly_flags` (List of Object Reference → AnomalyFlag) — this lets us navigate from Award to its flags.
- In `Vendor` object, add property `anomaly_flags` (List of Object Reference → AnomalyFlag) — navigate from Vendor to flags.
- Save both.

- [ ] **Step 6: Export ontology configuration for backup**

If Foundry supports export:
1. Navigate to Ontology settings
2. Click **"Export Ontology Schema"** (JSON or YAML)
3. Save to `docs/ontology-export.json` in your project

This gives you a backup and shows reviewers the schema.

- [ ] **Step 7: Commit ontology documentation**

Create a markdown file documenting the ontology structure:

```bash
cat > docs/ontology-schema.md << 'EOF'
# Procurement Anomaly Detection Ontology

## Object Types

### Award
- award_id (String, PK)
- program_code (String)
- vendor_name (String)
- award_amount (Decimal)
- award_date (Date)
- awarding_agency (String)
- contract_description (Text)
- status (Enum: PENDING, REVIEWING, ESCALATED, RESOLVED)

### Vendor
- vendor_name (String, PK)
- duns_number (String)
- registration_status (String)
- historically_flagged (Boolean)
- total_award_value (Decimal)

### AnomalyFlag
- flag_id (String, auto)
- award (Object Reference → Award)
- vendor (Object Reference → Vendor)
- risk_level (Enum: HIGH, MEDIUM, LOW)
- risk_score (Decimal)
- primary_concern (String)
- summary (Text)
- concerns (List[String])
- recommended_action (String)
- created_at (DateTime)
- created_by (String)

## Relationships
- Award —(1:N)→ AnomalyFlag (anomaly_flags)
- Vendor —(1:N)→ AnomalyFlag (anomaly_flags)
- Award.vendor_name → Vendor.vendor_name (logical link)

EOF
git add docs/ontology-schema.md
git commit -m "docs: document ontology schema"
```

---

## Chunk 3: Dataset Ingestion (30 minutes)

### Task 3: Upload CSV Data to Foundry

**Files:** None (UI-based)

**Goal:** Load synthetic data into Foundry datasets that can be queried by the Logic function.

- [ ] **Step 1: Navigate to Code Repositories → Datasets**

1. In Foundry console, go to **"Product" → "Code Repositories"** (or search "Datasets")
2. Click **"Create New Dataset"**
3. Choose **"CSV Dataset"** from templates
4. Name: `procurement_data`
5. Description: "Synthetic defense procurement data for anomaly detection demo"
6. Click **Create**

This creates a dataset repository where you can upload your CSVs.

- [ ] **Step 2: Upload awards.csv**

1. Inside the `procurement_data` dataset, click **"Add File"**
2. Upload `data/awards.csv`
3. Foundry will auto-parse and create a tabular dataset
4. Rename the dataset branch to `awards` (right-click → Rename) or keep as `procurement_data/awards`
5. Click on the dataset to **"View Data"** — confirm 101 rows, correct columns

- [ ] **Step 3: Upload vendors.csv**

1. Still in `procurement_data`, click **"Add File"**
2. Upload `data/vendors.csv`
3. Rename to `vendors`
4. View data — confirm ~30 rows

- [ ] **Step 4: Upload program_baselines.csv**

1. Add file `data/program_baselines.csv`
2. Rename to `program_baselines`
3. View data — confirm 8 rows, correct columns (including `std_award_amount` if you added it; if not, add it now)

- [ ] **Step 5: Create dataset documentation**

In Foundry, each dataset has a README. Click on `procurement_data` → Edit README:

```markdown
# Procurement Data

Synthetic defense procurement datasets for anomaly detection demonstration.

## Contents

- `awards`: 100 contract awards with metadata
- `vendors`: 30 vendor records
- `program_baselines`: Statistical baselines per program (avg awards, mod thresholds, etc.)

## Notes

Data is synthetic but mimics USAspending.gov structure. Designed for Dev Tier demo (~50 rows each).
```

Save.

- [ ] **Step 6: Verify dataset accessibility**

In Foundry search bar, search for `awards` dataset. Click it. Check:
- Schema tab shows correct types (String, Decimal, Date)
- Data tab shows rows
- You can see `award_id` column, `program_code`, etc.

Do the same for `vendors` and `program_baselines`.

- [ ] **Step 7: Commit dataset references**

In your local repo, create a file that tracks which Foundry dataset paths you used:

```bash
cat > data/DATASET_PATHS.md << 'EOF'
# Dataset Paths in Foundry

These are the paths used to reference datasets in Logic functions and pipelines.

- awards: `procurement_data/awards` (or `/YOUR_PROJECT_NAME/ proc urement_data/awards`)
- vendors: `procurement_data/vendors`
- program_baselines: `procurement_data/program_baselines`

Note: Full path format in Foundry is typically:
`/Projects/<Project Name>/Datasets/<Dataset Branch>`

Check the Foundry UI for exact path.
EOF
git add data/DATASET_PATHS.md
git commit -m "docs: record Foundry dataset paths"
```

---

## Chunk 4: AIP Logic Function Creation (1.5 hours)

### Task 4: Build analyze_award_anomaly Function

**Location:** AIP Agent Studio → Logic Functions

**Goal:** Create a block-based function that reads Award/Vendor data, evaluates anomaly patterns using LLM, and writes AnomalyFlag object.

- [ ] **Step 1: Navigate to AIP Logic Functions**

1. In Foundry console, navigate to **"Product" → "AIP" → "Logic Functions"** (or search "AIP Logic")
2. Click **"Create New Function"**
3. Name: `analyze_award_anomaly`
4. Description: "Analyzes a single award contract for procurement anomalies"
5. Input type: `String` (the award_id)
6. Output type: `Object` (we'll define as `AnomalyFlag` type)
7. Click **Create**

- [ ] **Step 2: Build Block 1 — Read Context**

Drag a **"Read Objects"** block onto the canvas.

Configuration:
- Object type: `Award`
- Filter: `award_id = {{input}}` (use the input variable)
- Output variable: `award_obj`

Add **second Read block**:
- Object type: `Vendor`
- Filter: `vendor_name = {{award_obj.vendor_name}}`
- Output variable: `vendor_obj`

Add **third Read block** (optional, for context):
- Object type: `Award` (again)
- Filter: `vendor_name = {{award_obj.vendor_name}}` AND `status = "PENDING"` OR `status = "REVIEWING"`
- Limit: 5
- Output variable: `vendor_recent_awards`

Add **fourth Read block** (baseline):
- Object type: `ProgramBaseline` (or reference the program_baselines dataset)
- Filter: `program_code = {{award_obj.program_code}}`
- Output: `baseline`

Connect: All these Read blocks → next block (LLM).

- [ ] **Step 3: Build Block 2 — LLM Evaluation**

Drag an **"LLM"** block onto canvas.

Configuration:
- **System Prompt:**

```
You are a defense procurement analyst evaluating contract awards for anomalies.

Your task: Given the award details, vendor history, and program baselines, determine if this contract exhibits suspicious patterns.

Anomaly patterns to check:
1. Modification stacking: Does contract_description mention "modifications", "change orders", "scope adjustments"? Count occurrences. Flag if implied count > program baseline avg_mod_count.
2. Award amount outlier: Compare award_amount to baseline.avg_award_amount. Calculate z-score roughly: if award_amount > baseline.avg_award_amount + (2.5 * baseline.std_award_amount), that's a clear outlier.
3. Vendor history: Is vendor.historically_flagged = true? Does this vendor have multiple awards that are anomalous?
4. Rapid succession modifications: Do modification dates (if mentioned in description) cluster closely?

Decision logic:
- HIGH risk: Modification frequency clearly excessive + award amount also high OR vendor has prior flags
- MEDIUM risk: One indicator present but not extreme (e.g., mods slightly above threshold, or award moderately high)
- LOW risk: No clear indicators OR baseline data missing

Output format: Strict JSON only, matching this schema:
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "risk_score": float (0.0-1.0, HIGH = 0.7-1.0, MEDIUM = 0.4-0.7, LOW = 0.0-0.4),
  "primary_concern": "modification_stacking" | "award_outlier" | "vendor_history" | "multiple_patterns" | "none",
  "summary": "2-3 sentence explanation with specific numbers (award amount, program average, vendor name, mod count if mentioned)",
  "concerns": ["list of 2-3 specific findings", "each as a short phrase"],
  "recommended_action": "ESCALATE" | "MONITOR" | "CLEAR"
}

Do NOT include any text outside the JSON object.
```

- **User Prompt:** Leave blank (all context is in system prompt via blocks)

- **Variables:** Pass these as context variables (Foundry will substitute):
  - award: `{{award_obj}}`
  - vendor: `{{vendor_obj}}`
  - vendor_recent_awards: `{{vendor_recent_awards}}`
  - baseline: `{{baseline}}`

- **Output variable:** `llm_response`

- **Schema enforcement:** Create a JSON schema or use Foundry's schema editor to enforce the structure. Upload schema:

```json
{
  "type": "object",
  "required": ["risk_level", "risk_score", "primary_concern", "summary", "concerns", "recommended_action"],
  "properties": {
    "risk_level": {"type": "string", "enum": ["HIGH", "MEDIUM", "LOW"]},
    "risk_score": {"type": "number", "minimum": 0.0, "maximum": 1.0},
    "primary_concern": {"type": "string"},
    "summary": {"type": "string"},
    "concerns": {"type": "array", "items": {"type": "string"}},
    "recommended_action": {"type": "string", "enum": ["ESCALATE", "MONITOR", "CLEAR"]}
  }
}
```

Connect: All Read blocks → LLM block.

- [ ] **Step 4: Build Block 3 — Write AnomalyFlag**

Drag a **"Create Object"** block onto canvas.

Configuration:
- Object type: `AnomalyFlag`
- Output variable: `new_flag`

Fields mapping:
- `flag_id`: Generate using Foundry's ID generator (select "Auto-generate" or use `"FLAG-" + {{input}}` if auto not available)
- `award`: Link to `{{award_obj}}` (select object reference)
- `vendor`: Link to `{{vendor_obj}}`
- `risk_level`: `{{llm_response.risk_level}}`
- `risk_score`: `{{llm_response.risk_score}}`
- `primary_concern`: `{{llm_response.primary_concern}}`
- `summary`: `{{llm_response.summary}}`
- `concerns`: `{{llm_response.concerns}}`
- `recommended_action`: `{{llm_response.recommended_action}}`
- `created_at`: Current timestamp (use system function)
- `created_by`: `"AIP Agent"` (string)

Connect: LLM block → Create Object block.

- [ ] **Step 5: Test Function in Debugger**

At the top of the Logic Function editor, click **"Test"** or **"Debug"**.

1. Input a known problematic award_id, e.g., `M67854-20-2219` (the $18.5M contract)
2. Click **Run**
3. Watch the block execution:
   - Read blocks should populate `award_obj`, `vendor_obj`, `baseline`
   - LLM block should show thinking tokens (if logging enabled) and return a JSON object
   - Create Object block should show a new AnomalyFlag object created
4. Click on the output variable (`new_flag`) to inspect its fields
5. Expected: `risk_level` = HIGH or MEDIUM, `risk_score` > 0.7, `primary_concern` includes "award_outlier" or "multiple_patterns", summary mentions the $18.5M vs $4.5M baseline

If JSON parsing errors: adjust LLM prompt to be stricter. If missing baseline: check that program_code matches exactly (case-sensitive).

Iterate 2-3 times until the function reliably returns valid JSON and creates AnomalyFlag objects.

- [ ] **Step 6: Save and Publish Function**

Click **"Save"** (top right). Then click **"Publish"** (makes it available as a tool to AIP Agents).

- [ ] **Step 7: Commit function configuration (export)**

If Foundry allows exporting Logic function as JSON:
1. In Logic function editor, click **"Export"** or **"Download as JSON"**
2. Save to `docs/logic-function-export.json`
3. Commit:

```bash
git add docs/logic-function-export.json
git commit -m "feat: add AIP Logic function analyze_award_anomaly"
```

If no export available, take screenshots and save to `docs/screenshots/logic-function/` for documentation.

---

## Chunk 5: AIP Agent Configuration (45 minutes)

### Task 5: Create "Procurement Anomaly Detective" Agent

**Location:** AIP Agent Studio

**Goal:** Configure an agent with system prompt, ontology context, the Logic function as a tool, and application state mapping to AnomalyFlag object set.

- [ ] **Step 1: Navigate to AIP Agent Studio**

1. In Foundry console, go to **"Product" → "AIP" → "Agent Studio"** (or search "Agent Studio")
2. Click **"Create New Agent"**
3. Name: `Procurement Anomaly Detective`
4. Description: "Analyzes defense contracts for anomalies and flags suspicious awards"
5. Click **Create**

- [ ] **Step 2: Configure Agent Identity (System Prompt)**

In the Agent configuration panel:

**System Prompt:**
```
You are a defense procurement analyst embedded in Palantir Foundry. Your job is to help analysts identify suspicious contracts for audit review.

Capabilities:
- You can read data from the Ontology: Award, Vendor, ProgramBaseline objects
- You have access to a tool called "analyze_award_anomaly" that takes an award_id and returns an anomaly flag with reasoning
- You can write AnomalyFlag objects to record your findings

Workflow:
1. When an analyst asks you to analyze a vendor, award, or set of awards:
   a. First, fetch relevant data from Ontology to understand context
   b. For each award that needs analysis, call the analyze_award_anomaly tool with the award_id
   c. Collect the results and present a summary to the analyst
   d. If multiple anomalies found, rank by risk_score

2. When asked to provide reasoning: cite specific data fields (award amounts, program averages, vendor names, modification counts if extracted)

3. Be concise but thorough. Recommend concrete actions: ESCALATE for clear anomalies, MONITOR for borderline, CLEAR for normal.

Remember: You operate on live Ontology data. Your actions are persistent. When you create AnomalyFlag objects, they appear in the analyst's dashboard.
```

Leave other default settings (temperature, etc.) as is.

- [ ] **Step 3: Configure Ontology Context**

In the Agent config, find **"Context"** or **"Ontology Access"** section.

Add the following object types with permissions:

| Object Type | Read | Write |
|-------------|------|-------|
| Award | ✅ | ❌ |
| Vendor | ✅ | ❌ |
| ProgramBaseline | ✅ | ❌ |
| AnomalyFlag | ✅ | ✅ |

This gives the agent read access to core data and write access to AnomalyFlag (to persist findings).

- [ ] **Step 4: Add Function Tool**

In the Agent config, find **"Tools"** or **"Functions"** section.

Click **"Add Tool"**:
- Type: **AIP Logic Function**
- Select function: `analyze_award_anomaly` (the one you created)
- Name for tool: `analyze_award_anomaly` (or just "analyze")
- Description: "Analyzes a single award for anomalies, returns AnomalyFlag object with risk assessment"

Save tool.

- [ ] **Step 5: Configure Application State (Object Set Variable)**

This is key for Workshop integration.

In Agent config, find **"Application State"** or **"Variables"**:

Click **"Add Variable"**:
- Name: `selected_object_set`
- Type: **Object Set**
- Value: Select `AnomalyFlag` object type
- Default: All AnomalyFlag objects (no filter) OR only non-RESOLVED ones if we had status field on AnomalyFlag (we don't yet, but can filter later)

This variable will be bound to the Workshop table widget so the agent's results populate it.

- [ ] **Step 6: Save and Publish Agent**

Click **"Save"**, then **"Publish"** (if available). Some Foundry versions auto-publish.

Test the agent in Agent Studio's built-in chat:

1. Type: "What is the highest risk anomaly you've detected?"
   - Agent should respond: "I haven't analyzed any awards yet. You can ask me to analyze a specific vendor's awards in the Workshop app."

2. Type: "Analyze award M67854-20-2219"
   - Agent should: (a) read the award data, (b) call the analyze_award_anomaly tool, (c) report back the risk level, summary, and that it created an AnomalyFlag

If tool call fails: check that function is published and agent has write access to AnomalyFlag.

- [ ] **Step 7: Commit agent configuration**

Export agent config (if Foundry supports JSON export). Save to `docs/agent-config-export.json`.

```bash
git add docs/agent-config-export.json
git commit -m "feat: configure AIP Agent 'Procurement Anomaly Detective'"
```

Take screenshots of the agent configuration (System Prompt tab, Tools tab, Variables tab) and save to `docs/screenshots/agent-studio/` for video reference.

---

## Chunk 6: Workshop Application Build (1 hour)

### Task 6: Build "Anomaly Detection Workspace" Workshop App

**Location:** Workshop (Foundry's low-code app builder)

**Goal:** Create a two-panel app: left table showing AnomalyFlag objects (sorted by risk_score), right panel with AIP Agent widget bound to `selected_object_set` variable.

- [ ] **Step 1: Create New Workshop App**

1. In Foundry console, navigate to **"Product" → "Workshop"** (or search "Workshop")
2. Click **"Create New App"**
3. Template: Choose **"Blank App"** or **"Two-Column Layout"** if available
4. Name: `Anomaly Detection Workspace`
5. Description: "Interactive workspace for procurement analysts to review AI-detected anomalies"
6. Click **Create**

- [ ] **Step 2: Configure Page Layout**

You should see a canvas with a header and two columns (or a single column you can split).

**Layout:**
- Left column width: 60% (Table widget)
- Right column width: 40% (Agent widget)
- Header: App title "Anomaly Detection Workspace", maybe last updated timestamp

If using Two-Column template, skip. If blank:
- Drag a **"Two-Column Layout"** widget from the widget palette onto the canvas
- Or add two `Container` widgets side-by-side and set widths

- [ ] **Step 3: Add Table Widget (Left Panel)**

Drag a **"Table"** widget into the left column.

Configuration:
- **Data Source:** Select **"Object Set"**
- Object type: `AnomalyFlag`
- Sort: `risk_score` (descending)
- Filter: (optional) `created_at` is today or last 7 days to show recent detections

**Columns to display** (add/remove):
1. `risk_level` — enable cell coloring: HIGH=red, MEDIUM=yellow, LOW=green
2. `award.award_id` — dot notation for linked object property
3. `vendor.vendor_name`
4. `risk_score` — format as decimal with 2 places
5. `primary_concern`
6. `recommended_action`
7. `created_at` — format as date

Enable **"Row Selection"** (single row) — this will trigger detail sidebar later.

Title: "Flagged Anomalies" or "Recent Findings"

Save widget configuration.

- [ ] **Step 4: Add AIP Agent Widget (Right Panel)**

Drag an **"AIP Agent"** widget into the right column.

Configuration:
- **Agent:** Select `Procurement Anomaly Detective` (the agent you created)
- **Mode:** Chat interface (default)
- **Application State Variable:** Enter `selected_object_set` (exactly as defined in the agent)
- **Title:** "Analyst Assistant"
- **Placeholder text:** "Ask me to analyze contracts... e.g., 'Analyze all Lockheed Martin awards'"

The agent widget should now be bound to the same object set variable as the table. When the agent creates AnomalyFlag objects, they'll appear in the table automatically (reactive binding).

Save widget.

- [ ] **Step 5: Add Detail Sidebar (Optional but good for demo)**

If Workshop supports sidebars or expandable panels:

Add a **"Detail Panel"** or **"Object Inspector"** widget that appears when a table row is selected.

Configuration:
- Data source: `Selected Row` from the Table widget
- Show fields: `summary` (as formatted text), `concerns` (as list), `recommended_action`, `award` (link to award), `vendor`
- Maybe show full award details (expandable section)

If sidebar is too complex, skip — you can click a table row and open the full AnomalyFlag object view in a new modal (Workshop default behavior).

- [ ] **Step 6: Test the App**

1. Click **"Preview"** or **"Run"** in Workshop (top right)
2. The app should load with an empty table (no AnomalyFlag objects yet) and the agent chat on the right.
3. In the agent chat, type: "Analyze all awards from vendor 'Lockheed Martin'"
4. Watch the agent execute:
   - It should respond with text updating: "Analyzing 6 awards from Lockheed Martin..."
   - The table should populate in real-time with 6 new rows (or fewer if some were already analyzed)
   - Each row should have risk_level color-coded
   - Some should be HIGH (large award amounts), some MEDIUM
5. Click on a HIGH risk row. The detail sidebar should show the AI-generated summary: mentions of "$18.5M", "3.2× program average", etc.
6. Verify the agent's final message in chat: summary of findings, e.g., "Found 2 HIGH risk anomalies, 3 MEDIUM. Recommend review of awards M67854-20-2219 and M67854-20-2224."

If agent fails to find awards: Check that Vendor object exists and vendor_name matches exactly ("Lockheed Martin"). May need to adjust Logic function to handle vendor lookup correctly.

- [ ] **Step 7: Add Metrics Display (Optional)**

Add a small **"Text"** or **"Metric"** widget in the header showing:
- "Total anomalies detected: {{AnomalyFlag | count}}"
- "Average risk score: {{AnomalyFlag | average:risk_score}}"

This uses Workshopper's templating/expression language.

- [ ] **Step 8: Save and Publish App**

Click **"Save"**, then **"Publish"** (makes it accessible via URL). Copy the published app URL — you'll use this in the video.

- [ ] **Step 9: Commit app configuration**

Export the Workshop app configuration (Foundry usually stores as JSON in a dataset or has an "Export" button).

Save to `docs/workshop-app-export.json`:

```bash
git add docs/workshop-app-export.json
git commit -m "feat: build Workshop app 'Anomaly Detection Workspace'"
```

Take screenshots of:
- App layout with table and agent
- Agent chat analyzing Lockheed Martin
- Table populated with results
Save to `docs/screenshots/workshop/`.

---

## Chunk 7: Testing & Validation (1 hour)

### Task 7: End-to-End Validation and Demo Preparation

**Goal:** Ensure the entire flow works smoothly for video recording.

- [ ] **Step 1: Verify Ontology Object Count**

Check that you have:
- Award objects: ~100
- Vendor objects: ~30
- AnomalyFlag objects: 0 initially (created on-demand)

If not all awards loaded: In Foundry, go to `awards` dataset, click "Create Objects" or "Publish to Ontology" to materialize dataset rows as Ontology objects.

- [ ] **Step 2: Verify Agent Function Calls**

In Workshop app:
- Type: "Analyze vendor Lockheed Martin"
- Watch agent: should it call the tool 6 times? Does it succeed each time?
- If any fail: check the Logic function debug logs (AIP Logic → Monitoring) for errors

Common issues:
- `vendor_obj` not found: vendor_name case mismatch
- `baseline` not found: program_code mismatch (e.g., "AIRCRAFT" vs "aircraft")
- JSON parse error: LLM added extra text before JSON; tighten prompt to "Return JSON only."

Fix and re-test until 100% success rate on known test award_ids.

- [ ] **Step 3: Check Data Quality**

Confirm in the table that the HIGH risk anomalies are indeed the ones with large award amounts:
- Risk score > 0.7
- Summary mentions "$18.5M" or "$12M" and compares to program average
- `primary_concern` = "award_outlier" or "multiple_patterns"

If not, adjust LLM prompt scoring thresholds.

- [ ] **Step 4: Record a Test Video**

Do a dry run of the demo:

1. Open Workshop app (published URL)
2. Start screen recording (OBS, QuickTime, etc.)
3. Narrate: "I built an AIP Agent in Foundry that detects procurement anomalies. Here's the workspace — table on left shows flagged anomalies, agent on right."
4. Type in agent: "Analyze all awards from Lockheed Martin"
5. Wait for agent to complete (should take 10-30 seconds)
6. Show table populating, point out HIGH risk rows
7. Click one HIGH row, show detail sidebar with summary
8. Stop recording

Play back: is it ≤ 3 minutes? Is the flow clear? Do you need to adjust anything?

- [ ] **Step 5: Polish Data for Demo Clarity**

If test video shows too many anomalies (e.g., 20 instead of 6), adjust your data:
- Maybe pre-run agent on all awards and then filter table to show only HIGH risk for demo?
- Or manually delete some AnomalyFlag objects from Ontology to start fresh
- For final demo, you want a clean slate: 0 AnomalyFlag objects initially, then agent creates 4-6 on-demand

To delete AnomalyFlag objects in Foundry: Go to Ontology → AnomalyFlag objects → select all → Delete (be careful).

- [ ] **Step 6: Prepare Final Demo Script**

Write a tight 3-minute script (see spec). Practice timing:

0:00-0:20 Problem statement
0:20-0:50 Agent Studio config tour
0:50-1:30 Logic function walkthrough (show block diagram)
1:30-2:20 Workshop demo (type query, watch table fill)
2:20-2:50 Detail drill-down
2:50-3:00 Close

Record final video.

- [ ] **Step 7: Export Final Artifacts**

Collect all exports and screenshots in a `deliverables/` folder:

```
deliverables/
├── video/
│   └── anomaly-agent-demo.mp4 (or .mov)
├── exports/
│   ├── ontology-export.json
│   ├── logic-function-export.json
│   ├── agent-config-export.json
│   └── workshop-app-export.json
└── screenshots/
    ├── ontology/
    ├── logic-function/
    ├── agent-studio/
    └── workshop/
```

- [ ] **Step 8: Final Commit**

```bash
git add deliverables/
git commit -m "feat: complete anomaly detection agent demo"
git push  # if you have remote
```

- [ ] **Step 9: Prepare Email Response**

Draft a short email to Palantir recruiter:

```
Subject: AIP Now Submission — [Your Name] — Defense Procurement Anomaly Agent

Hi [Recruiter name],

Attached is my 3-minute demo video for the AIP Now challenge.

I built an interactive AIP Agent in Foundry that analyzes defense contracts for anomalies. The agent reads live Ontology data, uses a custom AIP Logic function to assess risk, and writes findings back to an AnomalyFlag object set that appears in a Workshop dashboard in real-time.

Tech stack: Palantir Foundry + AIP Agent Studio + AIP Logic + Workshop, with synthetic procurement data.

Happy to answer any questions.

Best,
[Your Name]
[LinkedIn/Portfolio]
```

---

## Day-by-Day Execution Timeline

If spreading over multiple days:

**Day 1 (3 hours):**
- Chunk 1: Data preparation (1h)
- Chunk 2: Ontology creation (45m)
- Chunk 3: Dataset ingestion (30m)

**Day 2 (3 hours):**
- Chunk 4: AIP Logic function (1.5h)
- Chunk 5: AIP Agent configuration (45m)
- Chunk 6: Workshop app build (45m)

**Day 3 (1 hour):**
- Chunk 7: Testing, polishing, video recording

---

## Troubleshooting & Common Issues

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| Agent can't find award_id | Ontology objects not materialized | In Datasets → "Create Objects" or "Publish to Ontology" |
| LLM returns non-JSON output | Prompt not strict enough | Add: "Return ONLY valid JSON. No markdown, no extra text." |
| Create Object fails: invalid reference | Award/Vendor links not set correctly | Ensure you're passing object references (object type + ID), not strings |
| Table in Workshop doesn't update | Agent writing to wrong object set variable | Check Application State variable name matches exactly (`selected_object_set`) |
| Function errors: baseline not found | program_code case mismatch | Ensure awards.program_code = "AIRCRAFT" and program_baselines.program_code = "AIRCRAFT" exactly |
| No AnomalyFlag objects created | Function output not mapped to Create Object block | Verify LLM response is correctly referenced in Create Object fields |
| Dev Tier approval not received | Check spam folder, verify KYC upload clear | Contact Palantir support via community forum |

---

## Success Checklist

- [ ] AIP Dev Tier access confirmed
- [ ] 3 CSV datasets uploaded and published to Ontology as objects
- [ ] Ontology with 3 object types (Award, Vendor, AnomalyFlag) created
- [ ] AIP Logic function `analyze_award_anomaly` created, tested, published
- [ ] AIP Agent "Procurement Anomaly Detective" configured with correct prompt, ontology context, tool, and application state variable
- [ ] Workshop app "Anomaly Detection Workspace" built with table + agent widget
- [ ] End-to-end flow works: agent analyzes Lockheed Martin awards, creates AnomalyFlag objects, table updates
- [ ] Demo video recorded, ≤ 3 minutes, clear narrative
- [ ] All exports and screenshots saved
- [ ] Email drafted ready to send

---

## Plan Summary

**Total tasks:** ~100 steps across 7 chunks

**Estimated time:** 6-7 hours (can be split across 2-3 days)

**Dependencies:** Only requires Dev Tier access — no external libraries, no API keys, no complex tooling.

**Output:** Working Foundry application with AIP Agent, Logic function, and Workshop app, plus demo video.

Good luck! This is a portfolio-worthy piece that demonstrates true Foundry + AIP integration.


claude --resume 88f62b55-20cf-4feb-8acc-22a362239dd2  