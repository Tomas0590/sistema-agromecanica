'use client';

const SITUATION_STYLES = {
  1: { label: 'Sit 1 - Normal', bg: '#064e3b', color: '#22c55e', border: '#15803d' },
  2: { label: 'Sit 2 - Riesgo Bajo', bg: '#1a2e05', color: '#84cc16', border: '#4d7c0f' },
  3: { label: 'Sit 3 - Riesgo Medio', bg: '#451a03', color: '#f59e0b', border: '#b45309' },
  4: { label: 'Sit 4 - Riesgo Alto', bg: '#431407', color: '#ea580c', border: '#c2410c' },
  5: { label: 'Sit 5 - Irrecuperable', bg: '#450a0a', color: '#ef4444', border: '#b91c1c' },
  6: { label: 'Sit 6 - Irrec. Técnica', bg: '#450a0a', color: '#b91c1c', border: '#7f1d1d' },
};

export default function TablaClientes({ clientes, resultadosBcra, loadingBcraId, onConsultarBcra, onPrepararEdicion, onSelectCliente }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#0f172a', color: '#f59e0b', borderBottom: '1px solid #334155' }}>
            <th style={{ padding: '0.85rem 1rem' }}>Razón Social ({clientes.length})</th>
            <th style={{ padding: '0.85rem 1rem' }}>CUIT</th>
            <th style={{ padding: '0.85rem 1rem' }}>Cond. IVA</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Situación BCRA</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                No hay clientes registrados aún. Usa el formulario de arriba para cargar uno nuevo.
              </td>
            </tr>
          ) : (
            clientes.map((c) => {
              const res = resultadosBcra[c.id];
              const style = res ? (SITUATION_STYLES[res.maxSit] || SITUATION_STYLES[1]) : null;

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
                    {res ? (
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ 
                          padding: '0.3rem 0.8rem', 
                          borderRadius: '20px', 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold',
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`
                        }}>
                          {style.label}
                        </span>
                        {res.chequesRechazados > 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
                            ⚠️ {res.chequesRechazados} cheque(s)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sin consultar</span>
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
