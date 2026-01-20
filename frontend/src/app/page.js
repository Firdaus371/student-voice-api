"use client"

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'

export default function Home() {
  const router = useRouter()
  // Data State
  const [aspirations, setAspirations] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // UI State
  const [expandedAspirationId, setExpandedAspirationId] = useState(null)
  const [commentsData, setCommentsData] = useState({})
  const [newComment, setNewComment] = useState('')
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedId, setHighlightedId] = useState(null)
  
  // STATUS VOTE LOKAL
  const [votedLocalIds, setVotedLocalIds] = useState(new Set()) 

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(true) 
  const profileRef = useRef(null)
  const fileInputRef = useRef(null)

  // --- LOGIC UTAMA (LOAD DATA & MEMORY) ---
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      fetchAspirations()

      // Ambil ingatan vote dari browser
      const savedVotes = localStorage.getItem(`votes_${parsedUser.id}`)
      if (savedVotes) {
          setVotedLocalIds(new Set(JSON.parse(savedVotes)))
      }
    } else { 
      setLoading(false) 
    }

    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
        setDarkMode(false)
        document.documentElement.classList.remove('dark')
    } else {
        setDarkMode(true)
        document.documentElement.classList.add('dark')
    }

    // Polling Data
    const interval = setInterval(() => {
        if (userData) {
            fetchAspirations(true)
        }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    if (darkMode) {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
        setDarkMode(false)
        toast.success("Mode Terang Aktif ☀️", { style: { background: '#fff', color: '#000' } })
    } else {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
        setDarkMode(true)
        toast.success("Mode Gelap Aktif 🌙", { style: { background: '#191c24', color: '#fff' } })
    }
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [profileRef])

  const handleLogout = () => {
    toast("Sampai jumpa! 👋")
    setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setIsProfileOpen(false) 
        window.location.reload()
    }, 1000)
  }

  const fetchAspirations = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const res = await axios.get('http://localhost:8080/aspirations')
      
      setAspirations(prev => {
          if (JSON.stringify(prev) === JSON.stringify(res.data.data)) return prev
          return res.data.data || []
      })
      
      if (!silent) setLoading(false)
    } catch (error) { 
        if (!silent) setLoading(false) 
    }
  }

  // --- FUNGSI UPDATE MEMORY ---
  const saveVoteToMemory = (id, isAdding) => {
      setVotedLocalIds(prev => {
          const next = new Set(prev)
          if (isAdding) next.add(id)
          else next.delete(id)
          
          if (user) {
            localStorage.setItem(`votes_${user.id}`, JSON.stringify([...next]))
          }
          return next
      })
  }

  // --- FITUR TOGGLE VOTE (PERBAIKAN: FETCH ULANG SETELAH VOTE) ---
  const handleVote = async (id) => {
    const token = localStorage.getItem('token')
    if (!token) return toast.error("Login dulu untuk vote! 🔒")

    const isAlreadyVoted = votedLocalIds.has(id) 

    // === UNVOTE (HAPUS) ===
    if (isAlreadyVoted) {
        saveVoteToMemory(id, false)
        // Optimistic UI update
        setAspirations(prev => prev.map(asp => 
            asp.id === id ? { ...asp, vote_count: Math.max(0, asp.vote_count - 1) } : asp
        ))

        try {
            await axios.delete(`http://localhost:8080/aspirations/${id}/vote`, { headers: { Authorization: `Bearer ${token}` } })
            toast.success("Vote dibatalkan", { icon: '↩️' })
            fetchAspirations(true) // PENTING: Ambil data asli dari server
        } catch (error) {
            saveVoteToMemory(id, true) // Kembalikan jika gagal
            fetchAspirations(true)
            toast.error("Gagal unvote.")
        }
        return
    }

    // === VOTE (TAMBAH) ===
    saveVoteToMemory(id, true)
    // Optimistic UI update
    setAspirations(prev => prev.map(asp => 
        asp.id === id ? { ...asp, vote_count: asp.vote_count + 1 } : asp
    ))

    try {
      await axios.post(`http://localhost:8080/aspirations/${id}/vote`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success("Dukungan tercatat! 🔥")
      fetchAspirations(true) // PENTING: Ambil data asli dari server agar sinkron
    } catch (error) { 
        if (error.response && error.response.status === 400) {
             toast("Sinkronisasi: Vote aktif.", { icon: '✅' })
             saveVoteToMemory(id, true)
             fetchAspirations(true)
        } else {
            saveVoteToMemory(id, false)
            setAspirations(prev => prev.map(asp => 
                asp.id === id ? { ...asp, vote_count: asp.vote_count - 1 } : asp
            ))
            toast.error("Gagal vote.")
        }
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("avatar", file)
    const toastId = toast.loading("Mengupload foto...")
    try {
        const token = localStorage.getItem('token')
        const res = await axios.post('http://localhost:8080/auth/upload-avatar', formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        const updatedUser = { ...user, avatar_url: res.data.avatar_url }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
        toast.success("Foto profil diperbarui! 📸", { id: toastId })
    } catch (error) { toast.error("Gagal upload", { id: toastId }) }
  }

  const getAvatar = (usr) => {
    if (!usr) return ""
    if (usr.avatar_url && usr.avatar_url !== "") { return `http://localhost:8080${usr.avatar_url}` }
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(usr.name)}&backgroundColor=2A3038,191c24`
  }

  const toggleComments = async (id) => {
    if (expandedAspirationId === id) { setExpandedAspirationId(null) } else {
      setExpandedAspirationId(id)
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`http://localhost:8080/aspirations/${id}/comments`, { headers: { Authorization: `Bearer ${token}` } })
        setCommentsData(prev => ({ ...prev, [id]: res.data.data || [] }))
      } catch (e) { }
    }
  }
  
  const submitComment = async (id) => {
    if (!newComment.trim()) return;
    const token = localStorage.getItem('token')
    try {
        await axios.post(`http://localhost:8080/aspirations/${id}/comments`, { content: newComment }, { headers: { Authorization: `Bearer ${token}` } })
        setNewComment('') 
        const res = await axios.get(`http://localhost:8080/aspirations/${id}/comments`, { headers: { Authorization: `Bearer ${token}` } })
        setCommentsData(prev => ({ ...prev, [id]: res.data.data || [] }))
        toast.success("Komentar terkirim.")
    } catch (e) { toast.error("Gagal mengirim komentar.") }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link aspirasi disalin! 🔗")
  }

  const topTrending = aspirations.length > 0 
    ? aspirations.reduce((prev, current) => (prev.vote_count > current.vote_count) ? prev : current)
    : null;

  const handleTrendingClick = () => {
    if (!topTrending) return
    setSearchQuery('')
    setActiveCategory('Semua')
    setTimeout(() => {
        const element = document.getElementById(`asp-${topTrending.id}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setHighlightedId(topTrending.id)
            toast("Langsung ke TKP! 🚀", { icon: '🔥' })
            setTimeout(() => setHighlightedId(null), 2500)
        }
    }, 100)
  }

  const categories = ['Semua', 'Akademik', 'Fasilitas Kampus', 'Kemahasiswaan/BEM', 'Keamanan']
  const filteredAspirations = aspirations.filter((asp) => {
    const matchCategory = activeCategory === 'Semua' ? true : asp.category === activeCategory
    const matchSearch = asp.title.toLowerCase().includes(searchQuery.toLowerCase()) || asp.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  // --- LANDING PAGE ---
  const LandingPage = () => (
    <div className="animate-fade-in-up">
      <section className="text-center py-24 px-4">
        <div className="inline-block px-4 py-1.5 rounded bg-white dark:bg-[#191c24] mb-8 border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-green-600 dark:text-green-500 font-bold text-xs tracking-widest uppercase">SISTEM ASPIRASI MAHASISWA & KAMPUS</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
          UNU Lampung Timur Maju,<br/>
          Dimulai dari <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Suaramu.</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Wadah resmi mahasiswa UNU Lampung Timur untuk menyampaikan ide, keluhan, dan saran demi kemajuan almamater tercinta.
        </p>
        <div className="flex justify-center gap-4">
            <Link href="/register"><button className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition border border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.3)]">🚀 Gabung Sekarang</button></Link>
            <Link href="/login"><button className="px-8 py-3 bg-white dark:bg-[#191c24] hover:bg-gray-50 dark:hover:bg-[#2A3038] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg font-bold transition">Masuk Akun</button></Link>
        </div>
      </section>
      <footer className="py-8 text-center text-gray-500 dark:text-gray-600 text-sm border-t border-gray-200 dark:border-gray-900 mt-10">&copy; {new Date().getFullYear()} UNU Lampung Timur.</footer>
    </div>
  )

  return (
    <div className="min-h-screen font-sans bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-200 selection:bg-green-500 selection:text-white transition-colors duration-300">
      <Toaster position="top-center" />

      <nav className="bg-white/80 dark:bg-[#191c24]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <span className="text-3xl">🎓</span>
            <div className="flex flex-col">
                <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-wide leading-none">UNU <span className="text-green-600 dark:text-green-500">Voice</span></span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Lampung Timur</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-[#2A3038] hover:bg-gray-200 dark:hover:bg-gray-700 transition text-lg border border-gray-200 dark:border-gray-700">
                {darkMode ? '☀️' : '🌙'}
            </button>
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none transition hover:bg-gray-100 dark:hover:bg-[#2A3038] p-1.5 pr-3 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Halo,</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-none max-w-[100px] truncate">{user.name.split(' ')[0]}</p>
                  </div>
                  <img src={getAvatar(user)} alt="Avatar" className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-[#2A3038] object-cover shadow-sm"/>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#191c24] rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden z-50">
                    <div className="p-5 flex flex-col items-center text-center border-b border-gray-100 dark:border-gray-800">
                      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                        <img src={getAvatar(user)} className="w-20 h-20 rounded-full border-4 border-gray-100 dark:border-[#2A3038] mb-3 bg-gray-100 dark:bg-[#2A3038] object-cover mx-auto shadow-lg"/>
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><span className="text-white text-xs font-bold">Ubah</span></div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                      <p className="text-lg font-bold text-gray-900 dark:text-white truncate w-full">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate w-full mb-3">{user.email}</p>
                      <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">{user.role}</span>
                    </div>
                    <div className="p-2 bg-gray-50 dark:bg-[#0f1115]">
                        {user.role === 'admin' && (<Link href="/admin"><button className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-[#2A3038] hover:text-green-600 dark:hover:text-white rounded-lg transition font-medium">🛡️ Dashboard Admin</button></Link>)}
                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-medium">🚪 Keluar</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (<div className="flex gap-3"><Link href="/login"><button className="text-gray-600 dark:text-gray-300 font-bold text-sm px-4 py-2 hover:bg-gray-100 dark:hover:text-white transition rounded-lg">Masuk</button></Link><Link href="/register"><button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg">Daftar</button></Link></div>)}
          </div>
        </div>
      </nav>

      {!user ? (<LandingPage />) : (
        <div className="p-6 pt-8 max-w-5xl mx-auto animate-fade-in">
            <header className="mb-10 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Aspirasi Kampus 📢</h1>
                <Link href="/submit"><button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-900/20 transition transform hover:scale-105 border border-green-500">✏️ Tulis Aspirasi Baru</button></Link>
            </header>

            {/* SEARCH & TRENDING BAR */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch">
                <div className="relative flex-1">
                    <input type="text" placeholder="Cari aspirasi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#191c24] focus:border-green-500 dark:focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition text-sm shadow-sm"/>
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">🔍</span>
                </div>

                {topTrending && (
                    <div onClick={handleTrendingClick} className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-orange-500/30 flex flex-col justify-center min-w-[160px] max-w-[220px] animate-pulse cursor-pointer hover:animate-none hover:scale-105 transition active:scale-95">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm">🔥</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-100">Trending Topik</span>
                        </div>
                        <p className="font-bold text-sm truncate leading-tight">{topTrending.title}</p>
                        <p className="text-[10px] opacity-90 truncate">{topTrending.vote_count} Suara • {topTrending.category}</p>
                    </div>
                )}

                <div className="bg-white dark:bg-[#191c24] px-6 py-2 rounded-xl border border-gray-300 dark:border-gray-800 shadow-sm flex flex-col justify-center items-center min-w-[100px]">
                    <span className="block text-2xl font-bold text-gray-900 dark:text-white leading-none">{aspirations.length}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mt-1">Total</span>
                </div>
            </div>

            <div className="overflow-x-auto pb-2 scrollbar-hide flex gap-2 mb-8">
                {categories.map((cat) => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-5 py-2 rounded-lg text-sm font-bold transition border ${activeCategory === cat ? 'bg-green-600 border-green-500 text-white shadow' : 'bg-white dark:bg-[#191c24] border-gray-300 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A3038] hover:text-green-700 dark:hover:text-white'}`}>{cat}</button>
                ))}
            </div>

            <main className="space-y-6">
            {loading ? (<div className="text-center py-20 text-gray-500">Memuat data...</div>) : filteredAspirations.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#191c24] rounded-xl border border-dashed border-gray-300 dark:border-gray-800"><h3 className="font-bold text-gray-500 dark:text-gray-400 text-lg">Belum ada aspirasi.</h3></div>
            ) : (
                filteredAspirations.map((asp) => (
                <div 
                    key={asp.id} 
                    id={`asp-${asp.id}`} 
                    className={`bg-white dark:bg-[#191c24] p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-500 ${highlightedId === asp.id ? 'border-orange-500 ring-2 ring-orange-500/50 scale-[1.02] bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                >
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">{asp.title}</h2>
                            <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-md mt-2 inline-block border border-green-200 dark:border-green-900/30">#{asp.category.replace(/\s+/g, '')}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${asp.status === 'Selesai' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>{asp.status}</span>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#0f1115] p-4 rounded-lg border border-gray-100 dark:border-gray-800 mb-5">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{asp.content}</p>
                    </div>
                    
                    {asp.response && (<div className="mb-5 bg-blue-50 dark:bg-[#111827] border-l-4 border-blue-500 p-4 rounded-r-lg"><div className="flex items-center gap-2 mb-2"><span className="text-lg">🏛️</span><span className="font-bold text-blue-900 dark:text-blue-400 text-sm">Respon Kampus:</span></div><p className="text-blue-800 dark:text-blue-300 text-sm italic">"{asp.response}"</p></div>)}

                    {/* KOMENTAR */}
                    {expandedAspirationId === asp.id && (
                        <div className="mb-5 bg-gray-50 dark:bg-black p-5 rounded-lg border border-gray-200 dark:border-gray-800 animate-fade-in">
                            <h4 className="font-bold text-gray-500 dark:text-gray-400 text-xs mb-4 uppercase tracking-wider">Komentar Mahasiswa</h4>
                            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {commentsData[asp.id]?.length > 0 ? (
                                    commentsData[asp.id].map((c) => (
                                        <div key={c.id} className="bg-white dark:bg-[#191c24] p-3 rounded border border-gray-200 dark:border-gray-800 text-sm">
                                            <div className="flex justify-between items-center mb-1"><span className="font-bold text-gray-900 dark:text-white">{c.user_name}</span><span className="text-xs text-gray-400 dark:text-gray-500">{c.created_at}</span></div>
                                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{c.content}</p>
                                        </div>
                                    ))
                                ) : (<p className="text-gray-400 dark:text-gray-600 text-sm italic text-center py-2">Belum ada komentar.</p>)}
                            </div>
                            <div className="flex gap-3">
                                <input type="text" placeholder="Tulis komentar..." className="flex-1 bg-white dark:bg-[#191c24] border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500 text-gray-900 dark:text-white transition" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && submitComment(asp.id)}/>
                                <button onClick={() => submitComment(asp.id)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition border border-green-500 shadow-lg">Kirim</button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 text-sm text-gray-500 gap-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {asp.is_anonymous ? (<div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold border border-gray-300 dark:border-gray-600">?</div>) : (<div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-800">M</div>)}
                            <span className="font-medium text-gray-600 dark:text-gray-400">{asp.is_anonymous ? "Anonim" : "Mahasiswa"}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button 
                                onClick={() => handleVote(asp.id)} 
                                className={`flex items-center gap-2 border transition px-4 py-2 rounded-lg font-medium group ${votedLocalIds.has(asp.id) ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-gray-50 dark:bg-[#0f1115] hover:bg-red-50 dark:hover:bg-[#1f2937] border-gray-200 dark:border-gray-800 hover:border-red-500/50 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                            >
                                <span className={`text-lg transition ${votedLocalIds.has(asp.id) ? 'scale-125' : 'group-hover:scale-110'}`}>❤️</span><span className="font-bold">{asp.vote_count}</span>
                            </button>
                            <button onClick={() => toggleComments(asp.id)} className={`flex items-center gap-2 bg-gray-50 dark:bg-[#0f1115] hover:bg-blue-50 dark:hover:bg-[#1f2937] border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 transition px-4 py-2 rounded-lg font-medium ${expandedAspirationId === asp.id ? 'text-blue-600 dark:text-blue-400 border-blue-500/50' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                <span className="text-lg">💬</span><span>Komentar</span>
                            </button>
                            <button onClick={handleShare} className="flex items-center gap-2 bg-gray-50 dark:bg-[#0f1115] hover:bg-green-50 dark:hover:bg-[#1f2937] border border-gray-200 dark:border-gray-800 hover:border-green-500/50 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition px-3 py-2 rounded-lg">
                                <span className="text-lg">↗️</span>
                            </button>
                        </div>
                    </div>
                </div>
                ))
            )}
            </main>
        </div>
      )}
    </div>
  )
}