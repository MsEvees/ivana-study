# IVANA — VERSION HISTORY & CHANGELOG

**Latest version: V5**  
**Project:** Ivana — personal master's-level study workspace  
**Purpose:** A focused study environment built around understanding, connecting, reconstructing, testing, and mastering academic material.

---

# V5 — Study Intelligence + Dashboard Refinement
**Latest version**

V5 also begins the live-account foundation: the app's Create Account flow is connected to Supabase Auth, captures a learner display name, and includes a production-ready profile migration with Row Level Security. The frontend uses only the Supabase project URL and publishable key; no password or service-role secret is included.

V5 is a major refinement of Ivana's study interaction model. It is not simply a visual update; it changes how the learner uses the Home page, annotations, and the Notebook.

## Home Page — Study Dashboard

The Home page is redesigned to function as a real study dashboard.

### Knowledge Landscape
The main Home panel summarizes:

- Total number of knowledge-map-eligible references uploaded
- Coverage of HORT + CROP SCI courses
- Coverage of ENS courses

Syllabi remain the **course lens/framework** and are not counted as knowledge-map source material.

The eventual percentage should represent actual processed course/concept coverage once the Knowledge Map intelligence layer is implemented. The prototype should not imply concept-level coverage before that processing exists.

### Latest Uploaded Materials
The Resources area shows:

- Latest 5 uploaded materials only
- Reference information
- Upload date

Dates use the compact format:

**02 Oct 26**

### Focused Session
The latest study session shows:

- Date
- Actual focused study duration

Duration is displayed primarily as:

**04:35**

rather than:

**4 hours, 35 minutes**

The compact format is intended for fast visual scanning.

### Mastery
Mastery is shown separately for:

- Level 1
- Level 2
- Level 3

Current evidence-based status logic:

| Status | Requirement |
|---|---|
| 🟢 Mastered | At least 10 tests and score >85% |
| 🟡 Developing | At least 10 tests and score 70–85% |
| 🟠 Emerging | At least 10 tests and score 50–69% |
| 🔴 Revisit | At least 10 tests and score <50% |
| ⚪ Building evidence | Fewer than 10 tests |

The "Building evidence" state prevents Ivana from making a strong mastery judgment before sufficient testing evidence exists.

## Reference Register — All Reference Types

The Reference Register is designed for all academic reference types, rather than only books.

It can accommodate:

- Reference type
- Author / organization / instructor
- Year
- Title
- Edition / journal / publisher where applicable
- Course
- Date added
- Knowledge-map status

Additional identifiers may include:

- DOI
- ISBN
- URL
- Access date

The register should remain a useful academic inventory without becoming a full citation-management system.

## Annotation System — Simplified

V5 reduces annotation to a small set of meaningful actions:

### Five Highlight Categories

**🟡 Key Idea**  
Purpose: Important concept, principle, definition, or statement.  
Question: *Is this something I need to understand and remember?*

**🔵 Mechanism**  
Purpose: Explains how or why something happens.  
Question: *Does this explain a process, cause, pathway, mechanism, or sequence?*

**🟢 Connection**  
Purpose: Relates this idea to another concept, topic, experiment, or course.  
Question: *Can this be relevant to another concept, topic, experiment, or course?*

**🟠 Evidence**  
Purpose: Supports a claim through an experiment, observation, result, figure, data, or example.  
Question: *Is this evidence showing that the idea is actually supported?*

**🔴 Gap**  
Purpose: Something unclear, incomplete, conflicting, or worth revisiting.  
Question: *Do I understand this well enough to explain it without looking?*

### Underline

Underline remains separate from highlighting.

Purpose: Mark something worth returning to without assigning it a conceptual category.

Question:

*Do I want to find this passage again later?*

The distinction is:

> **Highlight = I classified this.**  
> **Underline = I want to remember where this is.**

## Floating Highlight Guide

V5 introduces a floating **Highlight Guide** so the learner does not need to memorize the annotation system.

The guide begins with:

> **Before you highlight…**  
> *Ask what this passage is doing.*

It provides the purpose and guiding question for each highlight category and for underline.

### Position
- Floating in the upper-left area of the Study workspace
- Approximately the same width as the Study sidebar
- Does not permanently reserve PDF space

### Collapsed state

