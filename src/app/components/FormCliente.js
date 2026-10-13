'use client';

export default function FormCliente({
  editingId,
  cuit, setCuit,
  razonSocial, setRazonSocial,
  condicionIva, setCondicionIva,
  email, setEmail,
  telefono, setTelefono,
  direccion, setDireccion,
  loadingCuit,
  mensajeCliente,
  onBuscarCuit,
  onGuardar,
  onCancelarEdicion
}) {
  return (
    <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px', border: '1px solid #334155', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.1rem' }}>
          {editingId ? '✏️ Editar Cliente' : 'Nuevo Cliente'}
        </h3>
        {editingId && (
          <button onClick={onCancelarEdicion} style={{ background: '#475569', color: '#fff', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Cancelar Edición
          </button>
        )}
      </div>

      {mensajeCliente && (
        <div style={{ padding: '0.5rem 1rem', borderRadius: '6px', marginBottom: '1rem', background: mensajeCliente.includes('éxito') || mensajeCliente.includes('✅') ? '#064e3b' : '#450a0a', color: mensajeCliente.includes('éxito') || mensajeCliente.includes('✅') ? '#a7f3d0' : '#fca5a5', fontSize: '0.9rem' }}>
          {mensajeCliente}
        </div>
      )}

      <form onSubmit={onGuardar} style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' }}>
        <div style={{ gridColumn: 'span 3' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>CUIT / CUIL</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="30708679263" 
              value={cuit} 
              onChange={(e) => setCuit(e.target.value)} 
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
            />
            <button type="button" onClick={onBuscarCuit} disabled={loadingCuit} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.5rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
              {loadingCuit ? '...' : 'Buscar'}
            </button>
          </div>
        </div>

        <div style={{ gridColumn: 'span 6' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Razón Social / Nombre</label>
          <input 
            type="text" 
            value={razonSocial} 
            onChange={(e) => setRazonSocial(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Condición IVA</label>
          <select 
            value={condicionIva} 
            onChange={(e) => setCondicionIva(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
          >
            <option value="Responsable Inscripto">Responsable Inscripto</option>
            <option value="Monotributo">Monotributo</option>
            <option value="Exento">Exento</option>
            <option value="Consumidor Final">Consumidor Final</option>
          </select>
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Dirección / Localidad</label>
          <input 
            type="text" 
            value={direccion} 
            onChange={(e) => setDireccion(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Teléfono</label>
          <input 
            type="text" 
            value={telefono} 
            onChange={(e) => setTelefono(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ gridColumn: 'span 4' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <div style={{ gridColumn: 'span 12', textAlign: 'right' }}>
          <button type="submit" style={{ background: editingId ? '#38bdf8' : '#f59e0b', color: '#0f172a', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {editingId ? '💾 Guardar Cambios' : '+ Guardar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
