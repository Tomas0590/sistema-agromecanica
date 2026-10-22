'use client';

import { useState } from 'react';

export default function TablaStock({ productos, onPrepararEdicion, onBorrarProducto }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('');

  // 1. Obtener lista única de Categorías disponibles en el inventario
  const categoriasDisponibles = Array.from(
    new Set(productos.map((p) => p.categoria).filter((c) => c && c.trim() !== ''))
  ).sort();

  // 2. Obtener lista única de Subcategorías (filtradas por Categoría seleccionada si corresponde)
  const subcategoriasDisponibles = Array.from(
    new Set(
      productos
        .filter((p) => !filtroCategoria || (p.categoria || '').toLowerCase() === filtroCategoria.toLowerCase())
        .map((p) => p.subcategoria)
        .filter((s) => s && s.trim() !== '')
    )
  ).sort();

  // 3. Aplicar filtros combinados (Buscador + Categoría + Subcategoría)
  const productosFiltrados = productos.filter((p) => {
    const term = busqueda.toLowerCase().trim();

    const coincideTexto =
      !term ||
      (p.sku || '').toLowerCase().includes(term) ||
      (p.descripcion || '').toLowerCase().includes(term) ||
      (p.marca || '').toLowerCase().includes(term) ||
      (p.ubicacion || '').toLowerCase().includes(term);

    const coincideCat = !filtroCategoria || (p.categoria || '').toLowerCase() === filtroCategoria.toLowerCase();
    const coincideSubcat = !filtroSubcategoria || (p.subcategoria || '').toLowerCase() === filtroSubcategoria.toLowerCase();

    return coincideTexto && coincideCat && coincideSubcat;
  });

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setFiltroSubcategoria('');
  };

  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
      
      {/* BARRA DE FILTROS */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #334155', background: '#0f172a', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* BUSCADOR LIBRE */}
          <input
            type="text"
            placeholder="🔍 Buscar por SKU, descripción, marca, ubicación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: '1 1 250px', padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          />

          {/* DESPLEGABLE CATEGORÍA */}
          <select
            value={filtroCategoria}
            onChange={(e) => {
              setFiltroCategoria(e.target.value);
              setFiltroSubcategoria(''); // Reiniciar subcategoría si cambia la categoría
            }}
            style={{ flex: '1 1 180px', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="">📂 Todas las Categorías</option>
            {categoriasDisponibles.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>

          {/* DESPLEGABLE SUBCATEGORÍA */}
          <select
            value={filtroSubcategoria}
            onChange={(e) => setFiltroSubcategoria(e.target.value)}
            style={{ flex: '1 1 180px', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
          >
            <option value="">📁 Todas las Subcategorías</option>
            {subcategoriasDisponibles.map((sub, i) => (
              <option key={i} value={sub}>{sub}</option>
            ))}
          </select>

          {/* BOTÓN LIMPIAR */}
          {(busqueda || filtroCategoria || filtroSubcategoria) && (
            <button
              onClick={limpiarFiltros}
              style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '0.6rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
            >
              🧹 Limpiar
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {filtroCategoria && <strong>Categoría: {filtroCategoria} </strong>}
            {filtroSubcategoria && <strong>| Subcategoría: {filtroSubcategoria}</strong>}
          </span>
          <span>Mostrando {productosFiltrados.length} de {productos.length} artículos</span>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155' }}>
            <th style={{ padding: '0.85rem 1rem' }}>SKU</th>
            <th style={{ padding: '0.85rem 1rem' }}>Descripción</th>
            <th style={{ padding: '0.85rem 1rem' }}>Categoría / Subcategoría</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>P. Venta</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Stock</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No se encontraron productos con los filtros seleccionados.
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
                    <div>
                      <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{p.categoria || '-'}</span>
                      {p.subcategoria ? <span style={{ color: '#94a3b8' }}> › {p.subcategoria}</span> : ''}
                    </div>
                    {p.marca && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Marca: {p.marca}</span>}
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
