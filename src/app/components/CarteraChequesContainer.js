'use client';

import { useState, useEffect } from 'react';

export default function CarteraChequesContainer({ supabase }) {
  const [cheques, setCheques] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('EN_CARTERA');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarCheques();
  }, []);

  const cargarCheques = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('cheques')
        .select(`
          *,
          clientes ( razon_social )
        `)
        .order('fecha_pago', { ascending: true });

      if (!error && data) {
        setCheques(data);
      }
    } catch (e) {
      console.error('Error cargando cheques:', e);
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstadoCheque = async (id, nuevoEstado) => {
    let destinoPrompt = null;
    
    if (nuevoEstado === 'DEPOSITADO') {
      destinoPrompt = prompt('¿En qué banco/cuenta se depositó el cheque? (Ej: Banco Galicia Cta Cte):');
      if (destinoPrompt === null) return;
    } else if (nuevoEstado === 'ENDOSADO') {
      destinoPrompt = prompt('¿A quién se endosó/entregó el cheque? (Ej: Proveedor Agrometal S.A.):');
      if (destinoPrompt === null) return;
    }

    const { error } = await supabase
      .from('cheques')
      .update({ 
        estado: nuevoEstado,
        destino: destinoPrompt || null 
      })
      .eq('id', id);

    if (!error) {
      cargarCheques();
    } else {
      alert(`Error al actualizar estado: ${error.message}`);
    }
  };

  // Cálculo de alertas de vencimiento
  const getSemaforoVencimiento = (fechaPagoStr) => {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const fechaPago = new Date(fechaPagoStr + 'T00:00:00');
    const diffDays = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `🚨 VENCIDO (hace ${Math.abs(diffDays)} días)`, color: '#dc2626', bg: '#fef2f2', urgente: true };
    if (diffDays === 0) return { text: `⚠️ VENCE HOY`, color: '#dc2626', bg: '#fef2f2', urgente: true };
    if (diffDays <= 5) return { text: `⚠️ Vence en ${diffDays} días`, color: '#d97706', bg: '#fffbeb', urgente: true };
    if (diffDays <= 15) return { text: `🟡 Vence en ${diffDays} días`, color: '#b45309', bg: '#fffbeb', urgente: false };
    return { text: `🟢 Vence en ${diffDays} días`, color: '#15803d', bg: '#f0fdf4', urgente: false };
  };

  const chequesFiltrados = cheques.filter((c) => {
    const matchEstado = filtroEstado === 'TODOS' ? true : c.estado === filtroEstado;
    const matchTexto = 
      (c.banco || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.numero || '').includes(busqueda) ||
      (c.clientes?.razon_social || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchTexto;
  });

  const chequesUrgentes = cheques.filter(c => c.estado === 'EN_CARTERA' && getSemaforoVencimiento(c.fecha_pago).urgente);
  const totalEnCartera = cheques.filter(c => c.estado === 'EN_CARTERA').reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            💼 Cartera de Cheques y ECHEQs
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Control de valores en mano, depósitos bancarios y seguimiento anti-vencimientos de Agromecanica
          </span>
        </div>
      </div>

      {/* TARJETAS RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Valores en Cartera</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#15803d', marginTop: '0.25rem' }}>
            $ {totalEnCartera.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: chequesUrgentes.length > 0 ? '#fef2f2' : '#fcfbf9', border: chequesUrgentes.length > 0 ? '1px solid #fecaca' : '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: chequesUrgentes.length > 0 ? '#dc2626' : '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Por Vencer / Vencidos</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: chequesUrgentes.length > 0 ? '#dc2626' : '#2b2927', marginTop: '0.25rem' }}>
            {chequesUrgentes.length} {chequesUrgentes.length > 0 ? '⚠️' : '✅'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Cantidad de Valores en Mano</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2b2927', marginTop: '0.25rem' }}>
            {cheques.filter(c => c.estado === 'EN_CARTERA').length}
          </div>
        </div>
      </div>

      {/* SECCIÓN ALERTAS URGENTES SI EXISTEN */}
      {chequesUrgentes.length > 0 && (
        <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#dc2626', fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚨 Atenciones requeridas: Validez de cobro próxima a vencer
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {chequesUrgentes.map((c) => {
              const semaforo = getSemaforoVencimiento(c.fecha_pago);
              return (
                <div key={c.id} style={{ background: '#fff', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1c1917' }}>
                      {c.tipo === 'ECHEQ' ? '💻 ECHEQ' : '📜 FISICO'} #{c.numero} - {c.banco}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#57534e' }}>👤 {c.clientes?.razon_social || 'Cliente'}</div>
                    <div style={{ fontSize: '0.75rem', color: semaforo.color, fontWeight: 'bold', marginTop: '4px' }}>{semaforo.text}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: '#15803d', marginBottom: '0.35rem' }}>
                      $ {parseFloat(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      onClick={() => cambiarEstadoCheque(c.id, 'DEPOSITADO')}
                      style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🏦 Depositar Ya
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENEDOR TABLA DE VALORES */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Banco, N° de cheque o Cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, maxWidth: '380px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb' }}
          />

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {['EN_CARTERA', 'DEPOSITADO', 'ENDOSADO', 'TODOS'].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: filtroEstado === est ? '#15803d' : '#eeeae1',
                  color: filtroEstado === est ? '#fff' : '#44403c',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {est.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                <th style={{ padding: '0.75rem' }}>Tipo / N°</th>
                <th style={{ padding: '0.75rem' }}>Banco</th>
                <th style={{ padding: '0.75rem' }}>Cliente (Emisor)</th>
                <th style={{ padding: '0.75rem' }}>F. Cobro / Venc.</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Estado / Destino</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    ⏳ Cargando cartera de valores...
                  </td>
                </tr>
              ) : chequesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    No se encontraron valores con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                chequesFiltrados.map((c) => {
                  const semaforo = getSemaforoVencimiento(c.fecha_pago);

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #eeeae1' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                        {c.tipo === 'ECHEQ' ? '💻 ECHEQ' : '📜 FISICO'} #{c.numero}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{c.banco}</td>
                      <td style={{ padding: '0.75rem', color: '#1c1917', fontWeight: 'bold' }}>
                        👤 {c.clientes?.razon_social || 'Desconocido'}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: semaforo.bg, color: semaforo.color }}>
                          {c.fecha_pago} ({semaforo.text})
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#15803d', whiteSpace: 'nowrap' }}>
                        $ {parseFloat(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.55rem', borderRadius: '12px', background: c.estado === 'EN_CARTERA' ? '#fef08a' : c.estado === 'DEPOSITADO' ? '#dcfce7' : '#e0f2fe', color: '#1c1917' }}>
                          {c.estado}
                        </span>
                        {c.destino && <div style={{ fontSize: '0.7rem', color: '#57534e', marginTop: '2px', fontWeight: 'bold' }}>📍 {c.destino}</div>}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {c.estado === 'EN_CARTERA' && (
                          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => cambiarEstadoCheque(c.id, 'DEPOSITADO')}
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #15803d', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              🏦 Depositar
                            </button>
                            <button
                              onClick={() => cambiarEstadoCheque(c.id, 'ENDOSADO')}
                              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #0284c7', background: '#0284c7', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              ↗️ Endosar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
