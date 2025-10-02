# Codex Context — Personal Blog (Next.js + Supabase)

**Purpose:** Single‑author blog. Only the site owner can create/edit posts; any signed‑in user can comment, react, and bookmark. Bookmarks are private. The editor is TipTap (WYSIWYG) storing JSON.

---

## Latest DB snapshots (ground truth)

Save files live in `docs/ai/exports/` and should be re‑generated after any schema/policy change.

* **Tables & columns:** `docs/ai/exports/2025-10-2_db-policy.json`
* **RLS policies:** `docs/ai/exports/2025-10-2_rls-policies.json`

> Codex: Prefer the JSON above for precise column names, data types, and policy text.

---

## Roles & Auth

* **Owner:** `blog_owner.owner_id` — the only account that may write posts/folders and storage objects.
* **Users:** Supabase Auth. Public profile data is stored in `public.profiles` (`profiles.id = auth.users.id`).

**Keys & safety**

* Client uses **anon** key only.
* **service_role** must be server-only; never ship to the browser.

---

## Tables (current)

Short view of the main app tables (see snapshot for full details, defaults, and PKs):

* **blog_owner**: `(owner_id uuid pk)` — single row designating the site owner.
* **profiles**: `(id uuid pk, username citext, display_name, avatar_url, bio, created_at, updated_at)`.
* **posts**: `(id uuid pk, author_id uuid, title, slug unique, content text, excerpt, cover_image_url, status text, published_at timestamptz, is_deleted boolean, created_at, updated_at, content_json jsonb, folder_id uuid null)`.
* **comments**: `(id uuid pk, post_id uuid, author_id uuid, parent_id uuid?, body text, depth int, is_deleted boolean, created_at, updated_at)`.
* **post_reactions**: `(user_id uuid, post_id uuid, reaction smallint, created_at)` **pk** `(user_id, post_id)`.
* **post_bookmarks**: `(user_id uuid, post_id uuid, created_at)` **pk** `(user_id, post_id)`.
* **post_versions**: `(id bigserial pk, post_id uuid fk, actor_id uuid fk, title text, content_json jsonb, created_at)` — manual snapshots.
* **folders**: `(id uuid pk, owner_id uuid, name text, slug text, description text?, sort_order int, created_at, updated_at)`.
* **views**: `folder_post_counts(folder_id, drafts, published)` for sidebar badges.

**Relationships**

* `posts.author_id → profiles.id`
* `comments.post_id → posts.id`, `comments.author_id → profiles.id`, `comments.parent_id → comments.id`
* `post_reactions.post_id → posts.id`, `post_reactions.user_id → profiles.id`
* `post_bookmarks.post_id → posts.id`, `post_bookmarks.user_id → profiles.id`
* `post_versions.post_id → posts.id`, `post_versions.actor_id → profiles.id`
* `posts.folder_id → folders.id (ON DELETE SET NULL)`

---

## Storage (images)

* **Bucket:** `post-images` (public read).
* **Policy:** Public `SELECT`; owner‑only `INSERT/UPDATE/DELETE` on `storage.objects` scoped to `bucket_id = 'post-images'`.
* Editor uploads use Supabase Storage; images are inserted as `figure` nodes in TipTap content.

---

## RLS Overview (plain English)

* **posts**

  * `SELECT`: everyone sees published & not deleted; owner sees all.
  * `INSERT/UPDATE/DELETE`: owner only, and `author_id = auth.uid()`.
* **comments**

  * `SELECT`: visible on published posts; owner sees all; authors see their own.
  * `INSERT`: any signed‑in user on published posts; `author_id = auth.uid()`.
  * `UPDATE/DELETE`: comment author or owner (moderation on owner’s posts).
* **post_reactions**: public `SELECT`; a user may upsert/update/delete only their own `(user_id = auth.uid())` row.
* **post_bookmarks**: private — only the bookmarking user can `SELECT/INSERT/DELETE`.
* **post_versions**: owner only (all commands).
* **folders**: owner only (all commands).
* **storage.objects (post-images)**: public read; owner‑only writes.

> Exact SQL for each policy is in the RLS snapshot JSON above.

---

## Query Patterns (client)

* **Publish / unpublish**

  * Publish: `update posts set status='published', published_at=now() where id = :id` (owner only).
  * Unpublish: `update posts set status='draft', published_at=null where id = :id`.
* **Reactions**

  * Like: `upsert post_reactions { user_id, post_id, reaction: 1 }`.
  * Dislike: `reaction: -1`. Remove reaction by deleting the row.
* **Bookmarks**

  * Save: `upsert post_bookmarks { user_id, post_id }`.
  * Unsave: delete by keys.
* **Comments**

  * Create on published posts: `insert comments { post_id, author_id: auth.uid(), body, parent_id?, depth }`.
* **Folders**

  * Create: `insert folders { owner_id: auth.uid(), name, slug }`.
  * Move post: `update posts set folder_id=:folder where id=:post`.
* **Versions**

  * Manual snapshot: `insert post_versions { post_id, actor_id: auth.uid(), title, content_json }`.

---

## Editor content (TipTap)

* Stored in `posts.content_json` as TipTap JSON.
* Images: uploaded to `post-images` and embedded as `figure` nodes with `align` (left/center/right) and `caption`.

---

## Regenerating snapshots

Use these to refresh the JSON exports after schema/policy changes and save to `docs/ai/exports/` with today’s date.

* **Tables/columns JSON** — see project notebook/README command.
* **RLS policies JSON** — `select jsonb_agg(jsonb_build_object('schema', schemaname, 'table', tablename, 'policy', policyname, 'command', cmd, 'roles', roles, 'permissive', permissive, 'using', qual, 'with_check', with_check) order by schemaname, tablename, policyname) from pg_policies where schemaname='public' or (schemaname='storage' and tablename='objects');`

---

## Conventions & gotchas

* **Slugs** are unique; generate from title and de‑dupe with `-2`, `-3`, …
* **Owner guard**: lock `/write` UI to owner; RLS already blocks writes, but client‑side checks improve UX.
* **Auth required** for comments/reactions/bookmarks.
* **Never** expose the service role key.

---

*Last updated: 2025‑10‑02.*
