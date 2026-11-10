'use client';

import { useState } from 'react';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  const [dropdownAbierto, setDropdownAbierto] = useState(null);

  const toggleDropdown = (menu) => {
    setDropdownAbierto(dropdownAbierto === menu ? null : menu);
  };

  const seleccionarYCerrar = (tabId) => {
    setActiveTab(tabId);
    setDropdownAbierto(null);
  };

  const esGrupoActivo = (tabs) => tabs.includes(activeTab);

  return (
    <header style={{ backgroundColor: '#1c1917', color: '#fff', borderBottom: '3px solid #15803d', padding: '0.75rem 1.5rem', position: 'relative', zIndex: 1000 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* LOGO AGROMECANICA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/logo.png" 
            alt="Agromecanica Logo" 
            style={{ height: '38px', objectFit: 'contain' }} 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#ffffff', letterSpacing: '0.5px' }}>
              AGROMECANICA
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Sistema de Gestión Agropecuaria</span>
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓN AGRUPADO */}
        <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          
          {/* 1. GRUPO: CUENTAS CORRIENTES */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggleDropdown('cuentas')}
              style={{
                backgroundColor: esGrupoActivo(['clientes', 'cuentas_corrientes', 'proveedores']) ? '#15803d' : '#292524',
                color: '#ffffff',
                border: '1px solid #44403c',
                padding: '0.55rem 0.9rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              📊 Cuentas Corrientes <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>

            {dropdownAbierto === 'cuentas' && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                backgroundColor: '#1c1917',
                border: '1px solid #44403c',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                minWidth: '220px',
                overflow: 'hidden',
                zIndex: 1001
              }}>
                <button
                  onClick={() => seleccionarYCerrar('cuentas_corrientes')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    background: activeTab === 'cuentas_corrientes' ? '#292524' : 'transparent',
                    color: activeTab === 'cuentas_corrientes' ? '#4ade80' : '#e7e5e4',
                    border: 'none',
                    borderBottom: '1px solid #292524',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'cuentas_corrientes' ? 'bold' : 'normal'
                  }}
                >
                  📄 Cuentas Corrientes (Clientes)
                </button>
                <button
                  onClick={() => seleccionarYCerrar('proveedores')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    background: activeTab === 'proveedores' ? '#292524' : 'transparent',
                    color: activeTab === 'proveedores' ? '#4ade80' : '#e7e5e4',
                    border: 'none',
                    borderBottom: '1px solid #292524',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'proveedores' ? 'bold' : 'normal'
                  }}
                >
                  🏢 Proveedores / Compras (USD/ARS)
                </button>
                <button
                  onClick={() => seleccionarYCerrar('clientes')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    background: activeTab === 'clientes' ? '#292524' : 'transparent',
                    color: activeTab === 'clientes' ? '#4ade80' : '#e7e5e4',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'clientes' ? 'bold' : 'normal'
                  }}
                >
                  👥 Padrón de Clientes
                </button>
              </div>
            )}
          </div>

          {/* 2. GRUPO: CARTERA DE VALORES */}
          <button
            onClick={() => seleccionarYCerrar('cartera_valores')}
            style={{
              backgroundColor: activeTab === 'cartera_valores' ? '#15803d' : 'transparent',
              color: activeTab === 'cartera_valores' ? '#ffffff' : '#d6d3d1',
              border: 'none',
              padding: '0.55rem 0.85rem',
              borderRadius: '6px',
              fontWeight: activeTab === 'cartera_valores' ? 'bold' : 'normal',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            💳 Cartera de Valores
          </button>

          {/* 3. GRUPO: INVENTARIO Y VENTAS */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggleDropdown('stock_ventas')}
              style={{
                backgroundColor: esGrupoActivo(['stock', 'pedidos']) ? '#15803d' : '#292524',
                color: '#ffffff',
                border: '1px solid #44403c',
                padding: '0.55rem 0.9rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              📦 Stock y Ventas <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>

            {dropdownAbierto === 'stock_ventas' && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                backgroundColor: '#1c1917',
                border: '1px solid #44403c',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                minWidth: '200px',
                overflow: 'hidden',
                zIndex: 1001
              }}>
                <button
                  onClick={() => seleccionarYCerrar('stock')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    background: activeTab === 'stock' ? '#292524' : 'transparent',
                    color: activeTab === 'stock' ? '#4ade80' : '#e7e5e4',
                    border: 'none',
                    borderBottom: '1px solid #292524',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'stock' ? 'bold' : 'normal'
                  }}
                >
                  📦 Catálogo de Stock (USD/ARS)
                </button>
                <button
                  onClick={() => seleccionarYCerrar('pedidos')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.7rem 1rem',
                    background: activeTab === 'pedidos' ? '#292524' : 'transparent',
                    color: activeTab === 'pedidos' ? '#4ade80' : '#e7e5e4',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: activeTab === 'pedidos' ? 'bold' : 'normal'
                  }}
                >
                  🛒 Pedidos de Venta
                </button>
              </div>
            )}
          </div>

        </nav>

        {/* BOTÓN CERRAR SESIÓN */}
        <button
          onClick={onLogout}
          style={{
            backgroundColor: '#292524',
            color: '#e7e5e4',
            border: '1px solid #44403c',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <span>Cerrar Sesión</span> ➔
        </button>

      </div>
    </header>
  );
}
