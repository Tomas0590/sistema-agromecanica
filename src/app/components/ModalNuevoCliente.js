'use client';

import { useState } from 'react';
import { consultarBCRACuit } from '../services/bcraService';

export default function ModalNuevoCliente({
  mostrar,
  onClose,
  supabase,
  onClienteCreado,
  setSituacionesMap
}) {
  const [cuitDni, setCuitDni] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [buscandoPadron, setBuscandoPadron] = useState(false);
  const [sitBcraLeida, setSitBcraLeida] = useState(null);
  const [errorBcra, setErrorBcra] = useState(false);
  const [mensajeForm, setMensajeForm] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!mostrar) return null;

  const handleCuitChange = async (e) => {
    const val = e.target.value;
    setCuitDni(val);
    const cuitLimpio = val.replace(/\D/g, '');

    if (cuitLimpio.length === 11) {
      setBuscandoPadron(true);
      setErrorBcra(false);
      setSitBcraLeida(null);

      try {
        const [resAfip, sitBcra] = await Promise.all([
          fetch(`https://afip.republica.dev/cuit/${cuitLimpio}`).catch(() => null),
          consultarBCRACuit(cuitLimpio)
        ]);

        if (resAfip && resAfip.ok) {
          const dataAfip = await resAfip.json();
          const nombreEncontrado = dataAfip.razon_social || dataAfip.nombre || dataAfip.razonSocial;
          if (nombreEncontrado) setRazonSocial(nombreEncontrado);
          if (dataAfip.condicion_iva) setCondicionIva(dataAfip.condicion_iva);
          if (dataAfip.domicilio) setDireccion(dataAfip.domicilio);
        }

        if (sitBcra !== null) {
          setSitBcraLeida(sitBcra);
        } else {
          setErrorBcra(true);
        }
      } catch (err) {
        console.error('Error al autocompletar:', err);
        setErrorBcra(true);
      } finally {
        setBuscandoPadron(false);
      }
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setMensajeForm('');

    if (!razonSocial.trim()) {
      setMensajeForm('La Razón Social es obligatoria.');
      return;
    }

    setGuardando(true);
    const valorCuit = cuitDni.trim() || null;

    const payload = {
      razon_social: razonSocial.trim(),
      cuit_dni: valorCuit,
      cuit: valorCuit,
      condicion_iva: condicionIva,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      direccion: direccion.trim() || null,
      observaciones: observaciones.trim() || null
    };

    const { data, error } = await supabase.from('clientes').insert([payload]).select();

    setGuardando(false);

    if (error) {
      setMensajeForm(`Error al guardar: ${error.message}`);
    } else {
      if (data?.[0]?.id && sitBcraLeida !== null) {
        setSituacionesMap((prev) => ({ ...prev, [data[0].id]: sitBcraLeida }));
      }

      setCuitDni(''); setRazonSocial(''); setTelefono(''); setEmail('');
      setDireccion(''); setObservaciones(''); setSitBcraLeida(null); setErrorBcra(false);
      onClienteCreado();
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fcfbf9', border: '1px solid #e5e0d8', borderRadius: '14px', width: '100%', maxWidth: '560px', padding: '1.75rem', color: '#2b2927', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '2px solid #eeeae1', paddingBottom: '0.85rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#dc2626', fontSize: '1.25rem', fontWeight: '800' }}>➕ Cargar Nuevo Cliente</h3>
            <span style={{ fontSize: '0.8rem', color: '#78716c' }}>Ingresá el CUIT para autocompletar la información</span>
          </div>
          <button onClick={onClose} style={{ background: '#eeeae1', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#57534e' }}>✕</button>
        </div>

        {mensajeForm && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {mensajeForm}
          </div>
        )}

        <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
              CUIT / DNI
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Ej: 20422937634 (Autocompleta con 11 dígitos)"
                value={cuitDni}
                onChange={handleCuitChange}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
              />
              {buscandoPadron && (
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#0284c7', fontWeight: 'bold' }}>
                  ⏳ Leyendo AFIP y BCRA...
                </span>
              )}
            </div>
          </div>

          {cuitDni.replace(/\D/g, '').length === 11 && (
            <div style={{ backgroundColor: '#f5f2eb', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e5e0d8', fontSize: '0.8rem' }}>
              {sitBcraLeida !== null ? (
                <span style={{ color: sitBcraLeida === 1 ? '#166534' : '#dc2626', fontWeight: 'bold' }}>
                  {sitBcraLeida === 1 ? '✅ Situación BCRA: Sit. 1 Normal' : `⚠️ Situación BCRA: Sit. ${sitBcraLeida} Alerta`}
                </span>
              ) : errorBcra ? (
                <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                  ⚠️ No se pudo leer la situación bancaria en el BCRA. Se mantendrá en Sit. 1 por defecto.
                </span>
              ) : (
                <span style={{ color: '#78716c' }}>Verificando historial en Central de Deudores BCRA...</span>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Razón Social *</label>
            <input
              type="text"
              placeholder="Se autocompleta con el CUIT o ingresala manualmente"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Condición IVA</label>
              <select
                value={condicionIva}
                onChange={(e) => setCondicionIva(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="Consumidor Final">Consumidor Final</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Dirección / Localidad</label>
              <input
                type="text"
                placeholder="Ej: Carhué"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Teléfono</label>
              <input
                type="text"
                placeholder="Ej: 2936414244"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>Email</label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#57534e', marginBottom: '0.2rem' }}>
              Comentarios / Observaciones Extra
            </label>
            <textarea
              rows={2}
              placeholder="Notas importantes, condiciones especiales de pago, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#fff', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', borderTop: '1px solid #eeeae1', paddingTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ padding: '0.55rem 1.1rem', borderRadius: '6px', border: '1px solid #dcd5c9', background: '#eeeae1', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancelar
            </button>
            <button type="submit" disabled={guardando} style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {guardando ? '💾 Guardando...' : '💾 Guardar Cliente'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
