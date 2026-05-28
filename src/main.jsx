import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Building2, Users, FileText, Wrench, Camera, Package, RefreshCcw, Settings, Trash2, Pencil, Plus, Upload, Save, FileDown, CheckCircle2 } from 'lucide-react'
import './styles.css'

const EMPRESAS = [
  { id: 'emp-1', nombre: 'SERVITEC BIOMÉDICA S.A.C.', comercial: 'SERVITEC PRO', ruc: '20600000001', direccion: 'Cajamarca - Perú', telefono: '999 999 999', correo: 'contacto@servitec.pe' },
  { id: 'emp-2', nombre: 'BIOMEDICAL SERVICE GROUP S.A.C.', comercial: 'BMSG', ruc: '20600000002', direccion: 'Lima - Perú', telefono: '988 888 888', correo: 'ventas@bmsg.pe' }
]

const BANCO_ACTIVIDADES = [
  'Revisión general de la máquina incluido generador y diagnóstico técnico del especialista.',
  'Mantenimiento del motor.',
  'Mantenimiento y calibración de bomba de combustible de grupo electrógeno.',
  'Cambio de aceite del motor.',
  'Cambio de filtros de aceite, combustible y aire.',
  'Limpieza de inyectores si aplica.',
  'Verificación del sistema de refrigeración.',
  'Revisión de correas y ajuste.',
  'Inspección de fugas.',
  'Medición de parámetros eléctricos: voltaje, corriente y frecuencia.',
  'Medición de aislamiento con megger.',
  'Ajuste de conexiones eléctricas.',
  'Verificación de puesta a tierra.',
  'Prueba y limpieza de baterías.',
  'Verificación del cargador de baterías.',
  'Limpieza interna del ATS.',
  'Prueba de transferencia automática.',
]

