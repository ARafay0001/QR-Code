import { useRef, useState } from "react";
import { pdfjs } from "react-pdf";
import {
  Upload,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";

import {
  Document as WordDocument,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  PageBreak,
  AlignmentType,
} from "docx";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PDFToWord() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [wordUrl, setWordUrl] = useState(null);

  // --------------------------------------------------
  // Open file picker
  // --------------------------------------------------

  const chooseFile = () => {
    inputRef.current?.click();
  };

  // --------------------------------------------------
  // Handle PDF selection
  // --------------------------------------------------

  const handleFile = async (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      return;
    }

    if (wordUrl) {
      URL.revokeObjectURL(wordUrl);
    }

    setFile(selectedFile);
    setWordUrl(null);
    setError("");
    setStatus("");
    setPageCount(0);

    try {
      const bytes = await selectedFile.arrayBuffer();

      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(bytes),
      }).promise;

      setPageCount(pdf.numPages);
    } catch (err) {
      console.error("PDF loading error:", err);

      setFile(null);
      setPageCount(0);
      setError("Unable to read this PDF file.");
    }
  };

  // ==================================================
  // BUILD LOGICAL LINES FROM PDF TEXT ITEMS
  // ==================================================
  //
  // Each line keeps its raw `items` array (not just a
  // flattened string) so that per-run bold/italic and
  // per-character positions survive into the DOCX runs.

  const buildLines = (items) => {
    const usable = items
      .filter(
        (item) =>
          typeof item.str === "string" &&
          item.str.trim().length > 0
      )
      .map((item) => {
        const transform = item.transform || [];

        const x = Number(transform[4]) || 0;
        const y = Number(transform[5]) || 0;

        const fontSize =
          Math.abs(Number(transform[3])) ||
          Math.abs(Number(transform[0])) ||
          11;

        return {
          text: item.str,
          x,
          y,
          width: Number(item.width) || 0,
          height: Number(item.height) || fontSize,
          fontSize,
          fontName: item.fontName || "",
          hasEOL: Boolean(item.hasEOL),
          bold: /bold|black|heavy|semibold/i.test(
            item.fontName || ""
          ),
          italic: /italic|oblique/i.test(
            item.fontName || ""
          ),
        };
      });

    // PDF coordinates increase upward.
    // Sort from top -> bottom, then left -> right.
    usable.sort((a, b) => {
      const tolerance =
        Math.max(a.fontSize, b.fontSize) * 0.35;

      if (Math.abs(a.y - b.y) <= tolerance) {
        return a.x - b.x;
      }

      return b.y - a.y;
    });

    const lines = [];

    for (const item of usable) {
      let targetLine = null;

      for (const line of lines) {
        const tolerance =
          Math.max(line.fontSize, item.fontSize) * 0.35;

        if (
          Math.abs(line.y - item.y) <=
          Math.max(2, tolerance)
        ) {
          targetLine = line;
          break;
        }
      }

      if (!targetLine) {
        targetLine = {
          y: item.y,
          items: [],
          minX: item.x,
          maxX: item.x + item.width,
          fontSize: item.fontSize,
        };

        lines.push(targetLine);
      }

      targetLine.items.push(item);

      targetLine.minX = Math.min(targetLine.minX, item.x);

      targetLine.maxX = Math.max(
        targetLine.maxX,
        item.x + item.width
      );

      targetLine.fontSize = Math.max(
        targetLine.fontSize,
        item.fontSize
      );
    }

    // Sort lines top -> bottom.
    lines.sort((a, b) => b.y - a.y);

    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);

      // ------------------------------------------------
      // Build the flattened display text (used for
      // heading/bullet/numbering detection) AND, in
      // parallel, a list of "runs" that preserve which
      // characters were bold/italic and where spaces
      // need to be inserted between items.
      // ------------------------------------------------

      let text = "";
      const runs = [];

      for (let i = 0; i < line.items.length; i++) {
        const current = line.items[i];
        const previous = line.items[i - 1];

        let piece = current.text;

        if (previous) {
          const previousEnd =
            previous.x + previous.width;

          const gap = current.x - previousEnd;

          const fontSize = Math.max(
            previous.fontSize || 11,
            current.fontSize || 11
          );

          const characterGap = fontSize * 0.32;
          const wordGap = fontSize * 0.7;

          const explicitSpace =
            /\s$/.test(previous.text) ||
            /^\s/.test(current.text);

          const bothSingleCharacters =
            previous.text.length === 1 &&
            current.text.length === 1;

          const bothLetters =
            /^[A-Za-z]$/.test(previous.text) &&
            /^[A-Za-z]$/.test(current.text);

          if (explicitSpace) {
            // no extra space needed, item already has one
          } else if (bothSingleCharacters && bothLetters) {
            if (gap > wordGap) piece = " " + piece;
          } else if (gap > wordGap) {
            piece = " " + piece.trimStart();
          } else if (gap > characterGap) {
            piece = " " + piece.trimStart();
          }
        }

        text += piece;

        const last = runs[runs.length - 1];

        if (
          last &&
          last.bold === current.bold &&
          last.italic === current.italic &&
          Math.abs(
            (last.fontSize || 11) -
              (current.fontSize || 11)
          ) < 0.5
        ) {
          last.text += piece;
        } else {
          runs.push({
            text: piece,
            bold: current.bold,
            italic: current.italic,
            fontSize: current.fontSize,
          });
        }
      }

      line.text = text.replace(/\s+/g, " ").trim();

      // Trim leading space off the very first run so
      // it doesn't create a stray leading space in Word.
      if (runs.length > 0) {
        runs[0].text = runs[0].text.replace(/^\s+/, "");
      }

      line.runs = runs.filter((r) => r.text.length > 0);

      line.maxFontSize = Math.max(
        ...line.items.map((item) => item.fontSize || 11)
      );

      line.isBold = line.items.some((item) => item.bold);
      line.isItalic = line.items.some(
        (item) => item.italic
      );

      // Detect bullet points.
      line.isBullet = /^[•●○◦▪▫■□\-–—*]\s*/.test(
        line.text
      );

      // Detect numbered lists.
      line.isNumbered = /^\s*\d+[.)]\s+/.test(line.text);

      line.minXRaw = line.minX;
    }

    return lines.filter((line) => line.text.length > 0);
  };

  // ==================================================
  // DETECT TWO-COLUMN LAYOUT
  // ==================================================

  const detectColumns = (lines, pageWidth) => {
    if (!lines || lines.length < 8) {
      return {
        isTwoColumn: false,
        left: lines || [],
        right: [],
      };
    }

    const middle = pageWidth / 2;

    const left = [];
    const right = [];

    for (const line of lines) {
      const center = (line.minX + line.maxX) / 2;

      if (center < middle) {
        left.push(line);
      } else {
        right.push(line);
      }
    }

    if (left.length < 4 || right.length < 4) {
      return {
        isTwoColumn: false,
        left: lines,
        right: [],
      };
    }

    const leftMaxX = Math.max(...left.map((line) => line.maxX));
    const rightMinX = Math.min(...right.map((line) => line.minX));

    const gap = rightMinX - leftMaxX;
    const minimumGap = pageWidth * 0.06;

    if (gap < minimumGap) {
      return {
        isTwoColumn: false,
        left: lines,
        right: [],
      };
    }

    const leftSpread =
      Math.max(...left.map((line) => line.maxX)) -
      Math.min(...left.map((line) => line.minX));

    const rightSpread =
      Math.max(...right.map((line) => line.maxX)) -
      Math.min(...right.map((line) => line.minX));

    if (
      leftSpread < pageWidth * 0.15 ||
      rightSpread < pageWidth * 0.15
    ) {
      return {
        isTwoColumn: false,
        left: lines,
        right: [],
      };
    }

    left.sort((a, b) => b.y - a.y);
    right.sort((a, b) => b.y - a.y);

    return {
      isTwoColumn: true,
      left,
      right,
    };
  };

  // ==================================================
  // GET READING ORDER
  // ==================================================

  const getReadingOrder = (lines, pageWidth) => {
    const columns = detectColumns(lines, pageWidth);

    if (!columns.isTwoColumn) {
      return lines;
    }

    return [...columns.left, ...columns.right];
  };

  // ==================================================
  // ALIGNMENT DETECTION
  // ==================================================

  const detectAlignment = (line, pageWidth, pageMinX, pageMaxX) => {
    const leftGap = line.minX - pageMinX;
    const rightGap = pageMaxX - line.maxX;

    // Centered: roughly symmetric gaps on both sides,
    // and the line doesn't already span most of the page.
    if (
      Math.abs(leftGap - rightGap) < pageWidth * 0.05 &&
      leftGap > pageWidth * 0.08 &&
      rightGap > pageWidth * 0.08
    ) {
      return AlignmentType.CENTER;
    }

    // Right aligned: hugs the right margin but starts
    // well away from the left margin.
    if (
      rightGap < pageWidth * 0.03 &&
      leftGap > pageWidth * 0.25
    ) {
      return AlignmentType.RIGHT;
    }

    return AlignmentType.LEFT;
  };

  // ==================================================
  // DETECT PARAGRAPHS FROM LOGICAL LINES
  // ==================================================

  const isHeading = (line, averageFontSize) => {
    if (!line?.text) return false;

    const fontSize = line.maxFontSize || line.fontSize || 11;

    if (fontSize >= averageFontSize * 1.35) {
      return true;
    }

    if (line.text.length <= 80 && fontSize >= averageFontSize * 1.2) {
      return true;
    }

    const headingWords = [
      "SUMMARY",
      "PROFILE",
      "OBJECTIVE",
      "EXPERIENCE",
      "PROFESSIONAL EXPERIENCE",
      "EDUCATION",
      "SKILLS",
      "KEY SKILLS",
      "ADDITIONAL INFORMATION",
      "LANGUAGE",
      "LANGUAGES",
      "CONTACT",
      "PROJECTS",
      "CERTIFICATIONS",
      "WORK EXPERIENCE",
      "EMPLOYMENT HISTORY",
    ];

    const normalized = line.text
      .trim()
      .replace(/[:\-]+$/, "")
      .toUpperCase();

    return headingWords.includes(normalized);
  };

  const detectParagraphs = (lines, pageWidth, pageMinX, pageMaxX) => {
    if (!lines || lines.length === 0) {
      return [];
    }

    const paragraphs = [];
    let currentParagraph = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const previousLine = lines[i - 1];

      const currentFont = line.maxFontSize || line.fontSize || 11;
      const previousFont =
        previousLine?.maxFontSize || previousLine?.fontSize || currentFont;

      const verticalGap = previousLine
        ? Math.abs(previousLine.y - line.y)
        : 0;

      const expectedLineHeight =
        Math.max(currentFont, previousFont) * 1.25;

      const indentationChanged =
        previousLine &&
        Math.abs(line.minX - previousLine.minX) > currentFont * 1.5;

      const heading = isHeading(line, currentFont);
      const isListItem = line.isBullet || line.isNumbered;

      const largeVerticalGap =
        previousLine && verticalGap > expectedLineHeight * 1.55;

      const hugeVerticalGap =
        previousLine && verticalGap > expectedLineHeight * 2.2;

      const continuesParagraph =
        currentParagraph &&
        previousLine &&
        !heading &&
        !isListItem &&
        !previousLine.isBullet &&
        !previousLine.isNumbered &&
        !largeVerticalGap &&
        !hugeVerticalGap &&
        !indentationChanged;

      const alignment = detectAlignment(
        line,
        pageWidth,
        pageMinX,
        pageMaxX
      );

      if (!currentParagraph || !continuesParagraph) {
        currentParagraph = {
          text: line.text,
          minX: line.minX,
          maxX: line.maxX,
          y: line.y,
          fontSize: line.fontSize,
          maxFontSize: line.maxFontSize || line.fontSize || 11,
          isBold: line.isBold || false,
          isItalic: line.isItalic || false,
          isBullet: line.isBullet || false,
          isNumbered: line.isNumbered || false,
          indentLevel: Math.max(
            0,
            Math.round((line.minX - pageMinX) / 20)
          ),
          isHeading: heading,
          alignment,
          runs: line.runs ? [...line.runs] : [
            { text: line.text, bold: line.isBold, italic: line.isItalic, fontSize: currentFont },
          ],
        };

        paragraphs.push(currentParagraph);
      } else {
        currentParagraph.text += " " + line.text;

        currentParagraph.maxX = Math.max(currentParagraph.maxX, line.maxX);
        currentParagraph.minX = Math.min(currentParagraph.minX, line.minX);

        currentParagraph.maxFontSize = Math.max(
          currentParagraph.maxFontSize,
          line.maxFontSize || line.fontSize || 11
        );

        currentParagraph.isBold = currentParagraph.isBold || line.isBold;
        currentParagraph.isItalic =
          currentParagraph.isItalic || line.isItalic;

        // Insert a space run between joined lines, then
        // append this line's runs so formatting survives
        // the paragraph merge.
        currentParagraph.runs.push({ text: " ", bold: false, italic: false, fontSize: currentFont });

        if (line.runs && line.runs.length > 0) {
          currentParagraph.runs.push(...line.runs);
        } else {
          currentParagraph.runs.push({
            text: line.text,
            bold: line.isBold,
            italic: line.isItalic,
            fontSize: currentFont,
          });
        }
      }
    }

    return paragraphs.filter(
      (paragraph) => paragraph.text && paragraph.text.trim().length > 0
    );
  };

  // ==================================================
  // PDF FONT -> WORD FONT
  // ==================================================

  const pdfFontToWord = (size) => {
    if (!size || !Number.isFinite(size)) {
      return 11;
    }

    return Math.max(8, Math.min(32, Math.round(size)));
  };

  // ==================================================
  // CREATE WORD PARAGRAPH
  // ==================================================

  const createParagraph = (paragraph, averageFontSize, numberingRef) => {
    const fontSize = pdfFontToWord(
      paragraph.maxFontSize || paragraph.fontSize || 11
    );

    const heading = isHeading(paragraph, averageFontSize);

    const leftIndent = Math.min(4000, (paragraph.indentLevel || 0) * 180);

    // Strip PDF bullet / numbering characters from the
    // *first* run's text only (that's where they live),
    // since Word will draw its own bullet/number glyph.
    const runs = paragraph.runs.map((r) => ({ ...r }));

    if (runs.length > 0) {
      if (paragraph.isBullet) {
        runs[0].text = runs[0].text.replace(
          /^[•●○◦▪▫■□\-–—*]\s+/,
          ""
        );
      }
      if (paragraph.isNumbered) {
        runs[0].text = runs[0].text.replace(/^\s*\d+[.)]\s+/, "");
      }
    }

    const textRuns = runs
      .filter((r) => r.text.length > 0)
      .map(
        (r) =>
          new TextRun({
            text: r.text,
            font: "Arial",
            size:
              (heading
                ? Math.max(pdfFontToWord(r.fontSize || fontSize) + 2, 16)
                : pdfFontToWord(r.fontSize || fontSize)) * 2,
            bold: heading || r.bold || false,
            italics: r.italic || false,
          })
      );

    return new Paragraph({
      children:
        textRuns.length > 0
          ? textRuns
          : [
              new TextRun({
                text: paragraph.text,
                font: "Arial",
                size: fontSize * 2,
                bold: heading || paragraph.isBold || false,
                italics: paragraph.isItalic || false,
              }),
            ],

      alignment: heading ? AlignmentType.LEFT : paragraph.alignment,

      bullet: paragraph.isBullet ? { level: 0 } : undefined,

      numbering:
        paragraph.isNumbered && numberingRef
          ? { reference: numberingRef, level: 0 }
          : undefined,

      spacing: {
        before: heading ? 160 : 0,
        after: heading ? 100 : 80,
        line: 276,
      },

      indent: {
        left: heading ? 0 : leftIndent,
      },

      keepNext: heading,
    });
  };

  // ==================================================
  // RENDER PDF PAGE AS IMAGE
  // ==================================================

  const renderPageAsImage = async (page) => {
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create canvas context.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return {
      data: canvas.toDataURL("image/png"),
      width: viewport.width,
      height: viewport.height,
    };
  };

  // ==================================================
  // DATA URL -> UINT8ARRAY
  // ==================================================

  const dataUrlToUint8Array = (dataUrl) => {
    const base64 = dataUrl.split(",")[1];

    if (!base64) {
      throw new Error("Invalid image data.");
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  };

  // ==================================================
  // CONVERT PDF -> WORD
  // ==================================================

  const extractTextFromPDF = async () => {
    if (!file) return;

    setLoading(true);
    setError("");
    setWordUrl(null);

    try {
      const bytes = await file.arrayBuffer();

      const pdf = await pdfjs.getDocument({
        data: new Uint8Array(bytes),
      }).promise;

      const children = [];
      const numberingConfigs = [];
      let listCounter = 0;
      let openListRef = null;
      let previousLineWasListItem = false;

      // ------------------------------------------------
      // Use the FIRST page's dimensions for the whole
      // Word document's page size, so it matches the
      // PDF's paper size / orientation instead of
      // silently defaulting.
      // ------------------------------------------------

      const firstPage = await pdf.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1 });

      const pageWidthTwips = Math.round(baseViewport.width * 20);
      const pageHeightTwips = Math.round(baseViewport.height * 20);

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        setStatus(
          `Analyzing page ${pageNumber} of ${pdf.numPages}...`
        );

        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const items = textContent.items || [];

        const rawLines = buildLines(items);

        const viewport = page.getViewport({ scale: 1 });

        const lines = getReadingOrder(rawLines, viewport.width);

        const averageFontSize =
          lines.length > 0
            ? lines.reduce(
                (sum, line) =>
                  sum + (line.maxFontSize || line.fontSize || 11),
                0
              ) / lines.length
            : 11;

        if (lines.length > 0) {
          const pageMinX = Math.min(...lines.map((l) => l.minX));
          const pageMaxX = Math.max(...lines.map((l) => l.maxX));

          const paragraphs = detectParagraphs(
            lines,
            viewport.width,
            pageMinX,
            pageMaxX
          );

          for (const paragraph of paragraphs) {
            // Start a fresh numbered list (and thus a
            // fresh "1.") whenever a numbered item shows
            // up right after something that wasn't part
            // of a numbered list.
            if (paragraph.isNumbered) {
              if (!previousLineWasListItem) {
                listCounter += 1;
                openListRef = `pdf-numbering-${listCounter}`;

                numberingConfigs.push({
                  reference: openListRef,
                  levels: [
                    {
                      level: 0,
                      format: "decimal",
                      text: "%1.",
                      alignment: "left",
                      style: {
                        paragraph: {
                          indent: { left: 720, hanging: 360 },
                        },
                      },
                    },
                  ],
                });
              }
              previousLineWasListItem = true;
            } else {
              previousLineWasListItem = false;
              openListRef = null;
            }

            children.push(
              createParagraph(
                paragraph,
                averageFontSize,
                paragraph.isNumbered ? openListRef : null
              )
            );
          }
        }

        // If the page has no extractable text at all,
        // fall back to rendering it as an image so
        // content isn't silently dropped.
        if (lines.length === 0) {
          setStatus(
            `Rendering visual content from page ${pageNumber} of ${pdf.numPages}...`
          );

          const rendered = await renderPageAsImage(page);
          const imageBytes = dataUrlToUint8Array(rendered.data);

          const maxWidth = 550;
          const imageWidth = Math.min(maxWidth, rendered.width);
          const imageHeight =
            rendered.height * (imageWidth / rendered.width);

          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBytes,
                  transformation: {
                    width: imageWidth,
                    height: imageHeight,
                  },
                  type: "png",
                }),
              ],
            })
          );
        }

        if (pageNumber < pdf.numPages) {
          children.push(
            new Paragraph({
              children: [new PageBreak()],
            })
          );
        }
      }

      if (children.length === 0) {
        throw new Error("EMPTY_DOCUMENT");
      }

      setStatus("Generating editable Word document...");

      const wordDocument = new WordDocument({
        creator: "PDF Tools",

        title: file.name.replace(/\.pdf$/i, ""),

        numbering: {
          config:
            numberingConfigs.length > 0
              ? numberingConfigs
              : [
                  {
                    reference: "pdf-numbering-unused",
                    levels: [
                      {
                        level: 0,
                        format: "decimal",
                        text: "%1.",
                        alignment: "left",
                        style: {
                          paragraph: {
                            indent: { left: 720, hanging: 360 },
                          },
                        },
                      },
                    ],
                  },
                ],
        },

        sections: [
          {
            properties: {
              page: {
                size: {
                  width: pageWidthTwips,
                  height: pageHeightTwips,
                },
                margin: {
                  top: 720,
                  bottom: 720,
                  left: 720,
                  right: 720,
                },
              },
            },

            children,
          },
        ],
      });

      setStatus("Creating DOCX file...");

      const blob = await Packer.toBlob(wordDocument);
      const url = URL.createObjectURL(blob);

      setWordUrl(url);
      setStatus("Conversion completed.");
    } catch (err) {
      console.error("Advanced PDF to Word error:", err);

      setWordUrl(null);

      if (err?.message === "EMPTY_DOCUMENT") {
        setError("Unable to extract content from this PDF.");
      } else {
        setError(
          `Conversion failed: ${err?.message || "Unknown error"}`
        );
      }

      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // DOWNLOAD DOCX
  // ==================================================

  const downloadWord = () => {
    if (!wordUrl || !file) {
      return;
    }

    const link = document.createElement("a");

    link.href = wordUrl;
    link.download = `${file.name.replace(/\.pdf$/i, "")}.docx`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==================================================
  // CHANGE PDF
  // ==================================================

  const changeFile = () => {
    if (wordUrl) {
      URL.revokeObjectURL(wordUrl);
    }

    setFile(null);
    setPageCount(0);
    setStatus("");
    setError("");
    setWordUrl(null);

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="mx-auto max-w-7xl px-6 py-16">
          {/* HEADER */}

          <div className="text-center">
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              PDF Tools
            </span>

            <h1 className="mt-6 text-5xl font-black">PDF to Word</h1>

            <p className="mx-auto mt-5 max-w-2xl text-slate-400">
              Convert PDF documents into editable Word files while
              preserving layout, alignment, and inline formatting.
            </p>
          </div>

          {/* FILE INPUT */}

          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFile}
          />

          {/* UPLOAD AREA */}

          {!file && (
            <button
              onClick={chooseFile}
              className="mt-16 flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-700 bg-slate-900/60 py-24 transition hover:border-blue-500"
            >
              <Upload size={42} />

              <span className="mt-5 text-xl font-bold">Upload PDF</span>

              <span className="mt-2 text-sm text-slate-400">
                Select a PDF from your computer
              </span>

              <span className="mt-4 text-xs text-yellow-500">
                Best results with digitally-created PDFs. Scanned PDFs
                require OCR.
              </span>
            </button>
          )}

          {/* FILE SELECTED */}

          {file && (
            <div className="mt-16 grid gap-8 lg:grid-cols-[340px_1fr]">
              {/* LEFT PANEL */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-2xl font-bold">PDF Information</h2>

                {/* FILE INFO */}

                <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-1 text-red-400" />

                    <div className="min-w-0">
                      <h3 className="break-all font-semibold">
                        {file.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* PAGE COUNT */}

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                  <p className="text-slate-400">Total Pages</p>

                  <p className="mt-2 text-3xl font-bold">{pageCount}</p>
                </div>

                {/* CONVERT BUTTON */}

                <button
                  onClick={extractTextFromPDF}
                  disabled={loading}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Convert to Word
                    </>
                  )}
                </button>

                {/* CHANGE FILE */}

                <button
                  onClick={changeFile}
                  disabled={loading}
                  className="mt-3 w-full rounded-xl border border-slate-700 py-3 font-semibold transition hover:border-blue-500 disabled:opacity-50"
                >
                  Change PDF
                </button>

                {/* STATUS */}

                {status && (
                  <p className="mt-5 text-center text-sm text-slate-400">
                    {status}
                  </p>
                )}

                {/* ERROR */}

                {error && (
                  <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* RIGHT PANEL */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-2xl font-bold">Conversion Result</h2>

                {/* EMPTY STATE */}

                {!wordUrl && !loading && (
                  <div className="flex min-h-[350px] items-center justify-center">
                    <div className="text-center">
                      <FileText size={60} className="mx-auto text-slate-700" />

                      <p className="mt-5 text-lg font-semibold text-slate-400">
                        Your Word document will appear here
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        Convert your PDF to create an editable DOCX.
                      </p>
                    </div>
                  </div>
                )}

                {/* LOADING */}

                {loading && (
                  <div className="flex min-h-[350px] items-center justify-center">
                    <div className="text-center">
                      <RefreshCw
                        size={50}
                        className="mx-auto animate-spin text-blue-500"
                      />

                      <p className="mt-5 font-semibold">Converting PDF...</p>

                      <p className="mt-2 text-sm text-slate-400">{status}</p>
                    </div>
                  </div>
                )}

                {/* RESULT */}

                {wordUrl && !loading && (
                  <div className="mt-8">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600">
                          <FileText size={28} />
                        </div>

                        <div>
                          <h3 className="font-bold">Word document ready</h3>

                          <p className="mt-1 text-sm text-slate-400">
                            {file.name.replace(/\.pdf$/i, ".docx")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={downloadWord}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold transition hover:bg-blue-500"
                    >
                      <Download size={20} />
                      Download Word Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}