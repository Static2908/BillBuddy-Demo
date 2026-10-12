import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data } = await authApi.login(form)
      login(data)
      navigate('/')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to sign in with those credentials.')
    } finally {
      setBusy(false)
    }
  }

  return <AuthForm title="Welcome back" submitLabel="Sign in" form={form} setForm={setForm} error={error} busy={busy} onSubmit={submit} footer={<span>New to BillBuddy? <Link className="text-indigo-600" to="/register">Create an account</Link></span>} />
}

export default LoginPage

function AuthForm({ title, submitLabel, form, setForm, error, busy, onSubmit, footer }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">BillBuddy</p><h1 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h1></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required minLength={8} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3" /></label>
        <button disabled={busy} className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? 'Please wait…' : submitLabel}</button>
        <p className="text-center text-sm text-slate-500">{footer}</p>
      </form>
    </main>
  )
}
