import React, { useState } from 'react'
import Login from './components/Login'
import ManualEntry from './components/ManualEntry'
import FileImporter from './components/FileImporter'
import Dashboard from './components/Dashboard'


export default function App() {
const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
const [tick, setTick] = useState(0)


function onSaved() { setTick(t => t + 1) }
function onImported() { setTick(t => t + 1) }


if (!user) return <Login onLogin={u=>setUser(u)} />


return (
<div className="container">
<div className="header" style={{ marginBottom:12 }}>
<h1>Couples Finances</h1>
<div>
<div className="small">Signed in as {user.name || user.email}</div>
<div style={{ marginTop:6 }}>
<button className="btn" onClick={() => { localStorage.removeItem('user'); setUser(null) }}>Sign out</button>
</div>
</div>
</div>


<div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:16 }}>
<div>
<Dashboard key={tick} />
</div>
<div>
<ManualEntry onSaved={onSaved} user={user} />
<FileImporter onImported={onImported} user={user} />
<div className="card">
<h3>Quick actions</h3>
<p className="small">Define budgets & goals later — this scaffold focuses on login, metrics, manual and file entry and PWA setup.</p>
</div>
</div>
</div>
</div>
)
}