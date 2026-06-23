import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Lazy init Gemini client to avoid startup crash if API key is not present
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('⚠️ GEMINI_API_KEY is not defined or is a placeholder. AI operations will fail.');
    }
    aiClient = new GoogleGenAI({ 
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust fallback and retry wrapper for generateContent to handle temporary high-demand (503) or rate limits (429)
async function generateContentWithRetryAndFallback(options: {
  model?: string;
  contents: any;
  config?: any;
}) {
  const primaryModel = options.model || 'gemini-3.5-flash';
  const fallbackModels = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];
  const modelsToTry = [primaryModel];
  for (const fallback of fallbackModels) {
    if (!modelsToTry.includes(fallback)) {
      modelsToTry.push(fallback);
    }
  }

  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ai = getGeminiClient();
        console.log(`[Gemini] Attempting ${modelName} (attempt ${attempt}/3)...`);
        const result = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: options.config,
        });
        return result;
      } catch (error: any) {
        lastError = error;
        const status = error.status || (error.error && error.error.code) || 0;
        const msg = error.message || '';
        console.warn(`[Gemini] Attempt ${attempt} with model ${modelName} failed. Status: ${status}. Message: ${msg}`);

        const errorMsg = msg.toLowerCase();
        const isQuotaExceeded =
          status === 429 ||
          status === 'RESOURCE_EXHAUSTED' ||
          errorMsg.includes('quota') ||
          errorMsg.includes('limit') ||
          errorMsg.includes('exhausted');

        // If daily or rate limit quota is exceeded, do not waste retrying this model.
        // Immediately break from attempts and try the next model in the fallback list!
        if (isQuotaExceeded) {
          console.warn(`[Gemini] Quota exceeded on ${modelName}. Instantly falling back to next available model (if any).`);
          break;
        }

        const isTransient =
          status === 503 ||
          status === 'UNAVAILABLE' ||
          status >= 500 ||
          msg.includes('temp') ||
          msg.includes('Unavailable') ||
          msg.includes('high demand') ||
          msg.includes('overloaded');

        if (isTransient && attempt < 3) {
          const delay = attempt * 1200;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        } else {
          break;
        }
      }
    }
  }
  throw lastError;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 0. Extract text from uploaded files (PDF, txt, etc.)
app.post('/api/extract-text', async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    let extractedText = '';

    if (fileName.toLowerCase().endsWith('.pdf')) {
      try {
        let pdfParser: any = null;
        try {
          const pdfModule = (await import('pdf-parse')) as any;
          pdfParser = pdfModule.default || pdfModule;
          if (typeof pdfParser !== 'function' && pdfModule.default) {
            pdfParser = pdfModule.default;
          }
        } catch (loaderErr) {
          console.warn('pdf-parse native binary or package load failed dynamically, falling back to Gemini text extraction:', loaderErr);
        }

        if (pdfParser && typeof pdfParser === 'function') {
          const data = await pdfParser(buffer);
          extractedText = data.text || '';
        } else {
          console.warn('pdfParser function is not resolved, falling back to Gemini');
        }
      } catch (parseErr) {
        console.warn('pdf-parse direct extraction failed, falling back to Gemini-3.5-flash for PDF text extraction', parseErr);
      }

      // If text from pdf-parse is extremely sparse or empty, also use Gemini as a high-fidelity extractor
      if (!extractedText || extractedText.trim().length < 50) {
        try {
          const response = await generateContentWithRetryAndFallback({
            model: 'gemini-3.5-flash',
            contents: [
              {
                inlineData: {
                  data: fileBase64,
                  mimeType: 'application/pdf'
                }
              },
              "Objective: Extract all readable textbook or note contents from this document. Clean up page numbers, duplicate headers, and footers. Provide only the clean, comprehensive academic text, retaining detailed terminology and concepts."
            ]
          });
          if (response.text) {
            extractedText = response.text;
          }
        } catch (gemPdfErr) {
          console.error('Gemini PDF extraction also failed:', gemPdfErr);
          if (!extractedText) {
            extractedText = buffer.toString('utf-8');
          }
        }
      }
    } else if (fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.rtf')) {
      extractedText = buffer.toString('utf-8');
    } else {
      // Fallback: Use Gemini 3.5-flash for complex document text extraction (docx / pptx / xlsx / images etc.)
      try {
        let mimeType = 'application/pdf'; // defaults
        if (fileName.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (fileName.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

        const response = await generateContentWithRetryAndFallback({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType
              }
            },
            "Objective: Extract all readable textbook or note contents from this file. Clean up page numbers and footers. Provide only the comprehensive, raw academic text."
          ]
        });
        extractedText = response.text || '';
      } catch (gemErr) {
        console.error('Gemini extraction fallback error, converting directly as string:', gemErr);
        extractedText = buffer.toString('utf-8');
      }
    }

    // Clean up text
    extractedText = extractedText.replace(/\r\n/g, '\n').trim();

    // Limit length to avoid bloating token sizes if it is huge (e.g. limit to 250k chars structure)
    if (extractedText.length > 250000) {
      extractedText = extractedText.substring(0, 250000) + "\n\n[...Document truncated due to length limits...]";
    }

    if (!extractedText) {
      extractedText = `The document "${fileName}" appears to contain no readable text.`;
    }

    res.json({ text: extractedText });
  } catch (error: any) {
    console.error('Error in /api/extract-text:', error);
    res.status(500).json({ error: error.message || 'Failed to extract text from file' });
  }
});

