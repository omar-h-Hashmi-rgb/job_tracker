# 🔍 MERN AI Job Tracker - Final QA Checklist

This checklist provides a comprehensive manual testing script to ensure all features are production-ready.

## 1. Authentication & Security
- [ ] **Registration**: Create a new account. Verify glassmorphism UI.
- [ ] **Login**: Sign in with new credentials. Verify "Welcome back" toast.
- [ ] **Persistence**: Refresh the page while logged in. Verify you stay on Dashboard.
- [ ] **Unauthorized Access**: Visit `/` while logged out (or delete JWT from LocalStorage). Verify automatic redirect to `/login`.
- [ ] **Logout**: Click "Sign Out". Verify removal of token and redirect.

## 2. Dashboard & Kanban Board
- [ ] **Empty State**: Verify board looks clean with no applications.
- [ ] **Stats Cards**: Verify "Total", "Pending", "Interviews", and "Success Rate" update correctly when adding apps.
- [ ] **Drag & Drop**: Move an application between columns (e.g., Applied -> Interview). Verify status updates in UI and database.
- [ ] **Search**: Type a company name in the search bar. Verify real-time filtering.
- [ ] **Dark Mode**: Toggle theme. Verify glassmorphism colors, text visibility, and background gradients in both modes.

## 3. AI Application Creation (Modal)
- [ ] **Open Modal**: Click "Add New Application". Verify it opens smoothly.
- [ ] **Close Modal**: Click the "X" button and the backdrop. Verify it closes.
- [ ] **AI Extraction**: Paste a Job Description (JD) text. Click "Parse with Groq AI (Llama 3.3)". 
    - Verify Company and Role are auto-filled.
    - Verify "Notes" contains extracted skills/location.
- [ ] **AI Bullet Streaming**: Verify "AI Suggested Resume Bullets" appear one-by-one with a typing animation using Groq's high-speed streaming.
- [ ] **Copy to Clipboard**: Click the copy icon next to an AI bullet. Verify "Copied!" feedback.
- [ ] **Manual Entry**: Edit parsed fields manually. Verify fields are interactive.
- [ ] **Form Submission**: Click "Save Application". Verify modal closes and Kanban board refreshes immediately.

## 4. Advanced Features & Export
- [ ] **CSV Export**: Click "Export". Verify a `.csv` file is downloaded with correct headers and data.
- [ ] **Responsive Design**: Resize browser to mobile/tablet width. Verify navigation, stats, and Kanban columns stack properly.

---

## Technical Audit Notes (For Developers)
- **TypeScript**: `strict: true` is enabled in both backend and frontend.
- **Security**: No hardcoded API keys found. Groq key and JWT secret are managed via `.env`.
- **API**: Axios interceptor handles `401 Unauthorized` without infinite loops.
- **Architecture**: AI logic is isolated in `services/groq.service.ts` using the faster Llama-3.3-70b model.
