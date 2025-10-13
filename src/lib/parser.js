import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'


pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib).version}/pdf.worker.min.js`


export function parseCSVFile(file) {
return new Promise((resolve, reject) => {
Papa.parse(file, {
header: true,
dynamicTyping: true,
skipEmptyLines: true,
complete: (res) => resolve(res.data),
error: (err) => reject(err)
})
})
}


export function parseXLSXFile(file) {
return new Promise((resolve, reject) => {
const reader = new FileReader()
reader.onload = (e) => {
const data = new Uint8Array(e.target.result)
const workbook = XLSX.read(data, { type: 'array' })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const json = XLSX.utils.sheet_to_json(sheet, { raw: false })
resolve(json)
}
reader.onerror = reject
reader.readAsArrayBuffer(file)
})
}


export async function parsePDFFile(file) {
// PDF parsing is heuristic. This extracts all text and returns naive transactions by regex.
const arrayBuffer = await file.arrayBuffer()
const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
let text = ''
for (let i = 1; i <= pdf.numPages; i++) {
const page = await pdf.getPage(i)
const content = await page.getTextContent()
text += content.items.map(it => it.str).join(' ') + '\n'
}
return extractTransactionsFromText(text)
}


function extractTransactionsFromText(text) {
const lines = text.split('\n').map(s => s.trim()).filter(Boolean)
const txs = []
const dateRegex = /(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/
const amountRegex = /(-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/
for (const line of lines) {
const d = line.match(dateRegex)?.[0]
const a = line.match(amountRegex)?.[0]
if (d && a) {
const amount = Number(a.replace(/[^.\d-]/g, '').replace(',', '.'))
txs.push({ date: new Date(d).toISOString(), amount, description: line.replace(d, '').replace(a, '').trim() })
}
}
return txs
}