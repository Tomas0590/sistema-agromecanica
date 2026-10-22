'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // Estados de carga de procesos masivos
  const [cargandoBCRA, setCargandoBCRA] = useState(false);
  const [cargandoNombres, setCargandoNombres] = useState(false);
  const [buscandoCuitApi, setBuscandoCuitApi] = useState(false);

  // Campos para el formulario
  const [razonSocial, setRazonSocial] = useState('');
  const [cuitDni, setCuitDni] = useState('');
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeForm, setMensajeForm] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true });

    if (!error && data) {
      setClientes(data);
    }
  };

  // AUTO-COMPLETAR RAZÓN SOCIAL Y CONDICIÓN IVA DESDE CUIT
  const buscarCuitEnPadron = async (cuitIngresado) => {
    const cuitLimpio = cuitIngresado.replace(/\D/g, '');
    if (cuitLimpio.length !== 11) return;

    setBuscandoCuitApi(true);
    try {
      // Consulta a API de padrón público / AFIP
      const res = await fetch(`https://afip.sstack.app/api/v1/cuit/${cuitLimpio}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.razonSocial || data.nombre)) {
          setRazonSocial(data.razonSocial || data.nombre);
          if (data.condicionIva) setCondicionIva(data.condicionIva);
          if (data.domicilio) setDireccion(data.domicilio);
        }
      }
    } catch (err) {
      console.log('No se pudo autocompletar CUIT automáticamente:', err);
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

  // PROCESO MASIVO: AUTOCOMPLETAR NOMBRES PENDIENTES
  const autocompletarNombresPendientes = async () => {
    setCargandoNombres(true);
    const pendientes = clientes.filter(c => (!c.razon_social || c.razon_social.trim() === '' || c.razon_social.includes('PENDIENTE')) && c.cuit_dni);

    if (pendientes.length === 0) {
      alert('No hay clientes con Razón Social pendiente o incompleta.');
      setCargandoNombres(false);
      return;
    }

    let actualizados = 0;
    for (const cli of pendientes) {
      const cuitLimpio = (cli.cuit_dni || '').replace(/\D/g, '');
      if (cuitLimpio.length === 11) {
        try {
          const res = await fetch(`https://afip.sstack.app/api/v1/cuit/${cuitLimpio}`);
          if (res.ok) {
            const data = await res.json();
            const nombreEncontrado = data.razonSocial || data.nombre;
            if (nombreEncontrado) {
              await supabase.from('clientes').update({ 
                razon_social: nombreEncontrado,
                condicion_iva: data.condicionIva || cli.condicion_iva
              }).eq('id', cli.id);
              actualizados++;
            }
          }
        } catch (e) {
          console.error(`Error procesando CUIT ${cuitLimpio}:`, e);
        }
      }
    }

    setCargandoNombres(false);
    alert(`Proceso finalizado. Se actualizaron ${actualizados} cliente(s).`);
    cargarClientes();
  };

  // PROCESO MASIVO: CORROBORAR SITUACIÓN BCRA
  const corroborarBCRAMasivamente = async () => {
    setCargandoBCRA(true);
    const clientesConCuit = clientes.filter(c => c.cuit_dni && c.cuit_dni.replace(/\D/g, '').length === 11);

    if (clientesConCuit.length === 0) {
      alert('No hay clientes con CUIT válido para consultar en el BCRA.');
      setCargandoBCRA(false);
      return;
    }

    let evaluados = 0;
    for (const cli of clientesConCuit) {
      const cuitLimpio = cli.cuit_dni.replace(/\D/g, '');
      try {
        const res = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitLimpio}`);
        if (res.ok) {
          const data = await res.json();
          let peorSituacion = 1;
          if (data.results && data.results.periodos && data.results.periodos.length > 0) {
            const deudas = data.results.periodos[0].entidades || [];
            deudas.forEach(e => {
              if (e.situacion > peorSituacion) peorSituacion = e.situacion;
            });
          }
          await supabase.from('clientes').update({ situacion_bcra: peorSituacion }).eq('id', cli.id);
          evaluados++;
        }
      } catch (e) {
        console.error(`Error consultando BCRA para CUIT ${cuitLimpio}:`, e);
      }
    }

    setCargandoBCRA(false);
    alert(`Evaluación BCRA finalizada. Se procesaron ${evaluados} cliente(s).`);
    cargarClientes();
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    setMensajeForm('');

    if (!razonSocial.trim()) {
      setMensajeForm('La Razón Social es obligatoria.');
      return;
    }

    const payload = {
      razon_social: razonSocial.trim(),
      cuit_dni: cuitDni.trim() || null,
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
      setMostrarModal(false);
      cargarClientes();
    }
  };

  const borrarCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) cargarClientes();
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
      const cuitValor = c.cuit_dni || c.cuit || '';
      return (
        (c.razon_social || '').toLowerCase().includes(termino) ||
        cuitValor.includes(termino) ||
        (c.direccion || c.localidad || '').toLowerCase().includes(termino)
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
      {/* CABECERA CON BOTONES ACCIÓN */}
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
            {cargandoNombres ? '⏳ Autocompletando...' : '⚡ Autocompletar Nombres Pendientes'}
          </button>

          <button 
            onClick={corroborarBCRAMasivamente}
            disabled={cargandoBCRA}
            style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: cargandoBCRA ? 0.7 : 1 }}
          >
            {cargandoBCRA ? '⏳ Consultando BCRA...' : '🔍 Corroborar BCRA Masivamente'}
          </button>

          <button 
            onClick={() => { setMensajeForm(''); setMostrarModal(true); }}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Nuevo Cliente
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE TABLA EN BEIGE CÁLIDO */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', padding: '1.25rem' }}>
        
        {/* BUSCADOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Razón Social, CUIT, Dirección..."
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
                <th style={{ padding: '0.75rem 1rem' }}>Cond. IVA</th>
                <th style={{ padding: '0.75rem 1rem' }}>Dirección / Tel</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Sit. BCRA</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Consulta La Macro</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
                    No se encontraron clientes en el sistema.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const cuitVal = c.cuit_dni || c.cuit || '';
                  const sitBcra = c.situacion_bcra || 1;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0ebe1' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                        {c.razon_social}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>
                        {cuitVal || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#57534e' }}>
                        {c.condicion_iva || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#57534e' }}>
                        {c.direccion || c.localidad || '-'} {c.telefono ? `(${c.telefono})` : ''}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: sitBcra === 1 ? '#f0fdf4' : sitBcra <= 2 ? '#fefce8' : '#fef2f2',
                          color: sitBcra === 1 ? '#166534' : sitBcra <= 2 ? '#ca8a04' : '#dc2626',
                          border: `1px solid ${sitBcra === 1 ? '#bbf7d0' : sitBcra <= 2 ? '#fef08a' : '#fecaca'}`
                        }}>
                          Sit. {sitBcra} {sitBcra > 1 ? '⚠️' : '✅'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {cuitVal ? (
                          <a
                            href="https://www.lamacro.ar/central-de-deudores/"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
                          >
                            🔗 Ver La Macro
                          </a>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => borrarCliente(c.id)}
                          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          🗑️
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

      {/* MODAL NUEVO CLIENTE CON AUTOCOMPLETADO AUTOMÁTICO */}
      {mostrarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '1.5rem', color: '#2b2927', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#dc2626', fontSize: '1.15rem' }}>➕ Cargar Nuevo Cliente</h3>
              <button onClick={() => setMostrarModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#78716c' }}>✕</button>
            </div>
            
            {mensajeForm && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {mensajeForm}
              </div>
            )}

            <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                  CUIT / DNI (Autocompleta nombre al tipear 11 dígitos)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Ej: 20123456789 (Sin guiones)"
                    value={cuitDni}
                    onChange={handleCuitChange}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                  />
                  {buscandoCuitApi && (
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#0284c7', fontWeight: 'bold' }}>
                      🔍 Buscando en padrón...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social *</label>
                <input
                  type="text"
                  placeholder="Se completa solo al ingresar el CUIT o podés tipearlo"
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
                <button type="button" onClick={() => setMostrarModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
