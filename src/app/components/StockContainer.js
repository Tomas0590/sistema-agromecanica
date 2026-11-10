'use client';

import { useState, useEffect } from 'react';
import FormProducto from './FormProducto';
import TablaStock from './TablaStock';
import ModalCategorias from './ModalCategorias';

export default function StockContainer({ supabase }) {
  const [productos, setProductos] = useState([]);
  const [categoriasLista, setCategoriasLista] = useState([]);

  // Cotización Dólar Venta Billete BNA
  const [cotizacionBna, setCotizacionBna] = useState(1200);
  const [cargandoDolar, setCargandoDolar] = useState(true);

  const [editingProductoId, setEditingProductoId] = useState(null);
  const [sku, setSku] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [precioCosto, setPrecioCosto] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [precioUsd, setPrecioUsd] = useState(0);
  const [moneda, setMoneda] = useState('ARS');
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);

  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [mostrarModalCategorias, setMostrarModalCategorias] = useState(false);
  const [mensajeProducto, setMensajeProducto] = useState('');

  useEffect(() => {
    cargarCotizacionBna();
    cargarProductos();
    cargarCategorias();
  }, []);

  const cargarCotizacionBna = async () => {
    setCargandoDolar(true);
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/oficial');
      if (res.ok) {
        const data = await res.json();
        if (data.venta) setCotizacionBna(parseFloat(data.venta));
      }
    } catch (e) {
      console.error('Error cargando dólar BNA:', e);
    } finally {
      setCargandoDolar(false);
    }
  };

  const cargarProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (!error && data) setProductos(data);
  };

  const cargarCategorias = async () => {
    const { data, error } = await supabase.from('categorias').select('*').order('nombre', { ascending: true });
    if (!error && data) setCategoriasLista(data);
  };

  const agregarCategoriaBD = async (nombre, padre) => {
    const { error } = await supabase.from('categorias').insert([{ nombre, padre }]);
    if (!error) cargarCategorias();
  };

  const borrarCategoriaBD = async (id) => {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (!error) cargarCategorias();
  };

  const categoriasExistentes = Array.from(
    new Set([
      ...categoriasLista.filter((c) => !c.padre).map((c) => c.nombre),
      ...productos.map((p) => (p.categoria || '').toUpperCase()).filter((c) => c && c.trim() !== '')
    ])
  ).sort();

  const subcategoriasExistentes = Array.from(
    new Set([
      ...categoriasLista.filter((c) => c.padre && (!categoria || c.padre.toLowerCase() === categoria.toLowerCase())).map((c) => c.nombre),
      ...productos
        .filter((p) => !categoria || (p.categoria || '').toLowerCase() === categoria.toLowerCase())
        .map((p) => p.subcategoria)
        .filter((s) => s && s.trim() !== '')
    ])
  ).sort();

  const abrirNuevoProducto = () => {
    setEditingProductoId(null);
    setSku('');
    setDescripcion('');
    setCategoria('');
    setSubcategoria('');
    setMarca('');
    setUbicacion('');
    setPrecioCosto(0);
    setPrecioVenta(0);
    setPrecioUsd(0);
    setMoneda('ARS');
    setStockActual(0);
    setStockMinimo(0);
    setMensajeProducto('');
    setMostrarModalProducto(true);
  };

  const prepararEdicionProducto = (p) => {
    setEditingProductoId(p.id);
    setSku(p.sku || '');
    setDescripcion(p.descripcion || '');
    setCategoria(p.categoria || '');
    setSubcategoria(p.subcategoria || '');
    setMarca(p.marca || '');
    setUbicacion(p.ubicacion || '');
    setPrecioCosto(p.precio_costo || 0);
    setPrecioVenta(p.precio_venta || 0);
    setPrecioUsd(p.precio_usd || 0);
    setMoneda(p.moneda || 'ARS');
    setStockActual(p.stock_actual || 0);
    setStockMinimo(p.stock_minimo || 0);
    setMensajeProducto('');
    setMostrarModalProducto(true);
  };

  const cancelarProducto = () => {
    setMostrarModalProducto(false);
    setEditingProductoId(null);
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setMensajeProducto('');

    const valUsd = parseFloat(precioUsd) || 0;
    let valVenta = parseFloat(precioVenta) || 0;

    // Si la moneda es USD, calcula de manera automática el equivalente de referencia en ARS según el dólar BNA
    if (moneda === 'USD') {
      valVenta = valUsd * cotizacionBna;
    }

    const payload = {
      sku,
      descripcion,
      categoria: categoria.trim().toUpperCase(),
      subcategoria: subcategoria.trim(),
      marca,
      ubicacion,
      precio_costo: parseFloat(precioCosto) || 0,
      precio_venta: valVenta,
      precio_usd: valUsd,
      moneda,
      stock_actual: parseInt(stockActual) || 0,
      stock_minimo: parseInt(stockMinimo) || 0,
    };

    let resultError = null;
    if (editingProductoId) {
      const { error } = await supabase.from('productos').update(payload).eq('id', editingProductoId);
      resultError = error;
    } else {
      const { error } = await supabase.from('productos').insert([payload]);
      resultError = error;
    }

    if (resultError) {
      setMensajeProducto(`Error al guardar: ${resultError.message}`);
    } else {
      cancelarProducto();
      cargarProductos();
    }
  };

  const borrarProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) return;
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (!error) cargarProductos();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: '#2b2927', margin: 0, fontSize: '1.35rem', fontWeight: '800' }}>
            Catálogo de Inventario y Stock
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#78716c' }}>
            Control bimonetario de repuestos, precios y cotización del dólar en vivo
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Cotizador BNA Venta en Vivo */}
          <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: '#0369a1', fontWeight: 'bold' }}>💵 Dólar BNA Venta:</span>
            <span style={{ color: '#0284c7', fontWeight: '900', fontSize: '0.95rem' }}>
              {cargandoDolar ? 'Cargando...' : `$ ${cotizacionBna.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
            </span>
          </div>

          <button 
            onClick={() => setMostrarModalCategorias(true)}
            style={{ background: '#ebe6dc', color: '#44403c', border: '1px solid #dcd5c9', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ⚙️ Gestionar Rubros
          </button>

          <button 
            onClick={abrirNuevoProducto}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '0.55rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {mostrarModalCategorias && (
        <ModalCategorias
          categoriasLista={categoriasLista}
          onAgregarCategoria={agregarCategoriaBD}
          onBorrarCategoria={borrarCategoriaBD}
          onClose={() => setMostrarModalCategorias(false)}
        />
      )}

      {mostrarModalProducto && (
        <FormProducto 
          editingId={editingProductoId}
          sku={sku} setSku={setSku}
          descripcion={descripcion} setDescripcion={setDescripcion}
          categoria={categoria} setCategoria={setCategoria}
          subcategoria={subcategoria} setSubcategoria={setSubcategoria}
          marca={marca} setMarca={setMarca}
          ubicacion={ubicacion} setUbicacion={setUbicacion}
          precioCosto={precioCosto} setPrecioCosto={setPrecioCosto}
          precioVenta={precioVenta} setPrecioVenta={setPrecioVenta}
          precioUsd={precioUsd} setPrecioUsd={setPrecioUsd}
          moneda={moneda} setMoneda={setMoneda}
          cotizacionBna={cotizacionBna}
          stockActual={stockActual} setStockActual={setStockActual}
          stockMinimo={stockMinimo} setStockMinimo={setStockMinimo}
          categoriasExistentes={categoriasExistentes}
          subcategoriasExistentes={subcategoriasExistentes}
          mensajeProducto={mensajeProducto}
          onGuardar={guardarProducto}
          onCancelar={cancelarProducto}
        />
      )}

      <TablaStock 
        productos={productos} 
        cotizacionBna={cotizacionBna}
        onPrepararEdicion={prepararEdicionProducto} 
        onBorrarProducto={borrarProducto} 
      />
    </div>
  );
}
