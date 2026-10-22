'use client';

import { useState } from 'react';

export default function TablaStock({ productos, onPrepararEdicion, onBorrarProducto }) {
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState('');

  const categoriasUnicas = Array.from(new Set(productos.map((p) => p.categoria).filter(Boolean))).sort();

  const productosFiltrados = productos.filter((p) => {
    const coincideTexto = 
      (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.marca || '').toLowerCase().includes(busqueda.toLowerCase());

    const coincideCat = !catFiltro || p.categoria === catFiltro;

    return coincideTexto && coincideCat;
  });

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '1.25rem' }}>
      
      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por código SKU, descripción o marca..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ flex: 2, minWidth: '240px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.875rem' }}
        />

        <select
          value={catFiltro}
          onChange={(e) => setCatFiltro(e.target.value)}
          style={{ flex: 1, minWidth: '180px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.875rem' }}
        >
          <option value="">Todas las categorías</option>
          {categoriasUnicas.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
              <th style={{ padding: '0.75rem 1rem' }}>Descripción</th>
              <th style={{ padding: '0.75rem 1rem' }}>Categoría / Sub</th>
              <th style={{ padding: '0.75rem 1rem' }}>Marca</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>P. Venta</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No se encontraron productos registrados.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => {
                const bajoStock = p.stock_actual <= p.stock_minimo;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#dc2626' }}>{p.sku || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#0f172a' }}>{p.descripcion}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {p.categoria || 'SIN CAT'}
                      </span>
                      {p.subcategoria && <span style={{ marginLeft: '0.4rem', color: '#64748b', fontSize: '0.75rem' }}>/ {p.subcategoria}</span>}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{p.marca || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                      ${Number(p.precio_venta || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: bajoStock ? '#fef2f2' : '#f0fdf4',
                        color: bajoStock ? '#dc2626' : '#166534',
                        border: `1px solid ${bajoStock ? '#fecaca' : '#bbf7d0'}`
                      }}>
                        {p.stock_actual} {bajoStock ? '⚠️' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => onPrepararEdicion(p)}
                          style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => onBorrarProducto(p.id)}
                          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
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
    </div>
  );
}
