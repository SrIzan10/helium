# Helium

Effortless screensharing powered by WebRTC.

## Prerequisites

### TURN Server Setup

To enable connections through restrictive NATs, you need a TURN server. We use [Metered's Open Relay](https://www.metered.ca/tools/openrelay/) which provides 50GB/month free.

1. Sign up for a free account at https://dashboard.metered.ca/signup
2. Create a new app (you'll get an app name like `yourapp.metered.live`)
3. Copy your API key from the dashboard

4. Fill in your credentials in `.env`:

```bash
METERED_APP_NAME=yourapp
METERED_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
