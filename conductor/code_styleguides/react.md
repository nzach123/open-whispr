# React & Tailwind CSS Style Guide

## React 19 Standards
- **Functional Components:** Use functional components with hooks.
- **Naming:** Use PascalCase for components (`MyComponent.tsx`) and camelCase for hooks (`useMyHook.ts`).
- **Props:** Use TypeScript interfaces for prop definitions.
- **Modern Features:** Leverage React 19's improved `use` hook and Actions where appropriate.
- **Decomposition:** Keep components small and focused. Extract logic into custom hooks.

## Tailwind CSS v4 Standards
- **CSS-First Configuration:** Prefer `@theme` and CSS variables over JS-based configuration.
- **Utility Classes:** Use utility classes for most styling.
- **Optimization:** Use the Vite plugin for optimal build-time processing.
- **Clarity:** Group related Tailwind classes (e.g., layout, then typography, then colors).

## UI/UX Patterns
- **shadcn/ui:** Follow the patterns established by shadcn/ui and Radix UI.
- **Accessibility:** Ensure components have appropriate ARIA roles and keyboard support.
- **Responsive Design:** Use Tailwind's mobile-first breakpoint system.
