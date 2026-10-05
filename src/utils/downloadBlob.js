export async function descargarPdf(fetchFn, filename) {
  try {
    const r = await fetchFn();
    const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    throw e; // lo captura el componente que lo llama, para mostrar el toast
  }
}