# Defense Procurement Anomaly Agent - Design Specification

## Project Overview

**Goal:** Build an interactive AIP Agent in Palantir Foundry that reads contract data from the Ontology, uses a custom AIP Logic function to detect anomalies, and writes results back to a flag object. Demonstrate end-to-end in a 3-minute video.

**User Persona:** Defense procurement analyst. They need to quickly identify suspicious contracts for audit review. Current process: manual review takes 2-3 weeks per cycle.

**Success Criteria:**
- Analyst types a natural language query in Workshop app (e.g., "Analyze all awards from vendor Lockheed Martin")
- AIP Agent reads Ontology data, calls custom Logic function for each contract, returns findings with reasoning
- Results appear in a Workshop table in real-time as the agent writes anomaly flags
- Demo video ≤ 3 minutes showing complete interactive workflow

**Build Time:** ~6-7 hours once Dev Tier access is granted

**Dev Tier Constraints:**
- Max 50 ontology objects (we use 3 object types)
- Up to 5 users (not relevant for demo)
- No external API calls (all data pre-loaded as CSVs)
- Free permanently (no trial limits)

---

## Architecture

### High-Level Flow

```
[Ontology: Award, Vendor, AnomalyFlag]
      ↓
[AIP Agent] ← System prompt + custom tool
      ↓
[AIP Logic Function] ← Reads Award/Vendor, computes risk, writes AnomalyFlag
      ↓
[Workshop App] ← Table widget + Agent widget (live updates)
```

**Key difference from original:** This is an **interactive agent-driven** workflow (Tier 2 + Tier 3), not an autonomous pipeline (Tier 4). Analyst initiates analysis via chat; agent executes logic function on-demand and writes results back.

---

## Components

### 1. Data Layer

**Three CSV datasets** (uploaded to Foundry, ~50-100 rows each for demo simplicity):

| Dataset | Rows | Purpose |
|---------|------|---------|
| `awards` | 100 | Contract metadata: award_id, program_code, vendor_name, award_amount, award_date, awarding_agency, contract_description |
| `vendors` | 30 | Vendor metadata: vendor_name, duns_number, registration_status, historically_flagged (bool) |
| `program_baselines` | 8 | Baseline stats per program: program_code, avg_mod_count, avg_mod_amount, avg_award_amount, mod_threshold |

**Note:** These are **synthetic but realistic** data that mirror USAspending structure. Keep small enough for demo but large enough to show patterns (e.g., one vendor with 5 awards all slightly over threshold).

---

### 2. Ontology

**3 object types** (well under 50-object Dev Tier limit):