// 1. Process document & extract structured data
app.post('/api/gemini/process', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text content provided' });
    }

    const prompt = `
      You are an expert Academic Learning Assistant. Analyze the study material text and extract metadata.
      Provide the metadata in English.
      
      CRITICAL SAFETY & ANTI-HALLUCINATION RULE:
      - The provided text is your ONLY source of truth.
      - Do NOT invent or assume any factual data, concepts, definitions, formulas, dates, or examples.
      - NEVER use or fallback to placeholder academic concepts (such as generic Calculus formulas, Photoresynthesis, E = mc², Quantum kinetics, etc.) unless they are explicitly mentioned in the text.
      - If there are no formulas, dates, or examples in the provided text, leave those arrays completely empty. Do not hallucinate or manufacture them.
      
      Extract:
      1. detectedLanguage: Should always be "English"
      2. subject: General subject of this text (e.g., Computer Science, Biochem, Government Scheme)
      3. chapter: Suggested chapter/topic name
      4. headings: Main headings found in the text (array of strings)
      5. importantConcepts: Core concepts explicitly discussed (array of strings)
      6. definitions: Key terms and their textbook descriptions from the text. Return as list of objects with "term" and "definition" fields.
      7. formulas: Crucial formulas found in the text (array of strings). Leave empty if none are explicitly in the text.
      8. dates: Highlighted calendar, draft, policy, or landmark dates mentioned (array of strings)
      9. examples: Scenario walkthroughs, illustrations or samples mentioned in the text (array of strings)
      10. questions: Useful questions directly testing content in this text (array of strings)
      11. keyPoints: Summary bullet points highlighting the most vital details (array of strings)

      Return strictly a JSON object with this shape:
      {
        "detectedLanguage": "string",
        "subject": "string",
        "chapter": "string",
        "headings": ["string"],
        "importantConcepts": ["string"],
        "definitions": [{"term": "string", "definition": "string"}],
        "formulas": ["string"],
        "dates": ["string"],
        "examples": ["string"],
        "questions": ["string"],
        "keyPoints": ["string"]
      }

      Do not wrap the response in markdown blocks like \`\`\`json. Return pure JSON.
      Text to analyze:
      ${text.substring(0, 120000)}
    `;

    const result = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedJson = JSON.parse(result.text || '{}');
    res.json(parsedJson);
  } catch (error: any) {
    console.error('Error in /api/gemini/process:', error);
    res.status(500).json({ error: error.message || 'Failed to process document metadata' });
  }
});

