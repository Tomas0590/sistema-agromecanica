'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Printer, Plus, Trash2, ShoppingBag, Package, Users, UserPlus, Check } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [pestana, setPestana] = useState('pedidos'); // 'pedidos' o 'clientes'
  
  // Datos
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Filtros de Productos
  const [busqueda, setBusqueda] = useState('');
  const [catSeleccionada, setCatSeleccionada] = useState('');
  const [subCatSeleccionada, setSubCatSeleccionada] = useState('');

  // Pedido Actual
  const [pedido, setPedido] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Formulario Nuevo Cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    razon_social: '',
    cuit_dni: '',
    condicion_iva: 'Consumidor Final',
    telefono: '',
    direccion: ''
  });
  const [mensajeCliente, setMensajeCliente] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    const { data: cats } = await supabase.from('categorias').select('*');
    if (cats) setCategorias(cats);

    const { data: subCats } = await supabase.from('subcategorias').select('*');
    if (subCats) setSubcategorias(subCats);

    const { data: prods } = await supabase.from('productos').select('*, categorias(nombre), subcategorias(nombre)');
    if (prods) setProductos(prods);

    const { data: clis } = await supabase.from('clientes').select('*').order('razon_social', { ascending: true });
    if (clis) setClientes(clis);
  }

  // Guardar un nuevo cliente en Supabase
  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!nuevoCliente.razon_social) return;

    const { data, error } = await supabase.from('clientes').insert([nuevoCliente]).select();

    if (error) {
      setMensajeCliente('Error al guardar el cliente.');
    } else {
      setMensajeCliente('¡Cliente guardado con éxito!');
      setClientes([...clientes, data[0]]);
      setNuevoCliente({ razon_social: '', cuit_dni: '', condicion_iva: 'Consumidor Final', telefono: '', direccion: '' });
      setTimeout(() => setMensajeCliente(''), 3000);
    }
  };

  // Filtrado de productos
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
      {/* Encabezado con Navegación */}
      <header className="bg-slate-900 text-white p-4 rounded-xl mb-4 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="text-amber-400" /> AGRO-REPUESTOS & BULONERÍA
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPestana('pedidos')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${pestana === 'pedidos' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <ShoppingBag size={16} /> Ventas / Stock
          </button>
          <button
            onClick={() => setPestana('clientes')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition ${pestana === 'clientes' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Users size={16} /> Clientes ({clientes.length})
          </button>
        </div>
      </header>

      {/* VISTA 1: CARPETA DE CLIENTES */}
      {pestana === 'clientes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formulario Agregar Cliente */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-amber-500" /> Nuevo Cliente
            </h2>
            <form onSubmit={guardarCliente} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Agropecuaria Don Pedro"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                  value={nuevoCliente.razon_social}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">CUIT / DNI</label>
                <input
                  type="text"
                  placeholder="30-12345678-9"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={nuevoCliente.cuit_dni}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, cuit_dni: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Condición IVA</label>
                <select
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                  value={nuevoCliente.condicion_iva}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, condicion_iva: e.target.value })}
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">Exento</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="2923..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={nuevoCliente.telefono}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Dirección / Localidad</label>
                <input
                  type="text"
                  placeholder="Zona Rural / Carhué..."
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={nuevoCliente.direccion}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold p-2.5 rounded-lg text-sm flex justify-center items-center gap-2 mt-2"
              >
                <Plus size={16} /> Guardar Cliente
              </button>
              {mensajeCliente && (
                <div className="text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-200 flex items-center gap-1">
                  <Check size={14} /> {mensajeCliente}
                </div>
              )}
            </form>
          </div>

          {/* Listado de Clientes */}
          <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-800 mb-4">Listado de Clientes Registrados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2.5">Razón Social</th>
                    <th className="p-2.5">CUIT / DNI</th>
                    <th className="p-2.5">Cond. IVA</th>
                    <th className="p-2.5">Teléfono</th>
                    <th className="p-2.5">Dirección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400">No hay clientes cargados aún.</td>
                    </tr>
                  ) : (
                    clientes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-800">{c.razon_social}</td>
                        <td className="p-2.5 text-slate-600">{c.cuit_dni || '-'}</td>
                        <td className="p-2.5 text-slate-600">{c.condicion_iva}</td>
                        <td className="p-2.5 text-slate-600">{c.telefono || '-'}</td>
                        <td className="p-2.5 text-slate-600">{c.direccion || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: VENTAS / MOSTRADOR / PEDIDOS */}
      {pestana === 'pedidos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PANEL IZQUIERDO: Inventario y Filtros */}
          <div className="lg:col-span-2 space-y-4 print:hidden">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por Código SKU, OEM, Nombre o Medida..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

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
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-slate-400">No se encontraron productos.</td>
                    </tr>
                  ) : (
                    productosFiltrados.map((p) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PANEL DERECHO: Armado de Pedido e Impresión */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4 print:shadow-none print:border-none print:w-full">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag size={18} /> Presupuesto / Pedido
              </h2>
              <button
                onClick={() => window.print()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 print:hidden"
              >
                <Printer size={14} /> Imprimir Comprobante
              </button>
            </div>

            {/* SELECCIÓN DE CLIENTE */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Seleccionar Cliente:</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-slate-50 print:hidden"
                value={clienteSeleccionado ? clienteSeleccionado.id : ''}
                onChange={(e) => {
                  const cli = clientes.find((c) => c.id == e.target.value);
                  setClienteSeleccionado(cli || null);
                }}
              >
                <option value="">-- Cliente Mostrador / Contado --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.razon_social} {c.cuit_dni ? `(${c.cuit_dni})` : ''}</option>
                ))}
              </select>

              {/* Vista en el Comprobante Impreso y pantalla */}
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 print:bg-white print:p-0 print:border-none">
                <div className="font-bold text-sm text-slate-900">
                  {clienteSeleccionado ? clienteSeleccionado.razon_social : 'Cliente Mostrador / Contado'}
                </div>
                {clienteSeleccionado && (
                  <div className="grid grid-cols-2 gap-1 mt-1 text-slate-600">
                    <div>CUIT: {clienteSeleccionado.cuit_dni || 'S/D'}</div>
                    <div>Cond. IVA: {clienteSeleccionado.condicion_iva}</div>
                    <div>Tel: {clienteSeleccionado.telefono || 'S/D'}</div>
                    <div>Dirección: {clienteSeleccionado.direccion || 'S/D'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Renglones del Pedido */}
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

            {/* Total */}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between font-bold text-lg text-slate-900">
                <span>Total a Cobrar:</span>
                <span>${calcularTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
