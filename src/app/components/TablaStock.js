'use client';

import { useState } from 'react';

export default function TablaStock({ productos, onPrepararEdicion, onBorrarProducto }) {
  const [busqueda, setBusqueda] = useState('');

  const productosFiltrados = productos.filter((p) => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;
    return (
      (p.sku || '').toLowerCase().includes(term) ||
      (p.descripcion || '').toLowerCase().includes(term) ||
      (p.categoria || '').toLowerCase().includes(term) ||
      (p.marca || '').toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por SKU, descripción, rubro, marca..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: '100%', maxWidth: '450px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
        />
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
          Mostrando {productosFiltrados.length} de {productos.length}
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155' }}>
            <th style={{ padding: '0.85rem 1rem' }}>SKU</th>
            <th style={{ padding: '0.85rem 1rem' }}>Descripción</th>
            <th style={{ padding: '0.85rem 1rem' }}>Categoría / Marca</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>P. Venta</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Stock</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                {busqueda ? 'No se encontraron productos que coincidan.' : 'No hay productos en el inventario aún.'}
              </td>
            </tr>
          ) : (
            productosFiltrados.map((p) => {
              const bajoStock = p.stock_actual <= p.stock_minimo;
              const sinStock = p.stock_actual <= 0;

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#f59e0b', fontFamily: 'monospace' }}>
                    {p.sku}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#f8fafc', fontWeight: 'bold' }}>
                    {p.descripcion}
                    {p.ubicacion && <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>📍 {p.ubicacion}</span>}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                    {p.categoria || '-'} {p.marca ? `(${p.marca})` : ''}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 'bold', color: '#38bdf8' }}>
                    ${Number(p.precio_venta || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: sinStock ? '#450a0a' : bajoStock ? '#451a03' : '#064e3b',
                      color: sinStock ? '#ef4444' : bajoStock ? '#f59e0b' : '#22c55e',
                      border: `1px solid ${sinStock ? '#ef4444' : bajoStock ? '#f59e0b' : '#15803d'}`
                    }}>
                      {p.stock_actual} un. {sinStock ? '❌ Agotado' : bajoStock ? '⚠️ Bajo' : ''}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => onPrepararEdicion(p)}
                        style={{ background: '#334155', color: '#f59e0b', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onBorrarProducto(p.id)}
                        style={{ background: '#450a0a', color: '#ef4444', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🗑️
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
