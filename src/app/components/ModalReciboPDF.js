'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function ModalReciboPDF({ mostrar, onClose, reciboData }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mostrar || !mounted || !reciboData) return null;

  const { cliente, recibo, mediosPago = [], facturasImputadas = [] } = reciboData;

  const handleImprimir = () => {
    window.print();
  };

  const totalRecibo = mediosPago.reduce((acc, m) => acc + (parseFloat(m.monto) || 0), 0) || parseFloat(recibo.haber || 0);

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
        id="area-impresion-recibo"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#ffffff',
          border: '1px solid #e5e0d8',
          borderRadius: '14px',
          width: '92%',
          maxWidth: '750px',
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
            #area-impresion-recibo, #area-impresion-recibo * { visibility: visible; }
            #area-impresion-recibo {
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

        {/* CABECERA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #15803d', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '38px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
              <h2 style={{ margin: 0, color: '#1c1917', fontSize: '1.4rem', fontWeight: '900' }}>AGROMECANICA</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Venta de Maquinaria y Repuestos Agrícolas</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.2rem', fontWeight: '900' }}>RECIBO DE COBRANZA</h3>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1c1917', marginTop: '0.25rem' }}>
              N° {recibo.numero || 'X-00000'}
            </div>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Fecha: {recibo.fecha_emision}</span>
          </div>
        </div>

        {/* DATOS CLIENTE */}
        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '8px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Recibimos de:</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1c1917' }}>{cliente?.razon_social || 'Cliente Generico'}</div>
          {cliente?.cuit_dni && <div style={{ fontSize: '0.8rem', color: '#57534e' }}>CUIT/DNI: {cliente.cuit_dni}</div>}
        </div>

        {/* FACTURAS CANCELADAS / IMPUTADAS */}
        {facturasImputadas.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#1c1917', textTransform: 'uppercase' }}>📌 Comprobantes Cancelados</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#eeeae1', color: '#44403c' }}>
                  <th style={{ padding: '0.5rem' }}>Comprobante</th>
                  <th style={{ padding: '0.5rem' }}>Fecha</th>
                  <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto Cancelado</th>
                </tr>
              </thead>
              <tbody>
                {facturasImputadas.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eeeae1' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{f.tipo} #{f.numero || 'S/N'}</td>
                    <td style={{ padding: '0.5rem' }}>{f.fecha_emision}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                      $ {parseFloat(f.monto_imputado).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DETALLE DE MEDIOS DE PAGO */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#1c1917', textTransform: 'uppercase' }}>💳 Detalle de Valores / Valores Recibidos</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c' }}>
                <th style={{ padding: '0.5rem' }}>Medio de Pago</th>
                <th style={{ padding: '0.5rem' }}>Detalle / N° / Banco</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {mediosPago.length === 0 ? (
                <tr>
                  <td style={{ padding: '0.5rem' }}>Efectivo / Transferencia</td>
                  <td style={{ padding: '0.5rem' }}>Cobranza directa en cuenta</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                    $ {totalRecibo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ) : (
                mediosPago.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eeeae1' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                      {m.metodo === 'CHEQUE_FISICO' ? '📜 Cheque Físico' : m.metodo === 'ECHEQ' ? '💻 ECHEQ' : m.metodo === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Transferencia'}
                    </td>
                    <td style={{ padding: '0.5rem', color: '#57534e' }}>
                      {(m.metodo === 'CHEQUE_FISICO' || m.metodo === 'ECHEQ') 
                        ? `N° ${m.numero || 'S/N'} - ${m.banco || ''} (Venc: ${m.fecha_pago || '-'})` 
                        : '-'}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                      $ {parseFloat(m.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TOTAL FINAL */}
        <div style={{ backgroundColor: '#f5f2eb', border: '1px solid #dcd5c9', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1c1917' }}>TOTAL RECIBIDO:</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#15803d' }}>
            $ {totalRecibo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* BOTONES ACCIÓN */}
        <div className="no-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
          <button onClick={onClose} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>
            Cerrar
          </button>
          <button onClick={handleImprimir} style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
            🖨️ Descargar / Imprimir PDF
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}
