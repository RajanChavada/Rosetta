# Recruiter Agent – Tools & Usage Policy

## 1. Categories

- Search & Discovery
- Browser Automation & Scraping
- Data Storage (CSV / Google Sheets)
- Local Files & Experience Ingestion
- Logging & Monitoring

---

## 2. Search & Discovery Tools

### Tavily / Brave Search Skills

**Purpose:** High-level search to discover recruiter profiles and relevant pages.

**Usage:**
- Given a query like “Toronto Shopify technical recruiters”, issue:
  - 2–5 targeted search calls rather than one huge generic query.
- Prioritize results that:
  - Mention “recruiter”, “talent”, “people team”, “university recruiting”, etc.
  - Are clearly professional/company-related.

**Constraints:**
- Use only via their skill interfaces (no manual HTTP requests to their endpoints).
- Respect rate limits; if the tool returns an error, backoff and log.

---

## 3. Browser Automation & Scraping

### Playwright / Puppeteer Skills

**Purpose:** Open web pages, perform light scraping, and capture profile information.

**Usage:**
- Use when a page is heavily dynamic or requires JS rendering.
- Extract:
  - Name, title, company, location, and email or contact URL.

**Constraints:**
- Do not attempt to log in to user accounts.
- Do not attempt to bypass captchas or anti-bot protections.
- Limit to a small number of pages per job (e.g., <100 pages).

### Simple HTTP Scraper (curl + parsing)

**Purpose:** Fetch HTML and parse with basic heuristics when full browser automation is not needed.

**Usage:**
- Use on simple pages (company “team” pages, contact pages).
- Combine with regexes to find mailto links, etc.

**Constraints:**
- Always respect robots.txt via the provided tool features if available.
- Avoid repeated hammering of the same domain.

---

## 4. Data Storage Tools

### Local CSV Writer

**File:** `~/factory/recruiter-data/recruiters.csv`

**Usage:**
- Maintain a header row with the agreed schema.
- When appending:
  - Load existing rows (or cached lookup).
  - Skip rows with same `(full_name, company, email)` to avoid duplicates.

**Policy:**
- This file is the **authoritative local record**.
- Never store secrets or API keys in this CSV.

### Google Sheets Integration

**Tool:** `google-sheets-append` (or equivalent skill)

**Config:**
- `~/factory/recruiter-agent/sheets-config.json` contains:
  - `spreadsheetId`
  - `worksheetName`

**Usage:**
- After writing to CSV, attempt to append the same rows to the Google Sheet.
- On failure:
  - Write an error entry into `LOG.md`.
  - Do not crash the entire run.

**Constraints:**
- Do not modify existing rows or delete any data.
- Append-only behavior unless specifically instructed otherwise.

---

## 5. Local Files & Experience Ingestion

### Experience File Reader

**File:** `~/factory/recruiter-agent/experiences.md` (or as specified)

**Purpose:**
- Source of truth for the operator’s background, skills, and preferences.

**Usage:**
- Read once at the beginning of a job.
- Extract:
  - Key skills.
  - Tech stack.
  - Past roles/projects relevant to recruiting outreach.
- Use these details when generating personalized subject lines and opening paragraphs.

**Constraints:**
- Never write to this file.
- Do not copy its contents verbatim into the email openers; summarize and adapt.

---

## 6. Logging & Monitoring Tools

### LOG.md

**File:** `~/factory/recruiter-agent/LOG.md`

**Usage:**
- Append a section per run, e.g.:

  ```markdown
  ## 2026-03-16T23:59Z – Toronto Shopify Recruiters
  - New recruiters added: 18
  - Skipped as duplicates: 5
  - Emails found: 14
  - Emails not found: 9
  - Sheets sync: success
  - Notes: [any rate-limit warnings or domain issues]

Error Log
File: ~/factory/recruiter-agent/ERRORS.log

Usage:

Append one line per non-fatal error:

Timestamp, operation, error message, and suggested next action.

7. Prohibited Tools / Actions
SMTP / IMAP / email sending tools.

Tools that perform bulk posting/messaging on social networks.

Any tool that:

Accepts arbitrary shell commands from Telegram without filtering.

Uploads data to unknown external endpoints.

You must operate only within the tools explicitly whitelisted here or in the agent configuration.

