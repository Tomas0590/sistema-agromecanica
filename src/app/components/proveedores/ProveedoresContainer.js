'use client';

import { useState, useEffect } from 'react';
import ModalProveedor from './ModalProveedor';
import ModalComprobanteProveedor from './ModalComprobanteProveedor';
import ModalResumenProveedorPDF from './ModalResumenProveedorPDF';

export default function ProveedoresContainer({ supabase }) {
  const [proveedores, setProveedores] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Cotización Dólar BNA Venta de referencia
  const [cotizacionBna, setCotizacionBna] = useState(1200);

  // Modales
  const [mostrarModalNuevoProv, setMostrarModalNuevoProv] = useState(false);
  const [mostrarModalComprobante, setMostrarModalComprobante] = useState(false);
  
  // Modal Resumen PDF
  const [proveedorSeleccionadoPdf, setProveedorSeleccionadoPdf] = useState(null);
  const [mostrarModalPdf, setMostrarModalPdf] = useState(false);

  useEffect(() => {
    cargarDolar();
    cargarProveedores();
    cargarComprobantes();
  }, []);

  const cargarDolar = async () => {
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        if (data.venta) setCotizacionBna(parseFloat(data.venta));
      }
    } catch (e) {
      console.error('Error cargando dólar BNA:', e);
    }
  };

  const cargarProveedores = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('vista_saldos_proveedores')
        .select('*')
        .order('razon_social', { ascending: true });

      if (!error && data) {
        setProveedores(data);
      }
    } catch (e) {
      console.error('Error cargando proveedores:', e);
    } finally {
      setCargando(false);
    }
  };

  const cargarComprobantes = async () => {
    try {
      const { data, error } = await supabase
        .from('comprobantes_proveedores')
        .select('*, proveedores(razon_social, cuit)')
        .order('fecha_emision', { ascending: false });

      if (!error && data) {
        setComprobantes(data);
      }
    } catch (e) {
      console.error('Error cargando comprobantes proveedores:', e);
    }
  };

  const abrirResumenPdf = (prov) => {
    setProveedorSeleccionadoPdf(prov);
    setMostrarModalPdf(true);
  };

  const proveedoresFiltrados = proveedores.filter(p =>
    (p.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.cuit || '').includes(busqueda)
  );

  const totalDeudaArs = proveedores.reduce((sum, p) => sum + parseFloat(p.saldo_total_ars || 0), 0);
  const totalDeudaUsd = proveedores.reduce((sum, p) => sum + parseFloat(p.saldo_total_usd || 0), 0);

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            🏢 Proveedores y Cuentas por Pagar
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Gestión de facturas de compra (ARS / USD), órdenes de pago y resumen en PDF
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setMostrarModalNuevoProv(true)}
            style={{ background: '#eeeae1', border: '1px solid #dcd5c9', color: '#2b2927', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Nuevo Proveedor
          </button>
          <button
            onClick={() => setMostrarModalComprobante(true)}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            📄 Cargar Factura / Orden de Pago
          </button>
        </div>
      </div>

      {/* TARJETAS RESUMEN DE SALDOS COMPRAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase' }}>Deuda Total en ARS</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#dc2626', marginTop: '0.25rem' }}>
            $ {totalDeudaArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Deuda Total en USD</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7', marginTop: '0.25rem' }}>
            USD {totalDeudaUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#0369a1' }}>
            Equiv. BNA (${cotizacionBna}): ${(totalDeudaUsd * cotizacionBna).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Proveedores Activos</span>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2b2927', marginTop: '0.25rem' }}>
            {proveedores.length}
          </div>
        </div>
      </div>

      {/* VISTA DE TABLA DE PROVEEDORES */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar proveedor por Razón Social o CUIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ width: '100%', maxWidth: '420px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Proveedor / Fábrica</th>
                <th style={{ padding: '0.75rem 1rem' }}>CUIT</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Saldo ARS ($)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Saldo USD</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acciones / Resumen</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    ⏳ Cargando proveedores...
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    No hay proveedores registrados.
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((p) => {
                  const saldoArs = parseFloat(p.saldo_total_ars || 0);
                  const saldoUsd = parseFloat(p.saldo_total_usd || 0);

                  return (
                    <tr key={p.proveedor_id} style={{ borderBottom: '1px solid #eeeae1' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                        🏭 {p.razon_social}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#57534e' }}>
                        {p.cuit || '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 'bold', color: saldoArs > 0 ? '#dc2626' : '#78716c' }}>
                        $ {saldoArs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 'bold', color: saldoUsd > 0 ? '#0284c7' : '#78716c' }}>
                        {saldoUsd > 0 ? `USD ${saldoUsd.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => abrirResumenPdf(p)}
                          style={{ background: '#eeeae1', border: '1px solid #dcd5c9', color: '#2b2927', padding: '0.35rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}
                        >
                          📄 Resumen / PDF
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

      {/* MODALES */}
      <ModalProveedor
        mostrar={mostrarModalNuevoProv}
        onClose={() => setMostrarModalNuevoProv(false)}
        supabase={supabase}
        onGuardado={cargarProveedores}
      />

      <ModalComprobanteProveedor
        mostrar={mostrarModalComprobante}
        onClose={() => setMostrarModalComprobante(false)}
        supabase={supabase}
        proveedores={proveedores}
        cotizacionBna={cotizacionBna}
        onGuardado={() => {
          cargarProveedores();
          cargarComprobantes();
        }}
      />

      <ModalResumenProveedorPDF
        mostrar={mostrarModalPdf}
        onClose={() => setMostrarModalPdf(false)}
        proveedor={proveedorSeleccionadoPdf}
        comprobantes={comprobantes}
        cotizacionBna={cotizacionBna}
      />
    </div>
  );
}
