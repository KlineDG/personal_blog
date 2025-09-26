# Codex Context: Personal Blog + Supabase

## Roles & Auth
- Single author blog. Table `blog_owner.owner_id = <UUID>` is the only account that can create/update/delete posts.
- Users authenticate via Supabase Auth; `profiles` mirrors public user info.

## Tables (short)
- posts(id, author_id, title, slug, content, status, published_at, is_deleted, ...).
- comments(id, post_id, author_id, parent_id?, body, depth, is_deleted).
- post_reactions(user_id, post_id, reaction ∈ {1,-1}).
- post_bookmarks(user_id, post_id).
- profiles(id = auth.users.id).
- blog_owner(owner_id).

## RLS (plain English)
- posts:
  - SELECT: everyone sees `status='published' AND is_deleted=false`; owner sees all.
  - INSERT/UPDATE/DELETE: owner only; `author_id` must equal `auth.uid()`.
- comments:
  - SELECT: visible on published posts; owner sees all; authors see their own.
  - INSERT: any signed-in user on published posts; `author_id = auth.uid()`.
  - UPDATE/DELETE: comment author or owner (for moderation).
- post_reactions:
  - SELECT: public; UPSERT/DELETE: only the reacting user.
- post_bookmarks:
  - SELECT/UPSERT/DELETE: only the bookmarking user (private).
- profiles: SELECT all; INSERT/UPDATE self only.

## Keys & Safety
- Client uses **anon** key only.
- **service_role** key must be server-only (Edge Function/Route Handler env). Never expose it.

## Query Patterns
- Publish a post (owner only):
  - `insert into posts (...)` with `author_id = auth.uid()` and `status='published'`.
- Like/Dislike:
  - `upsert post_reactions {user_id, post_id, reaction: 1|-1}`; delete row to clear.
- Bookmark:
  - `upsert post_bookmarks {user_id, post_id}`; delete to unsave.
- Comments:
  - `insert comments {post_id, author_id: auth.uid(), body, parent_id?, depth}`.

## Common Errors
- 401/403: Likely RLS—ensure `author_id = auth.uid()` and target post is published for non-owner actions.
- Draft access by non-owner is blocked by design.
