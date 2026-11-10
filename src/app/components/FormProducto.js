'use client';

export default function FormProducto({
  editingId,
  sku, setSku,
  descripcion, setDescripcion,
  categoria, setCategoria,
  subcategoria, setSubcategoria,
  marca, setMarca,
  ubicacion, setUbicacion,
  precioCosto, setPrecioCosto,
  precioVenta, setPrecioVenta,
  precioUsd, setPrecioUsd,
  moneda, setMoneda,
  cotizacionBna = 1200,
  stockActual, setStockActual,
  stockMinimo, setStockMinimo,
  categoriasExistentes = [],
  subcategoriasExistentes = [],
  mensajeProducto,
  onGuardar,
  onCancelar
}) {
  const esUsd = moneda === 'USD';
  const valUsdNum = parseFloat(precioUsd) || 0;
  const equivalenciaArs = valUsdNum * cotizacionBna;

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
          maxWidth: '650px',
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
                placeholder="Ej: Pico de Pulverización TeeJet"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Categoría / Rubro</label>
              <input
                list="lista-categorias"
                type="text"
                placeholder="Ej: Pulverización"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <datalist id="lista-categorias">
                {categoriasExistentes.map((cat, i) => (
                  <option key={i} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Subcategoría</label>
              <input
                list="lista-subcategorias"
                type="text"
                placeholder="Ej: Picos, Bombas, Pastillas..."
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <datalist id="lista-subcategorias">
                {subcategoriasExistentes.map((sub, i) => (
                  <option key={i} value={sub} />
                ))}
              </datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>Marca</label>
              <input
                type="text"
                placeholder="Ej: Arag, TeeJet, Hypro"
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

          {/* SECCIÓN BIMONETARIA USD / ARS */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.5rem', fontWeight: 'bold' }}>Moneda de Origen del Repuesto</label>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: !esUsd ? '#22c55e' : '#cbd5e1' }}>
                <input type="radio" name="moneda" value="ARS" checked={!esUsd} onChange={() => setMoneda('ARS')} style={{ accentColor: '#22c55e' }} /> 🇦🇷 Pesos (ARS)
              </label>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: esUsd ? '#38bdf8' : '#cbd5e1' }}>
                <input type="radio" name="moneda" value="USD" checked={esUsd} onChange={() => setMoneda('USD')} style={{ accentColor: '#38bdf8' }} /> 🇺🇸 Dólares (USD)
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: esUsd ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>P. Costo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={precioCosto}
                  onChange={(e) => setPrecioCosto(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {esUsd ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#38bdf8', marginBottom: '0.25rem', fontWeight: 'bold' }}>P. Venta USD *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={precioUsd}
                      onChange={(e) => setPrecioUsd(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid #38bdf8', background: '#1e293b', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 'bold', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#22c55e', marginBottom: '0.25rem', fontWeight: 'bold' }}>Equiv. ARS (BNA)</label>
                    <div style={{ padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid #22c55e', background: '#14532d', color: '#4ade80', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      $ {equivalenciaArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#22c55e', marginBottom: '0.25rem', fontWeight: 'bold' }}>P. Venta ARS ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '6px', border: '1px solid #22c55e', background: '#1e293b', color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            {esUsd && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem', display: 'block' }}>
                💡 Cotización Dólar BNA Venta de referencia: <strong>${cotizacionBna}</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
