'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import dynamicComponent from 'next/dynamic';

const Navbar = dynamicComponent(() => import('./components/Navbar'), { ssr: false });
const ClientesContainer = dynamicComponent(() => import('./components/ClientesContainer'), { ssr: false });
const CuentasCorrientesContainer = dynamicComponent(() => import('./components/CuentasCorrientesContainer'), { ssr: false });
const StockContainer = dynamicComponent(() => import('./components/StockContainer'), { ssr: false });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [activeTab, setActiveTab] = useState('clientes');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);
  const [errorAuth, setErrorAuth] = useState('');

  // Estado global para BCRA (mantiene la lectura activa al cambiar entre pestañas)
  const [situacionesMap, setSituacionesMap] = useState({});
  const [yaVerificadoBcra, setYaVerificadoBcra] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      setCargandoSesion(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setCargandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargandoAuth(true);
    setErrorAuth('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorAuth('Correo o contraseña incorrectos.');
    }
    setCargandoAuth(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // 1. Pantalla de carga inicial
  if (cargandoSesion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 'bold', color: '#78716c', fontSize: '1rem' }}>
          ⏳ Verificando acceso...
        </div>
      </div>
    );
  }

  // 2. Si NO hay sesión activa -> Mostrar Login obligatorio
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f2eb', padding: '1rem', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img 
              src="/logo.png" 
              alt="Agromecanica Logo" 
              style={{ height: '45px', marginBottom: '0.5rem', objectFit: 'contain' }} 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
            <h2 style={{ margin: 0, color: '#1c1917', fontSize: '1.3rem', fontWeight: '900' }}>AGROMECANICA</h2>
            <span style={{ fontSize: '0.85rem', color: '#78716c' }}>Ingreso restringido al sistema</span>
          </div>

          {errorAuth && (
            <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.65rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
              ⚠️ {errorAuth}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.25rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@agromecanica.com"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.25rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={cargandoAuth}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {cargandoAuth ? '⏳ Ingresando...' : '🔑 Iniciar Sesión'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // 3. Usuario autenticado: Sistema habilitado
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
