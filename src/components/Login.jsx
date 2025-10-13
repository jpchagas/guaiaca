import React, { useState, useEffect } from 'react'


// Minimal local "auth" for demo: store user in localStorage. Replace with Firebase/Auth for production.
export default function Login({ onLogin }) {
const [email, setEmail] = useState('')
const [name, setName] = useState('')


useEffect(() => {
const u = JSON.parse(localStorage.getItem('user') || 'null')
if (u) onLogin(u)
}, [])


function handleLogin(e) {
e.preventDefault()
const user = { id: email, email, name: name || email.split('@')[0] }
localStorage.setItem('user', JSON.stringify(user))
onLogin(user)
}


return (
<div className="card" style={{ maxWidth:420, margin:'24px auto' }}>
<h2>Sign in / Join</h2>
<form onSubmit={handleLogin}>
<div style={{ marginBottom:8 }}>
<label className="small">Name (optional)</label>
<input value={name} onChange={e=>setName(e.target.value)} className="input" />
</div>
<div style={{ marginBottom:8 }}>
<label className="small">Email</label>
<input value={email} onChange={e=>setEmail(e.target.value)} className="input" />
</div>
<div style={{ textAlign:'right' }}>
<button className="btn btn-primary">Continue</button>
</div>
</form>
</div>
)
}