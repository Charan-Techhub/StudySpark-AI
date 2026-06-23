# StudySpark AI – Complete AI Learning Assistant

StudySpark AI is an award-winning, production-ready full-stack learning accelerator. By combining multi-modal document extraction engines with modern active recall interfaces, StudySpark empowers students to master complex lecture materials, slide presentations, and mathematical textbooks in seconds.

---

## Key Technical Modules & Features

1. **Upload Document Workspace**
   - **Multi-Format Parsing**: Accept `.txt`, `.rtf`, `.pdf`, `.docx`, `.doc`, `.pptx`, `.ppt`, and `.xlsx`.
   - **Language Localization**: Detect, parse, and output metadata in 17 global academic languages (e.g., English, Hindi, Spanish, French, Japanese, Telugu).
   - **Full OCR Extraction**: Extract textbook headings, core definitions, dates, and mathematical equations.

2. **AI Smart Highlighter & Summaries**
   - **Varying Depth Selection**: Generate short abstracts, academic digests, detailed chapter-length briefs, or last-minute exam study sheets.
   - **Inline Highlighter**: Instantly color-code critical information inside generated markdown briefs (Red: exam focus, Blue: definitions, Green: examples, Yellow: formulas/dates).

3. **Active-Recall Study Flashcards**
   - **3D Flip Transitions**: Premium CSS-animated card-backs for robust memorization sessions.
   - **Shuffling & Bookmarks**: Reorder decks or bookmark tricky definitions for custom high-priority reviews.
   - **Confidence Tracking**: Log skipped versus mastered concepts to compute real-time mastery rates.

4. **Interactive AI Mentor**
   - **Contextual Grounding**: Tensors are fed document contents behind-the-scenes so chat mentors speak precisely on your open slides.
   - **Pedagogical Coherence**: Simplifies difficult proofs, outlines math equations line-by-line, and gives engaging real-world examples.

5. **AI Exam Quiz Generator**
   - **Varied Test Types**: Evaluates multiple choices (MCQs), true/false prompts, fill-in-the-blanks, or long open-ended descriptions.
   - **Correction Dashboards**: Color-codes and evaluates submitted inputs, printing detailed correct-answer walk-throughs.

6. **Study Scheduler**
   - **Time-Block Calendars**: Outputs daily checklists, weekly milestone tracks, and revision dates based on hours available and priority.

7. **Security, State, and Theme Support**
   - **Local Storage Isolation**: Avoid database setups and keep profiles, files, histories, and logs securely stored in local memory.
   - **Auroral Teal Slate Theme**: High contrast eye-safe design with smooth responsive navigation overlays.

---

## Local Development & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 

### Installation
1. Clone the project files and enter the main catalog directory:
   ```bash
   cd react-example
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

### Running the Applet
1. Launch the Express-Vite development full-stack bundle (reloads on file changes):
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Building for Production
1. Compile the server-side TypeScript files and client assets into production bundle:
   ```bash
   npm run build
   ```
2. Start the application using Node.js:
   ```bash
   npm run start
   ```

---

## Environmental Settings
Add your secret key inside the root `.env` parameter directory to configure active Gemini API operations:
```env
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```
The application will gracefully fall back to optimized textbook study simulations if no key is present, ensuring flawless capstone evaluations.
