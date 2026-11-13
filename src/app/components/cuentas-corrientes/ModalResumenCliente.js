'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalResumenCliente({ mostrar, onClose, cliente, supabase, onActualizarSaldos = () => {} }) {
  const [mounted, setMounted] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [soloVencidas, setSoloVencidas] = useState(false);

  // Estado para la edición de un comprobante
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ numero: '', fecha_emision: '', monto: '', observaciones: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mostrar && cliente) {
      setSoloVencidas(false);
      cargarMovimientos();
    }
  }, [mostrar, cliente]);

  if (!mostrar || !mounted || !cliente) return null;

  // Convierte YYYY-MM-DD a DD-MM-AAAA sin desfasajes de zona horaria
  const formatearFechaARG = (fechaStr) => {
    if (!fechaStr) return '';
    const limpia = String(fechaStr).split('T')[0];
    const partes = limpia.split('-');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fechaStr;
  };

  // Evalúa si un comprobante de deuda tiene más de 30 días desde emisión y sigue impago
  const evaluarEstadoMovimiento = (m) => {
    const esDeuda = ['FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_DEBITO'].includes(m.tipo);
    if (!esDeuda) return { esDeuda: false, cancelada: false, vencida: false, diasAtraso: 0, fechaVencStr: null, saldoPend: 0 };

    const saldoPend =
      m.saldo_pendiente === null || m.saldo_pendiente === undefined
        ? parseFloat(m.debe || 0)
        : parseFloat(m.saldo_pendiente || 0);

    let fechaLimite;
    if (m.fecha_vencimiento) {
      fechaLimite = new Date(`${m.fecha_vencimiento}T00:00:00`);
    } else if (m.fecha_emision) {
      fechaLimite = new Date(`${m.fecha_emision}T00:00:00`);
      fechaLimite.setDate(fechaLimite.getDate() + 30);
    }

    let fechaVencStr = null;
    if (fechaLimite && !isNaN(fechaLimite.getTime())) {
      const dd = String(fechaLimite.getDate()).padStart(2, '0');
      const mm = String(fechaLimite.getMonth() + 1).padStart(2, '0');
      const yyyy = fechaLimite.getFullYear();
      fechaVencStr = `${dd}-${mm}-${yyyy}`;
    }

    if (saldoPend <= 0) {
      return { esDeuda: true, cancelada: true, vencida: false, diasAtraso: 0, fechaVencStr, saldoPend: 0 };
    }

    if (!fechaLimite) {
      return { esDeuda: true, cancelada: false, vencida: false, diasAtraso: 0, fechaVencStr: null, saldoPend };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diffDias = Math.floor((hoy - fechaLimite) / (1000 * 60 * 60 * 24));
    return {
      esDeuda: true,
      cancelada: false,
      vencida: diffDias > 0,
      diasAtraso: diffDias > 0 ? diffDias : 0,
      fechaVencStr,
      saldoPend
    };
  };

  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('comprobantes_cc')
        .select('*')
        .eq('cliente_id', cliente.cliente_id || cliente.id)
        .order('fecha_emision', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data) {
        let saldoAcumulado = 0;
        const movsConSaldo = data.map((m) => {
          const debe = parseFloat(m.debe || 0);
          const haber = parseFloat(m.haber || 0);
          saldoAcumulado += debe - haber;
          const estado = evaluarEstadoMovimiento({ ...m, debe, haber });
          return { ...m, debe, haber, saldoAcumulado, estado };
        });

        setMovimientos(movsConSaldo);
      }
    } catch (e) {
      console.error('Error cargando movimientos:', e);
    } finally {
      setCargando(false);
    }
  };

  const formatearTipoComprobante = (tipo) => {
    switch (tipo) {
      case 'RECIBO_COBRANZA':
        return 'RECIBO';
      case 'FACTURA_A':
        return 'FACTURA A';
      case 'FACTURA_B':
        return 'FACTURA B';
      case 'FACTURA_C':
        return 'FACTURA C';
      case 'NOTA_DEBITO':
        return 'NOTA DE DÉBITO';
      case 'NOTA_CREDITO':
        return 'NOTA DE CRÉDITO';
      default:
        return tipo ? tipo.replace('_', ' ') : '';
    }
  };

  const handleEliminar = async (mov) => {
    if (!confirm(`¿Estás seguro de eliminar el comprobante ${formatearTipoComprobante(mov.tipo)} ${mov.numero ? `#${mov.numero}` : ''}?`)) {
      return;
    }

    const { error } = await supabase
      .from('comprobantes_cc')
      .delete()
      .eq('id', mov.id);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
    } else {
      await cargarMovimientos();
      onActualizarSaldos();
    }
  };

  const handleIniciarEdicion = (mov) => {
    setEditandoId(mov.id);
    const esDebe = mov.debe > 0;
    setEditForm({
      numero: mov.numero || '',
      fecha_emision: mov.fecha_emision || '',
      monto: esDebe ? mov.debe : mov.haber,
      observaciones: mov.observaciones || ''
    });
  };

  const handleGuardarEdicion = async (mov) => {
    setGuardandoEdicion(true);
    const esDebe = mov.debe > 0;
    const montoNum = parseFloat(editForm.monto) || 0;

    let nuevaFechaVenc = mov.fecha_vencimiento;
    if (esDebe && editForm.fecha_emision) {
      const d = new Date(`${editForm.fecha_emision}T00:00:00`);
      d.setDate(d.getDate() + 30);
      nuevaFechaVenc = d.toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('comprobantes_cc')
      .update({
        numero: editForm.numero || null,
        fecha_emision: editForm.fecha_emision,
        fecha_vencimiento: nuevaFechaVenc,
        debe: esDebe ? montoNum : 0,
        haber: !esDebe ? montoNum : 0,
        saldo_pendiente: esDebe && parseFloat(mov.saldo_pendiente || 0) === parseFloat(mov.debe || 0) ? montoNum : mov.saldo_pendiente,
        observaciones: editForm.observaciones || null
      })
      .eq('id', mov.id);

    setGuardandoEdicion(false);

    if (error) {
      alert(`Error al actualizar: ${error.message}`);
    } else {
      setEditandoId(null);
      await cargarMovimientos();
      onActualizarSaldos();
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const saldoFinal = movimientos.length > 0
    ? movimientos[movimientos.length - 1].saldoAcumulado
    : parseFloat(cliente.saldo_total || 0);

  const movimientosVencidos = movimientos.filter((m) => m.estado?.vencida);
  const totalVencidoCliente = movimientosVencidos.reduce((acc, m) => acc + (m.estado?.saldoPend || 0), 0);
  const totalAVencerCliente = Math.max(0, saldoFinal - totalVencidoCliente);

  const movimientosVisibles = soloVencidas ? movimientosVencidos : movimientos;

  const hoyObj = new Date();
  const fechaEmisionResumen = `${String(hoyObj.getDate()).padStart(2, '0')}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${hoyObj.getFullYear()}`;

  const modalUI = (
    <div
      className="modal-resumen-portal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 999999
      }}
      onClick={onClose}
    >
      <div
        id="area-impresion-resumen"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#ffffff',
          border: '1px solid #e5e0d8',
          borderRadius: '14px',
          width: '94%',
          maxWidth: '960px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          color: '#2b2927',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            body > *:not(.modal-resumen-portal) {
              display: none !important;
            }
            .modal-resumen-portal {
              position: static !important;
              inset: auto !important;
              background: transparent !important;
              backdrop-filter: none !important;
              width: 100% !important;
              height: auto !important;
              display: block !important;
            }
            #area-impresion-resumen {
              position: static !important;
              top: auto !important;
              left: auto !important;
              transform: none !important;
              width: 100% !important;
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-imprimir {
              display: none !important;
            }
          }
        `}</style>

        {/* CABECERA MEMBRETADA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #15803d', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
              <h2 style={{ margin: 0, color: '#1c1917', fontSize: '1.3rem', fontWeight: '900' }}>AGROMECANICA</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Venta de Maquinaria y Repuestos Agrícolas</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.1rem', fontWeight: '800' }}>ESTADO DE CUENTA</h3>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Fecha de Emisión: {fechaEmisionResumen}</span>
          </div>
        </div>

        {/* DATOS DEL CLIENTE Y DESGLOSE DE SALDOS */}
        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '8px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Cliente / Razón Social</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1c1917' }}>{cliente.razon_social || 'SIN NOMBRE'}</div>
            {cliente.cuit_dni && <span style={{ fontSize: '0.8rem', color: '#57534e' }}>CUIT/DNI: {cliente.cuit_dni}</span>}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {totalVencidoCliente > 0 && (
              <div style={{ textAlign: 'right', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.45rem 0.85rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '800', textTransform: 'uppercase', display: 'block' }}>
                  ⚠️ Vencido (+30d) · {movimientosVencidos.length} fc
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#dc2626', whiteSpace: 'nowrap' }}>
                  $&nbsp;{totalVencidoCliente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {totalVencidoCliente > 0 && totalAVencerCliente > 0 && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>
                  A Vencer (≤30d)
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#44403c', whiteSpace: 'nowrap' }}>
                  $&nbsp;{totalAVencerCliente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Saldo Adeudado</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: saldoFinal > 0 ? '#15803d' : '#78716c', whiteSpace: 'nowrap' }}>
                $&nbsp;{saldoFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* BARRA FILTRO RÁPIDO SOLO VENCIDAS (NO SE IMPRIME) */}
        {movimientosVencidos.length > 0 && (
          <div className="no-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 'bold' }}>
              ⚠️ Este cliente posee {movimientosVencidos.length} {movimientosVencidos.length === 1 ? 'factura vencida' : 'facturas vencidas'} (más de 30 días desde emisión).
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 'bold', color: '#dc2626', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={soloVencidas}
                onChange={(e) => setSoloVencidas(e.target.checked)}
                style={{ accentColor: '#dc2626', width: '15px', height: '15px' }}
              />
              Ver solo vencidas
            </label>
          </div>
        )}

        {/* TABLA DE MOVIMIENTOS */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                <th style={{ width: '12%', padding: '0.6rem 0.4rem', whiteSpace: 'nowrap' }}>Emisión</th>
                <th style={{ width: '19%', padding: '0.6rem 0.4rem' }}>Comprobante</th>
                <th style={{ width: '23%', padding: '0.6rem 0.4rem' }}>Estado / Detalle</th>
                <th style={{ width: '13%', padding: '0.6rem 0.4rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Debe (+)</th>
                <th style={{ width: '13%', padding: '0.6rem 0.4rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Haber (-)</th>
                <th style={{ width: '13%', padding: '0.6rem 0.4rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Saldo</th>
                <th className="no-imprimir" style={{ width: '7%', padding: '0.6rem 0.4rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    ⏳ Cargando historial de comprobantes...
                  </td>
                </tr>
              ) : movimientosVisibles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    Sin movimientos registrados en la cuenta corriente.
                  </td>
                </tr>
              ) : (
                movimientosVisibles.map((m) => {
                  const estaEditando = editandoId === m.id;
                  const nombreComprobante = formatearTipoComprobante(m.tipo);
                  const est = m.estado || {};

                  if (estaEditando) {
                    return (
                      <tr key={m.id} style={{ backgroundColor: '#fefce8', borderBottom: '1px solid #fef08a' }}>
                        <td style={{ padding: '0.4rem' }}>
                          <input
                            type="date"
                            value={editForm.fecha_emision}
                            onChange={(e) => setEditForm({ ...editForm, fecha_emision: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{nombreComprobante}</span>
                          <input
                            type="text"
                            placeholder="N°"
                            value={editForm.numero}
                            onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '70px', marginLeft: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem' }}>
                          <input
                            type="text"
                            placeholder="Observaciones"
                            value={editForm.observaciones}
                            onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '100%' }}
                          />
                        </td>
                        <td colSpan={2} style={{ padding: '0.4rem', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.monto}
                            onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '85px', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ padding: '0.4rem', textAlign: 'right', color: '#a8a29e' }}>-</td>
                        <td className="no-imprimir" style={{ padding: '0.4rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleGuardarEdicion(m)}
                              disabled={guardandoEdicion}
                              style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditandoId(null)}
                              style={{ background: '#eeeae1', color: '#44403c', border: 'none', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: '1px solid #eeeae1',
                        backgroundColor: est.vencida ? '#fff5f5' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.6rem 0.4rem', whiteSpace: 'nowrap' }}>{formatearFechaARG(m.fecha_emision)}</td>
                      <td style={{ padding: '0.6rem 0.4rem', fontWeight: 'bold', wordBreak: 'break-word', color: est.vencida ? '#991b1b' : '#1c1917' }}>
                        {nombreComprobante} {m.numero ? `#${m.numero}` : ''}
                      </td>
                      <td style={{ padding: '0.6rem 0.4rem', color: '#57534e', fontSize: '0.75rem', wordBreak: 'break-word' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {est.vencida && (
                              <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                ⚠️ VENCIDA (+{est.diasAtraso}d)
                              </span>
                            )}
                            {est.esDeuda && !est.vencida && !est.cancelada && est.fechaVencStr && (
                              <span style={{ backgroundColor: '#fefce8', color: '#a16207', border: '1px solid #fde047', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                Vto: {est.fechaVencStr}
                              </span>
                            )}
                            {est.cancelada && (
                              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                                ✓ CANCELADA
                              </span>
                            )}
                          </div>
                          {m.observaciones && <span>{m.observaciones}</span>}
                        </div>
                      </td>

                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontWeight: 'bold', color: est.vencida ? '#dc2626' : m.debe > 0 ? '#2b2927' : '#a8a29e', whiteSpace: 'nowrap' }}>
                        {m.debe > 0 ? `$\u00A0${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontWeight: 'bold', color: m.haber > 0 ? '#15803d' : '#a8a29e', whiteSpace: 'nowrap' }}>
                        {m.haber > 0 ? `$\u00A0${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>

                      <td style={{ padding: '0.6rem 0.4rem', textAlign: 'right', fontWeight: 'bold', color: m.saldoAcumulado > 0 ? '#15803d' : '#78716c', whiteSpace: 'nowrap' }}>
                        $&nbsp;{m.saldoAcumulado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="no-imprimir" style={{ padding: '0.6rem 0.4rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleIniciarEdicion(m)}
                            title="Editar comprobante"
                            style={{ border: 'none', background: '#f5f2eb', cursor: 'pointer', padding: '0.25rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEliminar(m)}
                            title="Eliminar comprobante"
                            style={{ border: 'none', background: '#fef2f2', cursor: 'pointer', padding: '0.25rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', color: '#dc2626' }}
                          >
                            🗑️
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

        {/* NOTA AL PIE PARA EL CLIENTE */}
        <div style={{ fontSize: '0.75rem', color: '#78716c', marginBottom: '1rem', borderTop: '1px dashed #dcd5c9', paddingTop: '0.65rem' }}>
          Condición de cuenta corriente: 30 días fecha de emisión de factura.
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="no-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
          <button onClick={onClose} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>
            Cerrar
          </button>

          <button
            onClick={handleImprimir}
            style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            🖨️ Descargar / Imprimir PDF
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}
