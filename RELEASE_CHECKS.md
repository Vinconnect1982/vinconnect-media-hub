# VINCONNECT Media Hub release audit — 15 September 2026

## Release policy
Review changed code, run relevant workflow tests and production build, attempt authenticated browser QA, batch fixes and report passed versus blocked checks. Never represent mocked provider tests as successful real publications. Never publish unapproved test content. Never weaken login to obtain test coverage.

## Findings and changes
- Account discovery: Windsor MCP now reports the verified VINCONNECT Facebook and Instagram accounts. The user supplied a successful live Connections screenshot on the prior release.
- Publishing: use Windsor MCP execute_action and list_actions, replacing a REST call that returned opaque HTTP 400. Preserve redacted provider messages for diagnosis. Still requires an actual approved publication to verify end to end.
- Multiple platforms: checkbox selection for Facebook, Instagram and Hub website, independent results, social destinations before Hub so Hub revision changes do not invalidate social sends. X and vinconnect.com.au display unavailable with reasons.
- Approval: current server revision and approved/published status required. Caption and image snapshot saved with each social attempt. Instagram 2200-character limit checked in client and server.
- Idempotency: per-attempt identifier, atomic database insertion, in-flight/uncertain attempts block repeat sends; explicit repost flag required after a known successful publication. No automatic retries for external writes.
- Recovery: owner confirms by checking the platform and, if published, supplies a valid post link. In-flight attempts cannot be reconciled in the first two minutes. Recovery modifies the Hub record only.
- Receipts: provider ID and safe post URL stored separately. If Windsor omits an Instagram permalink, owner can add it. Facebook numeric post IDs can resolve to a Facebook URL. URLs restricted to the appropriate provider's HTTPS hosts, without credentials or access_token query.
- Management: duplicate as pending draft; unpublish Hub article before editing; social view/edit/delete opens the original platform because the available connector has no post edit/delete action. Owner may mark a record removed after deleting externally.
- History: separate social counters, article title, platform, status, date, link, sent text/image, search, filter and CSV export. Hub publication counter explicitly says Published on Hub.
- Connections: encrypted key save and live refresh remain independent; overlapping refreshes blocked. Unsupported setup buttons now say View options.

## Route and control audit
| Surface | Result |
|---|---|
| Home/authentication | Server owner allowlist intact. Local browser redirected to /signin-with-chatgpt and returned 404. Cannot perform signed-in browser click audit in this environment. |
| Dashboard, library, brand navigation | Client state handlers inspected; galleries use deployed local image files. |
| Article search/status filters | Client filtering inspected; Hub and social counts labelled separately. |
| Review/save/approve | API regression tests cover persistence, fresh revision, origin and owner restrictions. |
| Duplicate/unpublish | API tests verify fresh pending copy, preserved image, public URL removal and stale revision rejection. |
| Connections save/refresh/disconnect | Encryption, failure, redirect and MCP discovery tests pass; real connection previously verified by owner's screenshot. |
| Multi-destination publishing | Each platform request independent; mock-provider integration tests cover separate receipts and failure isolation. No real post sent in audit. |
| Repost/retry/reconcile | Tests cover deliberate repeat, duplicate identifier rejection, manual recovery and unauthorised requests. |
| Post links | URL validation tests and receipt extraction tests. Actual provider permalink availability unverified. |
| Social editing/deletion | Provider action discovery confirms unavailable. Open-platform controls explicitly explain manual management. |
| X | No connected account or publishing action exposed by Windsor. |
| vinconnect.com.au | VIPsites publishing API integration absent. |
| Drive/Dropbox | Existing links open provider files; in-Hub imports not implemented. |
| OpenAI | API management link only; in-Hub generation not implemented. |
| Scheduling/analytics/inbox | Not implemented; need background execution and supported provider APIs. |

## Verification limits
Automated tests use real SQLite with mocked Windsor HTTP responses and synthetic owner identity. They do not prove Meta publishing permissions, public image retrieval by Meta, or the exact real-world response shape of execute_action. Production build and TypeScript pass. Authenticated browser navigation is blocked by the preview's sign-in 404. Prior runtime redirect incompatibility was fixed and verified with owner screenshots. This release is not a claim of full end-to-end completion.