The guide collapses to:

> **＋ Guide**

The collapsed control uses a noticeable but restrained **muted terracotta** accent.

### Expanded state

The expanded guide uses the same terracotta accent in its header:

> **✦ Highlight Guide — −**

The guide remains light and paper-like; terracotta is an accent rather than replacing the five annotation colors.

### Behavior

The guide should:

- Float above the Study workspace
- Remain available while reading
- Expand when guidance is useful
- Collapse when maximum reading space is preferred
- Remember its state where practical

Its role is consistent with Ivana's principle:

> **Nearby when needed, not interrupting.**

## Notebook — Manual + Captured Notes

The Notebook now has two complementary functions.

### Manual Note
The learner can type a note directly.

### Captured Note
When reading:

**Select passage → Note → optional comment**

The selected passage is automatically captured into the Notebook.

This makes the Notebook a record of what the learner noticed while studying.

The distinction is:

- **Highlight:** classify the role of information
- **Underline:** mark a passage for later return
- **Note:** preserve a passage as a study note, optionally with the learner's own explanation

## Removed: Redundant Study Tools Card

The previous Home page contained a Study Tools card explaining that Timer and Inspire Me were available.

It was removed because the persistent floating Timer + Inspire Me already provide this function.

---

# V4.2 — Functional Refinement
**Previous major functional baseline**

V4.2 substantially improved the prototype's working behavior and introduced the custom PDF reading experience.

## Login
- Added visible Create Account
- Added Forgot Password
- Retained temporary prototype entry
- Refined welcome copy
- Introduced the flower/stem visual as the "I" in Ivana's wordmark

## Timer
- Added Stop button
- Stop records the actual elapsed focus duration
- Session status can be recorded as Stopped
- Timer and Inspire Me are attached into one compact floating unit
- Floating unit is approximately sidebar width
- Whole dock can be dragged using the timer drag handle
- Timer remains available across pages

## Inspire Me
- Floating alongside Timer
- Uses actual quotes or specific philosophical concepts rather than generic generated encouragement
- Quote appears below the Inspire Me button
- Quote window has a close X
- Muted orange/terracotta visual treatment

## Library
Introduced structured reference metadata:

### Book / Book Chapter
- Author
- Year
- Edition
- Title
- Optional Table of Contents

### Research Paper
- Author
- Year
- Title
- Publisher / Journal

### Syllabus
- Title
- Instructor / Coordinator
- Course

### Other academic source
Structured academic reference information.

Additional Library improvements:
- No fake "Choose course" option
- Course text made smaller to avoid overflow
- Search enabled
- Rich text content area for pasted material
- Fixed-height content box
- Preserves stored HTML and plain text
- Reference Register introduced
- Syllabi identified as **Course lens only**
- Non-syllabus academic sources identified as **Knowledge-map eligible**

## Dynamic Classroom
- Course-specific lens is distinguished from the source itself
- HORT + CROP SCI use a muted teal/sage visual family
- ENS uses a muted warm clay/rose family
- Course colors are deliberately distinct from annotation colors
- Copy clarifies that the syllabus defines the course framework but does not itself become Knowledge Map content

## Knowledge Map
- Clarified that syllabi define the course lens
- Knowledge-bearing references feed the Knowledge Map
- Map state reflects whether eligible reference material exists
- Avoids pretending concepts exist before source processing

## Study / PDF Reader
Replaced the earlier browser-style PDF display with a custom PDF.js-based reader.

Implemented:
- Actual PDF page rendering
- Page navigation
- Previous / Next
- Zoom
- Zoom percentage
- Fit Width
- Selectable text layer
- Annotation overlays
- Underline overlays
- Local annotation storage
- Notes attached to selected text
- Study sidebar containing Notebook, Index Cards, Review Prompts, Connections, and Master Understanding

The reader uses PDF.js so Ivana can control the reading interface and semantic annotation system.

## Local data
V4.2 continued to use browser-local storage / IndexedDB for the prototype.

Supabase Storage and database integration remained a later backend step.

---

# V4.1 — Supabase Architecture Preparation

V4.1 established the first serious backend-oriented structure while keeping the prototype functional.

## Application structure
The prototype included:

- Login
- Home
- Library
- Study
- Classroom
- Review
- Knowledge Map
- Progress

