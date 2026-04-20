import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { LayoutDashboard, Box, ChevronDown } from 'lucide-react'
import MapViewer from './components/MapViewer'

function App() {
  const [session, setSession] = useState(null)
  const [companies, setCompanies] = useState([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchCompanies()
    })
  }, [])

  const fetchCompanies = async () => {
    const { data } = await supabase.from('companies').select('*').order('name')
    if (data && data.length > 0) {
      setCompanies(data)
      setSelectedCompanyId(data[0].id) // Selecciona la primera por defecto
    }
  }

  return (
    <div className="h-screen flex bg-[#0f1115] text-white overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 flex flex-col p-6 bg-black/20">
        <h1 className="text-xl font-bold text-blue-500 mb-10 tracking-tighter">SAMANDTECH</h1>
        <nav className="flex-1 space-y-2">
          <button className="flex items-center gap-3 w-full p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <LayoutDashboard size={20} /> <span className="text-sm font-medium">Panel Maestro</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col">
        {/* HEADER CON SELECTOR */}
        <header className="h-16 border-b border-gray-800 flex items-center px-8 justify-between bg-black/10">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Cliente:</span>
            <div className="relative">
              <select 
                value={selectedCompanyId} 
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-blue-400 text-xs font-bold rounded-lg px-3 py-1.5 appearance-none pr-8 cursor-pointer focus:border-blue-500 outline-none"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* MAPA */}
        <section className="flex-1 p-8 overflow-hidden">
          {selectedCompanyId && <MapViewer companyId={selectedCompanyId} />}
        </section>
      </main>
    </div>
  )
}

export default App