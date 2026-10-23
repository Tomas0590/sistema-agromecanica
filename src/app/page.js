'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import ClientesContainer from './components/ClientesContainer';
import StockContainer from './components/StockContainer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('clientes'); // 'clientes', 'stock' o 'pedidos'

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', fontFamily: 'sans-serif' }}>
      
      {/* NAVBAR CON PROPS EXACTAS */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleSignOut} 
      />

      {/* CONTENIDO SEGÚN LA PESTAÑA */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {activeTab === 'clientes' && (
          <ClientesContainer supabase={supabase} />
        )}

        {activeTab === 'stock' && (
          <StockContainer supabase={supabase} />
        )}

        {activeTab === 'pedidos' && (
          <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '3rem', textAlign: 'center', color: '#78716c' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2b2927' }}>🛒 Pedidos de Venta</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Sección para la gestión y seguimiento de pedidos de venta.</p>
          </div>
        )}
      </main>

    </div>
  );
}
