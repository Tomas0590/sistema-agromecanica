import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cuit = searchParams.get('cuit');

  if (!cuit || cuit.length !== 11) {
    return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 });
  }

  try {
    // 1. Consulta al BCRA
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

    // 2. Consulta de respaldo a AFIP pública
    const resAfip = await fetch(`https://afip.republica.dev/cuit/${cuit}`);
    if (resAfip.ok) {
      const dataAfip = await resAfip.json();
      if (dataAfip.razon_social || dataAfip.nombre) {
        return NextResponse.json({
          razonSocial: dataAfip.razon_social || dataAfip.nombre,
          direccion: dataAfip.domicilio || '',
          condicionIva: dataAfip.condicion_iva || 'Monotributo',
          origen: 'AFIP'
        });
      }
    }

    return NextResponse.json({ error: 'No se encontraron datos' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Error en la consulta' }, { status: 500 });
  }
}
