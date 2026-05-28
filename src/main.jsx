import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Building2, Users, FileText, Wrench, Camera, Package, FileCheck2, RefreshCw, Settings, Plus, Save, Trash2, Pencil, Download, Upload, CheckCircle2, Menu, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./styles.css";

const STORAGE_KEY = "servitec_pro_v12_total_pdf_final_stable";
const IGV = 0.18;

const seed = {
  selectedEmpresaId: "EMP001",
  empresas: [
    { id:"EMP001", nombreComercial:"SERVITEC PRO", razonSocial:"SERVITEC BIOMÉDICA S.A.C.", ruc:"20600000001", direccion:"Cajamarca - Perú", telefono:"999 999 999", correo:"contacto@servitec.pe", responsable:"Responsable Técnico", serieCotizacion:"COT-2026", serieOS:"OS-2026", serieActa:"ACT-2026", serieInforme:"ITE-2026", serieGarantia:"GAR-2026" },
    { id:"EMP002", nombreComercial:"BIO NORTE", razonSocial:"BIOINGENIERÍA DEL NORTE S.A.C.", ruc:"20600000002", direccion:"Lambayeque - Perú", telefono:"988 888 888", correo:"ventas@bionorte.pe", responsable:"Jefe de Operaciones", serieCotizacion:"BN-COT-2026", serieOS:"BN-OS-2026", serieActa:"BN-ACT-2026", serieInforme:"BN-ITE-2026", serieGarantia:"BN-GAR-2026" }
  ],
  clientes: [], establecimientos: [], areas: [], productos: [], cotizaciones: [], ejecuciones: [], evidencias: [], syncLog: []
};

const menu = [
  ["dashboard", "Dashboard", Building2], ["empresas", "Empresas", Building2], ["clientes", "Clientes", Users],
  ["cotizaciones", "Cotizaciones", FileText], ["ejecucion", "Ejecución", Wrench], ["evidencias", "Evidencias", Camera],
  ["inventario", "Inventario", Package], ["documentos", "Documentos Técnicos", FileCheck2], ["sync", "Sync", RefreshCw], ["config", "Configuración", Settings]
];

const structures = [
  ["EQUIPO_ACTIVIDADES", "Un equipo → varias actividades"],
  ["ACTIVIDADES_GENERALES_EQUIPOS", "Actividades generales → equipos múltiples"],
  ["EQUIPOS_INDEPENDIENTES", "Equipos independientes → actividades propias"],
  ["SOLO_REPUESTOS", "Venta / repuestos / accesorios"]
];

