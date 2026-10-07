'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tqfpcogdvhtvvhdqewdg.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MchMROFkf12BgkCahzrC5w_qAlaGXKr';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [session, setSession] = useState(null);
  const [usernameAuth, setUsernameAuth] = useState('');
  const [passwordAuth, setPasswordAuth] = useState('');
  const [errorAuth, setErrorAuth] = useState('');

  const [activeTab, setActiveTab] = useState('clientes');

  const [clientes, setClientes] = useState([]);
  const [cuit, setCuit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [condicionIva, setCondicionIva] = useState('Monotributo');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loadingCuit, setLoadingCuit] = useState(false);
  const [mensajeCliente, setMensajeCliente] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      cargarClientes();
    }
  }, [session]);

  const cargarClientes = async () => {
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    if (!error && data) setClientes(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    const cleanUser = usernameAuth.trim().toLowerCase();
    const emailToUse = cleanUser.includes('@') ? cleanUser : `${cleanUser}@agromecanica.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: passwordAuth,
    });

    if (error) setErrorAuth('Usuario o contraseña incorrectos');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Buscar CUIT con doble servidor (BCRA Oficial + Padrón de Respaldo)
  const buscarCuit = async () => {
    const cleanCuit = cuit.replace(/\D/g, '');
    if (cleanCuit.length !== 11) {
      setMensajeCliente('El CUIT debe contener exactamente 11 dígitos.');
      return;
    }

    setLoadingCuit(true);
    setMensajeCliente('');

    try {
      // Intentamos primero con la API de la Central de Deudores del BCRA (Servidor Oficial)
      const resBcra = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cleanCuit}`);
      
      if (resBcra.ok) {
        const dataBcra = await resBcra.json();
        if (dataBcra?.results?.denominacion) {
          setRazonSocial(dataBcra.results.denominacion);
          setMensajeCliente('✅ Razón Social autocompletada desde el BCRA.');
          setLoadingCuit(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Servidor BCRA no disponible, intentando con padrón secundario...', e);
    }

    try {
      // Servidor de respaldo alternativo si el BCRA no devuelve nombre
      const resPadron = await fetch(`https://api.v2.padron.ar/cuit/${cleanCuit}`);
      if (resPadron.ok) {
        const dataPadron = await resPadron.json();
        if (dataPadron.denominacion || dataPadron.nombre) {
          setRazonSocial(dataPadron.denominacion || dataPadron.nombre);
          if (dataPadron.direccion) setDireccion(dataPadron.direccion);
          if (dataPadron.condicion_iva || dataPadron.iva) {
            setCondicionIva(dataPadron.condicion_iva || dataPadron.iva);
          }
          setMensajeCliente('✅ Datos autocompletados desde el Padrón.');
          setLoadingCuit(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Error en padrón secundario', e);
    }

    // Si ambos servicios públicos externos están caídos o no responden:
    setMensajeCliente('⚠️ No se encontraron datos automáticos para este CUIT. Podes ingresar la Razón Social manualmente.');
    setLoadingCuit(false);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    setMensajeCliente('');
    if (!razonSocial || !cuit) {
      setMensajeCliente('CUIT y Razón Social son obligatorios.');
      return;
    }

    const { error } = await supabase.from('clientes').insert([
      { cuit, razon_social: razonSocial, condicion_iva: condicionIva, email, telefono, direccion }
    ]);

    if (error) {
      setMensajeCliente(`Error al guardar: ${error.message}`);
    } else {
      setMensajeCliente('¡Cliente guardado con éxito!');
      setCuit('');
      setRazonSocial('');
      setCondicionIva('Monotributo');
      setEmail('');
      setTelefono('');
      setDireccion('');
      cargarClientes();
    }
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '12px', color: '#fff', width: '340px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <h2 style={{ marginBottom: '0.25rem', textAlign: 'center', color: '#f59e0b', fontSize: '1.5rem' }}>Agro-Repuestos</h2>
          <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>& Bulonería — Acceso</p>
          
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
      
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', color: '#f59e0b', margin: 0, fontWeight: 'bold' }}>Agro-Repuestos & Bulonería</h1>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('pedidos')} 
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === 'pedidos' ? '#f59e0b' : 'transparent', color: activeTab === 'pedidos' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
            >
              📦 Stock y Pedidos
            </button>
            <button 
              onClick={() => setActiveTab('clientes')} 
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === 'clientes' ? '#f59e0b' : 'transparent', color: activeTab === 'clientes' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
            >
              👥 Clientes y Cuentas Corrientes
            </button>
          </nav>
        </div>

        <button onClick={handleLogout} style={{ background: '#334155', border: 'none', color: '#cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
          Cerrar Sesión
        </button>
      </header>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {activeTab === 'pedidos' && (
          <div>
            <h2 style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>Gestión de Stock y Pedidos de Venta</h2>
            <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Módulo de Puntos de Venta y Stock en preparación.</p>
            </div>
          </div>
        )}

        {activeTab === 'clientes' && (
          <div>
            <h2 style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>Gestión de Clientes y Cuentas Corrientes</h2>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '2rem' }}>
              <h3 style={{ marginTop: 0, color: '#f59e0b', fontSize: '1.1rem' }}>Nuevo Cliente</h3>

              {mensajeCliente && (
                <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', marginBottom: '1rem', background: mensajeCliente.includes('éxito') || mensajeCliente.includes('✅') ? '#064e3b' : '#450a0a', color: mensajeCliente.includes('éxito') || mensajeCliente.includes('✅') ? '#a7f3d0' : '#fca5a5', fontSize: '0.9rem' }}>
                  {mensajeCliente}
                </div>
              )}

              <form onSubmit={guardarCliente} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>CUIT / CUIL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="20123456789" 
                      value={cuit} 
                      onChange={(e) => setCuit(e.target.value)} 
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                    />
                    <button type="button" onClick={buscarCuit} disabled={loadingCuit} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {loadingCuit ? '...' : 'Buscar'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Razón Social / Nombre</label>
                  <input 
                    type="text" 
                    value={razonSocial} 
                    onChange={(e) => setRazonSocial(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Condición IVA</label>
                  <select 
                    value={condicionIva} 
                    onChange={(e) => setCondicionIva(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Teléfono</label>
                  <input 
                    type="text" 
                    value={telefono} 
                    onChange={(e) => setTelefono(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Dirección</label>
                  <input 
                    type="text" 
                    value={direccion} 
                    onChange={(e) => setDireccion(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                  <button type="submit" style={{ background: '#f59e0b', color: '#0f172a', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Guardar Cliente
                  </button>
                </div>
              </form>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Razón Social</th>
                    <th style={{ padding: '0.75rem 1rem' }}>CUIT</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Cond. IVA</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Teléfono</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Dirección</th>
                    <th style={{ padding: '0.75rem 1rem' }}>BCRA</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                        No hay clientes registrados aún.
                      </td>
                    </tr>
                  ) : (
                    clientes.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{c.razon_social}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.cuit}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.condicion_iva || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.telefono || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>{c.direccion || '-'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <a 
                            href={`https://www.bcra.gob.ar/BCRAyVos/Situacion_Crediticia.asp?error=0&CUIT=${c.cuit?.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ background: '#1e40af', color: '#93c5fd', padding: '0.25rem 0.6rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}
                          >
                            Ver Situación 🔗
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
