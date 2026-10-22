'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientesContainer from './components/ClientesContainer';
import StockContainer from './components/StockContainer';

// URL real de tu proyecto Supabase (sin /rest/v1/ al final)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tqfpcogdvhtvvhdqewdg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(
  supabaseUrl.trim(),
  supabaseAnonKey.trim()
);

export default function Home() {
  const [activeTab, setActiveTab] = useState('clientes');

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', color: '#2b2927', fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER SUPERIOR */}
      <header style={{ backgroundColor: '#fcfbf9', borderBottom: '2px solid #e5e0d8', padding: '0.75rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* LOGO E IDENTIDAD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src="/logo.png" 
              alt="Agromecánica de Ariel Raggi" 
              style={{ height: '52px', objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#dc2626', letterSpacing: '-0.02em' }}>
                AGROMECÁNICA
              </h1>
              <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: '600' }}>
                Gestión Integral & Stock
              </span>
            </div>
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <nav style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#ebe6dc', padding: '0.35rem', borderRadius: '8px', border: '1px solid #dcd5c9' }}>
            <button
              onClick={() => setActiveTab('stock')}
              style={{
                padding: '0.50rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'stock' ? '#15803d' : 'transparent',
                color: activeTab === 'stock' ? '#ffffff' : '#57534e'
              }}
            >
              📦 Stock e Inventario
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              style={{
                padding: '0.50rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'clientes' ? '#15803d' : 'transparent',
                color: activeTab === 'clientes' ? '#ffffff' : '#57534e'
              }}
            >
              👥 Clientes & Riesgo
            </button>
          </nav>

        </div>
      </header>

      {/* CONTENIDO DE MÓDULOS */}
      <section style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {activeTab === 'stock' && <StockContainer supabase={supabase} />}
        {activeTab === 'clientes' && <ClientesContainer supabase={supabase} />}
      </section>
    </main>
  );
}
