'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalProveedor({ mostrar, onClose, supabase, onGuardado = () => {} }) {
  const [razonSocial, setRazonSocial] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [monedaDefecto, setMonedaDefecto] = useState('ARS');
  const [guardando, setGuardando] = useState(false);

  if (!mostrar) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);

    const cuitLimpio = cuit.replace(/\D/g, '');

    const { error } = await supabase.from('proveedores').insert({
      razon_social: razonSocial.trim(),
      cuit: cuitLimpio || null,
      telefono: telefono || null,
      email: email || null,
      moneda_defecto: monedaDefecto
    });

    setGuardando(false);

    if (error) {
      alert(`Error al guardar proveedor: ${error.message}`);
    } else {
      setRazonSocial('');
      setCuit('');
      setTelefono('');
      setEmail('');
      onGuardado();
      onClose();
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '12px', width: '92%', maxWidth: '480px', padding: '1.5rem', color: '#2b2927', boxShadow: '0 10px 25px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eeeae1', paddingBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#15803d', fontSize: '1.15rem', fontWeight: '800' }}>🏭 Nuevo Proveedor / Fábrica</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social / Firma *</label>
            <input type="text" placeholder="Ej: Arag Argentina S.A." value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>CUIT / CUIL</label>
              <input type="text" placeholder="30123456789" value={cuit} onChange={(e) => setCuit(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Moneda por Defecto</label>
              <select value={monedaDefecto} onChange={(e) => setMonedaDefecto(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff' }}>
                <option value="ARS">🇦🇷 Pesos (ARS)</option>
                <option value="USD">🇺🇸 Dólares (USD)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Teléfono</label>
              <input type="text" placeholder="2923..." value={telefono} onChange={(e) => setTelefono(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Email</label>
              <input type="email" placeholder="ventas@proveedor.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #dcd5c9', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #eeeae1', paddingTop: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
            <button type="submit" disabled={guardando} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {guardando ? '💾 Guardando...' : '💾 Guardar Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
