'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalResumenCliente({ mostrar, onClose, cliente, supabase, onActualizarSaldos = () => {} }) {
  const [mounted, setMounted] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para la edición de un comprobante
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({ numero: '', fecha_emision: '', monto: '', observaciones: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mostrar && cliente) {
      cargarMovimientos();
    }
  }, [mostrar, cliente]);

  if (!mostrar || !mounted || !cliente) return null;

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
          return { ...m, debe, haber, saldoAcumulado };
        });

        setMovimientos(movsConSaldo);
      }
    } catch (e) {
      console.error('Error cargando movimientos:', e);
    } finally {
      setCargando(false);
    }
  };

  // ELIMINAR COMPROBANTE
  const handleEliminar = async (mov) => {
    if (!confirm(`¿Estás seguro de eliminar el comprobante ${mov.tipo} ${mov.numero ? `#${mov.numero}` : ''}? esta acción actualizará el saldo del cliente.`)) {
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

  // INICIAR EDICIÓN
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

  // GUARDAR EDICIÓN
  const handleGuardarEdicion = async (mov) => {
    setGuardandoEdicion(true);
    const esDebe = mov.debe > 0;
    const montoNum = parseFloat(editForm.monto) || 0;

    const { error } = await supabase
      .from('comprobantes_cc')
      .update({
        numero: editForm.numero || null,
        fecha_emision: editForm.fecha_emision,
        debe: esDebe ? montoNum : 0,
        haber: !esDebe ? montoNum : 0,
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

  const modalUI = (
    <div
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
          width: '92%',
          maxWidth: '900px',
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
            body * { visibility: hidden; }
            #area-impresion-resumen, #area-impresion-resumen * { visibility: visible; }
            #area-impresion-resumen {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
            }
            .no-imprimir { display: none !important; }
          }
        `}</style>

        {/* CABECERA MEMBRETADA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #15803d', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '38px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
              <h2 style={{ margin: 0, color: '#1c1917', fontSize: '1.4rem', fontWeight: '900' }}>AGROMECANICA</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Venta de Maquinaria y Repuestos Agrícolas</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.1rem', fontWeight: '800' }}>ESTADO DE CUENTA</h3>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        {/* DATOS DEL CLIENTE */}
        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '8px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Cliente / Razón Social</span>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#1c1917' }}>{cliente.razon_social || 'SIN NOMBRE'}</div>
            {cliente.cuit_dni && <span style={{ fontSize: '0.8rem', color: '#57534e' }}>CUIT/DNI: {cliente.cuit_dni}</span>}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Saldo Adeudado</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '900', color: saldoFinal > 0 ? '#15803d' : '#78716c' }}>
              $ {saldoFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>Fecha</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Comprobante</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Detalle / Obs.</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Debe (+)</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Haber (-)</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Saldo</th>
                <th className="no-imprimir" style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    ⏳ Cargando historial de comprobantes...
                  </td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    Sin movimientos registrados en la cuenta corriente.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => {
                  const estaEditando = editandoId === m.id;

                  if (estaEditando) {
                    return (
                      <tr key={m.id} style={{ backgroundColor: '#fefce8', borderBottom: '1px solid #fef08a' }}>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="date"
                            value={editForm.fecha_emision}
                            onChange={(e) => setEditForm({ ...editForm, fecha_emision: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.8rem' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{m.tipo}</span>
                          <input
                            type="text"
                            placeholder="N° Comprobante"
                            value={editForm.numero}
                            onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.8rem', width: '90px', marginLeft: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Observaciones"
                            value={editForm.observaciones}
                            onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.8rem', width: '100%' }}
                          />
                        </td>
                        <td colSpan={2} style={{ padding: '0.5rem', textAlign: 'right' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.monto}
                            onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.8rem', width: '100px', fontWeight: 'bold' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', color: '#a8a29e' }}>-</td>
                        <td className="no-imprimir" style={{ padding: '0.5rem', textAlign: 'center' }}>
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
                    <tr key={m.id} style={{ borderBottom: '1px solid #eeeae1' }}>
                      <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{m.fecha_emision}</td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 'bold' }}>
                        {m.tipo} {m.numero ? `#${m.numero}` : ''}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#57534e' }}>{m.observaciones || '-'}</td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 'bold', color: m.debe > 0 ? '#2b2927' : '#a8a29e' }}>
                        {m.debe > 0 ? `$ ${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 'bold', color: m.haber > 0 ? '#15803d' : '#a8a29e' }}>
                        {m.haber > 0 ? `$ ${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 'bold', color: m.saldoAcumulado > 0 ? '#15803d' : '#78716c' }}>
                        $ {m.saldoAcumulado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="no-imprimir" style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleIniciarEdicion(m)}
                            title="Editar comprobante"
                            style={{ border: 'none', background: '#f5f2eb', cursor: 'pointer', padding: '0.25rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem' }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEliminar(m)}
                            title="Eliminar comprobante"
                            style={{ border: 'none', background: '#fef2f2', cursor: 'pointer', padding: '0.25rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', color: '#dc2626' }}
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
