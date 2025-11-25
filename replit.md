# Wishket AI Smart Estimation

## Overview
This is a React + Vite + TypeScript application that provides an AI-powered project estimation chatbot for IT projects. The app uses Google's Gemini AI to help users optimize project scope and budget by providing insights on modules, features, and cost drivers.

---

## STRICT DEVELOPMENT PROTOCOLS (REPLIT MODE)

You are acting strictly as a **Logic Implementation Engine**.

### 1. VISUAL & UI IMMUTABILITY (Absolute Design Freeze)
- **NEVER TOUCH DESIGN:** Do not modify Layouts, Margins, Padding, Colors, Typography, Shadows, or Radii.
- **PRESERVE CODE:** Even if HTML/CSS structure seems inefficient, KEEP IT EXACTLY AS IS.
- **NEW FEATURES:** You must reuse existing components/classes 100%. Do not invent new styles.

### 2. ARCHITECTURE & LOGIC FREEZE
- **NO LOGIC REORDERING:** Do not change the execution order, depth, or flow of existing modules/functions unless explicitly requested.
- **NO REFACTORING:** Do not "clean" or "optimize" existing code. Only insert the minimum required logic.
- **NO FILE SHUFFLING:** Do not move files or rename folders. Work within the existing file structure.
- **CONFIG PROTECTION:** Do not edit `.replit` or `.nix` files (System boot configs).

### 3. MANDATORY WORKFLOW: PLAN & SELF-CORRECTION
Before writing any code, you MUST output a plan in this format:

> **[PLANNING & REVIEW]**
> 1. **Intended Change:** (Brief summary)
> 2. **Constraint Check:**
>    - Visual/UI Changes? [YES/NO] -> **Must be NO**
>    - Logic Flow/Depth Altered? [YES/NO] -> **Must be NO** (unless requested)
> 3. **Conclusion:** Proceeding with implementation.

**If any check is "YES", STOP and revise your plan.**

---

## Project Architecture

### Tech Stack
- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **AI Service**: Google Gemini AI (@google/genai)
- **UI Icons**: Lucide React

### Project Structure
```
├── components/          # React components
│   ├── ArchitectureTab.tsx
│   ├── BudgetOptimizer.tsx
│   ├── ChatInterface.tsx
│   ├── Dashboard.tsx
│   ├── EstimationTab.tsx
│   └── ... (other UI components)
├── services/
│   └── geminiService.ts # Gemini AI integration
├── App.tsx             # Main application component
├── constants.ts        # Application constants
├── types.ts           # TypeScript type definitions
├── index.tsx          # Application entry point
└── vite.config.ts     # Vite configuration

```

### Key Features
- Interactive chat interface with Gemini AI consultant
- Project module and feature selection
- Budget optimization suggestions
- Partner type presets (STUDIO, STARTUP, ENTERPRISE, etc.)
- Project scale selector
- Architecture, Schedule, and Estimation tabs
- Dark mode support
- Resizable sidebar interface

## Configuration

### Environment Variables
The application requires a Gemini API key to function:
- `GEMINI_API_KEY`: Your Google Gemini API key (set in `.env.local`)

### Vite Configuration
- **Port**: 5000 (required for Replit webview)
- **Host**: 0.0.0.0 (allows external connections)
- **Allowed Hosts**: true (required for Replit proxy)

## Development

### Running Locally
1. Ensure dependencies are installed: `npm install`
2. Set your Gemini API key in `.env.local`
3. Run development server: `npm run dev`
4. Access at: http://localhost:5000

### Workflow
The "Start application" workflow runs `npm run dev` and serves the app on port 5000.

## API Integration

### Gemini AI Service
The app uses Gemini 2.5 Flash model for:
- Project cost analysis
- Feature trade-off recommendations
- Budget optimization suggestions
- Architecture and scheduling advice

The AI consultant is context-aware of:
- Selected modules and sub-features
- Current project cost
- Partner type multipliers
- Project scale settings

## Recent Changes (November 25, 2024)
- Imported from GitHub to Replit
- Configured Vite to run on port 5000 with allowedHosts enabled for Replit proxy
- Removed CDN import maps and configured to use npm packages from node_modules
- Added script tag to index.html to load the React app
- Set up workflow for automatic app startup
- Configured GEMINI_API_KEY as a Replit secret
- Set up deployment configuration for static build
- Documented project structure and setup

## Notes
- The app uses Tailwind CSS via CDN (warning in console is expected for dev)
- All components are in Korean language
- Budget calculations are in Korean Won (KRW)
- Gemini API key is required and stored as a Replit secret
- The app runs on port 5000 and is accessible via Replit's webview proxy
