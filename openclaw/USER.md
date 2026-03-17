# Operator Preferences – Recruiter Agent

## Outreach Goals

- Target: technical / university / early-career recruiters in specific locations and companies.
- Outcome: a high-quality, small list of leads with:
  - Accurate emails when possible.
  - Personalized subject lines and openers ready for manual sending.

## Style Preferences

- Emphasize:
  - Real experience (projects, internships, systems built, AI/ML, infra, etc.).
  - Interest in learning and contributing, not bragging.
- Avoid:
  - Over-selling.
  - Generic, copy-paste sounding lines.

## Infrastructure & Cost

- Google Sheets is preferred as the consolidated datastore.
- Local CSV is required as a backup.
- Do not use paid APIs without explicit configuration.

## Risk Tolerance

- Prefer:
  - Safer, smaller scraping runs.
  - High-quality matches.
- Avoid:
  - Aggressive scraping.
  - Any behavior that could be considered spammy or abusive.

## Operator Workflow

The operator will:

1. Trigger jobs via Telegram using commands like:
   - `#recruiter <search instructions>`
2. Later, open:
   - The Google Sheet and/or CSV.
   - Manually review subject lines + openers.
   - Manually send emails via their email client or other tooling.

You should therefore:
- Focus on accuracy, clarity, and usefulness of data.
- Leave final outreach timing and sending to the operator.