## Authentication preparation
- Supabase Auth integration was prepared
- User account structure was introduced
- Frontend configuration separated into Supabase configuration

## Data architecture direction
The application began moving toward:

**GitHub Pages → static frontend**  
**Supabase Auth → authentication**  
**Supabase Storage → study materials**  
**Supabase Postgres → structured study data**  
**RLS → user-specific access**

The planned database model includes resources, highlights, notes, index cards, review prompts, study sessions, concepts, relationships, course relevance, and evidence.

## Study workflow foundation
V4.1 carried forward the integrated:
- Timer
- Inspire Me
- Library
- Study workspace
- Classroom
- Review
- Knowledge Map
- Progress

---

# V3 / Knowledge & Study-System Development

The V3 stage developed the underlying academic model that distinguishes Ivana from a conventional PDF reader or AI summarizer.

## Core Study Workflow

Ivana's intended study cycle became:

> **READ → UNDERSTAND → CONNECT → EXPLORE → RECONSTRUCT → TEST → FIND GAPS → MASTER**

The system is designed around understanding rather than simply consuming summaries.

## Dynamic Classroom

Books and references are not treated as classrooms.

Ivana distinguishes:

### SOURCE
> "The chapter says..."

### COURSE
> "For HORT 232, this corresponds to..."

### INFERENCE
> "This may also be useful for HORT 231 because..."

Inferred relevance must never be presented as a syllabus requirement.

## Knowledge Map

The Knowledge Map was defined as a **freeform interactive graph/canvas**, not a hierarchy or tree.

Core principles:

- A concept can connect to many other concepts
- Cross-course relationships are allowed
- Relationships can represent mechanisms, causes, dependencies, contrasts, evidence, applications, and other meaningful relationships
- Visual exploration can expand through relationship levels
- The map should show where a concept sits within the learner's wider body of study

The graph model is:

**concept → relationship → concept**

**concept → course relevance → course**

**concept → evidence → source / highlight / note / inference**

The map is an evidence-aware representation of the learner's developing mental map.

## Evidence states

Concepts and relationships can be:

- Well supported
- Developing
- Sparse
- Uncertain

"Sparse" means the map has insufficient evidence; it does not mean the learner does not know the concept.

## Course relevance

Course relevance distinguishes:

- Core / extensively discussed
- Related / discussed
- Mentioned / supporting
- Insufficient evidence

## Gap analysis

Ivana can identify areas where the available knowledge map has little evidence and suggest a targeted, verifiable reference for investigation.

External material must be clearly identified and must not silently replace the learner's source material.

---

# V2 — Functional Study Workspace

V2 developed the main page structure and study tools.

Core pages included:

- Home / Overview
- Library
- Study
- Classroom
- Review
- Knowledge Map
- Progress

## Library
The Library became the central place for academic resources.

The system began distinguishing resources by academic function and course relevance.

## Study Workspace
The Study area combined:

- Reading
- Timer
- Notes
- Index Cards
- Review prompts
- Connections
- Master Understanding

## Timer
The focus timer was established as:

**30 minutes focus → 10 minutes break**

with controls for:

- Start
- Pause
- Reset
- Skip

The timer was designed as an integrated study tool rather than a separate application.

## Inspire Me
A small floating source of encouragement / reflection was introduced.

The intended content was based on real inspiring people and specific philosophical concepts rather than generic motivational text.

## Review
Review began to incorporate multiple testing levels.

## Progress
Progress began recording study history and review outcomes.

---

# V1 — Initial Ivana Study Environment

V1 established the basic identity and structure of Ivana as a personal study application.

## Core purpose

Ivana was designed to become more than:

- A PDF reader
- An AI summarizer
- A flashcard application
- A generic productivity dashboard

The original direction was a study companion that helps the learner:

> **Understand → Connect → Explore → Master**

## Initial functional foundation

The early application included the foundations for:

- Resource Library
- Study workspace
- Notes
- Review
- Course organization
- Knowledge Map
- Progress
- Focus timer
- AI-assisted study support

## Visual identity

The visual direction was established around:

- Warm ivory / white
- Soft yellow
- Muted green
- Charcoal
- Daisy-inspired visual identity
- Lexend typography
- Academic but warm presentation
- Minimal distraction
- Ghibli-inspired atmosphere without literal anime styling

