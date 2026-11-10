'use client';

import { useState, useEffect } from 'react';
import ModalComprobante from './ModalComprobante';
import ModalResumenCliente from './ModalResumenCliente';
import ModalReciboPDF from './ModalReciboPDF';

export default function CuentasCorrientesContainer({ supabase }) {
  const [vistaActual, setVistaActual] = useState('saldos'); // 'saldos' | 'comprobantes'
  const [saldosClientes, setSaldosClientes] = useState([]);
  const [comprobantes, setComprobantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [soloDeudores, setSoloDeudores] = useState(false);
  const [filtroTipoComp, setFiltroTipoComp] = useState('TODOS');

  // Modales
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [clienteSeleccionadoResumen, setClienteSeleccionadoResumen] = useState(null);
  const [reciboParaVer, setReciboParaVer] = useState(null);

  // Estado para la edición directa al clickear una fila del historial
  const [editandoCompId, setEditandoCompId] = useState(null);
  const [editForm, setEditForm] = useState({ numero: '', fecha_emision: '', monto: '', observaciones: '' });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  useEffect(() => {
    cargarSaldos();
    cargarComprobantes();
  }, []);

  const cargarSaldos = async () => {
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
    }
  };

  const cargarComprobantes = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('comprobantes_cc')
        .select(`
          *,
          clientes ( razon_social, cuit_dni )
        `)
        .order('fecha_emision', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setComprobantes(data);
      }
    } catch (e) {
      console.error('Error cargando comprobantes:', e);
    } finally {
      setCargando(false);
    }
  };

  // Iniciar edición al clickear una fila
  const handleClicFilaComprobante = (comp) => {
    if (editandoCompId === comp.id) return;
    setEditandoCompId(comp.id);
    const esDebe = parseFloat(comp.debe || 0) > 0;
    setEditForm({
      numero: comp.numero || '',
      fecha_emision: comp.fecha_emision || '',
      monto: esDebe ? comp.debe : comp.haber,
      observaciones: comp.observaciones || ''
    });
  };

  const handleGuardarEdicionFila = async (comp, e) => {
    e.stopPropagation();
    setGuardandoEdicion(true);
    const esDebe = parseFloat(comp.debe || 0) > 0;
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
      .eq('id', comp.id);

    setGuardandoEdicion(false);

    if (error) {
      alert(`Error al actualizar comprobante: ${error.message}`);
    } else {
      setEditandoCompId(null);
      await cargarSaldos();
      await cargarComprobantes();
    }
  };

  const handleEliminarComprobanteFila = async (comp, e) => {
    e.stopPropagation();
    if (!confirm(`¿Estás seguro de eliminar el comprobante ${formatearTipo(comp.tipo)} ${comp.numero ? `#${comp.numero}` : ''}?`)) {
      return;
    }

    const { error } = await supabase
      .from('comprobantes_cc')
      .delete()
      .eq('id', comp.id);

    if (error) {
      alert(`Error al eliminar: ${error.message}`);
    } else {
      setEditandoCompId(null);
      await cargarSaldos();
      await cargarComprobantes();
    }
  };

  const handleVerRecibo = async (comp, e) => {
    e.stopPropagation();
    const { data: clienteObj } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', comp.cliente_id)
      .single();

    setReciboParaVer({
      cliente: clienteObj || comp.clientes,
      recibo: comp,
      mediosPago: [],
      facturasImputadas: []
    });
  };

  const formatearTipo = (t) => {
    switch (t) {
      case 'RECIBO_COBRANZA': return 'RECIBO';
      case 'FACTURA_A': return 'FACTURA A';
      case 'FACTURA_B': return 'FACTURA B';
      case 'FACTURA_C': return 'FACTURA C';
      case 'NOTA_DEBITO': return 'NOTA DÉBITO';
      case 'NOTA_CREDITO': return 'NOTA CRÉDITO';
      default: return t ? t.replace('_', ' ') : '';
    }
  };

  // Filtrados
  const saldosFiltrados = saldosClientes.filter((c) => {
    const matchTexto = 
      (c.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.cuit_dni || '').includes(busqueda);
    const matchDeuda = soloDeudores ? parseFloat(c.saldo_total || 0) > 0 : true;
    return matchTexto && matchDeuda;
  });

  const comprobantesFiltrados = comprobantes.filter((comp) => {
    const matchTipo = filtroTipoComp === 'TODOS' ? true : comp.tipo === filtroTipoComp;
    const matchTexto = 
      (comp.clientes?.razon_social || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (comp.numero || '').includes(busqueda) ||
      (comp.observaciones || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchTexto;
  });

  const totalAdeudadoGeneral = saldosClientes.reduce((acc, c) => acc + parseFloat(c.saldo_total || 0), 0);
  const totalVencidoGeneral = saldosClientes.reduce((acc, c) => acc + parseFloat(c.saldo_vencido || 0), 0);

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Cuentas Corrientes y Comprobantes
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Gestión de cuentas corrientes, facturas emitidas, recibos de cobranza y notas de crédito
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setMostrarModalNuevo(true)}
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
          <span style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>Comprobantes Registrados</span>
          <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2b2927', marginTop: '0.25rem' }}>
            {comprobantes.length}
          </div>
        </div>
      </div>

      {/* BARRA DE NAVEGACIÓN DE VISTAS (SALDOS VS LISTADO GENERAL) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setVistaActual('saldos')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: vistaActual === 'saldos' ? '#15803d' : '#eeeae1',
            color: vistaActual === 'saldos' ? '#fff' : '#44403c',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          📊 Estado de Saldos por Cliente
        </button>

        <button
          onClick={() => setVistaActual('comprobantes')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: vistaActual === 'comprobantes' ? '#15803d' : '#eeeae1',
            color: vistaActual === 'comprobantes' ? '#fff' : '#44403c',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          🧾 Registro Histórico de Comprobantes
        </button>
      </div>

      {/* TABLA DE VISTA 1: SALDOS POR CLIENTE */}
      {vistaActual === 'saldos' && (
        <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="🔍 Buscar cliente por Razón Social o CUIT..."
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
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Saldo Total</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Deuda Vencida</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Últ. Movimiento</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {saldosFiltrados.map((cliente) => {
                  const saldo = parseFloat(cliente.saldo_total || 0);
                  const vencido = parseFloat(cliente.saldo_vencido || 0);

                  return (
                    <tr key={cliente.cliente_id || cliente.id} style={{ borderBottom: '1px solid #eeeae1' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                        👤 {cliente.razon_social || 'SIN NOMBRE'}
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
                          onClick={() => setClienteSeleccionadoResumen(cliente)}
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLA DE VISTA 2: LISTADO GENERAL DE COMPROBANTES CON EDICIÓN AL CLICKEAR */}
      {vistaActual === 'comprobantes' && (
        <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por Cliente, N° comprobante u Observaciones..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ flex: 1, maxWidth: '420px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb' }}
            />

            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {['TODOS', 'RECIBO_COBRANZA', 'FACTURA_A', 'FACTURA_B', 'NOTA_CREDITO'].map((tipoFiltro) => (
                <button
                  key={tipoFiltro}
                  onClick={() => setFiltroTipoComp(tipoFiltro)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: filtroTipoComp === tipoFiltro ? '#15803d' : '#eeeae1',
                    color: filtroTipoComp === tipoFiltro ? '#fff' : '#44403c',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {tipoFiltro === 'TODOS' ? 'TODOS' : formatearTipo(tipoFiltro)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                  <th style={{ padding: '0.75rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem' }}>Tipo / N° Comprobante</th>
                  <th style={{ padding: '0.75rem' }}>Cliente</th>
                  <th style={{ padding: '0.75rem' }}>Detalle / Obs.</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debe (+)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Haber (-)</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                      ⏳ Cargando registro de comprobantes...
                    </td>
                  </tr>
                ) : comprobantesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                      No se encontraron comprobantes registrados.
                    </td>
                  </tr>
                ) : (
                  comprobantesFiltrados.map((comp) => {
                    const estaEditando = editandoCompId === comp.id;
                    const esRecibo = comp.tipo === 'RECIBO_COBRANZA';
                    const debeNum = parseFloat(comp.debe || 0);
                    const haberNum = parseFloat(comp.haber || 0);

                    if (estaEditando) {
                      return (
                        <tr key={comp.id} style={{ backgroundColor: '#fefce8', borderBottom: '1px solid #fef08a' }}>
                          <td style={{ padding: '0.4rem' }}>
                            <input
                              type="date"
                              value={editForm.fecha_emision}
                              onChange={(e) => setEditForm({ ...editForm, fecha_emision: e.target.value })}
                              style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{formatearTipo(comp.tipo)}</span>
                            <input
                              type="text"
                              placeholder="N°"
                              value={editForm.numero}
                              onChange={(e) => setEditForm({ ...editForm, numero: e.target.value })}
                              style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '80px', marginLeft: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            👤 {comp.clientes?.razon_social}
                          </td>
                          <td style={{ padding: '0.4rem' }}>
                            <input
                              type="text"
                              placeholder="Observaciones"
                              value={editForm.observaciones}
                              onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                              style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '100%' }}
                            />
                          </td>
                          <td colSpan={2} style={{ padding: '0.4rem', textAlign: 'right' }}>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.monto}
                              onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                              style={{ padding: '0.35rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontSize: '0.75rem', width: '90px', fontWeight: 'bold' }}
                            />
                          </td>
                          <td style={{ padding: '0.4rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                              <button
                                onClick={(e) => handleGuardarEdicionFila(comp, e)}
                                disabled={guardandoEdicion}
                                title="Guardar cambios"
                                style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              >
                                ✓ Guardar
                              </button>
                              <button
                                onClick={(e) => handleEliminarComprobanteFila(comp, e)}
                                title="Eliminar comprobante"
                                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                              >
                                🗑️ Eliminar
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditandoCompId(null); }}
                                style={{ background: '#eeeae1', color: '#44403c', border: 'none', padding: '0.35rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
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
                        key={comp.id} 
                        onClick={() => handleClicFilaComprobante(comp)}
                        title="Hacé clic sobre esta fila para editar o eliminar el comprobante"
                        style={{ borderBottom: '1px solid #eeeae1', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdfbf7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{comp.fecha_emision}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                          {formatearTipo(comp.tipo)} {comp.numero ? `#${comp.numero}` : ''}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#1c1917', fontWeight: 'bold' }}>
                          👤 {comp.clientes?.razon_social || 'Cliente Generico'}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#57534e', fontSize: '0.75rem' }}>
                          {comp.observaciones || '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: debeNum > 0 ? '#2b2927' : '#a8a29e', whiteSpace: 'nowrap' }}>
                          {debeNum > 0 ? `$ ${debeNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: haberNum > 0 ? '#15803d' : '#a8a29e', whiteSpace: 'nowrap' }}>
                          {haberNum > 0 ? `$ ${haberNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {esRecibo && (
                            <button
                              type="button"
                              onClick={(e) => handleVerRecibo(comp, e)}
                              title="Ver / Reimprimir Recibo PDF"
                              style={{ background: '#f5f2eb', border: '1px solid #dcd5c9', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                              🖨️ PDF
                            </button>
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
      )}

      {/* MODAL NUEVO COMPROBANTE */}
      <ModalComprobante
        mostrar={mostrarModalNuevo}
        onClose={() => setMostrarModalNuevo(false)}
        supabase={supabase}
        clientes={saldosClientes}
        onGuardado={() => {
          cargarSaldos();
          cargarComprobantes();
        }}
      />

      {/* MODAL RESUMEN DE CUENTA */}
      <ModalResumenCliente
        mostrar={Boolean(clienteSeleccionadoResumen)}
        onClose={() => setClienteSeleccionadoResumen(null)}
        cliente={clienteSeleccionadoResumen}
        supabase={supabase}
        onActualizarSaldos={() => {
          cargarSaldos();
          cargarComprobantes();
        }}
      />

      {/* MODAL VER / REIMPRIMIR RECIBO PDF */}
      <ModalReciboPDF
        mostrar={Boolean(reciboParaVer)}
        onClose={() => setReciboParaVer(null)}
        reciboData={reciboParaVer}
      />
    </div>
  );
}
