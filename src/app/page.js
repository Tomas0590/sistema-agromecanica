'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Printer, Plus, Trash2, ShoppingBag, Package } from 'lucide-react';

// Configuración de cliente Supabase desde Variables de Entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  
  const [busqueda, setBusqueda] = useState('');
  const [catSeleccionada, setCatSeleccionada] = useState('');
  const [subCatSeleccionada, setSubCatSeleccionada] = useState('');
  
  const [pedido, setPedido] = useState([]);
  const [cliente, setCliente] = useState('Cliente Mostrador');

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    // 1. Obtener Categorías
    const { data: cats } = await supabase.from('categorias').select('*');
    if (cats) setCategorias(cats);

    // 2. Obtener Subcategorías
    const { data: subCats } = await supabase.from('subcategorias').select('*');
    if (subCats) setSubcategorias(subCats);

    // 3. Obtener Productos con relación de categoría
    const { data: prods } = await supabase.from('productos').select('*, categorias(nombre), subcategorias(nombre)');
    if (prods) setProductos(prods);
  }

  // Filtrado dinámico de productos
  const productosFiltrados = productos.filter((p) => {
    const coincideTexto = 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo_sku.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo_oem && p.codigo_oem.toLowerCase().includes(busqueda.toLowerCase())) ||
      (p.medida && p.medida.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideCat = catSeleccionada ? p.categoria_id == catSeleccionada : true;
    const coincideSubCat = subCatSeleccionada ? p.subcategoria_id == subCatSeleccionada : true;

    return coincideTexto && coincideCat && coincideSubCat;
  });

  // Funciones del Pedido de Venta
  const agregarAlPedido = (prod) => {
    const existe = pedido.find((item) => item.id === prod.id);
    if (existe) {
      setPedido(pedido.map((item) => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setPedido([...pedido, { ...prod, cantidad: 1 }]);
    }
  };

  const quitarDelPedido = (id) => {
    setPedido(pedido.filter((item) => item.id !== id));
  };

  const calcularTotal = () => {
    return pedido.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans print:p-0 print:bg-white">
      {/* Encabezado */}
      <header className="bg-slate-900 text-white p-4 rounded-xl mb-4 flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="text-amber-400" /> AGRO-REPUESTOS & BULONERÍA
        </h1>
        <div className="text-sm text-slate-300">Administración Interna de Stock</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO: Inventario y Filtros */}
        <div className="lg:col-span-2 space-y-4 print:hidden">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
            {/* Buscador General */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por Código SKU, OEM, Nombre o Medida (ej: 1/2 x 2)..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            {/* Filtros por Categoría y Subcategoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                value={catSeleccionada}
                onChange={(e) => {
                  setCatSeleccionada(e.target.value);
                  setSubCatSeleccionada('');
                }}
              >
                <option value="">Todas las Categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>

              <select
                className="p-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                value={subCatSeleccionada}
                onChange={(e) => setSubCatSeleccionada(e.target.value)}
              >
                <option value="">Todas las Subcategorías / Tipos</option>
                {subcategorias
                  .filter((s) => !catSeleccionada || s.categoria_id == catSeleccionada)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-slate-200">
                <tr>
                  <th className="p-3">Código / OEM</th>
                  <th className="p-3">Descripción / Medida</th>
                  <th className="p-3">Precio Venta</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{p.codigo_sku}</div>
                      {p.codigo_oem && <div className="text-xs text-slate-400">OEM: {p.codigo_oem}</div>}
                    </td>
                    <td className="p-3">
                      <div>{p.nombre}</div>
                      {p.medida && <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.medida}</span>}
                    </td>
                    <td className="p-3 font-semibold text-slate-700">${p.precio_venta}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock_actual <= p.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_actual} un.
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => agregarAlPedido(p)}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 rounded-lg text-xs flex items-center gap-1 mx-auto"
                      >
                        <Plus size={14} /> Agregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO: Armado de Pedido / Comprobante */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 print:shadow-none print:border-none print:w-full">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag size={18} /> Pedido de Venta / Presupuesto
            </h2>
            <button
              onClick={() => window.print()}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 print:hidden"
            >
              <Printer size={14} /> Imprimir Comprobante
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Cliente:</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm print:border-none print:p-0 print:font-bold"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto print:max-h-none">
            {pedido.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No hay productos en el pedido</div>
            ) : (
              pedido.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-sm border border-slate-100 print:bg-white print:border-b">
                  <div>
                    <div className="font-medium text-slate-800">{item.nombre}</div>
                    <div className="text-xs text-slate-500">${item.precio_venta} x {item.cantidad} un.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">${item.precio_venta * item.cantidad}</span>
                    <button onClick={() => quitarDelPedido(item.id)} className="text-red-500 hover:text-red-700 print:hidden">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between font-bold text-lg text-slate-900">
              <span>Total a Cobrar:</span>
              <span>${calcularTotal()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
