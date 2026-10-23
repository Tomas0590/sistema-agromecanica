'use client';

export default function ModalCliente({
  clienteDetalle,
  setClienteDetalle,
  guardarCambiosCliente,
  guardandoEdicion,
  borrarCliente,
  situacionesMap = {},
  corroborarBCRAIndividual,
  cargandoIndividualId
}) {
  if (!clienteDetalle) return null;

  const infoBcra = situacionesMap ? situacionesMap[clienteDetalle.id] : null;
  const cargando = cargandoIndividualId === clienteDetalle.id;

  // Parseo seguro de la situación crediticia y cheques rechazados
  let sit = null;
  let cheques = 0;

  if (infoBcra !== undefined && infoBcra !== null) {
    if (typeof infoBcra === 'object') {
      sit = Number(infoBcra.situacion || 1);
      cheques = Number(infoBcra.cheques || 0);
    } else {
      sit = Number(infoBcra || 1);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: '#fcfbf9',
          border: '1px solid #e5e0d8',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '560px',
          padding: '1.75rem',
          color: '#2b2927',
          boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '2px solid #eeeae1',
            paddingBottom: '0.85rem'
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#dc2626', fontSize: '1.25rem', fontWeight: '800' }}>
              ✏️ Editar Cliente
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>
              ID: {clienteDetalle.id}
            </span>
          </div>
          <button
            onClick={() => setClienteDetalle(null)}
            style={{
              background: '#eeeae1',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#57534e'
            }}
          >
            ✕
          </button>
        </div>

        {/* PANEL ESTADO BCRA DENTRO DEL MODAL */}
        <div
          style={{
            backgroundColor: '#f5f2eb',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #e5e0d8',
            marginBottom: '1.25rem',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e' }}>
              Evaluación Crediticia (BCRA)
            </div>
            {cargando ? (
              <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 'bold' }}>
                ⏳ Consultando Central de Deudores...
              </span>
            ) : sit !== null ? (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                <span
                  style={{
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    color: sit === 1 ? '#166534' : '#dc2626'
                  }}
                >
                  {sit === 1 ? '✅ Sit. 1 Normal' : `⚠️ Sit. ${sit} Alerta`}
                </span>
                <span style={{ fontSize: '0.8rem', color: cheques > 0 ? '#dc2626' : '#78716c', fontWeight: cheques > 0 ? 'bold' : 'normal' }}>
                  | {cheques > 0 ? `🚫 ${cheques} Chq. Rechazado(s)` : '👍 Sin cheques rebotados'}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#a8a29e' }}>Sin verificación previa</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => corroborarBCRAIndividual(clienteDetalle, e)}
            style={{
              backgroundColor: '#eeeae1',
              border: '1px solid #dcd5c9',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}
          >
            🔄 Reevaluar
          </button>
        </div>

        <form onSubmit={guardarCambiosCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
              Razón Social *
            </label>
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                CUIT / DNI
              </label>
              <input
                type="text"
                value={clienteDetalle.cuit_dni || clienteDetalle.cuit || ''}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, cuit_dni: e.target.value, cuit: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                Condición IVA
              </label>
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                Teléfono
              </label>
              <input
                type="text"
                value={clienteDetalle.telefono || ''}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, telefono: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                Email
              </label>
              <input
                type="email"
                value={clienteDetalle.email || ''}
                onChange={(e) => setClienteDetalle({ ...clienteDetalle, email: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
              Dirección / Localidad
            </label>
            <input
              type="text"
              value={clienteDetalle.direccion || ''}
              onChange={(e) => setClienteDetalle({ ...clienteDetalle, direccion: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
              Observaciones
            </label>
            <textarea
              rows={2}
              value={clienteDetalle.observaciones || ''}
              onChange={(e) => setClienteDetalle({ ...clienteDetalle, observaciones: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => borrarCliente(clienteDetalle.id)}
              style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🗑️ Eliminar
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setClienteDetalle(null)}
                style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoEdicion}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {guardandoEdicion ? '💾 Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
