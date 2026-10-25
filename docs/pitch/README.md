# Official-template pitch draft

Current artifacts: `PathForge_AI_CYBERSTARS_PHASE3_DRAFT.pptx` and its matching `.pdf`, with previews in `preview-phase3/`. They disclose the implemented optional features and outstanding live-provider/native-language verification. The earlier `PathForge_AI_CYBERSTARS_DRAFT.*` files remain preserved as historical drafts; use the Phase 3 versions for current review.

`official-template.pptx` is the unmodified organizer download, checked 25 October 2026. Source: https://www.sevainnovationchallenge.in/assets/Seva-First-Innovation-Challenge-PPT-Template.pptx, linked by the [official guidelines](https://www.sevainnovationchallenge.in/guidelines.html).

The filled six-slide draft follows the original headings: title, problem, solution/innovation, feasibility/implementation, impact/scalability, team/support. Its numbers describe the curated catalog and deterministic demo, not pilot results. Speaker notes contain scope, evidence and cost limits. No competitor benchmark, employment outcome, partner or patent is invented.

The applicant is **Aarush Tendulkar**, Team Lead of **CYBERSTARS**, team size **1**. Category: General Category; sector: Education and Employability. Contact stays JSON `null` and displays blank; no permanent contact or qualification is invented. Verify mandatory portal fields with the applicant.

`team.json` represents only the actual project team. Student guidance experts are separate database records managed at `/admin/experts`; see [expert administration](../expert-administration.md). No external expert is automatically added to the pitch. No expert is currently confirmed.

Regenerate from the repository root:

```powershell
backend/.venv/Scripts/python.exe -m pip install --target .tools/presentation-lib -r docs/pitch/requirements.txt
backend/.venv/Scripts/python.exe scripts/build_pitch.py
```

The authoring dependencies are separate from backend runtime requirements. The generator reads the checked template and current screenshots. Public URL remains marked pending until a deployment is verified. Verify mandatory contact, qualification and eligibility details before final submission.

After regenerating the PPTX, export its PDF again through PowerPoint's Export/Save as PDF command; the previously exported PDF is not automatically updated by the Python generator. Rendered slide previews are included for review. Keep the original official template unchanged.

The guidelines page asks for a PPTX; the template itself instructs PDF ≤10 MB. Both versions are supplied when export is available. Follow the logged-in portal's actual format and file-size control; no authenticated upload field was inspected and no submission was made.
