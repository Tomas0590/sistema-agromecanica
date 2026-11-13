'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalComprobanteProveedor({ mostrar, onClose, supabase, proveedores = [], cotizacionBna = 1200, onGuardado = () => {} }) {
  const [proveedorId, setProveedorId] = useState('');
  const [tipo, setTipo] = useState('FACTURA_A');
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [moneda, setMoneda] = useState('ARS');
  const [tipoCambio, setTipoCambio] = useState(cotizacionBna);
  const [montoFactura, setMontoFactura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // MEDIOS DE PAGO PARA ORDEN DE PAGO (OP)
  const [mediosPago, setMediosPago] = useState([]);
  const [chequesEnCartera, setChequesEnCartera] = useState([]);

  const limpiarFormulario = () => {
    setProveedorId('');
    setTipo('FACTURA_A');
    setNumero('');
    setFechaEmision(new Date().toISOString().split('T')[0]);
    setMoneda('ARS');
    setTipoCambio(cotizacionBna);
    setMontoFactura('');
    setObservaciones('');
    setMediosPago([]);
  };

  useEffect(() => {
    if (mostrar) {
      limpiarFormulario();
      cargarChequesCartera();
    }
  }, [mostrar]);

  const cargarChequesCartera = async () => {
    const { data, error } = await supabase
      .from('cheques')
      .select('*, clientes(razon_social)')
      .eq('estado', 'EN_CARTERA')
      .order('fecha_pago', { ascending: true });

    if (!error && data) {
      setChequesEnCartera(data);
    }
  };

  if (!mostrar) return null;

  const esOrdenPago = tipo === 'ORDEN_PAGO';

  const agregarMedioPago = (metodo) => {
    setMediosPago([
      ...mediosPago,
      {
        id: Date.now(),
        metodo,
        monto: '',
        cheque_id: '',
        tc_aplicado: tipoCambio
      }
    ]);
  };

  const actualizarMedio = (id, campo, valor) => {
    setMediosPago(mediosPago.map(m => {
      if (m.id === id) {
        const actualizado = { ...m, [campo]: valor };
        if (campo === 'cheque_id') {
          const chq = chequesEnCartera.find(c => c.id === valor);
          if (chq) actualizado.monto = chq.monto;
        }
        return actualizado;
      }
      return m;
    }));
  };

  const eliminarMedio = (id) => {
    setMediosPago(mediosPago.filter(m => m.id !== id));
  };

  const totalOpArs = mediosPago.reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);
  const totalOpUsd = moneda === 'USD' ? (totalOpArs / (parseFloat(tipoCambio) || 1)) : totalOpArs;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proveedorId) {
      alert('Seleccioná un proveedor.');
      return;
    }

    const montoOpCalculado = moneda === 'USD' ? totalOpUsd : totalOpArs;
    const montoTotalOperacion = esOrdenPago ? montoOpCalculado : parseFloat(montoFactura || 0);

    if (montoTotalOperacion <= 0) {
      alert('El monto debe ser mayor a 0.');
      return;
    }

    setGuardando(true);

    const esDebe = ['FACTURA_A', 'FACTURA_B'].includes(tipo);
    const debeValor = esDebe ? montoTotalOperacion : 0;
    const haberValor = !esDebe ? montoTotalOperacion : 0;

    let obsDetalle = observaciones;
    if (esOrdenPago && mediosPago.length > 0) {
      const resumenMedios = mediosPago.map(m => {
        if (m.metodo === 'CHEQUE_ENDOSADO') {
          const chq = chequesEnCartera.find(c => c.id === m.cheque_id);
          return `Endoso Cheque #${chq?.numero || 'S/N'} ($${m.monto})`;
        }
        return `${m.metodo}: $${m.monto}`;
      }).join(' | ');
      obsDetalle = observaciones ? `${observaciones} (${resumenMedios})` : resumenMedios;
    }

    // 1. Registrar Comprobante de Proveedor
    const { data: compData, error: compError } = await supabase
      .from('comprobantes_proveedores')
      .insert({
        proveedor_id: proveedorId,
        tipo,
        numero: numero || null,
        fecha_emision: fechaEmision,
        moneda,
        tipo_cambio: parseFloat(tipoCambio) || 1.00,
        debe: debeValor,
        haber: haberValor,
        saldo_pendiente: esDebe ? debeValor : 0,
        observaciones: obsDetalle || null
      })
      .select()
      .single();

    if (compError) {
      alert(`Error al guardar comprobante: ${compError.message}`);
      setGuardando(false);
      return;
    }

    // 2. Si es Orden de Pago, actualizar estado de los cheques endosados
    if (esOrdenPago) {
      for (const m of mediosPago) {
        if (m.metodo === 'CHEQUE_ENDOSADO' && m.cheque_id) {
          await supabase
            .from('cheques')
            .update({
              estado: 'ENDOSADO',
              proveedor_id: proveedorId,
              observaciones: `Endosado en OP #${numero || compData.id.slice(0, 8)}`
            })
            .eq('id', m.cheque_id);
        }
      }
    }

    setGuardando(false);
    limpiarFormulario();
    onGuardado();
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '12px', width: '94%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', color: '#2b2927', boxShadow: '0 10px 25px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eeeae1', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.15rem', fontWeight: '800' }}>📄 Cargar Factura de Compra / Orden de Pago</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Proveedor *</label>
            <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}>
              <option value="">-- Seleccionar Proveedor --</option>
              {proveedores.map(p => (
                <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Tipo de Comprobante</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}>
                <option value="FACTURA_A">Factura A (+Deuda)</option>
                <option value="FACTURA_B">Factura B (+Deuda)</option>
                <option value="ORDEN_PAGO">Orden de Pago (-Deuda)</option>
                <option value="NOTA_CREDITO">Nota de Crédito (-Deuda)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>N° Comprobante</label>
              <input type="text" placeholder="Ej: 0001-00001234" value={numero} onChange={(e) => setNumero(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Fecha Emisión</label>
              <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Moneda</label>
              <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}>
                <option value="ARS">🇦🇷 Pesos (ARS)</option>
                <option value="USD">🇺🇸 Dólares (USD)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#0284c7', marginBottom: '0.2rem' }}>TC Dólar Pactado</label>
              <input type="number" step="0.01" value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #bae6fd', background: '#f0f9ff', fontWeight: 'bold', boxSizing: 'border-box' }} />
            </div>
          </div>

          {!esOrdenPago && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Importe Total ({moneda}) *</label>
              <input type="number" step="0.01" placeholder="0.00" value={montoFactura} onChange={(e) => setMontoFactura(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }} />
            </div>
          )}

          {/* FORMAS DE PAGO EN ORDEN DE PAGO */}
          {esOrdenPago && (
            <div style={{ backgroundColor: '#f5f2eb', border: '1px solid #e5e0d8', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1c1917' }}>💳 Formas de Pago Aplicadas</span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button type="button" onClick={() => agregarMedioPago('EFECTIVO')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #dcd5c9', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Efectivo</button>
                  <button type="button" onClick={() => agregarMedioPago('TRANSFERENCIA')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #dcd5c9', background: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Transf.</button>
                  <button type="button" onClick={() => agregarMedioPago('CHEQUE_ENDOSADO')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #15803d', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>+ Endosar Cheque</button>
                </div>
              </div>

              {mediosPago.map((m) => (
                <div key={m.id} style={{ background: '#fff', border: '1px solid #dcd5c9', borderRadius: '6px', padding: '0.6rem', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                      {m.metodo === 'EFECTIVO' ? '💵 Efectivo' : m.metodo === 'TRANSFERENCIA' ? '🏦 Transferencia' : '📜 Endoso de Cheque en Cartera'}
                    </span>
                    <button type="button" onClick={() => eliminarMedio(m.id)} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                  </div>

                  {m.metodo === 'CHEQUE_ENDOSADO' ? (
                    <div>
                      <select value={m.cheque_id} onChange={(e) => actualizarMedio(m.id, 'cheque_id', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', background: '#fff' }}>
                        <option value="">-- Seleccionar Cheque de la Cartera --</option>
                        {chequesEnCartera.map(c => (
                          <option key={c.id} value={c.id}>
                            #{c.numero} - {c.banco} | Venc: {c.fecha_pago} | Monto: ${parseFloat(c.monto).toLocaleString('es-AR')}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input type="number" step="0.01" placeholder="Monto en ARS" value={m.monto} onChange={(e) => actualizarMedio(m.id, 'monto', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box', fontWeight: 'bold' }} />
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid #dcd5c9' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Total Pagado:</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#15803d' }}>
                  {moneda === 'USD' ? `USD ${totalOpUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })} (aprox $ ${totalOpArs.toLocaleString('es-AR')})` : `$ ${totalOpArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Observaciones</label>
            <textarea rows={2} placeholder="Notas adicionales..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #eeeae1', paddingTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
            <button type="submit" disabled={guardando} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {guardando ? '💾 Guardando...' : '💾 Registrar Comprobante'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