// 2. Generate customized summary
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { text, length = 'medium' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text content provided' });
    }

    // Determine lines count and adaptive size guidelines
    const linesCount = text.split('\n').filter((l: string) => l.trim().length > 0).length;
    let adaptiveSummaryGuideline = '';

    if (linesCount <= 50) {
      adaptiveSummaryGuideline = `The source text is short (${linesCount} lines). Create a focused summary of approximately 8 to 15 lines.`;
    } else if (linesCount <= 100) {
      adaptiveSummaryGuideline = `The source text has ${linesCount} lines. Create a robust summary of approximately 15 to 25 lines.`;
    } else if (linesCount <= 200) {
      adaptiveSummaryGuideline = `The source text has ${linesCount} lines. Create a deep academic summary of approximately 25 to 40 lines.`;
    } else if (linesCount <= 400) {
      adaptiveSummaryGuideline = `The source text is long (${linesCount} lines). Create an extensive review summary of approximately 40 to 60 lines.`;
    } else if (linesCount <= 800) {
      adaptiveSummaryGuideline = `The source text is very long (${linesCount} lines). Create professional study notes of approximately 60 to 90 lines.`;
    } else {
      const estimatedTarget = Math.round(linesCount * 0.20);
      adaptiveSummaryGuideline = `The source text is immense (${linesCount} lines). Create high-quality, comprehensive study notes representing approximately 15% to 25% of the original scale (approximately ${estimatedTarget} lines total) so that no critical context, chapter headers, policies, or facts are discarded.`;
    }

    const lengthGuide: Record<string, string> = {
      'short': 'A compact 1-2 paragraph briefing highlighting only absolute essential points.',
      'medium': `A balanced review covering major sections, dynamically sizing up to ${adaptiveSummaryGuideline}`,
      'detailed': `A highly extensive professional study note breakdown, dynamically sizing up to ${adaptiveSummaryGuideline}`,
      'bullet': 'A comprehensive direct bullet-point study list representing every single section with clear sub-bullets.',
      'one-line': 'A single high-impact axiom capturing the entire text core.',
      'academic': 'A formal textbook-style academic abstract utilizing formal analytical and scholarly terminology.',
      'exam': 'An intense exam prep study sheet optimized for last-minute cramming, emphasizing key rules, dates, and core equations.'
    };

    const targetLengthInstruction = lengthGuide[length] || lengthGuide.medium;

    const prompt = `
      You are an elite academic learning assistant. Build pristine, comprehensive study notes strictly from the provided text.
      
      Target length and layout instruction:
      ${targetLengthInstruction}

      Provide the entire summary written in English.
      
      CRITICAL SAFETY & GLOBAL HALLUCINATION PREVENTION RULE:
      - The provided text is your ONLY source of truth.
      - You must NEVER generate default study material, generic textbook content, sample or placeholder concepts (such as generic photosynthesis, organic chemistry, E = mc², quantum mechanics, etc.), or unrelated definitions unless they are explicitly written in the provided text.
      - If the context contains details of a specific document (e.g., the Samagra Shiksha Scheme), discuss absolutely ONLY that document. Do not invent details, statistics, dates, or formulas.
      - If required information is not present in the text, respond with: "This information is not available in the uploaded document." Never invent info.

      STRUCTURED LAYOUT INSTRUCTIONS:
      Incorporate all of these components in proportion to their presence in the text:
      1. Introduction/Overview
      2. Main Objectives
      3. Key Concepts (Bolded with markdown subheadings)
      4. Key Facts (Bullet points)
      5. Important Definitions
      6. Significant Findings or Data
      7. Important Dates (formatted beautifully)
      8. Important Organizations
      9. Policies, Schemes, or governmental directives mentioned
      10. Key Conclusions
      11. Strategic Recommendations
      
      Do NOT discard major sections or headings of the source document. Use clean markdown headings (###, ####), bullet lists (-), numbered lists (1.), tables where useful, and clear paragraph breaks for optimal legibility.

      Smart Highlight Tags:
      You must embed the following 7 color-coded highlight tags inline to mark key components of the summary:
      - Yellow Highlights (Important concepts): [YELLOW_HL: concept keyword]
      - Light Blue Highlights (Definitions): [BLUE_HL: term - defining clause]
      - Light Green Highlights (Key points): [GREEN_HL: core statement or takeaway]
      - Orange Highlights (Warnings/Important notes/Precautions): [ORANGE_HL: vital caution, warning or notes]
      - Pink Highlights (Examples/Case studies): [PINK_HL: illustrative example or scenario]
      - Purple Highlights (Formulas/Equations/Statistics): [PURPLE_HL: mathematical formula or stats figure]
      - Grey Highlights (References/Additional information): [GREY_HL: citation, section number, or reference]

      Ensure every single inline study highlight tag corresponds exactly to one of these 7 tags and is accurately closed.

      CRITICAL COMPILING CONSTRAINT:
      At the very end of your response, output the marker "[[[HIGHLIGHTS_DATA]]]" on a new line, and immediately follow it with a clean JSON collection of all highlighted tokens you used above, strictly in the exact format:
      {"highlights": [{"text": "extracted text", "category": "yellow"|"blue"|"green"|"orange"|"pink"|"purple"|"grey", "label": "Label Type"}]}
      
      Do NOT add any explanation lines, polite greetings, concluding chat commentary, or remarks before, during, or after this block. Do NOT surround the JSON with markdown formatting other than raw JSON content. The very final character of your response MUST BE the closing JSON bracket: }
      
      Text to summarize:
      ${text.substring(0, 120000)}
    `;

    const result = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = result.text || '';
    
    // Attempt to extract the JSON highlights collection if returned
    let finalSummary = responseText;
    let highlights: any[] = [];
    
    // Find [[[HIGHLIGHTS_DATA]]] case-insensitively, optionally wrapped in markdown (e.g., ### [[[HIGHLIGHTS_DATA]]])
    const matchMarker = responseText.match(/#*\s*\*?\[\[\[HIGHLIGHTS_DATA\]\]\]\*?/i);
    let splitIndex = -1;
    let markerLength = 0;
    
    if (matchMarker && matchMarker.index !== undefined) {
      splitIndex = matchMarker.index;
      markerLength = matchMarker[0].length;
    }

    if (splitIndex !== -1) {
      finalSummary = responseText.substring(0, splitIndex).trim();
      const highlightJsonString = responseText.substring(splitIndex + markerLength).trim();
      try {
        const cleanedJson = highlightJsonString.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanedJson);
        highlights = data.highlights || [];
      } catch (e) {
        console.warn('Failed parsing highlights JSON, falling back to manual search tags', e);
      }
    } else {
      // Look for a JSON representation of highlights directly if marker was omitted
      const jsonStart = responseText.lastIndexOf('{"highlights"');
      if (jsonStart !== -1 && jsonStart > responseText.length * 0.4) {
        finalSummary = responseText.substring(0, jsonStart).trim();
        const highlightJsonString = responseText.substring(jsonStart).trim();
        try {
          const cleanedJson = highlightJsonString.replace(/```json|```/g, '').trim();
          const data = JSON.parse(cleanedJson);
          highlights = data.highlights || [];
        } catch (e) {
          console.warn('Failed fallback parsing highlights JSON, falling back to regex', e);
        }
      }
    }

    // Scrub any potential trailing markdown codeblocks containing JSON highlights to keep view pristine
    finalSummary = finalSummary
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, (match) => {
        if (match.includes('highlights') || match.includes('HIGHLIGHTS_DATA')) {
          return '';
        }
        return match;
      })
      .trim();

    // Clean up any other trailing text lines mentioning instructions
    const lines = finalSummary.split('\n');
    let chopIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineLower = lines[i].toLowerCase();
      if (lineLower.includes('[highlights_data') || lineLower.includes('[[[') || lineLower.includes('{"highlights"')) {
        chopIndex = i;
      }
    }
    if (chopIndex !== -1) {
      finalSummary = lines.slice(0, chopIndex).join('\n').trim();
    }

    // fallback extraction from text regex matches if JSON parsing failed
    if (highlights.length === 0) {
      const redRegex = /\[RED_HL:\s*([^\]]+)\]/g;
      const blueRegex = /\[BLUE_HL:\s*([^\]]+)\]/g;
      const greenRegex = /\[GREEN_HL:\s*([^\]]+)\]/g;
      const yellowRegex = /\[YELLOW_HL:\s*([^\]]+)\]/g;
      
      let match;
      while ((match = redRegex.exec(responseText)) !== null) {
        highlights.push({ text: match[1], category: 'red', label: 'Exam Point' });
      }
      while ((match = blueRegex.exec(responseText)) !== null) {
        highlights.push({ text: match[1], category: 'blue', label: 'Definition' });
      }
      while ((match = greenRegex.exec(responseText)) !== null) {
        highlights.push({ text: match[1], category: 'green', label: 'Example' });
      }
      while ((match = yellowRegex.exec(responseText)) !== null) {
        highlights.push({ text: match[1], category: 'yellow', label: 'Formula/Date' });
      }
    }

    res.json({
      summaryText: finalSummary,
      highlights: highlights
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({ error: error.message || 'Failed code summarization' });
  }
});

