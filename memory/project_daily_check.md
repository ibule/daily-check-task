---
name: daily-check-task project context
description: 每日打卡生成器 - React app for generating printable daily task check-in sheets for children
type: project
---

A Vite + React 18 + TypeScript app for parents to generate printable daily task check-in sheets.

**Why:** Parent wanted a tool to generate customizable, printable check-in tables for children's daily tasks with AI-generated encouragement messages.

**How to apply:** When working on this project, understand it's a single-page app with a config panel (left) and live preview (right). The printed output needs to match A4 paper dimensions.

## Key Architecture
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **State:** Zustand with localStorage persistence (`daily-check-config` key)
- **Deployment:** Vercel (frontend + Vercel Functions for AI proxy)
- **AI:** DeepSeek API via backend proxy (rate-limited: 5/IP/day, 50/day global)

## File Structure
- `src/types.ts` — all TypeScript interfaces (PrintConfig, DayCard, Task, TaskConfig, etc.)
- `src/utils.ts` — pure functions (buildDayCards, enumerateDates, etc.)
- `src/store.ts` — Zustand store with all actions
- `src/wordExport.ts` — Word (.docx) export using docx npm package + file-saver
- `src/components/` — ConfigPanel, PreviewArea, DayCardView, AIPanel, SettingsModal, CopyModal, TaskList, SortableTask
- `api/generate-encouragement.ts` — Vercel Function with Vercel KV rate limiting

## MVP Status (as of 2026-03-27)
All MVP features implemented:
- Name + date range config with quick shortcuts (本周/本月/30天/90天/半年/一年)
- Unified task mode + per-weekday task mode (7 tabs with cross-day copy)
- Drag-to-reorder tasks via @dnd-kit/sortable
- AI encouragement generation (dual path: platform proxy / user's own DeepSeek key)
- 1/2/3 column layout + portrait/landscape orientation
- Real-time preview (truncated to 30 days if >30, with expand button)
- Browser print with @media print CSS
- Word export with progress bar (docx npm package)
- localStorage persistence
- Settings modal for user's DeepSeek API key

## Pending (V1.1+)
- Task templates (学生工作日/学生周末/运动版) — UI exists but template picker is in TaskList component
- Per-weekday encouragement configuration
- PDF export
