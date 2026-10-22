'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

import Navbar from './components/Navbar';
import ClientesContainer from './components/ClientesContainer';
import StockContainer from './components/StockContainer';

const SUPABASE_URL = 'https://tqfpcogdvhtvvhdqewdg.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MchMROFkf12BgkCahzrC5w_qAlaGXKr';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [session, setSession] = useState(null);
  const [usernameAuth, setUsernameAuth] = useState('');
  const [passwordAuth, setPasswordAuth] = useState('');
  const [errorAuth, setErrorAuth] = useState('');

  const [activeTab, setActiveTab] = useState('clientes');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    const cleanUser = usernameAuth.trim().toLowerCase();
    const emailToUse = cleanUser.includes('@') ? cleanUser : `${cleanUser}@agromecanica.com`;

    const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password: passwordAuth });
    if (error) setErrorAuth('Usuario o contraseña incorrectos');
  };

  const handleLogout = async () => await supabase.auth.signOut();

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '12px', color: '#fff', width: '340px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <h2 style={{ marginBottom: '0.25rem', textAlign: 'center', color: '#f59e0b', fontSize: '1.5rem' }}>Agromecanica</h2>
          <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>Acceso al Sistema</p>
          
          {errorAuth && (
            <div style={{ background: '#450a0a', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.5rem', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
              {errorAuth}
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Usuario</label>
            <input 
              type="text" 
              placeholder="Ej: admin"
              value={usernameAuth} 
              onChange={(e) => setUsernameAuth(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={passwordAuth} 
              onChange={(e) => setPasswordAuth(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#f59e0b', border: 'none', borderRadius: '6px', color: '#0f172a', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {activeTab === 'stock' && <StockContainer supabase={supabase} />}
        {activeTab === 'clientes' && <ClientesContainer supabase={supabase} />}
        {activeTab === 'pedidos' && (
          <div>
            <h2 style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>Pedidos de Venta</h2>
            <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Módulo de Pedidos en preparación.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