// 3. AI Mentor Chatbot
app.post('/api/gemini/mentor', async (req, res) => {
  try {
    const { messages, contextText = '' } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages history array is required' });
    }

    // Construct the context-enriched prompt
    const systemPrompt = `
      You are StudySpark AI Mentor, an empathetic, brilliant, and highly supportive academic coach.
      
      Your student context:
      ${contextText ? `We are currently studying this material:\n"""\n${contextText.substring(0, 120000)}\n"""` : 'No study document is open right now. Guide the student on general learning habits or help them plan.'}
      
      CRITICAL SAFETY & GLOBAL HALLUCINATION PREVENTION RULE:
      - The provided studying material text is your ONLY source of truth.
      - You must NEVER generate generic feedback or default textbook content (such as general cellular photosynthesis, unrelated chemistry, or generic physics formulas) if a study document is active, unless they are explicitly present in the provided study material.
      - If the user asks about chapters, concepts, or details (e.g. "Explain Chapter 2", "What is defined in section 3") and that detail is not explicitly written in the provided study material text, response EXACTLY with: "This information is not available in the uploaded document."
      - NEVER use pre-trained academic datasets, fallback facts, or unrelated external knowledge to answer.
      
      Instructions:
      - Answer questions directly and strictly using concepts from the active studying material.
      - Solve academic doubts step-by-step.
      - Maintain standard markdown headers and layout.
      - Remain highly encouraging, engaging, and motivating. Use a friendly conversational tone.
    `;

    // Strip greetings, format and alternate messages for GenAI compatibility
    let studentMessages = messages;
    const firstUserIndex = messages.findIndex(msg => msg.sender === 'user');
    if (firstUserIndex !== -1) {
      studentMessages = messages.slice(firstUserIndex);
    } else {
      return res.json({ text: "Hello! I am your StudySpark AI Mentor. If you select an active document in your workspace, I can help you demystify its theories, explain formulas step-by-step, give you memory tricks, or design revision guides. What are we mastering today?" });
    }

    const formattedHistory = studentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Ensure strict alternation starting with user and merging same-role adjacent messages
    const finalHistory: any[] = [];
    for (const msg of formattedHistory) {
      if (finalHistory.length === 0) {
        if (msg.role === 'user') {
          finalHistory.push(JSON.parse(JSON.stringify(msg)));
        }
      } else {
        const last = finalHistory[finalHistory.length - 1];
        if (last.role === msg.role) {
          last.parts[0].text += "\n" + msg.parts[0].text;
        } else {
          finalHistory.push(JSON.parse(JSON.stringify(msg)));
        }
      }
    }

    const result = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: finalHistory,
      config: {
        systemInstruction: systemPrompt
      }
    });

    res.json({ text: result.text || 'I am listening! Tell me more about your study goals.' });
  } catch (error: any) {
    console.error('Error in /api/gemini/mentor:', error);
    res.status(500).json({ error: error.message || 'Mentor is temporarily resting. Try again soon.' });
  }
});

