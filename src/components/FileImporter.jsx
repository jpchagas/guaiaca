import React from 'react'
import { parseCSVFile, parseXLSXFile, parsePDFFile } from '../lib/parser'
import { saveTransactionLocally } from '../lib/db'


export default function FileImporter({ onImported, user }) {
async function handleFile(e) {
const file = e.target.files?.[0]
if (!file) return
let rows = []
try {
if (file.name.endsWith('.csv')) rows = await parseCSVFile(file)
else if (file.name.match(/\.xls|\.xlsx$/)) rows = await parseXLSXFile(file)
else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) rows = await parsePDFFile(file)
else throw new Error('Unsupported file type')


// simple auto-mapping: try to read common header names
for (const r of rows) {
const date = r.date || r.Date || r['Transaction Date'] || r['Date']
const amount = r.amount || r.Amount || r.Value || r['Amount (BRL)']
const description = r.description || r.Description || r.Payee || r['Details']
if (!date || !amount) continue
const tx = {
date: new Date(date).toISOString(),
amount: Number(amount),
description: String(description || JSON.stringify(r)),
category: 'imported',
createdBy: user?.id || 'local',
shared: true
}
await saveTransactionLocally(tx)
}
onImported && onImported()
alert('Import finished')
} catch (err) {
console.error(err)
alert('Import failed: ' + err.message)
}
}


return (
<div className="card">
<h3>Import file</h3>
<input type="file" accept=".csv, .xls, .xlsx, application/pdf" onChange={handleFile} />
<p className="small">Supported: CSV, XLSX, PDF (best-effort). For CSV/XLSX the first sheet/header is used.</p>
</div>
)
}