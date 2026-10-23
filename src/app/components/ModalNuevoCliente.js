// CONTROL Y RESTRICCIÓN DEL CUIT (SOLO NÚMEROS Y MÁXIMO 11 DÍGITOS)
  const handleCuitChange = async (e) => {
    // Extraer únicamente los dígitos numéricos y limitar a 11 caracteres
    const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCuitDni(soloNumeros);

    // Si borró o aún no llega a 11 dígitos, reseteamos los estados de lectura
    if (soloNumeros.length < 11) {
      setSitBcraLeida(null);
      setErrorBcra(false);
      return;
    }

    // Al completar exactamente los 11 dígitos, dispara la lectura de AFIP y BCRA
    if (soloNumeros.length === 11) {
      setBuscandoPadron(true);
      setErrorBcra(false);
      setSitBcraLeida(null);

      try {
        const [resAfip, sitBcra] = await Promise.all([
          fetch(`https://afip.republica.dev/cuit/${soloNumeros}`).catch(() => null),
          consultarBCRACuit(soloNumeros)
        ]);

        if (resAfip && resAfip.ok) {
          const dataAfip = await resAfip.json();
          const nombreEncontrado = dataAfip.razon_social || dataAfip.nombre || dataAfip.razonSocial;
          if (nombreEncontrado) setRazonSocial(nombreEncontrado);
          if (dataAfip.condicion_iva) setCondicionIva(dataAfip.condicion_iva);
          if (dataAfip.domicilio) setDireccion(dataAfip.domicilio);
        }

        if (sitBcra !== null) {
          setSitBcraLeida(sitBcra);
        } else {
          setErrorBcra(true);
        }
      } catch (err) {
        console.error('Error al autocompletar:', err);
        setErrorBcra(true);
      } finally {
        setBuscandoPadron(false);
      }
    }
  };
