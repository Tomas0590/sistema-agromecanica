'use client';

import { createPortal } from 'react-dom';

export default function ModalResumenProveedorPDF({ mostrar, onClose, proveedor, comprobantes = [], cotizacionBna = 1200 }) {
  if (!mostrar || !proveedor) return null;

  const comprobantesProv = comprobantes.filter(c => c.proveedor_id === proveedor.proveedor_id);
  const saldoArs = parseFloat(proveedor.saldo_total_ars || 0);
  const saldoUsd = parseFloat(proveedor.saldo_total_usd || 0);

  const imprimir = () => {
    window.print();
  };

  return createPortal(
    <div 
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
      onClick={onClose}
    >
      <div 
        style={{ background: '#fff', borderRadius: '12px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', color: '#1c1917' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* BOTONES SUPERIORES */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #eeeae1', paddingBottom: '1rem' }} className="no-print">
          <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.2rem', fontWeight: '800' }}>📄 Resumen de Cuenta Corriente - Proveedor</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={imprimir} 
              style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button 
              onClick={onClose} 
              style={{ background: '#eeeae1', border: '1px solid #dcd5c9', color: '#2b2927', padding: '0.5rem 0.85rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL PDF / COMPROBANTE */}
        <div id="pdf-content" style={{ fontFamily: 'sans-serif' }}>
          {/* ENCABEZADO AGROMECANICA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #15803d', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#15803d', fontWeight: '900', letterSpacing: '0.5px' }}>AGROMECANICA</h1>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#57534e' }}>Repuestos y Equipamiento Agrícola (Pulverización)</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#78716c' }}>Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#2b2927' }}>ESTADO DE CUENTA CORRIENTE</span>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#78716c' }}>Cotiz. BNA Referencia: ${cotizacionBna}</p>
            </div>
          </div>

          {/* DATOS DEL PROVEEDOR */}
          <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>FÁBRICA / PROVEEDOR</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1c1917', marginTop: '0.1rem' }}>{proveedor.razon_social}</div>
              {proveedor.cuit && <div style={{ fontSize: '0.85rem', color: '#57534e', fontFamily: 'monospace' }}>CUIT: {proveedor.cuit}</div>}
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: saldoArs > 0 ? '#dc2626' : '#15803d', fontWeight: 'bold' }}>
                Saldo ARS: $ {saldoArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.85rem', color: saldoUsd > 0 ? '#0284c7' : '#15803d', fontWeight: 'bold' }}>
                Saldo USD: {saldoUsd > 0 ? `USD ${saldoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'USD 0.00'}
              </div>
            </div>
          </div>

          {/* TABLA DE DETALLE DE COMPROBANTES */}
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#2b2927', fontSize: '0.95rem' }}>Detalle de Movimientos y Pagos</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f2eb', borderBottom: '2px solid #dcd5c9', color: '#44403c' }}>
                <th style={{ padding: '0.6rem' }}>Fecha</th>
                <th style={{ padding: '0.6rem' }}>Comprobante / Concepto</th>
                <th style={{ padding: '0.6rem', textAlign: 'center' }}>Moneda</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Debe (Facturas)</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Haber (Pagos/OP)</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Saldo Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {comprobantesProv.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#78716c' }}>
                    No hay movimientos registrados para este proveedor.
                  </td>
                </tr>
              ) : (
                comprobantesProv.map((c) => {
                  const esUsd = c.moneda === 'USD';
                  const prefijo = esUsd ? 'USD ' : '$ ';
                  
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #eeeae1' }}>
                      <td style={{ padding: '0.6rem', color: '#57534e' }}>{c.fecha_emision}</td>
                      <td style={{ padding: '0.6rem', fontWeight: 'bold', color: '#1c1917' }}>
                        {c.tipo.replace('_', ' ')} {c.numero ? `#${c.numero}` : ''}
                        {c.observaciones && <span style={{ display: 'block', fontSize: '0.7rem', color: '#78716c', fontWeight: 'normal' }}>{c.observaciones}</span>}
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: esUsd ? '#0284c7' : '#15803d', fontSize: '0.75rem' }}>{c.moneda}</span>
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', color: c.debe > 0 ? '#dc2626' : '#a8a29e' }}>
                        {c.debe > 0 ? `${prefijo}${parseFloat(c.debe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', color: c.haber > 0 ? '#15803d' : '#a8a29e' }}>
                        {c.haber > 0 ? `${prefijo}${parseFloat(c.haber).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', color: '#2b2927' }}>
                        {prefijo}{parseFloat(c.saldo_pendiente || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* PIE DEL COMPROBANTE */}
          <div style={{ borderTop: '2px solid #eeeae1', paddingTop: '1rem', marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#78716c' }}>
            <span>Agromecanica - Carhué, Buenos Aires</span>
            <span>Documento no válido como factura</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
