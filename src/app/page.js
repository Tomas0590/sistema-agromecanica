'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientesContainer from './components/ClientesContainer';

// Instancia estándar de Supabase usando tus variables de entorno existentes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [session, setSession] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState('clientes');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', padding: '1.5rem', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* NAVBAR SUPERIOR CON LOGO Y NAVEGACIÓN */}
        <header style={{ 
          backgroundColor: '#fcfbf9', 
          borderRadius: '12px', 
          border: '1px solid #e5e0d8', 
          padding: '1rem 1.5rem', 
          marginBottom: '1.5rem',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#dc2626', letterSpacing: '-0.02em' }}>
              Agromecanica
            </h1>

            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPestanaActiva('clientes')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: pestanaActiva === 'clientes' ? '#eeeae1' : 'transparent',
                  color: pestanaActiva === 'clientes' ? '#1c1917' : '#78716c',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                👥 Clientes y Deudores
              </button>

              <button
                onClick={() => setPestanaActiva('stock')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: pestanaActiva === 'stock' ? '#eeeae1' : 'transparent',
                  color: pestanaActiva === 'stock' ? '#1c1917' : '#78716c',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                📦 Stock / Maquinarias
              </button>
            </nav>
          </div>

          {session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#57534e', fontWeight: '600' }}>
                👤 {session.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: '#eeeae1',
                  border: '1px solid #dcd5c9',
                  color: '#44403c',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </header>

        {/* CONTENIDO SEGÚN PESTAÑA */}
        {pestanaActiva === 'clientes' ? (
          <ClientesContainer supabase={supabase} />
        ) : (
          <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '3rem', textAlign: 'center', color: '#78716c' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2b2927' }}>📦 Módulo de Stock y Maquinarias</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Sección en desarrollo para la gestión del inventario de Agromecanica.</p>
          </div>
        )}

      </div>
    </main>
  );
}
