'use client';

export default function ModalCliente({ cliente, onClose, onPrepararEdicion, onBorrarCliente }) {
  if (!cliente) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '90%', color: '#fff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '1.25rem' }}>{cliente.razon_social}</h3>
        <hr style={{ borderColor: '#334155', marginBottom: '1rem' }} />
        
        <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
          <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>CUIT:</strong> <span style={{ fontFamily: 'monospace' }}>{cliente.cuit}</span></p>
          <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Condición IVA:</strong> {cliente.condicion_iva || '-'}</p>
          <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Teléfono:</strong> {cliente.telefono || 'Sin registrar'}</p>
          <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Email:</strong> {cliente.email || 'Sin registrar'}</p>
          <p style={{ margin: 0 }}><strong style={{ color: '#94a3b8' }}>Dirección / Localidad:</strong> {cliente.direccion || 'Sin registrar'}</p>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => onPrepararEdicion(cliente)}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              ✏️ Editar
            </button>
            <button 
              onClick={() => onBorrarCliente(cliente.id)}
              style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
            >
              🗑️ Borrar
            </button>
          </div>
          
          <button 
            onClick={onClose}
            style={{ background: '#475569', color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
