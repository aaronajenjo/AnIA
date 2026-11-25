export async function postAniaJson<T = any>(
  url: string,
  body: unknown,
  fallbackErrorMessage = 'No se pudo completar la petición en este momento.'
): Promise<T> {
  const maxAttempts = 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      throw new Error(
        'No se pudo conectar con el servidor de AnIA. Comprueba tu conexión o inténtalo en unos segundos.'
      );
    }

    const rawText = await res.text();
    const trimmed = rawText.trim();
    const looksLikeHtml = trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype');

    if (!trimmed || looksLikeHtml) {
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      throw new Error(
        'El servidor de AnIA se estaba reiniciando y devolvió una página temporal en lugar de datos. Vuelve a intentarlo ahora.'
      );
    }

    let data: any;
    try {
      data = JSON.parse(trimmed);
    } catch {
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      throw new Error(
        'El servidor devolvió una respuesta inesperada. Recarga la página o inténtalo de nuevo en unos segundos.'
      );
    }

    if (!res.ok) {
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        continue;
      }
      throw new Error(data?.error || fallbackErrorMessage);
    }

    return data as T;
  }

  throw new Error(fallbackErrorMessage);
}
