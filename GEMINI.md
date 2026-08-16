# Agent Rules

1. **Auto-Document New Features**: Whenever you implement a new feature, architecture change, or significant workflow improvement, you MUST automatically update the `README.md` file(s) to describe these new changes. Do not wait for the user to ask you to update the README. Update it as part of the final implementation step.

2. **TypeScript Integrity**: The backend strictly uses TypeScript. After modifying any backend logic, you MUST run `npx tsc --noEmit` to verify there are no implicit `any` type errors or interface mismatch regressions before finishing your task.

3. **Premium UI Consistency**: The frontend leverages a custom glassmorphism design system. When building or modifying React components, you MUST reuse existing visual tokens (e.g., `glass-card`, distinct gradients, `slate-800` text) to ensure the UI remains premium and cohesive. Do not inject raw unstyled HTML elements.

4. **API Synchronization**: When updating a backend API route's request or response schema, you MUST simultaneously locate and update the frontend fetch calls (usually in `src/components/`) to map the data correctly, preventing silent runtime failures.
