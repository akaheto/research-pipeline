# Project Instructions

## Before doing anything else
This file and PROJECT_PLAN.md are a starter template — they contain no
project-specific details yet. Do NOT assume a project goal, stack, or
scope. Your first action in any new session on a fresh project must be
to ask the user what they want to build (goal, target users, must-have
features, any constraints). Only after that should you propose a stack,
fill in PROJECT_PLAN.md, and begin work.

## Workflow
- Before implementing anything new, write a short plan (approach, files
  touched, tradeoffs) and wait for approval unless told to proceed
  directly.
- Build incrementally, one deliverable from PROJECT_PLAN.md at a time.
- After each deliverable, update its status and add a line to the
  Changelog in PROJECT_PLAN.md — don't wait to be asked.
- Summarize what changed after each chunk.
- Don't add scope that wasn't asked for — flag it as a suggestion instead.

## Documentation (keep current, not just created once)
- TECHNICAL_SPEC.docx — Word format, not markdown. Sections: Overview,
  Architecture, Tech Stack, Data Model, Key Decisions & Tradeoffs,
  Known Limitations/Open Risks.
- VISUAL_STYLE_GUIDE.docx — Word format, not markdown. Sections: Color
  palette (with hex values), Typography (fonts/sizes/weights), Spacing/
  layout grid, Core component patterns (buttons, forms, cards, nav),
  Tone/voice for UI copy. Created once, early, and referenced by every
  UI deliverable afterward rather than re-decided per feature.
- USER_GUIDE.docx — Word format, not markdown. Written for a
  non-technical end user: what the app does, how to do each core task,
  no jargon.
- PROJECT_PLAN.docx — living deliverables/status doc (see below). Word
  format, not markdown.
- ENHANCEMENTS.docx — running list of enhancement ideas, split into
  Implemented / Not Yet Implemented / Rejected-Deferred. Word format,
  not markdown. Update it whenever an enhancement idea comes up in
  conversation (even if not built yet) and whenever one gets
  implemented — don't wait to be asked.
- README.md and CHANGELOG.md stay as markdown — these are dev-facing,
  live in the repo, and are read by tooling/GitHub, so Word doesn't fit
  them.
- Docstrings/comments required for any non-obvious logic.
- Create these .docx files during Epic A using the docx skill
  (docx-js), not by hand-writing XML. Verify each by rendering it to
  PDF/JPEG before calling it done.

## Model tiering
Foundation decisions belong on the strongest available model; routine
execution against an established spec can run on a lighter/cheaper one.

- **Use the strongest model for:** clarifying the project goal, choosing
  the tech stack, designing the data model, architecture decisions, API/
  interface contracts, the visual style guide, defining what "done"
  means for each feature (test strategy), and any security-sensitive
  decision.
- **A lighter model is fine for:** implementing individual features once
  the pattern is established, writing tests for already-defined cases,
  routine refactors/formatting/boilerplate, and filling in docs from
  what was actually built.
- Rule of thumb: if a choice is being made, use the strong model. If a
  choice already made is being applied, the light model is fine.
- If the person hasn't specified, default to the current model for
  Epic A (foundation), and flag when a good point to switch down would
  be (e.g. "Epic A is done — this is a good point to switch to a
  lighter model like Haiku for the routine feature work in Epic B").

## QA (required, not optional)
- Write tests alongside each feature, not at the end.
- Include at least one "unhappy path" test per feature (bad/empty/error
  input).
- Actually run tests and the app — report real output, never assumed
  output.
- Before calling anything "done," check it against requirements and
  list any gaps or edge cases explicitly.
- Run the project's lint command and test command before reporting
  completion.

## Honesty / uncertainty
- State assumptions explicitly when a requirement is ambiguous.
- If something can't be verified, say so — don't assert it works.
- Never edit generated/build output files directly.

## Stack notes
- Package manager: [fill in once stack is chosen]
- Test command: [fill in once stack is chosen]
- Lint command: [fill in once stack is chosen]
- Dev/run command: [fill in once stack is chosen]
