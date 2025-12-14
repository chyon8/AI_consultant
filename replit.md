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
- **Progressive Loading Architecture**: Staged SSE streaming with per-job acknowledgement tracking.
  - AI generates data in stages: Modules → Estimates → Schedule → Summary with stage markers
  - Server detects stage markers and sends staged results to client via `stagedResults` in job status
  - Client displays modules immediately while other tabs show skeleton loaders
  - Per-job acknowledgement tracking (`acknowledgedStagesPerJob`) prevents duplicate processing
  - Job-scoped acknowledgement ensures correct behavior across session switches and tab visibility changes

### AI Integration & Architecture
- **Unified AI Router**: `server/services/aiRouter.ts` dispatches AI calls to either Google Gemini or Anthropic Claude based on the selected model, providing a consistent interface.
- **AI Functions**: Five core AI functions are configurable: `analyzeProject`, `generateRFP`, `classifyUserIntent`, `streamChatResponse`, `generateInsight`.
- **Context Lock Security**: A context-lock guard ensures that "NEW_PROJECT" requests are blocked during ongoing sessions to prevent accidental resets.
- **Shared Prompts**: All AI prompts are centralized in `server/prompts/analysis.ts` (v1.3.0-Staged-Output) to ensure consistent behavior across Gemini and Claude models.
- **Prompt Structure**: AI prompts are structured for staged output with PART 1 (Project Planning/Estimation/WBS with 4 progressive stages) and PART 2 (RFP Document Generation).

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

## Session Data Persistence Checklist

When adding new data fields that must persist across session switches, follow this checklist:

### Required Steps for New Dashboard Data Fields

1. **types.ts**: Add field to `DashboardState` interface
2. **services/atomicSession.ts**: Add field to `AtomicSessionUnit.dashboard` interface
3. **App.tsx - Auto-save effect**: Include field in the dashboard save effect (around line 223-240) and add to dependency array
4. **App.tsx - Session switch (legacy)**: Include field when populating atomic unit from legacy session data
5. **App.tsx - Session switch (stale data sync)**: Include field when syncing stale data from localStorage
6. **App.tsx - Session switch (STEP 3)**: Include field when syncing from atomic unit to React state
7. **App.tsx - saveResultToSessionStorage**: Include field in dashboardState object
8. **App.tsx - backgroundUpdate calls**: Include field in ALL sessionCoupler.backgroundUpdate calls

### Current Persisted Fields
- `modules`, `partnerType`, `projectScale`, `estimationStep`
- `projectSummaryContent`, `aiInsight`, `referencedFiles`
- `projectOverview` (project title, business goals, core values, tech stack)
- `summary` (projectScope, keyPoints, risks, recommendations)
- `workScope` (기획/디자인/개발 범위 선택)
- `requiredScope` (AI가 분석한 필수 범위 - 해제 불가 항목 표시)

### Critical Rule
**Session data must NEVER leak between sessions.** When switching sessions, ALL data must be restored from the target session's storage. The auto-save effect must include ALL fields to prevent overwriting with null/undefined values.

## Session Isolation Rules (절대 위반 금지)

### Golden Rule
**"A Chat Interface and its corresponding Dashboard are a SINGLE, INDEPENDENT ATOMIC UNIT."**
- Unit A (Chat A + Dashboard A) MUST be completely invisible to Unit B (Chat B + Dashboard B)
- They share NOTHING in terms of transient state (loading indicators, temporary data, progress bars)

### Implementation Rules

1. **전역 useState 금지**
   - ❌ `const [isLoading, setIsLoading] = useState(false)` - 전역 로딩 상태 금지
   - ✅ `const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)` - 세션 ID로 키잉

2. **모든 Transient State는 sessionId로 키잉**
   - 로딩 상태, 에러 상태, 임시 데이터 등 모든 일시적 상태는 세션 ID와 연결
   - 현재 세션과 일치할 때만 UI에 표시

3. **상태 업데이트 시 세션 검증 필수**
   ```typescript
   if (ownerSessionId !== activeSessionIdRef.current) {
     console.warn('BLOCKED: Session mismatch');
     return; // 차단
   }
   ```

4. **세션 전환 시 완전 복원**
   - 모든 transient state 포함하여 atomic unit에 저장
   - 세션 전환 시 해당 세션의 모든 상태 복원

### Persisted Fields (세션별 저장 필수)
- `modules`, `partnerType`, `projectScale`, `estimationStep`
- `projectSummaryContent`, `aiInsight`, `aiInsightLoading`, `aiInsightError`
- `referencedFiles`, `projectOverview`, `summary`
- `rfpContent` (공고 생성 결과)