// 4. Quiz Generator
app.post('/api/gemini/quiz', async (req, res) => {
  try {
    const { text, difficulty = 'medium', count = 5 } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text content provided' });
    }

    const prompt = `
      You are an academic test maker. Generate a challenging study quiz strictly and exclusively from the following Context in English.
      Make the test exactly ${count} questions.
      Establish a balanced variety of question types appropriate for matching the difficulty level "${difficulty}":
      Types to choose from: 'mcq' (Multiple Choice), 'true-false' (True or False), 'fill-blank' (Fill in the blanks), 'short-answer' (Short Answer response), 'long-answer' (Long Explanation topic).

      CRITICAL SAFETY & GLOBAL HALLUCINATION PREVENTION RULE:
      - The provided Context below is your ONLY source of truth.
      - Every question and correct answer must be fully traceable to, and supported by, the provided Context.
      - NEVER ask any question or introduce any key terms, formulas, or history that are not explicitly present in the provided Context.
      - If the Context does not have enough detailed content to reasonably generate the requested amount of questions (${count}), generate fewer questions but keep them 100% faithful to the Context. Do NOT make up any questions or answers using external pre-trained data or general knowledge.
      - Absolutely NEVER use default academic baseline concepts (such as photosynthesis, Cell division, Calculus, generic physics equations like E = mc², etc.) unless explicitly written in the Context.

      Return strictly a JSON list containing objects with the exact schema below:
      [
        {
          "id": "q1",
          "type": "mcq" | "true-false" | "fill-blank" | "short-answer" | "long-answer",
          "question": "string writing the test question here",
          "options": ["Option A", "Option B", "Option C", "Option D"], // ONLY for type "mcq". Make exactly 4 options. Include the correct answer in the options.
          "correctAnswer": "string showing correct answer perfectly",
          "explanation": "pedagogical walkthrough of why this answer is correct"
        }
      ]

      Ensure ALL questions map to actual context below, with difficulty strictly matching requested level.
      Do not enclose response in markdown tags or wrap with markdown codeblocks. Return parsable pure JSON array.

      Context:
      ${text.substring(0, 120000)}
    `;

    const result = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const questions = JSON.parse(result.text || '[]');
    res.json({ questions });
  } catch (error: any) {
    console.error('Error in /api/gemini/quiz:', error);
    res.status(500).json({ error: error.message || 'Failed quiz generation' });
  }
});

