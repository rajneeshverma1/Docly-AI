# Contributing to Docly AI

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/rajneeshverma1/Docly-AI.git
cd Docly-AI
npm install
cp .env.example .env   # fill in your API keys
npm run db:migrate
npm run dev
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `chore` | Build process, tooling, dependencies |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |

## Pull Request Process

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes with clear, atomic commits
3. Ensure `npx tsc --noEmit` passes with zero errors
4. Open a PR with a clear description of what changed and why

## Code Style

- TypeScript strict mode — no `any` types
- All new constants go in `lib/config.ts`
- Use `lib/logger.ts` instead of `console.log` in server code
- Keep components small and single-purpose

## Reporting Issues

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Node.js version and OS

- Contribution marker commit 1 generated on 2026-03-25 19:55:05

- Contribution marker commit 2 generated on 2026-03-25 19:55:05
