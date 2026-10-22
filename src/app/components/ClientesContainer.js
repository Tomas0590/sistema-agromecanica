'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // Formulario
  const [razonSocial, setRazonSocial] = useState('');
  const [cuitDni, setCuitDni] = useState('');
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto');
  const [localidad, setLocalidad] = useState('');
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

    if (error) {
      console.error('Error Supabase:', error);
    } else if (data) {
      setClientes(data);
    }
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
      cuit_dni: cuitDni.trim(),
      condicion_iva: condicionIva,
      direccion: localidad.trim()
    };

    const { error } = await supabase.from('clientes').insert([payload]);

    if (error) {
      setMensajeForm(`Error al guardar: ${error.message}`);
    } else {
      setRazonSocial('');
      setCuitDni('');
      setLocalidad('');
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
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Gestión de Clientes y Cuentas Corrientes
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Base de datos de clientes, CUITs y consulta de riesgo crediticio
          </span>
        </div>

        <button 
          onClick={() => { setMensajeForm(''); setMostrarModal(true); }}
          style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* CONTENEDOR EN BEIGE CÁLIDO */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', padding: '1.25rem' }}>
        
        {/* BUSCADOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Razón Social, CUIT o Localidad..."
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
                <th style={{ padding: '0.75rem 1rem' }}>Localidad / Dir</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Consulta BCRA</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
                    No hay clientes para mostrar.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const cuitVal = c.cuit_dni || c.cuit || '';

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
                        {c.direccion || c.localidad || '-'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        {cuitVal ? (
                          <a
                            href="[https://www.lamacro.ar/central-de-deudores/](https://www.lamacro.ar/central-de-deudores/)"
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
                          >
                            🔍 Consultar BCRA
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

      {/* MODAL */}
      {mostrarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.5rem', color: '#2b2927' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>➕ Cargar Nuevo Cliente</h3>
            
            {mensajeForm && (
              <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.5rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {mensajeForm}
              </div>
            )}

            <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social *</label>
                <input
                  type="text"
                  placeholder="Ej: Perez Juan o Agrícola S.A."
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>CUIT / DNI</label>
                <input
                  type="text"
                  placeholder="Ej: 20123456789"
                  value={cuitDni}
                  onChange={(e) => setCuitDni(e.target.value)}
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

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Localidad / Dirección</label>
                <input
                  type="text"
                  placeholder="Ej: Carhué"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
