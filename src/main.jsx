import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Building2, Users, FileText, Wrench, Camera, Package, RefreshCw, Settings, Plus, Save, Trash2, Edit3, Printer, Upload, CheckCircle } from 'lucide-react'
import './styles.css'

const money = n => `S/ ${Number(n || 0).toFixed(2)}`
const uid = () => crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const importedActivities = [
  'Revisión general de la máquina incluido generador y diagnóstico técnico del especialista.',
  'Mantenimiento del motor',
  'Mantenimiento y calibración de bomba de combustible de grupo electrógeno.',
  'Cambio de aceite del motor',
  'Cambio de filtros de aceite',
  'Limpieza de inyectores si aplica',
  'Verificación del sistema de refrigeración',
  'Revisión de correas y ajuste',
  'Inspección de fugas',
  'Medición de parámetros eléctricos',
  'Medición de aislamiento con megger',
  'Ajuste de conexiones eléctricas',
  'Verificación de puesta a tierra',
  'Prueba y limpieza de baterías',
  'Verificación del cargador de baterías',
  'Limpieza interna del ATS',
  'Prueba de transferencia automática'
]

const nav = [['Dashboard',Building2],['Empresas',Building2],['Clientes',Users],['Cotizaciones',FileText],['Ejecución',Wrench],['Evidencias',Camera],['Inventario',Package],['Sync',RefreshCw],['Configuración',Settings]]
const defaultQuote = {clientId:'',establishmentId:'',areaId:'',solicitante:'',cargo:'',requerimiento:'',referencia:'',serviceType:'Mantenimiento preventivo',quoteConfig:'general_to_multiple',equipments:[{id:uid(),nombre:'Grupo electrógeno',marca:'',modelo:'',serie:'',codigo:''}],activities:[]}

function App(){
  const [view,setView]=useState('Dashboard')
  const [clients,setClients]=useState(()=>load('sp_clients_v128',[]))
  const [quote,setQuote]=useState(()=>load('sp_quote_v128',defaultQuote))
  const activeClient=clients.find(c=>c.id===quote.clientId)
  const activeEst=activeClient?.establishments?.find(e=>e.id===quote.establishmentId)
  const activeArea=activeEst?.areas?.find(a=>a.id===quote.areaId)
  const total = quote.activities.reduce((s,a)=>s+Number(a.qty||0)*Number(a.price||0),0)
  const persistClients = next => { setClients(next); save('sp_clients_v128',next) }
  const persistQuote = next => { setQuote(next); save('sp_quote_v128',next) }
  return <div className="app">
    <aside className="side"><div className="brand"><div className="badge">V12</div><div><b>SERVITEC PRO</b><span>Producción real</span></div></div><label>Empresa activa</label><select><option>SERVITEC PRO</option></select>{nav.map(([n,Icon])=><button key={n} onClick={()=>setView(n)} className={view===n?'active':''}><Icon size={18}/>{n}</button>)}</aside>
    <main className="main"><header><div><h1>SERVITEC PRO · V12.8 FLUJO</h1><p>SERVITEC BIOMÉDICA S.A.C. · RUC 20600000001</p></div><div className="stable"><CheckCircle size={16}/> Sistema estable</div></header>
      {view==='Dashboard'&&<Dashboard clients={clients} quote={quote}/>} 
      {view==='Clientes'&&<Clients clients={clients} persist={persistClients}/>} 
      {view==='Cotizaciones'&&<Quotes clients={clients} quote={quote} persistQuote={persistQuote} activeClient={activeClient} activeEst={activeEst} activeArea={activeArea} total={total}/>} 
      {!['Dashboard','Clientes','Cotizaciones'].includes(view)&&<Placeholder title={view}/>} 
    </main>
  </div>
}

function Dashboard({clients,quote}){return <><div className="cards"><Card t="Clientes" v={clients.length}/><Card t="Establecimientos" v={clients.reduce((s,c)=>s+(c.establishments?.length||0),0)}/><Card t="Áreas usuarias" v={clients.reduce((s,c)=>s+(c.establishments||[]).reduce((x,e)=>x+(e.areas?.length||0),0),0)}/><Card t="Actividades" v={quote.activities.length}/></div><section className="panel"><h2>Flujo V12.8 restaurado</h2><ol><li>Cliente → establecimientos → áreas usuarias.</li><li>Cotización recupera tipo de servicio y configuración.</li><li>Configuraciones: varias actividades para un equipo, actividades generales para múltiples equipos y equipos con actividades independientes.</li><li>Actividades en tabla, no tarjetas repetidas.</li></ol></section></>}
function Card({t,v}){return <div className="card"><span>{t}</span><b>{v}</b></div>}
function Placeholder({title}){return <section className="panel"><h2>{title}</h2><p>Módulo preparado para integración con base de datos cloud en V13 multiusuario.</p></section>}

