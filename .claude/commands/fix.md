Solve a GitHub issue end-to-end on the main branch.

Steps:
1. Fetch the issue with `gh issue view` using the provided URL or issue number.
2. Read the title, description, labels, and comments. Explore the codebase to understand the relevant code.
3. If anything is ambiguous — requirements, scope, preferred approach — ask the user before writing any code.
4. Propose a plan: which files change, what the changes do, and any trade-offs. Wait for user approval.
5. Implement the fix on `main`. Follow existing code conventions.
6. Validate: run `bun run typecheck` and `bun run build`. Fix any failures.
7. Commit with message format: `[#<number>] <short description>` and the co-author trailer. The commit message should close the issue (use "Closes #<number>" in the body).
8. Push to origin main.

Rules:
- Do NOT write code before the user approves the plan (step 4).
- Ask clarifying questions whenever requirements are unclear — don't guess.
- Keep changes minimal and focused on the issue. No drive-by refactors.

Issue: $ARGUMENTS
