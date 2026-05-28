import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Building2, Users, FileText, Wrench, Camera, Package, RefreshCw, Settings, Plus, Edit3, Trash2, Save, Printer, Upload, CheckCircle } from 'lucide-react'
import './styles.css'

const STORAGE_KEY = 'servitec_v12_9_data'
const defaultData = {
  empresas: [{ id: 'emp1', razon: 'SERVITEC BIOMÉDICA S.A.C.', nombre: 'SERVITEC PRO', ruc: '20600000001', direccion: 'Cajamarca - Perú', telefono: '999 999 999', email: 'contacto@servitec.pe' }],
  clientes: [
    { id: 'cli1', nombre: 'Hospital Regional', ruc: '', contacto: '', establecimientos: [
      { id: 'est1', nombre: 'Sede principal', direccion: '', areas: [{ id: 'area1', nombre: 'Mantenimiento', responsable: '' }] }
    ]}
  ],
  cotizaciones: []
}
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData } catch { return defaultData } }
const uid = () => Math.random().toString(36).slice(2, 9)

function App(){
  const [data,setData] = useState(load)
  const [view,setView] = useState('dashboard')
  const [empresaId,setEmpresaId] = useState(data.empresas[0]?.id || '')
  const empresa = data.empresas.find(e=>e.id===empresaId) || data.empresas[0]
  const saveData = (next) => { setData(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo">V12</div><div><b>SERVITEC PRO</b><span>Producción estable</span></div></div>
      <label>Empresa activa</label>
      <select value={empresaId} onChange={e=>setEmpresaId(e.target.value)}>{data.empresas.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
      <Nav icon={<Building2/>} text="Dashboard" id="dashboard" view={view} setView={setView}/>
      <Nav icon={<Building2/>} text="Empresas" id="empresas" view={view} setView={setView}/>
      <Nav icon={<Users/>} text="Clientes" id="clientes" view={view} setView={setView}/>
      <Nav icon={<FileText/>} text="Cotizaciones" id="cotizaciones" view={view} setView={setView}/>
      <Nav icon={<Wrench/>} text="Ejecución" id="ejecucion" view={view} setView={setView}/>
      <Nav icon={<Camera/>} text="Evidencias" id="evidencias" view={view} setView={setView}/>
      <Nav icon={<Package/>} text="Inventario" id="inventario" view={view} setView={setView}/>
      <Nav icon={<RefreshCw/>} text="Sync" id="sync" view={view} setView={setView}/>
      <Nav icon={<Settings/>} text="Configuración" id="config" view={view} setView={setView}/>
    </aside>
    <main className="main">
      <header><div><h1>SERVITEC PRO · V12.9 RESCATE TOTAL</h1><p>{empresa?.razon} · RUC {empresa?.ruc}</p></div><div className="status"><CheckCircle size={18}/> Sistema estable</div></header>
      {view==='dashboard' && <Dashboard data={data}/>} 
      {view==='clientes' && <Clientes data={data} saveData={saveData}/>} 
      {view==='cotizaciones' && <Cotizaciones data={data} saveData={saveData} empresa={empresa}/>} 
      {!['dashboard','clientes','cotizaciones'].includes(view) && <Card><h2>{view[0].toUpperCase()+view.slice(1)}</h2><p>Módulo preparado para la siguiente fase.</p></Card>}
    </main>
  </div>
}
function Nav({icon,text,id,view,setView}){return <button className={'nav '+(view===id?'active':'')} onClick={()=>setView(id)}>{React.cloneElement(icon,{size:18})}<span>{text}</span></button>}
function Card({children}){return <section className="card">{children}</section>}
function Dashboard({data}){return <><div className="cards"><Mini title="Clientes" n={data.clientes.length}/><Mini title="Cotizaciones" n={data.cotizaciones.length}/><Mini title="Empresas" n={data.empresas.length}/><Mini title="Ejecuciones" n="0"/></div><Card><h2>Flujo restaurado</h2><ol><li>Cliente → establecimientos → áreas usuarias.</li><li>Cotización con tipo de servicio y configuración.</li><li>Actividades en tabla, con selección, edición y eliminación múltiple.</li><li>PDF/impresión con datos completos.</li></ol></Card></>}
function Mini({title,n}){return <div className="mini"><span>{title}</span><b>{n}</b></div>}


function Clientes({data,saveData}){
  const [clienteId,setClienteId]=useState(data.clientes[0]?.id||'')
  const cliente=data.clientes.find(c=>c.id===clienteId)
  const commitCliente=(nextCliente)=>saveData({...data, clientes:data.clientes.map(c=>c.id===nextCliente.id?nextCliente:c)})
  const addCliente=()=>{const c={id:uid(),nombre:'Nuevo cliente',ruc:'',contacto:'',establecimientos:[]}; saveData({...data,clientes:[...data.clientes,c]}); setClienteId(c.id)}
  const updateField=(field,value)=>{ if(cliente) commitCliente({...cliente,[field]:value}) }
  const addEst=()=>{ if(cliente) commitCliente({...cliente,establecimientos:[...cliente.establecimientos,{id:uid(),nombre:'Nuevo establecimiento',direccion:'',areas:[]}]}) }
  const updateEst=(estId,patch)=>{ commitCliente({...cliente,establecimientos:cliente.establecimientos.map(e=>e.id===estId?{...e,...patch}:e)}) }
  const addArea=(estId)=>{ commitCliente({...cliente,establecimientos:cliente.establecimientos.map(e=>e.id===estId?{...e,areas:[...e.areas,{id:uid(),nombre:'Nueva área usuaria',responsable:''}]}:e)}) }
  const updateArea=(estId,areaId,value)=>{ commitCliente({...cliente,establecimientos:cliente.establecimientos.map(e=>e.id===estId?{...e,areas:e.areas.map(a=>a.id===areaId?{...a,nombre:value}:a)}:e)}) }
  return <Card>
    <div className="row between"><h2>Clientes</h2><button onClick={addCliente}><Plus size={16}/> Nuevo cliente</button></div>
    <div className="grid2">
      <select value={clienteId} onChange={e=>setClienteId(e.target.value)}>{data.clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
      <input value={cliente?.ruc||''} onChange={e=>updateField('ruc',e.target.value)} placeholder="RUC"/>
    </div>
    <input value={cliente?.nombre||''} onChange={e=>updateField('nombre',e.target.value)} placeholder="Nombre del cliente"/>
    <div className="row between"><h3>Establecimientos</h3><button onClick={addEst}><Plus size={16}/> Agregar establecimiento</button></div>
    {(cliente?.establecimientos||[]).map(est=><div className="subcard" key={est.id}>
      <input value={est.nombre} onChange={e=>updateEst(est.id,{nombre:e.target.value})} placeholder="Establecimiento"/>
      <input value={est.direccion} onChange={e=>updateEst(est.id,{direccion:e.target.value})} placeholder="Dirección"/>
      <div className="row between"><b>Áreas usuarias</b><button onClick={()=>addArea(est.id)}>+ Área</button></div>
      {est.areas.map(a=><input key={a.id} value={a.nombre} onChange={e=>updateArea(est.id,a.id,e.target.value)} placeholder="Área usuaria"/>)}
    </div>)}
  </Card>
}
const imports = ['Revisión general de la máquina incluido generador y diagnóstico técnico del especialista.','Mantenimiento del motor','Mantenimiento y calibración de bomba de combustible de grupo electrógeno.','Cambio de aceite del motor','Cambio de filtros de aceite','Limpieza de inyectores si aplica','Verificación del sistema de refrigeración','Revisión de correas y ajuste','Inspección de fugas','Medición de parámetros eléctricos','Medición de aislamiento con megger','Ajuste de conexiones eléctricas','Verificación de puesta a tierra','Prueba y limpieza de baterías','Verificación del cargador de baterías','Limpieza interna del ATS','Prueba de transferencia automática']
function Cotizaciones({data,saveData,empresa}){
  const [form,setForm]=useState({cliente:'',establecimiento:'',area:'',solicitante:'',cargo:'',req:'',ref:'',tipoServicio:'Mantenimiento preventivo',config:'ACTIVIDADES_GENERALES_EQUIPOS_MULTIPLES',equipo:'Grupo electrógeno',marca:'',modelo:'',serie:'',codigo:''})
  const [acts,setActs]=useState([]); const [sel,setSel]=useState([]); const [draft,setDraft]=useState({descripcion:'',cantidad:1,precio:0}); const [editId,setEditId]=useState(null)
  const total=useMemo(()=>acts.reduce((s,a)=>s+(Number(a.cantidad)||0)*(Number(a.precio)||0),0),[acts])
  const add=()=>{ if(!draft.descripcion.trim()) return; if(editId){ setActs(acts.map(a=>a.id===editId?{...a,...draft,cantidad:Number(draft.cantidad)||1,precio:Number(draft.precio)||0}:a)); setEditId(null)} else setActs([...acts,{id:uid(),...draft,cantidad:Number(draft.cantidad)||1,precio:Number(draft.precio)||0}]); setDraft({descripcion:'',cantidad:1,precio:0}) }
  const importActs=()=>setActs(imports.map(t=>({id:uid(),descripcion:t,cantidad:1,precio:0})))
  const edit=()=>{ const a=acts.find(x=>x.id===sel[0]); if(a){setDraft({descripcion:a.descripcion,cantidad:a.cantidad,precio:a.precio}); setEditId(a.id)} }
  const del=()=>{setActs(acts.filter(a=>!sel.includes(a.id))); setSel([])}
  const save=()=>{const cot={id:uid(),fecha:new Date().toISOString(),form,acts,total}; saveData({...data,cotizaciones:[...data.cotizaciones,cot]}); alert('Cotización guardada')}
  const print=()=>window.print()
  return <>
    <Card><h2>Datos de cotización</h2><div className="grid2">{['cliente','establecimiento','area','solicitante','cargo','req','ref'].map(k=><input key={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={({cliente:'Cliente',establecimiento:'Establecimiento',area:'Área usuaria',solicitante:'Solicitante',cargo:'Cargo',req:'N° requerimiento',ref:'Referencia'})[k]}/>)}</div>
      <div className="grid2"><select value={form.tipoServicio} onChange={e=>setForm({...form,tipoServicio:e.target.value})}><option>Mantenimiento preventivo</option><option>Mantenimiento correctivo</option><option>Calibración</option><option>Venta de equipo biomédico</option><option>Venta de repuestos/accesorios</option><option>Servicio + repuestos</option></select><select value={form.config} onChange={e=>setForm({...form,config:e.target.value})}><option value="ACTIVIDADES_GENERALES_EQUIPOS_MULTIPLES">Actividades generales → equipos múltiples</option><option value="UN_EQUIPO_VARIAS_ACTIVIDADES">Un equipo → varias actividades</option><option value="EQUIPOS_INDEPENDIENTES">Equipos independientes → actividades propias</option></select></div>
      <h3>Equipo incluido</h3><div className="grid5"><input value={form.equipo} onChange={e=>setForm({...form,equipo:e.target.value})} placeholder="equipo"/><input value={form.marca} onChange={e=>setForm({...form,marca:e.target.value})} placeholder="marca"/><input value={form.modelo} onChange={e=>setForm({...form,modelo:e.target.value})} placeholder="modelo"/><input value={form.serie} onChange={e=>setForm({...form,serie:e.target.value})} placeholder="serie"/><input value={form.codigo} onChange={e=>setForm({...form,codigo:e.target.value})} placeholder="código"/></div></Card>
    <Card><div className="row between"><h2>Actividades generales</h2><b className="pill">{acts.length} agregadas</b></div><div className="activityAdd"><input value={draft.descripcion} onChange={e=>setDraft({...draft,descripcion:e.target.value})} placeholder="Descripción de actividad"/><input type="number" value={draft.cantidad} onChange={e=>setDraft({...draft,cantidad:e.target.value})}/><input type="number" value={draft.precio} onChange={e=>setDraft({...draft,precio:e.target.value})}/><button onClick={add}><Plus size={18}/>{editId?'Actualizar':'Agregar'}</button></div>
      <div className="toolbar"><button onClick={importActs}><Upload size={16}/> Importar actividades generales</button><button disabled={sel.length!==1} onClick={edit}><Edit3 size={16}/> Editar seleccionada</button><button disabled={sel.length<1} className="danger" onClick={del}><Trash2 size={16}/> Eliminar seleccionadas</button><button className="success" onClick={save}><Save size={16}/> Guardar cambios</button><button onClick={print}><Printer size={16}/> PDF / Imprimir</button></div>
      <table><thead><tr><th>Sel.</th><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{acts.length===0?<tr><td colSpan="6" className="empty">Sin actividades. Importa o agrega manualmente.</td></tr>:acts.map((a,i)=><tr key={a.id}><td><input type="checkbox" checked={sel.includes(a.id)} onChange={e=>setSel(e.target.checked?[...sel,a.id]:sel.filter(x=>x!==a.id))}/></td><td>{i+1}</td><td>{a.descripcion}</td><td>{a.cantidad}</td><td>S/ {Number(a.precio).toFixed(2)}</td><td>S/ {(a.cantidad*a.precio).toFixed(2)}</td></tr>)}</tbody></table><h2 className="total">Total general S/ {total.toFixed(2)}</h2></Card>
    <section className="printArea"><h1>{empresa?.razon}</h1><p>RUC {empresa?.ruc}</p><h2>Cotización</h2><p><b>Cliente:</b> {form.cliente} · <b>Tipo:</b> {form.tipoServicio}</p><p><b>Configuración:</b> {form.config}</p><table><thead><tr><th>#</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{acts.map((a,i)=><tr key={a.id}><td>{i+1}</td><td>{a.descripcion}</td><td>{a.cantidad}</td><td>S/ {Number(a.precio).toFixed(2)}</td><td>S/ {(a.cantidad*a.precio).toFixed(2)}</td></tr>)}</tbody></table><h2>Total S/ {total.toFixed(2)}</h2></section>
  </>
}

createRoot(document.getElementById('root')).render(<App />)
