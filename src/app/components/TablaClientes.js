'use client';

import { useState } from 'react';

const SITUATION_STYLES = {
  1: { label: 'Sit 1 - Normal', bg: '#064e3b', color: '#22c55e', border: '#15803d' },
  2: { label: 'Sit 2 - Riesgo Bajo', bg: '#1a2e05', color: '#84cc16', border: '#4d7c0f' },
  3: { label: 'Sit 3 - Riesgo Medio', bg: '#451a03', color: '#f59e0b', border: '#b45309' },
  4: { label: 'Sit 4 - Riesgo Alto', bg: '#431407', color: '#ea580c', border: '#c2410c' },
  5: { label: 'Sit 5 - Irrecuperable', bg: '#450a0a', color: '#ef4444', border: '#b91c1c' },
  6: { label: 'Sit 6 - Irrec. Técnica', bg: '#450a0a', color: '#b91c1c', border: '#7f1d1d' },
};

export default function TablaClientes({ clientes, resultadosBcra, loadingBcraId, onConsultarBcra, onPrepararEdicion, onSelectCliente }) {
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  const cambiarOrden = (columna) => {
    if (ordenColumna === columna) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenColumna(columna);
      setOrdenAsc(true);
    }
  };

  // 1. Filtrar por texto (Razón Social o CUIT)
  const clientesFiltrados = clientes.filter((c) => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return true;
    const razon = (c.razon_social || '').toLowerCase();
    const cuitClean = (c.cuit || '').replace(/\D/g, '');
    return razon.includes(query) || cuitClean.includes(query);
  });

  // 2. Ordenar clientes según la columna seleccionada
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (ordenColumna === 'razon_social') {
      const valA = (a.razon_social || '').toLowerCase();
      const valB = (b.razon_social || '').toLowerCase();
      return ordenAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (ordenColumna === 'cuit') {
      const valA = a.cuit || '';
      const valB = b.cuit || '';
      return ordenAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (ordenColumna === 'condicion_iva') {
      const valA = (a.condicion_iva || '').toLowerCase();
      const valB = (b.condicion_iva || '').toLowerCase();
      return ordenAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    if (ordenColumna === 'bcra') {
      const sitA = resultadosBcra[a.id]?.maxSit || 0;
      const sitB = resultadosBcra[b.id]?.maxSit || 0;
      return ordenAsc ? sitB - sitA : sitA - sitB; // Muestra mayor riesgo primero
    }

    return 0;
  });

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
      
      {/* BARRA DE BÚSQUEDA */}
      <div style={{ padding: '0.85rem 1rem', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <input 
          type="text"
          placeholder="Buscar cliente por Razón Social o CUIT..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
        />
        {busqueda && (
          <button 
            onClick={() => setBusqueda('')}
            style={{ background: '#334155', border: 'none', color: '#94a3b8', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            Limpiar
          </button>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155', userSelect: 'none' }}>
            <th onClick={() => cambiarOrden('razon_social')} style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
              Razón Social ({clientesOrdenados.length}) {ordenColumna === 'razon_social' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => cambiarOrden('cuit')} style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
              CUIT {ordenColumna === 'cuit' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => cambiarOrden('condicion_iva')} style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
              Cond. IVA {ordenColumna === 'condicion_iva' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            <th onClick={() => cambiarOrden('bcra')} style={{ padding: '0.85rem 1rem', textAlign: 'center', cursor: 'pointer' }}>
              Situación BCRA {ordenColumna === 'bcra' ? (ordenAsc ? '▲ (Mayor Riesgo)' : '▼ (Menor Riesgo)') : ''}
            </th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {clientesOrdenados.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                {busqueda ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados aún.'}
              </td>
            </tr>
          ) : (
            clientesOrdenados.map((c) => {
              const res = resultadosBcra[c.id];
              const style = res ? (SITUATION_STYLES[res.maxSit] || SITUATION_STYLES[1]) : null;

              return (
                <tr 
                  key={c.id} 
                  style={{ borderBottom: '1px solid #334155', cursor: 'pointer' }}
                  onClick={() => onSelectCliente(c)}
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
                        onClick={() => onConsultarBcra(c.id, c.cuit)}
                        disabled={loadingBcraId === c.id}
                        style={{ background: '#1e40af', color: '#93c5fd', border: 'none', padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        {loadingBcraId === c.id ? '...' : 'Consultar BCRA'}
                      </button>
                      <button 
                        onClick={() => onPrepararEdicion(c)}
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
  );
}
