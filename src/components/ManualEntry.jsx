import React from 'react'
import { useForm } from 'react-hook-form'
import { saveTransactionLocally } from '../lib/db'


export default function ManualEntry({ onSaved, user }) {
const { register, handleSubmit, reset } = useForm({ defaultValues: { date: new Date().toISOString().slice(0,10), amount: '', description: '', category: '' } })


async function onSubmit(data) {
const tx = {
date: new Date(data.date).toISOString(),
amount: Number(data.amount),
description: data.description,
category: data.category || 'uncategorized',
createdBy: user?.id || 'local',
shared: true
}
await saveTransactionLocally(tx)
reset()
onSaved && onSaved()
}


return (
<div className="card">
<h3>Manual transaction</h3>
<form onSubmit={handleSubmit(onSubmit)}>
<div style={{ marginBottom:8 }}>
<input type="date" {...register('date')} className="input" />
</div>
<div style={{ marginBottom:8 }}>
<input type="number" step="0.01" {...register('amount')} className="input" placeholder="Amount (use negative for expense)" />
</div>
<div style={{ marginBottom:8 }}>
<input {...register('description')} className="input" placeholder="Description" />
</div>
<div style={{ marginBottom:8 }}>
<input {...register('category')} className="input" placeholder="Category" />
</div>
<div style={{ textAlign:'right' }}>
<button className="btn btn-primary" type="submit">Save</button>
</div>
</form>
</div>
)
}