'use client';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  return (
    <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h1 style={{ margin: 0, color: '#f59e0b', fontSize: '1.4rem', fontWeight: 'bold' }}>Agromecanica</h1>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('clientes')}
            style={{
              background: activeTab === 'clientes' ? '#0f172a' : 'transparent',
              color: activeTab === 'clientes' ? '#f59e0b' : '#94a3b8',
              border: activeTab === 'clientes' ? '1px solid #334155' : '1px solid transparent',
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
              color: activeTab === 'stock' ? '#f59e0b' : '#94a3b8',
              border: activeTab === 'stock' ? '1px solid #334155' : '1px solid transparent',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem'
            }}
          >
            📦 Stock / Inventario
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            style={{
              background: activeTab === 'pedidos' ? '#0f172a' : 'transparent',
              color: activeTab === 'pedidos' ? '#f59e0b' : '#94a3b8',
              border: activeTab === 'pedidos' ? '1px solid #334155' : '1px solid transparent',
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
    </header>
  );
}
