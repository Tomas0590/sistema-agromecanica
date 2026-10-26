'use client';

import { useState, useEffect } from 'react';
import TablaClientes from './TablaClientes';
import ModalCliente from './ModalCliente';
import ModalNuevoCliente from './ModalNuevoCliente';

export default function ClientesContainer({ 
  supabase, 
  situacionesMap, 
  setSituacionesMap, 
  yaVerificadoBcra, 
  setYaVerificadoBcra 
}) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // Estados de procesos
  const [cargandoBCRA, setCargandoBCRA] = useState(false);
  const [progresoBcra, setProgresoBcra] = useState('');
  const [cargandoIndividualId, setCargandoIndividualId] = useState(null);
  const [cargandoNombres, setCargandoNombres] = useState(false);

  // Cliente en edición y alta
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  // 1. Carga inicial de clientes desde Supabase
  useEffect(() => {
    cargarClientes();
  }, []);

  // 2. Disparo automático de verificación en segundo plano (Solo 1 vez al iniciar la app)
  useEffect(() => {
    if (clientes.length > 0 && !yaVerificadoBcra) {
      corroborarBCRAMasivamenteSilencioso(clientes);
    }
  }, [clientes.length, yaVerificadoBcra]);

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('razon_social', { ascending: true });

      if (data) setClientes(data);
    } catch (e) {
      console.error('Error al conectar con la BD:', e);
    }
  };

  // VERIFICACIÓN MASIVA RÁPIDA (En lotes de 5 en paralelo)
  const corroborarBCRAMasivamenteSilencioso = async (listaClientes) => {
    const conCuit = listaClientes.filter(
      (c) => String(c.cuit_dni || c.cuit || '').replace(/\D/g, '').length === 11
    );

    if (conCuit.length === 0) return;

    setCargandoBCRA(true);
    setYaVerificadoBcra(true); // Se marca para no volver a ejecutar al cambiar de pestaña

    const TAMAÑO_LOTE = 5;

    for (let i = 0; i < conCuit.length; i += TAMAÑO_LOTE) {
      const lote = conCuit.slice(i, i + TAMAÑO_LOTE);
      setProgresoBcra(`(${Math.min(i + TAMAÑO_LOTE, conCuit.length)}/${conCuit.length})`);

      await Promise.all(
        lote.map(async (cli) => {
          const cuitLimpio = String(cli.cuit_dni || cli.cuit).replace(/\D/g, '');
          try {
            const res = await fetch(`/api/bcra?cuit=${cuitLimpio}`);
            if (res.ok) {
              const data = await res.json();
              setSituacionesMap((prev) => ({
                ...prev,
                [cli.id]: {
                  situacion: data.situacion || 1,
                  cheques: data.chequesRechazados || 0
                }
              }));
            } else if (res.status === 404) {
              setSituacionesMap((prev) => ({
                ...prev,
                [cli.id]: { situacion: 1, cheques: 0 }
              }));
            }
          } catch (e) {
            console.error(`Error consultando BCRA para ${cli.razon_social}:`, e);
          }
        })
      );
    }

    setCargandoBCRA(false);
    setProgresoBcra('');
  };

  // VERIFICACIÓN MANUAL INDIVIDUAL
  const corroborarBCRAIndividual = async (cliente, e) => {
    if (e) e.stopPropagation();
    const cuitLimpio = String(cliente.cuit_dni || cliente.cuit || '').replace(/\D/g, '');
    if (cuitLimpio.length !== 11) {
      alert('Este cliente no posee un CUIT válido de 11 dígitos.');
      return;
    }

    setCargandoIndividualId(cliente.id);

    try {
      const res = await fetch(`/api/bcra?cuit=${cuitLimpio}`);
      if (res.ok) {
        const data = await res.json();
        setSituacionesMap((prev) => ({
          ...prev,
          [cliente.id]: {
            situacion: data.situacion || 1,
            cheques: data.chequesRechazados || 0
          }
        }));
      } else if (res.status === 404) {
        setSituacionesMap((prev) => ({
          ...prev,
          [cliente.id]: { situacion: 1, cheques: 0 }
        }));
      } else {
        alert('No se pudo obtener la información crediticia desde el BCRA.');
      }
    } catch (e) {
      alert('Error de conexión con el servidor.');
    } finally {
      setCargandoIndividualId(null);
    }
  };

  const autocompletarNombresPendientes = async () => {
    setCargandoNombres(true);
    const pendientes = clientes.filter((c) => {
      const valorCuit = String(c.cuit_dni || c.cuit || '').replace(/\D/g, '');
      const sinNombre = !c.razon_social || c.razon_social.trim() === '' || c.razon_social.includes('PENDIENTE');
      return sinNombre && valorCuit.length === 11;
    });

    if (pendientes.length === 0) {
      alert('No hay clientes pendientes de nombre que tengan CUIT válido.');
      setCargandoNombres(false);
      return;
    }

    let actualizados = 0;
    for (const cli of pendientes) {
      const cuitLimpio = String(cli.cuit_dni || cli.cuit).replace(/\D/g, '');
      try {
        const res = await fetch(`/api/cuit?cuit=${cuitLimpio}`);
        if (res.ok) {
          const data = await res.json();
          if (data.razonSocial) {
            await supabase.from('clientes').update({
              razon_social: data.razonSocial,
              condicion_iva: data.condicionIva || cli.condicion_iva,
              direccion: data.direccion || cli.direccion
            }).eq('id', cli.id);
            actualizados++;
          }
        }
      } catch (e) {
        console.error(`Error CUIT ${cuitLimpio}:`, e);
      }
    }

    setCargandoNombres(false);
    alert(`Proceso finalizado. Se actualizaron ${actualizados} clientes.`);
    cargarClientes();
  };

  const guardarCambiosCliente = async (e) => {
    e.preventDefault();
    if (!clienteDetalle) return;
    setGuardandoEdicion(true);
    const valorCuit = (clienteDetalle.cuit_dni || clienteDetalle.cuit || '').trim() || null;

    const { error } = await supabase.from('clientes').update({
      razon_social: clienteDetalle.razon_social,
      cuit_dni: valorCuit,
      cuit: valorCuit,
      condicion_iva: clienteDetalle.condicion_iva,
      telefono: clienteDetalle.telefono,
      email: clienteDetalle.email,
      direccion: clienteDetalle.direccion,
      observaciones: clienteDetalle.observaciones
    }).eq('id', clienteDetalle.id);

    setGuardandoEdicion(false);
    if (!error) { setClienteDetalle(null); cargarClientes(); }
    else alert(`Error: ${error.message}`);
  };

  const borrarCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) {
      if (clienteDetalle?.id === id) setClienteDetalle(null);
      cargarClientes();
    }
  };

  const cambiarOrden = (col) => {
    if (ordenColumna === col) setOrdenAsc(!ordenAsc);
    else { setOrdenColumna(col); setOrdenAsc(true); }
  };

  const clientesFiltrados = clientes
    .filter((c) => {
      const t = busqueda.toLowerCase();
      const cuit = String(c.cuit_dni || c.cuit || '');
      return (c.razon_social || '').toLowerCase().includes(t) || cuit.includes(t) || (c.direccion || '').toLowerCase().includes(t);
    })
    .sort((a, b) => {
      let valA = (a[ordenColumna] || '').toString().toLowerCase();
      let valB = (b[ordenColumna] || '').toString().toLowerCase();
      if (valA < valB) return ordenAsc ? -1 : 1;
      if (valA > valB) return ordenAsc ? 1 : -1;
      return 0;
    });

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Gestión de Clientes y Cuentas Corrientes
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Base de datos de clientes, CUITs y consulta de riesgo crediticio BCRA
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {cargandoBCRA && (
            <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 'bold', backgroundColor: '#fefce8', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #fef08a' }}>
              🔄 Escaneando BCRA {progresoBcra}...
            </span>
          )}
          <button onClick={autocompletarNombresPendientes} disabled={cargandoNombres} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
            {cargandoNombres ? '⏳ Procesando...' : '⚡ Autocompletar Nombres'}
          </button>
          <button onClick={() => corroborarBCRAMasivamenteSilencioso(clientes)} disabled={cargandoBCRA} style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
            {cargandoBCRA ? `⏳ Escaneando...` : '🔍 Reevaluar BCRA Masivamente'}
          </button>
          <button onClick={() => setMostrarModalNuevo(true)} style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
            ➕ Nuevo Cliente
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE TABLA */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Razón Social, CUIT, Dirección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, maxWidth: '480px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#78716c', fontWeight: '600' }}>
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </span>
        </div>

        <TablaClientes
          clientes={clientesFiltrados}
          situacionesMap={situacionesMap}
          cargandoIndividualId={cargandoIndividualId}
          ordenColumna={ordenColumna}
          ordenAsc={ordenAsc}
          cambiarOrden={cambiarOrden}
          corroborarBCRAIndividual={corroborarBCRAIndividual}
          setClienteDetalle={setClienteDetalle}
        />
      </div>

      {/* MODAL EDITAR CLIENTE */}
      <ModalCliente
        clienteDetalle={clienteDetalle}
        setClienteDetalle={setClienteDetalle}
        guardarCambiosCliente={guardarCambiosCliente}
        guardandoEdicion={guardandoEdicion}
        borrarCliente={borrarCliente}
        situacionesMap={situacionesMap}
        corroborarBCRAIndividual={corroborarBCRAIndividual}
        cargandoIndividualId={cargandoIndividualId}
      />

      {/* MODAL NUEVO CLIENTE */}
      <ModalNuevoCliente
        mostrar={mostrarModalNuevo}
        onClose={() => setMostrarModalNuevo(false)}
        supabase={supabase}
        onClienteCreado={cargarClientes}
        setSituacionesMap={setSituacionesMap}
      />
    </div>
  );
}