## Current platform constraints
Only VINCONNECT Facebook 1053341001203753 and Instagram 17841427011293034 are authorised destinations. External post edit/delete operations are not available through the exposed Windsor actions. Workspace uses two-digit article identifiers and permits up to 99 article records. Keep HUB_ENCRYPTION_KEY unchanged unless encrypted credentials are migrated. Never commit real secret values.


## Permission rejection repair — 15 September 2026

Two independent agents reviewed the publishing code and official Windsor guidance.
113 automated tests pass; TypeScript validation and production build pass. Tests use local SQLite and mocked Windsor HTTP, not live social publishing.

Fixed: explicit Meta #200 pages_manage_posts rejection now records failed, not needs_review; narrow legacy denial repair runs before retry; ambiguous outcomes remain protected. Connection status includes last known permission rejection. Rejected-post guidance and provider details appear in the publisher; uncertain blockers identify the exact attempt for inline owner reconciliation. Negative success-shaped receipts are rejected. Published exclusion is atomic with the send lock; late completions cannot overwrite reconciled records; all execution RPC stages share one timeout.

Authenticated preview QA attempted again: local Sites sign-in route returned 404. No auth bypass was added. No public social post was sent in this audit. The user screenshots prove live Windsor reauthorization succeeded but the next Facebook send was still denied; these changes cannot grant Meta permissions.

Remaining external blocker: Windsor must investigate the Page token's pages_manage_posts grant and app approval/access for Page 1053341001203753. OAuth success and connector discovery do not prove write permission. See https://windsor.ai/publish-to-facebook-page-with-ai-assistant/ and https://windsor.ai/documentation/support-options/ . Do not repeatedly reconnect or remove the shared Facebook integration casually: that may affect Instagram and Ads too.

No database migration or secret rotation is part of this release. Broader missing platform capabilities and QA limitations above remain.


## Installation post studio

New installation posts and existing drafts can be edited with a job-details form, 1–10 uploaded photos, ordered cover/carousel selection, brightness/contrast adjustments, standard VINCONNECT logo, headline/suburb banner, baked-in phone/site footer and formatted editable captions. Caption generation is field-based; Copy brief for ChatGPT supports external AI drafting. No in-Hub model/API is configured or claimed.

Source uploads are re-encoded as JPEG at up to 2400px (EXIF removed by canvas export) and kept private in R2. Rendered exports are 1080×1350 JPEG, with server size/dimension/type checks. D1 stores media metadata and ordered article media/job details. Approval atomically makes only branded renders publicly retrievable by unguessable link; source photos stay owner-only. Approved public exports remain available after draft edits for previously published posts. Every changed post returns to pending.

Instagram uses the discovered create_carousel_post action for 2–10 images, with live schema validation; Facebook uses cover-only and retains the known Meta permission issue. Hub article pages display the gallery. X and main website remain unsupported. No public test post was sent.

126 automated tests pass using real local SQLite plus mock R2/Windsor; TypeScript and production build pass. Schema delta: new media_assets table and nullable articles.media_json/job_json fields. Existing migrations unchanged. Preview navigation again reaches the dispatch sign-in path and returns 404; full authenticated editor visual QA remains unverified. No authentication bypass added.


## Reusable branded masks

Three presets (charcoal, white, teal), portrait and square exports, editable banner patterns using headline/suburb/service, and owner-only durable saved masks. Selected settings are snapshotted with each job. Existing jobs without settings retain classic portrait rendering. Original logo and contact footer remain fixed. New append-only migration 0004 creates brand_templates.

136 automated tests pass, TypeScript and production build pass. Browser sign-in attempted again: preview dispatch sign-in returns 404, so authenticated visual QA remains blocked. No public posts sent. OpenAI Developers still reports uninstalled after the user reports a failed connection; no diagnostic reason exposed. Live AI editing remains unimplemented/unconnected and is labelled unavailable in the editor. Brightness, contrast, masks and external caption briefs remain usable.

