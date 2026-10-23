'use client';

export default function TablaClientes({
  clientes,
  situacionesMap,
  cargandoIndividualId,
  ordenColumna,
  ordenAsc,
  cambiarOrden,
  corroborarBCRAIndividual,
  setClienteDetalle
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#eeeae1', borderBottom: '2px solid #e2ddd3', color: '#57534e' }}>
            <th onClick={() => cambiarOrden('razon_social')} style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}>
              Razón Social {ordenColumna === 'razon_social' ? (ordenAsc ? '▲' : '▼') : '⇅'}
            </th>
            <th style={{ padding: '0.75rem 1rem' }}>CUIT / DNI</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Situación Crediticia</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Editar</th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
                No se encontraron clientes en el sistema.
              </td>
            </tr>
          ) : (
            clientes.map((c) => {
              const valorCuit = String(c.cuit_dni || c.cuit || '');
              const cuitLimpio = valorCuit.replace(/\D/g, '');
              const sitBcra = situacionesMap[c.id] || 1;
              const estaCargandoInd = cargandoIndividualId === c.id;

              return (
                <tr 
                  key={c.id} 
                  style={{ borderBottom: '1px solid #f0ebe1', transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f0e6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td 
                    onClick={() => setClienteDetalle({ ...c })}
                    style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1c1917', cursor: 'pointer' }}
                  >
                    👤 {c.razon_social}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>
                    {valorCuit || '-'}
                  </td>
                  
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          if (cuitLimpio) {
                            window.open(`https://www.lamacro.ar/central-de-deudores/${cuitLimpio}`, '_blank');
                          } else {
                            alert('Este cliente no posee CUIT registrado.');
                          }
                        }}
                        style={{
                          padding: '0.3rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          border: 'none',
                          backgroundColor: sitBcra === 1 ? '#f0fdf4' : sitBcra <= 2 ? '#fefce8' : '#fef2f2',
                          color: sitBcra === 1 ? '#166534' : sitBcra <= 2 ? '#ca8a04' : '#dc2626',
                          outline: `1px solid ${sitBcra === 1 ? '#bbf7d0' : sitBcra <= 2 ? '#fef08a' : '#fecaca'}`
                        }}
                        title="Abrir informe completo en La Macro"
                      >
                        {sitBcra === 1 ? `Sit. 1 ✅` : `Sit. ${sitBcra} ⚠️ ALERTA`}
                      </button>

                      <button
                        onClick={(e) => corroborarBCRAIndividual(c, e)}
                        disabled={estaCargandoInd || !cuitLimpio}
                        style={{
                          backgroundColor: '#eeeae1',
                          border: '1px solid #dcd5c9',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: cuitLimpio ? 'pointer' : 'not-allowed',
                          fontSize: '0.75rem',
                          opacity: cuitLimpio ? 1 : 0.4
                        }}
                        title="Consultar BCRA en el momento"
                      >
                        {estaCargandoInd ? '⏳' : '🔄'}
                      </button>
                    </div>
                  </td>

                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => setClienteDetalle({ ...c })}
                      style={{ backgroundColor: '#f5f2eb', border: '1px solid #dcd5c9', color: '#2b2927', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                      title="Editar datos del cliente"
                    >
                      ✏️ Editar
                    </button>
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
