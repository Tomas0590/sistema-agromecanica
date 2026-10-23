'use client';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  return (
    <header
      style={{
        backgroundColor: '#fcfbf9',
        border: '1px solid #e5e0d8',
        borderRadius: '12px',
        padding: '0.85rem 1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* LOGO DE LA EMPRESA Y MARCA */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} 
            onClick={() => setActiveTab('clientes')}
          >
            <img 
              src="/logo.png" 
              alt="Agromecanica Logo" 
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            />
            <h1 style={{ margin: 0, fontSize: '1.35rem', color: '#dc2626', fontWeight: '800', letterSpacing: '-0.02em' }}>
              Agromecanica
            </h1>
          </div>

          {/* BOTONES DE NAVEGACIÓN */}
          <nav style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setActiveTab('clientes')}
              style={{
                backgroundColor: activeTab === 'clientes' ? '#eeeae1' : 'transparent',
                color: activeTab === 'clientes' ? '#1c1917' : '#78716c',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                transition: 'all 0.15s'
              }}
            >
              👥 Clientes
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              style={{
                backgroundColor: activeTab === 'stock' ? '#eeeae1' : 'transparent',
                color: activeTab === 'stock' ? '#1c1917' : '#78716c',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                transition: 'all 0.15s'
              }}
            >
              📦 Stock e Inventario
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              style={{
                backgroundColor: activeTab === 'pedidos' ? '#eeeae1' : 'transparent',
                color: activeTab === 'pedidos' ? '#1c1917' : '#78716c',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.875rem',
                transition: 'all 0.15s'
              }}
            >
              🛒 Pedidos de Venta
            </button>
          </nav>
        </div>

        {/* CERRAR SESIÓN */}
        <button
          onClick={onLogout}
          style={{
            backgroundColor: '#eeeae1',
            border: '1px solid #dcd5c9',
            color: '#44403c',
            padding: '0.45rem 0.85rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
