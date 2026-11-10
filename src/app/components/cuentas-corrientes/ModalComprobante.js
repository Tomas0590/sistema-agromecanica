'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ModalReciboPDF from './ModalReciboPDF';

export default function ModalComprobante({ mostrar, onClose, supabase, clientes = [], onGuardado = () => {} }) {
  const [mounted, setMounted] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [tipo, setTipo] = useState('RECIBO_COBRANZA');
  const [numero, setNumero] = useState('');
  const [cargandoNumero, setCargandoNumero] = useState(false);
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [montoFactura, setMontoFactura] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  // ESTADO MEDIOS PAGO Y FACTURAS PENDIENTES
  const [mediosPago, setMediosPago] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState({});

  // ESTADO LECTURA BCRA AUTOMÁTICA
  const [bcraStatusMap, setBcraStatusMap] = useState({});

  // ESTADO PARA PDF GENERADO
  const [reciboGenerado, setReciboGenerado] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mostrar) {
      obtenerProximoNumero(tipo);
    }
  }, [mostrar, tipo]);

  useEffect(() => {
    if (clienteId && tipo === 'RECIBO_COBRANZA') {
      cargarFacturasPendientes(clienteId);
    } else {
      setFacturasPendientes([]);
      setFacturasSeleccionadas({});
    }
  }, [clienteId, tipo]);

  if (!mostrar || !mounted) return null;

  const esCobranza = tipo === 'RECIBO_COBRANZA';

  const obtenerProximoNumero = async (tipoComprobante) => {
    setCargandoNumero(true);
    try {
      const { data, error } = await supabase
        .from('comprobantes_cc')
        .select('numero')
        .eq('tipo', tipoComprobante)
        .not('numero', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        const numerosExistentes = data
          .map(d => parseInt(String(d.numero).replace(/\D/g, ''), 10))
          .filter(n => !isNaN(n));

        if (numerosExistentes.length > 0) {
          const maxNum = Math.max(...numerosExistentes);
          setNumero(String(maxNum + 1));
        } else {
          setNumero('1');
        }
      } else {
        setNumero('1');
      }
    } catch (e) {
      console.error('Error calculando próximo número:', e);
      setNumero('1');
    } finally {
      setCargandoNumero(false);
    }
  };

  const cargarFacturasPendientes = async (idCli) => {
    const { data, error } = await supabase
      .from('comprobantes_cc')
      .select('*')
      .eq('cliente_id', idCli)
      .gt('debe', 0)
      .order('fecha_emision', { ascending: true });

    if (!error && data) {
      const pendientes = data.filter(f => (f.saldo_pendiente === null ? f.debe : f.saldo_pendiente) > 0);
      setFacturasPendientes(pendientes);
    }
  };

  const agregarMedioPago = (tipoMedio) => {
    const nuevo = {
      id: Date.now(),
      metodo: tipoMedio,
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

  // CONSULTA BCRA OFICIAL EN TIEMPO REAL (DEUDAS + CHEQUES RECHAZADOS)
  const consultarBcraAutomatico = async (cuitLimpio) => {
    if (bcraStatusMap[cuitLimpio]?.cargando) return;

    setBcraStatusMap(prev => ({ ...prev, [cuitLimpio]: { cargando: true } }));

    try {
      // 1. Consultar Deudas Activas por CUIT
      const resDeudas = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitLimpio}`);
      
      let maxSit = 1;
      let detalleEntidad = '';
      let cantidadChequesRechazados = 0;

      if (resDeudas.ok) {
        const jsonDeudas = await resDeudas.json();
        const periodos = jsonDeudas.results?.periodos || [];
        
        if (periodos.length > 0) {
          const entidades = periodos[0].entidades || [];
          entidades.forEach(e => {
            const sit = parseInt(e.situacion || 1, 10);
            if (sit > maxSit) {
              maxSit = sit;
              detalleEntidad = e.entidad || '';
            }
          });
        }
      }

      // 2. Consultar Cheques Rechazados por CUIT
      try {
        const resCheques = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cuitLimpio}`);
        if (resCheques.ok) {
          const jsonCheques = await resCheques.json();
          const chequesList = jsonCheques.results?.cheques || jsonCheques.results || [];
          if (Array.isArray(chequesList)) {
            cantidadChequesRechazados = chequesList.length;
          }
        }
      } catch (errChq) {
        console.warn('Error consultando cheques rechazados:', errChq);
      }

      // 3. Determinar Semaforo de Diagnóstico
      let textoSit = '🟢 Situación 1: Normal en BCRA (Sin moras)';
      let colorSit = '#15803d';
      let bgSit = '#f0fdf4';
      let borderSit = '#bbf7d0';

      if (cantidadChequesRechazados > 0) {
        textoSit = `🚨 ATENCIÓN: Registra ${cantidadChequesRechazados} Cheque(s) Rechazado(s) en BCRA`;
        colorSit = '#dc2626';
        bgSit = '#fef2f2';
        borderSit = '#fca5a5';
      } else if (maxSit === 2) {
        textoSit = `🟡 Situación 2: Riesgo Bajo / Atraso leve ${detalleEntidad ? `(${detalleEntidad})` : ''}`;
        colorSit = '#b45309';
        bgSit = '#fffbeb';
        borderSit = '#fde68a';
      } else if (maxSit === 3) {
        textoSit = `⚠️ Situación 3: Riesgo Medio / Cumplimiento Deficiente ${detalleEntidad ? `(${detalleEntidad})` : ''}`;
        colorSit = '#d97706';
        bgSit = '#fffbeb';
        borderSit = '#fcd34d';
      } else if (maxSit === 4) {
        textoSit = `🚨 Situación 4: Riesgo Alto / Alto Riesgo de Insolvencia ${detalleEntidad ? `(${detalleEntidad})` : ''}`;
        colorSit = '#dc2626';
        bgSit = '#fef2f2';
        borderSit = '#fca5a5';
      } else if (maxSit >= 5) {
        textoSit = `🛑 Situación 5: IRRECUPERABLE / Deudor Incobrable ${detalleEntidad ? `(${detalleEntidad})` : ''}`;
        colorSit = '#991b1b';
        bgSit = '#fef2f2';
        borderSit = '#f87171';
      }

      setBcraStatusMap(prev => ({
        ...prev,
        [cuitLimpio]: { cargando: false, situacion: maxSit, chequesRechazados: cantidadChequesRechazados, texto: textoSit, color: colorSit, bg: bgSit, border: borderSit }
      }));

    } catch (e) {
      console.error('Error al conectar con API BCRA:', e);
      setBcraStatusMap(prev => ({
        ...prev,
        [cuitLimpio]: {
          cargando: false,
          situacion: 0,
          texto: '🔍 BCRA no respondió. Hacé clic acá para verificar en La Macro portal',
          color: '#0284c7',
          bg: '#f0f9ff',
          border: '#bae6fd',
          esFallback: true
        }
      }));
    }
  };

  const actualizarMedio = (id, campo, valor) => {
    let valorFinal = valor;

    if (campo === 'numero') {
      valorFinal = valor.slice(0, 8);
    }

    if (campo === 'cuit_emisor') {
      // Permitir tipeo libre pero limpiar caracteres no numéricos para la consulta
      valorFinal = valor;
      const soloNumeros = valor.replace(/\D/g, '');

      if (soloNumeros.length === 11) {
        consultarBcraAutomatico(soloNumeros);
      }
    }

    setMediosPago(mediosPago.map(m => m.id === id ? { ...m, [campo]: valorFinal } : m));
  };

  const eliminarMedio = (id) => {
    setMediosPago(mediosPago.filter(m => m.id !== id));
  };

  const toggleFacturaSeleccionada = (factura) => {
    const id = factura.id;
    const saldoPend = factura.saldo_pendiente === null ? factura.debe : factura.saldo_pendiente;

    if (facturasSeleccionadas[id] !== undefined) {
      const copy = { ...facturasSeleccionadas };
      delete copy[id];
      setFacturasSeleccionadas(copy);
    } else {
      setFacturasSeleccionadas({ ...facturasSeleccionadas, [id]: saldoPend });
    }
  };

  const cambiarMontoCancelacion = (facturaId, monto) => {
    setFacturasSeleccionadas({ ...facturasSeleccionadas, [facturaId]: monto });
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
      const resumenMedios = mediosPago.map(m => {
        if (m.metodo === 'CHEQUE_FISICO' || m.metodo === 'ECHEQ') {
          return `${m.metodo} #${m.numero || 'S/N'} (${m.banco || 'S/B'}) CUIT: ${m.cuit_emisor || 'S/C'}: $${m.monto}`;
        }
        return `${m.metodo}: $${m.monto}`;
      }).join(' | ');
      obsDetalle = observaciones ? `${observaciones} (${resumenMedios})` : resumenMedios;
    }

    // 1. Guardar el Comprobante en la Cuenta Corriente
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

    const listadoImputaciones = [];

    // 2. Si es Cobranza, procesar facturas canceladas
    if (esCobranza && compData) {
      for (const [factId, montoCancela] of Object.entries(facturasSeleccionadas)) {
        const montoNum = parseFloat(montoCancela) || 0;
        if (montoNum > 0) {
          const facturaOrig = facturasPendientes.find(f => f.id === factId);
          const saldoActual = facturaOrig?.saldo_pendiente === null ? facturaOrig?.debe : facturaOrig?.saldo_pendiente;
          const nuevoSaldo = Math.max(0, saldoActual - montoNum);

          await supabase.from('comprobantes_cc').update({ saldo_pendiente: nuevoSaldo }).eq('id', factId);

          await supabase.from('imputaciones_recibo').insert({
            recibo_id: compData.id,
            factura_id: factId,
            monto_imputado: montoNum
          });

          listadoImputaciones.push({
            tipo: facturaOrig?.tipo,
            numero: facturaOrig?.numero,
            fecha_emision: facturaOrig?.fecha_emision,
            monto_imputado: montoNum
          });
        }
      }

      // 3. Guardar cheques en la cartera guardando el CUIT de emisor
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
        await supabase.from('cheques').insert(chequesAGuardar);
      }

      const clienteObj = clientes.find(c => (c.cliente_id || c.id) == clienteId);
      setReciboGenerado({
        cliente: clienteObj,
        recibo: compData,
        mediosPago,
        facturasImputadas: listadoImputaciones
      });
    }

    setGuardando(false);
    onGuardado();

    if (!esCobranza) {
      onClose();
    }
  };

  const modalUI = (
    <>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', zIndex: 999999 }} onClick={onClose}>
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '14px', width: '94%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', color: '#2b2927', boxShadow: '0 12px 30px rgba(0,0,0,0.3)', boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #eeeae1', paddingBottom: '0.85rem' }}>
            <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.2rem', fontWeight: '800' }}>💵 Cargar Comprobante / Cobranza</h3>
            <button onClick={onClose} style={{ background: '#eeeae1', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Cliente *</label>
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}>
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.cliente_id || c.id} value={c.cliente_id || c.id}>{c.razon_social}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Tipo de Movimiento</label>
                <select value={tipo} onChange={(e) => { setTipo(e.target.value); if (e.target.value !== 'RECIBO_COBRANZA') setMediosPago([]); }} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}>
                  <option value="RECIBO_COBRANZA">Recibo / Cobranza (-Deuda)</option>
                  <option value="FACTURA_A">Factura A (+Deuda)</option>
                  <option value="FACTURA_B">Factura B (+Deuda)</option>
                  <option value="NOTA_DEBITO">Nota de Débito (+Deuda)</option>
                  <option value="NOTA_CREDITO">Nota de Crédito (-Deuda)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
                  N° Comprobante {cargandoNumero && <span style={{ color: '#78716c', fontWeight: 'normal' }}>(autocalculando...)</span>}
                </label>
                <input
                  type="text"
                  placeholder="Ej: 1"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontWeight: 'bold' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Fecha Emisión *</label>
                <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }} />
              </div>
              {!esCobranza && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Fecha Vencimiento</label>
                  <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            {/* APLICACIÓN / IMPUTACIÓN DE FACTURAS EN COBRANZAS */}
            {esCobranza && clienteId && facturasPendientes.length > 0 && (
              <div style={{ backgroundColor: '#fff8f0', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#c2410c' }}>📌 Seleccionar Facturas a Cancelar / Imputar:</span>
                <div style={{ marginTop: '0.5rem', maxHeight: '140px', overflowY: 'auto' }}>
                  {facturasPendientes.map((f) => {
                    const saldo = f.saldo_pendiente === null ? f.debe : f.saldo_pendiente;
                    const estaSeleccionada = facturasSeleccionadas[f.id] !== undefined;

                    return (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid #ffedd5', fontSize: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={estaSeleccionada} onChange={() => toggleFacturaSeleccionada(f)} style={{ accentColor: '#15803d' }} />
                          <span style={{ fontWeight: 'bold' }}>{f.tipo} #{f.numero || 'S/N'}</span>
                          <span style={{ color: '#78716c' }}>({f.fecha_emision})</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Saldo: ${parseFloat(saldo).toLocaleString('es-AR')}</span>
                          {estaSeleccionada && (
                            <input
                              type="number"
                              step="0.01"
                              value={facturasSeleccionadas[f.id]}
                              onChange={(e) => cambiarMontoCancelacion(f.id, e.target.value)}
                              style={{ width: '85px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontWeight: 'bold', fontSize: '0.75rem' }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!esCobranza && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Importe ($) *</label>
                <input type="number" step="0.01" placeholder="0.00" value={montoFactura} onChange={(e) => setMontoFactura(e.target.value)} required style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', fontSize: '1.1rem', fontWeight: 'bold', boxSizing: 'border-box' }} />
              </div>
            )}

            {/* SECCIÓN DE MEDIOS DE PAGO CON LECTURA BCRA OFICIAL */}
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

                {mediosPago.map((m) => {
                  const esCheque = m.metodo === 'CHEQUE_FISICO' || m.metodo === 'ECHEQ';
                  const cuitLimpio = String(m.cuit_emisor || '').replace(/\D/g, '');
                  const infoBcra = bcraStatusMap[cuitLimpio];

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
                          <input type="number" step="0.01" placeholder="0.00" value={m.monto} onChange={(e) => actualizarMedio(m.id, 'monto', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', fontWeight: 'bold', boxSizing: 'border-box' }} />
                        </div>
                        {esCheque && (
                          <>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>N° Cheque (8 dígs.)</label>
                              <input type="text" maxLength={8} placeholder="12345678" value={m.numero} onChange={(e) => actualizarMedio(m.id, 'numero', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>Banco</label>
                              <input type="text" placeholder="Ej: Galicia" value={m.banco} onChange={(e) => actualizarMedio(m.id, 'banco', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
                            </div>
                          </>
                        )}
                      </div>

                      {esCheque && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>CUIT Librador</label>
                              <input
                                type="text"
                                placeholder="30-12345678-9"
                                value={m.cuit_emisor}
                                onChange={(e) => actualizarMedio(m.id, 'cuit_emisor', e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem',
                                  borderRadius: '4px',
                                  border: cuitLimpio.length === 11 ? `1px solid ${infoBcra?.border || '#15803d'}` : '1px solid #dcd5c9',
                                  backgroundColor: cuitLimpio.length === 11 ? (infoBcra?.bg || '#f0fdf4') : '#fff',
                                  boxSizing: 'border-box',
                                  fontWeight: 'bold'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'bold' }}>F. Emisión</label>
                              <input type="date" value={m.fecha_emision} onChange={(e) => actualizarMedio(m.id, 'fecha_emision', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 'bold' }}>F. Cobro (Venc.)</label>
                              <input type="date" value={m.fecha_pago} onChange={(e) => actualizarMedio(m.id, 'fecha_pago', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
                            </div>
                          </div>

                          {/* CARTEL AUTOMÁTICO DE DIAGNÓSTICO DE RIESGO BCRA */}
                          {cuitLimpio.length === 11 && (
                            <div 
                              onClick={() => {
                                if (infoBcra?.esFallback) window.open('https://www.lamacro.ar/central-de-deudores/', '_blank');
                              }}
                              style={{
                                marginTop: '0.4rem',
                                padding: '0.45rem 0.65rem',
                                borderRadius: '5px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: infoBcra?.cargando ? '#f5f2eb' : (infoBcra?.bg || '#f0fdf4'),
                                color: infoBcra?.cargando ? '#78716c' : (infoBcra?.color || '#15803d'),
                                border: `1px solid ${infoBcra?.border || '#dcd5c9'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: infoBcra?.esFallback ? 'pointer' : 'default'
                              }}
                            >
                              {infoBcra?.cargando ? (
                                <span>⏳ Verificando situación en Central de Deudores BCRA...</span>
                              ) : (
                                <span>{infoBcra?.texto || '🟢 Situación 1: Normal (Sin deudas ni moras)'}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #dcd5c9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#44403c' }}>Total Recibo:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#15803d' }}>$ {totalCobranza.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Observaciones</label>
              <textarea rows={2} placeholder="Notas adicionales..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
              <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button type="submit" disabled={guardando} style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                {guardando ? '💾 Guardando...' : '💾 Registrar Comprobante'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalReciboPDF
        mostrar={Boolean(reciboGenerado)}
        onClose={() => {
          setReciboGenerado(null);
          onClose();
        }}
        reciboData={reciboGenerado}
      />
    </>
  );

  return createPortal(modalUI, document.body);
}
