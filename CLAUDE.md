# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains an H5 (mobile web) sports booking platform (`sysh-h5/`) being developed based on a reference WeChat mini-program (`sysh_wx_app/`). The H5 version is a simplified, customized adaptation of the mini-program's functionality.

## Development Commands

All commands are run from the `sysh-h5/` directory:

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Development (Vite dev server)
npm run dev                    # http://localhost:5173

# Production build
npm run build                  # Outputs to dist/
npm run build:check            # TypeScript check + build

# Production server (serves dist/ static files)
npm run server                 # http://localhost:3000

# Preview built output
npm run preview
```

## Architecture

### Tech Stack
- Vue 3 + TypeScript + Vite 5
- Vant 4 (mobile UI components, auto-imported)
- Pinia (state management)
- Axios (HTTP client)
- Express static file server for production

### API Pattern
Frontend directly requests backend API (`https://sysh.tennis168.vip/api`) - the backend has CORS enabled, so no proxy is needed.

The backend identifies H5 requests via the `Form-type: h5` header added by `utils/request.ts`.

### Key Directories (sysh-h5/src/)
- `api/` - API functions organized by domain (auth, order, sports, store)
- `pages/` - Vue page components (auth, cards, home, order, sports, user)
- `stores/` - Pinia stores (auth.ts for token/user, store.ts for branch selection)
- `utils/request.ts` - Axios instance with auth interceptors

### Authentication Flow
1. Phone number entry → Slider puzzle verification → SMS code → Login
2. Token stored in localStorage, added to requests via Axios interceptor
3. Store/branch selection required before booking (persisted in localStorage)

### State Persistence
Both Pinia stores sync with localStorage:
- `auth.ts`: token, userInfo
- `store.ts`: currentStoreId, storeList

## Reference Mini-Program

The `sysh_wx_app/` directory contains the decompiled WeChat mini-program source. Use it to:
- Understand original feature implementations
- Reference API endpoint usage patterns
- Check component behavior and business logic

Key mini-program directories:
- `components/` - Reusable components (verify/, sports/, thorui/)
- `pages/` - Page implementations
- `api/` - API definitions
