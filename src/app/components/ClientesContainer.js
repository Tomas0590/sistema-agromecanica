// VERIFICACIÓN EN SEGUNDO PLANO Y MANUAL
  const corroborarBCRAMasivamenteSilencioso = async (listaClientes) => {
    const conCuit = listaClientes.filter(
      (c) => String(c.cuit_dni || c.cuit || '').replace(/\D/g, '').length === 11
    );

    if (conCuit.length === 0) return;

    setCargandoBCRA(true);

    for (let i = 0; i < conCuit.length; i++) {
      const cli = conCuit[i];
      const cuitLimpio = String(cli.cuit_dni || cli.cuit).replace(/\D/g, '');
      setProgresoBcra(`(${i + 1}/${conCuit.length})`);

      try {
        const res = await fetch(`/api/bcra?cuit=${cuitLimpio}`);
        if (res.ok) {
          const data = await res.json();
          setSituacionesMap((prev) => ({
            ...prev,
            [cli.id]: {
              situacion: data.situacion || 1,
              cheques: data.chequesRechazados || 0
            }
          }));
        } else if (res.status === 404) {
          setSituacionesMap((prev) => ({
            ...prev,
            [cli.id]: { situacion: 1, cheques: 0 }
          }));
        }
      } catch (e) {
        console.error(`Error consultando BCRA para ${cli.razon_social}:`, e);
      }

      await new Promise((r) => setTimeout(r, 150));
    }

    setCargandoBCRA(false);
    setProgresoBcra('');
  };

  const corroborarBCRAIndividual = async (cliente, e) => {
    if (e) e.stopPropagation();
    const cuitLimpio = String(cliente.cuit_dni || cliente.cuit || '').replace(/\D/g, '');
    if (cuitLimpio.length !== 11) {
      alert('Este cliente no posee un CUIT válido de 11 dígitos.');
      return;
    }

    setCargandoIndividualId(cliente.id);

    try {
      const res = await fetch(`/api/bcra?cuit=${cuitLimpio}`);
      if (res.ok) {
        const data = await res.json();
        setSituacionesMap((prev) => ({
          ...prev,
          [cliente.id]: {
            situacion: data.situacion || 1,
            cheques: data.chequesRechazados || 0
          }
        }));
      } else if (res.status === 404) {
        setSituacionesMap((prev) => ({
          ...prev,
          [cliente.id]: { situacion: 1, cheques: 0 }
        }));
      } else {
        alert('No se pudo obtener la información crediticia desde el BCRA.');
      }
    } catch (e) {
      alert('Error de conexión con el servidor.');
    } finally {
      setCargandoIndividualId(null);
    }
  };
