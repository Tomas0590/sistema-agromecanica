'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalComprobante({ mostrar, onClose, supabase, clientes = [], onGuardado = () => {} }) {
  const [mounted, setMounted] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('RECIBO_COBRANZA');
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [montoFactura, setMontoFactura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // ESTADO PARA MEDIOS DE PAGO EN RECIBOS
  const [mediosPago, setMediosPago] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mostrar || !mounted) return null;

  const esCobranza = tipo === 'RECIBO_COBRANZA';

  // Agregar un renglón de medio de pago
  const agregarMedioPago = (tipoMedio) => {
    const nuevo = {
      id: Date.now(),
      metodo: tipoMedio, // 'EFECTIVO', 'TRANSFERENCIA', 'CHEQUE_FISICO', 'ECHEQ'
      monto: '',
      numero: '',
      banco: '',
      cuit_emisor: '',
      librador: '',
      fecha_emision: fechaEmision,
      fecha_pago: fechaEmision
    };
    setMediosPago([...mediosPago, nuevo]);
  };

  const actualizarMedio = (id, campo, valor) => {
    // Si es el campo 'numero' y es un cheque, limitamos a 8 caracteres únicamente
    let valorFinal = valor;
    if (campo === 'numero') {
      valorFinal = valor.slice(0, 8);
    }

    setMediosPago(mediosPago.map(m => m.id === id ? { ...m, [campo]: valorFinal } : m));
  };

  const eliminarMedio = (id) => {
    setMediosPago(mediosPago.filter(m => m.id !== id));
  };

  const totalCobranza = mediosPago.reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId) {
      alert('Por favor seleccioná un cliente.');
      return;
    }

    const montoTotalOperacion = esCobranza ? totalCobranza : parseFloat(montoFactura || 0);

    if (montoTotalOperacion <= 0) {
      alert('El monto total debe ser mayor a 0.');
      return;
    }

    setGuardando(true);

    const esDebe = ['FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_DEBITO'].includes(tipo);
    const debeValor = esDebe ? montoTotalOperacion : 0;
    const haberValor = !esDebe ? montoTotalOperacion : 0;

    let obsDetalle = observaciones;
    if (esCobranza && mediosPago.length > 0) {
      const resumenMedios = mediosPago.map(m => `${m.metodo}: $${m.monto}`).join(' | ');
      obsDetalle = observaciones ? `${observaciones} (${resumenMedios})` : resumenMedios;
    }

    const { data: compData, error: compError } = await supabase
      .from('comprobantes_cc')
      .insert({
        cliente_id: clienteId,
        tipo,
        numero: numero || null,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento || null,
        debe: debeValor,
        haber: haberValor,
        observaciones: obsDetalle || null
      })
      .select()
      .single();

    if (compError) {
      alert(`Error al guardar comprobante: ${compError.message}`);
      setGuardando(false);
      return;
    }

    if (esCobranza && compData) {
      const chequesAGuardar = mediosPago
        .filter(m => m.metodo === 'CHEQUE_FISICO' || m.metodo === 'ECHEQ')
        .map(c => ({
          cliente_id: clienteId,
          comprobante_id: compData.id,
          tipo: c.metodo === 'ECHEQ' ? 'ECHEQ' : 'FISICO',
          numero: c.numero || 'S/N',
          banco: c.banco || 'No especificado',
          cuit_emisor: c.cuit_emisor || null,
          librador: c.librador || null,
          fecha_emision: c.fecha_emision,
          fecha_pago: c.fecha_pago,
          monto: parseFloat(c.monto || 0),
          estado: 'EN_CARTERA',
          observaciones: `Ingresado en Recibo #${numero || compData.id.slice(0, 8)}`
        }));

      if (chequesAGuardar.length > 0) {
        const { error: chequeErr } = await supabase.from('cheques').insert(chequesAGuardar);
        if (chequeErr) {
          console.error('Error guardando cheques en cartera:', chequeErr);
          alert('El comprobante se guardó, pero hubo un detalle guardando los cheques en cartera.');
        }
      }
    }

    setGuardando(false);
    setMontoFactura('');
    setNumero('');
    setObservaciones('');
    setMediosPago([]);
    onGuardado();
    onClose();
  };

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
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fcfbf9',
          border: '1px solid #e5e0d8',
          borderRadius: '14px',
          width: '94%',
          maxWidth: '650px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          color: '#2b2927',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #eeeae1', paddingBottom: '0.85rem' }}>
          <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.2rem', fontWeight: '800' }}>
            💵 Cargar Comprobante / Cobranza
          </h3>
          <button onClick={onClose} style={{ background: '#eeeae1', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map((c) => (
                <option key={c.cliente_id || c.id} value={c.cliente_id || c.id}>
                  {c.razon_social}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Tipo de Movimiento</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  if (e.target.value !== 'RECIBO_COBRANZA') setMediosPago([]);
                }}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
              >
                <option value="RECIBO_COBRANZA">Recibo / Cobranza (-Deuda)</option>
                <option value="FACTURA_A">Factura A (+Deuda)</option>
                <option value="FACTURA_B">Factura B (+Deuda)</option>
                <option value="NOTA_DEBITO">Nota de Débito (+Deuda)</option>
                <option value="NOTA_CREDITO">Nota de Crédito (-Deuda)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>N° Comprobante</label>
              <input
                type="text"
                placeholder="0001-00001234"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Fecha Emisión *</label>
              <input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            {!esCobranza && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Fecha Vencimiento</label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            )}
          </div>

          {!esCobranza && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Importe ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoFactura}
                onChange={(e) => setMontoFactura(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {esCobranza && (
            <div style={{ backgroundColor: '#f5f2eb', border: '1px solid #e5e0d8', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1c1917' }}>💳 Medios de Pago recibidos</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button type="button" onClick={() => agregarMedioPago('EFECTIVO')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dcd5c9', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Efectivo</button>
                  <button type="button" onClick={() => agregarMedioPago('TRANSFERENCIA')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #dcd5c9', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Transf.</button>
                  <button type="button" onClick={() => agregarMedioPago('CHEQUE_FISICO')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #15803d', background: '#eab308', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Cheque Físico</button>
                  <button type="button" onClick={() => agregarMedioPago('ECHEQ')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #15803d', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ ECHEQ</button>
                </div>
              </div>

              {mediosPago.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#78716c', textAlign: 'center', padding: '1rem', border: '1px dashed #dcd5c9', borderRadius: '6px' }}>
                  Hacé clic en los botones de arriba para agregar medios de pago (ej: Cheque + Efectivo)
                </div>
              ) : (
                mediosPago.map((m) => {
                  const esCheque = m.metodo === 'CHEQUE_FISICO' || m.metodo === 'ECHEQ';

                  return (
                    <div key={m.id} style={{ background: '#fff', border: '1px solid #dcd5c9', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: esCheque ? '#15803d' : '#2b2927' }}>
                          {m.metodo === 'CHEQUE_FISICO' ? '📜 Cheque Físico' : m.metodo === 'ECHEQ' ? '💻 ECHEQ' : m.metodo === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Transferencia'}
                        </span>
                        <button type="button" onClick={() => eliminarMedio(m.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: esCheque ? '1fr 1fr 1fr' : '1fr', gap: '0.5rem', marginBottom: esCheque ? '0.5rem' : 0 }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>Monto ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={m.monto}
                            onChange={(e) => actualizarMedio(m.id, 'monto', e.target.value)}
                            style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontWeight: 'bold', boxSizing: 'border-box' }}
                          />
                        </div>

                        {esCheque && (
                          <>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>N° Cheque (8 dígs.)</label>
                              <input
                                type="text"
                                maxLength={8} // 👈 Limita tipeo a 8 caracteres máximo
                                placeholder="12345678"
                                value={m.numero}
                                onChange={(e) => actualizarMedio(m.id, 'numero', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box', fontFamily: 'monospace' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>Banco</label>
                              <input
                                type="text"
                                placeholder="Ej: Galicia"
                                value={m.banco}
                                onChange={(e) => actualizarMedio(m.id, 'banco', e.target.value)}
                                style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {esCheque && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>CUIT Emisor</label>
                            <input
                              type="text"
                              placeholder="30-..."
                              value={m.cuit_emisor}
                              onChange={(e) => actualizarMedio(m.id, 'cuit_emisor', e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>F. Emisión</label>
                            <input
                              type="date"
                              value={m.fecha_emision}
                              onChange={(e) => actualizarMedio(m.id, 'fecha_emision', e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 'bold' }}>F. Cobro (Venc.)</label>
                            <input
                              type="date"
                              value={m.fecha_pago}
                              onChange={(e) => actualizarMedio(m.id, 'fecha_pago', e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #dcd5c9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#44403c' }}>Total Recibo:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#15803d' }}>
                  $ {totalCobranza.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Observaciones</label>
            <textarea
              rows={2}
              placeholder="Notas adicionales..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {guardando ? '💾 Guardando...' : '💾 Registrar Comprobante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}
