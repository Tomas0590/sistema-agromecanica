'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargandoBCRA, setCargandoBCRA] = useState(false);
  const [cargandoNombres, setCargandoNombres] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const { data, error } = await supabase.from('clientes').select('*').order('razon_social', { ascending: true });
    if (!error && data) setClientes(data);
  };

  const clientesFiltrados = clientes.filter((c) => {
    const termino = busqueda.toLowerCase();
    return (
      (c.razon_social || '').toLowerCase().includes(termino) ||
      (c.cuit || '').includes(termino) ||
      (c.localidad || '').toLowerCase().includes(termino)
    );
  });

  return (
    <div>
      {/* HEADER MÓDULO CLIENTES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#1c1917', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
          Gestión de Clientes y Cuentas Corrientes
        </h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ➕ Nuevo Cliente
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE TABLA EN BEIGE/BLANCO CÁLIDO */}
      <div style={{ backgroundColor: '#faf9f5', borderRadius: '10px', border: '1px solid #e5e3da', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        
        {/* BUSCADOR */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar cliente por Razón Social, CUIT, Localidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: '100%', maxWidth: '450px', padding: '0.6rem 0.85rem', borderRadius: '7px', border: '1px solid #d6d3d1', backgroundColor: '#ffffff', color: '#1c1917', fontSize: '0.875rem' }}
          />
        </div>

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0eee6', borderBottom: '2px solid #e5e3da', color: '#44403c' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: '800' }}>Razón Social</th>
                ¡Mala mía! Tuvimos un pequeño temblor en el sistema. 

Tenés toda la razón: ese blanco puro encandila y las tablas oscuras desentonan por completo con el resto de la pantalla.

Vamos a unificar todo con un **tono beige suave / arena** (`#f5f2eb`) para la base y tarjetas/tablas en blanco cálido (`#fcfbf9`) con bordes suaves (`#e2ddd3`). Así no te quema la vista y queda 100% integrado.

---

### 1. Actualizar `src/app/page.js`

Reemplazá el contenido de **`src/app/page.js`** en GitHub:

```javascript
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
                color: activeTab === 'stock' ? '#ffffff' : '#57534e',
                boxShadow: activeTab === 'stock' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
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
                color: activeTab === 'clientes' ? '#ffffff' : '#57534e',
                boxShadow: activeTab === 'clientes' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              👥 Clientes & Riesgo
            </button>
          </nav>

        </div>
      </header>

      {/* CONTENIDO DE MÓDULOS */}
      <section style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        {activeTab === 'stock' && <StockContainer supabase="{supabase}"/>}
        {activeTab === 'clientes' && <ClientesContainer supabase="{supabase}"/>}
      </section>
    </main>
  );
}
