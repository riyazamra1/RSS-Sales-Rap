<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep `bun run typecheck` and `bun run build` passing: GitHub Actions (`.github/workflows/ci.yml`) installs with `bun install --frozen-lockfile` and runs both on every push and pull request, and a red run blocks the branch. Keep `bun.lock` committed and in sync with `package.json`.
- Never commit real credentials: `.env` and `.env.*` stay out of Git (only `.env.example`, holding placeholder keys, is committed); CI copies `.env.example` to `.env` so the build still has the keys it reads.
- Keep password recovery on a public `/reset-password` route, with recovery state owned by AuthProvider and verified by Auth before updating; recovery emails must not fall through to normal signed-in navigation.
