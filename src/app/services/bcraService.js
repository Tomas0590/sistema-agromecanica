'use client';

// Consulta BCRA con múltiples alternativas
export const consultarBCRACuit = async (cuitLimpio) => {
  const targetUrl = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitLimpio}`;
  
  const proxies = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`
  ];

  for (const makeProxyUrl of proxies) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(makeProxyUrl(targetUrl), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        return 1; // Sin deudas -> Sit 1
      } else if (res.ok) {
        const data = await res.json();
        let peorSituacion = 1;
        
        // Manejo flexible de respuesta del BCRA
        const periodos = data?.results?.periodos || data?.periodos;
        if (periodos?.[0]?.entidades) {
          periodos[0].entidades.forEach((e) => {
            const sit = Number(e.situacion || e.Situacion || 1);
            if (sit > peorSituacion) peorSituacion = sit;
          });
        }
        return peorSituacion;
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
  }

  return null;
};

// Consulta AFIP / Padrón con alternativas de consulta
export const consultarPadronAfip = async (cuitLimpio) => {
  const apis = [
    `https://afip.republica.dev/cuit/${cuitLimpio}`,
    `https://api.sirena.app/afip/cuit/${cuitLimpio}`
  ];

  for (const apiUrl of apis) {
    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        const razonSocial = data.razon_social || data.nombre || data.razonSocial || data.nombre_completo;
        if (razonSocial) {
          return {
            razonSocial,
            condicionIva: data.condicion_iva || data.categoria_iva || null,
            domicilio: data.domicilio || data.direccion || null
          };
        }
      }
    } catch (e) {
      // Intenta la siguiente API si falla
    }
  }

  return null;
};
