import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (isAuthenticated) return <Navigate to="/" replace />

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await authApi.register(form)
      navigate('/login')
    } catch (requestError) {
      const details = requestError.response?.data?.details
      setError(details ? Object.values(details).join(' ') : requestError.response?.data?.error || 'Unable to register.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">BillBuddy</p><h1 className="mt-2 text-2xl font-semibold text-slate-900">Create your account</h1></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">Full name<input required maxLength={100} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? 'Creating…' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link className="text-indigo-600" to="/login">Sign in</Link></p>
      </form>
    </main>
  )
}

export default RegisterPage
