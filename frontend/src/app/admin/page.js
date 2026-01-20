"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

export default function AdminDashboard() {
  const router = useRouter()
  
  // --- STATE DATA ---
  const [aspirations, setAspirations] = useState([])
  const [users, setUsers] = useState([]) // Data Pengguna
  const [stats, setStats] = useState(null)
  
  // --- STATE UI ---
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('aspirations') // Tab Aktif: 'aspirations' | 'users'
  const [replyMsg, setReplyMsg] = useState({})
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) { setCurrentUser(JSON.parse(userData)) }
    fetchData()
  }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    try {
      const headers = { Authorization: `Bearer ${token}` }
      
      // 1. Ambil Stats
      const resStats = await axios.get('http://localhost:8080/aspirations/stats', { headers })
      setStats(resStats.data.data) 
      
      // 2. Ambil Daftar Aspirasi
      const resAsp = await axios.get('http://localhost:8080/aspirations', { headers })
      setAspirations(resAsp.data.data || [])
      
      // 3. Ambil Daftar User (Fitur Baru)
      // Kita bungkus try-catch biar kalau error satu, yang lain tetap jalan
      try {
          const resUsers = await axios.get('http://localhost:8080/auth/users', { headers })
          setUsers(resUsers.data.data || [])
      } catch (err) {
          console.log("Gagal ambil data user (Mungkin bukan admin):", err)
      }
      
      setLoading(false)
    } catch (error) {
      console.error(error)
      toast.error("Gagal memuat data dashboard")
      setLoading(false)
    }
  }

  // --- ACTIONS: ASPIRASI ---
  const updateStatus = async (id, newStatus) => {
    const token = localStorage.getItem('token')
    await axios.patch(`http://localhost:8080/aspirations/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } })
    toast.success("Status diperbarui!")
    fetchData()
  }

  const sendReply = async (id) => {
    const token = localStorage.getItem('token')
    await axios.post(`http://localhost:8080/aspirations/${id}/reply`, { message: replyMsg[id] }, { headers: { Authorization: `Bearer ${token}` } })
    toast.success("Balasan terkirim!")
    fetchData()
  }

  const deleteAspiration = async (id) => {
    if(!confirm("Hapus aspirasi ini permanen?")) return
    const token = localStorage.getItem('token')
    await axios.delete(`http://localhost:8080/aspirations/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    toast.success("Aspirasi dihapus")
    fetchData()
  }

  // --- ACTIONS: USERS (BARU) ---
  const deleteUser = async (id, name) => {
    if(!confirm(`⚠️ PERINGATAN KERAS!\n\nMenghapus user "${name}" akan menghapus juga SEMUA aspirasi dan vote yang pernah dia buat.\n\nYakin ingin melanjutkan?`)) return
    
    const token = localStorage.getItem('token')
    const toastId = toast.loading("Menghapus user...")
    try {
        await axios.delete(`http://localhost:8080/auth/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        toast.success("User berhasil dihapus", { id: toastId })
        fetchData() // Refresh data
    } catch (error) {
        console.error(error)
        toast.error("Gagal menghapus user", { id: toastId })
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Dashboard Admin...</div>

  return (
    <div className="min-h-screen bg-black font-sans pb-20 text-gray-300">
      <Toaster position="top-center" toastOptions={{ style: { background: '#191c24', color: '#fff', border: '1px solid #333' } }}/>

      {/* NAVBAR */}
      <nav className="bg-[#191c24] border-b border-gray-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <span className="text-2xl">🛡️</span>
             <span className="font-bold text-xl text-white tracking-wide">Admin <span className="text-green-500">Panel</span></span>
          </div>
          <Link href="/"><button className="text-sm text-blue-400 font-bold hover:text-white transition">← Kembali ke Home</button></Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        
        {/* STATS CARDS */}
        {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                <div className="bg-[#191c24] p-6 rounded-xl border border-gray-800 shadow-md">
                    <p className="text-gray-500 text-xs font-bold uppercase">Total Aspirasi</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{stats.total_aspirations}</p>
                </div>
                <div className="bg-[#191c24] p-6 rounded-xl border border-gray-800 shadow-md">
                    <p className="text-gray-500 text-xs font-bold uppercase text-yellow-500">Perlu Tinjauan</p>
                    <p className="text-3xl font-extrabold text-yellow-500 mt-1">{stats.total_pending}</p>
                </div>
                <div className="bg-[#191c24] p-6 rounded-xl border border-gray-800 shadow-md">
                    <p className="text-gray-500 text-xs font-bold uppercase text-green-500">Selesai</p>
                    <p className="text-3xl font-extrabold text-green-500 mt-1">{stats.total_completed}</p>
                </div>
                <div className="bg-[#191c24] p-6 rounded-xl border border-gray-800 shadow-md">
                    <p className="text-gray-500 text-xs font-bold uppercase text-purple-500">Topik Terpanas</p>
                    <p className="text-xl font-bold text-purple-400 truncate mt-1">{stats.top_category}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-900/40 to-[#191c24] p-6 rounded-xl border border-orange-500/30 shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-20 text-4xl group-hover:scale-110 transition">🔥</div>
                    <p className="text-orange-500 text-xs font-bold uppercase tracking-wider">Juara Vote</p>
                    <p className="text-lg font-bold text-white truncate mt-1" title={stats.most_voted_title}>
                        {stats.most_voted_title || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Dukungan: <span className="text-orange-400 font-bold">{stats.most_voted_total} Suara</span>
                    </p>
                </div>
            </div>
        )}

        {/* TAB NAVIGATION (INI SAKLARNYA) */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
            <button 
                onClick={() => setActiveTab('aspirations')} 
                className={`pb-3 px-4 font-bold text-sm transition ${activeTab === 'aspirations' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
                📝 Kelola Aspirasi
            </button>
            <button 
                onClick={() => setActiveTab('users')} 
                className={`pb-3 px-4 font-bold text-sm transition ${activeTab === 'users' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500 hover:text-white'}`}
            >
                👥 Kelola Pengguna
            </button>
        </div>

        {/* --- KONTEN 1: TABEL ASPIRASI --- */}
        {activeTab === 'aspirations' && (
            <div className="space-y-6">
                {aspirations.length === 0 ? (
                    <div className="text-center py-10 bg-[#191c24] rounded-xl border border-dashed border-gray-700 text-gray-500">Belum ada aspirasi masuk.</div>
                ) : aspirations.map((asp) => (
                    <div key={asp.id} className="bg-[#191c24] p-6 rounded-xl border border-gray-800 shadow-sm hover:border-gray-700 transition">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{asp.title}</h3>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600">{asp.category}</span>
                                    <span className="text-xs bg-red-900/20 text-red-400 px-2 py-1 rounded border border-red-900/30">❤️ {asp.vote_count} Vote</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <select value={asp.status} onChange={(e) => updateStatus(asp.id, e.target.value)} className="text-xs border border-gray-600 rounded p-1 bg-[#2A3038] text-white focus:border-green-500 outline-none cursor-pointer">
                                    <option value="Menunggu Tinjauan">Menunggu</option><option value="Sedang Ditindaklanjuti">Proses</option><option value="Selesai">Selesai</option><option value="Terkunci">Terkunci</option>
                                </select>
                                <button onClick={() => deleteAspiration(asp.id)} className="text-xs bg-red-900/30 text-red-400 border border-red-900 px-3 py-1 rounded font-bold hover:bg-red-900/50 transition">Hapus</button>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 bg-[#0f1115] p-3 rounded-lg border border-gray-800">{asp.content}</p>
                        
                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <p className="text-xs font-bold text-gray-500 mb-2">Balasan Admin:</p>
                            {asp.response ? (
                                <div className="bg-green-900/20 text-green-400 text-sm p-3 rounded-lg border border-green-900/50 flex items-center gap-2">
                                    <span>✅</span> {asp.response}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Tulis balasan resmi..." className="flex-1 border border-gray-600 bg-[#2A3038] rounded px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-green-500 transition" onChange={(e) => setReplyMsg({...replyMsg, [asp.id]: e.target.value})}/>
                                    <button onClick={() => sendReply(asp.id)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 transition shadow-lg shadow-green-900/20">Kirim</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- KONTEN 2: TABEL PENGGUNA (INI YANG KEMARIN BELUM ADA) --- */}
        {activeTab === 'users' && (
            <div className="bg-[#191c24] rounded-xl border border-gray-800 overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-[#0f1115] text-white font-bold border-b border-gray-700">
                            <tr>
                                <th className="p-4">Avatar</th>
                                <th className="p-4">Nama Lengkap</th>
                                <th className="p-4">NIM</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-[#2A3038] transition">
                                    <td className="p-4">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-gray-600">
                                            {u.avatar_url ? (
                                                <img src={`http://localhost:8080${u.avatar_url}`} alt={u.name} className="w-full h-full object-cover"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">{u.name.charAt(0)}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-white">{u.name}</td>
                                    <td className="p-4 font-mono text-gray-400">{u.nim || '-'}</td>
                                    <td className="p-4">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border border-purple-800' : 'bg-green-900/30 text-green-400 border border-green-800'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {currentUser && currentUser.email !== u.email ? (
                                            <button 
                                                onClick={() => deleteUser(u.id, u.name)} 
                                                className="bg-red-900/20 text-red-500 border border-red-900/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-900/50 transition flex items-center gap-1 mx-auto"
                                            >
                                                <span>🗑️</span> Hapus
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-600 italic">Akun Anda</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {users.length === 0 && (
                        <div className="p-8 text-center text-gray-500 italic">Tidak ada data pengguna.</div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}