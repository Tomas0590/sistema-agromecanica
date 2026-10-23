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
  const [pestanaActiva, setPestanaActiva] = useState('clientes'); // 'clientes' o 'stock'

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
        
        {/* COMPONENTE NAVBAR */}
        <Navbar 
          session={session} 
          pestanaActiva={pestanaActiva} 
          setPestanaActiva={setPestanaActiva} 
          onSignOut={handleSignOut} 
        />

        {/* CONTENIDO SEGÚN LA PESTAÑA */}
        {pestanaActiva === 'clientes' ? (
          <ClientesContainer supabase={supabase} />
        ) : (
          <StockContainer supabase={supabase} />
        )}

      </div>
    </main>
  );
}
