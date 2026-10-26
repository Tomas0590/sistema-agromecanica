'use client';

import { useState, useEffect } from 'react';

export default function CuentasCorrientesContainer({ supabase }) {
  const [saldosClientes, setSaldosClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [soloDeudores, setSoloDeudores] = useState(false);

  useEffect(() => {
    cargarSaldos();
  }, []);

  const cargarSaldos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('vista_saldos_clientes')
        .select('*')
        .order('razon_social', { ascending: true });

      if (!error && data) {
        setSaldosClientes(data);
      }
    } catch (e) {
      console.error('Error cargando saldos:', e);
    } finally {
      setCargando(false);
    }
  };

  // Filtrado por texto y por clientes con deuda activa
  const saldosFiltrados = saldosClientes.filter((c) => {
    const matchTexto = 
      (c.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.cuit_dni || '').includes(busqueda);
    const matchDeuda = soloDeudores ? parseFloat(c.saldo_total || 0) > 0 : true;
    return matchTexto && matchDeuda;
  });

  // Totales acumulados para las tarjetas superiores
  const totalAdeudadoGeneral = saldosClientes.reduce((acc, c) => acc + parseFloat(c.saldo_total || 0), 0);
  const totalVencidoGeneral = saldosClientes.reduce((acc, c) => acc + parseFloat(c.saldo_vencido || 0), 0);

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Cuentas Corrientes y Estado de Deudores
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Control de saldos, facturación, cobranzas y estado de deuda de Agromecanica
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Cargar Comprobante / Cobranza
          </button>
        </div>
      </div>

      {/* TARJETAS RESUMEN DE SALDOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Saldo Total a Cobrar</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#15803d', marginTop: '0.25rem' }}>
            $ {totalAdeudadoGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase' }}>Deuda Vencida Total</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#dc2626', marginTop: '0.25rem' }}>
            $ {totalVencidoGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Clientes con Deuda</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2b2927', marginTop: '0.25rem' }}>
            {saldosClientes.filter((c) => parseFloat(c.saldo_total || 0) > 0).length}
          </div>
        </div>
      </div>

      {/* CONTENEDOR TABLA */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Razón Social o CUIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, maxWidth: '400px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 'bold', color: '#44403c', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={soloDeudores} 
              onChange={(e) => setSoloDeudores(e.target.checked)}
              style={{ accentColor: '#15803d', width: '16px', height: '16px' }}
            />
            Ver solo clientes con deuda
          </label>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Cliente</th>
                <th style={{ padding: '0.75rem 1rem' }}>CUIT / DNI</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Saldo Total</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Deuda Vencida</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Últ. Movimiento</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    ⏳ Cargando saldos de cuentas corrientes...
                  </td>
                </tr>
              ) : saldosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    No se encontraron registros de cuentas corrientes.
                  </td>
                </tr>
              ) : (
                saldosFiltrados.map((cliente) => {
                  const saldo = parseFloat(cliente.saldo_total || 0);
                  const vencido = parseFloat(cliente.saldo_vencido || 0);

                  return (
                    <tr key={cliente.cliente_id} style={{ borderBottom: '1px solid #eeeae1' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                        👤 {cliente.razon_social || 'SIN NOMBRE'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#57534e' }}>
                        {cliente.cuit_dni || 'Sin CUIT'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 'bold', color: saldo > 0 ? '#15803d' : '#78716c' }}>
                        $ {saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 'bold', color: vencido > 0 ? '#dc2626' : '#a8a29e' }}>
                        $ {vencido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#78716c', fontSize: '0.8rem' }}>
                        {cliente.fecha_ultimo_movimiento || 'Sin movimientos'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
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
                          📋 Resumen
                        </button>
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
