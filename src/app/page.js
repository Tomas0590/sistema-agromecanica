'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ClientesContainer from './components/ClientesContainer';

// Inicialización con variables de entorno públicas de Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [session, setSession] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  // Estados del formulario de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [procesandoLogin, setProcesandoLogin] = useState(false);

  useEffect(() => {
    // Obtener sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargandoSesion(false);
    });

    // Escuchar cambios de estado (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCargandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setProcesandoLogin(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorLogin('Credenciales incorrectas. Verificá tu correo y contraseña.');
    }
    setProcesandoLogin(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (cargandoSesion) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1rem', color: '#78716c', fontWeight: 'bold' }}>⏳ Verificando acceso...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f2eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: '#fcfbf9',
          border: '1px solid #e5e0d8',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          padding: '2.25rem',
          width: '100%',
          maxWidth: '380px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ color: '#2b2927', fontSize: '1.6rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
              Agromecanica
            </h1>
            <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
              Ingresá tus datos para acceder al sistema
            </span>
          </div>

          {errorLogin && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.65rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {errorLogin}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.3rem' }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@agromecanica.com"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #dcd5c9',
                  backgroundColor: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.3rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #dcd5c9',
                  backgroundColor: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={procesandoLogin}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#15803d',
                color: '#fff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: procesandoLogin ? 'not-allowed' : 'pointer',
                opacity: procesandoLogin ? 0.7 : 1
              }}
            >
              {procesandoLogin ? 'Iniciando sesión...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f5f2eb', padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fcfbf9',
        border: '1px solid #e5e0d8',
        borderRadius: '10px',
        padding: '0.75rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <span style={{ fontSize: '0.85rem', color: '#57534e', fontWeight: '600' }}>
          👤 Sesión iniciada como: <strong>{session.user.email}</strong>
        </span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#eeeae1',
            border: '1px solid #dcd5c9',
            color: '#57534e',
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>

      <ClientesContainer supabase={supabase} />
    </main>
  );
}
