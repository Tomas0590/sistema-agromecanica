'use client';

export default function FormProducto({
  editingId,
  sku, setSku,
  descripcion, setDescripcion,
  categoria, setCategoria,
  marca, setMarca,
  ubicacion, setUbicacion,
  precioCosto, setPrecioCosto,
  precioVenta, setPrecioVenta,
  stockActual, setStockActual,
  stockMinimo, setStockMinimo,
  mensajeProducto,
  onGuardar,
  onCancelar
}) {
  return (
    <div 
      onClick={onCancelar}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          padding: '1.75rem',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingId ? '✏️ Editar Producto' : '📦 Nuevo Producto'}
          </h3>
          <button 
            type="button" 
            onClick={onCancelar}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        {mensajeProducto && (
          <div style={{ background: '#451a03', border: '1px solid #f59e0b', color: '#fef3c7', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {mensajeProducto}
          </div>
        )}

        <form onSubmit={onGuardar}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 'bold' }}>Código / SKU *</label>
              <input
                type="text"
                placeholder="Ej: LAN-102"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 'bold' }}>Descripción / Nombre *</label>
              <input
                type="text"
                placeholder="Ej: Filtro de Aceite LANSS"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Categoría / Rubro</label>
              <input
                type="text"
                placeholder="Ej: Filtros"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Marca</label>
              <input
                type="text"
                placeholder="Ej: LANSS"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Ubicación</label>
              <input
                type="text"
                placeholder="Ej: Estante B1"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>P. Costo ($)</label>
              <input
                type="number"
                step="0.01"
                value={precioCosto}
                onChange={(e) => setPrecioCosto(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>P. Venta ($)</label>
              <input
                type="number"
                step="0.01"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Stock Actual</label>
              <input
                type="number"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Stock Mínimo</label>
              <input
                type="number"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onCancelar}
              style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ background: editingId ? '#d97706' : '#16a34a', color: '#fff', border: 'none', padding: '0.6rem 1.4rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              {editingId ? 'Guardar Cambios' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
