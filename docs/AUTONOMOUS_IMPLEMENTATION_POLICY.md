# Autonomous Implementation Policy

Codex should continue working without asking for user approval when:
- Choosing component names
- Creating folders
- Adding missing Angular files
- Implementing mock data
- Adding CSS tokens
- Fixing TypeScript errors
- Running build/test/lint
- Updating documentation
- Refactoring its own recent changes

Codex should stop and ask only when:
- A destructive command would remove user work
- Credentials or tokens are required
- A private API requires unavailable access
- The task cannot be done in a frontend-only app
- There are conflicting instructions that cannot be resolved

If blocked:
- Implement the closest safe fallback
- Document the limitation
- Continue with other tasks if possible
