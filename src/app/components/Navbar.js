'use client';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  return (
    <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#dc2626', fontWeight: 'bold' }}>
            Agromecanica
          </h1>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('clientes')}
              style={{
                background: activeTab === 'clientes' ? '#0f172a' : 'transparent',
                color: activeTab === 'clientes' ? '#38bdf8' : '#94a3b8',
                border: '1px solid',
                borderColor: activeTab === 'clientes' ? '#38bdf8' : 'transparent',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              👥 Clientes
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              style={{
                background: activeTab === 'stock' ? '#0f172a' : 'transparent',
                color: activeTab === 'stock' ? '#38bdf8' : '#94a3b8',
                border: '1px solid',
                borderColor: activeTab === 'stock' ? '#38bdf8' : 'transparent',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              📦 Stock e Inventario
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              style={{
                background: activeTab === 'pedidos' ? '#0f172a' : 'transparent',
                color: activeTab === 'pedidos' ? '#38bdf8' : '#94a3b8',
                border: '1px solid',
                borderColor: activeTab === 'pedidos' ? '#38bdf8' : 'transparent',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}
            >
              🛒 Pedidos de Venta
            </button>
          </nav>
        </div>
        <button
          onClick={onLogout}
          style={{ background: '#334155', color: '#f8fafc', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
