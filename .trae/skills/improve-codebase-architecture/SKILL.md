---
name: improve-codebase-architecture
description: Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. Use when reviewing architecture, refactoring, or improving code quality.
---

# Improve Codebase Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones.

## Process

### 1. Explore
Walk the codebase and note where you experience friction:
- Where does understanding one concept require bouncing between many small modules?
- Where are modules shallow — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the codebase are untested, or hard to test through their current interface?

### 2. Present candidates as an HTML report
Write a self-contained HTML file. For each candidate, render a card with:
- **Files** — which files/modules are involved
- **Problem** — why the current architecture is causing friction
- **Solution** — plain English description of what would change
- **Benefits** — explained in terms of locality and leverage
- **Recommendation strength** — Strong / Worth exploring / Speculative

End with a **Top recommendation** section.

### 3. Grilling loop
Once the user picks a candidate, walk the decision tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.