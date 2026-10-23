// Lógica de consulta a la API del BCRA con rotación de proxies y timeout
export const consultarBCRACuit = async (cuitLimpio) => {
  const targetUrl = `https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuitLimpio}`;
  
  const proxies = [
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://thingproxy.freeboard.io/fetch/${url}`
  ];

  for (const makeProxyUrl of proxies) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(makeProxyUrl(targetUrl), { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.status === 404) {
        return 1; // Sin deudas -> Situación 1
      } else if (res.ok) {
        const data = await res.json();
        let peorSituacion = 1;
        
        if (data.results?.periodos?.[0]?.entidades) {
          data.results.periodos[0].entidades.forEach((e) => {
            if (e.situacion > peorSituacion) peorSituacion = e.situacion;
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
