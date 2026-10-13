'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

import Navbar from './components/Navbar';
import FormCliente from './components/FormCliente';
import TablaClientes from './components/TablaClientes';
import ModalCliente from './components/ModalCliente';

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
  const [editingId, setEditingId] = useState(null);
  const [cuit, setCuit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [condicionIva, setCondicionIva] = useState('Monotributo');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loadingCuit, setLoadingCuit] = useState(false);
  const [mensajeCliente, setMensajeCliente] = useState('');

  const [mostrarModalForm, setMostrarModalForm] = useState(false);

  const [resultadosBcra, setResultadosBcra] = useState({});
  const [loadingBcraId, setLoadingBcraId] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  const [autoCompletando, setAutoCompletando] = useState(false);
  const [consultandoMasivo, setConsultandoMasivo] = useState(false);
  const [alertaBcra, setAlertaBcra] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) cargarClientes();
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

    const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password: passwordAuth });
    if (error) setErrorAuth('Usuario o contraseña incorrectos');
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const abrirNuevoCliente = () => {
    setEditingId(null);
    setCuit('');
    setRazonSocial('');
    setCondicionIva('Monotributo');
    setEmail('');
    setTelefono('');
    setDireccion('');
    setMensajeCliente('');
    setMostrarModalForm(true);
  };

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

  const autocompletarNombresMasivo = async () => {
    const pendientes = clientes.filter(c => !c.razon_social || c.razon_social.includes('Pendiente') || c.razon_social.includes('Cliente'));
    
    if (pendientes.length === 0) {
      setMensajeCliente('✅ Todos los clientes ya tienen Razón Social asignada.');
      return;
    }

    setAutoCompletando(true);
    setMensajeCliente(`⏳ Autocompletando ${pendientes.length} nombres desde BCRA/AFIP... Por favor esperá.`);

    let procesados = 0;
    for (let c of pendientes) {
      try {
        const res = await fetch(`/api/cuit?cuit=${c.cuit}`);
        if (res.ok) {
          const data = await res.json();
          if (data.razonSocial) {
            await supabase.from('clientes').update({ 
              razon_social: data.razonSocial,
              condicion_iva: data.condicionIva || c.condicion_iva,
              direccion: data.direccion || c.direccion
            }).eq('id', c.id);
          }
        }
      } catch (e) {
        // Ignorar
      }
      procesados++;
      setMensajeCliente(`⏳ Autocompletando nombres... (${procesados}/${pendientes.length})`);
      await new Promise(r => setTimeout(r, 200));
    }

    setAutoCompletando(false);
    setMensajeCliente('🎉 ¡Proceso finalizado! Nombres actualizados desde la base oficial.');
    cargarClientes();
  };

  const consultarBcraMasivo = async () => {
    if (clientes.length === 0) return;
    setConsultandoMasivo(true);
    setAlertaBcra([]);
    setMensajeCliente(`⏳ Verificando BCRA para ${clientes.length} clientes... Por favor esperá.`);

    const alertas = [];
    let procesados = 0;

    for (let c of clientes) {
      if (!c.cuit || c.cuit.replace(/\D/g, '').length !== 11) continue;
      const cleanCuit = c.cuit.replace(/\D/g, '');

      let maxSit = 1;
      let totalDeuda = 0;
      let chequesRechazados = 0;

      try {
        const urlDeudas = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cleanCuit}`;
        const urlCheques = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cleanCuit}`;

        const [resDeudas, resCheques] = await Promise.allSettled([
          fetch(urlDeudas),
          fetch(urlCheques)
        ]);

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
          causales.forEach(causal => {
            (causal.entidades || []).forEach(e => {
              chequesRechazados += (e.detalle || []).length;
            });
          });
        }

        setResultadosBcra(prev => ({
          ...prev,
          [c.id]: { maxSit, totalDeuda, chequesRechazados }
        }));

        if (maxSit >= 2 || chequesRechazados > 0) {
          alertas.push({
            id: c.id,
            razon_social: c.razon_social,
            cuit: c.cuit,
            maxSit,
            chequesRechazados,
            totalDeuda
          });
        }
      } catch (e) {
        // Ignorar
      }

      procesados++;
      setMensajeCliente(`⏳ Verificando BCRA... (${procesados}/${clientes.length})`);
      await new Promise(r => setTimeout(r, 150));
    }

    setAlertaBcra(alertas);
    setConsultandoMasivo(false);
    setMensajeCliente(alertas.length > 0 
      ? `⚠️ Consulta finalizada. Se detectaron ${alertas.length} cliente(s) en Situación 2 o peor / con cheques.` 
      : '🟢 Consulta finalizada. Todos los clientes consultados están en Situación 1 (Normal).'
    );
  };

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
    } fontally {
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
    setMensajeCliente('');
    setMostrarModalForm(true);
  };

  const cancelarEdicion = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setMostrarModalForm(false);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ color: '#cbd5e1', margin: 0 }}>Gestión de Clientes y Cuentas Corrientes</h2>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={abrirNuevoCliente}
                  style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  ➕ Nuevo Cliente
                </button>

                <button 
                  onClick={autocompletarNombresMasivo}
                  disabled={autoCompletando || consultandoMasivo}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  {autoCompletando ? '⏳ Procesando...' : '⚡ Autocompletar Nombres Pendientes'}
                </button>

                <button 
                  onClick={consultarBcraMasivo}
                  disabled={autoCompletando || consultandoMasivo}
                  style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  {consultandoMasivo ? '⏳ Consultando BCRA...' : '🔍 Corroborar BCRA Masivamente'}
                </button>
              </div>
            </div>

            {/* ALERTA BCRA */}
            {alertaBcra.length > 0 && (
              <div style={{ background: '#451a03', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem', color: '#fef3c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚠️ Clientes con Observaciones Crediticias (Sit. 2 o mayor / Cheques) — Total: {alertaBcra.length}
                  </h3>
                  <button 
                    onClick={() => setAlertaBcra([])} 
                    style={{ background: 'transparent', border: 'none', color: '#fcd34d', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                  >
                    Ocultar aviso
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {alertaBcra.map(a => (
                    <div key={a.id} style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#38bdf8', fontSize: '0.9rem' }}>{a.razon_social}</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', fontFamily: 'monospace', color: '#cbd5e1' }}>CUIT: {a.cuit}</p>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: a.maxSit >= 4 ? '#7f1d1d' : '#78350f', color: a.maxSit >= 4 ? '#fca5a5' : '#fde68a', fontWeight: 'bold' }}>
                          Sit {a.maxSit}
                        </span>
                        {a.chequesRechazados > 0 && (
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            ⚠️ {a.chequesRechazados} cheque(s)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FORMULARIO FLOTANTE (MODAL) */}
            {mostrarModalForm && (
              <FormCliente 
                editingId={editingId}
                cuit={cuit} setCuit={setCuit}
                razonSocial={razonSocial} setRazonSocial={setRazonSocial}
                condicionIva={condicionIva} setCondicionIva={setCondicionIva}
                email={email} setEmail={setEmail}
                telefono={telefono} setTelefono={setTelefono}
                direccion={direccion} setDireccion={setDireccion}
                loadingCuit={loadingCuit}
                mensajeCliente={mensajeCliente}
                onBuscarCuit={buscarCuit}
                onGuardar={guardarCliente}
                onCancelarEdicion={cancelarEdicion}
              />
            )}

            <TablaClientes 
              clientes={clientes}
              resultadosBcra={resultadosBcra}
              loadingBcraId={loadingBcraId}
              onConsultarBcra={consultarBcra}
              onPrepararEdicion={prepararEdicion}
              onSelectCliente={setClienteSeleccionado}
            />

            <ModalCliente 
              cliente={clienteSeleccionado}
              onClose={() => setClienteSeleccionado(null)}
              onPrepararEdicion={prepararEdicion}
              onBorrarCliente={borrarCliente}
            />
          </div>
        )}
      </main>
    </div>
  );
}
