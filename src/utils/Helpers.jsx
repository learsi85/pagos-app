const descargarPdf = async (fetchFn, filename) => {
  try {
    const r = await fetchFn();
    const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    toast.error('No se pudo generar el PDF');
  }
};