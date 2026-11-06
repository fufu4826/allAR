# Instructions for AI agents working in this repository

Before doing anything, read `docs/team/AI-GUIDE.md` (Thai). It defines:
- the project and its current status;
- the start-of-chat protocol: ask the user's role, then the previous progress, then this round's goal, one question at a time;
- each role's scope and rules;
- decisions that must not change without the coordinator;
- how to hand work back: fork, then a Pull Request to `main`, then a hand-off prompt in the given format.

Folder-specific instructions:
- `web/AGENTS.md`: Next.js 16 differs from what you know; read it before touching `web/`.
- `design/ar-heritage/AGENTS.md`: the design prototype.

Everything the user sees must be in Thai. The repository is public: never commit secrets, `.env` files or personal data.
