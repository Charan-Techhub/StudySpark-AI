import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Copy, 
  Printer, 
  Download, 
  Languages, 
  Loader2, 
  Maximize2, 
  Check, 
  Info,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { UploadedFile, SummaryLength, AISummary } from '../types';

interface SummarizerViewProps {
  activeDocument: UploadedFile | null;
  uploadedFiles: UploadedFile[];
  onSelectDocument: (doc: UploadedFile) => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success') => void;
}

export default function SummarizerView({
  activeDocument,
  uploadedFiles,
  onSelectDocument,
  onAddNotification
}: SummarizerViewProps) {
  const [selectedLength, setSelectedLength] = useState<SummaryLength>('medium');
  const [isCompiling, setIsCompiling] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [highlights, setHighlights] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  // Cached summaries to avoid querying server multiple times for same document and setting
  const [cachedSummaries, setCachedSummaries] = useState<AISummary[]>([]);

  const lengths: { id: SummaryLength; label: string; desc: string }[] = [
    { id: 'short', label: 'Brief Paragraph', desc: '1-2 structural briefings' },
    { id: 'medium', label: 'Standard Chapter', desc: 'Balanced structural walkthrough' },
    { id: 'detailed', label: 'Thorough Breakdown', desc: 'Full pedagogical coverage' },
    { id: 'bullet', label: 'Direct Bullets Only', desc: 'Strict review lists' },
    { id: 'one-line', label: 'Core Axiom', desc: 'One high impact sentence' },
    { id: 'academic', label: 'Abstract Format', desc: 'Formal academic summary' },
    { id: 'exam', label: 'Exam Cheat-sheet', desc: 'High emphasis on formulas' }
  ];

  useEffect(() => {
    if (activeDocument) {
      // Look for a cached summary of active document and length
      const match = cachedSummaries.find(
        s => s.docId === activeDocument.id && s.length === selectedLength
      );
      if (match) {
        setSummaryText(match.text);
        setHighlights(match.highlights);
      } else {
        setSummaryText('');
        setHighlights([]);
      }
    }
  }, [activeDocument, selectedLength]);

  const handleGenerateSummary = async () => {
    if (!activeDocument) return;
    setIsCompiling(true);
    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeDocument.extractedText,
          length: selectedLength
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const compiledText = data.summaryText;
      const parsedHighlights = data.highlights || [];

      setSummaryText(compiledText);
      setHighlights(parsedHighlights);

      // Save to cache
      setCachedSummaries(prev => [
        ...prev,
        {
          docId: activeDocument.id,
          length: selectedLength,
          text: compiledText,
          highlights: parsedHighlights
        }
      ]);

      onAddNotification(
        'Study Material Synthesized',
        `Generated ${selectedLength} style summary from "${activeDocument.name}".`,
        'success'
      );
    } catch (error: any) {
      console.error(error);
      // fallback safe message on failure to obey strict no-hallucination constraint
      const fallbackText = `### Summary Generation Failed\n\n` +
        `We were unable to compile an AI synthesis for **${activeDocument.name}** at this moment. This can occasionally occur during network interruptions or when the AI server is reaching rate limits.\n\n` +
        `**No fallback information has been loaded**, because we maintain a strict **No-Hallucination Policy** to protect the accuracy of your active study materials. Only topics explicitly mentioned in your document will ever be displayed in StudySpark.\n\n` +
        `*Please verify your server and API keys configuration, and click **Generate Study Material** again to re-attempt.*`;

      const fallbackHighlights: any[] = [];

      setSummaryText(fallbackText);
      setHighlights(fallbackHighlights);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyToClipboard = () => {
    // strip the helper brackets prior to clipboard copy for elegant pasting
    const cleaned = summaryText
      .replace(/\[YELLOW_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[BLUE_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[GREEN_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[ORANGE_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[PINK_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[PURPLE_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[GREY_HL:\s*([^\]]+)\]/g, '$1');

    navigator.clipboard.writeText(cleaned);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const handleDownloadTxt = () => {
    const cleaned = summaryText
      .replace(/\[YELLOW_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[BLUE_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[GREEN_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[ORANGE_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[PINK_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[PURPLE_HL:\s*([^\]]+)\]/g, '$1')
      .replace(/\[GREY_HL:\s*([^\]]+)\]/g, '$1');

    const element = document.createElement("a");
    const file = new Blob([cleaned], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${activeDocument?.name.split('.')[0] || 'studyspark'}_summary_${selectedLength}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDF = () => {
    if (!activeDocument || !summaryText) return;

    // Create a new window specifically for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onAddNotification('Export Blocked', 'Please allow popups to export high-quality PDF.', 'info');
      return;
    }

    // Prepare highlight colors key details for legendary coverage
    const legendHtml = `
      <div class="legend-container">
        <h2>STUDY LABELS & HIGHLIGHT LEGEND</h2>
        <div class="legend-grid">
          <div class="legend-item"><span class="swatch" style="background:#fef08a; border-color:#fde047;"></span> <strong>Yellow:</strong> Important Concepts</div>
          <div class="legend-item"><span class="swatch" style="background:#e0f2fe; border-color:#bae6fd;"></span> <strong>Light Blue:</strong> Definitions</div>
          <div class="legend-item"><span class="swatch" style="background:#d1fae5; border-color:#a7f3d0;"></span> <strong>Light Green:</strong> Key Takeaways</div>
          <div class="legend-item"><span class="swatch" style="background:#ffedd5; border-color:#fed7aa;"></span> <strong>Orange:</strong> Warnings / Important Notes / Cautions</div>
          <div class="legend-item"><span class="swatch" style="background:#fce7f3; border-color:#fbcfe8;"></span> <strong>Pink:</strong> Examples / Case Studies</div>
          <div class="legend-item"><span class="swatch" style="background:#f3e8ff; border-color:#e9d5ff;"></span> <strong>Purple:</strong> Formulas / Equations / Statistics</div>
          <div class="legend-item"><span class="swatch" style="background:#f1f5f9; border-color:#cbd5e1;"></span> <strong>Grey:</strong> References / Additional Info</div>
        </div>
      </div>
    `;

    // Process the text line-by-line to translate to high-quality print HTML
    const lines = summaryText.split('\n');
    let contentHtml = '';

    const translateInline = (text: string) => {
      if (!text) return '';
      // replace formatting brackets to beautiful styled inline spans
      return text
        .replace(/\[YELLOW_HL:\s*([^\]]+)\]/g, '<span class="hl-yellow">$1</span>')
        .replace(/\[BLUE_HL:\s*([^\]]+)\]/g, '<span class="hl-blue">$1</span>')
        .replace(/\[GREEN_HL:\s*([^\]]+)\]/g, '<span class="hl-green">$1</span>')
        .replace(/\[ORANGE_HL:\s*([^\]]+)\]/g, '<span class="hl-orange">$1</span>')
        .replace(/\[PINK_HL:\s*([^\]]+)\]/g, '<span class="hl-pink">$1</span>')
        .replace(/\[PURPLE_HL:\s*([^\]]+)\]/g, '<span class="hl-purple">$1</span>')
        .replace(/\[GREY_HL:\s*([^\]]+)\]/g, '<span class="hl-grey">$1</span>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        contentHtml += '<div class="space"></div>';
        return;
      }

      // Check if line is a table row (starts and ends with |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const isSeparator = cells.every(c => /^:?-+:?$/.test(c));
        if (!isSeparator) {
          contentHtml += `<div class="table-row">`;
          cells.forEach(cell => {
            contentHtml += `<div class="table-cell">${translateInline(cell)}</div>`;
          });
          contentHtml += `</div>`;
        }
        return;
      }

      // Render headings
      if (trimmed.startsWith('# ')) {
        contentHtml += `<h1 class="heading-1">${translateInline(trimmed.replace('# ', ''))}</h1>`;
      } else if (trimmed.startsWith('## ')) {
        contentHtml += `<h2 class="heading-2">${translateInline(trimmed.replace('## ', ''))}</h2>`;
      } else if (trimmed.startsWith('### ')) {
        contentHtml += `<h3 class="heading-3">${translateInline(trimmed.replace('### ', ''))}</h3>`;
      } else if (trimmed.startsWith('#### ')) {
        contentHtml += `<h4 class="heading-4">${translateInline(trimmed.replace('#### ', ''))}</h4>`;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        contentHtml += `
          <div class="list-item">
            <span class="bullet">•</span>
            <div class="list-content">${translateInline(content)}</div>
          </div>
        `;
      } else {
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          contentHtml += `
            <div class="list-item">
              <span class="num">${numberedMatch[1]}.</span>
              <div class="list-content">${translateInline(numberedMatch[2])}</div>
            </div>
          `;
        } else {
          const leadingSpaces = line.length - line.trimStart().length;
          const indentStyle = leadingSpaces > 2 ? ` style="padding-left: ${leadingSpaces * 4}px;"` : '';
          contentHtml += `<p class="paragraph"${indentStyle}>${translateInline(line)}</p>`;
        }
      }
    });

    const currentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Elegant, clean, professional print styles
    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        
        @page {
          size: A4;
          margin: 20mm;
          @bottom-right {
            content: counter(page);
          }
        }
        
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          color: #1e293b;
          line-height: 1.6;
          font-size: 11pt;
          margin: 0;
          padding: 0;
          background: #ffffff;
        }

        /* Cover Page Styling */
        .cover-page {
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          min-height: 250mm;
          padding: 20mm;
          box-sizing: border-box;
        }

        .cover-badge {
          background: #4f46e5;
          color: white;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 8.5pt;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        h0 {
          font-size: 32pt;
          font-weight: 855;
          line-height: 1.15;
          color: #0f172a;
          margin: 0 0 15px 0;
          letter-spacing: -0.025em;
        }

        .cover-subtitle {
          font-size: 14pt;
          color: #64748b;
          margin: 0 0 50px 0;
        }

        .cover-meta {
          border-top: 2px solid #f1f5f9;
          padding-top: 30px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
        }

        .meta-group h5 {
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin: 0 0 6px 0;
        }

        .meta-group p {
          font-size: 11pt;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        /* Legends */
        .legend-container {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 22px;
          margin-bottom: 35px;
          page-break-inside: avoid;
        }

        .legend-container h2 {
          font-size: 9.5pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.075em;
          color: #334155;
          margin: 0 0 15px 0;
          border: none;
          padding: 0;
        }

        .legend-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          font-size: 9.5pt;
          color: #475569;
        }

        .swatch {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 4px;
          margin-right: 10px;
          border: 1px solid rgba(0,0,0,0.06);
          flex-shrink: 0;
        }

        /* Typography */
        .heading-1 {
          font-size: 19pt;
          font-weight: 700;
          color: #0f172a;
          margin-top: 35px;
          margin-bottom: 12px;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 6px;
          page-break-after: avoid;
        }

        .heading-2 {
          font-size: 14pt;
          font-weight: 700;
          color: #1e293b;
          margin-top: 25px;
          margin-bottom: 10px;
          page-break-after: avoid;
        }

        .heading-3 {
          font-size: 11pt;
          font-weight: 752;
          color: #4f46e5;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 20px;
          margin-bottom: 8px;
          border-left: 4px solid #6366f1;
          padding-left: 8px;
          page-break-after: avoid;
        }

        .heading-4 {
          font-size: 10pt;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 15px;
          margin-bottom: 6px;
          page-break-after: avoid;
        }

        .paragraph {
          margin: 0 0 12px 0;
          color: #334155;
          text-align: justify;
        }

        .list-item {
          display: flex;
          align-items: start;
          gap: 8px;
          padding-left: 12px;
          margin-bottom: 6px;
        }

        .bullet {
          color: #4f46e5;
          font-weight: bold;
          font-size: 14pt;
          line-height: 1;
          margin-top: -3px;
        }

        .num {
          color: #4f46e5;
          font-weight: bold;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10pt;
          margin-top: 1px;
        }

        .list-content {
          flex: 1;
          color: #334155;
        }

        .space {
          height: 10px;
        }

        /* High quality table in PDF */
        .table-row {
          display: flex;
          gap: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 10px;
          border-radius: 12px;
          color: #1e293b;
          font-weight: 500;
          margin: 6px 0;
          page-break-inside: avoid;
        }
        .table-cell {
          flex: 1;
          font-size: 8.5pt;
          color: #334155;
          min-width: 0;
          word-wrap: break-word;
        }

        /* Highlighting Styles matching exactly the core layout request */
        .hl-yellow {
          background-color: #fef08a !important;
          border-bottom: 1px solid #fde047;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 3px;
          color: #713f12;
        }

        .hl-blue {
          background-color: #e0f2fe !important;
          border-bottom: 1px solid #bae6fd;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 3px;
          color: #0369a1;
        }

        .hl-green {
          background-color: #d1fae5 !important;
          border-bottom: 1px solid #a7f3d0;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 3px;
          color: #047857;
        }

        .hl-orange {
          background-color: #ffedd5 !important;
          border-bottom: 1px solid #fed7aa;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 3px;
          color: #c2410c;
        }

        .hl-pink {
          background-color: #fce7f3 !important;
          border-bottom: 1px solid #fbcfe8;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 3px;
          color: #be185d;
        }

        .hl-purple {
          background-color: #f3e8ff !important;
          border-bottom: 1px solid #e9d5ff;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 3px;
          color: #7e22ce;
        }

        .hl-grey {
          background-color: #f1f5f9 !important;
          border-bottom: 1px solid #cbd5e1;
          font-weight: 500;
          padding: 1px 3px;
          border-radius: 3px;
          color: #475569;
        }

        /* Print system rules */
        @media print {
          .no-print { display: none; }
          html, body {
            width: 210mm;
            height: 297mm;
          }
        }
      </style>
    `;

    // Construct print target schema
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeDocument.name.split('.')[0]}_StudySpark_Summary</title>
          ${styles}
        </head>
        <body>
          
          <!-- COVER PAGE -->
          <div class="cover-page">
            <div class="cover-badge">StudySpark AI Study Companion</div>
            <h0>${activeDocument.name.replace(/\\.[^/.]+$/, "")}</h0>
            <div class="cover-subtitle">Complete Analytical Synthesizer & Lecture Review Notes</div>
            
            <div class="cover-meta">
              <div class="meta-group">
                <h5>Source Document Filename</h5>
                <p>${activeDocument.name}</p>
              </div>
              <div class="meta-group">
                <h5>Date of Generation</h5>
                <p>${currentDate}</p>
              </div>
              <div class="meta-group">
                <h5>Compilation Type</h5>
                <p>Adaptive Summary Format (${selectedLength.toUpperCase()})</p>
              </div>
              <div class="meta-group">
                <h5>Study Companion Platform</h5>
                <p>StudySpark AI Lab</p>
              </div>
            </div>
          </div>

          <!-- HIGHLIGHT COLOUR KEY LEGEND (First Content Page) -->
          ${legendHtml}

          <!-- ORIGINAL HIGHLIGHTED MAIN CONTENT -->
          <div class="document-content">
            ${contentHtml}
          </div>

          <script>
            // Auto invoke printer interface after resources have loaded
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => {
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const renderInlineHighlights = (text: string) => {
    if (!text) return '';

    // Regex matches 7 custom highlight tags OR bold markdown formatting
    const regex = /(\[(?:YELLOW|BLUE|GREEN|ORANGE|PINK|PURPLE|GREY)_HL:\s*[^\]]+\]|\*\*[^*]+\*\*)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Analyze current component matches
      const yellowMatch = part.match(/\[YELLOW_HL:\s*([^\]]+)\]/);
      const blueMatch = part.match(/\[BLUE_HL:\s*([^\]]+)\]/);
      const greenMatch = part.match(/\[GREEN_HL:\s*([^\]]+)\]/);
      const orangeMatch = part.match(/\[ORANGE_HL:\s*([^\]]+)\]/);
      const pinkMatch = part.match(/\[PINK_HL:\s*([^\]]+)\]/);
      const purpleMatch = part.match(/\[PURPLE_HL:\s*([^\]]+)\]/);
      const greyMatch = part.match(/\[GREY_HL:\s*([^\]]+)\]/);
      const boldMatch = part.match(/\*\*([^*]+)\*\*/);

      if (yellowMatch) {
        return (
          <span key={index} className="bg-yellow-105 border border-yellow-300 text-yellow-900 px-1.5 py-0.5 rounded font-semibold inline">
            {yellowMatch[1]}
          </span>
        );
      }
      if (blueMatch) {
        return (
          <span key={index} className="bg-sky-50 border border-sky-305 text-sky-900 px-1.5 py-0.5 rounded font-semibold inline">
            {blueMatch[1]}
          </span>
        );
      }
      if (greenMatch) {
        return (
          <span key={index} className="bg-emerald-50 border border-emerald-250 text-emerald-900 px-1.5 py-0.5 rounded font-semibold inline">
            {greenMatch[1]}
          </span>
        );
      }
      if (orangeMatch) {
        return (
          <span key={index} className="bg-orange-50 border border-orange-250 text-orange-900 px-1.5 py-0.5 rounded font-semibold inline font-mono">
            {orangeMatch[1]}
          </span>
        );
      }
      if (pinkMatch) {
        return (
          <span key={index} className="bg-pink-50 border border-pink-250 text-pink-900 px-1.5 py-0.5 rounded font-semibold inline">
            {pinkMatch[1]}
          </span>
        );
      }
      if (purpleMatch) {
        return (
          <span key={index} className="bg-purple-50 border border-purple-250 text-purple-900 px-1.5 py-0.5 rounded font-semibold inline">
            {purpleMatch[1]}
          </span>
        );
      }
      if (greyMatch) {
        return (
          <span key={index} className="bg-slate-200 border border-slate-350 text-slate-800 px-1.5 py-0.5 rounded font-medium inline">
            {greyMatch[1]}
          </span>
        );
      }
      if (boldMatch) {
        return <strong key={index} className="font-bold text-slate-900">{boldMatch[1]}</strong>;
      }

      return part;
    });
  };

  const renderHighlightedContent = (rawText: string) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');

    return (
      <div className="space-y-3 font-sans text-xs text-slate-700 leading-relaxed">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-2" />;

          // Check for Table formatting
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            const cells = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
            const isSeparator = cells.every(c => /^:?-+:?$/.test(c));
            if (isSeparator) return null;

            return (
              <div key={lineIdx} className="grid grid-flow-col auto-cols-fr border border-slate-200 bg-slate-50 gap-3 p-2.5 rounded-xl text-slate-800 font-medium my-1 animate-fade-in">
                {cells.map((cell, cIdx) => (
                  <div key={cIdx} className="text-xs">
                    {renderInlineHighlights(cell)}
                  </div>
                ))}
              </div>
            );
          }

          // Content headings
          if (trimmed.startsWith('# ')) {
            return (
              <h1 id={`h1-${lineIdx}`} key={lineIdx} className="text-lg font-extrabold text-slate-900 border-b border-slate-150 pb-1 mt-6 mb-3 font-sans">
                {renderInlineHighlights(trimmed.replace('# ', ''))}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 id={`h2-${lineIdx}`} key={lineIdx} className="text-base font-bold text-slate-800 mt-5 mb-2 font-sans">
                {renderInlineHighlights(trimmed.replace('## ', ''))}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 id={`h3-${lineIdx}`} key={lineIdx} className="text-xs font-bold text-indigo-750 uppercase tracking-wide mt-4 mb-2 border-l-4 border-indigo-500 pl-2 font-sans">
                {renderInlineHighlights(trimmed.replace('### ', ''))}
              </h3>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h4 id={`h4-${lineIdx}`} key={lineIdx} className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono mt-3 mb-1">
                {renderInlineHighlights(trimmed.replace('#### ', ''))}
              </h4>
            );
          }

          // Bullet list items
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-3 py-0.5">
                <span className="text-indigo-600 font-bold shrink-0 text-lg leading-none -mt-1">•</span>
                <div className="flex-1 text-slate-700 text-xs">{renderInlineHighlights(content)}</div>
              </div>
            );
          }

          // Numbered list items
          const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numberedMatch) {
            const num = numberedMatch[1];
            const content = numberedMatch[2];
            return (
              <div key={lineIdx} className="flex items-start gap-2 pl-3 py-0.5">
                <span className="text-indigo-600 font-bold font-mono shrink-0 text-xs mt-0.5">{num}.</span>
                <div className="flex-1 text-slate-700 text-xs">{renderInlineHighlights(content)}</div>
              </div>
            );
          }

          // Indented sub-paragraphs or blank spaces
          const leadingSpaces = line.length - line.trimStart().length;
          const indentStyle = leadingSpaces > 2 ? { paddingLeft: `${leadingSpaces * 4}px` } : undefined;
          return (
            <p key={lineIdx} style={indentStyle} className="text-xs text-slate-700 leading-relaxed py-0.5">
              {renderInlineHighlights(line)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800">AI Smart Summarizer</h1>
        <p className="text-sm text-slate-500 mt-1">Generate multi-format lecture reviews with inline color coding for rapid conceptual retention.</p>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column 4: Configurations & Selection */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active file select */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-550 mb-3 block">1. Active Source Document</h3>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => onSelectDocument(file)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                      activeDocument?.id === file.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-750'
                        : 'border-slate-150 hover:border-slate-300 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{file.name}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">{file.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No notebooks loaded yet. Import documents in Upload Workspace.</div>
            )}
          </div>

          {/* Style Selector */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-550">2. Layout Form & Style</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {lengths.map(len => (
                <button
                  key={len.id}
                  onClick={() => setSelectedLength(len.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                    selectedLength === len.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-750'
                      : 'border-slate-150 hover:border-slate-350 bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className={`text-xs font-bold ${selectedLength === len.id ? 'text-indigo-650' : 'text-slate-700'}`}>
                      {len.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{len.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-450 shrink-0" />
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={!activeDocument || isCompiling}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-sm cursor-pointer transition active:scale-[0.98] text-xs flex items-center justify-center gap-2"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing Notes...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-white" /> Generate AI Summary
                </>
              )}
            </button>
          </div>

          {/* Custom smart highlighter legend */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-550">Smart Highlighter Key</h3>
            
            <div className="space-y-2">
              <div className="p-2 bg-yellow-50/70 border border-yellow-101 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-yellow-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-yellow-800 uppercase leading-none">Important Concepts</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Core academic themes and frameworks</p>
                </div>
              </div>

              <div className="p-2 bg-sky-50/70 border border-sky-101 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-sky-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-sky-850 uppercase leading-none">Definitions</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Key vocabulary and terms</p>
                </div>
              </div>

              <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-850 uppercase leading-none">Key Takeaways</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Crucial points and insights</p>
                </div>
              </div>

              <div className="p-2 bg-orange-50/70 border border-orange-100 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-orange-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-orange-850 uppercase leading-none">Warnings & Notes</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Cautions and critical warnings</p>
                </div>
              </div>

              <div className="p-2 bg-pink-50/70 border border-pink-100 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-pink-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-pink-850 uppercase leading-none">Examples</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Walkthroughs and case studies</p>
                </div>
              </div>

              <div className="p-2 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-purple-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-purple-855 uppercase leading-none">Formulas & Stats</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Equations and numerical data</p>
                </div>
              </div>

              <div className="p-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded bg-slate-400 shrink-0" />
                <div>
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase leading-none">References</h4>
                  <p className="text-[8.5px] text-slate-500 mt-0.5">Additional info and background citations</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column 8: Results display */}
        <div className="lg:col-span-8 flex flex-col h-full">
          
          {summaryText ? (
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex-grow flex flex-col justify-between space-y-6">
              
              {/* Action headers bar */}
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Study Guide Summary</h3>
                  </div>
                </div>
                
                {/* Export triggers */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm font-semibold"
                    title="Copy plain text"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Plain'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm font-semibold"
                    title="Save plain text file"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download TXT</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 shadow-sm font-semibold border border-indigo-700"
                    title="Save styled PDF Document with Highlights & Legend"
                  >
                    <Printer size={14} />
                    <span>Export High-Quality PDF</span>
                  </button>
                </div>
              </div>

              {/* Summary Text Content parsed with custom HTML widgets */}
              <div id="print-area-summary" className="prose max-w-none flex-grow overflow-y-auto max-h-[600px] pr-2 space-y-4">
                {renderHighlightedContent(summaryText)}
              </div>

              {/* Highlights Inspector panel */}
              {highlights.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 mt-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2 flex items-center gap-1">
                    <Bookmark size={12} className="text-indigo-600" /> Quick Review Highlights Token Dashboard
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((hl, idx) => {
                      const category = hl.category?.toLowerCase() || '';
                      const bgClass = 
                        category === 'yellow' || category === 'yellow_hl' ? 'bg-yellow-50 border-yellow-250 text-yellow-805' :
                        category === 'blue' || category === 'blue_hl' ? 'bg-sky-50 border-sky-200 text-sky-850' :
                        category === 'green' || category === 'green_hl' ? 'bg-emerald-50 border-emerald-200 text-emerald-850' :
                        category === 'orange' || category === 'orange_hl' ? 'bg-orange-50 border-orange-200 text-orange-850 font-medium' :
                        category === 'pink' || category === 'pink_hl' ? 'bg-pink-50 border-pink-200 text-pink-850 font-medium' :
                        category === 'purple' || category === 'purple_hl' ? 'bg-purple-50 border-purple-200 text-purple-855 font-mono' :
                        'bg-slate-200 border-slate-300 text-slate-850';

                      return (
                        <span 
                          key={idx}
                          className={`text-[9.5px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1.5 ${bgClass}`}
                        >
                          <span className="text-[8px] font-bold uppercase select-none opacity-60">[{hl.label || hl.category}]</span> {hl.text}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 border-dashed text-center flex flex-col justify-center items-center h-[400px] text-slate-500 space-y-3 shadow-sm">
              <BookOpen className="h-10 w-10 text-indigo-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Preview study summaries</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Choose an active academic file, configure your output length mode, and trigger compiling to populate dynamic highlights.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
