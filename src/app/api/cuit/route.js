import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cuit = searchParams.get('cuit');

  if (!cuit || cuit.length !== 11) {
    return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 });
  }

  // 1. Consulta al BCRA (Central de Deudores)
  try {
    const resBcra = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cuit}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
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
    // Si falla el BCRA, continúa
  }

  // 2. Consulta a AFIP pública (Padrón Red)
  try {
    const resAfip = await fetch(`https://afip.republica.dev/cuit/${cuit}`);
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
    // Si falla AFIP, continúa
  }

  // 3. Respaldo de Cheques Rechazados BCRA
  try {
    const resCheques = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cuit}`);
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
    // Ignorar error
  }

  return NextResponse.json({ error: 'No se encontraron datos automáticos' }, { status: 404 });
}
