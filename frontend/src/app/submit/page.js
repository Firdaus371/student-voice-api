"use client"

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Toaster, toast } from 'react-hot-toast' // IMPORT

export default function SubmitAspiration() {
  const router = useRouter()
  const [form, setForm] = useState({ title: '', content: '', category: 'Akademik', is_anonymous: false })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const toastId = toast.loading("Mengirim aspirasi...") // LOADING

    try {
      const token = localStorage.getItem('token')
      await axios.post('http://localhost:8080/aspirations', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Aspirasi Berhasil Terkirim! 📢", { id: toastId }) // SUKSES
      setTimeout(() => router.push('/'), 1500)
    } catch (error) {
      toast.error("Gagal mengirim. Coba lagi! ❌", { id: toastId }) // ERROR
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <Toaster position="top-center"/>
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-gray-100">
        <div className="text-center mb-6">
            <span className="text-4xl">✏️</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2">Tulis Aspirasi</h1>
            <p className="text-gray-500 text-sm">Suarakan keresahanmu dengan bijak.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Judul Singkat (Cth: WiFi Lemot)" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 outline-none text-gray-900" onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          
          <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 outline-none text-gray-900 bg-white" onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="Akademik">Akademik</option>
            <option value="Fasilitas Kampus">Fasilitas Kampus</option>
            <option value="Kemahasiswaan/BEM">Kemahasiswaan/BEM</option>
            <option value="Keamanan">Keamanan</option>
          </select>

          <textarea rows="5" placeholder="Jelaskan detail aspirasimu di sini..." className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 outline-none text-gray-900" onChange={(e) => setForm({ ...form, content: e.target.value })} required></textarea>

          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <input type="checkbox" id="anon" className="w-5 h-5 text-green-600 rounded focus:ring-green-500" checked={form.is_anonymous} onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} />
            <label htmlFor="anon" className="text-gray-700 font-medium text-sm cursor-pointer select-none">🥷 Kirim sebagai Anonim (Rahasia)</label>
          </div>

          <div className="flex gap-3 mt-4">
            <Link href="/" className="w-1/3"><button type="button" className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button></Link>
            <button type="submit" disabled={loading} className="w-2/3 bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-70">
                {loading ? 'Mengirim...' : '🚀 Kirim Aspirasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}