## Ivana's personality

Ivana was defined as a thoughtful study companion:

- Curious
- Intelligent
- Warm
- Encouraging
- Calm
- Playful without being childish
- Accurate and transparent about uncertainty
- Present without being distracting

The learner remains the protagonist.

Ivana should:

- Notice connections
- Ask thoughtful questions
- Challenge weak reasoning
- Recognize genuine understanding
- Admit uncertainty
- Encourage exploration
- Know when to stop exploring
- Adapt to the learner's performance

The relationship is:

> **"We're figuring this out together."**

rather than a teacher/student or AI/user relationship.

## Question progression

Ivana's questioning model was established as:

> **What → Why → How → What if → What does this connect to → Can you defend that?**

## Core principle

Personality must serve four purposes:

> **Understand. Connect. Explore. Master.**

---

# Cross-Version Academic Testing Model

The academic testing framework developed across the project and is carried forward into the current version.

## Level 1 — Recognition / Foundational Recall
Examples:
- Multiple choice
- Modified true/false
- Matching

## Level 2 — Retrieval / Identification / Discrimination
Examples:
- Identification
- Fill-in
- What does not belong? Why?
- Sequence/process completion
- Compare/distinguish

## Level 3 — Master's-Level Synthesis
Examples:
- Pathway drawing/completion
- Chemical structures
- Essays / explanation
- Research or graph interpretation
- Integrative / cross-course questions

Testing should be tracked by both:

**Concept + Level**

The system should distinguish:
- Weak foundational knowledge
- Retrieval difficulty
- Synthesis/application difficulty

---

# Master's-Level Reconstruction Model

Ivana is intended to prepare for expert-style examination, not make the learner's studying artificially easy.

A major part of the model is **reconstruction**:

> experiment → variables / treatments → graph → interpretation → mechanism → conclusion → course objective

The reverse direction is also important:

> finding / graph → reconstruct experiment → mechanism → objective

Other representation switching includes:

- Words → pathway
- Experiment → graph
- Graph → meaning
- Finding → conclusion
- Concept → experiment
- Experiment → objective
- Group → organizing principle

## Experiment Card

The intended experiment representation includes:

- Experiment
- Question
- Objective
- Variables
- Treatments
- Expected / observed response
- Graph
- Interpretation
- Mechanism
- Conclusion
- Significance
- Course objective demonstrated

Pathway and experiment images may eventually be uploaded and evaluated through:
- Source recognition
- Reconstruction
- Labeling
- Explanation
- Comparison
- Error detection

Older course materials remain primary. Current literature may be used for verification or expansion and must be distinguished from the learner's original course source.

---

# Source and Evidence Philosophy

Ivana distinguishes different evidence states instead of silently merging information.

Potential labels include:

- **YOUR SOURCE**
- **COURSE-ALIGNED**
- **CURRENTLY VERIFIED**
- **UPDATED**
- **INFERENCE**

This distinction is especially important when older course materials are being studied alongside current literature.

The application should never silently replace the learner's course material with a newer interpretation.

---

# Current Architecture Direction

V5 repository structure also includes a `supabase/migrations/` folder so the Supabase GitHub integration can use the repository root (`.`) as its working directory. The production branch is `main`. The migration establishes the private learner profile foundation used by the new account flow.

The project is moving toward:

**GitHub Pages**
- Static Ivana web application

**Supabase**
- Authentication
- Private study-material storage
- PostgreSQL database
- Row Level Security
- Backend data services

**GitHub**
- Version-controlled source code
- Deployment source
- Project history

The Supabase GitHub integration may be used where appropriate, but it does not change the intended separation between the static frontend and Supabase backend services.

---

# Version Philosophy

Ivana versions are treated as meaningful development milestones.

- **V1** — Initial study environment and identity
- **V2** — Functional study workspace
- **V3** — Academic knowledge model and intelligent study framework
- **V4.1** — Backend / Supabase architecture preparation
- **V4.2** — Functional refinement, custom PDF reader, Library and Study improvements
- **V5** — Study Intelligence + Dashboard Refinement

The current version is:

# **IVANA V5**

> **Read → notice → question → classify → connect → understand → reconstruct → test → master**
