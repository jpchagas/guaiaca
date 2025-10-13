import React, { useEffect, useState } from 'react'
import { getAllTransactions } from '../lib/db'
import { format, parseISO } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'


export default function Dashboard() {
const [txs, setTxs] = useState([])


useEffect(() => { refresh() }, [])
async function refresh() { const all = await getAllTransactions(); setTxs(all) }


const total = txs.reduce((s, t) => s + (t.amount || 0), 0)


const monthly = txs.reduce((acc, t) => {
const d = t.date ? parseISO(t.date) : new Date()
const m = format(d, 'yyyy-MM')
acc[m] = (acc[m] || 0) + (t.amount || 0)
return acc
}, {})


const lineData = Object.keys(monthly).sort().map(k => ({ month: k, amount: monthly[k] }))


const byCategory = txs.reduce((acc, t) => { const c = t.category || 'other'; acc[c] = (acc[c] || 0) + (t.amount || 0); return acc }, {})
const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value }))


return (
<div>
<div className="card header">
<div>
<h2>Overview</h2>
<div className="small">Total balance (sum of imported + manual):</div>
<h3>{total.toFixed(2)}</h3>
</div>
</div>


<div className="card">
<h3>Trend</h3>
{lineData.length ? (
<LineChart width={800} height={200} data={lineData}>
<XAxis dataKey="month" />
<YAxis />
<Tooltip />
<Line type="monotone" dataKey="amount" stroke="#1C1C1E" />
</LineChart>
) : <div className="small">No data yet</div>}
</div>


<div className="card">
<h3>By category</h3>
{pieData.length ? (
<PieChart width={400} height={250}><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>{pieData.map((_, i) => <Cell key={i} />)}</Pie></PieChart>
) : <div className="small">No categorized transactions</div>}
</div>


<div className="card">
<h3>Last transactions</h3>
<table style={{ width:'100%', borderCollapse:'collapse' }}>
<thead><tr><th style={{ textAlign:'left' }}>Date</th><th>Description</th><th style={{ textAlign:'right' }}>Amount</th></tr></thead>
<tbody>
{txs.slice().reverse().slice(0,12).map(t => (
<tr key={t.id}><td>{t.date ? format(parseISO(t.date),'yyyy-MM-dd') : '-'}</td><td>{t.description}</td><td style={{ textAlign:'right' }}>{(t.amount||0).toFixed(2)}</td></tr>
))}
</tbody>
</table>
</div>
</div>
)
}