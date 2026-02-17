'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, QrCode, ArrowRight, Sparkles, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-orange-500/8 rounded-full blur-[120px] animate-gradient" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[45%] h-[45%] bg-blue-500/6 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[25%] h-[25%] bg-violet-500/4 rounded-full blur-[100px]" />
      </div>

      {/* Noise Overlay */}
      <div className="absolute inset-0 noise pointer-events-none" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center animate-fadeIn">
        {/* Logo */}
        <div className="mb-10 relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-orange-600/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative w-20 h-20 flex items-center justify-center animate-float">
            <Image 
              src="/logo.png" 
              alt="Logo Potenciarte" 
              width={80}
              height={80}
              className="object-contain drop-shadow-2xl" 
            />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight text-center">
          <span className="gradient-text">Potenciarte</span>
        </h1>
        
        <p className="text-base md:text-lg text-zinc-400 mb-14 max-w-lg text-center leading-relaxed font-light">
          Gestión integral de eventos, acreditación por QR y diplomas digitales.
        </p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
          {/* Admin Card */}
          <Link 
            href="/dashboard"
            className="group relative p-7 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-orange-500/30 transition-all duration-500 hover:shadow-[var(--shadow-glow-primary)] flex flex-col items-start overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-gradient-to-br from-orange-500/15 to-orange-600/5 p-3.5 rounded-xl mb-5 group-hover:scale-105 transition-transform duration-500">
              <Calendar className="w-7 h-7 text-orange-500" />
            </div>
            
            <h2 className="relative text-xl font-bold mb-2 flex items-center gap-2">
              Gestionar Eventos
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </h2>
            <p className="relative text-zinc-500 text-sm leading-relaxed">
              Panel de administración para crear eventos, cargar asistentes y enviar diplomas.
            </p>
          </Link>

          {/* Staff Card */}
          <Link 
            href="/events"
            className="group relative p-7 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-blue-500/30 transition-all duration-500 hover:shadow-[var(--shadow-glow-secondary)] flex flex-col items-start overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-gradient-to-br from-blue-500/15 to-blue-600/5 p-3.5 rounded-xl mb-5 group-hover:scale-105 transition-transform duration-500">
              <QrCode className="w-7 h-7 text-blue-500" />
            </div>
            
            <h2 className="relative text-xl font-bold mb-2 flex items-center gap-2">
              Portal de Staff
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </h2>
            <p className="relative text-zinc-500 text-sm leading-relaxed">
              Herramienta de escaneo QR y check-in rápido para el personal en terreno.
            </p>
          </Link>
        </div>

        {/* Features badges */}
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {[
            { icon: Shield, text: 'Check-in seguro' },
            { icon: Sparkles, text: 'Diplomas automáticos' },
            { icon: QrCode, text: 'Tickets QR' },
          ].map((feature) => (
            <div key={feature.text} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs text-zinc-400 font-medium">
              <feature.icon className="w-3.5 h-3.5 text-orange-500/70" />
              {feature.text}
            </div>
          ))}
        </div>

        <footer className="mt-16 text-zinc-600 text-xs font-medium tracking-wide">
          © {new Date().getFullYear()} Potenciarte · Sporh Solutions
        </footer>
      </div>
    </div>
  );
}
