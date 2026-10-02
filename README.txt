IVANA V2 PROTOTYPE
==================

V2 is a feature-change prototype based on the V1 baseline.

Major V2 additions:
- True floating study timer/device that overlays the reading area instead of reserving layout space.
- Timer is draggable by its handle and its position is remembered locally.
- Timer remains available across the integrated Study workspace tabs.
- Timer is intentionally horizontal/rectangular rather than a square Post-it.
- New floating “Inspire me” companion device beside the timer.
- Inspire Me opens a small quote/concept card with real-attribution fields and clearly labeled philosophical concepts.
- Quote/concept library includes Stoicism, Japanese concepts, Winston Churchill, and other thinkers.
- Quotes with uncertain attribution are explicitly marked rather than silently presented as verified fact.

Core workflow remains:
UPLOAD -> READ -> STUDY -> ANNOTATE -> CONNECT -> TEST -> NOTE -> MASTER

The prototype remains offline. Real authentication, private storage, real PDF rendering/annotation persistence, and AI analysis are still part of the online build.

V2.2 Knowledge Map upgrade
- Replaced the hierarchical/boxed Knowledge Map with a freeform knowledge graph / canvas.
- Concepts are connected by visible relationship lines/arrows and can be focused to reveal nearby relationships.
- The map distinguishes course relevance from conceptual relationships and explicitly marks inference.
- Florigen is represented as a cross-course example: core in HORT 231, related in HORT 232/241, with connections to FT, photoperiod, flowering, and floral transition.
- Added an inspector that explains the selected concept and an end-of-day gap/evidence panel concept.
- The intended online data model is an evolving graph whose quality depends on uploaded references, syllabus evidence, highlights, notes, and study activity.

V2.1 behavior refinement
- The floating Focus Timer and Inspire Me device now appear on all main Ivana pages, not only Study.
- Timer state persists across page navigation using local browser storage, including running/paused mode and remaining time.
- Both devices retain their independently saved positions.
