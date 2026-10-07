'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tqfpcogdvhtvvhdqewdg.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MchMROFkf12BgkCahzrC5w_qAlaGXKr';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SITUATION_STYLES = {
  1: { label: 'Sit 1 - Normal', bg: '#064e3b', color: '#22c55e', border: '#15803d' },
  2: { label: 'Sit 2 - Riesgo Bajo', bg: '#1a2e05', color: '#84cc16', border: '#4d7c0f' },
  3: { label: 'Sit 3 - Riesgo Medio', bg: '#451a03', color: '#f59e0b', border: '#b45309' },
  4: { label: 'Sit 4 - Riesgo Alto', bg: '#431407', color: '#ea580c', border: '#c2410c' },
  5: { label: 'Sit 5 - Irrecuperable', bg: '#450a0a', color: '#ef4444', border: '#b91c1c' },
  6: { label: 'Sit 6 - Irrec. Técnica', bg: '#450a0a', color: '#b91c1c', border: '#7f1d1d' },
};

export default function Home() {
  const [session, setSession] = useState(null);
  const [usernameAuth, setUsernameAuth] = useState('');
  const [passwordAuth, setPasswordAuth] = useState('');
  const [errorAuth, setErrorAuth] = useState('');

  const [activeTab, setActiveTab] = useState('clientes');

  // Estado Clientes y Formulario
  const [clientes, setClientes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [cuit, setCuit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [condicionIva, setCondicionIva] = useState('Monotributo');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loadingCuit, setLoadingCuit] = useState(false);
  const [mensajeCliente, setMensajeCliente] = useState('');

  // Estado BCRA
  const [resultadosBcra, setResultadosBcra] = useState({});
  const [loadingBcraId, setLoadingBcraId] = useState(null);

  // Modal Detalle
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

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

  // Buscar CUIT usando nuestra API Route de Servidor
  const buscarCuit = async () => {
    const cleanCuit = cuit.replace(/\D/g, '');
    if (cleanCuit.length !== 11) {
      setMensajeCliente('El CUIT debe contener exactamente 11 dígitos.');
      return;
    }
    setLoadingCuit(true);
    setMensajeCliente('');

    try {
      const res = await fetch(`/api/cuit?cuit=${cleanCuit}`);
      const data = await res.json();

      if (res.ok && data.razonSocial) {
        setRazonSocial(data.razonSocial);
        if (data.direccion) setDireccion(data.direccion);
        if (data.condicionIva) setCondicionIva(data.condicionIva);
        setMensajeCliente(`✅ Razón Social autocompletada desde ${data.origen}.`);
      } else {
        setMensajeCliente('⚠️ No se encontraron datos automáticos para este CUIT. Ingresalos manualmente.');
      }
    } catch {
      setMensajeCliente('⚠️ Ocurrió un error al consultar el CUIT. Completá los datos manualmente.');
    } finally {
      setLoadingCuit(false);
    }
  };

  // Consultar BCRA en tiempo real
  const consultarBcra = async (clienteId, cuitCliente) => {
    const cleanCuit = cuitCliente?.replace(/\D/g, '');
    if (!cleanCuit || cleanCuit.length !== 11) return;

    setLoadingBcraId(clienteId);

    try {
      const urlDeudas = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cleanCuit}`;
      const urlCheques = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cleanCuit}`;

      const [resDeudas, resCheques] = await Promise.allSettled([
        fetch(urlDeudas),
        fetch(urlCheques)
      ]);

      let maxSit = 1;
      let totalDeuda = 0;
      let chequesRechazados = 0;

      if (resDeudas.status === 'fulfilled' && resDeudas.value.ok) {
        const dataDeudas = await resDeudas.value.json();
        const periodos = dataDeudas?.results?.periodos || [];
        if (periodos.length > 0) {
          const entidades = periodos[0].entidades || [];
          entidades.forEach(e => {
            totalDeuda += (e.monto || 0);
            if (e.situacion > maxSit) maxSit = e.situacion;
          });
        }
      }

      if (resCheques.status === 'fulfilled' && resCheques.value.ok) {
        const dataCheques = await resCheques.value.json();
        const causales = dataCheques?.results?.causales || [];
        causales.forEach(c => {
          (c.entidades || []).forEach(e => {
            chequesRechazados += (e.detalle || []).length;
          });
        });
      }

      setResultadosBcra(prev => ({
        ...prev,
        [clienteId]: { maxSit, totalDeuda, chequesRechazados }
      }));

    } catch {
      setResultadosBcra(prev => ({
        ...prev,
        [clienteId]: { maxSit: 1, totalDeuda: 0, chequesRechazados: 0, error: true }
      }));
    } finally {
      setLoadingBcraId(null);
    }
  };

  const prepararEdicion = (c) => {
    setEditingId(c.id);
    setCuit(c.cuit || '');
    setRazonSocial(c.razon_social || '');
    setCondicionIva(c.condicion_iva || 'Monotributo');
    setEmail(c.email || '');
    setTelefono(c.telefono || '');
    setDireccion(c.direccion || '');
    setClienteSeleccionado(null);
    setMensajeCliente('✏️ Modo edición activado. Modificá los datos y presioná "Guardar Cambios".');
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setCuit('');
    setRazonSocial('');
    setCondicionIva('Monotributo');
    setEmail('');
    setTelefono('');
    setDireccion('');
    setMensajeCliente('');
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    setMensajeCliente('');
    const cleanCuit = cuit.replace(/\D/g, '');

    if (!razonSocial || !cleanCuit) {
      setMensajeCliente('CUIT y Razón Social son obligatorios.');
      return;
    }

    const payload = { cuit: cleanCuit, razon_social: razonSocial, condicion_iva: condicionIva, email, telefono, direccion };
    let resultError = null;

    if (editingId) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', editingId);
      resultError = error;
    } else {
      const { error } = await supabase.from('clientes').insert([payload]);
      resultError = error;
    }

    if (resultError) {
      setMensajeCliente(`Error al guardar: ${resultError.message}`);
    } else {
      setMensajeCliente(editingId ? '¡Cliente actualizado con éxito!' : '¡Cliente guardado con éxito!');
      cancelarEdicion();
      cargarClientes();
    }
  };

  const borrarCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) {
      setClienteSeleccionado(null);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.1rem' }}>
                  {editingId ? '✏️ Editar Cliente' : 'Nuevo Cliente'}
                </h3>
                {editingId && (
                  <button onClick={cancelarEdicion} style={{ background: '#475569', color: '#fff', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Cancelar Edición
                  </button>
                )}
              </div>

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
                      placeholder="30708679263" 
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
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Dirección / Localidad</label>
                  <input 
                    type="text" 
                    value={direccion} 
                    onChange={(e) => setDireccion(e.target.value)} 
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                  <button type="submit" style={{ background: editingId ? '#38bdf8' : '#f59e0b', color: '#0f172a', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {editingId ? '💾 Guardar Cambios' : '+ Guardar Cliente'}
                  </button>
                </div>
              </form>
            </div>

            {/* TABLA DE CLIENTES */}
            <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Razón Social</th>
                    <th style={{ padding: '0.85rem 1rem' }}>CUIT</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Cond. IVA</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Situación BCRA</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                        No hay clientes registrados aún.
                      </td>
                    </tr>
                  ) : (
                    clientes.map((c) => {
                      const res = resultadosBcra[c.id];
                      const style = res ? (SITUATION_STYLES[res.maxSit] || SITUATION_STYLES[1]) : null;

                      return (
                        <tr 
                          key={c.id} 
                          style={{ borderBottom: '1px solid #334155', cursor: 'pointer' }}
                          onClick={() => setClienteSeleccionado(c)}
                        >
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                            👤 {c.razon_social}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontFamily: 'monospace' }}>{c.cuit}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{c.condicion_iva || '-'}</td>
                          
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            {res ? (
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ 
                                  padding: '0.3rem 0.8rem', 
                                  borderRadius: '20px', 
                                  fontSize: '0.8rem', 
                                  fontWeight: 'bold',
                                  background: style.bg,
                                  color: style.color,
                                  border: `1px solid ${style.border}`
                                }}>
                                  {style.label}
                                </span>
                                {res.chequesRechazados > 0 && (
                                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
                                    ⚠️ {res.chequesRechazados} cheque(s)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin consultar</span>
                            )}
                          </td>

                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button 
                                onClick={() => consultarBcra(c.id, c.cuit)}
                                disabled={loadingBcraId === c.id}
                                style={{ background: '#1e40af', color: '#93c5fd', border: 'none', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                {loadingBcraId === c.id ? '...' : 'Consultar BCRA'}
                              </button>
                              <button 
                                onClick={() => prepararEdicion(c)}
                                style={{ background: '#334155', color: '#f59e0b', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                ✏️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MODAL FICHA */}
            {clienteSeleccionado && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setClienteSeleccionado(null)}>
                <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '1.25rem' }}>{clienteSeleccionado.razon_social}</h3>
                  <hr style={{ borderColor: '#334155', marginBottom: '1rem' }} />
                  
                  <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
                    <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>CUIT:</strong> <span style={{ fontFamily: 'monospace' }}>{clienteSeleccionado.cuit}</span></p>
                    <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Condición IVA:</strong> {clienteSeleccionado.condicion_iva || '-'}</p>
                    <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Teléfono:</strong> {clienteSeleccionado.telefono || 'Sin registrar'}</p>
                    <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Email:</strong> {clienteSeleccionado.email || 'Sin registrar'}</p>
                    <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Dirección / Localidad:</strong> {clienteSeleccionado.direccion || 'Sin registrar'}</p>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => prepararEdicion(clienteSeleccionado)}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        onClick={() => borrarCliente(clienteSeleccionado.id)}
                        style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setClienteSeleccionado(null)}
                      style={{ background: '#475569', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
