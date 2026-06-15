import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { clientesApi, productosApi, financiamientosApi } from '@/services/api';
import { fmt } from '@/utils/format';

const schema = z.object({
  cliente_id:     z.coerce.number().positive('Selecciona un cliente'),
  producto_id:    z.coerce.number().positive('Selecciona un producto'),
  precio_producto:z.coerce.number().positive('Requerido'),
  enganche:       z.coerce.number().min(0).default(0),
  tipo_interes:   z.enum(['NINGUNO','PORCENTAJE','MONTO_FIJO']),
  valor_interes:  z.coerce.number().min(0).default(0),
  numero_pagos:   z.coerce.number().int().positive('Requerido'),
  frecuencia_pago:z.enum(['SEMANAL','QUINCENAL','MENSUAL']),
  fecha_inicio:   z.string().min(1, 'Requerido'),
  notas:          z.string().optional(),
});

export default function FinanciamientoNuevo() {
  const navigate      = useNavigate();
  const [params]      = useSearchParams();
  const [clientes,    setClientes]  = useState([]);
  const [productos,   setProductos] = useState([]);
  const [corrida,     setCorrida]   = useState(null);
  const [simulating,  setSim]       = useState(false);
  const [saving,      setSaving]    = useState(false);

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_interes:    'NINGUNO',
      frecuencia_pago: 'MENSUAL',
      enganche:        0,
      valor_interes:   0,
      fecha_inicio:    new Date().toISOString().slice(0, 10),
      cliente_id:      params.get('cliente_id') || '',
    },
  });

  const tipoInteres  = useWatch({ control, name: 'tipo_interes' });
  const productoId   = useWatch({ control, name: 'producto_id' });

  useEffect(() => {
    Promise.all([clientesApi.list(), productosApi.list()]).then(([rc, rp]) => {
      setClientes(rc.data);
      setProductos(rp.data.filter((p) => p.IsActive));
    });
  }, []);

  // Al seleccionar producto → rellenar precio
  useEffect(() => {
    if (!productoId) return;
    const prod = productos.find((p) => p.ProductoId === +productoId);
    if (prod) setValue('precio_producto', prod.PrecioBase);
  }, [productoId, productos]);

  const simular = async (data) => {
    setSim(true);
    try {
      // Usamos el endpoint de simulación (id arbitrario, el backend no lo usa para simular)
      const r = await financiamientosApi.simular(0, data);
      setCorrida(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al simular');
    } finally {
      setSim(false);
    }
  };

  const onSubmit = async (data) => {
    if (!corrida) { toast.error('Primero simula la corrida'); return; }
    setSaving(true);
    try {
      const r = await financiamientosApi.create(data);
      toast.success('Financiamiento creado');
      navigate(`/financiamientos/${r.data.financiamiento_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.wrap}>
      <button style={s.back} onClick={() => navigate('/financiamientos')}>← Financiamientos</button>
      <h1 style={s.title}>Nuevo financiamiento</h1>

      <div style={s.layout}>
        {/* Formulario izquierdo */}
        <div style={s.formCard}>
          <form id="fin-form" onSubmit={handleSubmit(onSubmit)}>
            <Section title="1. Cliente y producto">
              <F label="Cliente *" error={errors.cliente_id?.message}>
                <select {...register('cliente_id')} style={s.input}>
                  <option value="">— Selecciona —</option>
                  {clientes.map((c) => (
                    <option key={c.ClienteId} value={c.ClienteId}>
                      {c.ApellidoPaterno} {c.ApellidoMaterno || ''}, {c.Nombre}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Producto *" error={errors.producto_id?.message}>
                <select {...register('producto_id')} style={s.input}>
                  <option value="">— Selecciona —</option>
                  {productos.map((p) => (
                    <option key={p.ProductoId} value={p.ProductoId}>
                      {p.Nombre} — {fmt.money(p.PrecioBase)}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Precio del producto (MXN) *" error={errors.precio_producto?.message}>
                <input {...register('precio_producto')} type="number" step="0.01" style={s.input} />
              </F>
              <F label="Enganche (MXN)" error={errors.enganche?.message}>
                <input {...register('enganche')} type="number" step="0.01" min="0" style={s.input} />
              </F>
            </Section>

            <Section title="2. Interés">
              <F label="Tipo de interés" error={errors.tipo_interes?.message}>
                <select {...register('tipo_interes')} style={s.input}>
                  <option value="NINGUNO">Sin interés</option>
                  <option value="PORCENTAJE">Por porcentaje (%)</option>
                  <option value="MONTO_FIJO">Monto fijo (MXN)</option>
                </select>
              </F>
              {tipoInteres !== 'NINGUNO' && (
                <F
                  label={tipoInteres === 'PORCENTAJE' ? 'Porcentaje de interés' : 'Monto de interés (MXN)'}
                  error={errors.valor_interes?.message}
                >
                  <input {...register('valor_interes')} type="number" step="0.01" min="0" style={s.input} />
                </F>
              )}
            </Section>

            <Section title="3. Plan de pagos">
              <div style={s.twoCol}>
                <F label="Núm. de pagos *" error={errors.numero_pagos?.message}>
                  <input {...register('numero_pagos')} type="number" min="1" style={s.input} />
                </F>
                <F label="Frecuencia" error={errors.frecuencia_pago?.message}>
                  <select {...register('frecuencia_pago')} style={s.input}>
                    <option value="MENSUAL">Mensual</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="SEMANAL">Semanal</option>
                  </select>
                </F>
              </div>
              <F label="Fecha inicio *" error={errors.fecha_inicio?.message}>
                <input {...register('fecha_inicio')} type="date" style={s.input} />
              </F>
            </Section>

            <Section title="4. Notas">
              <F label="Notas (opcional)">
                <textarea {...register('notas')} style={{ ...s.input, minHeight: 70, resize: 'vertical' }} />
              </F>
            </Section>

            <div style={s.formActions}>
              <button
                type="button"
                style={s.btnSec}
                onClick={handleSubmit(simular)}
                disabled={simulating}
              >
                {simulating ? 'Calculando…' : '🔢 Simular corrida'}
              </button>
              <button
                form="fin-form"
                type="submit"
                style={{ ...s.btnPri, opacity: corrida ? 1 : 0.5 }}
                disabled={saving || !corrida}
              >
                {saving ? 'Guardando…' : '✅ Guardar financiamiento'}
              </button>
            </div>
          </form>
        </div>

        {/* Corrida derecha */}
        <div style={s.corridaCol}>
          {!corrida ? (
            <div style={s.corridaEmpty}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ color: '#718096', margin: 0 }}>
                Completa el formulario y presiona<br /><strong>Simular corrida</strong>
              </p>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div style={s.corridaCard}>
                <h3 style={s.corridaTitle}>Resumen</h3>
                <div style={s.resumeGrid}>
                  <RI label="Precio producto"  value={fmt.money(corrida.precio_producto)} />
                  <RI label="Enganche"          value={fmt.money(corrida.enganche)} />
                  <RI label="Monto financiado"  value={fmt.money(corrida.monto_financiado)} />
                  <RI label="Interés"           value={fmt.money(corrida.monto_interes)} />
                  <RI label="Total a pagar"     value={fmt.money(corrida.monto_total_pagar)} highlight />
                  <RI label="Pagos"             value={`${corrida.numero_pagos} × ${fmt.money(corrida.monto_por_pago)}`} />
                </div>
              </div>

              {/* Tabla de pagos */}
              <div style={s.corridaCard}>
                <h3 style={s.corridaTitle}>Corrida de pagos</h3>
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>#</th>
                        <th style={s.th}>Vencimiento</th>
                        <th style={s.th}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {corrida.plan.map((p) => (
                        <tr key={p.numero_pago}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={s.td2}>{p.numero_pago}</td>
                          <td style={s.td2}>{fmt.date(p.fecha_vencimiento)}</td>
                          <td style={{ ...s.td2, fontWeight: 600, color: '#2b6cb0' }}>
                            {fmt.money(p.monto_esperado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
function F({ label, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.errMsg}>{error}</p>}
    </div>
  );
}
function RI({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 13, color: '#718096' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: highlight ? 700 : 600, color: highlight ? '#1a2035' : '#2d3748' }}>
        {value}
      </span>
    </div>
  );
}

const s = {
  wrap:        { padding: '32px 40px', fontFamily: "'Inter','Segoe UI',sans-serif" },
  back:        { background: 'none', border: 'none', color: '#3182ce', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 8 },
  title:       { margin: '0 0 24px', fontSize: 24, fontWeight: 700, color: '#1a2035' },
  layout:      { display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' },
  formCard:    { background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  corridaCol:  { display: 'flex', flexDirection: 'column', gap: 16 },
  corridaEmpty:{ background: '#fff', borderRadius: 12, padding: 40, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', textAlign: 'center' },
  corridaCard: { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  corridaTitle:{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#2d3748' },
  resumeGrid:  { display: 'flex', flexDirection: 'column' },
  twoCol:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  input:       { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' },
  label:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4 },
  errMsg:      { color: '#e53e3e', fontSize: 12, marginTop: 2 },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0', marginTop: 8 },
  btnPri:      { padding: '10px 20px', background: '#1a2035', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSec:      { padding: '10px 20px', background: '#fff', color: '#4a5568', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:          { padding: '8px 10px', textAlign: 'left', color: '#718096', fontWeight: 600, fontSize: 12, borderBottom: '2px solid #f0f0f0', background: '#fafafa', position: 'sticky', top: 0 },
  td2:         { padding: '8px 10px', borderBottom: '1px solid #f7f7f7', color: '#2d3748' },
};
