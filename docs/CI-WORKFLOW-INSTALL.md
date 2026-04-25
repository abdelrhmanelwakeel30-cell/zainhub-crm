# CI workflow — install via GitHub UI

The `gh` token in this session lacks the `workflow` scope, so we
cannot push `.github/workflows/ci.yml` directly. The workflow content
was carried locally and is preserved at `docs/ci-workflow.yml.template`.

**To install:**

1. Open https://github.com/abdelrhmanelwakeel30-cell/zainhub-crm
2. Press `.` to open the web editor (or click "Add file" → "Create new file")
3. Path: `.github/workflows/ci.yml`
4. Paste the contents of `docs/ci-workflow.yml.template`
5. Commit to `main` (or to this branch via "Commit directly to main / Open a PR")

**Or grant the scope locally and push:**

```bash
gh auth refresh -s workflow
# then add the workflow file back:
mkdir -p .github/workflows
cp docs/ci-workflow.yml.template .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: add CI workflow (lint + typecheck + build + audit)"
git push
```

**What the workflow runs:**

- `lint` — `npm run lint`
- `typecheck` — `npm ci && npx prisma generate && npx tsc --noEmit`
- `build` — `npm ci && npx prisma generate && npm run build` (with placeholder env vars)
- `audit` — `npm audit --audit-level=high` (currently `continue-on-error: true` until D-002 dep bumps land)

Triggers: every PR to `main`, and pushes to `main`.
