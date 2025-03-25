# CLAUDE.md - Guidelines for Agentic Coding

## Build & Run Commands
- `npm run dev` - Start both server and client concurrently
- `npm run server` - Start server only (with nodemon)
- `npm run client` - Start client only
- `npm start` - Run server in production mode

## Test Commands
- Client: `cd client && npm test` - Run all client tests
- Single test: `cd client && npm test -- -t 'test name pattern'`

## Lint & Format
- ESLint is configured via create-react-app defaults
- 2-space indentation is standard throughout

## Code Conventions
- **Structure**: MVC pattern with routes, controllers, models, services
- **Naming**: camelCase for variables/functions, PascalCase for components/models
- **Imports**: Group by type (React, third-party, local)
- **Error Handling**: Use try/catch with descriptive error messages
- **Authentication**: JWT-based, handled via auth.middleware.js
- **API Routes**: RESTful under /api/[resource]
- **React Components**: Functional components with hooks
- **State Management**: Context API (AuthContext, NotificationContext)

## Tech Stack
Node.js, Express, React, MongoDB, Socket.io