## Brand Templates gallery
Carousel previews use sample article imagery and clearly labelled sample text. New menu entry plus installation-editor gallery link. Select template for new job; open/edit custom settings; create from recognised style words; preview local uploaded inspiration photo; save copy; delete saved template. Presets cannot be overwritten. Existing post snapshots unchanged. Inspiration-photo AI analysis remains unavailable; local preview is labelled explicitly. Owner/origin protections apply to PATCH/DELETE, with timestamp concurrency checks. 140 automated checks, TypeScript and production build pass. Authenticated preview again blocked by dispatch sign-in 404. No public social posts sent.


## Shared login and general post types

Sites remains the only Hub deployment target. Existing Gmail owner login retained; vince@vinconnect.com.au explicitly added with the same Hub access. Other business-domain accounts still denied. Five suggested post types and custom type strings persist inside saved template settings and article category; existing templates default to installations. Composer now supports general post fields and factual field-based captions. Landscape 1080x720 export added, within social aspect limits; square/portrait retained. Template save/delete use response data directly, show confirmations and block double clicks; timestamp advances on each edit to prevent same-millisecond stale overwrites. Operations dashboard opens existing Netlify dashboard in a separate tab; no migration or redesign claimed.

147 automated tests pass with mocked auth/providers, TypeScript passes. Authenticated browser navigation still stops at preview dispatch sign-in 404; no bypass added. No external social test sent. AI, Facebook provider approval, X/main-site publishing and full dashboard redesign remain blocked as previously documented. Recurring checks creation failed due to account limit of 5 active automations; no task was removed.

Netlify dashboard bbb486d6-6f1e-4889-9175-4f19257a1d80 is manually deployed index.html, no linked commit or source ZIP in deployment metadata. Obtain original dashboard HTML/ZIP before redesigning or migrating its functionality.

## Reference-inspired templates and transparent logo — 2026-09-16
- Added photo spotlight, editorial split and bold campaign layouts, with five category presets. Existing three banner layouts remain supported.
- Gallery and exports use the same renderer; all nine layout/format combinations tested for full-photo containment, unchanged aspect ratio, bounds, contact details and carousel count.
- Supplied original transparent PNG reused without editing on dashboard, article pages and new exports.
- 156 automated tests passed; TypeScript and production build passed.
- Managed browser preview attempted: sign-in redirect produces 404. Authenticated visual/end-to-end QA remains unavailable; no bypass and no live social test posts.
- Existing published graphics remain unchanged. AI image editing and Meta/Windsor Facebook permission blocker remain outside this release.

## Fifteen-template collection — 2026-09-16
- Replaced preset list with 15 distinct compositions, three per category. Legacy saved layouts remain valid.
- Added licensed bundled bold font, condensed headlines with alternating teal accents, angled panels, location badges and category-specific sample previews.
- Reviewed rendered PNG contact sheet and installation hero using the actual renderer in a native canvas runtime. Full browser flow remains limited by preview authentication.
- 202 tests passed including all 45 layout/size combinations, category coverage, preserved image aspect ratios and contacts. TypeScript checked. No social posts sent.

## Reference-led redesign of the complete collection — 2026-09-16
- Replaced all fifteen premium renderers with layered hero images, gradient treatments, genuine Anton condensed type, Allura location script, Barlow supporting text, feature icons and circular callouts. Bundled upstream font licences.
- Original supplied transparent reverse logo for dark designs, original standard logo for light designs. Correct contact number preserved.
- Optional graphic feature lines (240 characters) and callout text (60 characters) validate and persist in job JSON. No speeds or outcomes invented.
- Collage exports use up to two actual supporting photos from the post. All exports are still pending approval.
- Photo framing offers proportional centre crop or full-photo containment; UI explicitly asks user to review equipment visibility.
- Native-canvas contact sheet of all 15 presets reviewed, plus full-size dark hero and light editorial outputs. Browser authentication limitation unchanged.
- 204 automated tests passed; TypeScript checked. No live social publishing performed.

## New named collection — 2026-09-16
- Added 25 named designs, five per category, retaining the original 15.
- Eleven composition families and eight coordinated palettes; original logos preserved.
- Added collection/name/category filtering with empty-state feedback and carousel reset.
- Native canvas visual review of all 25 default designs. Export geometry tested across all 40 designs in three sizes.
- 280 automated tests passed; TypeScript and production build passed.
- Authenticated browser workflow not verified: managed preview sign-in route remains unavailable. No live social posts sent.
