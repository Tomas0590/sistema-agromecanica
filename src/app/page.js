'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientesContainer from './components/ClientesContainer';
import StockContainer from './components/StockContainer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [activeTab, setActiveTab] = useState('stock');

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f4f3ed', color: '#1c1917', fontFamily: 'system-ui, sans-serif' }}>
      {/* HEADER SUPERIOR CON LOGO */}
      <header style={{ backgroundColor: '#faf9f5', borderBottom: '2px solid #e5e3da', padding: '0.85rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* LOGO E IDENTIDAD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img 
              src="/logo.png" 
              alt="Agromecánica" 
              style={{ height: '52px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900', color: '#dc2626', letterSpacing: '-0.02em', lineHeight: 1 }}>
                AGROMECÁNICA
              </h1>
              <span style={{ fontSize: '0.8rem', color: '#57534e', fontWeight: '700' }}>
                de Ariel Raggi
              </span>
            </div>
          </div>

          {/* SOLAPAS DE NAVEGACIÓN */}
          <nav style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#e7e5dd', padding: '0.3rem', borderRadius: '8px', border: '1px solid #d6d3d1' }}>
            <button
              onClick={() => setActiveTab('stock')}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: activeTab === 'stock' ? '#15803d' : 'transparent',
                color: activeTab === 'stock' ? '#ffffff' : '#57534e',
                boxShadow: activeTab === 'stock' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              📦 Stock e Inventario
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: activeTab === 'clientes' ? '#15803d' : 'transparent',
                color: activeTab === 'clientes' ? '#ffffff' : '#57534e',
                boxShadow: activeTab === 'clientes' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              👥 Clientes & Riesgo
            </button>
          </nav>

        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <section style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {activeTab === 'stock' && <StockContainer supabase={supabase} />}
        {activeTab === 'clientes' && <ClientesContainer supabase={supabase} />}
      </section>
    </main>
  );
}
