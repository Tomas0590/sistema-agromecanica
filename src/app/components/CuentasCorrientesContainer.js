'use client';

import { useState, useEffect } from 'react';
import ModalComprobante from './ModalComprobante'; // 👈 Importamos el nuevo modal

export default function CuentasCorrientesContainer({ supabase }) {
  const [saldosClientes, setSaldosClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [soloDeudores, setSoloDeudores] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false); // 👈 Estado para el modal

  useEffect(() => {
    cargarSaldos();
  }, []);

  const cargarSaldos = async () => {
    setCargando(true);
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
    } finally {
      setCargando(false);
    }
  };

  // ... (el resto del filtrado y tarjetas se mantiene igual)

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Cuentas Corrientes y Estado de Deudores
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Control de saldos, facturación, cobranzas y estado de deuda de Agromecanica
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setMostrarModalNuevo(true)} // 👈 Abrir modal
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Cargar Comprobante / Cobranza
          </button>
        </div>
      </div>

      {/* ... TABLA DE SALDOS ... */}

      {/* MODAL NUEVO COMPROBANTE */}
      <ModalComprobante
        mostrar={mostrarModalNuevo}
        onClose={() => setMostrarModalNuevo(false)}
        supabase={supabase}
        clientes={saldosClientes}
        onGuardado={cargarSaldos}
      />
    </div>
  );
}