function money(value) {
  const n = Number(value || 0)
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function App() {
  const [empresaId, setEmpresaId] = useState(EMPRESAS[0].id)
  const empresa = EMPRESAS.find(e => e.id === empresaId) || EMPRESAS[0]
  const [view, setView] = useState('dashboard')
  const [cliente, setCliente] = useState({ nombre: '', establecimiento: '', area: '', solicitante: '', cargo: '', requerimiento: '', referencia: '' })
  const [actividadForm, setActividadForm] = useState({ descripcion: '', cantidad: 1, precio: 0 })
  const [actividades, setActividades] = useState([])
  const [seleccionadas, setSeleccionadas] = useState([])
  const [editId, setEditId] = useState(null)
  const [equipos, setEquipos] = useState([{ equipo: 'Grupo electrógeno', marca: '', modelo: '', serie: '', codigo: '' }])

  const total = useMemo(() => actividades.reduce((sum, a) => sum + Number(a.cantidad || 0) * Number(a.precio || 0), 0), [actividades])

  const stats = [
    ['Clientes', cliente.nombre ? 1 : 0],
    ['Establecimientos', cliente.establecimiento ? 1 : 0],
    ['Áreas usuarias', cliente.area ? 1 : 0],
    ['Cotizaciones', actividades.length ? 1 : 0],
    ['Ejecuciones', 0],
  ]

  function limpiarForm() {
    setActividadForm({ descripcion: '', cantidad: 1, precio: 0 })
    setEditId(null)
  }

  function agregarOActualizarActividad() {
    const descripcion = actividadForm.descripcion.trim()
    if (!descripcion) return alert('Ingresa la descripción de la actividad.')
    const item = { id: editId || crypto.randomUUID(), descripcion, cantidad: Number(actividadForm.cantidad || 1), precio: Number(actividadForm.precio || 0) }
    if (editId) setActividades(prev => prev.map(a => a.id === editId ? item : a))
    else setActividades(prev => [...prev, item])
    limpiarForm()
  }

  function importarActividades() {
    const nuevas = BANCO_ACTIVIDADES.map(descripcion => ({ id: crypto.randomUUID(), descripcion, cantidad: 1, precio: 0 }))
    setActividades(nuevas)
    setSeleccionadas([])
  }

  function editarSeleccionada() {
    if (seleccionadas.length !== 1) return alert('Selecciona una sola actividad para editar.')
    const item = actividades.find(a => a.id === seleccionadas[0])
    if (!item) return
    setEditId(item.id)
    setActividadForm({ descripcion: item.descripcion, cantidad: item.cantidad, precio: item.precio })
  }

  function eliminarSeleccionadas() {
    if (!seleccionadas.length) return alert('Selecciona una o varias actividades para eliminar.')
    if (!confirm(`¿Eliminar ${seleccionadas.length} actividad(es)?`)) return
    setActividades(prev => prev.filter(a => !seleccionadas.includes(a.id)))
    setSeleccionadas([])
    limpiarForm()
  }

  function toggleActividad(id) {
    setSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function actualizarActividadInline(id, campo, valor) {
    setActividades(prev => prev.map(a => a.id === id ? { ...a, [campo]: campo === 'descripcion' ? valor : Number(valor || 0) } : a))
  }

  function imprimirPDF() {
    window.print()
  }

  return (
    <div className="app">
      <aside className="sidebar no-print">
        <div className="brand"><div className="logo">V12</div><div><b>SERVITEC PRO</b><span>Producción real</span></div></div>
        <label className="label">Empresa activa</label>
        <select value={empresaId} onChange={e => setEmpresaId(e.target.value)}>{EMPRESAS.map(e => <option key={e.id} value={e.id}>{e.comercial}</option>)}</select>
        <nav>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}><Building2 size={18}/>Dashboard</button>
          <button onClick={() => setView('empresas')}><Building2 size={18}/>Empresas</button>
          <button onClick={() => setView('clientes')}><Users size={18}/>Clientes</button>
          <button className={view === 'cotizaciones' ? 'active' : ''} onClick={() => setView('cotizaciones')}><FileText size={18}/>Cotizaciones</button>
          <button><Wrench size={18}/>Ejecución</button>
          <button><Camera size={18}/>Evidencias</button>
          <button><Package size={18}/>Inventario</button>
          <button><RefreshCcw size={18}/>Sync</button>
          <button><Settings size={18}/>Configuración</button>
        </nav>
      </aside>

      <main className="main">
        <header className="top">
          <div><h1>SERVITEC PRO · V12.6 PRODUCCIÓN</h1><p>{empresa.nombre} · RUC {empresa.ruc}</p></div>
          <button className="success no-print"><CheckCircle2 size={18}/> Sistema estable</button>
        </header>

        {view === 'dashboard' && <section>
          <div className="cards">{stats.map(([k,v]) => <div className="card" key={k}><span>{k}</span><b>{v}</b></div>)}</div>
          <div className="panel"><h2>Flujo V12.6 Producción</h2><ol><li>Empresa activa al inicio.</li><li>Cliente → establecimiento → área usuaria.</li><li>Actividades en tabla editable, sin tarjetas duplicadas.</li><li>Importación solo carga descripción; cantidad y precio se validan manualmente.</li><li>Total y vista de impresión calculan en vivo.</li></ol></div>
        </section>}

        {view === 'empresas' && <div className="panel"><h2>Empresas</h2><p><b>{empresa.nombre}</b></p><p>RUC: {empresa.ruc}</p><p>Dirección: {empresa.direccion}</p><p>{empresa.telefono} · {empresa.correo}</p></div>}

        {view === 'clientes' && <ClienteForm cliente={cliente} setCliente={setCliente}/>}        

        {view === 'cotizaciones' && <section className="grid2">
          <div className="panel no-print">
            <h2>Datos de cotización</h2>
            <ClienteForm cliente={cliente} setCliente={setCliente} compacto />
            <h3>Equipo incluido</h3>
            {equipos.map((eq, i) => <div className="row" key={i}>{['equipo','marca','modelo','serie','codigo'].map(c => <input key={c} placeholder={c} value={eq[c]} onChange={e => setEquipos(prev => prev.map((x,idx)=> idx===i?{...x,[c]:e.target.value}:x))}/>)}</div>)}
          </div>

          <div className="panel full">
            <div className="sectionHead"><h2>Actividades generales</h2><span>{actividades.length} agregadas</span></div>
            <div className="addBox no-print">
              <input placeholder="Descripción de actividad" value={actividadForm.descripcion} onChange={e => setActividadForm({...actividadForm, descripcion: e.target.value})}/>
              <input type="number" min="1" placeholder="Cantidad" value={actividadForm.cantidad} onChange={e => setActividadForm({...actividadForm, cantidad: e.target.value})}/>
              <input type="number" min="0" step="0.01" placeholder="Precio" value={actividadForm.precio} onChange={e => setActividadForm({...actividadForm, precio: e.target.value})}/>
              <button onClick={agregarOActualizarActividad}><Plus size={18}/>{editId ? 'Actualizar' : 'Agregar'}</button>
              {editId && <button className="secondary" onClick={limpiarForm}>Cancelar</button>}
            </div>

            <div className="toolbar no-print">
              <button onClick={importarActividades}><Upload size={18}/>Importar actividades generales</button>
              <button onClick={editarSeleccionada} disabled={seleccionadas.length !== 1}><Pencil size={18}/>Editar seleccionada</button>
              <button className="danger" onClick={eliminarSeleccionadas} disabled={!seleccionadas.length}><Trash2 size={18}/>Eliminar seleccionadas</button>
              <button className="success" onClick={() => alert('Cambios guardados en memoria del navegador.')}><Save size={18}/>Guardar cambios</button>
              <button onClick={imprimirPDF}><FileDown size={18}/>PDF / Imprimir</button>
            </div>

            <ActividadTabla actividades={actividades} seleccionadas={seleccionadas} toggleActividad={toggleActividad} actualizar={actualizarActividadInline}/>
            <div className="total"><span>Total general</span><b>{money(total)}</b></div>
          </div>

          <VistaPrevia empresa={empresa} cliente={cliente} actividades={actividades} equipos={equipos} total={total}/>
        </section>}
      </main>
    </div>
  )
}

function ClienteForm({ cliente, setCliente, compacto=false }) {
  const campos = [['nombre','Cliente'],['establecimiento','Establecimiento'],['area','Área usuaria'],['solicitante','Solicitante'],['cargo','Cargo'],['requerimiento','N° requerimiento'],['referencia','Referencia']]
  return <div className={compacto ? 'form compacto' : 'panel form'}>{!compacto && <h2>Clientes</h2>}{campos.map(([k,p]) => <input key={k} placeholder={p} value={cliente[k]} onChange={e => setCliente({...cliente, [k]: e.target.value})}/>)}</div>
}

function ActividadTabla({ actividades, seleccionadas, toggleActividad, actualizar }) {
  return <div className="tableWrap"><table><thead><tr><th className="no-print">Sel.</th><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{actividades.length === 0 ? <tr><td colSpan="6" className="empty">Sin actividades. Importa o agrega manualmente.</td></tr> : actividades.map((a,i) => <tr key={a.id} className={seleccionadas.includes(a.id) ? 'selected' : ''}><td className="no-print"><input type="checkbox" checked={seleccionadas.includes(a.id)} onChange={() => toggleActividad(a.id)}/></td><td>{i+1}</td><td><textarea value={a.descripcion} onChange={e => actualizar(a.id,'descripcion',e.target.value)}/></td><td><input type="number" min="1" value={a.cantidad} onChange={e => actualizar(a.id,'cantidad',e.target.value)}/></td><td><input type="number" min="0" step="0.01" value={a.precio} onChange={e => actualizar(a.id,'precio',e.target.value)}/></td><td><b>{money(Number(a.cantidad||0)*Number(a.precio||0))}</b></td></tr>)}</tbody></table></div>
}

function VistaPrevia({ empresa, cliente, actividades, equipos, total }) {
  return <div className="preview print-area">
    <div className="quoteHeader"><div className="miniLogo">S</div><div><h2>{empresa.nombre}</h2><p>RUC {empresa.ruc} · {empresa.direccion}</p><p>{empresa.telefono} · {empresa.correo}</p></div></div>
    <hr/>
    <h2>COTIZACIÓN DE SERVICIO</h2>
    <div className="quoteGrid"><p><b>Cliente:</b> {cliente.nombre || '-'}</p><p><b>Establecimiento:</b> {cliente.establecimiento || '-'}</p><p><b>Área usuaria:</b> {cliente.area || '-'}</p><p><b>Solicitante:</b> {cliente.solicitante || '-'}</p><p><b>Cargo:</b> {cliente.cargo || '-'}</p><p><b>N° requerimiento:</b> {cliente.requerimiento || '-'}</p><p><b>Referencia:</b> {cliente.referencia || '-'}</p><p><b>Fecha:</b> {new Date().toLocaleDateString('es-PE')}</p></div>
    <h3>Actividades generales</h3>
    <table className="printTable"><thead><tr><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{actividades.map((a,i)=><tr key={a.id}><td>{i+1}</td><td>{a.descripcion}</td><td>{a.cantidad}</td><td>{money(a.precio)}</td><td>{money(Number(a.cantidad||0)*Number(a.precio||0))}</td></tr>)}</tbody></table>
    <h3>Equipos incluidos</h3>
    <table className="printTable"><thead><tr><th>#</th><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th><th>Código</th></tr></thead><tbody>{equipos.map((e,i)=><tr key={i}><td>{i+1}</td><td>{e.equipo}</td><td>{e.marca}</td><td>{e.modelo}</td><td>{e.serie}</td><td>{e.codigo}</td></tr>)}</tbody></table>
    <div className="total"><span>Total cotizado</span><b>{money(total)}</b></div>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
