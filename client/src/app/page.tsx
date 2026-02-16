'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, QrCode, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="mb-8 relative group">
           {/* Logo Container */}
           <div className="w-24 h-24 relative flex items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo Potenciarte" 
                width={96}
                height={96}
                className="object-contain" 
              />
           </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tight text-center">
          Plataforma Potenciarte
        </h1>
        
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl text-center leading-relaxed">
          Gestión integral de eventos, acreditación por QR y diplomas digitales.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Admin Card */}
          <Link 
            href="/dashboard"
            className="group relative p-8 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-orange-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)] flex flex-col items-start overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="bg-orange-500/10 p-3 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              Gestionar Eventos
              <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Panel de administración para crear eventos, cargar asistentes y enviar diplomas.
            </p>
          </Link>

          {/* Staff Card */}
          <Link 
            href="/events"
            className="group relative p-8 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] flex flex-col items-start overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="bg-blue-500/10 p-3 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
              <QrCode className="w-8 h-8 text-blue-500" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              Portal de Staff
              <ArrowRight className="w-5 h-5 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Herramienta de escaneo QR y Check-in rápido para el personal en terreno.
            </p>
          </Link>
        </div>

        <footer className="mt-16 text-zinc-600 text-sm">
          © {new Date().getFullYear()} Potenciarte
        </footer>
      </div>
    </div>
  );
}
