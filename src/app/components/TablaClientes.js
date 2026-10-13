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
  const [sortField, setSortField] = useState('razon_social');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'bcra' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) return <span style={{ color: '#64748b', fontSize: '0.75rem', marginLeft: '0.25rem' }}>⇅</span>;
    return <span style={{ color: '#f59e0b', fontSize: '0.75rem', marginLeft: '0.25rem' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>;
  };

  const clientesFiltrados = clientes.filter((c) => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;
    const razon = (c.razon_social || '').toLowerCase();
    const cuitStr = (c.cuit || '').toLowerCase();
    const iva = (c.condicion_iva || '').toLowerCase();
    const tel = (c.telefono || '').toLowerCase();
    const dir = (c.direccion || '').toLowerCase();
    return razon.includes(term) || cuitStr.includes(term) || iva.includes(term) || tel.includes(term) || dir.includes(term);
  });

  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    let valA;
    let valB;

    if (sortField === 'razon_social') {
      valA = (a.razon_social || '').toLowerCase();
      valB = (b.razon_social || '').toLowerCase();
    } else if (sortField === 'cuit') {
      valA = a.cuit || '';
      valB = b.cuit || '';
    } else if (sortField === 'condicion_iva') {
      valA = (a.condicion_iva || '').toLowerCase();
      valB = (b.condicion_iva || '').toLowerCase();
    } else if (sortField === 'bcra') {
      valA = resultadosBcra[a.id]?.maxSit || 0;
      valB = resultadosBcra[b.id]?.maxSit || 0;
    } else {
      return 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
      {/* BARRA DE BÚSQUEDA */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 Buscar cliente por Razón Social, CUIT, Localidad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', maxWidth: '450px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
        />
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          Mostrando {clientesOrdenados.length} de {clientes.length}
        </span>
      </div>

      {/* TABLA DE CLIENTES */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155', userSelect: 'none' }}>
            <th onClick={() => handleSort('razon_social')} style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
              Razón Social {renderSortIcon('razon_social')}
            </th>
            <th onClick={() => handleSort('cuit')} style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
              CUIT {renderSortIcon('cuit')}
            </th>
            <th onClick={() => handleSort('condicion_iva')} style={{ padding: '0.85rem 1rem', cursor: 'pointer' }}>
              Cond. IVA {renderSortIcon('condicion_iva')}
            </th>
            <th onClick={() => handleSort('bcra')} style={{ padding: '0.85rem 1rem', textAlign: 'center', cursor: 'pointer' }}>
              Situación BCRA {renderSortIcon('bcra')}
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
              const cleanCuit = c.cuit ? c.cuit.replace(/\D/g, '') : '';
              const urlLaMacro = `https://www.lamacro.ar/central-de-deudores/${cleanCuit}`;

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
                    {cleanCuit ? (
                      <a
                        href={urlLaMacro}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver informe completo en La Macro"
                        style={{ textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {res ? (
                          <>
                            <span style={{ 
                              padding: '0.3rem 0.8rem', 
                              borderRadius: '20px', 
                              fontSize: '0.8rem', 
                              fontWeight: 'bold',
                              background: style.bg,
                              color: style.color,
                              border: `1px solid ${style.border}`,
                              cursor: 'pointer'
                            }}>
                              {style.label} ↗
                            </span>
                            {res.chequesRechazados > 0 && (
                              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
                                ⚠️ {res.chequesRechazados} cheque(s)
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#38bdf8', textDecoration: 'underline', cursor: 'pointer' }}>
                            Ver en La Macro ↗
                          </span>
                        )}
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin CUIT</span>
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
