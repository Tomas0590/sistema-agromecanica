'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamicComponent from 'next/dynamic';

const Navbar = dynamicComponent(() => import('./components/Navbar'), { ssr: false });
const ClientesContainer = dynamicComponent(() => import('./components/ClientesContainer'), { ssr: false });
const CuentasCorrientesContainer = dynamicComponent(() => import('./components/CuentasCorrientesContainer'), { ssr: false });
const StockContainer = dynamicComponent(() => import('./components/StockContainer'), { ssr: false });
const Login = dynamicComponent(() => import('./components/Login'), { ssr: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [activeTab, setActiveTab] = useState('clientes');

  // Estado global para BCRA (para que no vuelva a consultar al cambiar de pestaña)
  const [situacionesMap, setSituacionesMap] = useState({});
  const [yaVerificadoBcra, setYaVerificadoBcra] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setCargandoSesion(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCargandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // 1. Mientras verifica si hay sesión iniciada
  if (cargandoSesion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 'bold', color: '#78716c', fontSize: '1rem' }}>
          ⏳ Cargando Agromecanica...
        </div>
      </div>
    );
  }

  // 2. Si NO hay usuario logueado, muestra la pantalla de Login
  if (!session) {
    return <Login supabase={supabase} />;
  }

  // 3. Usuario logueado: Panel principal
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', fontFamily: 'sans-serif' }}>
      
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleSignOut} 
      />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {activeTab === 'clientes' && (
          <ClientesContainer 
            supabase={supabase} 
            situacionesMap={situacionesMap}
            setSituacionesMap={setSituacionesMap}
            yaVerificadoBcra={yaVerificadoBcra}
            setYaVerificadoBcra={setYaVerificadoBcra}
          />
        )}

        {activeTab === 'cuentas_corrientes' && (
          <CuentasCorrientesContainer supabase={supabase} />
        )}

        {activeTab === 'stock' && (
          <StockContainer supabase={supabase} />
        )}

        {activeTab === 'pedidos' && (
          <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '3rem', textAlign: 'center', color: '#78716c' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#2b2927' }}>🛒 Pedidos de Venta</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Sección para la gestión y seguimiento de pedidos de venta de Agromecanica.</p>
          </div>
        )}
      </main>

    </div>
  );
}
