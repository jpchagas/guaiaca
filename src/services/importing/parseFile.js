import { extractPdfText } from "./pdfText";
import { parseStatementText, StatementImportError } from "./parseStatement";

export { StatementImportError };

/**
 * Reads a credit card bill or checking account statement (PDF, or CSV where
 * the bank exports one). The bank is detected from the content.
 */
export async function parseStatementFile(file) {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const text = await extractPdfText(file);
    // Scanned / image-only PDFs have no text layer to read
    if (!text.trim()) throw new StatementImportError("scannedPdf");
    return parseStatementText(text);
  }

  if (file.type === "text/csv" || /\.csv$/i.test(file.name)) {
    return parseStatementText(await file.text());
  }

  throw new StatementImportError("unsupportedFile");
}
