---
name: frontend-react-next
description: Expert-level workflow for building and maintaining modern React/Next.js user interfaces with a focus on performance and DX.
domains:
  - frontend
  - user-experience
---

# Frontend: React/Next.js Skill

## Expert Intent
Implement high-fidelity, high-performance user interfaces. This skill enforces component modularity, strict prop-types/TS safety, and optimized rendering strategies (Server vs Client components) to ensure a premium user experience in **{{PROJECT_NAME}}**.

## Pre-Checks & Context Intake
- **Design System Audit**: Scan for existing components, tailwind configs, or global styles.
- **Routing State**: Identify the use of App Router vs Pages Router.
- **Context/State**: Locate the primary state management solution (Zustand, Redux, Context API).
- **Core Stack**: follow patterns for **{{FRONTEND_STACK}}**.
- **Constraint check**: Read `AGENT.md` for accessibility and performance requirements.

## Expert Workflow (SOF)
1. **Atomic Design**: Break the UI down into Atoms, Molecules, and Organisms.
   - Requirement: Design for reuse and clear PROP contracts.
2. **State Strategy**: Decide between Server-side fetching (RSC) and Client-side state hooks.
3. **Implementation**: Code with a focus on semantic HTML and accessibility (A11y).
4. **Optimization**: Audit for unnecessary re-renders (useMemo, useCallback) and Core Web Vitals (LCP, CLS).
5. **Verification**: Run snapshot or component tests for critical UI paths.

## Strict Guardrails
- **PROPS**: strictly forbid "Prop Drilling" beyond 3 levels. Use Context or State Management instead.
- **PERFORMANCE**: No large (>50kb) third-party libraries without explicit architecture review.
- **A11Y**: Do not commit components that fail basic screen-reader or contrast checks.

## Expected Output
- Modular, well-documented React/Next.js components.
- Integrated API fetching logic with error boundaries.
- Component/Snapshot tests for new UI logic.
