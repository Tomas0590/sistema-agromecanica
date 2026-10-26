'use client';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  const navStyle = (tab) => ({
    padding: '0.6rem 1.1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: activeTab === tab ? '#15803d' : 'transparent',
    color: activeTab === tab ? '#ffffff' : '#44403c',
    fontWeight: 'bold',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  });

  return (
    <header style={{ backgroundColor: '#fcfbf9', borderBottom: '1px solid #e5e0d8', padding: '0.75rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* LOGO AGROMECANICA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/logo.png" 
            alt="Agromecanica Logo" 
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
            onError={(e) => {
              // Si no encuentra la imagen /logo.png, muestra el icono tractor como respaldo
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
            }}
          />
          <span style={{ fontSize: '1.4rem', display: 'none' }}>🚜</span>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#1c1917', letterSpacing: '-0.02em' }}>
            AGROMECANICA
          </h1>
        </div>

        {/* NAVEGACIÓN */}
        <nav style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#eeeae1', padding: '0.25rem', borderRadius: '10px' }}>
          <button style={navStyle('clientes')} onClick={() => setActiveTab('clientes')}>
            👥 Clientes
          </button>
          <button style={navStyle('cuentas_corrientes')} onClick={() => setActiveTab('cuentas_corrientes')}>
            💵 Cuentas Corrientes
          </button>
          <button style={navStyle('stock')} onClick={() => setActiveTab('stock')}>
            📦 Stock
          </button>
          <button style={navStyle('pedidos')} onClick={() => setActiveTab('pedidos')}>
            🛒 Pedidos de Venta
          </button>
        </nav>

        {/* BOTÓN SALIR */}
        <button
          onClick={onLogout}
          style={{
            backgroundColor: '#eeeae1',
            color: '#78716c',
            border: '1px solid #dcd5c9',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🚪 Salir
        </button>

      </div>
    </header>
  );
}
