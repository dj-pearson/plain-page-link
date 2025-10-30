# AgentBio.net Frontend

React + TypeScript + Vite frontend for AgentBio.net real estate link-in-bio platform.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development

The app will be available at http://localhost:5173

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:5173
```

## Project Structure

-   `/src/components` - Reusable UI components
-   `/src/pages` - Page components (routes)
-   `/src/lib` - Utilities, API client, constants
-   `/src/types` - TypeScript type definitions
-   `/src/hooks` - Custom React hooks
-   `/src/styles` - Global styles

## Tech Stack

-   React 18
-   TypeScript 5
-   Vite (build tool)
-   Tailwind CSS
-   TanStack Query (data fetching)
-   React Router (routing)
-   Zustand (state management)

## Available Scripts

-   `npm run dev` - Start dev server
-   `npm run build` - Build for production
-   `npm run preview` - Preview production build
-   `npm run type-check` - TypeScript type checking
-   `npm run lint` - ESLint linting
