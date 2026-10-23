'use client';

export default function ModalCliente({
  clienteDetalle,
  setClienteDetalle,
  guardarCambiosCliente,
  guardandoEdicion,
  borrarCliente,
  situacionesMap,
  corroborarBCRAIndividual,
  cargandoIndividualId
}) {
  if (!clienteDetalle) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '14px', width: '100%', maxWidth: '580px', padding: '1.75rem', color: '#2b2927', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '2px solid #eeeae1', paddingBottom: '0.85rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#dc2626', letterSpacing: '0.05em' }}>
              Ficha & Edición de Cliente
            </span>
            <h3 style={{ margin: '0.2rem 0 0 0', color: '#1c1917', fontSize: '1.35rem', fontWeight: '800' }}>
              {clienteDetalle.razon_social}
            </h3>
          </div>
          <button onClick={() => setClienteDetalle(null)} style={{ background: '#eeeae1', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1rem', cursor: 'pointer', color: '#57534e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        <form onSubmit={guardarCambiosCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social *</label>
            <input
              type="text"
              value={clienteDetalle.razon_social || ''}
              onChange={(e) => setClienteDetalle({ ...clienteDetalle, razon_social: e.target.value })}
              required
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>CUIT / DNI</label>
              <input
                type="text"
                value={clienteDetalle.cuit_dni || clienteDetalle.cuit || ''}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, cuit_dni: e.target.value, cuit: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Condición IVA</label>
              <select
                value={clienteDetalle.condicion_iva || 'Responsable Inscripto'}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, condicion_iva: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="Consumidor Final">Consumidor Final</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Teléfono</label>
              <input
                type="text"
                value={clienteDetalle.telefono || ''}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, telefono: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Email</label>
              <input
                type="email"
                value={clienteDetalle.email || ''}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, email: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Dirección / Localidad</label>
            <input
              type="text"
              value={clienteDetalle.direccion || ''}
              onChange={(e) => setClienteDetalle({ ...clienteDetalle, direccion: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ backgroundColor: '#f5f2eb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e0d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#78716c', fontWeight: '700' }}>SITUACIÓN BCRA ACTUAL</span>
              <span style={{ fontSize: '0.85rem', color: '#57534e', fontWeight: 'bold' }}>
                Sit. {situacionesMap[clienteDetalle.id] || 1} {(situacionesMap[clienteDetalle.id] || 1) > 1 ? '⚠️' : '✅'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => corroborarBCRAIndividual(clienteDetalle, e)}
              disabled={cargandoIndividualId === clienteDetalle.id}
              style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
            >
              {cargandoIndividualId === clienteDetalle.id ? '⏳ Consultando...' : '🔄 Reevaluar BCRA Ahora'}
            </button>
          </div>

          <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {(clienteDetalle.cuit_dni || clienteDetalle.cuit) ? (
              <a
                href={`https://www.lamacro.ar/central-de-deudores/${String(clienteDetalle.cuit_dni || clienteDetalle.cuit).replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                🔗 Consultar Padrón en La Macro ↗
              </a>
            ) : <div />}

            <button
              type="button"
              onClick={() => borrarCliente(clienteDetalle.id)}
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
            >
              🗑️ Eliminar Cliente
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
            <button type="button" onClick={() => setClienteDetalle(null)} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardandoEdicion} style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {guardandoEdicion ? '💾 Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
