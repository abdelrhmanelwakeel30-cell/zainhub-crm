# CI status

This file exists to nudge GitHub Actions into re-evaluating the workflow
configuration after changes to `.github/workflows/ci.yml`. Empty commits
sometimes don't fire PR synchronize events.

Latest config (commit 960d827):
- `lint` job: continue-on-error (pre-existing any/React19 backlog)
- `audit` job: continue-on-error (uploadthing chain pending upstream)
- `typecheck` + `build`: hard gates (must pass for merge)
