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
- **Backend**: Express.js
- **AI Service**: Google Gemini AI (@google/genai)
- **UI Icons**: Lucide React

### Project Structure
```
├── components/              # React components
│   ├── LandingView.tsx      # Main landing page (ChatGPT/Gemini style)
│   ├── ChatInterface.tsx    # Chat interface with AI
│   ├── Dashboard.tsx        # Main dashboard with tabs
│   ├── EstimationTab.tsx    # Estimation/budget tab
│   ├── CollapsibleSidebar.tsx # Left sidebar (외주/상주/나머지)
│   ├── SettingsModal.tsx    # Settings menu modal
│   ├── AiSettingsModal.tsx  # AI model settings modal
│   └── ... (other UI components)
├── constants/
│   └── aiConfig.ts          # AI model configuration (centralized)
├── services/
│   ├── geminiService.ts     # Frontend Gemini service (legacy)
│   └── apiService.ts        # Frontend API service
├── server/
│   ├── index.ts             # Express server entry
│   └── services/
│       ├── geminiService.ts # Backend Gemini PART 1 (분석)
│       └── rfpService.ts    # Backend Gemini PART 2 (공고문)
├── App.tsx                  # Main application component
├── constants.ts             # Application constants
├── types.ts                 # TypeScript type definitions
├── index.tsx                # Application entry point
└── vite.config.ts           # Vite configuration
```

### User Flow
1. **Landing Page** - User enters project requirements or attaches files
2. **Analysis** - Gemini AI analyzes and generates PART 1 (기획/견적/WBS)
3. **Detail View** - User reviews and adjusts modules/features
4. **RFP Generation** - Gemini AI generates PART 2 (입찰 공고문)

### Key Features
- ChatGPT/Gemini style landing page with file attachment
- Interactive chat interface with Gemini AI consultant
- Project module and feature selection
- Budget optimization suggestions
- Partner type presets (TYPE A/AI_NATIVE, TYPE B/STUDIO, TYPE C/AGENCY)
- **3 Top-level Tabs**: 견적/예산, 수행계획, 공고작성
- Dark mode support
- Resizable sidebar interface
- SSE streaming for AI responses

## Configuration

### Environment Variables
The application requires a Gemini API key to function:
- `GEMINI_API_KEY`: Your Google Gemini API key (stored as Replit secret)

### Ports
- **Frontend (Vite)**: 5000 (required for Replit webview)
- **Backend (Express)**: 3001

### API Endpoints
- `POST /api/analyze` - Analyze project (PART 1 - SSE streaming)
- `POST /api/rfp` - Generate RFP (PART 2 - SSE streaming)
- `POST /api/upload` - File upload
- `GET /api/health` - Health check

## Development

### Running Locally
1. Ensure dependencies are installed: `npm install`
2. Set your Gemini API key as a Replit secret
3. Run development server: `npm run dev`
4. Access at: http://localhost:5000

### Workflow
The "Start application" workflow runs `npm run dev` which uses concurrently to run both:
- Frontend: `npm run client` (Vite on port 5000)
- Backend: `npm run server` (Express on port 3001)

## AI Integration

### Gemini AI Service
The app uses Gemini 2.5 Flash model for:
- PART 1: Project planning, estimation, WBS generation
- PART 2: RFP (입찰 공고문) generation

### Prompt Structure
- **PART 1** (기획/견적/WBS):
  - STEP 1: 프로젝트 상세 기획 (모듈 구조)
  - STEP 2: 유형별 비교 견적 (TYPE A/B/C)
  - STEP 3: 실행 계획 (WBS)
  
- **PART 2** (입찰 공고문):
  - Clean text format (no markdown)
  - Structured sections (프로젝트 개요, 과업 범위, 기술 스택 등)

## Recent Changes (December 4, 2024)
- **AI Model Settings Management**:
  - Created centralized configuration in `constants/aiConfig.ts`
  - Available models: Gemini 2.5 Flash, Gemini 3 Pro Preview, Claude 4.5 Opus
  - 5 AI functions mapped: analyzeProject, generateRFP, classifyUserIntent, streamChatResponse, generateInsight
  - New components: AiSettingsModal.tsx for per-function model selection
  - SettingsModal.tsx updated as gateway to AI settings
  - Settings gear icon in header replaces refresh button
  - Dark mode toggle remains in header for quick access
- **Information Architecture Redesign**: Hierarchy Flattening
  - Removed sub-tabs from '견적/예산' tab
  - Created 3 top-level tabs: [견적/예산], [수행계획], [공고작성]
  - Data binding: 상세견적 → 견적/예산 tab, 예상일정 → 수행계획 tab
- New components:
  - ExecutionPlanTab.tsx - WBS/Schedule display
  - RFPTab.tsx - RFP generation interface
- Required module protection: All sub-features of required modules are now locked
- **FAB State Machine Implementation**:
  - Phase 1 [견적/예산]: '견적 산출하기' → 계산 후 '수정하기/다음 단계' 분할 모드
  - Phase 2 [수행계획]: '이전 단계/다음 단계' 네비게이션
  - Phase 3 [공고작성]: '이전 단계' + '공고작성완료' (disabled)
  - 다운로드 버튼: 모든 Phase에서 항상 좌측 고정 표시
- **Multi-Action Container**: Flexbox 레이아웃 (gap-3)

## Previous Changes (December 3, 2024)
- Added Conditional Workflow for chat commands
  - Intent Classification: command vs general in AI response
  - Confirmation UI: "추가 시 재산정이 필요합니다. 진행하시겠습니까?"
  - Pending action state with approve/cancel buttons
  - Input blocked during pending action
- Added scheduleEngine.ts for WBS calculation
  - Partner-specific configs (teamSize, productivity, buffer)
  - Duration formula: MM ÷ (teamSize × productivity) × (1 + buffer)
  - SDLC phase distribution (20/15/50/15)

## Previous Changes (November 26, 2024)
- Added LandingView component (ChatGPT/Gemini style main page)
- Implemented Express backend server with SSE streaming
- Created API routes for /api/analyze, /api/rfp, /api/upload
- Added prompt builders for PART 1 and PART 2
- Implemented view transition (landing → detail)
- Fixed security: removed API key from frontend bundle
- Fixed SSE error handling with proper try/catch/finally

## Notes
- The app uses Tailwind CSS via CDN (warning in console is expected for dev)
- All components are in Korean language
- Budget calculations are in Korean Won (KRW)
- Gemini API key is required and stored as a Replit secret
- API key is only accessed server-side for security
- The frontend proxies /api requests to the backend server