**Award**
- award_id (string, primary key)
- program_code (string)
- vendor_name (string, link → Vendor by vendor_name)
- award_amount (decimal)
- award_date (date)
- awarding_agency (string)
- contract_description (text)
- mod_count (integer, computed from Modification count if we had that table; for simplicity, we'll approximate via LLM inspection in the Logic function)
- status (enum: PENDING, REVIEWING, ESCALATED, RESOLVED)

**Vendor**
- vendor_name (string, primary key)
- duns_number (string)
- registration_status (string: "Active", "Suspended", etc.)
- historically_flagged (boolean)
- total_award_value (decimal, computed)

**AnomalyFlag**
- flag_id (string, primary key, auto-generated)
- award (link → Award)
- vendor (link → Vendor, derived from Award.vendor_name)
- risk_level (enum: HIGH, MEDIUM, LOW)
- risk_score (float, 0.0-1.0)
- primary_concern (string: "modification_stacking", "award_outlier", "vendor_history")
- summary (text) — AI-generated brief
- concerns (list[string]) — structured bullet points
- recommended_action (string)
- created_at (timestamp)
- created_by (string: "AIP Agent")

**Relationships:**
- Award.vendor_name links to Vendor.vendor_name
- AnomalyFlag.award links to Award
- AnomalyFlag.vendor links to Vendor

**No Modification table** — for this lean demo, we'll infer modification patterns from the contract description text using the LLM's reasoning ability (e.g., "this contract mentions 3 modifications" that the LLM can extract). This keeps the ontology simple while still demonstrating the concept.

---

### 3. AIP Logic Function

**Function Name:** `analyze_award_anomaly`

**Trigger:** Called by AIP Agent as a tool, passing an `Award` object ID.

**Input:** Award ID (string)

**Logic Blocks:**

```
Block 1: Read Context
- Fetch the Award object by ID
- Fetch related Vendor object (via Award.vendor_name)
- Fetch 5 most recent awards from same vendor (for pattern detection)
- Fetch program_baselines for Award.program_code (for statistical comparison)

Block 2: LLM Evaluation
System Prompt:
You are a defense procurement analyst. Evaluate this contract for anomalies using these signals:

1. Modification stacking: If contract description mentions multiple modifications, count them. Flag if count > program baseline avg_mod_count.
2. Award amount outlier: Compare award_amount to program baseline avg_award_amount. Flag if > 2.5 standard deviations above mean.
3. Vendor history: Check if vendor.historically_flagged = true OR if this vendor has multiple awards all flagged.
4. Rapid succession: If modification dates cluster within short time windows (detected from description), flag.

Context provided:
- Award: {award_id, program_code, vendor_name, award_amount, contract_description, award_date}
- Vendor: {vendor_name, historically_flagged, total_award_value}
- Vendor's recent awards: [list of {award_id, award_amount, status}]
- Program baseline: {avg_mod_count, avg_award_amount, mod_threshold}

Output format (JSON):
{
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "risk_score": 0.0-1.0,
  "primary_concern": "modification_stacking" | "award_outlier" | "vendor_history" | "multiple_patterns",
  "summary": "2-3 sentence explanation with specific numbers",
  "concerns": ["list of 2-3 specific findings"],
  "recommended_action": "ESCALATE" | "MONITOR" | "CLEAR"
}

Return the JSON only.
```

Block 3: Write Result
- Create new AnomalyFlag object
- Set fields from LLM output
- Link to Award and Vendor
- Save to Ontology

**Expected Output:** AnomalyFlag object persisted to Foundry

---

### 4. AIP Agent Configuration

**Location:** AIP Agent Studio

**Agent Definition:**

- **Name:** "Procurement Anomaly Detective"
- **System Prompt:**
  ```
  You are a defense procurement analyst assistant embedded in Palantir Foundry.

  Your job: Help analysts identify suspicious contracts by analyzing award data.

  When asked to analyze an award or vendor:
  1. Fetch relevant data from the Ontology (Award, Vendor, ProgramBaseline objects)
  2. For each award that needs analysis, call the analyze_award_anomaly function tool
  3. Present the findings to the analyst with clear reasoning
  4. If multiple anomalies are found, rank by risk_score

  Always cite specific data points (award amounts, program averages, vendor history).
  Be concise but thorough. Recommend concrete next actions (ESCALATE, MONITOR, CLEAR).
  ```

- **Ontology Context:** Enable access to 3 object types:
  - Award (read)
  - Vendor (read)
  - AnomalyFlag (read/write)
  - ProgramBaseline (read)

- **Application State:**
  - Variable name: `selected_object_set`
  - Type: Object Set
  - Value: `AnomalyFlag` (all flagged anomalies)

- **Function Tools:** Add `analyze_award_anomaly` (the AIP Logic function defined above)

- **LLM Model:** Use Claude Sonnet or Opus (available in AIP)

---

### 5. Workshop Application

**App Name:** "Anomaly Detection Workspace"

**Layout (single page):**

**Left Panel — Table Widget**
- Data source: `AnomalyFlag` object set
- Columns: risk_level (color-coded), award_id, vendor_name, risk_score, primary_concern, recommended_action, created_at
- Sort: risk_score DESC
- Default filter: status != "RESOLVED" (or just all AnomalyFlag objects, since they represent current findings)
- Row click: Opens detail sidebar

**Right Panel — AIP Agent Widget**
- Mapped to application state variable `selected_object_set`
- Chat interface with the Procurement Anomaly Detective agent
- Pre-populated suggestion: "Analyze all awards from the top 10 vendors by total value"
- When user asks question, agent reads Ontology, calls analyze_award_anomaly tool, writes AnomalyFlag objects, which immediately appear in the table

**Optional: Detail Sidebar**
- When clicking a table row, show full AnomalyFlag details (summary, concerns, citations)
- Show linked Award and Vendor data

**Key Demo Flow:**
1. User sees empty (or seed-populated) table
2. User types: "Analyze awards from vendor 'Lockheed Martin'"
3. Agent fetches Lockheed awards, calls analyze_award_anomaly for each
4. AnomalyFlag objects appear in table in real-time as they're created
5. User clicks a row, sees AI reasoning

---

## Technical Implementation Plan

See separate detailed implementation plan (to be generated next).

---

### Lean 3-Minute Video Script

**0:00-0:20 — Problem**
*Show analyst manually reviewing spreadsheets.*
"I built an AIP Agent in Foundry that automates procurement anomaly detection using live Ontology data."

**0:20-0:50 — Agent Studio Configuration**
*Show AIP Agent Studio.*
"Here's the agent: it's configured with a procurement analyst persona, has access to Award/Vendor/AnomalyFlag objects, and a custom analysis function as a tool."
*Zoom through: system prompt visible, ontology context panel, function tool listed, application state variable mapped.*

**0:50-1:30 — Logic Function Walkthrough**
*Show AIP Logic function builder.*
"The agent calls this Logic function for each contract. It reads the award and vendor data, compares to program baselines, and uses an LLM block to assess anomaly risk."
*Show block composition: read nodes → LLM block with system prompt → write node to create AnomalyFlag.*
"Run it on a sample — you can see the chain-of-thought in the debugger."

**1:30-2:20 — End-to-End in Workshop**
*Switch to Workshop app.*
"The analyst interacts via this workspace. I'll ask: 'Analyze all awards from Lockheed Martin.'"
*Type query, show agent thinking, show it calling analyze_award_anomaly function.*
"Watch the table populate in real-time as the agent writes AnomalyFlag objects back to the Ontology."
*Show 3-4 results appearing, sorted by risk_score.*

**2:20-2:50 — Drill Down**
*Click a high-risk row, show sidebar with AI-generated summary and concerns.*
"The agent provides specific reasoning: 'Award amount $4.8M is 3.2× program average, vendor has 2 prior flags.'"
*Show concerns list, recommended action ESCALATE.*

**2:50-3:00 — Close**
"Everything runs inside Foundry — the agent reads Ontology, executes custom LLM logic, and writes results operationally. No external APIs, no data leaving the platform."
*Fade to "Built with Palantir Foundry + AIP" + your name.*

---

## Key Palantir Concepts Demonstrated

- **AIP Agent Studio**: LLM agent with custom tools and ontology context
- **AIP Logic**: Block-based function composition with grounded data
- **Ontology as Single Source of Truth**: All data lives in structured objects
- **Workshop Integration**: Agent embedded in operational app with live updates
- **HITL Pattern**: Analyst initiates, agent executes, analyst reviews results
- **Explainable AI**: LLM reasoning cited with specific data points
- **Object-Level Permissions**: (implicit) agent has specific read/write access

---

## Acceptance Criteria

- [ ] 3 CSV datasets (awards, vendors, program_baselines) uploaded to Foundry
- [ ] Ontology defined with Award, Vendor, AnomalyFlag objects (relationships configured)
- [ ] AIP Logic function `analyze_award_anomaly` created, tested on 3 sample awards, returns valid structured JSON
- [ ] AIP Agent "Procurement Anomaly Detective" configured with correct system prompt, ontology context, and function tool
- [ ] Workshop app created with Table widget (AnomalyFlag) + AIP Agent widget (mapped to `selected_object_set`)
- [ ] Demo script validated: agent can analyze a vendor's awards and populate table in real-time
- [ ] Demo video recorded (≤3 minutes) showing complete interactive workflow
- [ ] Design document committed to git

---

## Spec Review

**Status:** APPROVED WITH MINOR REVISIONS
**Reviewer:** Senior Palantir FDE simulation
**Date:** 2025-03-17

### Changes Made During Review
- Simplifies from 4-node pipeline to AIP Agent + Logic function approach (Dev Tier appropriate)
- Reduced ontology from 3+ objects (with Modification) to 3 core objects (Award, Vendor, AnomalyFlag)
- Changed video length to 3 minutes (more achievable)
- Clarified that modification detection uses LLM extraction from description text, not separate Modification table
- Added specific LLM block guidance and JSON schema expectations
- Added data seeding strategy (small synthetic dataset with clear anomalies)

### Reviewer Notes
"This is now a submission-ready specification for Dev Tier. The scope is realistic for 6-7 hours, demonstrates core AIP concepts (Agent Studio, Logic, Workshop), and tells a compelling operational story. The agent-tool pattern is exactly what Palantir's customers deploy."

---

## Next Steps

1. ✅ Get AIP Dev Tier access (sign up at palantir.com/developers)
2. Write detailed implementation plan (writing-plans skill)
3. Create synthetic CSV datasets (awards, vendors, program_baselines)
4. Build Foundry Ontology (Award, Vendor, AnomalyFlag)
5. Create AIP Logic function `analyze_award_anomaly` with block composition
6. Configure AIP Agent in Agent Studio (system prompt, ontology context, function tool)
7. Build Workshop app (Table widget + Agent widget)
8. Test end-to-end: agent analyzes vendor, writes flags, table updates
9. Record 3-minute demo video
10. Polish: clean up data, adjust prompts, rehearse narrative

Once you have Dev Tier access and are ready to start building, invoke the `writing-plans` skill to get a step-by-step implementation guide with exact UI paths and expected outputs.
