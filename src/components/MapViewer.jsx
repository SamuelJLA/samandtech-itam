import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  Monitor, 
  Server, 
  Laptop, 
  Router, 
  Printer, 
  Network, 
  Cpu, 
  Box, 
  Copy, 
  X 
} from 'lucide-react'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// 1. Repositorio de iconos fuera del componente para evitar re-renderizados innecesarios
const ICON_REPO = {
  pc: Monitor,
  server: Server,
  laptop: Laptop,
  router: Router,
  printer: Printer,
  switch: Network,
  ups: Cpu,
  default: Box
}

const MapViewer = ({ companyId }) => {
  const [mapData, setMapData] = useState(null)
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [coordsPopup, setCoordsPopup] = useState(null)

  useEffect(() => {
    const loadMapAndAssets = async () => {
      if (!companyId) return
      setLoading(true)
      
      const { data: map } = await supabase
        .from('maps_config')
        .select('*')
        .eq('company_id', companyId)
        .single()
        
      const { data: items } = await supabase
        .from('assets')
        .select(`*, tickets(status, priority)`)
        .eq('company_id', companyId)
        
      setMapData(map)
      setAssets(items || [])
      setLoading(false)
    }
    loadMapAndAssets()
  }, [companyId])

  const handleDoubleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoordsPopup({ x: x.toFixed(2), y: y.toFixed(2) });
  };

  const getStatusStyle = (asset) => {
    const openTickets = asset.tickets?.filter(t => t.status === 'open') || []
    if (openTickets.some(t => t.priority === 'critical' || t.priority === 'high')) {
      return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse"
    }
    return openTickets.length > 0 ? "bg-yellow-500" : "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
  }

  if (loading) return <div className="h-full flex items-center justify-center text-blue-400 font-mono italic">Sincronizando satélite...</div>
  if (!mapData) return <div className="h-full flex items-center justify-center text-gray-500 italic border-2 border-dashed border-gray-800 rounded-3xl">Sin plano configurado</div>

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden border border-gray-800 bg-black/40 relative cursor-grab active:cursor-grabbing">
      
      <TransformWrapper
        initialScale={1}
        minScale={0.5} 
        maxScale={4}
        centerOnInit={true}
        limitToBounds={false}
        doubleClick={{ disabled: true }}
        panning={{ 
          bounce: false,
          velocityDisabled: false 
        }}
      >
        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%" }}>
          <div className="relative" onDoubleClick={handleDoubleClick}>
            
            <img 
              src={mapData.image_url} 
              className="w-full h-auto min-w-[1000px] object-contain opacity-70 pointer-events-none" 
              alt="Plano" 
            />

            {/* POPUP DE COORDENADAS */}
            {coordsPopup && (
              <div 
                className="absolute z-[100] bg-gray-900/95 backdrop-blur-md border border-blue-500 p-3 rounded-xl shadow-2xl text-white min-w-[140px]"
                style={{ 
                  top: `${coordsPopup.y}%`, 
                  left: `${coordsPopup.x}%`, 
                  transform: 'translate(10px, -100%)'
                }}
              >
                <div className="flex justify-between items-center border-b border-gray-800 pb-1 mb-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase">Coordenadas</span>
                  <button onClick={(e) => { e.stopPropagation(); setCoordsPopup(null); }} className="hover:text-red-400">
                    <X size={14} />
                  </button>
                </div>
                <div className="font-mono text-[11px] mb-2 text-gray-300">
                  <p>X: {coordsPopup.x}</p>
                  <p>Y: {coordsPopup.y}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${coordsPopup.x}, ${coordsPopup.y}`);
                    setCoordsPopup(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-[10px] py-1 rounded font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy size={12} /> Copiar
                </button>
              </div>
            )}

            {/* ACTIVOS DINÁMICOS */}
            {assets.map((asset) => {
              // 2. Selección dinámica del icono según categoría
              const DeviceIcon = ICON_REPO[asset.category?.toLowerCase()] || ICON_REPO.default

              return (
                <div 
                  key={asset.id}
                  className="absolute group"
                  style={{ top: `${asset.y_pos}%`, left: `${asset.x_pos}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={`p-2 rounded-full border-2 border-white/10 transition-transform group-hover:scale-125 ${getStatusStyle(asset)}`}>
                    <DeviceIcon size={14} className="text-white" />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block bg-black/90 border border-gray-700 p-2 rounded shadow-2xl z-50 min-w-[100px] pointer-events-none text-center">
                    <p className="text-[9px] font-bold text-blue-400 uppercase">{asset.name}</p>
                    <p className="text-[7px] text-gray-500 uppercase">{asset.category}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </TransformComponent>
      </TransformWrapper>

      <div className="absolute bottom-4 left-4 flex gap-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Modo Exploración Activo</span>
          </div>
      </div>
    </div>
  )
}

export default MapViewer