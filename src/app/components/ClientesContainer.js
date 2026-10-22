'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [cuit, setCuit] = useState('');
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto');
  const [localidad, setLocalidad] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const { data } = await supabase.from('clientes').select('*').order('razon_social', { ascending: true });
    if (data) setClientes(data);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!razonSocial.trim()) return;

    await supabase.from('clientes').insert([{
      razon_social: razonSocial.trim(),
      cuit: cuit.trim(),
      condicion_iva: condicionIva,
      localidad: localidad.trim()
    }]);

    setRazonSocial('');
    setCuit('');
    setLocalidad('');
    setMostrarModal(false);
    cargarClientes();
  };

  const clientesFiltrados = clientes.filter(c => 
    (c.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.cuit || '').includes(busqueda)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Gestión de Clientes</h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>Listado y consulta de antecedentes</span>
        </div>

        <button 
          onClick={() => setMostrarModal(true)}
          style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* TABLA DE CLIENTES EN TONO BEIGE / CÁLIDO */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', padding: '1.25rem' }}>
        
        <input
          type="text"
          placeholder="🔍 Buscar por Razón Social, CUIT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '0.6rem 0.85rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb', color: '#2b2927', fontSize: '0.875rem' }}
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', borderBottom: '2px solid #e2ddd3', color: '#57534e' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Razón Social</th>
                <th style={{ padding: '0.75rem 1rem' }}>CUIT</th>
                <th style={{ padding: '0.75rem 1rem' }}>Condición IVA</th>
                <th style={{ padding: '0.75rem 1rem' }}>Localidad</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>BCRA / La Macro</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#a8a29e' }}>
                    No hay clientes registrados aún.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f0ebe1' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>{c.razon_social}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>{c.cuit || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#57534e' }}>{c.condicion_iva}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#57534e' }}>{c.localidad || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      {c.cuit ? (
                        <a
                          href={`[https://www.lamacro.ar/central-de-deudores/](https://www.lamacro.ar/central-de-deudores/)`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}
                        >
                          🔍 Consultar BCRA
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {mostrarModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '1.5rem', color: '#2b2927' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>➕ Cargar Nuevo Cliente</h3>
            <form onSubmit={guardarCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <input
                type="text"
                placeholder="Razón Social / Nombre Completo"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                required
                style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
              />
              <input
                type="text"
                placeholder="CUIT (sin guiones)"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
              />
              <select
                value={condicionIva}
                onChange={(e) => setCondicionIva(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
              >
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="Consumidor Final">Consumidor Final</option>
              </select>
              <input
                type="text"
                placeholder="Localidad / Ciudad"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
              />
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