function Clients({clients,persist}){
  const [form,setForm]=useState({cliente:'',ruc:'',direccion:'',establecimiento:'',area:'',responsable:'',telefono:''})
  const [selected,setSelected]=useState(clients[0]?.id||'')
  const current=clients.find(c=>c.id===selected)
  const addAll=()=>{ if(!form.cliente.trim()) return alert('Ingrese el nombre del cliente'); const c={id:uid(), name:form.cliente, ruc:form.ruc, direccion:form.direccion, establishments: form.establecimiento?[{id:uid(), name:form.establecimiento, areas: form.area?[{id:uid(), name:form.area, responsable:form.responsable, telefono:form.telefono}]:[]}]:[]}; persist([...clients,c]); setSelected(c.id); setForm({cliente:'',ruc:'',direccion:'',establecimiento:'',area:'',responsable:'',telefono:''}) }
  const addEst=(clientId)=>{ const name=prompt('Nombre del establecimiento'); if(!name) return; persist(clients.map(c=>c.id===clientId?{...c,establishments:[...(c.establishments||[]),{id:uid(),name,areas:[]}]}:c)) }
  const addArea=(clientId,estId)=>{ const name=prompt('Nombre del área usuaria'); if(!name) return; const responsable=prompt('Solicitante / responsable')||''; persist(clients.map(c=>c.id===clientId?{...c,establishments:c.establishments.map(e=>e.id===estId?{...e,areas:[...(e.areas||[]),{id:uid(),name,responsable,telefono:''}]}:e)}:c)) }
  const delClient=(id)=>{ if(confirm('¿Eliminar cliente completo?')) { const n=clients.filter(c=>c.id!==id); persist(n); setSelected(n[0]?.id||'') } }
  return <section className="panel"><h2>Clientes</h2><p className="hint">Cada cliente puede tener varios establecimientos y cada establecimiento sus áreas usuarias.</p><div className="grid2"><input placeholder="Cliente / razón social" value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})}/><input placeholder="RUC" value={form.ruc} onChange={e=>setForm({...form,ruc:e.target.value})}/><input placeholder="Dirección" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})}/><input placeholder="Establecimiento inicial" value={form.establecimiento} onChange={e=>setForm({...form,establecimiento:e.target.value})}/><input placeholder="Área usuaria inicial" value={form.area} onChange={e=>setForm({...form,area:e.target.value})}/><input placeholder="Solicitante / responsable" value={form.responsable} onChange={e=>setForm({...form,responsable:e.target.value})}/></div><button className="primary" onClick={addAll}><Plus size={18}/> Crear cliente con establecimiento y área</button><div className="split"><div><h3>Clientes registrados</h3>{clients.map(c=><div className={`rowitem ${selected===c.id?'sel':''}`} key={c.id} onClick={()=>setSelected(c.id)}><b>{c.name}</b><span>{c.establishments?.length||0} establecimientos</span></div>)}</div><div><h3>Detalle jerárquico</h3>{!current&&<p className="empty">Sin cliente seleccionado.</p>}{current&&<div className="tree"><div className="treehead"><h3>{current.name}</h3><button className="danger small" onClick={()=>delClient(current.id)}><Trash2 size={15}/>Eliminar cliente</button></div><p>RUC: {current.ruc||'-'} · Dirección: {current.direccion||'-'}</p><button className="light" onClick={()=>addEst(current.id)}><Plus size={16}/> Agregar establecimiento</button>{(current.establishments||[]).map(e=><div className="est" key={e.id}><div className="esttitle"><b>{e.name}</b><button className="light small" onClick={()=>addArea(current.id,e.id)}><Plus size={14}/> Área usuaria</button></div>{(e.areas||[]).map(a=><div className="area" key={a.id}>{a.name}<span>{a.responsable}</span></div>)}</div>)}</div>}</div></div></section>
}

