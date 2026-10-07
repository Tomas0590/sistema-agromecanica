import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cuit = searchParams.get('cuit');

  if (!cuit) {
    return NextResponse.json({ error: 'CUIT requerido' }, { status: 400 });
  }

  const cleanCuit = cuit.replace(/\D/g, '');

  try {
    const res = await fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cleanCuit}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'No encontrado en BCRA' }, { status: 404 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al conectar con BCRA' }, { status: 500 });
  }
}