// 5. Flashcard Generator
app.post('/api/gemini/flashcards', async (req, res) => {
  try {
    const { text, count = 10 } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text content provided' });
    }

    const prompt = `
      You are an expert tutor. Create active-recall flashcards from the text in English.
      Provide exactly ${count} flashcards. Each card must test a fundamental definition, formula, core concept, or technical application.
      
      CRITICAL SAFETY & GLOBAL HALLUCINATION PREVENTION RULE:
      - The provided text below is your ONLY source of truth.
      - Every flashcard question and answer must be fully traceable to, and supported by, the provided text. Do NOT make up any questions or answers using external pre-trained data or general knowledge.
      - If the text does not have enough distinct concepts to generate ${count} flashcards, generate fewer cards that are 100% faithful to the text.
      - Absolutely NEVER use default academic baseline concepts (such as photosynthesis, Cell division, Calculus, generic physics equations like E = mc², etc.) unless they are explicitly written in the provided text.

      Return strictly a JSON array with this exact shape:
      [
        {
          "id": "flash_1",
          "question": "The question or concept name prompt",
          "answer": "The thorough bullet proof definition, explanation, or recall text"
        }
      ]

      Do not surround and format with markdown arrays or codeblocks. Ensure pure JSON is returned.

      Text to analyze:
      ${text.substring(0, 120000)}
    `;

    const result = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const flashcards = JSON.parse(result.text || '[]');
    res.json({ flashcards });
  } catch (error: any) {
    console.error('Error in /api/gemini/flashcards:', error);
    res.status(500).json({ error: error.message || 'Failed cards generation' });
  }
});

