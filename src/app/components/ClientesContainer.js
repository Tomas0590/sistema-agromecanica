'use client';

import { useState, useEffect } from 'react';

export default function ClientesContainer({ supabase }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenColumna, setOrdenColumna] = useState('razon_social');
  const [ordenAsc, setOrdenAsc] = useState(true);

  // Cargas masivas
  const [cargandoBCRA, setCargandoBCRA] = useState(false);
  const [cargandoNombres, setCargandoNombres] = useState(false);
  const [buscandoCuitApi, setBuscandoCuitApi] = useState(false);

  // Formulario de alta
  const [razonSocial, setRazonSocial] = useState('');
  const [cuitDni, setCuitDni] = useState('');
  const [condicionIva, setCondicionIva] = useState('Responsable Inscripto');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeForm, setMensajeForm] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true });

    if (error) {
      console.error('Error al consultar clientes en Supabase:', error.message);
    } else if (data) {
      setClientes(data);
    }
  };

  // AUTOCOMPLETAR DESDE PADRÓN AL INGRESAR CUIT (11 DÍGITOS)
  const buscarCuitEnPadron = async (cuitIngresado) => {
    const cuitLimpio = cuitIngresado.replace(/\D/g, '');
    if (cuitLimpio.length !== 11) return;

    setBuscandoCuitApi(true);
    try {
      const res = await fetch(`https://afip.sstack.app/api/v1/cuit/${cuitLimpio}`);
      if (res.ok) {
        const data = await res.json();
        const nombreEncontrado = data.razonSocial || data.nombre;
        if (nombreEncontrado) setRazonSocial(nombreEncontrado);
        if (data.condicionIva) setCondicionIva(data.condicionIva);
        if (data.domicilio) setDireccion(data.domicilio);
      }
    } catch (err) {
      console.log('No se pudo autocompletar CUIT:', err);
    } finally {
      setBuscandoCuitApi(false);
    }
  };

  const handleCuitChange = (e) => {
    const val = e.target.value;
    setCuitDni(val);
    const soloNumeros = val.replace(/\D/g, '');
    if (soloNumeros.length === 11) {
      buscarCuitEnPadron(soloNumeros);
    }
  };

  // BOTÓN MASIVO: AUTOCOMPLETAR NOMBRES PENDIENTES
  const autocompletarNombresPendientes = async () => {
    setCargandoNombres(true);
    const pendientes = clientes.filter((c) => {
      const valorCuit = (c.cuit_dni || c.cuit || '').replace(/\D/g, '');
      const sinNombre = !c.razon_social || c.razon_social.trim() === '' || c.razon_social.includes('PENDIENTE');
      return sinNombre && valorCuit.length === 11;
    });

    if (pendientes.length === 0) {
      alert('No hay clientes pendientes de nombre que tengan un CUIT de 11 dígitos.');
      setCargandoNombres(false);
      return;
    }

    let actualizados = 0;
    for (const cli of pendientes) {
      const cuitLimpio = (cli.cuit_dni || cli.cuit).replace(/\D/g, '');
      try {
        const res = await fetch(`https://afip.sstack.app/api/v1/cuit/${cuitLimpio}`);
        if (res.ok) {
          const data = await res.json();
          const nombreEncontrado = data.razonSocial || data.nombre;
          if (nombreEncontrado) {
            await supabase
              .from('clientes')
              .update({
                razon_social: nombreEncontrado,
                condicion_iva: data.condicionIva || cli.condicion_iva
              })
              .eq('id', cli.id);
            actualizados++;
          }
        }
      } catch (e) {
        console.error(`Error procesando CUIT ${cuitLimpio}:`, e);
      }
    }

    setCargandoNombres(false);
    alert(`Proceso finalizado. Se actualizaron ${actualizados} clientes.`);
    cargarClientes();
  };

  // BOTÓN MASIVO: CONSULTAR BCRA
  const corroborarBCRAMasivamente = async () => {
    setCargandoBCRA(true);
    const conCuit = clientes.filter((c) => {
      const val = (c.cuit_dni || c.cuit || '').replace(/\D/g, '');
      return val.length === 11;
    });

    if (conCuit.length === 0) {
      alert('No se encontraron clientes con CUIT válido para evaluar en el BCRA.');
      setCargandoBCRA(false);
      return;
    }

    let evaluados = 0;
    for (const cli of conCuit) {
      const cuitLimpio = (cli.cuit_dni || cli.cuit).replace(/\D/g, '');
      try {
        const res = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitLimpio}`);
        if (res.ok) {
          const data = await res.json();
          let peorSituacion = 1;
          if (data.results && data.results.periodos && data.results.periodos.length > 0) {
            const deudas = data.results.periodos[0].entidades || [];
            deudas.forEach((e) => {
              if (e.situacion > peorSituacion) peorSituacion = e.situacion;
            });
          }
          await supabase.from('clientes').update({ situacion_bcra: peorSituacion }).eq('id', cli.id);
          evaluados++;
        }
      } catch (e) {
        console.error(`Error consultando BCRA CUIT ${cuitLimpio}:`, e);
      }
    }

    setCargandoBCRA(false);
    alert(`Evaluación BCRA finalizada. Se procesaron ${evaluados} clientes.`);
    cargarClientes();
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    setMensajeForm('');

    if (!razonSocial.trim()) {
      setMensajeForm('La Razón Social es obligatoria.');
      return;
    }

    const valorCuit = cuitDni.trim() || null;

    const payload = {
      razon_social: razonSocial.trim(),
      cuit_dni: valorCuit,
      cuit: valorCuit,
      condicion_iva: condicionIva,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      direccion: direccion.trim() || null
    };

    const { error } = await supabase.from('clientes').insert([payload]);

    if (error) {
      setMensajeForm(`Error al guardar: ${error.message}`);
    } else {
      setRazonSocial('');
      setCuitDni('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      setMostrarModal(false);
      cargarClientes();
    }
  };

  const borrarCliente = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) cargarClientes();
  };

  const cambiarOrden = (columna) => {
    if (ordenColumna === columna) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenColumna(columna);
      setOrdenAsc(true);
    }
  };

  const clientesFiltrados = clientes
    .filter((c) => {
      const termino = busqueda.toLowerCase();
      const valorCuit = c.cuit_dni || c.cuit || '';
      return (
        (c.razon_social || '').toLowerCase().includes(termino) ||
        valorCuit.includes(termino) ||
        (c.direccion || '').toLowerCase().includes(termino) ||
        (c.telefono || '').toLowerCase().includes(termino)
      );
    })
    .sort((a, b) => {
      let valA = a[ordenColumna] || '';
      let valB = b[ordenColumna] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return ordenAsc ? -1 : 1;
      if (valA > valB) return ordenAsc ? 1 : -1;
      return 0;
    });

  return (
    <div>
      {/* CABECERA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Gestión de Clientes y Cuentas Corrientes
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Base de datos de clientes, CUITs y consulta de riesgo crediticio BCRA
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={autocompletarNombresPendientes}
            disabled={cargandoNombres}
            style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: cargandoNombres ? 0.7 : 1 }}
          >
            {cargandoNombres ? '⏳ Procesando...' : '⚡ Autocompletar Nombres Pendientes'}
          </button>

          <button 
            onClick={corroborarBCRAMasivamente}
            disabled={cargandoBCRA}
            style={{ background: '#d97706', color: '#fff', border: 'none', padding: '0.55rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', opacity: cargandoBCRA ? 0.7 : 1 }}
          >
            {cargandoBCRA ? '⏳ Consultando BCRA...' : '🔍 Corroborar BCRA Masivamente'}
          </button>

          <button 
            onClick={() => { setMensajeForm(''); setMostrarModal(true); }}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Nuevo Cliente
          </button>
        </div>
      </div>

      {/* CONTENEDOR CÁLIDO */}
      <div style={{ backgroundColor: '#fcfbf9', borderRadius: '10px', border: '1px solid #e5e0d8', boxShadow: '0 2px 5px rgba(0,0,0,0.03)', padding: '1.25rem' }}>
        
        {/* BUSCADOR Y CONTADOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por Razón Social, CUIT, Dirección, Teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: 1, maxWidth: '480px', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid #dcd5c9', backgroundColor: '#f5f2eb', color: '#2b2927', fontSize: '0.875rem' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#78716c', fontWeight: '600' }}>
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </span>
        </div>

        {/* TABLA */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#eeeae1', borderBottom: '2px solid #e2ddd3', color: '#57534e' }}>
                <th onClick={() => cambiarOrden('razon_social')} style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}>
                  Razón Social {ordenColumna === 'razon_social' ? (ordenAsc ? '▲' : '▼') : '⇅'}
                </th>
                <th style={{ padding: '0.75rem 1rem' }}>CUIT / DNI</th>
                <th style={{ padding: '0.75rem 1rem' }}>Cond. IVA</th>
                <th style={{ padding: '0.75rem 1rem' }}>Contacto / Dirección</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Sit. BCRA</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Consulta La Macro</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: '#a8a29e' }}>
                    No se encontraron clientes en el sistema.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const valorCuit = c.cuit_dni || c.cuit || '';
                  const sitBcra = c.situacion_bcra || 1;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0ebe1' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: '#1c1917' }}>
                        {c.razon_social}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#44403c', fontFamily: 'monospace' }}>
                        {valorCuit || '-'}
                      </td>
                      <td
