'use client';

export default function TablaClientes({
  clientes = [],
  situacionesMap = {},
  cargandoIndividualId = null,
  ordenColumna = 'razon_social',
  ordenAsc = true,
  cambiarOrden = () => {},
  corroborarBCRAIndividual = () => {},
  setClienteDetalle = () => {}
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
            <th
              onClick={() => cambiarOrden('razon_social')}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
            >
              Razón Social {ordenColumna === 'razon_social' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            <th
              onClick={() => cambiarOrden('cuit_dni')}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
            >
              CUIT / DNI {ordenColumna === 'cuit_dni' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            <th
              onClick={() => cambiarOrden('situacion')}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
            >
              Situación Crediticia / Riesgo {ordenColumna === 'situacion' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            {/* Preparado para ordenar por Saldo en el futuro */}
            {/* 
            <th
              onClick={() => cambiarOrden('saldo')}
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none', textAlign: 'right' }}
            >
              Saldo Cta. Cte. {ordenColumna === 'saldo' ? (ordenAsc ? '▲' : '▼') : ''}
            </th>
            */}
            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {!clientes || clientes.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                No se encontraron clientes.
              </td>
            </tr>
          ) : (
            clientes.map((cliente) => {
              if (!cliente) return null;

              const clienteId = cliente.id;
              const infoBcra = situacionesMap ? situacionesMap[clienteId] : null;
              const cargando = cargandoIndividualId === clienteId;

              // Parseo seguro de BCRA
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

              const valorCuit = cliente.cuit_dni || cliente.cuit || 'Sin CUIT';

              return (
                <tr
                  key={clienteId}
                  onClick={() => setClienteDetalle(cliente)} // 👈 ABRIR DETALLE AL CLICKEAR EN CUALQUIER PARTE DE LA FILA
                  style={{
                    borderBottom: '1px solid #eeeae1',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f2eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                    👤 {cliente.razon_social || 'PENDIENTE / SIN NOMBRE'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#57534e' }}>
                    {valorCuit}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                    {cargando ? (
                      <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 'bold' }}>
                        ⏳ Consultando...
                      </span>
                    ) : sit === null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#a8a29e' }}>Sin verificar</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita abrir el modal si solo se toca el icono de refrescar
                            corroborarBCRAIndividual(cliente, e);
                          }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem' }}
                          title="Verificar en BCRA"
                        >
                          🔄
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {/* BADGE SITUACIÓN */}
                        <span
                          style={{
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            backgroundColor: sit === 1 ? '#f0fdf4' : '#fefce8',
                            color: sit === 1 ? '#166534' : '#b45309',
                            border: `1px solid ${sit === 1 ? '#bbf7d0' : '#fef08a'}`,
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          {sit === 1 ? 'Sit. 1 ✅' : `Sit. ${sit} ⚠️ ALERTA`}
                        </span>

                        {/* BADGE CHEQUES RECHAZADOS */}
                        {cheques > 0 ? (
                          <span
                            title={`${cheques} cheque(s) rechazado(s) registrado(s) en BCRA`}
                            style={{
                              padding: '0.25rem 0.55rem',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            🚫 {cheques} {cheques === 1 ? 'Chq.' : 'Chqs.'}
                          </span>
                        ) : (
                          <span
                            title="Sin cheques rechazados"
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              backgroundColor: '#f5f5f4',
                              color: '#78716c',
                              border: '1px solid #e7e5e4'
                            }}
                          >
                            0 Chq.
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Evita abrir el modal si solo se toca el icono de refrescar
                            corroborarBCRAIndividual(cliente, e);
                          }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px' }}
                          title="Reevaluar BCRA"
                        >
                          🔄
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setClienteDetalle(cliente);
                      }}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #dcd5c9',
                        backgroundColor: '#eeeae1',
                        color: '#44403c',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}
                    >
                      ✏️ Ver / Editar
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
