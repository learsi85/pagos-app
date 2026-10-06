async function descargarArchivo(fetchFn, filename, mime) {
  const r = await fetchFn();
  const url = window.URL.createObjectURL(new Blob([r.data], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export const descargarPdf   = (fetchFn, filename) => descargarArchivo(fetchFn, filename, 'application/pdf');
export const descargarExcel = (fetchFn, filename) => descargarArchivo(fetchFn, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');