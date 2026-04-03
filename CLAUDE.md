# CLAUDE.md

This is a personal side project to learn micro-animation built with **Vite + React + Tailwind CSS**.
Treat it like a passion project: clean code, great UI, zero bloat.

---

## 🚀 Commands

| Task | Command |
|---|---|
| Start dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |

> Always run `npm run lint` after a series of changes to catch issues early.
> Prefer `npm` over `yarn` or `pnpm` unless a `yarn.lock` / `pnpm-lock.yaml` exists.

---

## 🗂️ Project Structure

```
src/
├── assets/          # Static images, fonts, icons
├── components/      # Reusable UI components (Button, Card, Modal…)
├── pages/           # Top-level route views (Home, About, Projects…)
├── hooks/           # Custom React hooks (use-prefixed)
├── lib/             # Utility functions and helpers
└── App.jsx          # Root component and routing
```

> When creating new files, always follow this structure. Don't dump things in `src/` root.

---

## ⚛️ React Conventions

- **Functional components only** — no class components, ever.
- **Named exports** for all components (`export function Hero()`, not `export default`).
- One component per file. Filename matches the component name (`HeroSection.jsx`).
- Use **custom hooks** (`src/hooks/`) to extract complex logic from components.
- Keep components **small and focused** — if it exceeds ~100 lines, split it up.
- Props should be destructured at the function signature level.

```jsx
// ✅ Good
export function ProjectCard({ title, description, href }) { … }

// ❌ Bad
export default function(props) { … }
```

---

## 🎨 Tailwind CSS Conventions

- **Utility classes only** — no custom CSS files unless absolutely unavoidable.
- Use `clsx` or `cn()` for conditional class merging (install if not present).
- Responsive design is mobile-first: `sm:`, `md:`, `lg:` breakpoints.
- Prefer Tailwind's design tokens (spacing, color, typography) over arbitrary values.
- Keep class lists readable — break long ones across lines in JSX.

```jsx
// ✅ Good
<div className={clsx(
  "flex items-center gap-4 rounded-xl p-6",
  isActive && "bg-indigo-600 text-white"
)} />
```

---

## 🧠 Code Style

- **ES Modules** everywhere (`import`/`export`, never `require`).
- `const` by default, `let` only when reassignment is needed.
- Arrow functions for callbacks; named functions for components and hooks.
- No `console.log` left in committed code.
- Descriptive variable names over short abbreviations (`isMenuOpen` not `open`).
- Avoid deeply nested ternaries — extract to a variable or early return instead.

---

## 🏗️ Architecture Decisions

- **Routing**: React Router v6 (`createBrowserRouter` pattern preferred).
- **State**: Local `useState` / `useReducer` first. Only reach for Context if state is truly global.
- **Data fetching**: Native `fetch` with `useEffect`, or a simple custom hook. No heavy libraries needed for a portfolio.
- **Animations**: Prefer CSS transitions / Tailwind `transition-*` classes. Use Framer Motion only for complex sequences.
- **Icons**: Lucide React (`lucide-react`) — consistent, tree-shakeable.

---

## ⚠️ Important Rules

- **NEVER hardcode secrets or API keys** in source files — use `.env` and prefix with `VITE_`.
- **Don't over-engineer** — this is a portfolio project. Reach for the simple solution first.
- Accessibility matters: always include `alt` on images, `aria-label` on icon buttons, and correct heading hierarchy.
- When in doubt about a design decision, lean toward **clean and minimal**.
- Run a build (`npm run build`) before declaring any feature "done" to catch Vite/Rollup errors.

---

## 🔄 Git Workflow

- Branch names: `feat/`, `fix/`, `chore/` prefixes (e.g. `feat/projects-section`).
- Commit messages: imperative mood, present tense (`Add hero animation`, not `Added`).
- Never commit `dist/`, `.env`, or `node_modules/`.

---

## 💡 Context Engineering Tips (for Claude Code)

- When compacting, preserve: modified file list, active branch, and any WIP component names.
- Use `@src/components/` references to point to real files instead of pasting code snippets.
- If you're asked to "investigate" the codebase, scope it to a specific folder — don't read everything.
