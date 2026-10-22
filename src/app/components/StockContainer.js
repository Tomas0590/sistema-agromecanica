'use client';

import { useState, useEffect } from 'react';
import FormProducto from './FormProducto';
import TablaStock from './TablaStock';

// LISTA BASE PREARMADA (CATEGORÍAS EN UNA PALABRA)
const CATEGORIAS_PREARMADAS = {
  'FILTROS': ['Aceite', 'Aire', 'Combustible', 'Habitáculo', 'Hidráulico'],
  'LUBRICANTES': ['Motor', 'Transmisión', 'Grasas', 'Refrigerante'],
  'CORREAS': ['En V', 'Multicanal', 'Planas'],
  'MANGUERAS': ['Hidráulicas', 'Riego / Agua', 'Aspiración'],
  'RODAMIENTOS': ['Bolas', 'Cónicos', 'Retenes', 'Mazas'],
  'ACEITES': ['Motor', 'Transmisión', 'Diferencial', 'Hidráulico'],
  'ACCESORIOS': ['Iluminación', 'Bulonería', 'Acoples', 'Fittings'],
  'PULVERIZACION': ['Picos / Boquillas', 'Pastillas', 'Portapicos', 'Bombas']
};

export default function StockContainer({ supabase }) {
  const [productos, setProductos] = useState([]);
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [sku, setSku] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [precioCosto, setPrecioCosto] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [mensajeProducto, setMensajeProducto] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (!error && data) setProductos(data);
  };

  // Combinar categorías prearmadas con las que se hayan guardado en la BD
  const categoriasExistentes = Array.from(
    new Set([
      ...Object.keys(CATEGORIAS_PREARMADAS),
      ...productos.map((p) => (p.categoria || '').toUpperCase()).filter((c) => c && c.trim() !== '')
    ])
  ).sort();

  // Obtener subcategorías prearmadas según categoría + las de la BD
  const subcategoriasBase = CATEGORIAS_PREARMADAS[categoria?.toUpperCase()] || [];
  const subcategoriasGuardadas = productos
    .filter((p) => !categoria || (p.categoria || '').toLowerCase() === categoria.toLowerCase())
    .map((p) => p.subcategoria)
    .filter((s) => s && s.trim() !== '');

  const subcategoriasExistentes = Array.from(
    new Set([...subcategoriasBase, ...subcategoriasGuardadas])
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

    const payload = {
      sku,
      descripcion,
      categoria: categoria.trim().toUpperCase(),
      subcategoria: subcategoria.trim(),
      marca,
      ubicacion,
      precio_costo: parseFloat(precioCosto) || 0,
      precio_venta: parseFloat(precioVenta) || 0,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#cbd5e1', margin: 0 }}>Catálogo de Inventario y Stock</h2>
        <button 
          onClick={abrirNuevoProducto}
          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          ➕ Nuevo Producto
        </button>
      </div>

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
          stockActual={stockActual} setStockActual={setStockActual}
          stockMinimo={stockMinimo} setStockMinimo={setStockMinimo}
          categoriasExistentes={categoriasExistentes}
          subcategoriasExist### `src/app/components/StockContainer.js`

Reemplazá el contenido de `src/app/components/StockContainer.js` en GitHub por esta versión con la lista limpia a una sola palabra por categoría y las propiedades JSX bien formateadas:

```javascript
'use client';

import { useState, useEffect } from 'react';
import FormProducto from './FormProducto';
import TablaStock from './TablaStock';

// LISTA BASE CON CATEGORÍAS EN UNA SOLA PALABRA
const CATEGORIAS_PREARMADAS = {
  'FILTROS': ['Aceite', 'Aire', 'Combustible', 'Habitáculo', 'Hidráulico'],
  'LUBRICANTES': ['Grasas', 'Refrigerantes', 'Líquidos de Freno', 'Aditivos'],
  'CORREAS': ['En V', 'Multicanal', 'Planas', 'Variador'],
  'MANGUERAS': ['Hidráulicas', 'Riego', 'Combustible', 'Prensa'],
  'RODAMIENTOS': ['Bolas', 'Cónicos', 'Retenes', 'Crapodinas'],
  'ACEITES': ['Motor', 'Transmisión', 'Hidráulico', 'Diferencial'],
  'ACCESORIOS': ['Picos', 'Acoples', 'Abrazaderas', 'Bulonería'],
  'PULVERIZACION': ['Pastillas', 'Portapicos', 'Bombas', 'Filtros de Línea']
};

export default function StockContainer({ supabase }) {
  const [productos, setProductos] = useState([]);
  const [editingProductoId, setEditingProductoId] = useState(null);
  const [sku, setSku] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [marca, setMarca] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [precioCosto, setPrecioCosto] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [stockActual, setStockActual] = useState(0);
  const [stockMinimo, setStockMinimo] = useState(0);
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false);
  const [mensajeProducto, setMensajeProducto] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
    if (!error && data) setProductos(data);
  };

  // Combinar categorías prearmadas con las que los usuarios vayan creando dinámicamente
  const categoriasExistentes = Array.from(
    new Set([
      ...Object.keys(CATEGORIAS_PREARMADAS),
      ...productos.map((p) => (p.categoria || '').toUpperCase()).filter((c) => c && c.trim() !== '')
    ])
  ).sort();

  // Combinar subcategorías prearmadas según la categoría elegida
  const subcategoriasBase = CATEGORIAS_PREARMADAS[categoria?.toUpperCase()] || [];
  const subcategoriasGuardadas = productos
    .filter((p) => !categoria || (p.categoria || '').toLowerCase() === categoria.toLowerCase())
    .map((p) => p.subcategoria)
    .filter((s) => s && s.trim() !== '');

  const subcategoriasExistentes = Array.from(
    new Set([...subcategoriasBase, ...subcategoriasGuardadas])
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

    const payload = {
      sku,
      descripcion,
      categoria: categoria.trim().toUpperCase(),
      subcategoria: subcategoria.trim(),
      marca,
      ubicacion,
      precio_costo: parseFloat(precioCosto) || 0,
      precio_venta: parseFloat(precioVenta) || 0,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ color: '#cbd5e1', margin: 0 }}>Catálogo de Inventario y Stock</h2>
        <button 
          onClick={abrirNuevoProducto}
          style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          ➕ Nuevo Producto
        </button>
      </div>

      {mostrarModalProducto && (
        <FormProducto categoria="{categoria}" categoriasExistentes="{categoriasExistentes}" descripcion="{descripcion}" editingId="{editingProductoId}" marca="{marca}" mensajeProducto="{mensajeProducto}" onCancelar="{cancelarProducto}" onGuardar="{guardarProducto}" precioCosto="{precioCosto}" precioVenta="{precioVenta}" setCategoria="{setCategoria}" setDescripcion="{setDescripcion}" setMarca="{setMarca}" setPrecioCosto="{setPrecioCosto}" setPrecioVenta="{setPrecioVenta}" setSku="{setSku}" setStockActual="{setStockActual}" setStockMinimo="{setStockMinimo}" setSubcategoria="{setSubcategoria}" setUbicacion="{setUbicacion}" sku="{sku}" stockActual="{stockActual}" stockMinimo="{stockMinimo}" subcategoria="{subcategoria}" subcategoriasExistentes="{subcategoriasExistentes}" ubicacion="{ubicacion}"/>
      )}

      <TablaStock onBorrarProducto="{borrarProducto}" onPrepararEdicion="{prepararEdicionProducto}" productos="{productos}"/>
    </div>
  );
}
