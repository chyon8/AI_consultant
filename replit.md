# Wishket AI Smart Estimation

## Overview
This React + Vite + TypeScript application provides an AI-powered project estimation chatbot for IT projects. It leverages Google's Gemini AI and Anthropic Claude to optimize project scope and budget by offering insights on modules, features, and cost drivers. The application aims to streamline project planning from initial requirements to RFP generation, ensuring efficient and accurate project estimations.

## User Preferences
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

## System Architecture

### Tech Stack
- **Frontend Framework**: React
- **Build Tool**: Vite
- **Language**: TypeScript
- **Backend**: Express.js
- **UI Icons**: Lucide React

### Core Features
- ChatGPT/Gemini style landing page with file attachment and drag & drop support for multiple file types (txt, pdf, doc, docx, md, jpg, jpeg, png, gif, webp).
- Interactive chat interface with AI consultant and real-time streaming responses via SSE.
- Project module and feature selection with budget optimization suggestions.
- Partner type presets (TYPE A/AI_NATIVE, TYPE B/STUDIO, TYPE C/AGENCY).
- Three top-level tabs: `견적/예산` (Estimation/Budget), `수행계획` (Execution Plan), `공고작성` (RFP Creation).
- Dark mode support and a resizable sidebar.
- **Atomic Session Unit Architecture** (`services/atomicSession.ts`): Strict 1:1 coupling between chat sessions and dashboard state.
- **SessionCoupler** enforces indivisible chat+dashboard binding with ownership validation.
- **Strict Context Switching**: When switching sessions, ALL components (chat + dashboard) sync immediately to that session's data.
- **Isolation Guards**: All state mutations validate session ownership before executing; mismatched operations are blocked.
- Immutable Constraints System (`constraintValidator.ts`) to enforce business rules like price integrity and essential logic locks.
- Server-side text extraction for PDF, DOCX, and text files, with auto-triggering of AI analysis upon upload.
- AI Model Settings Management allowing per-function model selection (e.g., for `analyzeProject`, `generateRFP`).
- Conditional workflow for chat commands with intent classification and user confirmation for significant actions.
- WBS (Work Breakdown Structure) calculation using `scheduleEngine.ts` with partner-specific configurations.

### AI Integration & Architecture
- **Unified AI Router**: `server/services/aiRouter.ts` dispatches AI calls to either Google Gemini or Anthropic Claude based on the selected model, providing a consistent interface.
- **AI Functions**: Five core AI functions are configurable: `analyzeProject`, `generateRFP`, `classifyUserIntent`, `streamChatResponse`, `generateInsight`.
- **Context Lock Security**: A context-lock guard ensures that "NEW_PROJECT" requests are blocked during ongoing sessions to prevent accidental resets.
- **Prompt Structure**: AI prompts are structured for two main parts: PART 1 (Project Planning/Estimation/WBS) and PART 2 (RFP Document Generation).

### User Flow
1. **Landing Page**: Users input project requirements or attach relevant files.
2. **Analysis**: Gemini AI analyzes inputs to generate PART 1 (planning, estimation, WBS).
3. **Detail View**: Users review and adjust modules/features within the dashboard.
4. **RFP Generation**: Gemini AI generates PART 2 (RFP document).

## External Dependencies

- **AI Providers**:
    - Google Gemini AI (`@google/genai`)
    - Anthropic Claude (`@anthropic-ai/sdk`)
- **Backend Libraries**:
    - Express.js
    - `multer` (for file uploads)
    - `pdf-parse` (for PDF text extraction)
    - `mammoth` (for DOCX text extraction)
- **Environment Variables (Replit Secrets)**:
    - `GEMINI_API_KEY`
    - `ANTHROPIC_API_KEY` (optional)