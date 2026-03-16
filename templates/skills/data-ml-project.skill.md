---
name: data-ml-project
description: Expert-level workflow for managing data pipelines, model training sessions, and analytical infrastructure.
domains:
  - data-science
  - ml-ops
---

# Data & ML Workflow Skill

## Expert Intent
Streamline the development of data-centric features and machine learning models. This skill enforces high-fidelity data lineage, reproducible training sessions, and robust evaluation metrics to prevent "silent failures" in production models.

## Pre-Checks & Context Intake
- **Storage Audit**: Identify where raw, processed, and versioned data is stored: **{{DATASTORES}}**.
- **Tooling Check**: confirm the ML framework (PyTorch, TensorFlow, Scikit-learn) and data processing tools.
- **Lineage scan**: Trace the data from intake to model input.
- **Risk Level**: Check for sensitivity or bias constraints in the **{{RISK_LEVEL}}** project rules.

## Expert Workflow (SOF)
1. **Discovery & Intake**: Analyze the source, schema, and quality of incoming data.
   - Requirement: profile the data for missing values and distribution shifts.
2. **Preprocessing & Engineering**: Clean, transform, and version datasets.
   - Requirement: Use immutable data versioning where possible.
3. **Training & Modeling**: Implement training loops with rigorous hyperparameter tracking.
   - Requirement: Capture loss curves, accuracy, and domain-specific metrics.
4. **Evaluation & Inversion**: Test the model against edge cases and "adversarial" inputs.
5. **Deployment & Monitoring**: Package for inference and define drift detection triggers.

## Strict Guardrails
- **LEAKAGE**: Strictly forbid using "future" information or target data in the training set (lookahead bias).
- **BIAS**: Stop and ask if the data or model performance shows significant disparity across protected classes (if applicable to **{{DOMAIN_TAGS}}**).
- **DETERMINISM**: Ensure training seeds and data splits are fixed for reproducibility.

## Expected Output
- Reproducible preprocessing and training scripts.
- Detailed evaluation reports (Confusion matrices, POC curves, etc.).
- Performance baseline comparison against `PROJECT_MEMORY.md`.
