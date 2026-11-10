'use client';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  const navItems = [
    { id: 'clientes', label: '👥 Clientes' },
    { id: 'cuentas_corrientes', label: '📊 Cuentas Corrientes' },
    { id: 'cartera_valores', label: '💳 Cartera de Valores' },
    { id: 'stock', label: '📦 Stock' },
    { id: 'proveedores', label: '🏢 Proveedores / Compras' },
    { id: 'pedidos', label: '🛒 Pedidos de Venta' },
  ];

  return (
    <header style={{ backgroundColor: '#1c1917', color: '#fff', borderBottom: '3px solid #15803d', padding: '0.75rem 1.5rem' }}>
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

        {/* MENÚ DE NAVEGACIÓN */}
        <nav style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  backgroundColor: isActive ? '#15803d' : 'transparent',
                  color: isActive ? '#ffffff' : '#d6d3d1',
                  border: 'none',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '6px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* BOTÓN SALIR */}
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
