'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // Estados de procesos masivos
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

  // AUTOCOMPLETAR RAZÓN SOCIAL AL TIPEAR CUIT (11 DÍGITOS)
  const buscarCuitEnPadron = async (cuitIngresado) => {
    const cuitLimpio = cuitIngresado.replace(/\D/g, '');
    if (cuitLimpio.length !== 11) return;

    setBuscandoCuitApi(true);
    try {
      // Consulta a padrón AFIP / CUIT abierto
      const res = await fetch(`https://afip.republica.dev/cuit/${cuitLimpio}`);
      if (res.ok) {
        const data = await res.json();
        const nombreEncontrado = data.razon_social || data.nombre || data.razonSocial;
        if (nombreEncontrado) {
          setRazonSocial(nombreEncontrado);
        }
        if (data.condicion_iva) setCondicionIva(data.condicion_iva);
        if (data.domicilio) setDireccion(data.domicilio);
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

  const guardarCliente = async (e) => {
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
      const valorCuit = c.cuit_dni || c.cuit || '';
      return (
        (c.razon_social || '').toLowerCase().includes(termino) ||
        valorCuit.includes(termino) ||
        (c.direccion || '').toLowerCase().includes(termino) ||
        (c.telefono || '').toLowerCase().includes(termino)
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

        <button 
          onClick={() => { setMensajeForm(''); setMostrarModal(true); }}
          style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* CONTENEDOR CÁLIDO */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', padding: '1.25rem' }}>
        
        {/* BUSCADOR Y CONTADOR */}
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

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', borderBottom: '2px solid #e2ddd3', color: '#57534e' }}>
                <th onClick={() => cambiarOrden('razon_social')} style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}>
                  Razón Social {ordenColumna === 'razon_social' ? (ordenAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th style={{ padding: '0.75rem 1rem' }}>CUIT / DNI</th>
                <th style={{ padding: '0.75rem 1rem' }}>Cond. IVA</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contacto / Dirección</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Consulta La Macro</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const valorCuit = c.cuit_dni || c.cuit || '';

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0ebe1' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                        {c.razon_social}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>
                        {valorCuit || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#57534e' }}>
                        {c.condicion_iva || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#57534e' }}>
                        {c.direccion || '-'} {c.telefono ? `(${c.telefono})` : ''}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {valorCuit ? (
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

      {/* MODAL NUEVO CLIENTE */}
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
