# Agent Guidelines for Helium

## Project Overview

Helium is a Nuxt 3 application for effortless WebRTC screensharing with:

- **Framework**: Nuxt 4 (Vue 3 + TypeScript)
- **Package Manager**: pnpm
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk
- **UI**: shadcn-vue + Tailwind CSS v4
- **State**: Pinia stores
- **i18n**: @nuxtjs/i18n (English & Spanish)

## Build/Dev/Test Commands

### Development

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm generate         # Generate static site
```

### Database

```bash
pnpm db:migrate       # Generate and run migrations
```

### UI Components

```bash
pnpm ui:add [component]  # Add shadcn-vue component
```

### Running Single Tests

Currently no test framework is configured. If adding tests, recommend Vitest for unit tests and Playwright for e2e.

## Project Structure

```
app/
├── components/        # Vue components
│   ├── app/          # Application-specific components
│   └── ui/           # shadcn-vue UI components
├── composables/       # Vue composables (e.g., useWebSocketUrl)
├── layouts/           # Nuxt layouts
├── lib/               # Utilities, DB schema, types
│   ├── db/           # Database schema and utils
│   ├── schema/       # Zod validation schemas
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Helper functions
├── middleware/        # Route middleware (e.g., auth)
├── pages/            # File-based routing
├── plugins/          # Nuxt plugins
└── state/            # Pinia stores

server/
├── api/              # API endpoints
├── cron/             # Scheduled tasks
└── routes/           # Server routes (e.g., WebSocket)

drizzle/              # Database migrations
i18n/                 # Translation files
public/               # Static assets
```

## Code Style Guidelines

### TypeScript

- **Always use TypeScript**: No `.js` files. All code must be typed.
- **Type imports**: Use `import type` for type-only imports

  ```typescript
  import type { PrimitiveProps } from "reka-ui";
  import type { HTMLAttributes } from "vue";
  ```

- **Explicit return types**: Prefer explicit return types for functions
- **No `any`**: Avoid `any` type. Use `unknown` or proper typing
- **Interface vs Type**: Use `interface` for object shapes, `type` for unions/intersections

### Imports

- **Path aliases**: Use `@/` for app directory imports and `~/` for root imports

  ```typescript
  import { cn } from "@/lib/utils";
  import { schema } from "~/lib/schema/new-preset";
  ```

- **Import order**:
  1. External packages
  2. Vue/Nuxt imports
  3. Type imports
  4. Internal utilities
  5. Components
  6. Relative imports

### Vue Components

- **Script Setup**: Always use `<script setup lang="ts">`
- **Props**: Define with TypeScript interfaces

  ```typescript
  interface Props extends PrimitiveProps {
    variant?: ButtonVariants["variant"];
    size?: ButtonVariants["size"];
    class?: HTMLAttributes["class"];
  }
  const props = withDefaults(defineProps<Props>(), {
    as: "button",
  });
  ```

- **Template**: Keep templates clean, extract complex logic to composables
- **Component naming**: PascalCase for components, kebab-case for files in multi-word components

### Naming Conventions

- **Files**:
  - Components: PascalCase (e.g., `Button.vue`, `EditPresetDialog.vue`)
  - Composables: camelCase starting with `use` (e.g., `useWebSocketUrl.ts`)
  - API routes: kebab-case with HTTP method (e.g., `[id].get.ts`, `[id].delete.ts`)
  - Database: camelCase for tables (e.g., `schema.ts`, `migrate.ts`)
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase for config objects
- **Functions**: camelCase, descriptive verbs (e.g., `createPreset`, `getPresetById`)
- **Components**: PascalCase

### Database (Drizzle)

- **Schema location**: `app/lib/db/schema.ts`
- **Relations**: Define relations separately after table definitions
- **Column naming**: camelCase in TypeScript, snake_case in SQL

  ```typescript
  export const presets = pgTable("presets", {
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  });
  ```

- **Migrations**: Always generate migrations with `pnpm db:migrate`

### API Routes (Server)

- **Event handlers**: Use `defineEventHandler`
- **Auth**: Check `event.context.auth()` for authentication

  ```typescript
  const { isAuthenticated, userId } = event.context.auth();
  if (!isAuthenticated || !userId) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  ```

- **Error handling**: Use `createError` for HTTP errors
- **Validation**: Use Zod schemas from `app/lib/schema/`
- **Response format**: Consistent structure with `success` and `data`/`message` fields

  ```typescript
  return {
    success: true,
    data: preset,
  };
  ```

### Error Handling

- **Server**: Use `createError()` with proper status codes
- **Client**: Use `toast` from `vue-sonner` for user feedback

  ```typescript
  try {
    await $fetch("/api/presets", { method: "POST" });
    toast.success(t("presetCreatedSuccessfully"));
  } catch (error) {
    toast.error(t("failedToCreatePreset"));
  }
  ```

- **Validation**: Use Zod with `.safeParse()` and handle errors
- **Always catch promises**: Never leave promises unhandled

### Formatting

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Optional but consistent within files
- **Line length**: Aim for 80-100 characters, break at 120
- **Trailing commas**: Use in multiline objects/arrays
- **Comments**: Prevent comments where possible, if the code is not understandable by itself.

### State Management

- **Pinia stores**: Located in `app/state/`
- **Store naming**: Descriptive (e.g., `streamer.ts`, `viewer.ts`)
- **Composables**: Prefer composables over stores for simple state

### i18n

- **Always use**: Use `useI18n()` composable for all user-facing strings. That is, you must localize any user-facing text.

  ```typescript
  const { t } = useI18n();
  <h1>{{ t('presets') }}</h1>
  ```

- **Keys**: camelCase (e.g., `createNewPreset`, `deletePresetConfirm`)
- **Files**: `i18n/locales/en.json` and `i18n/locales/es.json`

## Important Notes

- **Authentication**: All protected routes must use auth middleware
- **WebSocket**: Available at `/ws/signaling` for real-time communication
- **Environment**: Use `.env` file (not committed) for DATABASE_URL and Clerk keys
- **Clerk**: Auth provider - use `useAuth()` and `useUser()` composables
- **Styling**: Use Tailwind utility classes, `cn()` helper for conditional classes
