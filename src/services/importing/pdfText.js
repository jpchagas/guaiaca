import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Reads a PDF into "token text": every non-empty text item in content order,
 * one per line. Content order keeps each statement row together (e.g. date,
 * description, amount) even when the page lays rows out in two columns.
 */
export async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const tokens = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach((item) => {
      const str = item.str?.replace(/\s+/g, " ").trim();
      if (str) tokens.push(str);
    });
  }

  return tokens.join("\n");
}
