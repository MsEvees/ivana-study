# Ivana v5.7_stable — Functional Study Application

## What changed
- Library UI rebuilt around the agreed source-specific fields.
- Syllabus uses institution/school, school year, semester, course, and instructor/coordinator.
- Books, papers, and other academic sources have source-appropriate metadata.
- Removed the redundant Source title field from the shared form.
- Course relevance uses a wrapped selectable course panel so full course titles remain readable.
- Uploads are stored in private Supabase Storage instead of browser-only storage.
- Source metadata is stored in Supabase Postgres with owner-only RLS.
- A source uploaded on Mac can appear in the same account's Library on Windows.
- PDF files can be opened from the private Library; PDF.js remains the reader for PDFs.
- DOC/DOCX files use a private signed link until the ingestion layer is added.
- Progress entries can be deleted.
- Account creation remains on the login page.

## Supabase setup for this prototype
The repository includes:
- `supabase/migrations/202610030001_ivana_profiles.sql`
- `supabase/migrations/202610030002_ivana_library.sql`

The second migration creates the `resources` table, owner-only RLS policies, and the private `study-materials` Storage bucket with owner-scoped Storage policies.

Do not place service-role keys or passwords in the frontend.

## V5.3 study/home refinement
- PDF annotation palette is intentionally limited to four easy-to-remember colors: yellow Key idea, blue Mechanism, green Connection, red Revisit.
- `Remember + Guide` is a study-page-only floating guide, approximately sidebar width, with questions that help decide which annotation color fits.
- Timer and Inspire Me remain one floating tool unit; Inspire Me is aligned below the timer with clear separation and a muted terracotta treatment.
- Home restores the knowledge-landscape overview, latest uploaded materials, focused session, mastery/review status, and quiet reminder.
- Classroom now shows syllabus material as the course lens so the learner can open the syllabus and check topics/objectives while studying.
- Knowledge Map explicitly treats syllabus material as the course lens, not as knowledge-map concepts.
- The clickable prototype entry is no longer visible on the login page; it is hidden inside the Forgot Password modal for development access.


## v5.7_stable focus
- Library, Classroom, Study, Review/Exams, and Progress remain the functional core.
- Existing Supabase `resources` records and the private `library` Storage bucket are used; the separate Supabase `library` table is not used by the app Library page.
- Knowledge Map remains a reference-ready placeholder; concept extraction/relationship generation is paused.
- Study reader now supports scanned/image-only PDF pages with region-based semantic marking when no text layer is available.
- Text PDFs continue to use text selection for highlights, underline, and notes.
- Remember + Guide remains visible on Study and collapses only its contents.
- Timer and Inspire Me remain separate floating devices; Inspire Me opens below its button.
- Study can return to the selected resource in Library.

## Important
This ZIP is a complete project snapshot intended to replace the current Ivana project files. It does not modify live Supabase data or execute migrations.

## v5.7 (minC)
- Library density/alignment refinement and course-code display.
- Study resource reader state repaired so the empty PDF prompt is hidden when a resource is loaded.
- Timer and Inspire Me remain separate; Inspire Me is independently draggable.
- Notebook Notes support online persistence through `reading_notes`, with local fallback.
- Main Classroom now contains Courses and Reading Notes; course syllabi are linked from the corresponding course entry.
- Scanned-page OCR action added to the Study reader using Tesseract.js; manual region annotations remain available.
