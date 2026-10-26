'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalComprobante({ mostrar, onClose, supabase, clientes = [], onGuardado = () => {} }) {
  const [mounted, setMounted] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('FACTURA_A');
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [monto, setMonto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mostrar || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !monto || parseFloat(monto) <= 0) {
      alert('Por favor seleccioná un cliente e ingresá un monto válido.');
      return;
    }

    setGuardando(true);

    // Determinamos si suma a la deuda (Debe) o resta (Haber)
    const esDebe = ['FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_DEBITO'].includes(tipo);
    const debeValor = esDebe ? parseFloat(monto) : 0;
    const haberValor = !esDebe ? parseFloat(monto) : 0;

    const { error } = await supabase.from('comprobantes_cc').insert({
      cliente_id: clienteId,
      tipo,
      numero: numero || null,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento || null,
      debe: debeValor,
      haber: haberValor,
      observaciones: observaciones || null
    });

    setGuardando(false);

    if (error) {
      alert(`Error al guardar comprobante: ${error.message}`);
    } else {
      // Limpiar y cerrar
      setMonto('');
      setNumero('');
      setObservaciones('');
      onGuardado();
      onClose();
    }
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
          width: '90%',
          maxWidth: '520px',
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
                onChange={(e) => setTipo(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}
              >
                <option value="FACTURA_A">Factura A (+Deuda)</option>
                <option value="FACTURA_B">Factura B (+Deuda)</option>
                <option value="NOTA_DEBITO">Nota de Débito (+Deuda)</option>
                <option value="RECIBO_COBRANZA">Recibo / Cobranza (-Deuda)</option>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Fecha Vencimiento</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Importe ($) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Observaciones / Medio de Pago</label>
            <textarea
              rows={2}
              placeholder="Ej: Transferencia Banco Galicia / Cheque #30411 a 30 días"
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
