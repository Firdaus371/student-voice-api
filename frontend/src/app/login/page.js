"use client"

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading("Sedang masuk...")

    try {
      const res = await axios.post('http://localhost:8080/auth/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      toast.success("Berhasil! 🚀", { id: toastId })
      setTimeout(() => router.push('/'), 1000)
    } catch (error) {
      toast.error("Gagal Masuk ❌", { id: toastId })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans">
      <Toaster position="top-center" toastOptions={{ style: { background: '#191c24', color: '#fff', border: '1px solid #333' } }}/> 
      
      <div className="bg-[#191c24] p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full border border-gray-800">
        <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h2 className="text-2xl font-bold text-white mt-4">Login Admin/Mhs</h2>
            <p className="text-gray-500 text-sm mt-1">Masuk untuk melanjutkan.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Email</label>
            <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#2A3038] focus:border-green-500 outline-none text-white placeholder-gray-500 transition" 
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Password</label>
            <input type="password" className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#2A3038] focus:border-green-500 outline-none text-white placeholder-gray-500 transition" 
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md mt-2">
            {loading ? '...' : 'Masuk'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun? <Link href="/register" className="text-green-500 font-bold hover:text-green-400">Daftar</Link>
        </p>
      </div>
    </div>
  )
}