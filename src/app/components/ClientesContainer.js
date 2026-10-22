'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // ESTADO LOCAL DE SITUACIÓN BCRA (EN MEMORIA / SIN TOCAR SUPABASE)
  const [situacionesMap, setSituacionesMap] = useState({});

  // Estados de procesos
  const [cargandoBCRA, setCargandoBCRA] = useState(false);
  const [progresoBcra, setProgresoBcra] = useState('');
  const [cargandoIndividualId, setCargandoIndividualId] = useState(null);
  const [cargandoNombres, setCargandoNombres] = useState(false);
  const [buscandoCuitApi, setBuscandoCuitApi] = useState(false);

  // Cliente en edición / detalle
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Formulario de alta de nuevo cliente
  const [razonSocial, setRazonSocial] = useState('');
  const [cuitDni, setCuitDni] = useState('');
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mensajeForm, setMensajeForm] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('razon_social', { ascending: true });

      if (error) {
        console.error('Error Supabase:', error.message);
      } else if (data) {
        setClientes(data);
      }
    } catch (e) {
      console.error('Error al conectar con la BD:', e);
    }
  };

  // CONSULTA RÁPIDA A BCRA CON TIMEOUT DE 3 SEGUNDOS
  const consultarBCRACuit = async (cuitLimpio) => {
    const targetUrl = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitLimpio}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        return 1; // Sin deudas -> Sit 1
      } else if (res.ok) {
        const data = await res.json();
        let peorSituacion = 1;
        if (data.results?.periodos?.[0]?.entidades) {
          data.results.periodos[0].entidades.forEach((e) => {
            if (e.situacion > peorSituacion) peorSituacion = e.situacion;
          });
        }
        return peorSituacion;
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
    return null;
  };

  // CONSULTA INDIVIDUAL (ACTUALIZA EL ESTADO LOCAL)
  const corroborarBCRAIndividual = async (cliente, e) => {
    if (e) e.stopPropagation();

    const cuitLimpio = String(cliente.cuit_dni || cliente.cuit || '').replace(/\D/g, '');
    if (cuitLimpio.length !== 11) {
      alert('Este cliente no posee un CUIT válido de 11 dígitos.');
      return;
    }

    setCargandoIndividualId(cliente.id);
    const nuevaSit = await consultarBCRACuit(cuitLimpio);

    if (nuevaSit !== null) {
      setSituacionesMap((prev) => ({
        ...prev,
        [cliente.id]: nuevaSit
      }));
    } else {
      alert('No se pudo obtener la información del BCRA en este momento.');
    }

    setCargandoIndividualId(null);
  };

  // CONSULTA MASIVA POR LOTES (ACTUALIZA EL ESTADO LOCAL EN TIEMPO REAL)
  const corroborarBCRAMasivamente = async () => {
    setCargandoBCRA(true);

    const conCuit = clientes.filter((c) => {
      const val = String(c.cuit_dni || c.cuit || '').replace(/\D/g, '');
      return val.length === 11;
    });

    if (conCuit.length === 0) {
      alert('No se encontraron clientes con CUIT válido de 11 dígitos.');
      setCargandoBCRA(false);
      setProgresoBcra('');
      return;
    }

    let evaluados = 0;
    let errores = 0;
    const TAMANO_LOTE = 5;

    for (let i = 0; i < conCuit.length; i += TAMANO_LOTE) {
      const lote = conCuit.slice(i, i + TAMANO_LOTE);
      setProgresoBcra(`(${Math.min(i + lote.length, conCuit.length)}/${conCuit.length})`);

      await Promise.all(
        lote.map(async (cli) => {
          const cuitLimpio = String(cli.cuit_dni || cli.cuit).replace(/\D/g, '');
          const nuevaSit = await consultarBCRACuit(cuitLimpio);

          if (nuevaSit !== null) {
            setSituacionesMap((prev) => ({
              ...prev,
              [cli.id]: nuevaSit
            }));
            evaluados++;
          } else {
            errores++;
          }
        })
      );
    }

    setCargandoBCRA(false);
    setProgresoBcra('');
    alert(`Evaluación BCRA finalizada.\n✅ Procesados con éxito: ${evaluados}\n⚠️ No consultados: ${errores}`);
  };

  // AUTOCOMPLETAR RAZÓN SOCIAL AL INGRESAR CUIT EN NUEVO CLIENTE
  const buscarCuitEnPadron = async (cuitIngresado) => {
    const cuitLimpio = cuitIngresado.replace(/\D/g, '');
    if (cuitLimpio.length !== 11) return;

    setBuscandoCuitApi(true);
    try {
      const res = await fetch(`https://afip.republica.dev/cuit/${cuitLimpio}`);
      if (res.ok) {
        const data = await res.json();
        const nombreEncontrado = data.razon_social || data.nombre || data.razonSocial;
        if (nombreEncontrado) setRazonSocial(nombreEncontrado);
        if (data.condicion_iva) setCondicionIva(data.condicion_iva);
        if (data.domicilio) setDireccion(data.domicilio);
      }
    } catch (err) {
      console.log('No se pudo autocompletar CUIT:', err);
    } finally {
      setBuscandoCuitApi(false);
    }
  };

  const handleCuitChange = (e) => {
    const val = e.target.value;
    setCuitDni(val);
    const soloNumeros = val.replace(/\D/g, '');
    if (soloNumeros.length === 11) {
      buscarCuitEnPadron(soloNumeros);
    }
  };

  // AUTOCOMPLETAR NOMBRES PENDIENTES
  const autocompletarNombresPendientes = async () => {
    setCargandoNombres(true);
    const pendientes = clientes.filter((c) => {
      const valorCuit = String(c.cuit_dni || c.cuit || '').replace(/\D/g, '');
      const sinNombre = !c.razon_social || c.razon_social.trim() === '' || c.razon_social.includes('PENDIENTE');
      return sinNombre && valorCuit.length === 11;
    });

    if (pendientes.length === 0) {
      alert('No hay clientes pendientes de nombre que tengan un CUIT válido de 11 dígitos.');
      setCargandoNombres(false);
      return;
    }

    let actualizados = 0;
    for (const cli of pendientes) {
      const cuitLimpio = String(cli.cuit_dni || cli.cuit).replace(/\D/g, '');
      try {
        const res = await fetch(`https://afip.republica.dev/cuit/${cuitLimpio}`);
        if (res.ok) {
          const data = await res.json();
          const nombreEncontrado = data.razon_social || data.nombre || data.razonSocial;
          if (nombreEncontrado) {
            await supabase
              .from('clientes')
              .update({
                razon_social: nombreEncontrado,
                condicion_iva: data.condicion_iva || cli.condicion_iva,
                direccion: data.domicilio || cli.direccion
              })
              .eq('id', cli.id);
            actualizados++;
          }
        }
      } catch (e) {
        console.error(`Error procesando CUIT ${cuitLimpio}:`, e);
      }
    }

    setCargandoNombres(false);
    alert(`Proceso finalizado. Se actualizaron ${actualizados} clientes.`);
    cargarClientes();
  };

  const guardarNuevoCliente = async (e) => {
    e.preventDefault();
    setMensajeForm('');

    if (!razonSocial.trim()) {
      setMensajeForm('La Razón Social es obligatoria.');
      return;
    }

    const valorCuit = cuitDni.trim() || null;

    const payload = {
      razon_social: razonSocial.trim(),
      cuit_dni: valorCuit,
      cuit: valorCuit,
      condicion_iva: condicionIva,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      direccion: direccion.trim() || null
    };

    const { error } = await supabase.from('clientes').insert([payload]);

    if (error) {
      setMensajeForm(`Error al guardar: ${error.message}`);
    } else {
      setRazonSocial('');
      setCuitDni('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setMostrarModalNuevo(false);
      cargarClientes();
    }
  };

  const guardarCambiosCliente = async (e) => {
    e.preventDefault();
    if (!clienteDetalle) return;

    setGuardandoEdicion(true);
    const valorCuit = (clienteDetalle.cuit_dni || clienteDetalle.cuit || '').trim() || null;

    const { error } = await supabase
      .from('clientes')
      .update({
        razon_social: clienteDetalle.razon_social,
        cuit_dni: valorCuit,
        cuit: valorCuit,
        condicion_iva: clienteDetalle.condicion_iva,
        telefono: clienteDetalle.telefono,
        email: clienteDetalle.email,
        direccion: clienteDetalle.direccion
      })
      .eq('id', clienteDetalle.id);

    setGuardandoEdicion(false);

    if (error) {
      alert(`Error al actualizar cliente: ${error.message}`);
    } else {
      setClienteDetalle(null);
      cargarClientes();
    }
  };

  const borrarCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) {
      if (clienteDetalle?.id === id) setClienteDetalle(null);
      cargarClientes();
    }
  };

  const cambiarOrden = (columna) => {
    if (ordenColumna === columna) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenColumna(columna);
      setOrdenAsc(true);
    }
  };

  const clientesFiltrados = clientes
    .filter((c) => {
      const termino = busqueda.toLowerCase();
      const valorCuit = String(c.cuit_dni || c.cuit || '');
      return (
        (c.razon_social || '').toLowerCase().includes(termino) ||
        valorCuit.includes(termino) ||
        (c.direccion || '').toLowerCase().includes(termino) ||
        (c.telefono || '').toLowerCase().includes(termino) ||
        (c.email || '').toLowerCase().includes(termino)
      );
    })
    .sort((a, b) => {
      let valA = a[ordenColumna] || '';
      let valB = b[ordenColumna] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={autocompletarNombresPendientes}
            disabled={cargandoNombres}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: cargandoNombres ? 0.7 : 1 }}
          >
            {cargandoNombres ? '⏳ Procesando...' : '⚡ Autocompletar Nombres'}
          </button>

          <button 
            onClick={corroborarBCRAMasivamente}
            disabled={cargandoBCRA}
            style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: cargandoBCRA ? 0.7 : 1 }}
          >
            {cargandoBCRA ? `⏳ Consultando ${progresoBcra}...` : '🔍 Corroborar BCRA Masivamente'}
          </button>

          <button 
            onClick={() => { setMensajeForm(''); setMostrarModalNuevo(true); }}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Nuevo Cliente
          </button>
        </div>
      </div>

      {/* CONTENEDOR CÁLIDO */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', padding: '1.25rem' }}>
        
        {/* BUSCADOR Y CONTADOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Razón Social, CUIT, Dirección, Teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, maxWidth: '480px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb', color: '#2b2927', fontSize: '0.875rem' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#78716c', fontWeight: '600' }}>
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </span>
        </div>

        {/* TABLA DE CLIENTES */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', borderBottom: '2px solid #e2ddd3', color: '#57534e' }}>
                <th onClick={() => cambiarOrden('razon_social')} style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}>
                  Razón Social {ordenColumna === 'razon_social' ? (ordenAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th style={{ padding: '0.75rem 1rem' }}>CUIT / DNI</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Situación Crediticia</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Editar</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
                    No se encontraron clientes en el sistema.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const valorCuit = String(c.cuit_dni || c.cuit || '');
                  const cuitLimpio = valorCuit.replace(/\D/g, '');
                  const sitBcra = situacionesMap[c.id] || 1;
                  const estaCargandoInd = cargandoIndividualId === c.id;

                  return (
                    <tr 
                      key={c.id} 
                      style={{ borderBottom: '1px solid #f0ebe1', transition: 'background-color 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f0e6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td 
                        onClick={() => setClienteDetalle({ ...c })}
                        style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1c1917', cursor: 'pointer' }}
                      >
                        👤 {c.razon_social}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>
                        {valorCuit || '-'}
                      </td>
                      
                      {/* SITUACIÓN BCRA */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              if (cuitLimpio) {
                                window.open(`https://www.lamacro.ar/central-de-deudores/${cuitLimpio}`, '_blank');
                              } else {
                                alert('Este cliente no posee CUIT registrado.');
                              }
                            }}
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              border: 'none',
                              backgroundColor: sitBcra === 1 ? '#f0fdf4' : sitBcra <= 2 ? '#fefce8' : '#fef2f2',
                              color: sitBcra === 1 ? '#166534' : sitBcra <= 2 ? '#ca8a04' : '#dc2626',
                              outline: `1px solid ${sitBcra === 1 ? '#bbf7d0' : sitBcra <= 2 ? '#fef08a' : '#fecaca'}`
                            }}
                            title="Abrir informe en La Macro"
                          >
                            {sitBcra === 1 ? `Sit. 1 ✅` : `Sit. ${sitBcra} ⚠️ ALERTA`}
                          </button>

                          <button
                            onClick={(e) => corroborarBCRAIndividual(c, e)}
                            disabled={estaCargandoInd || !cuitLimpio}
                            style={{
                              backgroundColor: '#eeeae1',
                              border: '1px solid #dcd5c9',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: cuitLimpio ? 'pointer' : 'not-allowed',
                              fontSize: '0.75rem',
                              opacity: cuitLimpio ? 1 : 0.4
                            }}
                            title="Consultar BCRA solo para este cliente"
                          >
                            {estaCargandoInd ? '⏳' : '🔄'}
                          </button>
                        </div>
                      </td>

                      {/* EDITAR */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setClienteDetalle({ ...c })}
                          style={{ backgroundColor: '#f5f2eb', border: '1px solid #dcd5c9', color: '#2b2927', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                          title="Editar datos del cliente"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITAR CLIENTE */}
      {clienteDetalle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '14px', width: '100%', maxWidth: '580px', padding: '1.75rem', color: '#2b2927', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
            
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '2px solid #eeeae1', paddingBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#dc2626', letterSpacing: '0.05em' }}>
                  Ficha & Edición de Cliente
                </span>
                <h3 style={{ margin: '0.2rem 0 0 0', color: '#1c1917', fontSize: '1.35rem', fontWeight: '800' }}>
                  {clienteDetalle.razon_social}
                </h3>
              </div>
              <button onClick={() => setClienteDetalle(null)} style={{ background: '#eeeae1', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1rem', cursor: 'pointer', color: '#57534e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            <form onSubmit={guardarCambiosCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social *</label>
                <input
                  type="text"
                  value={clienteDetalle.razon_social || ''}
                  onChange={(e) => setClienteDetalle({ ...clienteDetalle, razon_social: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>CUIT / DNI</label>
                  <input
                    type="text"
                    value={clienteDetalle.cuit_dni || clienteDetalle.cuit || ''}
                    onChange={(e) => setClienteDetalle({ ...clienteDetalle, cuit_dni: e.target.value, cuit: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Condición IVA</label>
                  <select
                    value={clienteDetalle.condicion_iva || 'Responsable Inscripto'}
                    onChange={(e) => setClienteDetalle({ ...clienteDetalle, condicion_iva: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributo">Monotributo</option>
                    <option value="Exento">Exento</option>
                    <option value="Consumidor Final">Consumidor Final</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Teléfono</label>
                  <input
                    type="text"
                    value={clienteDetalle.telefono || ''}
                    onChange={(e) => setClienteDetalle({ ...clienteDetalle, telefono: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Email</label>
                  <input
                    type="email"
                    value={clienteDetalle.email || ''}
                    onChange={(e) => setClienteDetalle({ ...clienteDetalle, email: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Dirección / Localidad</label>
                <input
                  type="text"
                  value={clienteDetalle.direccion || ''}
                  onChange={(e) => setClienteDetalle({ ...clienteDetalle, direccion: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {/* BARRA BCRA EN MODAL */}
              <div style={{ backgroundColor: '#f5f2eb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e0d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#78716c', fontWeight: '700' }}>SITUACIÓN BCRA ACTUAL</span>
                  <span style={{ fontSize: '0.85rem', color: '#57534e' }}>
                    Sit. {situacionesMap[clienteDetalle.id] || 1} {(situacionesMap[clienteDetalle.id] || 1) > 1 ? '⚠️' : '✅'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => corroborarBCRAIndividual(clienteDetalle, e)}
                  disabled={cargandoIndividualId === clienteDetalle.id}
                  style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                >
                  {cargandoIndividualId === clienteDetalle.id ? '⏳ Consultando...' : '🔄 Reevaluar BCRA Ahora'}
                </button>
              </div>

              {/* ENLACE Y ELIMINAR */}
              <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {(clienteDetalle.cuit_dni || clienteDetalle.cuit) ? (
                  <a
                    href={`https://www.lamacro.ar/central-de-deudores/${String(clienteDetalle.cuit_dni || clienteDetalle.cuit).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    🔗 Consultar Padrón en La Macro ↗
                  </a>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => borrarCliente(clienteDetalle.id)}
                  style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                >
                  🗑️ Eliminar Cliente
                </button>
              </div>

              {/* BOTONES ACCIÓN */}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setClienteDetalle(null)} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoEdicion} style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                  {guardandoEdicion ? '💾 Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {mostrarModalNuevo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '1.5rem', color: '#2b2927', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '1.15rem' }}>➕ Cargar Nuevo Cliente</h3>
              <button onClick={() => setMostrarModalNuevo(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#78716c' }}>✕</button>
            </div>
            
            {mensajeForm && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {mensajeForm}
              </div>
            )}

            <form onSubmit={guardarNuevoCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                  CUIT / DNI (Autocompleta razón social al ingresar 11 dígitos)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Ej: 20123456789"
                    value={cuitDni}
                    onChange={handleCuitChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  />
                  {buscandoCuitApi && (
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#0284c7', fontWeight: 'bold' }}>
                      🔍 Buscando...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social *</label>
                <input
                  type="text"
                  placeholder="Se autocompleta con el CUIT o ingresala manualmente"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Condición IVA</label>
                <select
                  value={condicionIva}
                  onChange={(e) => setCondicionIva(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 2936414244"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Dirección / Localidad</label>
                  <input
                    type="text"
                    placeholder="Ej: Carhué"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setMostrarModalNuevo(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
