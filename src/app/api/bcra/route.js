import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cuit = searchParams.get('cuit');

  if (!cuit) {
    return NextResponse.json({ error: 'CUIT requerido' }, { status: 400 });
  }

  const cleanCuit = cuit.replace(/\D/g, '');
  if (cleanCuit.length !== 11) {
    return NextResponse.json({ error: 'CUIT inválido' }, { status: 400 });
  }

  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
  };

  let peorSituacion = 1;
  let totalChequesRechazados = 0;

  try {
    // Consultamos Deudas y Cheques Rechazados en paralelo
    const [resDeudas, resCheques] = await Promise.all([
      fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/${cleanCuit}`, {
        headers: customHeaders,
        cache: 'no-store'
      }).catch(() => null),

      fetch(`https://api.bcra.gob.ar/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cleanCuit}`, {
        headers: customHeaders,
        cache: 'no-store'
      }).catch(() => null)
    ]);

    // 1. Procesar Situación de Deudas
    if (resDeudas && resDeudas.ok) {
      const dataDeudas = await resDeudas.json();
      const periodos = dataDeudas?.results?.periodos || dataDeudas?.periodos;
      if (periodos?.[0]?.entidades) {
        periodos[0].entidades.forEach((e) => {
          const sit = Number(e.situacion || e.Situacion || 1);
          if (sit > peorSituacion) peorSituacion = sit;
        });
      }
    }

    // 2. Procesar Cheques Rechazados
    if (resCheques && resCheques.ok) {
      const dataCheques = await resCheques.json();
      const causas = dataCheques?.results?.causales || dataCheques?.results || dataCheques?.causales;
      
      if (Array.isArray(causas)) {
        // Sumamos la cantidad de cheques según la estructura del BCRA
        causas.forEach((item) => {
          if (item.cantidadRechazos) {
            totalChequesRechazados += Number(item.cantidadRechazos);
          } else if (item.entidades) {
            item.entidades.forEach((ent) => {
              totalChequesRechazados += Number(ent.cantidad || ent.cantidadRechazos || 1);
            });
          } else {
            totalChequesRechazados += 1;
          }
        });
      } else if (dataCheques?.results?.cheques) {
        totalChequesRechazados = dataCheques.results.cheques.length;
      }
    }

    return NextResponse.json({
      situacion: peorSituacion,
      chequesRechazados: totalChequesRechazados
    });

  } catch (error) {
    return NextResponse.json({
      situacion: peorSituacion,
      chequesRechazados: totalChequesRechazados,
      error: 'Error parcial al consultar BCRA'
    });
  }
}
