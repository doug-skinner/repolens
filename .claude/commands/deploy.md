Deploy a new release of repolens. Determines the version bump type from the argument (patch, minor, or major — defaults to patch if not specified).

Steps:
1. Ensure you're on `main` and it's clean and up to date with origin.
2. Read the current version from `package.json`.
3. Compute the new version based on the bump type.
4. Confirm the version bump with the user before proceeding (e.g. "Bump 0.1.1 → 0.1.2?").
5. Update the `version` field in `package.json`.
6. Commit: `bump version to <new-version>` with the co-author trailer.
7. Tag: `v<new-version>`.
8. Push the commit and tag to origin.
9. Verify the release workflow started with `gh run list --workflow=release.yml --limit=1`.
10. Report the workflow run status and remind the user they can `brew upgrade repolens` once it completes.

Rules:
- Do NOT proceed past step 4 without explicit user confirmation.
- If the working tree is dirty or not on `main`, stop and tell the user.

Bump type: $ARGUMENTS