function uid(prefix){ return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2,6).toUpperCase()}`; }
function today(){ return new Date().toLocaleDateString("es-PE"); }
function loadData(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("servitec_pro_v118_list_total_live");
    if (!raw) return seed;
    return { ...seed, ...JSON.parse(raw) };
  } catch { return seed; }
}
function toNumber(value){
  if (value === null || value === undefined || value === "") return 0;
  const clean = String(value).replace(/S\//gi,"").replace(/soles/gi,"").replace(/\s/g,"").replace(",",".").replace(/[^\d.-]/g,"");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}
function money(value){ return `S/ ${toNumber(value).toFixed(2)}`; }
function rowAmount(row){ return (toNumber(row?.cantidad) || 0) * toNumber(row?.precio); }
function getQuoteRows(q){
  const rows = [];
  (q.equipos || []).forEach(eq => (eq.actividades || []).forEach(a => rows.push(a)));
  (q.actividadesGenerales || []).forEach(a => rows.push(a));
  (q.repuestos || []).forEach(r => rows.push(r));
  return rows;
}
function calculateBase(q){ return getQuoteRows(q).reduce((sum,row)=>sum + rowAmount(row), 0); }
function totals(q){ const base = calculateBase(q); const igv = base * IGV; return { base, igv, total: base + igv }; }
function findName(rows, id, key="nombre"){ return rows.find(x => x.id === id)?.[key] || "-"; }
function structureLabel(value){ return structures.find(([v]) => v === value)?.[1] || value || "-"; }
function defaultQuote(empresa, count=0){ return {
  id: uid("COT"), empresaId: empresa.id, numero: `${empresa.serieCotizacion || "COT-2026"}-${String(count + 1).padStart(4,"0")}`, fecha: today(),
  clienteId:"", establecimientoId:"", areaId:"", tipo:"SERVICIO", estructura:"ACTIVIDADES_GENERALES_EQUIPOS", estado:"Borrador",
  solicitante:"", cargoSolicitante:"", requerimientoNumero:"", requerimientoFecha:"", referencia:"",
  equipos: [], actividadesGenerales: [], equiposGenerales: [], repuestos: [],
  tiempoEjecucion:"Según coordinación", garantia:"Según servicio", formaPago:"Crédito / contado", validez:"15 días", lugarAtencion:"En establecimiento del cliente",
  totalBase:0, total:0
};}
function parseActivityImport(text){
  return String(text || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => ({
    id: uid("ACT"), descripcion: line.replace(/^\d+\s*[.\-)]\s*/,"").replace(/^[-•]\s*/,"").trim(), cantidad: "1", precio: "0"
  })).filter(x => x.descripcion);
}
function parseEquipmentImport(text){
  return String(text || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const p = line.replace(/\t/g,";").split(/[;,]/).map(x => x.trim());
    return { id: uid("EQ"), nombre:p[0] || "", marca:p[1] || "", modelo:p[2] || "", serie:p[3] || "", codigoPatrimonial:p[4] || "" };
  }).filter(x => x.nombre);
}

function App(){
  const [data,setData] = useState(loadData());
  const [tab,setTab] = useState("dashboard");
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const empresa = data.empresas.find(e => e.id === data.selectedEmpresaId) || data.empresas[0];
  const scoped = useMemo(() => ({
    clientes: data.clientes.filter(x => x.empresaId === empresa.id),
    establecimientos: data.establecimientos.filter(x => x.empresaId === empresa.id),
    areas: data.areas.filter(x => x.empresaId === empresa.id),
    productos: data.productos.filter(x => x.empresaId === empresa.id),
    cotizaciones: data.cotizaciones.filter(x => x.empresaId === empresa.id),
    ejecuciones: data.ejecuciones.filter(x => x.empresaId === empresa.id),
    evidencias: data.evidencias.filter(x => x.empresaId === empresa.id)
  }), [data, empresa.id]);

  function saveData(next, action="Guardado"){
    const updated = { ...next, syncLog: [{ id: uid("SYNC"), fecha: new Date().toLocaleString("es-PE"), accion: action }, ...(next.syncLog || [])].slice(0,80) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setData(updated);
  }
  function go(id){ setTab(id); setSidebarOpen(false); }

  return <div className="shell">
    <div className={sidebarOpen ? "mobileOverlay show" : "mobileOverlay"} onClick={()=>setSidebarOpen(false)} />
    <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
      <div className="sidebarClose"><button className="iconBtn" onClick={()=>setSidebarOpen(false)}><X size={22}/></button></div>
      <div className="brand"><div className="brandIcon">V12</div><div><b>SERVITEC PRO</b><small>Total PDF Final</small></div></div>
      <label className="asideLabel">Empresa activa</label>
      <select value={empresa.id} onChange={e=>saveData({...data, selectedEmpresaId:e.target.value}, "Cambio de empresa activa")}>{data.empresas.map(e=><option key={e.id} value={e.id}>{e.nombreComercial}</option>)}</select>
      <nav>{menu.map(([id,label,Icon])=><button key={id} className={tab===id ? "active" : ""} onClick={()=>go(id)}><Icon size={18}/> {label}</button>)}</nav>
    </aside>
    <main className="main">
      <div className="mobileTopbar"><button className="hamburger" onClick={()=>setSidebarOpen(true)}><Menu size={24}/></button><div><b>{empresa.nombreComercial}</b><small>V12 Total PDF Final</small></div></div>
      <header className="desktopHeader"><div><h1>{empresa.nombreComercial} · V12 TOTAL PDF FINAL</h1><p>{empresa.razonSocial} · RUC {empresa.ruc}</p></div><span className="status"><CheckCircle2 size={16}/> TOTAL ACTIVO</span></header>
      {tab === "dashboard" && <Dashboard scoped={scoped}/>} {tab === "empresas" && <Empresas data={data} saveData={saveData}/>} {tab === "clientes" && <Clientes data={data} empresa={empresa} scoped={scoped} saveData={saveData}/>} {tab === "cotizaciones" && <Cotizaciones data={data} empresa={empresa} scoped={scoped} saveData={saveData}/>} {tab === "ejecucion" && <Ejecucion data={data} empresa={empresa} scoped={scoped} saveData={saveData}/>} {tab === "evidencias" && <Evidencias data={data} empresa={empresa} scoped={scoped} saveData={saveData}/>} {tab === "inventario" && <Inventario data={data} empresa={empresa} scoped={scoped} saveData={saveData}/>} {tab === "documentos" && <Documentos scoped={scoped}/>} {tab === "sync" && <Sync data={data}/>} {tab === "config" && <Config/>}
    </main>
  </div>;
}

function Card({title,children}){ return <section className="card"><h2>{title}</h2>{children}</section>; }
function Metric({title,value}){ return <div className="metric"><span>{title}</span><b>{value}</b></div>; }
function Field({label,children,hint}){ return <div className="field"><label>{label}</label>{children}{hint && <small>{hint}</small>}</div>; }
function Input({label,value,onChange,placeholder="",type="text",hint}){ return <Field label={label} hint={hint}><input type={type} inputMode={type==="number" ? "decimal" : undefined} value={value ?? ""} placeholder={placeholder} onFocus={e=>e.target.select()} onChange={e=>onChange(e.target.value)}/></Field>; }
function Select({label,value,onChange,children,hint}){ return <Field label={label} hint={hint}><select value={value || ""} onChange={e=>onChange(e.target.value)}>{children}</select></Field>; }
function RowActions({onEdit,onDelete}){ return <div className="actions compact"><button onClick={onEdit}><Pencil size={14}/> Editar</button><button className="danger" onClick={onDelete}><Trash2 size={14}/> Borrar</button></div>; }
function Table({rows,cols}){ return <div className="table"><table><thead><tr>{cols.map((c,i)=><th key={i}>{c[1]}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row,ri)=><tr key={row.id || ri}>{cols.map((c,ci)=><td key={ci}>{c[2] ? c[2](row) : String(row[c[0]] ?? "")}</td>)}</tr>) : <tr><td colSpan={cols.length}>Sin registros.</td></tr>}</tbody></table></div>; }

function Dashboard({scoped}){ return <><div className="metrics"><Metric title="Clientes" value={scoped.clientes.length}/><Metric title="Establecimientos" value={scoped.establecimientos.length}/><Metric title="Áreas usuarias" value={scoped.areas.length}/><Metric title="Cotizaciones" value={scoped.cotizaciones.length}/><Metric title="Ejecuciones" value={scoped.ejecuciones.length}/></div><Card title="Flujo V12 Total PDF Final"><ol><li>Empresa activa al inicio.</li><li>Cliente → establecimientos → áreas usuarias.</li><li>Tipo de servicio y configuración de cotización.</li><li>Edición de actividad actualiza subtotal, total y PDF.</li></ol></Card></>; }

function Empresas({data,saveData}){
  const empty = { id: uid("EMP"), nombreComercial:"", razonSocial:"", ruc:"", direccion:"", telefono:"", correo:"", responsable:"", serieCotizacion:"COT-2026", serieOS:"OS-2026", serieActa:"ACT-2026", serieInforme:"ITE-2026", serieGarantia:"GAR-2026" };
  const [open,setOpen] = useState(false); const [form,setForm] = useState(empty);
  function newItem(){ setForm({...empty, id:uid("EMP")}); setOpen(true); }
  function edit(item){ setForm({...item}); setOpen(true); }
  function save(){ if(!form.razonSocial) return alert("Completa razón social"); const exists=data.empresas.some(x=>x.id===form.id); saveData({...data, empresas: exists ? data.empresas.map(x=>x.id===form.id ? form : x) : [...data.empresas, form]}, "Empresa guardada"); setOpen(false); }
  return <Card title="Empresas">{!open && <button onClick={newItem}><Plus size={16}/> Agregar empresa</button>}{open && <div className="panel"><div className="grid3"><Input label="Nombre comercial" value={form.nombreComercial} onChange={v=>setForm({...form,nombreComercial:v})}/><Input label="Razón social" value={form.razonSocial} onChange={v=>setForm({...form,razonSocial:v})}/><Input label="RUC" value={form.ruc} onChange={v=>setForm({...form,ruc:v})}/><Input label="Dirección" value={form.direccion} onChange={v=>setForm({...form,direccion:v})}/><Input label="Teléfono" value={form.telefono} onChange={v=>setForm({...form,telefono:v})}/><Input label="Correo" value={form.correo} onChange={v=>setForm({...form,correo:v})}/><Input label="Responsable" value={form.responsable} onChange={v=>setForm({...form,responsable:v})}/><Input label="Serie cotización" value={form.serieCotizacion} onChange={v=>setForm({...form,serieCotizacion:v})}/></div><div className="actions"><button onClick={save}><Save size={16}/> Guardar</button><button className="ghost" onClick={()=>setOpen(false)}>Cancelar</button></div></div>}<Table rows={data.empresas} cols={[["nombreComercial","Nombre"],["razonSocial","Razón social"],["ruc","RUC"],["direccion","Dirección"],["acciones","Acciones", row=><RowActions onEdit={()=>edit(row)} onDelete={()=>saveData({...data, empresas:data.empresas.filter(x=>x.id!==row.id)}, "Empresa eliminada")}/>]]}/></Card>;
}

function Clientes({data,empresa,scoped,saveData}){
  const [client,setClient] = useState({ razonSocial:"", ruc:"", direccion:"", contacto:"", telefono:"", correo:"" });
  const [est,setEst] = useState({ clienteId:"", nombre:"", direccion:"" });
  const [area,setArea] = useState({ establecimientoId:"", nombre:"" });
  function saveClient(){ if(!client.razonSocial) return alert("Completa el cliente"); saveData({...data, clientes:[...data.clientes,{id:uid("CLI"),empresaId:empresa.id,...client}]}, "Cliente guardado"); setClient({ razonSocial:"", ruc:"", direccion:"", contacto:"", telefono:"", correo:"" }); }
  function saveEst(){ if(!est.clienteId || !est.nombre) return alert("Selecciona cliente y completa establecimiento"); saveData({...data, establecimientos:[...data.establecimientos,{id:uid("EST"),empresaId:empresa.id,...est}]}, "Establecimiento guardado"); setEst({ clienteId:est.clienteId,nombre:"",direccion:"" }); }
  function saveArea(){ if(!area.establecimientoId || !area.nombre) return alert("Selecciona establecimiento y completa área"); const e=data.establecimientos.find(x=>x.id===area.establecimientoId); saveData({...data, areas:[...data.areas,{id:uid("AREA"),empresaId:empresa.id,clienteId:e?.clienteId || "",...area}]}, "Área guardada"); setArea({ establecimientoId:area.establecimientoId,nombre:"" }); }
  return <Card title="Clientes, establecimientos y áreas usuarias"><div className="panel"><h3>Nuevo cliente</h3><div className="grid3"><Input label="Razón social / nombre" value={client.razonSocial} onChange={v=>setClient({...client,razonSocial:v})}/><Input label="RUC / DNI" value={client.ruc} onChange={v=>setClient({...client,ruc:v})}/><Input label="Dirección" value={client.direccion} onChange={v=>setClient({...client,direccion:v})}/><Input label="Responsable / contacto" value={client.contacto} onChange={v=>setClient({...client,contacto:v})}/><Input label="Teléfono" value={client.telefono} onChange={v=>setClient({...client,telefono:v})}/><Input label="Correo" value={client.correo} onChange={v=>setClient({...client,correo:v})}/></div><button onClick={saveClient}><Plus size={16}/> Guardar cliente</button></div><div className="two"><div className="panel"><h3>Agregar establecimiento</h3><Select label="Cliente" value={est.clienteId} onChange={v=>setEst({...est,clienteId:v})}><option value="">Seleccione cliente</option>{scoped.clientes.map(c=><option key={c.id} value={c.id}>{c.razonSocial}</option>)}</Select><Input label="Establecimiento" value={est.nombre} onChange={v=>setEst({...est,nombre:v})}/><Input label="Dirección" value={est.direccion} onChange={v=>setEst({...est,direccion:v})}/><button onClick={saveEst}><Plus size={16}/> Agregar establecimiento</button></div><div className="panel"><h3>Agregar área usuaria</h3><Select label="Establecimiento" value={area.establecimientoId} onChange={v=>setArea({...area,establecimientoId:v})}><option value="">Seleccione establecimiento</option>{scoped.establecimientos.map(e=><option key={e.id} value={e.id}>{findName(scoped.clientes,e.clienteId,"razonSocial")} · {e.nombre}</option>)}</Select><Input label="Área usuaria" value={area.nombre} onChange={v=>setArea({...area,nombre:v})}/><button onClick={saveArea}><Plus size={16}/> Agregar área</button></div></div><div className="tree">{scoped.clientes.map(c=>{const ests=scoped.establecimientos.filter(e=>e.clienteId===c.id); return <div className="treeCard" key={c.id}><div className="treeHead"><div><b>{c.razonSocial}</b><span>RUC/DNI: {c.ruc || "-"} · Contacto: {c.contacto || "-"}</span></div><button className="danger" onClick={()=>saveData({...data, clientes:data.clientes.filter(x=>x.id!==c.id), establecimientos:data.establecimientos.filter(x=>x.clienteId!==c.id), areas:data.areas.filter(x=>x.clienteId!==c.id)}, "Cliente eliminado")}><Trash2 size={14}/> Borrar</button></div>{ests.map(e=><div className="branch" key={e.id}><b>🏥 {e.nombre}</b><span>{e.direccion}</span><div className="areas">{scoped.areas.filter(a=>a.establecimientoId===e.id).map(a=><em key={a.id}>{a.nombre}</em>)}</div></div>)}</div>})}</div></Card>;
}

function Cotizaciones({data,empresa,scoped,saveData}){
  const [mode,setMode] = useState("list"); const [quote,setQuote] = useState(defaultQuote(empresa, scoped.cotizaciones.length));
  const establishments = scoped.establecimientos.filter(x=>x.clienteId===quote.clienteId); const areas = scoped.areas.filter(x=>x.establecimientoId===quote.establecimientoId);
  const live = totals(quote);
  function startNew(){ setQuote(defaultQuote(empresa, scoped.cotizaciones.length)); setMode("form"); }
  function edit(row){ setQuote(JSON.parse(JSON.stringify(row))); setMode("form"); }
  function saveQuote(){ if(!quote.clienteId) return alert("Selecciona cliente"); const t=totals(quote); const item={...quote,totalBase:t.base,total:t.total}; const exists=data.cotizaciones.some(q=>q.id===item.id); saveData({...data,cotizaciones: exists ? data.cotizaciones.map(q=>q.id===item.id ? item : q) : [...data.cotizaciones,item]}, "Cotización guardada"); setMode("list"); }
  return <Card title="Cotizaciones"><div className="versionBanner">V12 FIX TOTAL · La edición de cada actividad actualiza total y PDF</div>{mode==="list" && <><button onClick={startNew}><Plus size={16}/> Nueva cotización</button><Table rows={scoped.cotizaciones} cols={[["numero","N°"],["fecha","Fecha"],["clienteId","Cliente",r=>findName(scoped.clientes,r.clienteId,"razonSocial")],["estructura","Configuración",r=>structureLabel(r.estructura)],["estado","Estado"],["total","Total",r=>money(totals(r).total)],["acciones","Acciones",r=><div className="actions compact"><button onClick={()=>edit(r)}><Pencil size={14}/> Editar</button><button className="danger" onClick={()=>saveData({...data,cotizaciones:data.cotizaciones.filter(x=>x.id!==r.id)},"Cotización eliminada")}><Trash2 size={14}/> Eliminar</button><button onClick={()=>exportPDF(`cot-${r.id}`, r.numero)}><Download size={14}/> PDF</button><div className="hiddenDoc" id={`cot-${r.id}`}><QuoteDocument empresa={empresa} quote={r} scoped={scoped}/></div></div>]]}/></>}{mode==="form" && <><div className="grid3"><Select label="Cliente" value={quote.clienteId} onChange={v=>setQuote({...quote,clienteId:v,establecimientoId:"",areaId:""})}><option value="">Seleccione cliente</option>{scoped.clientes.map(c=><option key={c.id} value={c.id}>{c.razonSocial}</option>)}</Select><Select label="Establecimiento" value={quote.establecimientoId} onChange={v=>setQuote({...quote,establecimientoId:v,areaId:""})}><option value="">Seleccione establecimiento</option>{establishments.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</Select><Select label="Área usuaria" value={quote.areaId} onChange={v=>setQuote({...quote,areaId:v})}><option value="">Seleccione área</option>{areas.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</Select><Select label="Tipo de servicio" value={quote.tipo} onChange={v=>setQuote({...quote,tipo:v})}><option>SERVICIO</option><option>SERVICIO + REPUESTOS</option><option>VENTA DE EQUIPO</option><option>VENTA DE REPUESTOS</option></Select><Select label="Configuración de cotización" value={quote.estructura} onChange={v=>setQuote({...quote,estructura:v})}>{structures.map(([v,l])=><option key={v} value={v}>{l}</option>)}</Select><Select label="Estado" value={quote.estado} onChange={v=>setQuote({...quote,estado:v})}><option>Borrador</option><option>Enviado</option><option>Aprobado</option><option>Rechazado</option><option>En ejecución</option><option>Finalizado</option></Select></div><div className="sectionTitle">Datos del requerimiento</div><div className="grid3"><Input label="Responsable solicitante" value={quote.solicitante} onChange={v=>setQuote({...quote,solicitante:v})}/><Input label="Cargo" value={quote.cargoSolicitante} onChange={v=>setQuote({...quote,cargoSolicitante:v})}/><Input label="N° requerimiento" value={quote.requerimientoNumero} onChange={v=>setQuote({...quote,requerimientoNumero:v})}/><Input label="Fecha requerimiento" type="date" value={quote.requerimientoFecha} onChange={v=>setQuote({...quote,requerimientoFecha:v})}/><Input label="Referencia" value={quote.referencia} onChange={v=>setQuote({...quote,referencia:v})}/></div><EditableQuote quote={quote} setQuote={setQuote}/><div className="sectionTitle">Condiciones</div><div className="grid3"><Input label="Tiempo de ejecución" value={quote.tiempoEjecucion} onChange={v=>setQuote({...quote,tiempoEjecucion:v})}/><Input label="Garantía" value={quote.garantia} onChange={v=>setQuote({...quote,garantia:v})}/><Input label="Forma de pago" value={quote.formaPago} onChange={v=>setQuote({...quote,formaPago:v})}/><Input label="Validez" value={quote.validez} onChange={v=>setQuote({...quote,validez:v})}/><Input label="Lugar de atención" value={quote.lugarAtencion} onChange={v=>setQuote({...quote,lugarAtencion:v})}/></div><div className="totalLiveHint">Subtotal: {money(live.base)} · IGV: {money(live.igv)} · TOTAL: {money(live.total)}</div><div className="actions"><button onClick={saveQuote}><Save size={16}/> Guardar cotización</button><button onClick={()=>exportPDF("quote-live", quote.numero)}><Download size={16}/> PDF</button><button className="ghost" onClick={()=>setMode("list")}>Cancelar</button></div><div id="quote-live" className="printDoc"><QuoteDocument empresa={empresa} quote={quote} scoped={scoped}/></div></>}</Card>;
}

function EditableQuote({quote,setQuote}){
  if (quote.estructura === "EQUIPO_ACTIVIDADES" || quote.estructura === "EQUIPOS_INDEPENDIENTES") return <div><div className="actions"><button onClick={()=>setQuote({...quote,equipos:[...quote.equipos,{id:uid("EQ"),nombre:"",marca:"",modelo:"",serie:"",codigoPatrimonial:"",actividades:[]}]})}><Plus size={16}/> Agregar equipo</button></div>{quote.equipos.map((eq,ei)=><div className="box" key={eq.id}><div className="boxHeader"><h3>Equipo {ei+1}</h3><span>{(eq.actividades||[]).length} actividades</span></div><EquipmentFields equipment={eq} onChange={(k,v)=>setQuote({...quote,equipos:quote.equipos.map(x=>x.id===eq.id ? {...x,[k]:v}:x)})}/><ActivityTable rows={eq.actividades || []} onImport={items=>setQuote({...quote,equipos:quote.equipos.map(x=>x.id===eq.id ? {...x,actividades:[...(x.actividades||[]),...items.map((a,i)=>({...a,orden:(x.actividades||[]).length+i+1}))]}:x)})} onAdd={item=>setQuote({...quote,equipos:quote.equipos.map(x=>x.id===eq.id ? {...x,actividades:[...(x.actividades||[]),{...item,orden:(x.actividades||[]).length+1}]}:x)})} onUpdate={(id,item)=>setQuote({...quote,equipos:quote.equipos.map(x=>x.id===eq.id ? {...x,actividades:x.actividades.map(a=>a.id===id ? {...a,...item}:a)}:x)})} onDelete={id=>setQuote({...quote,equipos:quote.equipos.map(x=>x.id===eq.id ? {...x,actividades:x.actividades.filter(a=>a.id!==id).map((a,i)=>({...a,orden:i+1}))}:x)})}/><button className="danger" onClick={()=>setQuote({...quote,equipos:quote.equipos.filter(x=>x.id!==eq.id)})}><Trash2 size={14}/> Eliminar equipo</button></div>)}</div>;
  if (quote.estructura === "ACTIVIDADES_GENERALES_EQUIPOS") return <div className="box"><div className="boxHeader"><h3>Actividades generales</h3><span>{quote.actividadesGenerales.length} agregadas</span></div><ActivityTable rows={quote.actividadesGenerales} onImport={items=>setQuote({...quote,actividadesGenerales:[...quote.actividadesGenerales,...items.map((a,i)=>({...a,orden:quote.actividadesGenerales.length+i+1}))]})} onAdd={item=>setQuote({...quote,actividadesGenerales:[...quote.actividadesGenerales,{...item,orden:quote.actividadesGenerales.length+1}]})} onUpdate={(id,item)=>setQuote({...quote,actividadesGenerales:quote.actividadesGenerales.map(a=>a.id===id ? {...a,...item}:a)})} onDelete={id=>setQuote({...quote,actividadesGenerales:quote.actividadesGenerales.filter(a=>a.id!==id).map((a,i)=>({...a,orden:i+1}))})}/><EquipmentGeneral quote={quote} setQuote={setQuote}/></div>;
  return <div className="box"><div className="boxHeader"><h3>Venta / repuestos / accesorios</h3><span>{quote.repuestos.length} ítems</span></div><ActivityTable rows={quote.repuestos} onImport={items=>setQuote({...quote,repuestos:[...quote.repuestos,...items]})} onAdd={item=>setQuote({...quote,repuestos:[...quote.repuestos,item]})} onUpdate={(id,item)=>setQuote({...quote,repuestos:quote.repuestos.map(a=>a.id===id ? {...a,...item}:a)})} onDelete={id=>setQuote({...quote,repuestos:quote.repuestos.filter(a=>a.id!==id)})}/></div>;
}
function EquipmentFields({equipment,onChange}){ return <div className="grid3"><Input label="Nombre del equipo" value={equipment.nombre} onChange={v=>onChange("nombre",v)}/><Input label="Marca" value={equipment.marca} onChange={v=>onChange("marca",v)}/><Input label="Modelo" value={equipment.modelo} onChange={v=>onChange("modelo",v)}/><Input label="Serie" value={equipment.serie} onChange={v=>onChange("serie",v)}/><Input label="Código patrimonial" value={equipment.codigoPatrimonial} onChange={v=>onChange("codigoPatrimonial",v)}/></div>; }
function ActivityTable({rows,onAdd,onUpdate,onDelete,onImport}){
  const [draft,setDraft] = useState({descripcion:"",cantidad:"1",precio:"0"}); const [editId,setEditId]=useState(null); const [importOpen,setImportOpen]=useState(false); const [text,setText]=useState("");
  function submit(){ if(!draft.descripcion) return alert("Ingresa descripción"); const item={id:editId || uid("ACT"), descripcion:draft.descripcion, cantidad:draft.cantidad || "1", precio:draft.precio || "0"}; editId ? onUpdate(editId,item) : onAdd(item); setDraft({descripcion:"",cantidad:"1",precio:"0"}); setEditId(null); }
  return <div className="panel"><div className="quickAddGrid"><input placeholder="Descripción de actividad" value={draft.descripcion} onChange={e=>setDraft({...draft,descripcion:e.target.value})}/><input type="number" placeholder="Cantidad" value={draft.cantidad} onChange={e=>setDraft({...draft,cantidad:e.target.value})}/><input type="number" placeholder="Precio" value={draft.precio} onChange={e=>setDraft({...draft,precio:e.target.value})}/><button onClick={submit}>{editId ? "Actualizar" : "+ Agregar"}</button></div><div className="actions"><button className="ghost" onClick={()=>setImportOpen(!importOpen)}><Upload size={16}/> Importar solo descripciones</button>{editId && <button className="ghost" onClick={()=>{setEditId(null);setDraft({descripcion:"",cantidad:"1",precio:"0"});}}>Cancelar edición</button>}</div>{importOpen && <div className="importPanel"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Una actividad por línea. Solo se importará la descripción; cantidad queda 1 y precio 0."/><button onClick={()=>{const items=parseActivityImport(text); if(!items.length)return alert("No hay actividades válidas"); onImport(items); setText(""); setImportOpen(false);}}>Importar</button></div>}<div className="table"><table><thead><tr><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th>Acciones</th></tr></thead><tbody>{rows.length ? rows.map((r,i)=><tr key={r.id}><td>{r.orden || i+1}</td><td>{r.descripcion}</td><td>{r.cantidad}</td><td>{money(r.precio)}</td><td>{money(rowAmount(r))}</td><td><div className="actions compact"><button onClick={()=>{setEditId(r.id);setDraft({descripcion:r.descripcion || "",cantidad:String(r.cantidad ?? "1"),precio:String(r.precio ?? "0")});}}><Pencil size={14}/> Editar</button><button className="danger" onClick={()=>onDelete(r.id)}><Trash2 size={14}/> Eliminar</button></div></td></tr>) : <tr><td colSpan="6">Sin actividades.</td></tr>}</tbody></table></div></div>;
}
function EquipmentGeneral({quote,setQuote}){
  const [draft,setDraft]=useState({nombre:"",marca:"",modelo:"",serie:"",codigoPatrimonial:""}); const [open,setOpen]=useState(false); const [text,setText]=useState("");
  function add(){ if(!draft.nombre) return alert("Ingresa equipo"); setQuote({...quote,equiposGenerales:[...quote.equiposGenerales,{id:uid("EQ"),...draft}]}); setDraft({nombre:"",marca:"",modelo:"",serie:"",codigoPatrimonial:""}); }
  return <div className="box"><div className="boxHeader"><h3>Equipos incluidos</h3><span>{quote.equiposGenerales.length} equipos</span></div><div className="quickAddGrid"><input placeholder="Equipo" value={draft.nombre} onChange={e=>setDraft({...draft,nombre:e.target.value})}/><input placeholder="Marca" value={draft.marca} onChange={e=>setDraft({...draft,marca:e.target.value})}/><input placeholder="Modelo" value={draft.modelo} onChange={e=>setDraft({...draft,modelo:e.target.value})}/><input placeholder="Serie" value={draft.serie} onChange={e=>setDraft({...draft,serie:e.target.value})}/><button onClick={add}>+ Agregar equipo</button></div><button className="ghost" onClick={()=>setOpen(!open)}><Upload size={16}/> Importar equipos</button>{open && <div className="importPanel"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Equipo;Marca;Modelo;Serie;Código"/><button onClick={()=>{const items=parseEquipmentImport(text); setQuote({...quote,equiposGenerales:[...quote.equiposGenerales,...items]}); setText(""); setOpen(false);}}>Importar</button></div>}<Table rows={quote.equiposGenerales} cols={[["nombre","Equipo"],["marca","Marca"],["modelo","Modelo"],["serie","Serie"],["codigoPatrimonial","Código"],["acciones","Acciones",r=><button className="danger" onClick={()=>setQuote({...quote,equiposGenerales:quote.equiposGenerales.filter(x=>x.id!==r.id)})}><Trash2 size={14}/> Eliminar</button>]]}/></div>;
}
function QuoteDocument({empresa,quote,scoped}){ const t=totals(quote); return <div><div className="docHeader"><div><h2>COTIZACIÓN</h2><p>{quote.numero}</p></div><div className="docCompany"><b>{empresa.razonSocial}</b><p>RUC {empresa.ruc}</p><p>{empresa.direccion}</p><p>{empresa.telefono} · {empresa.correo}</p></div></div><div className="docGrid"><div><b>Cliente:</b> {findName(scoped.clientes,quote.clienteId,"razonSocial")}</div><div><b>Establecimiento:</b> {findName(scoped.establecimientos,quote.establecimientoId,"nombre")}</div><div><b>Área usuaria:</b> {findName(scoped.areas,quote.areaId,"nombre")}</div><div><b>Solicitante:</b> {quote.solicitante || "-"}</div><div><b>N° requerimiento:</b> {quote.requerimientoNumero || "-"}</div><div><b>Referencia:</b> {quote.referencia || "-"}</div></div><div className="quoteMode"><b>Tipo:</b> {quote.tipo} · <b>Configuración:</b> {structureLabel(quote.estructura)}</div>{(quote.estructura==="EQUIPO_ACTIVIDADES" || quote.estructura==="EQUIPOS_INDEPENDIENTES") && (quote.equipos||[]).map((eq,i)=><div className="docBox" key={eq.id}><h3>Equipo {i+1}: {eq.nombre || "-"}</h3><p>Marca: {eq.marca || "-"} · Modelo: {eq.modelo || "-"} · Serie: {eq.serie || "-"} · Código: {eq.codigoPatrimonial || "-"}</p><SimpleRows rows={eq.actividades || []}/></div>)}{quote.estructura==="ACTIVIDADES_GENERALES_EQUIPOS" && <><div className="docBox"><h3>Actividades generales</h3><SimpleRows rows={quote.actividadesGenerales || []}/></div><div className="docBox"><h3>Equipos incluidos</h3><Table rows={quote.equiposGenerales || []} cols={[["nombre","Equipo"],["marca","Marca"],["modelo","Modelo"],["serie","Serie"],["codigoPatrimonial","Código"]]}/></div></>}{quote.estructura==="SOLO_REPUESTOS" && <div className="docBox"><h3>Ítems</h3><SimpleRows rows={quote.repuestos || []}/></div>}<div className="sectionTitle">Condiciones comerciales y técnicas</div><div className="docGrid"><div><b>Tiempo:</b> {quote.tiempoEjecucion || "-"}</div><div><b>Garantía:</b> {quote.garantia || "-"}</div><div><b>Pago:</b> {quote.formaPago || "-"}</div><div><b>Validez:</b> {quote.validez || "-"}</div><div><b>Lugar:</b> {quote.lugarAtencion || "-"}</div></div><h3 className="finalTotalBox">Subtotal: {money(t.base)} · IGV: {money(t.igv)} · Total: {money(t.total)}</h3><div className="singleSignature"><div>Gerente General / Representante Comercial</div></div></div>; }
function SimpleRows({rows}){ return <table><thead><tr><th>#</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{rows.length ? rows.map((r,i)=><tr key={r.id || i}><td>{r.orden || i+1}</td><td>{r.descripcion || "-"}</td><td>{r.cantidad || 0}</td><td>{money(r.precio)}</td><td>{money(rowAmount(r))}</td></tr>) : <tr><td colSpan="5">Sin detalle registrado.</td></tr>}</tbody></table>; }

function Ejecucion({data,empresa,scoped,saveData}){ const [quoteId,setQuoteId]=useState(""); return <Card title="Ejecución"><Select label="Cotización" value={quoteId} onChange={setQuoteId}><option value="">Seleccione cotización</option>{scoped.cotizaciones.map(q=><option key={q.id} value={q.id}>{q.numero}</option>)}</Select><p>Módulo preparado para orden de servicio, evidencias y conformidad.</p></Card>; }
function Evidencias(){ return <Card title="Evidencias"><p>Módulo de fotos y anexos listo para siguiente fase.</p></Card>; }
function Inventario({data,empresa,scoped,saveData}){ const [form,setForm]=useState({codigo:"",descripcion:"",tipo:"Repuesto",stock:0,precio:0}); function save(){ if(!form.descripcion)return alert("Completa descripción"); saveData({...data,productos:[...data.productos,{id:uid("PROD"),empresaId:empresa.id,...form}]},"Producto guardado"); setForm({codigo:"",descripcion:"",tipo:"Repuesto",stock:0,precio:0}); } return <Card title="Inventario"><div className="grid3"><Input label="Código" value={form.codigo} onChange={v=>setForm({...form,codigo:v})}/><Input label="Descripción" value={form.descripcion} onChange={v=>setForm({...form,descripcion:v})}/><Input label="Tipo" value={form.tipo} onChange={v=>setForm({...form,tipo:v})}/><Input label="Stock" type="number" value={form.stock} onChange={v=>setForm({...form,stock:v})}/><Input label="Precio" type="number" value={form.precio} onChange={v=>setForm({...form,precio:v})}/></div><button onClick={save}><Save size={16}/> Guardar producto</button><Table rows={scoped.productos} cols={[["codigo","Código"],["descripcion","Descripción"],["tipo","Tipo"],["stock","Stock"],["precio","Precio"]]}/></Card>; }
function Documentos({scoped}){ return <Card title="Documentos técnicos"><Table rows={scoped.cotizaciones} cols={[["numero","Cotización"],["fecha","Fecha"],["estado","Estado"],["total","Total",r=>money(totals(r).total)]]}/></Card>; }
function Sync({data}){ return <Card title="Sync y auditoría"><Table rows={data.syncLog} cols={[["fecha","Fecha"],["accion","Acción"]]}/></Card>; }
function Config(){ return <Card title="Configuración"><ul><li>Un equipo con varias actividades.</li><li>Actividades generales para múltiples equipos.</li><li>Equipos independientes con actividades propias.</li><li>Venta de repuestos/accesorios.</li></ul></Card>; }
async function exportPDF(id,name){ const node=document.getElementById(id); if(!node)return alert("No se encontró documento para exportar"); const old={display:node.style.display,position:node.style.position,left:node.style.left,top:node.style.top,zIndex:node.style.zIndex}; node.style.display="block"; node.style.position="fixed"; node.style.left="0"; node.style.top="0"; node.style.zIndex="9999"; node.style.background="#fff"; await new Promise(r=>setTimeout(r,250)); const canvas=await html2canvas(node,{scale:2,useCORS:true,backgroundColor:"#fff"}); const pdf=new jsPDF("p","mm","a4"); const width=210; const height=canvas.height*width/canvas.width; pdf.addImage(canvas.toDataURL("image/png"),"PNG",0,0,width,Math.min(height,297)); pdf.save(`${name || "cotizacion"}.pdf`); Object.assign(node.style,old); }
createRoot(document.getElementById("root")).render(<App/>);
