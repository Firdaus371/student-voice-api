"use client"

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', nim: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading("Mendaftarkan...")

    try {
      await axios.post('http://localhost:8080/auth/register', form)
      toast.success("Akun Dibuat! Silakan Login 🟢", { id: toastId })
      setTimeout(() => router.push('/login'), 1500)
    } catch (error) {
      toast.error("Gagal. Email/NIM mungkin sudah ada.", { id: toastId })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans">
      <Toaster position="top-center" toastOptions={{ style: { background: '#191c24', color: '#fff', border: '1px solid #333' } }}/> 

      <div className="bg-[#191c24] p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full border border-gray-800">
        <div className="text-center mb-6">
            <span className="text-4xl">🚀</span>
            <h2 className="text-3xl font-bold text-white mt-4">Buat Akun</h2>
            <p className="text-gray-500 text-sm mt-2">Bergabung dengan komunitas UNU.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Nama Lengkap</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#2A3038] focus:border-green-500 outline-none text-white mt-1" onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
             <label className="text-xs font-bold text-gray-400 uppercase">NIM (Opsional)</label>
            <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#2A3038] focus:border-green-500 outline-none text-white mt-1" onChange={(e) => setForm({ ...form, nim: e.target.value })} />
          </div>
          <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#2A3038] focus:border-green-500 outline-none text-white mt-1" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
             <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
            <input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-[#2A3038] focus:border-green-500 outline-none text-white mt-1" onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg mt-4">
            {loading ? '...' : 'Daftar Sekarang'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          Sudah punya akun? <Link href="/login" className="text-blue-500 font-bold hover:text-blue-400">Login</Link>
        </p>
      </div>
    </div>
  )
}