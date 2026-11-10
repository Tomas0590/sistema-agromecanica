'use client';

import { useState } from 'react';

export default function ModalCategorias({
  categoriasLista,
  onAgregarCategoria,
  onBorrarCategoria,
  onClose
}) {
  const [nuevaCat, setNuevaCat] = useState('');
  const [catPadreSeleccionada, setCatPadreSeleccionada] = useState('');
  const [nuevaSubcat, setNuevaSubcat] = useState('');

  // Separar categorías principales de subcategorías
  const principales = categoriasLista.filter((c) => !c.padre);
  const subcategorias = categoriasLista.filter((c) => c.padre);

  const handleAgregarPrincipal = (e) => {
    e.preventDefault();
    if (!nuevaCat.trim()) return;
    onAgregarCategoria(nuevaCat.trim().toUpperCase(), null);
    setNuevaCat('');
  };

  const handleAgregarSub = (e) => {
    e.preventDefault();
    if (!nuevaSubcat.trim() || !catPadreSeleccionada) return;
    onAgregarCategoria(nuevaSubcat.trim(), catPadreSeleccionada);
    setNuevaSubcat('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '650px',
          padding: '1.75rem',
          color: '#f8fafc',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.2rem' }}>
            ⚙️ Administrar Categorías y Subcategorías
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* AGREGAR CATEGORÍA PRINCIPAL */}
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #334155' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>
            ➕ Nueva Categoría Principal
          </label>
          <form onSubmit={handleAgregarPrincipal} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Ej: CORREAS, FILTROS, HERRAMIENTAS..."
              value={nuevaCat}
              onChange={(e) => setNuevaCat(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Agregar
            </button>
          </form>
        </div>

        {/* AGREGAR SUBCATEGORÍA */}
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #334155' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '0.5rem' }}>
            ➕ Nueva Subcategoría
          </label>
          <form onSubmit={handleAgregarSub} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
            <select
              value={catPadreSeleccionada}
              onChange={(e) => setCatPadreSeleccionada(e.target.value)}
              required
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="">Seleccionar Categoría Padre...</option>
              {principales.map((p) => (
                <option key={p.id} value={p.nombre}>{p.nombre}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Ej: Aceite, Aire, Hidráulico..."
              value={nuevaSubcat}
              onChange={(e) => setNuevaSubcat(e.target.value)}
              required
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #475569', background: '#1e293b', color: '#fff', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Agregar
            </button>
          </form>
        </div>

        {/* ARBOL DE CATEGORÍAS EXISTENTES */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', color: '#cbd5e1', fontSize: '0.95rem' }}>Listado de Rubros Creados:</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {principales.map((cat) => {
              const subsDeCat = subcategorias.filter((s) => s.padre === cat.nombre);

              return (
                <div key={cat.id} style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '0.95rem' }}>📂 {cat.nombre}</span>
                    <button
                      onClick={() => onBorrarCategoria(cat.id)}
                      style={{ background: '#450a0a', color: '#ef4444', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>

                  {subsDeCat.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', paddingLeft: '1rem' }}>
                      {subsDeCat.map((sub) => (
                        <span
                          key={sub.id}
                          style={{
                            background: '#1e293b',
                            border: '1px solid #475569',
                            color: '#cbd5e1',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          {sub.nombre}
                          <button
                            onClick={() => onBorrarCategoria(sub.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '0.75rem', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
