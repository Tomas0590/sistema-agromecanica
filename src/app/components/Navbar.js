'use client';

export default function Navbar({ activeTab, setActiveTab, onLogout }) {
  return (
    <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem', color: '#f59e0b', margin: 0, fontWeight: 'bold' }}>Agro-Repuestos & Bulonería</h1>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('pedidos')} 
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === 'pedidos' ? '#f59e0b' : 'transparent', color: activeTab === 'pedidos' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          >
            📦 Stock y Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('clientes')} 
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === 'clientes' ? '#f59e0b' : 'transparent', color: activeTab === 'clientes' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          >
            👥 Clientes y Cuentas Corrientes
          </button>
        </nav>
      </div>

      <button onClick={onLogout} style={{ background: '#334155', border: 'none', color: '#cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>
        Cerrar Sesión
      </button>
    </header>
  );
}
