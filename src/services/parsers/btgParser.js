// src/services/parsers/btgParser.js
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/**
 * Parse BTG Pactual credit card statements (XLSX or PDF)
 * Returns array of transactions in unified format
 */
export default async function parseBTG(file) {
  console.log("Processing BTG file");
  const fileType = file.name.split(".").pop().toLowerCase();
  console.log(`File Type: ${fileType}`);
  if (fileType === "xlsx") {
    return await parseBTGXLSX(file);
  } else if (fileType === "pdf") {
    return await parseBTGPDF(file);
  } else {
    throw new Error("Unsupported BTG file type. Expected XLSX or PDF.");
  }
}

/** 🧾 Parse XLSX format */
async function parseBTGXLSX(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const currentYear = new Date().getFullYear();

  return rows
    .filter((r) => r["Valor"]) // ignore empty rows
    .map((r) => ({
      date: normalizeDate(r["Data"], currentYear),
      description: r["Descrição"] || "",
      amount: parseAmount(r["Valor"]),
      category: inferCategory(r["Descrição"] || ""),
      bank: "BTG",
    }));
}

/** 📄 Parse PDF format */
async function parseBTGPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textContent = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    textContent += content.items.map((item) => item.str).join(" ") + "\n";
  }
  console.log(textContent)
  // Match example lines like:
  // "12 Set Armazém 43 24out (2/2) R$ 74,50"
const regex = /(R\$ [0-9]+\,[0-9]+) (\D+?) (\([0-9]\/[0-9]+\) )?([0-9]+ \w+)/g;

const transactions = [];
let match;

while ((match = regex.exec(textContent)) !== null) {
  const [, amountRaw, descriptionRaw, parcelRaw, dateRaw] = match;

  const amount = parseAmount(amountRaw); // parse "R$ 123,45" → 123.45
  const description = descriptionRaw.trim();
  const parcel = parcelRaw ? parcelRaw.replace(/[()]/g, "").trim() : "0/0";
  const date = dateRaw.trim();

  transactions.push({
    amount: -amount, // assume expense
    description,
    parcel,
    date,
    category: inferCategory(description),
    bank: "BTG",
  });
}

console.log(transactions);
return transactions;
}

/** 🔢 Helpers */

function parseAmount(value) {
  if (typeof value === "number") return value;
  return parseFloat(value.replace(/[R$\s.]/g, "").replace(",", "."));
}

function normalizeDate(dateStr, year) {
  if (!dateStr) return null;
  const [day, month] = dateStr.split("/").map((x) => x.padStart(2, "0"));
  return `${year}-${month}-${day}`;
}

function parseDateFromPDF(day, monthAbbrev, year) {
  const monthMap = {
    jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06",
    jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12",
  };
  const month = monthMap[monthAbbrev.toLowerCase()] || "01";
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function inferCategory(description) {
  const desc = description.toLowerCase();
  if (desc.includes("mercado") || desc.includes("armaz")) return "Food";
  if (desc.includes("uber") || desc.includes("99")) return "Transport";
  if (desc.includes("academ") || desc.includes("gym")) return "Health";
  if (desc.includes("netflix") || desc.includes("spotify")) return "Entertainment";
  return "Other";
}
