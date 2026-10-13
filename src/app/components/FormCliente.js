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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '560px',
        padding: '1.75rem',
        color: '#f8fafc',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingId ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
          </h3>
          <button 
            type="button" 
            onClick={onCancelarEdicion}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        {mensajeCliente && (
          <div style={{
            background: mensajeCliente.includes('✅') || mensajeCliente.includes('éxito') ? '#064e3b' : mensajeCliente.includes('⚠️') ? '#451a03' : '#1e3a8a',
            border: `1px solid ${mensajeCliente.includes('✅') || mensajeCliente.includes('éxito') ? '#10b981' : mensajeCliente.includes('⚠️') ? '#f59e0b' : '#3b82f6'}`,
            color: '#fff',
            padding: '0.75rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            {mensajeCliente}
          </div>
        )}

        <form onSubmit={onGuardar}>
          {/* CUIT + AUTOCOMPLETAR */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 'bold' }}>
              CUIT (11 dígitos) *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ej: 20123456789"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={onBuscarCuit}
                disabled={loadingCuit}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loadingCuit ? '⏳ Buscando...' : '⚡ Autocompletar'}
              </button>
            </div>
          </div>

          {/* RAZÓN SOCIAL */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 'bold' }}>
              Razón Social / Nombre Completo *
            </label>
            <input
              type="text"
              placeholder="Ej: Perez Juan José o Agromecanica SRL"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #475569',
                background: '#0f172a',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* CONDICION IVA Y TELEFONO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Condición IVA
              </label>
              <select
                value={condicionIva}
                onChange={(e) => setCondicionIva(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="Consumidor Final">Consumidor Final</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Teléfono
              </label>
              <input
                type="text"
                placeholder="Ej: 2923-123456"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* EMAIL Y DIRECCION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Dirección / Localidad
              </label>
              <input
                type="text"
                placeholder="Ej: Carhué"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* BOTONES */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onCancelarEdicion}
              style={{
                background: '#334155',
                color: '#cbd5e1',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                background: editingId ? '#d97706' : '#16a34a',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.4rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {editingId ? 'Guardar Cambios' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
