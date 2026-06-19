# No-Backend Decision

## Decision

Mission Control should be implemented as a pure frontend application for the MVP.

## Reasoning

The app is primarily a local dashboard and launcher:

- Velo and Dash already exist as local web apps
- sevDesk can start as a shortcut
- Calendar can start with mock data
- Settings can be stored locally in the browser

## Benefits

- Faster implementation
- Less maintenance
- No server deployment
- No database required
- Works locally
- Lower security risk for MVP

## Limitations

A frontend-only app cannot safely:

- Store private API keys
- Perform secure OAuth token exchange
- Hide sevDesk credentials
- Bypass CORS
- Aggregate APIs that require server-side secrets

## When to Add a Backend

Add a backend only when one of these becomes necessary:

- sevDesk API integration
- Google/Microsoft calendar OAuth
- Centralized sync across devices
- Authentication
- Multi-user functionality
- Secure secret handling
- CORS proxying for local services

## Recommended Future Backend

If needed later:

- Node.js/NestJS or lightweight Fastify
- SQLite or PostgreSQL
- Local deployment first
- Token storage server-side only