function Quotes({clients,quote,persistQuote,activeClient,activeEst,activeArea,total}){
 const [act,setAct]=useState({desc:'',qty:1,price:0}); const [sel,setSel]=useState([]); const [eq,setEq]=useState({nombre:'',marca:'',modelo:'',serie:'',codigo:''})
 const establishments=activeClient?.establishments||[]; const areas=activeEst?.areas||[]
 const patch=q=>persistQuote({...quote,...q})
 const activitiesTitle = quote.quoteConfig==='general_to_multiple' ? 'Actividades generales para equipos múltiples' : quote.quoteConfig==='one_to_many' ? 'Actividades del equipo seleccionado' : quote.quoteConfig==='independent' ? 'Actividades independientes por equipo' : 'Ítems de servicio / venta'
 const add=()=>{ if(!act.desc.trim()) return; patch({activities:[...quote.activities,{id:uid(),desc:act.desc,qty:Number(act.qty||1),price:Number(act.price||0)}]}); setAct({desc:'',qty:1,price:0}) }
 const importActs=()=>{ const existing=new Set(quote.activities.map(a=>a.desc)); patch({activities:[...quote.activities,...importedActivities.filter(d=>!existing.has(d)).map(d=>({id:uid(),desc:d,qty:1,price:0}))]}) }
 const editOne=()=>{ if(sel.length!==1) return alert('Seleccione una sola actividad para editar.'); const item=quote.activities.find(a=>a.id===sel[0]); const desc=prompt('Descripción', item.desc); if(desc===null) return; const qty=Number(prompt('Cantidad', item.qty) || 0); const price=Number(prompt('Precio', item.price) || 0); patch({activities:quote.activities.map(a=>a.id===item.id?{...a,desc,qty,price}:a)}) }
 const del=()=>{ if(!sel.length) return; if(confirm('¿Eliminar actividades seleccionadas?')) { patch({activities:quote.activities.filter(a=>!sel.includes(a.id))}); setSel([]) } }
 const toggle=id=>setSel(sel.includes(id)?sel.filter(x=>x!==id):[...sel,id])
 const addEquipment=()=>{ if(!eq.nombre.trim()) return alert('Ingrese nombre del equipo'); patch({equipments:[...(quote.equipments||[]),{id:uid(),...eq}]}); setEq({nombre:'',marca:'',modelo:'',serie:'',codigo:''}) }
 const updateEq=(id,key,value)=>patch({equipments:quote.equipments.map(e=>e.id===id?{...e,[key]:value}:e)})
 const delEq=id=>{ if((quote.equipments||[]).length===1) return alert('Debe quedar al menos un equipo.'); patch({equipments:quote.equipments.filter(e=>e.id!==id)}) }
 const print=()=>window.print()
 return <><section className="panel"><h2>Datos de cotización</h2><div className="grid2"><select value={quote.clientId} onChange={e=>patch({clientId:e.target.value,establishmentId:'',areaId:''})}><option value="">Seleccione cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={quote.establishmentId} onChange={e=>patch({establishmentId:e.target.value,areaId:''})}><option value="">Seleccione establecimiento</option>{establishments.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select><select value={quote.areaId} onChange={e=>patch({areaId:e.target.value})}><option value="">Seleccione área usuaria</option>{areas.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><input placeholder="Solicitante" value={quote.solicitante||activeArea?.responsable||''} onChange={e=>patch({solicitante:e.target.value})}/><input placeholder="Cargo" value={quote.cargo} onChange={e=>patch({cargo:e.target.value})}/><input placeholder="N° requerimiento" value={quote.requerimiento} onChange={e=>patch({requerimiento:e.target.value})}/><input placeholder="Referencia" value={quote.referencia} onChange={e=>patch({referencia:e.target.value})}/></div></section>
 <section className="panel"><h2>Tipo y configuración del servicio</h2><div className="grid2"><select value={quote.serviceType} onChange={e=>patch({serviceType:e.target.value})}><option>Mantenimiento preventivo</option><option>Mantenimiento correctivo</option><option>Calibración / verificación</option><option>Venta de equipo biomédico</option><option>Venta de repuestos / accesorios</option><option>Servicio + repuestos</option><option>Diagnóstico técnico</option></select><select value={quote.quoteConfig} onChange={e=>patch({quoteConfig:e.target.value})}><option value="general_to_multiple">Actividades generales → equipos múltiples</option><option value="one_to_many">Un equipo → varias actividades</option><option value="independent">Equipos múltiples → actividades independientes</option><option value="sale">Venta / repuestos / accesorios</option><option value="mixed">Servicio + repuestos</option></select></div><p className="hint"><b>Configuración activa:</b> {quote.quoteConfig==='general_to_multiple'?'Las actividades se aplican a todos los equipos incluidos.':quote.quoteConfig==='one_to_many'?'Un equipo principal con varias actividades.':quote.quoteConfig==='independent'?'Cada equipo puede manejarse como ítem independiente.':quote.quoteConfig==='sale'?'Cotización de venta, repuestos o accesorios.':'Servicio combinado con repuestos/accesorios.'}</p></section>
 <section className="panel"><div className="titlebar"><h2>Equipos incluidos</h2><b>{quote.equipments?.length||0} equipos</b></div><div className="equip addline"><input placeholder="equipo" value={eq.nombre} onChange={e=>setEq({...eq,nombre:e.target.value})}/><input placeholder="marca" value={eq.marca} onChange={e=>setEq({...eq,marca:e.target.value})}/><input placeholder="modelo" value={eq.modelo} onChange={e=>setEq({...eq,modelo:e.target.value})}/><input placeholder="serie" value={eq.serie} onChange={e=>setEq({...eq,serie:e.target.value})}/><input placeholder="código" value={eq.codigo} onChange={e=>setEq({...eq,codigo:e.target.value})}/><button className="primary" onClick={addEquipment}><Plus size={18}/>Agregar equipo</button></div><table><thead><tr><th>#</th><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th><th>Código</th><th></th></tr></thead><tbody>{(quote.equipments||[]).map((e,i)=><tr key={e.id}><td>{i+1}</td><td><input value={e.nombre} onChange={ev=>updateEq(e.id,'nombre',ev.target.value)}/></td><td><input value={e.marca} onChange={ev=>updateEq(e.id,'marca',ev.target.value)}/></td><td><input value={e.modelo} onChange={ev=>updateEq(e.id,'modelo',ev.target.value)}/></td><td><input value={e.serie} onChange={ev=>updateEq(e.id,'serie',ev.target.value)}/></td><td><input value={e.codigo} onChange={ev=>updateEq(e.id,'codigo',ev.target.value)}/></td><td><button className="danger small" onClick={()=>delEq(e.id)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></section>
 <section className="panel"><div className="titlebar"><h2>{activitiesTitle}</h2><b>{quote.activities.length} agregadas</b></div><div className="activityAdd"><input placeholder="Descripción de actividad / ítem" value={act.desc} onChange={e=>setAct({...act,desc:e.target.value})}/><input type="number" value={act.qty} onChange={e=>setAct({...act,qty:e.target.value})}/><input type="number" value={act.price} onChange={e=>setAct({...act,price:e.target.value})}/><button className="primary" onClick={add}><Plus size={18}/>Agregar</button></div><div className="toolbar"><button onClick={importActs} className="primary"><Upload size={18}/>Importar actividades generales</button><button onClick={editOne} className="secondary" disabled={sel.length!==1}><Edit3 size={18}/>Editar seleccionada</button><button onClick={del} className="danger" disabled={!sel.length}><Trash2 size={18}/>Eliminar seleccionadas</button><button onClick={()=>save('sp_quote_v128',quote)} className="success"><Save size={18}/>Guardar cambios</button><button onClick={print} className="primary"><Printer size={18}/>PDF / Imprimir</button></div><table><thead><tr><th>Sel.</th><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{quote.activities.length===0&&<tr><td colSpan="6" className="empty">Sin actividades. Importa o agrega manualmente.</td></tr>}{quote.activities.map((a,i)=><tr key={a.id}><td><input type="checkbox" checked={sel.includes(a.id)} onChange={()=>toggle(a.id)}/></td><td>{i+1}</td><td>{a.desc}</td><td><input className="mini" type="number" value={a.qty} onChange={e=>patch({activities:quote.activities.map(x=>x.id===a.id?{...x,qty:e.target.value}:x)})}/></td><td><input className="mini" type="number" value={a.price} onChange={e=>patch({activities:quote.activities.map(x=>x.id===a.id?{...x,price:e.target.value}:x)})}/></td><td>{money(a.qty*a.price)}</td></tr>)}</tbody></table><div className="total">TOTAL: {money(total)}</div></section><section className="print panel"><h2>Vista PDF</h2><p><b>Tipo:</b> {quote.serviceType} · <b>Configuración:</b> {quote.quoteConfig}</p><p><b>Cliente:</b> {activeClient?.name||'-'} &nbsp; <b>Establecimiento:</b> {activeEst?.name||'-'} &nbsp; <b>Área:</b> {activeArea?.name||'-'}</p><p><b>Solicitante:</b> {quote.solicitante||activeArea?.responsable||'-'} &nbsp; <b>Req:</b> {quote.requerimiento||'-'}</p></section></>
}

createRoot(document.getElementById('root')).render(<App />)
