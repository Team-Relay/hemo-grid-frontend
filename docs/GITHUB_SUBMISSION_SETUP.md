# Final GitHub presentation checklist

This is a **team setup checklist**, not part of the technical or clinical evidence.

## Completed in the two existing repositories

- [x] Keep HemoGrid frontend and backend as separate, independently deployed codebases.
- [x] Put the complete submission entry point in the [frontend README](../README.md).
- [x] Give judges a [two-minute guide](JUDGE_START_HERE.md) with a real demonstration route, tested evidence, system architecture and limitations.
- [x] Connect the [backend README](https://github.com/Team-Relay/hemo-grid-backend#readme) to the same project hub.
- [x] Link the [hosted synthetic lifecycle audit](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072) and [browser/API verification](https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42957499126).
- [x] Preserve the technical-phase README sections, benchmarks, setup instructions, AI-use disclosure and team information.

## Two GitHub organization settings to finish

The available GitHub integration can edit files in **existing** repositories, but cannot create the special organization-profile repository or change each repository's About settings. An organization owner or team member with permission must do these once in GitHub.

### 1. Turn on the Team Relay Overview README

1. Open [Team Relay](https://github.com/Team-Relay), select **Repositories → New**.
2. Repository name: **`.github`** under **Team-Relay**, visibility **Public**; initialize with a README. Create the repository.
3. Add **`profile/README.md`** to that new repository with the full contents of [the ready-to-publish profile](ORG_PROFILE_README.md). The organization's Overview will then show it. An existing frontend/backend README cannot make the organization Overview display a project description.

**Do not copy or merge the applications.** The special repository holds only the organization's public introduction.

### 2. Set short repository descriptions

On each existing repository, open the **About** section's gear icon and paste a matching description:

**`Team-Relay/hemo-grid-frontend`**

> HemoGrid: Emergency blood dispatch with inventory-aware matching, cold-chain checks and staff-controlled joint planning. Live Next.js demo.

**`Team-Relay/hemo-grid-backend`**

> HemoGrid API: Spring Boot dispatch planner, blood inventory reservations, compatibility rules, safety checks and reproducible evaluations.

The frontend already has the live app as its homepage; preserve **https://hemogrid-eight.vercel.app**. Optionally use the same link as the homepage for the backend.

## Submission links to use

If the submission portal asks for **one project repository**, use the [frontend repository](https://github.com/Team-Relay/hemo-grid-frontend), whose first screen links to the full backend and judge guide. Provide the [backend source](https://github.com/Team-Relay/hemo-grid-backend) separately wherever a second source URL is accepted.

- **Project home:** https://github.com/Team-Relay/hemo-grid-frontend
- **Technical service and evaluation:** https://github.com/Team-Relay/hemo-grid-backend
- **Working demo:** https://hemogrid-eight.vercel.app/login
- **One-page guide:** https://github.com/Team-Relay/hemo-grid-frontend/blob/main/docs/JUDGE_START_HERE.md
- **Hosted synthetic transaction evidence:** https://github.com/Team-Relay/hemo-grid-frontend/actions/runs/42952475072
- **Video and slides:** Add the actual final public URLs to both existing READMEs once they are recorded; no placeholders should be represented as published assets.

### Important boundaries

This repository does not carry a root LICENSE file. **A public GitHub project is not automatically open source under an unrestricted licence.** Follow the team's ownership/licensing decision and any third-party dataset terms rather than adding a licence simply for appearance.

No real donor/patient data, actual transfusion, certified interoperability or clinical deployment is claimed. The full test suite and architecture establish a working technical slice, not a clinical validation.

**Last pre-submission check:** Open both repo URLs in an incognito window, test the live demo and links, confirm no private data appears, and ensure the final video/deck links are accessible to reviewers.