// 6. Study Planner
app.post('/api/gemini/planner', async (req, res) => {
  try {
    const { examDate, hoursAvailable, subjects, priority = 'medium', contextText = '', documentName = '', documentLength = 0 } = req.body;
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Subjects list array is required' });
    }

    const prompt = `
      You are an expert learning scheduler. Design a personalized study schedule leading to the exam on: "${examDate}" in English.
      Details of scheduling parameters:
      - Subject topics/Chapters/Document Sections list: ${subjects.join(', ')}
      - Daily hours available to study: ${hoursAvailable} hours
      - Focus intensity level: ${priority} priority
      - Target language: English
      ${documentName ? `- Document Context Name: "${documentName}"` : ''}
      ${documentLength ? `- Document Context Length: ${documentLength} characters (approximately ${Math.round(documentLength / 3500)} pages)` : ''}

      CRITICAL SAFETY & GLOBAL HALLUCINATION PREVENTION RULE:
      - Your daily schedule, weekly schedule, and study tasks MUST be based EXCLUSIVELY and SOLELY on the extracted headings, topics, or content details from the active document (represented by subjects: ${subjects.join(', ')}).
      - You must NEVER generate generic default topics, baseline placeholder schedules, or unrelated subjects (like generic Calculus, Photosynthesis, computer networks, etc.) unless they are explicitly present in the active document.
      - Incorporate structured learning sessions, practice sessions (quizzes, flashcard drills), revision/spaced-repetition slots, and short break reminders to keep studying effective.

      Construct:
      1. dailySchedule: list of 4 key action items (hours/time slot, specific task description, active topic item/section, priority, and completed=false). Ensure tasks include break reminders, revision sessions, practice quiz sessions, and flashcard recall routines.
      2. weeklySchedule: list of 5 days (e.g. Day 1, Day 2, etc.) each with a list of tasks strictly mapped to these document topics.
      3. revisionPlan: list of 3-4 steps describing active review routines, mock exams, or space repetition guides.

      Output strictly a JSON structure with this structure:
      {
        "id": "plan_1",
        "examDate": "string",
        "hoursAvailable": number,
        "subjects": ["string"],
        "priority": "string",
        "dailySchedule": [
          { "id": "s1", "time": "e.g. 09:00 - 11:30", "task": "Task string", "subject": "Subject name", "priority": "high"|"medium"|"low", "completed": false }
        ],
        "weeklySchedule": [
          { "id": "w1", "day": "Day 1", "tasks": ["Task summary A", "Task summary B"] }
        ],
        "revisionPlan": ["Revision step 1", "Revision step 2"]
      }

      Do not return markdown tags. Output pure JSON.
    `;

    const result = await generateContentWithRetryAndFallback({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const plan = JSON.parse(result.text || '{}');
    res.json(plan);
  } catch (error: any) {
    console.error('Error in /api/gemini/planner:', error);
    res.status(500).json({ error: error.message || 'Failed layout plan generation' });
  }
});

// -------------------------------------------------------------
// Dev & Production configuration for static files
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StudySpark AI server running on http://localhost:${PORT}`);
  });
}

startServer();
