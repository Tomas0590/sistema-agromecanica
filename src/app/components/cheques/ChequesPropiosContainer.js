'use client';

import { useState, useEffect } from 'react';

export default function ChequesPropiosContainer({ supabase, proveedores = [] }) {
  const [cheques, setCheques] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE'); // 'PENDIENTE' | 'PROXIMOS_5' | 'DEBITADO' | 'TODOS'
  const [filtroFormato, setFiltroFormato] = useState('TODOS'); // 'TODOS' | 'ECHEQ' | 'FISICO'

  // Formulario de carga / edición
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const hoyISO = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    formato: 'ECHEQ',
    banco: '',
    numero: '',
    beneficiario: '',
    fecha_emision: hoyISO,
    fecha_pago: '',
    monto: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarCheques();
  }, []);

  // Formato DD-MM-AAAA
  const formatearFechaARG = (fechaStr) => {
    if (!fechaStr) return '-';
    const limpia = String(fechaStr).split('T')[0];
    const partes = limpia.split('-');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return fechaStr;
  };

  // Calcula días restantes hasta la fecha de débito en banco
  const evaluarVencimientoBanco = (cheque) => {
    if (cheque.estado !== 'PENDIENTE') {
      return { alerta5Dias: false, diasRestantes: null, etiqueta: cheque.estado, nivel: 'NEUTRO' };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaPago = new Date(`${cheque.fecha_pago}T00:00:00`);
    const diffDias = Math.round((fechaPago - hoy) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) {
      return {
        alerta5Dias: true,
        diasRestantes: diffDias,
        etiqueta: `🚨 VENCIDO HACE ${Math.abs(diffDias)}d (Sin debitar)`,
        nivel: 'CRITICO'
      };
    }
    if (diffDias === 0) {
      return {
        alerta5Dias: true,
        diasRestantes: 0,
        etiqueta: '🔴 SE DEBITA HOY',
        nivel: 'CRITICO'
      };
    }
    if (diffDias === 1) {
      return {
        alerta5Dias: true,
        diasRestantes: 1,
        etiqueta: '🟠 SE DEBITA MAÑANA',
        nivel: 'ALERTA'
      };
    }
    if (diffDias <= 5) {
      return {
        alerta5Dias: true,
        diasRestantes: diffDias,
        etiqueta: `⚠️ EN ${diffDias} DÍAS (Cubrir banco)`,
        nivel: 'ALERTA'
      };
    }

    return {
      alerta5Dias: false,
      diasRestantes: diffDias,
      etiqueta: `Faltan ${diffDias} días`,
      nivel: 'OK'
    };
  };

  const cargarCheques = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('cheques_propios')
        .select('*')
        .order('fecha_pago', { ascending: true });

      if (!error && data) {
        setCheques(data);
      }
    } catch (e) {
      console.error('Error cargando cheques propios:', e);
    } finally {
      setCargando(false);
    }
  };

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm({
      formato: 'ECHEQ',
      banco: '',
      numero: '',
      beneficiario: '',
      fecha_emision: hoyISO,
      fecha_pago: '',
      monto: '',
      observaciones: ''
    });
    setMostrarForm(true);
  };

  const abrirEdicion = (ch) => {
    setEditandoId(ch.id);
    setForm({
      formato: ch.formato || 'ECHEQ',
      banco: ch.banco || '',
      numero: ch.numero || '',
      beneficiario: ch.beneficiario || '',
      fecha_emision: ch.fecha_emision || hoyISO,
      fecha_pago: ch.fecha_pago || '',
      monto: ch.monto || '',
      observaciones: ch.observaciones || ''
    });
    setMostrarForm(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.banco.trim() || !form.numero.trim() || !form.beneficiario.trim() || !form.fecha_pago || !form.monto) {
      alert('Completá Banco, Número, Beneficiario, Fecha de Pago y Monto.');
      return;
    }

    setGuardando(true);
    const payload = {
      formato: form.formato,
      banco: form.banco.trim(),
      numero: form.numero.trim(),
      beneficiario: form.beneficiario.trim(),
      fecha_emision: form.fecha_emision || hoyISO,
      fecha_pago: form.fecha_pago,
      monto: parseFloat(form.monto) || 0,
      observaciones: form.observaciones?.trim() || null
    };

    let error;
    if (editandoId) {
      ({ error } = await supabase.from('cheques_propios').update(payload).eq('id', editandoId));
    } else {
      ({ error } = await supabase.from('cheques_propios').insert([{ ...payload, estado: 'PENDIENTE' }]));
    }

    setGuardando(false);
    if (error) {
      alert(`Error al guardar cheque: ${error.message}`);
    } else {
      setMostrarForm(false);
      setEditandoId(null);
      await cargarCheques();
    }
  };

  const cambiarEstado = async (ch, nuevoEstado) => {
    const { error } = await supabase
      .from('cheques_propios')
      .update({ estado: nuevoEstado })
      .eq('id', ch.id);

    if (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    } else {
      await cargarCheques();
    }
  };

  const handleEliminar = async (ch) => {
    if (!confirm(`¿Eliminar el ${ch.formato === 'ECHEQ' ? 'eCheq' : 'Cheque'} #${ch.numero} de ${ch.beneficiario}?`)) {
      return;
    }
    const { error } = await supabase.from('cheques_propios').delete().eq('id', ch.id);
    if (!error) await cargarCheques();
  };

  // Cálculos de cobertura bancaria
  const chequesConAlerta = cheques.filter((c) => evaluarVencimientoBanco(c).alerta5Dias);
  const montoACubrir5Dias = chequesConAlerta.reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);

  const totalPendienteGeneral = cheques
    .filter((c) => c.estado === 'PENDIENTE')
    .reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);

  const mesActualPrefix = hoyISO.slice(0, 7); // YYYY-MM
  const totalDebitadoMes = cheques
    .filter((c) => c.estado === 'DEBITADO' && String(c.fecha_pago || '').startsWith(mesActualPrefix))
    .reduce((acc, c) => acc + parseFloat(c.monto || 0), 0);

  // Filtrado de tabla
  const chequesFiltrados = cheques.filter((ch) => {
    const info = evaluarVencimientoBanco(ch);

    if (filtroEstado === 'PENDIENTE' && ch.estado !== 'PENDIENTE') return false;
    if (filtroEstado === 'PROXIMOS_5' && !info.alerta5Dias) return false;
    if (filtroEstado === 'DEBITADO' && ch.estado !== 'DEBITADO') return false;

    if (filtroFormato !== 'TODOS' && ch.formato !== filtroFormato) return false;

    const q = busqueda.toLowerCase();
    if (q) {
      const match =
        (ch.beneficiario || '').toLowerCase().includes(q) ||
        (ch.banco || '').toLowerCase().includes(q) ||
        (ch.numero || '').toLowerCase().includes(q) ||
        (ch.observaciones || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Cheques y eCheqs Propios Emitidos
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Control de vencimientos bancarios propios y alerta de cobertura a 5 días
          </span>
        </div>

        <button
          onClick={abrirNuevo}
          style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          ➕ Registrar Cheque / eCheq Propio
        </button>
      </div>

      {/* BANNER DE ALERTA DE COBERTURA BANCARIA (≤ 5 DÍAS) */}
      {chequesConAlerta.length > 0 && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '2px solid #f87171',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ fontWeight: '900', color: '#b91c1c', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
              🚨 ALERTA DE COBERTURA BANCARIA (Próximos 5 días)
            </div>
            <div style={{ fontSize: '0.83rem', color: '#7f1d1d' }}>
              Tenés <strong>{chequesConAlerta.length}</strong> {chequesConAlerta.length === 1 ? 'valor emitido próximo a debitarse' : 'valores emitidos próximos a debitarse'} por un total de{' '}
              <strong>$ {montoACubrir5Dias.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>.
            </div>
          </div>

          <button
            onClick={() => setFiltroEstado('PROXIMOS_5')}
            style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 0.9rem',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Ver los {chequesConAlerta.length} a cubrir
          </button>
        </div>
      )}

      {/* TARJETAS RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: chequesConAlerta.length > 0 ? '#fff5f5' : '#fcfbf9', border: `1px solid ${chequesConAlerta.length > 0 ? '#fca5a5' : '#e5e0d8'}`, borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 'bold', textTransform: 'uppercase' }}>
            ⚠️ A Cubrir en ≤ 5 Días ({chequesConAlerta.length})
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#dc2626', marginTop: '0.25rem' }}>
            $ {montoACubrir5Dias.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Total Cartera Emitida Pendiente
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#2b2927', marginTop: '0.25rem' }}>
            $ {totalPendienteGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ backgroundColor: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Debitados este Mes
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#15803d', marginTop: '0.25rem' }}>
            $ {totalDebitadoMes.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* FORMULARIO DESPLEGABLE DE ALTA / EDICIÓN */}
      {mostrarForm && (
        <form
          onSubmit={handleGuardar}
          style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fde047',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontWeight: '800', color: '#1c1917', marginBottom: '1rem', fontSize: '0.95rem' }}>
            {editandoId ? '✏️ Editar Cheque / eCheq Propio' : '➕ Nuevo Cheque / eCheq Propio Emitido'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Tipo de Valor *</label>
              <select
                value={form.formato}
                onChange={(e) => setForm({ ...form, formato: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', backgroundColor: '#fff' }}
              >
                <option value="ECHEQ">💻 eCheq</option>
                <option value="FISICO">📄 Cheque Físico</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Banco Emisor *</label>
              <input
                type="text"
                placeholder="Ej: Banco Nación, Galicia..."
                value={form.banco}
                onChange={(e) => setForm({ ...form, banco: e.target.value })}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>N° Cheque / eCheq *</label>
              <input
                type="text"
                placeholder="Ej: 45892103"
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Beneficiario / Proveedor *</label>
              <input
                type="text"
                list="lista-proveedores-cheque"
                placeholder="A la orden de..."
                value={form.beneficiario}
                onChange={(e) => setForm({ ...form, beneficiario: e.target.value })}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9' }}
              />
              {proveedores.length > 0 && (
                <datalist id="lista-proveedores-cheque">
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.razon_social || p.nombre} />
                  ))}
                </datalist>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Fecha Emisión</label>
              <input
                type="date"
                value={form.fecha_emision}
                onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.25rem' }}>Fecha de Pago / Débito *</label>
              <input
                type="date"
                value={form.fecha_pago}
                onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #fca5a5' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Importe ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', fontWeight: 'bold' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Detalle / Factura asociada</label>
              <input
                type="text"
                placeholder="Opcional"
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dcd5c9', backgroundColor: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{ padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', backgroundColor: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {guardando ? 'Guardando...' : '✓ Guardar Valor'}
            </button>
          </div>
        </form>
      )}

      {/* CONTENEDOR DE TABLA Y FILTROS */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Beneficiario, Banco o N°..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, maxWidth: '340px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb' }}
          />

          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { id: 'PENDIENTE', label: '⏳ Pendientes' },
              { id: 'PROXIMOS_5', label: `🚨 Próximos 5 días (${chequesConAlerta.length})` },
              { id: 'DEBITADO', label: '✓ Debitados' },
              { id: 'TODOS', label: 'Todos' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFiltroEstado(tab.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: filtroEstado === tab.id ? (tab.id === 'PROXIMOS_5' ? '#dc2626' : '#15803d') : '#eeeae1',
                  color: filtroEstado === tab.id ? '#fff' : '#44403c',
                  fontWeight: 'bold',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}

            <select
              value={filtroFormato}
              onChange={(e) => setFiltroFormato(e.target.value)}
              style={{ padding: '0.4rem 0.65rem', borderRadius: '6px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb', fontSize: '0.78rem', fontWeight: 'bold' }}
            >
              <option value="TODOS">Todos los formatos</option>
              <option value="ECHEQ">Solo eCheqs</option>
              <option value="FISICO">Solo Físicos</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', color: '#44403c', borderBottom: '2px solid #dcd5c9' }}>
                <th style={{ padding: '0.75rem' }}>Fecha Débito</th>
                <th style={{ padding: '0.75rem' }}>Alerta Banco</th>
                <th style={{ padding: '0.75rem' }}>Tipo / Banco / N°</th>
                <th style={{ padding: '0.75rem' }}>Beneficiario / Detalle</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Importe</th>
                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    ⏳ Cargando cheques y eCheqs propios...
                  </td>
                </tr>
              ) : chequesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#78716c' }}>
                    No hay cheques propios registrados para este filtro.
                  </td>
                </tr>
              ) : (
                chequesFiltrados.map((ch) => {
                  const info = evaluarVencimientoBanco(ch);
                  const esCritico = info.nivel === 'CRITICO';
                  const esAlerta = info.nivel === 'ALERTA';

                  return (
                    <tr
                      key={ch.id}
                      style={{
                        borderBottom: '1px solid #eeeae1',
                        backgroundColor: esCritico ? '#fff1f2' : esAlerta ? '#fffbeb' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.75rem', fontWeight: '800', whiteSpace: 'nowrap', color: esCritico ? '#dc2626' : '#1c1917' }}>
                        {formatearFechaARG(ch.fecha_pago)}
                        <div style={{ fontSize: '0.7rem', color: '#78716c', fontWeight: 'normal' }}>
                          Emisión: {formatearFechaARG(ch.fecha_emision)}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {ch.estado === 'DEBITADO' ? (
                          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '800', fontSize: '0.72rem' }}>
                            ✓ DEBITADO
                          </span>
                        ) : ch.estado === 'ANULADO' ? (
                          <span style={{ backgroundColor: '#f5f5f4', color: '#78716c', border: '1px solid #d6d3d1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.72rem' }}>
                            ✕ ANULADO
                          </span>
                        ) : (
                          <span
                            style={{
                              backgroundColor: esCritico ? '#fee2e2' : esAlerta ? '#ffedd5' : '#f5f5f4',
                              color: esCritico ? '#dc2626' : esAlerta ? '#c2410c' : '#57534e',
                              border: `1px solid ${esCritico ? '#fca5a5' : esAlerta ? '#fdba74' : '#e7e5e4'}`,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: '800',
                              fontSize: '0.72rem'
                            }}
                          >
                            {info.etiqueta}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: ch.formato === 'ECHEQ' ? '#e0f2fe' : '#f3e8ff',
                            color: ch.formato === 'ECHEQ' ? '#0369a1' : '#6b21a8',
                            marginRight: '0.4rem'
                          }}
                        >
                          {ch.formato === 'ECHEQ' ? '💻 eCheq' : '📄 Físico'}
                        </span>
                        <strong>{ch.banco}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#57534e', marginTop: '0.15rem' }}>
                          N° {ch.numero}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold', color: '#1c1917' }}>{ch.beneficiario}</div>
                        {ch.observaciones && (
                          <div style={{ fontSize: '0.75rem', color: '#78716c' }}>{ch.observaciones}</div>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '900', fontSize: '0.92rem', whiteSpace: 'nowrap', color: esCritico ? '#dc2626' : '#1c1917' }}>
                        $ {parseFloat(ch.monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ padding: '0.75rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                          {ch.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => cambiarEstado(ch, 'DEBITADO')}
                              title="Marcar como debitado en el banco"
                              style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.3rem 0.55rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 'bold' }}
                            >
                              ✓ Debitado
                            </button>
                          )}
                          {ch.estado === 'DEBITADO' && (
                            <button
                              onClick={() => cambiarEstado(ch, 'PENDIENTE')}
                              title="Volver a pendiente"
                              style={{ background: '#eeeae1', color: '#44403c', border: 'none', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}
                            >
                              ↩️
                            </button>
                          )}
                          <button
                            onClick={() => abrirEdicion(ch)}
                            title="Editar"
                            style={{ background: '#f5f2eb', border: '1px solid #dcd5c9', padding: '0.3rem 0.45rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleEliminar(ch)}
                            title="Eliminar"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.3rem 0.45rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
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
      </div>
    </div>
  );
}
