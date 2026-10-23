{/* CELDA SITUACIÓN CREDITICIA */}
<td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
  {(() => {
    const infoBcra = situacionesMap[cliente.id];
    const cargando = cargandoIndividualId === cliente.id;

    // Manejar formato legacy (si fuera un número directo) o el objeto nuevo
    const sit = typeof infoBcra === 'object' ? infoBcra?.situacion : infoBcra;
    const cheques = typeof infoBcra === 'object' ? infoBcra?.cheques : 0;

    if (cargando) {
      return <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 'bold' }}>⏳ Consultando...</span>;
    }

    if (!sit) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#a8a29e' }}>Sin verificar</span>
          <button
            onClick={(e) => corroborarBCRAIndividual(cliente, e)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.9rem' }}
            title="Verificar en BCRA"
          >
            🔄
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
        {/* INSIGNIA SITUACIÓN DEUDA */}
        <span
          style={{
            padding: '0.25rem 0.65rem',
            borderRadius: '12px',
            fontSize: '0.78rem',
            fontWeight: 'bold',
            backgroundColor: sit === 1 ? '#f0fdf4' : '#fefce8',
            color: sit === 1 ? '#166534' : '#b45309',
            border: `1px solid ${sit === 1 ? '#bbf7d0' : '#fef08a'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          {sit === 1 ? 'Sit. 1 ✅' : `Sit. ${sit} ⚠️ ALERTA`}
        </span>

        {/* INSIGNIA CHEQUES RECHAZADOS (Si posee más de 0) */}
        {cheques > 0 ? (
          <span
            title={`${cheques} cheque(s) rechazado(s) registrado(s) en BCRA`}
            style={{
              padding: '0.25rem 0.55rem',
              borderRadius: '12px',
              fontSize: '0.78rem',
              fontWeight: '800',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            🚫 {cheques} {cheques === 1 ? 'Chq.' : 'Chqs.'}
          </span>
        ) : (
          <span
            title="Sin cheques rechazados"
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              backgroundColor: '#f5f5f4',
              color: '#78716c',
              border: '1px solid #e7e5e4'
            }}
          >
            0 Chq.
          </span>
        )}

        {/* BOTÓN REEVALUAR */}
        <button
          onClick={(e) => corroborarBCRAIndividual(cliente, e)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px' }}
          title="Reevaluar BCRA"
        >
          🔄
        </button>
      </div>
    );
  })()}
</td>
