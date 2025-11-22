import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Header() {
  return (
    <header className="bg-slate-900/60 backdrop-blur sticky top-0 z-10 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Order Management</h1>
        <p className="text-slate-300 text-sm">Customers • Orders • Items</p>
      </div>
    </header>
  )
}

function CustomerForm({ onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address })
      })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed')
      const data = await res.json()
      onCreated && onCreated(data)
      setName(''); setEmail(''); setPhone(''); setAddress('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold">New Customer</h3>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <input className="bg-slate-900 text-white rounded px-3 py-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="bg-slate-900 text-white rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="bg-slate-900 text-white rounded px-3 py-2" placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="bg-slate-900 text-white rounded px-3 py-2" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
      </div>
      <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-4 py-2 rounded">{loading? 'Saving...' : 'Add Customer'}</button>
    </form>
  )
}

function CustomersList({ customers, onSelect }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-2">Customers</h3>
      <div className="max-h-64 overflow-auto divide-y divide-slate-700">
        {customers.map(c => (
          <button key={c._id} onClick={()=>onSelect(c)} className="w-full text-left px-2 py-2 hover:bg-slate-700/50">
            <div className="text-white font-medium">{c.name}</div>
            <div className="text-slate-300 text-sm">{c.email}</div>
          </button>
        ))}
        {customers.length===0 && <div className="text-slate-400 text-sm">No customers yet.</div>}
      </div>
    </div>
  )
}

function OrderItemRow({ item, onChange, onRemove }) {
  const update = (patch) => onChange({ ...item, ...patch })
  return (
    <div className="grid grid-cols-5 gap-2 items-center">
      <input className="bg-slate-900 text-white rounded px-2 py-1" placeholder="Item name" value={item.name} onChange={e=>update({name:e.target.value})} />
      <input type="number" min="1" className="bg-slate-900 text-white rounded px-2 py-1" placeholder="Qty" value={item.quantity} onChange={e=>update({quantity: Number(e.target.value)})} />
      <input type="number" min="0" step="0.01" className="bg-slate-900 text-white rounded px-2 py-1" placeholder="Unit price" value={item.unit_price} onChange={e=>update({unit_price: Number(e.target.value)})} />
      <input type="number" min="0" max="100" step="0.01" className="bg-slate-900 text-white rounded px-2 py-1" placeholder="Item % off" value={item.discount_percent} onChange={e=>update({discount_percent: Number(e.target.value)})} />
      <button onClick={onRemove} className="text-red-300 hover:text-red-200">Remove</button>
    </div>
  )
}

function OrderBuilder({ customers, onCreated }) {
  const [selected, setSelected] = useState(null)
  const [items, setItems] = useState([])
  const [orderDiscount, setOrderDiscount] = useState(0)
  const [status, setStatus] = useState('Pending')
  const [creating, setCreating] = useState(false)

  const addItem = () => setItems([...items, { name:'', quantity:1, unit_price:0, discount_percent:0 }])
  const updateItem = (idx, it) => setItems(items.map((x,i)=> i===idx? it : x))
  const removeItem = (idx) => setItems(items.filter((_,i)=> i!==idx))

  const create = async () => {
    if (!selected) return
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: selected._id, status, order_discount_percent: Number(orderDiscount), items })
      })
      const data = await res.json()
      onCreated && onCreated(data)
      setItems([]); setOrderDiscount(0); setStatus('Pending')
    } finally { setCreating(false) }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
      <h3 className="text-white font-semibold">Create Order</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <div className="text-slate-300 text-sm mb-1">Select Customer</div>
          <select className="w-full bg-slate-900 text-white rounded px-2 py-2" value={selected? selected._id : ''} onChange={e=> setSelected(customers.find(c=>c._id===e.target.value) || null)}>
            <option value="">Choose...</option>
            {customers.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div className="text-slate-300 text-sm mb-1">Status</div>
          <select className="w-full bg-slate-900 text-white rounded px-2 py-2" value={status} onChange={e=>setStatus(e.target.value)}>
            {['Pending','Paid','Shipped','Cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="text-slate-300 text-sm mb-1">Order Discount %</div>
          <input type="number" min="0" max="100" step="0.01" className="w-full bg-slate-900 text-white rounded px-2 py-2" value={orderDiscount} onChange={e=>setOrderDiscount(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-white font-medium">Items</div>
          <button onClick={addItem} className="text-blue-300 hover:text-blue-200">+ Add item</button>
        </div>
        {items.length===0 && <div className="text-slate-400 text-sm">No items yet.</div>}
        <div className="space-y-2">
          {items.map((it, idx)=> (
            <OrderItemRow key={idx} item={it} onChange={v=>updateItem(idx, v)} onRemove={()=>removeItem(idx)} />
          ))}
        </div>
        <div className="pt-2">
          <button onClick={create} disabled={!selected || creating} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-4 py-2 rounded">{creating? 'Creating...' : 'Create Order'}</button>
        </div>
      </div>
    </div>
  )
}

function OrdersList({ refreshKey }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const load = async () => {
      setLoading(true)
      const res = await fetch(`${API_BASE}/orders`)
      const data = await res.json()
      setOrders(data)
      setLoading(false)
    }
    load()
  }, [refreshKey])

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-2">Orders</h3>
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <div className="divide-y divide-slate-700">
          {orders.map(o=> (
            <div key={o._id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium">{o.customer_name || o.customer_id}</div>
                  <div className="text-slate-300 text-sm">Status: {o.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">${o.total?.toFixed(2)}</div>
                  <div className="text-slate-400 text-xs">Subtotal ${o.subtotal?.toFixed(2)} • Discounts ${o.discount_total?.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-2 text-slate-300 text-sm">
                {o.items?.map((it, i)=> (
                  <div key={i} className="flex items-center justify-between">
                    <div>- {it.name} x{it.quantity} @ ${it.unit_price.toFixed(2)} ({it.discount_percent}% off)</div>
                    <div>${(it.quantity*it.unit_price*(1-it.discount_percent/100)).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {orders.length===0 && <div className="text-slate-400 text-sm">No orders yet.</div>}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [customers, setCustomers] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(()=>{
    const load = async () => {
      const res = await fetch(`${API_BASE}/customers`)
      setCustomers(await res.json())
    }
    load()
  }, [])

  const onCustomerCreated = (c) => {
    setCustomers(prev=> [c, ...prev])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-4 md:col-span-1">
          <CustomerForm onCreated={onCustomerCreated} />
          <CustomersList customers={customers} onSelect={()=>{}} />
        </div>
        <div className="space-y-4 md:col-span-2">
          <OrderBuilder customers={customers} onCreated={()=> setRefreshKey(v=>v+1)} />
          <OrdersList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  )
}
