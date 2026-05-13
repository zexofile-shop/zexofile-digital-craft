## 2024-05-13 - Global Formatting in Legacy Codebases
**Learning:** Running global linting/formatting commands (`npm run format`, `npm run lint -- --fix`) in this codebase generates hundreds of lines of diff churn due to inconsistent pre-existing formatting. Also, running `npm install` modified the lockfile significantly.
**Action:** In future optimizations, I must ONLY run linting on the specific files I touch (`pnpm eslint <file> --fix`) instead of running the global project scripts to keep the PR clean and scoped to the < 50 lines rule.
