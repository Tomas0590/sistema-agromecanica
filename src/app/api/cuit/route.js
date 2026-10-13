import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cuit = searchParams.get('cuit');

  if (!cuit || cuit.length !== 11) {
    return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 });
  }

  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  // 1. FUENTE 1: BCRA (Central de Deudores)
  try {
    const resBcra = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuit}`, {
      headers: customHeaders,
      next: { revalidate: 3600 }
    });

    if (resBcra.ok) {
      const dataBcra = await resBcra.json();
      if (dataBcra?.results?.denominacion) {
        return NextResponse.json({
          razonSocial: dataBcra.results.denominacion,
          origen: 'BCRA'
        });
      }
    }
  } catch (err) {
    // Continuar al siguiente proveedor si falla
  }

  // 2. FUENTE 2: Padrón AFIP Abierto (republica.dev)
  try {
    const resAfip = await fetch(`https://afip.republica.dev/cuit/${cuit}`, { headers: customHeaders });
    if (resAfip.ok) {
      const dataAfip = await resAfip.json();
      const nombre = dataAfip.razon_social || dataAfip.nombre || dataAfip.denominacion;
      if (nombre) {
        return NextResponse.json({
          razonSocial: nombre,
          direccion: dataAfip.domicilio || '',
          condicionIva: dataAfip.condicion_iva || 'Monotributo',
          origen: 'AFIP'
        });
      }
    }
  } catch (err) {
    // Continuar al siguiente proveedor si falla
  }

  // 3. FUENTE 3: Padrón secundario AFIP / padron.ar
  try {
    const resPadron = await fetch(`https://padron.ar/api/cuit/${cuit}`, { headers: customHeaders });
    if (resPadron.ok) {
      const dataPadron = await resPadron.json();
      const nombre = dataPadron.razon_social || dataPadron.nombre || dataPadron.denominacion || dataPadron.razonSocial;
      if (nombre) {
        return NextResponse.json({
          razonSocial: nombre,
          direccion: dataPadron.direccion || dataPadron.domicilio || '',
          condicionIva: dataPadron.condicionIva || dataPadron.condicion_iva || 'Monotributo',
          origen: 'Padrón AFIP'
        });
      }
    }
  } catch (err) {
    // Continuar al siguiente proveedor si falla
  }

  // 4. FUENTE 4: Registro de Cheques Rechazados BCRA
  try {
    const resCheques = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cuit}`, { headers: customHeaders });
    if (resCheques.ok) {
      const dataCheques = await resCheques.json();
      if (dataCheques?.results?.denominacion) {
        return NextResponse.json({
          razonSocial: dataCheques.results.denominacion,
          origen: 'BCRA Cheques'
        });
      }
    }
  } catch (err) {
    // Continuar al siguiente proveedor si falla
  }

  return NextResponse.json({ error: 'No se encontraron datos automáticos' }, { status: 404 });
}
