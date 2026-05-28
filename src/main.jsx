
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Menu, X, ArrowLeft, Building2, Users, FileText, Wrench, Camera, Package,
  FileCheck2, RefreshCw, Settings, Plus, Save, Trash2, Pencil,
  Download,
  Check,
  Upload, CheckCircle2
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./styles.css";

const STORAGE_KEY = "servitec_pro_v118_list_total_live";

const seed = {
  selectedEmpresaId: "EMP001",
  empresas: [
    { id:"EMP001", nombreComercial:"SERVITEC PRO", razonSocial:"SERVITEC BIOMÉDICA S.A.C.", ruc:"20600000001", direccion:"Cajamarca - Perú", telefono:"999 999 999", correo:"contacto@servitec.pe", responsable:"Responsable Técnico", serieCotizacion:"COT-2026", serieOS:"OS-2026", serieActa:"ACT-2026", serieInforme:"ITE-2026", serieGarantia:"GAR-2026" },
    { id:"EMP002", nombreComercial:"BIO NORTE", razonSocial:"BIOINGENIERÍA DEL NORTE S.A.C.", ruc:"20600000002", direccion:"Lambayeque - Perú", telefono:"988 888 888", correo:"ventas@bionorte.pe", responsable:"Jefe de Operaciones", serieCotizacion:"BN-COT-2026", serieOS:"BN-OS-2026", serieActa:"BN-ACT-2026", serieInforme:"BN-ITE-2026", serieGarantia:"BN-GAR-2026" }
  ],
  clientes: [],
  establecimientos: [],
  areas: [],
  productos: [],
  cotizaciones: [],
  ejecuciones: [],
  evidencias: [],
  syncLog: []
};

const structures = [
  ["EQUIPO_ACTIVIDADES", "Equipo → actividades"],
  ["ACTIVIDADES_GENERALES_EQUIPOS", "Actividades generales → equipos múltiples"],
  ["SOLO_REPUESTOS", "Solo repuestos / venta"]
];

const menu = [
  ["dashboard", "Dashboard", Building2],
  ["empresas", "Empresas", Building2],
  ["clientes", "Clientes", Users],
  ["cotizaciones", "Cotizaciones", FileText],
  ["ejecucion", "Ejecución", Wrench],
  ["evidencias", "Evidencias", Camera],
  ["inventario", "Inventario", Package],
  ["documentos", "Documentos Técnicos", FileCheck2],
  ["sync", "Sync", RefreshCw],
  ["config", "Configuración", Settings]
];

function uid(prefix) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function today() { return new Date().toLocaleDateString("es-PE"); }

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value)
    .replace("S/", "")
    .replace("s/", "")
    .replace(/soles/gi, "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return `S/ ${toNumber(value).toFixed(2)}`;
}

function rowAmount(row) {
  const qty = toNumber(row?.cantidad ?? row?.qty ?? 1) || 1;
  const price = toNumber(row?.precio ?? row?.costo ?? row?.price ?? 0);
  return qty * price;
}

function getQuoteRows(q) {
  const rows = [];

  (q.equipos || []).forEach((eq) => {
    (eq.actividades || []).forEach((act) => rows.push(act));
  });

  (q.actividadesGenerales || []).forEach((act) => rows.push(act));
  (q.repuestos || []).forEach((rep) => rows.push(rep));

  return rows;
}

function getAllQuoteRows(q) {
  return getQuoteRows(q);
}

function calculateTotal(q) {
  return getQuoteRows(q).reduce((sum, row) => sum + rowAmount(row), 0);
}

function App() {
  const [data, setData] = useState(loadData());
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fieldMode, setFieldMode] = useState(false);

  React.useEffect(() => {
    const protectState = { servitecProtected: true };
    window.history.pushState(protectState, "", window.location.href);

    const onPopState = () => {
      if (fieldMode) {
        window.history.pushState(protectState, "", window.location.href);
        alert("Modo campo activo: usa los botones del sistema para regresar y evitar perder datos.");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [fieldMode]);

  function enableFieldModeProtection() {
    setFieldMode(true);
  }

  const [tabHistory, setTabHistory] = useState([]);

  function canGoBack() {
    return tabHistory.length > 0;
  }

  function goBack() {
    setTabHistory((previous) => {
      if (previous.length === 0) return previous;
      const next = [...previous];
      const last = next.pop();
      setTab(last || "dashboard");
      return next;
    });
  }

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

  function saveData(next, action = "Guardado local") {
    const updated = {
      ...next,
      syncLog: [{ id: uid("SYNC"), fecha: new Date().toLocaleString("es-PE"), accion: action }, ...(next.syncLog || [])].slice(0, 50)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setData(updated);
  }

  function go(id) {
    if (id !== tab) {
      setTabHistory((previous) => [...previous.slice(-8), tab]);
    }
    setTab(id);
    setSidebarOpen(false);
  }


  return (
    <div className="shell">
      <div className={sidebarOpen ? "mobileOverlay show" : "mobileOverlay"} onClick={() => setSidebarOpen(false)} />

      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebarClose">
          <button className="iconBtn" onClick={() => setSidebarOpen(false)}><X size={22} /></button>
        </div>

        <div className="brand">
          <div className="brandIcon">V10</div>
          <div>
            <b>SERVITEC PRO V12 TOTAL PDF FINAL</b>
            <small>TOTAL PDF FINAL</small>
          </div>
        </div>

        <label className="asideLabel">Empresa activa</label>
        <select
          value={empresa.id}
          onChange={e => saveData({ ...data, selectedEmpresaId: e.target.value }, "Cambio de empresa activa")}
        >
          {data.empresas.map(e => <option key={e.id} value={e.id}>{e.nombreComercial}</option>)}
        </select>

        <nav>
          {menu.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => go(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main" onFocusCapture={enableFieldModeProtection}>
        <div className="mobileTopbar">
          {canGoBack() && (
            <button className="backBtn" onClick={goBack} aria-label="Regresar">
              <ArrowLeft size={22} />
            </button>
          )}
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu size={24} /></button>
          <div>
            <b>{empresa.nombreComercial}</b>
            <small>V12 Total PDF Final</small>
          </div>
        </div>

        <header className="desktopHeader">
          <div>
            <div className="desktopTitleRow">
              {canGoBack() && (
                <button className="desktopBackBtn" onClick={goBack}>
                  <ArrowLeft size={18} /> Atrás
                </button>
              )}
              <h1>{empresa.nombreComercial} · V11.8 LIST TOTAL LIVE</h1>
            </div>
            <p>{empresa.razonSocial} · RUC {empresa.ruc}</p>
          </div>
          <span className="status"><CheckCircle2 size={16} /> TOTAL Y PDF ACTIVO</span>
        </header>

        {tab === "dashboard" && <Dashboard scoped={scoped} />}
        {tab === "empresas" && <Empresas data={data} saveData={saveData} />}
        {tab === "clientes" && <Clientes data={data} empresa={empresa} scoped={scoped} saveData={saveData} />}
        {tab === "cotizaciones" && <Cotizaciones data={data} empresa={empresa} scoped={scoped} saveData={saveData} />}
        {tab === "ejecucion" && <Ejecucion data={data} empresa={empresa} scoped={scoped} saveData={saveData} />}
        {tab === "evidencias" && <Evidencias data={data} empresa={empresa} scoped={scoped} saveData={saveData} />}
        {tab === "inventario" && <Inventario data={data} empresa={empresa} scoped={scoped} saveData={saveData} />}
        {tab === "documentos" && <Documentos scoped={scoped} />}
        {tab === "sync" && <Sync data={data} />}
        {tab === "config" && <Config />}
      </main>
    </div>
  );
}

function Card({ title, children }) { return <section className="card"><h2>{title}</h2>{children}</section>; }
function Metric({ title, value }) { return <div className="metric"><span>{title}</span><b>{value}</b></div>; }
function Field({ label, children, hint }) { return <div className="field"><label>{label}</label>{children}{hint && <small>{hint}</small>}</div>; }
function Input({ label, value, onChange, placeholder = "", type = "text", hint }) {
  return <Field label={label} hint={hint}><input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value ?? ""}
        placeholder={placeholder}
        onFocus={(event) => event.target.select()}
        onChange={(event) => onChange(event.target.value)}
      /></Field>;
}
function Select({ label, value, onChange, children, hint }) {
  return <Field label={label} hint={hint}><select value={value || ""} onChange={e => onChange(e.target.value)}>{children}</select></Field>;
}

function Dashboard({ scoped }) {
  return (
    <>
      <div className="metrics">
        <Metric title="Clientes" value={scoped.clientes.length} />
        <Metric title="Establecimientos" value={scoped.establecimientos.length} />
        <Metric title="Áreas usuarias" value={scoped.areas.length} />
        <Metric title="Cotizaciones" value={scoped.cotizaciones.length} />
        <Metric title="Ejecuciones" value={scoped.ejecuciones.length} />
      </div>
      <Card title="Flujo V12 Total PDF Final">
        <ol>
          <li>Menú hamburguesa real en celular.</li>
          <li>Cliente → establecimientos → áreas usuarias.</li>
          <li>Cotización con 3 estructuras limpias.</li>
          <li>PDF con responsable, área usuaria y número de requerimiento.</li>
        </ol>
      </Card>
    </>
  );
}

function Empresas({ data, saveData }) {
  const empty = { id: uid("EMP"), nombreComercial: "", razonSocial: "", ruc: "", direccion: "", telefono: "", correo: "", responsable: "", serieCotizacion: "COT-2026", serieOS: "OS-2026", serieActa: "ACT-2026", serieInforme: "ITE-2026", serieGarantia: "GAR-2026" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  function startNew() { setForm({ ...empty, id: uid("EMP") }); setOpen(true); }
  function edit(item) { setForm(item); setOpen(true); }
  function save() {
    if (!form.razonSocial) return alert("Completa razón social");
    const exists = data.empresas.some(x => x.id === form.id);
    saveData({ ...data, empresas: exists ? data.empresas.map(x => x.id === form.id ? form : x) : [...data.empresas, form] }, "Empresa guardada");
    setOpen(false);
  }
  function remove(id) {
    if (!confirm("¿Eliminar empresa?")) return;
    saveData({ ...data, empresas: data.empresas.filter(x => x.id !== id) }, "Empresa eliminada");
  }

  return <Card title="Empresas">
    {!open && <button onClick={startNew}><Plus size={16} /> Agregar empresa</button>}
    {open && <div className="panel">
      <div className="grid3">
        <Input label="Nombre comercial" value={form.nombreComercial} onChange={v => setForm({ ...form, nombreComercial: v })} />
        <Input label="Razón social" value={form.razonSocial} onChange={v => setForm({ ...form, razonSocial: v })} />
        <Input label="RUC" value={form.ruc} onChange={v => setForm({ ...form, ruc: v })} />
        <Input label="Dirección" value={form.direccion} onChange={v => setForm({ ...form, direccion: v })} />
        <Input label="Teléfono" value={form.telefono} onChange={v => setForm({ ...form, telefono: v })} />
        <Input label="Correo" value={form.correo} onChange={v => setForm({ ...form, correo: v })} />
        <Input label="Responsable" value={form.responsable} onChange={v => setForm({ ...form, responsable: v })} />
        <Input label="Serie cotización" value={form.serieCotizacion} onChange={v => setForm({ ...form, serieCotizacion: v })} />
        <Input label="Serie OS" value={form.serieOS} onChange={v => setForm({ ...form, serieOS: v })} />
        <Input label="Serie acta" value={form.serieActa} onChange={v => setForm({ ...form, serieActa: v })} />
        <Input label="Serie informe" value={form.serieInforme} onChange={v => setForm({ ...form, serieInforme: v })} />
        <Input label="Serie garantía" value={form.serieGarantia} onChange={v => setForm({ ...form, serieGarantia: v })} />
      </div>
      <div className="actions"><button onClick={save}><Save size={16} /> Guardar</button><button className="ghost" onClick={() => setOpen(false)}>Cancelar</button></div>
    </div>}
    <Table rows={data.empresas} cols={[
      ["nombreComercial", "Nombre comercial"], ["razonSocial", "Razón social"], ["ruc", "RUC"], ["direccion", "Dirección"], ["responsable", "Responsable"],
      ["acciones", "Acciones", row => <RowActions onEdit={() => edit(row)} onDelete={() => remove(row.id)} />]
    ]} />
  </Card>;
}

function Clientes({ data, empresa, scoped, saveData }) {
  const emptyClient = { id: uid("CLI"), empresaId: empresa.id, razonSocial: "", ruc: "", direccion: "", contacto: "", telefono: "", correo: "" };
  const [mode, setMode] = useState("list");
  const [client, setClient] = useState(emptyClient);
  const [establishment, setEstablishment] = useState({ clienteId: "", nombre: "", direccion: "" });
  const [area, setArea] = useState({ establecimientoId: "", nombre: "" });

  function startNew() { setClient({ ...emptyClient, id: uid("CLI"), empresaId: empresa.id }); setMode("client"); }
  function edit(item) { setClient(item); setMode("client"); }
  function saveClient() {
    if (!client.razonSocial) return alert("Completa razón social del cliente");
    const exists = data.clientes.some(x => x.id === client.id);
    saveData({ ...data, clientes: exists ? data.clientes.map(x => x.id === client.id ? client : x) : [...data.clientes, client] }, "Cliente guardado");
    setMode("list");
  }
  function removeClient(id) {
    if (!confirm("Esto eliminará cliente, establecimientos, áreas y cotizaciones relacionadas. ¿Continuar?")) return;
    const estIds = data.establecimientos.filter(x => x.clienteId === id).map(x => x.id);
    saveData({
      ...data,
      clientes: data.clientes.filter(x => x.id !== id),
      establecimientos: data.establecimientos.filter(x => x.clienteId !== id),
      areas: data.areas.filter(x => !estIds.includes(x.establecimientoId)),
      cotizaciones: data.cotizaciones.filter(x => x.clienteId !== id)
    }, "Cliente eliminado");
  }
  function saveEstablishment() {
    if (!establishment.clienteId || !establishment.nombre) return alert("Selecciona cliente y completa establecimiento");
    saveData({ ...data, establecimientos: [...data.establecimientos, { id: uid("EST"), empresaId: empresa.id, ...establishment }] }, "Establecimiento guardado");
    setEstablishment({ clienteId: establishment.clienteId, nombre: "", direccion: "" });
  }
  function saveArea() {
    if (!area.establecimientoId || !area.nombre) return alert("Selecciona establecimiento y completa área usuaria");
    const est = data.establecimientos.find(x => x.id === area.establecimientoId);
    saveData({ ...data, areas: [...data.areas, { id: uid("AREA"), empresaId: empresa.id, clienteId: est?.clienteId || "", ...area }] }, "Área guardada");
    setArea({ establecimientoId: area.establecimientoId, nombre: "" });
  }

  return <Card title="Clientes, establecimientos y áreas usuarias">
    {mode === "list" && <>
      <button onClick={startNew}><Plus size={16} /> Agregar cliente</button>
      <div className="tree">
        {scoped.clientes.map(c => {
          const ests = scoped.establecimientos.filter(e => e.clienteId === c.id);
          return <div className="treeCard" key={c.id}>
            <div className="treeHead">
              <div><b>{c.razonSocial}</b><span>RUC/DNI: {c.ruc || "-"} · Contacto: {c.contacto || "-"}</span></div>
              <RowActions onEdit={() => edit(c)} onDelete={() => removeClient(c.id)} />
            </div>
            {ests.length === 0 && <small>Sin establecimientos registrados.</small>}
            {ests.map(e => {
              const areas = scoped.areas.filter(a => a.establecimientoId === e.id);
              return <div className="branch" key={e.id}>
                <b>🏥 {e.nombre}</b><span>{e.direccion}</span>
                <div className="areas">{areas.length ? areas.map(a => <em key={a.id}>{a.nombre}</em>) : <small>Sin áreas usuarias.</small>}</div>
              </div>;
            })}
          </div>;
        })}
      </div>

      <div className="two">
        <div className="panel">
          <h3>Agregar establecimiento</h3>
          <Select label="Cliente" value={establishment.clienteId} onChange={v => setEstablishment({ ...establishment, clienteId: v })}>
            <option value="">Seleccione cliente</option>
            {scoped.clientes.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
          </Select>
          <Input label="Nombre del establecimiento" value={establishment.nombre} onChange={v => setEstablishment({ ...establishment, nombre: v })} />
          <Input label="Dirección del establecimiento" value={establishment.direccion} onChange={v => setEstablishment({ ...establishment, direccion: v })} />
          <button onClick={saveEstablishment}><Plus size={16} /> Agregar establecimiento</button>
        </div>

        <div className="panel">
          <h3>Agregar área usuaria</h3>
          <Select label="Establecimiento" value={area.establecimientoId} onChange={v => setArea({ ...area, establecimientoId: v })}>
            <option value="">Seleccione establecimiento</option>
            {scoped.establecimientos.map(e => <option key={e.id} value={e.id}>{findName(scoped.clientes, e.clienteId, "razonSocial")} · {e.nombre}</option>)}
          </Select>
          <Input label="Área usuaria" value={area.nombre} onChange={v => setArea({ ...area, nombre: v })} />
          <button onClick={saveArea}><Plus size={16} /> Agregar área</button>
        </div>
      </div>
    </>}

    {mode === "client" && <div className="panel">
      <h3>{data.clientes.some(x => x.id === client.id) ? "Editar cliente" : "Nuevo cliente"}</h3>
      <div className="grid3">
        <Input label="Razón social / nombre" value={client.razonSocial} onChange={v => setClient({ ...client, razonSocial: v })} />
        <Input label="RUC / DNI" value={client.ruc} onChange={v => setClient({ ...client, ruc: v })} />
        <Input label="Dirección fiscal" value={client.direccion} onChange={v => setClient({ ...client, direccion: v })} />
        <Input label="Responsable / contacto" value={client.contacto} onChange={v => setClient({ ...client, contacto: v })} />
        <Input label="Teléfono" value={client.telefono} onChange={v => setClient({ ...client, telefono: v })} />
        <Input label="Correo" value={client.correo} onChange={v => setClient({ ...client, correo: v })} />
      </div>
      <div className="actions"><button onClick={saveClient}><Save size={16} /> Guardar cliente</button><button className="ghost" onClick={() => setMode("list")}>Cancelar</button></div>
    </div>}
  </Card>;
}

function Cotizaciones({ data, empresa, scoped, saveData }) {
  const [mode, setMode] = useState("list");
  const [quote, setQuote] = useState(defaultQuote(empresa, scoped.cotizaciones.length));
  const establishments = scoped.establecimientos.filter(x => x.clienteId === quote.clienteId);
  const areas = scoped.areas.filter(x => x.establecimientoId === quote.establecimientoId);
  const totalBase = calculateTotal(quote);
  const total = totalBase * 1.18;

  function startNew() { setQuote(defaultQuote(empresa, scoped.cotizaciones.length)); setMode("form"); }
  function edit(row) { setQuote(JSON.parse(JSON.stringify(row))); setMode("form"); }
  function remove(id) {
    if (!confirm("¿Eliminar cotización?")) return;
    saveData({ ...data, cotizaciones: data.cotizaciones.filter(x => x.id !== id) }, "Cotización eliminada");
  }
  function saveQuote() {
    if (!quote.clienteId) return alert("Selecciona cliente");
    if (!quote.establecimientoId) return alert("Selecciona establecimiento");
    if (!quote.areaId) return alert("Selecciona área usuaria");
    const baseFinal = calculateTotal(quote);
    const item = { ...quote, totalBase: baseFinal, total: baseFinal * 1.18, fecha: quote.fecha || today() };
    const exists = data.cotizaciones.some(q => q.id === quote.id);
    saveData({ ...data, cotizaciones: exists ? data.cotizaciones.map(q => q.id === quote.id ? item : q) : [...data.cotizaciones, item] }, "Cotización guardada");
    setMode("list");
  }

  return <Card title="Cotizaciones"><div className="versionBanner">SERVITEC PRO V12 TOTAL PDF FINAL · CÁLCULO DIRECTO DESDE FILAS</div><div style={{background:"#dff7e8",padding:"10px",borderRadius:"12px",fontWeight:"800",marginBottom:"10px"}}>SERVITEC PRO V12 TOTAL PDF FINAL · TOTAL Y PDF ACTIVO</div><div className="versionBanner">SERVITEC PRO V12 TOTAL PDF FINAL · TOTAL Y PDF ACTIVO</div>
    {mode === "list" && <>
      <button onClick={startNew}><Plus size={16} /> Nueva cotización</button>
      <Table rows={scoped.cotizaciones} cols={[
        ["numero", "N°"], ["fecha", "Fecha"],
        ["clienteId", "Cliente", row => findName(scoped.clientes, row.clienteId, "razonSocial")],
        ["establecimientoId", "Establecimiento", row => findName(scoped.establecimientos, row.establecimientoId, "nombre")],
        ["areaId", "Área", row => findName(scoped.areas, row.areaId, "nombre")],
        ["estructura", "Estructura", row => structureLabel(row.estructura)],
        ["estado", "Estado"],
        ["total", "Total", row => money(calculateTotal(row) * 1.18)],
        ["acciones", "Acciones", row => <div className="actions compact">
          <button onClick={() => edit(row)}><Pencil size={14} /> Editar</button>
          <button className="danger" onClick={() => remove(row.id)}><Trash2 size={14} /> Eliminar</button>
          <button onClick={() => exportPDF(`cot-${row.id}`, row.numero)}><Download size={14} /> PDF</button>
          <button onClick={() => exportWord(row)}>Word</button>
          <button onClick={() => exportExcel(row)}>Excel</button>
          <div className="hiddenDoc" id={`cot-${row.id}`}><QuoteDocument empresa={empresa} quote={row} scoped={scoped} /></div>
        </div>]
      ]} />
    </>}

    {mode === "form" && <>
      <div className="grid3">
        <Select label="Cliente" value={quote.clienteId} onChange={v => setQuote({ ...quote, clienteId: v, establecimientoId: "", areaId: "" })}>
          <option value="">Seleccione cliente</option>{scoped.clientes.map(c => <option key={c.id} value={c.id}>{c.razonSocial}</option>)}
        </Select>
        <Select label="Establecimiento" value={quote.establecimientoId} onChange={v => setQuote({ ...quote, establecimientoId: v, areaId: "" })}>
          <option value="">Seleccione establecimiento</option>{establishments.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </Select>
        <Select label="Área usuaria" value={quote.areaId} onChange={v => setQuote({ ...quote, areaId: v })}>
          <option value="">Seleccione área</option>{areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </Select>
        <Select label="Tipo" value={quote.tipo} onChange={v => setQuote({ ...quote, tipo: v })}><option>SERVICIO</option><option>SERVICIO + REPUESTOS</option><option>VENTA</option></Select>
        <Select label="Configuración" value={quote.estructura} onChange={v => setQuote({ ...quote, estructura: v })}>{structures.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Select label="Estado" value={quote.estado} onChange={v => setQuote({ ...quote, estado: v })}><option>Borrador</option><option>Enviado</option><option>Aprobado</option><option>Rechazado</option><option>En ejecución</option><option>Finalizado</option></Select>
      </div>

      <div className="sectionTitle">Datos del requerimiento</div>
      <div className="grid3">
        <Input label="Responsable solicitante" value={quote.solicitante} onChange={v => setQuote({ ...quote, solicitante: v })} />
        <Input label="Cargo del solicitante" value={quote.cargoSolicitante} onChange={v => setQuote({ ...quote, cargoSolicitante: v })} />
        <Input label="N° de requerimiento" value={quote.requerimientoNumero} onChange={v => setQuote({ ...quote, requerimientoNumero: v })} />
        <Input label="Fecha de requerimiento" type="date" value={quote.requerimientoFecha} onChange={v => setQuote({ ...quote, requerimientoFecha: v })} />
        <Input label="Referencia / proceso asociado" value={quote.referencia} onChange={v => setQuote({ ...quote, referencia: v })} />
      </div>

      <div className="actions">
        {quote.estructura === "EQUIPO_ACTIVIDADES" && <button onClick={() => setQuote({ ...quote, equipos: [...quote.equipos, { id: uid("EQ"), nombre: "", marca: "", modelo: "", serie: "", codigoPatrimonial: "", actividades: [] }] })}><Plus size={16} /> Agregar equipo</button>}
        {quote.estructura === "ACTIVIDADES_GENERALES_EQUIPOS" && <>
          <button onClick={() => setQuote({ ...quote, actividadesGenerales: [...quote.actividadesGenerales, { id: uid("ACT"), descripcion: "", cantidad: 1, precio: 0 }] })}><Plus size={16} /> Agregar actividad general</button>
          <button onClick={() => setQuote({ ...quote, equiposGenerales: [...quote.equiposGenerales, { id: uid("EQ"), nombre: "", marca: "", modelo: "", serie: "", codigoPatrimonial: "" }] })}><Plus size={16} /> Agregar equipo</button>
        </>}
        {quote.estructura === "SOLO_REPUESTOS" && <button onClick={() => setQuote({ ...quote, repuestos: [...quote.repuestos, { id: uid("REP"), descripcion: "", cantidad: 1, precio: 0 }] })}><Plus size={16} /> Agregar repuesto</button>}
        <button onClick={saveQuote}><Save size={16} /> Guardar cotización</button>
        <button className="ghost" onClick={() => setMode("list")}>Cancelar</button>
        <button onClick={() => exportPDF("quote-live", quote.numero)}><Download size={16} /> PDF</button>
      </div>

      <EditableQuote quote={quote} setQuote={setQuote} />

      <div className="sectionTitle">Condiciones</div>
      <div className="grid3">
        <Input label="Tiempo de ejecución" value={quote.tiempoEjecucion} onChange={v => setQuote({ ...quote, tiempoEjecucion: v })} />
        <Input label="Garantía" value={quote.garantia} onChange={v => setQuote({ ...quote, garantia: v })} />
        <Input label="Forma de pago" value={quote.formaPago} onChange={v => setQuote({ ...quote, formaPago: v })} />
        <Input label="Validez de oferta" value={quote.validez} onChange={v => setQuote({ ...quote, validez: v })} />
        <Input label="Lugar de atención" value={quote.lugarAtencion} onChange={v => setQuote({ ...quote, lugarAtencion: v })} />
      </div>

      <div className="totalLiveHint">TOTAL Y PDF ACTIVO · Ítems: {getAllQuoteRows(quote).length} · Base: {money(calculateTotal(quote))} · IGV: {money(calculateTotal(quote) * 0.18)} · Total: {money(calculateTotal(quote) * 1.18)}</div><div id="quote-live" className="printDoc"><QuoteDocument empresa={empresa} quote={{ ...quote, totalBase, total }} scoped={scoped} /></div>
    </>}
  </Card>;
}



function parseActivityImport(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let descripcion = line;
      let cantidad = "1";
      let precio = "0";

      if (line.includes(";")) {
        const parts = line.split(";");
        descripcion = (parts[0] || "").trim();
        cantidad = (parts[1] || "1").trim() || "1";
        precio = (parts[2] || "0").trim() || "0";
      } else if (line.includes("\t")) {
        const parts = line.split("\t");
        descripcion = (parts[0] || "").trim();
        cantidad = (parts[1] || "1").trim() || "1";
        precio = (parts[2] || "0").trim() || "0";
      } else {
        descripcion = line
          .replace(/^\d+\s*[\.\-\)]\s*/, "")
          .replace(/^[-•]\s*/, "")
          .trim();
        cantidad = "1";
        precio = "0";
      }

      const cleanQty = String(cantidad).replace(",", ".").replace(/[^\d.]/g, "").trim() || "1";
      const cleanPrice = String(precio).replace(",", ".").replace(/[^\d.]/g, "").trim() || "0";

      return {
        id: uid("ACT"),
        descripcion,
        cantidad: cleanQty,
        precio: cleanPrice
      };
    })
    .filter((item) => item.descripcion);
}

function parseEquipmentImport(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalized = line.replace(/\t/g, ";");
      const parts = normalized.includes(";") ? normalized.split(";") : normalized.split(",");
      return {
        id: uid("EQ"),
        nombre: (parts[0] || "").trim(),
        marca: (parts[1] || "").trim(),
        modelo: (parts[2] || "").trim(),
        serie: (parts[3] || "").trim(),
        codigoPatrimonial: (parts[4] || "").trim()
      };
    })
    .filter((item) => item.nombre);
}

function ImportBox({ title, placeholder, onImport, templateText }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="importBox">
      <button className="ghost" onClick={() => setOpen(!open)}>
        <Upload size={16} /> {open ? "Cerrar importación" : title}
      </button>

      {open && (
        <div className="importPanel">
          <small>Formato: una línea por registro. Columnas separadas por punto y coma (;), coma (,) o tabulación.</small>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
          />
          <div className="actions">
            <button onClick={() => {
              onImport(text);
              setText("");
              setOpen(false);
            }}>
              <Upload size={16} /> Importar
            </button>
            <button className="ghost" onClick={() => setText(templateText || "")}>Pegar ejemplo</button>
          </div>
        </div>
      )}
    </div>
  );
}


function EditableQuote({ quote, setQuote }) {
  const [activityDraft, setActivityDraft] = useState({ descripcion: "", cantidad: "1", precio: "0" });
  const [equipmentDraft, setEquipmentDraft] = useState({ nombre: "", marca: "", modelo: "", serie: "", codigoPatrimonial: "" });
  const [spareDraft, setSpareDraft] = useState({ descripcion: "", cantidad: "1", precio: "0" });
  const [editing, setEditing] = useState(null);

  function clearActivity() {
    setActivityDraft({ descripcion: "", cantidad: "1", precio: "0" });
    setEditing(null);
  }

  function clearEquipment() {
    setEquipmentDraft({ nombre: "", marca: "", modelo: "", serie: "", codigoPatrimonial: "" });
    setEditing(null);
  }

  function clearSpare() {
    setSpareDraft({ descripcion: "", cantidad: "1", precio: "0" });
    setEditing(null);
  }

  if (quote.estructura === "EQUIPO_ACTIVIDADES") {
    return (
      <>
        {quote.equipos.map((eq, index) => (
          <div className="box" id={`eq-${eq.id}`} key={eq.id}>
            <div className="boxHeader">
              <h3>Equipo {index + 1}</h3>
              <span>{(eq.actividades || []).length} actividades</span>
            </div>

            <EquipmentFields
              equipment={eq}
              onChange={(key, value) => setQuote({
                ...quote,
                equipos: quote.equipos.map((item) => item.id === eq.id ? { ...item, [key]: value } : item)
              })}
            />

            <div className="quickAddPanel" id={`form-act-${eq.id}`}>
              <h4>{editing?.type === "ACT_EQ" && editing.eqId === eq.id ? "Editar actividad" : "Agregar actividad"}</h4>
              <div className="quickAddGrid">
                <input onFocus={(event) => event.target.select()} placeholder="Actividad" value={activityDraft.descripcion} onChange={(event) => setActivityDraft({ ...activityDraft, descripcion: event.target.value })} />
                <input type="number" inputMode="decimal" onFocus={(event) => event.target.select()} placeholder="Cantidad" value={activityDraft.cantidad} onChange={(event) => setActivityDraft({ ...activityDraft, cantidad: event.target.value })} />
                <input type="number" inputMode="decimal" onFocus={(event) => event.target.select()} placeholder="Costo" value={activityDraft.precio} onChange={(event) => setActivityDraft({ ...activityDraft, precio: event.target.value })} />
                <button type="button" className="addCircleBtn" onClick={() => {
                  if (!activityDraft.descripcion) return alert("Ingresa la actividad.");
                  if (editing?.type === "ACT_EQ" && editing.eqId === eq.id) {
                    setQuote({
                      ...quote,
                      equipos: quote.equipos.map((item) => item.id === eq.id ? {
                        ...item,
                        actividades: item.actividades.map((act) => act.id === editing.id ? { ...act, descripcion: activityDraft.descripcion, cantidad: activityDraft.cantidad || '1', precio: activityDraft.precio || '0' } : act)
                      } : item)
                    });
                  } else {
                    setQuote({
                      ...quote,
                      equipos: quote.equipos.map((item) => item.id === eq.id ? {
                        ...item,
                        actividades: [...item.actividades, { id: uid("ACT"), orden: item.actividades.length + 1, descripcion: activityDraft.descripcion, cantidad: activityDraft.cantidad || '1', precio: activityDraft.precio || '0' }]
                      } : item)
                    });
                  }
                  clearActivity();
                }}>
                  <Check size={18} /> {editing?.type === "ACT_EQ" && editing.eqId === eq.id ? "Actualizar" : "+ Agregar"}
                </button>
              </div>

              {editing?.type === "ACT_EQ" && editing.eqId === eq.id && (
                <button type="button" className="ghost" onClick={clearActivity}>Cancelar edición</button>
              )}
            </div>

            <ImportBox
              title="Importar actividades del equipo"
              placeholder={"Actividad;Cantidad;Costo\nCambio de rodajes;1;400\nBarnizado de rotor;1;350"}
              templateText={"Cambio de rodajes;1;400\nBarnizado de rotor;1;350\nCambio de impulsor;1;250"}
              onImport={(text) => {
                const imported = parseActivityImport(text).map((item, i) => ({ ...item, orden: (eq.actividades || []).length + i + 1 }));
                if (!imported.length) return alert("No se encontraron actividades válidas.");
                setQuote({
                  ...quote,
                  equipos: quote.equipos.map((item) => item.id === eq.id ? { ...item, actividades: [...item.actividades, ...imported] } : item)
                });
              }}
            />

            <EditableList
              title="Actividades agregadas"
              empty="Aún no hay actividades."
              rows={(eq.actividades || []).map((act) => ({
                id: act.id,
                title: `${act.orden}. ${act.descripcion || "Actividad sin descripción"}`,
                subtitle: `Cantidad: ${act.cantidad || 0} · Costo: ${money(act.precio)}`,
                onEdit: () => {
                  setEditing({ type: "ACT_EQ", eqId: eq.id, id: act.id });
                  setActivityDraft({ descripcion: act.descripcion || "", cantidad: String(act.cantidad ?? ""), precio: String(act.precio ?? "") });
                  setTimeout(() => document.getElementById(`form-act-${eq.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
                },
                onDelete: () => {
                  setQuote({
                    ...quote,
                    equipos: quote.equipos.map((item) => item.id === eq.id ? {
                      ...item,
                      actividades: item.actividades.filter((x) => x.id !== act.id).map((x, i) => ({ ...x, orden: i + 1 }))
                    } : item)
                  });
                }
              }))}
            />
          </div>
        ))}
      </>
    );
  }

  if (quote.estructura === "ACTIVIDADES_GENERALES_EQUIPOS") {
    return (
      <>
        <div className="box">
          <div className="boxHeader">
            <h3>Actividades generales</h3>
            <span>{quote.actividadesGenerales.length} agregadas</span>
          </div>

          <div className="quickAddPanel" id="form-act-gen">
            <h4>{editing?.type === "ACT_GEN" ? "Editar actividad" : "Agregar actividad"}</h4>
            <div className="quickAddGrid">
              <input onFocus={(event) => event.target.select()} placeholder="Actividad" value={activityDraft.descripcion} onChange={(event) => setActivityDraft({ ...activityDraft, descripcion: event.target.value })} />
              <input type="number" inputMode="decimal" onFocus={(event) => event.target.select()} placeholder="Cantidad" value={activityDraft.cantidad} onChange={(event) => setActivityDraft({ ...activityDraft, cantidad: event.target.value })} />
              <input type="number" inputMode="decimal" onFocus={(event) => event.target.select()} placeholder="Costo" value={activityDraft.precio} onChange={(event) => setActivityDraft({ ...activityDraft, precio: event.target.value })} />
              <button type="button" className="addCircleBtn" onClick={() => {
                if (!activityDraft.descripcion) return alert("Ingresa la actividad.");
                if (editing?.type === "ACT_GEN") {
                  setQuote({
                    ...quote,
                    actividadesGenerales: quote.actividadesGenerales.map((act) => act.id === editing.id ? { ...act, descripcion: activityDraft.descripcion, cantidad: activityDraft.cantidad || '1', precio: activityDraft.precio || '0' } : act)
                  });
                } else {
                  setQuote({
                    ...quote,
                    actividadesGenerales: [...quote.actividadesGenerales, { id: uid("ACT"), descripcion: activityDraft.descripcion, cantidad: activityDraft.cantidad || '1', precio: activityDraft.precio || '0' }]
                  });
                }
                clearActivity();
              }}>
                <Check size={18} /> {editing?.type === "ACT_GEN" ? "Actualizar" : "+ Agregar"}
              </button>
            </div>
            {editing?.type === "ACT_GEN" && <button type="button" className="ghost" onClick={clearActivity}>Cancelar edición</button>}
          </div>

          <ImportBox
            title="Importar actividades generales"
            placeholder={"Actividad;Cantidad;Costo\nMantenimiento preventivo;1;120\nPruebas funcionales;1;80"}
            templateText={"Inspección inicial;1;0\nMantenimiento preventivo;1;120\nPruebas funcionales;1;80"}
            onImport={(text) => {
              const imported = parseActivityImport(text);
              if (!imported.length) return alert("No se encontraron actividades válidas.");
              setQuote({ ...quote, actividadesGenerales: [...quote.actividadesGenerales, ...imported] });
            }}
          />

          <EditableList
            title="Lista de actividades"
            empty="Aún no hay actividades agregadas."
            rows={quote.actividadesGenerales.map((act, index) => ({
              id: act.id,
              title: `${index + 1}. ${act.descripcion || "Actividad sin descripción"}`,
              subtitle: `Cantidad: ${act.cantidad || 0} · Costo: ${money(act.precio)}`,
              onEdit: () => {
                setEditing({ type: "ACT_GEN", id: act.id });
                setActivityDraft({ descripcion: act.descripcion || "", cantidad: String(act.cantidad ?? ""), precio: String(act.precio ?? "") });
                setTimeout(() => document.getElementById("form-act-gen")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
              },
              onDelete: () => setQuote({ ...quote, actividadesGenerales: quote.actividadesGenerales.filter((x) => x.id !== act.id) })
            }))}
          />

          <p className="note">Todas estas actividades se aplican a todos los equipos que agregues abajo.</p>
        </div>

        <div className="box">
          <div className="boxHeader">
            <h3>Equipos incluidos</h3>
            <span>{quote.equiposGenerales.length} agregados</span>
          </div>

          <div className="quickAddPanel" id="form-eq-gen">
            <h4>{editing?.type === "EQ_GEN" ? "Editar equipo" : "Agregar equipo"}</h4>
            <EquipmentFields equipment={equipmentDraft} onChange={(key, value) => setEquipmentDraft({ ...equipmentDraft, [key]: value })} />
            <div className="actions">
              <button type="button" className="addCircleBtn" onClick={() => {
                if (!equipmentDraft.nombre) return alert("Ingresa el nombre del equipo.");
                if (editing?.type === "EQ_GEN") {
                  setQuote({ ...quote, equiposGenerales: quote.equiposGenerales.map((eq) => eq.id === editing.id ? { ...eq, ...equipmentDraft } : eq) });
                } else {
                  setQuote({ ...quote, equiposGenerales: [...quote.equiposGenerales, { id: uid("EQ"), ...equipmentDraft }] });
                }
                clearEquipment();
              }}>
                <Check size={18} /> {editing?.type === "EQ_GEN" ? "Actualizar equipo" : "+ Agregar equipo"}
              </button>
              {editing?.type === "EQ_GEN" && <button type="button" className="ghost" onClick={clearEquipment}>Cancelar edición</button>}
            </div>
          </div>

          <ImportBox
            title="Importar equipos"
            placeholder={"Equipo;Marca;Modelo;Serie;Código patrimonial\nBomba de agua;PEDROLLO;CPM;S001;PAT-001"}
            templateText={"Bomba de agua 1;PEDROLLO;CPM;S001;PAT-001\nBomba de agua 2;PEDROLLO;CPM;S002;PAT-002"}
            onImport={(text) => {
              const imported = parseEquipmentImport(text);
              if (!imported.length) return alert("No se encontraron equipos válidos.");
              setQuote({ ...quote, equiposGenerales: [...quote.equiposGenerales, ...imported] });
            }}
          />

          <EditableList
            title="Lista de equipos"
            empty="Aún no hay equipos agregados."
            rows={quote.equiposGenerales.map((eq, index) => ({
              id: eq.id,
              title: `${index + 1}. ${eq.nombre || "Equipo sin nombre"}`,
              subtitle: `${eq.marca || "-"} · ${eq.modelo || "-"} · Serie: ${eq.serie || "-"}`,
              onEdit: () => {
                setEditing({ type: "EQ_GEN", id: eq.id });
                setEquipmentDraft({ nombre: eq.nombre || "", marca: eq.marca || "", modelo: eq.modelo || "", serie: eq.serie || "", codigoPatrimonial: eq.codigoPatrimonial || "" });
                setTimeout(() => document.getElementById("form-eq-gen")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
              },
              onDelete: () => setQuote({ ...quote, equiposGenerales: quote.equiposGenerales.filter((x) => x.id !== eq.id) })
            }))}
          />
        </div>
      </>
    );
  }

  return (
    <div className="box">
      <div className="boxHeader">
        <h3>Repuestos / productos / accesorios</h3>
        <span>{quote.repuestos.length} agregados</span>
      </div>

      <div className="quickAddPanel" id="form-rep">
        <h4>{editing?.type === "REP" ? "Editar ítem" : "Agregar ítem"}</h4>
        <div className="quickAddGrid">
          <input onFocus={(event) => event.target.select()} placeholder="Descripción" value={spareDraft.descripcion} onChange={(event) => setSpareDraft({ ...spareDraft, descripcion: event.target.value })} />
          <input type="number" inputMode="decimal" onFocus={(event) => event.target.select()} placeholder="Cantidad" value={spareDraft.cantidad} onChange={(event) => setSpareDraft({ ...spareDraft, cantidad: event.target.value })} />
          <input type="number" inputMode="decimal" onFocus={(event) => event.target.select()} placeholder="Costo" value={spareDraft.precio} onChange={(event) => setSpareDraft({ ...spareDraft, precio: event.target.value })} />
          <button type="button" className="addCircleBtn" onClick={() => {
            if (!spareDraft.descripcion) return alert("Ingresa descripción.");
            if (editing?.type === "REP") {
              setQuote({ ...quote, repuestos: quote.repuestos.map((item) => item.id === editing.id ? { ...item, descripcion: spareDraft.descripcion, cantidad: spareDraft.cantidad || '1', precio: spareDraft.precio || '0' } : item) });
            } else {
              setQuote({ ...quote, repuestos: [...quote.repuestos, { id: uid("REP"), descripcion: spareDraft.descripcion, cantidad: spareDraft.cantidad || '1', precio: spareDraft.precio || '0' }] });
            }
            clearSpare();
          }}>
            <Check size={18} /> {editing?.type === "REP" ? "Actualizar" : "+ Agregar"}
          </button>
        </div>
        {editing?.type === "REP" && <button type="button" className="ghost" onClick={clearSpare}>Cancelar edición</button>}
      </div>

      <ImportBox
        title="Importar repuestos / productos"
        placeholder={"Descripción;Cantidad;Costo\nRodaje 6203;2;35\nSello mecánico;1;60"}
        templateText={"Rodaje 6203;2;35\nSello mecánico;1;60\nFaja industrial;1;45"}
        onImport={(text) => {
          const imported = parseActivityImport(text).map((item) => ({ ...item, id: uid("REP") }));
          if (!imported.length) return alert("No se encontraron ítems válidos.");
          setQuote({ ...quote, repuestos: [...quote.repuestos, ...imported] });
        }}
      />

      <EditableList
        title="Lista de ítems"
        empty="Aún no hay ítems agregados."
        rows={quote.repuestos.map((item, index) => ({
          id: item.id,
          title: `${index + 1}. ${item.descripcion || "Ítem sin descripción"}`,
          subtitle: `Cantidad: ${item.cantidad || 0} · Costo: ${money(item.precio)}`,
          onEdit: () => {
            setEditing({ type: "REP", id: item.id });
            setSpareDraft({ descripcion: item.descripcion || "", cantidad: String(item.cantidad ?? ""), precio: String(item.precio ?? "") });
            setTimeout(() => document.getElementById("form-rep")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
          },
          onDelete: () => setQuote({ ...quote, repuestos: quote.repuestos.filter((x) => x.id !== item.id) })
        }))}
      />
    </div>
  );
}

function EditableList({ title, rows, empty }) {
  return (
    <div className="editableList">
      <h4>{title}</h4>
      {rows.length === 0 && <p className="emptyList">{empty}</p>}
      {rows.map((row) => (
        <div className="editableItem" key={row.id}>
          <div>
            <b>{row.title}</b>
            <span>{row.subtitle}</span>
          </div>
          <div className="editableActions">
            <button type="button" onClick={row.onEdit}><Pencil size={14} /> Editar</button>
            <button type="button" className="danger" onClick={row.onDelete}><Trash2 size={14} /> Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EquipmentFields({ equipment, onChange }) {
  return <div className="grid3">
    <Input label="Nombre del equipo" value={equipment.nombre} onChange={v => onChange("nombre", v)} />
    <Input label="Marca" value={equipment.marca} onChange={v => onChange("marca", v)} />
    <Input label="Modelo" value={equipment.modelo} onChange={v => onChange("modelo", v)} />
    <Input label="Serie" value={equipment.serie} onChange={v => onChange("serie", v)} />
    <Input label="Código patrimonial" value={equipment.codigoPatrimonial} onChange={v => onChange("codigoPatrimonial", v)} />
  </div>;
}
function updateActivity(quote, setQuote, eqId, actId, key, value) {
  setQuote({ ...quote, equipos: quote.equipos.map(eq => eq.id === eqId ? { ...eq, actividades: eq.actividades.map(a => a.id === actId ? { ...a, [key]: value } : a) } : eq) });
}


function QuoteDocument({ empresa, quote, scoped }) {
  const rows = getQuoteRows(quote);
  const base = rows.reduce((sum, row) => sum + rowAmount(row), 0);
  const igv = base * 0.18;
  const total = base + igv;

  return (
    <div>
      <div className="docHeader">
        <div>
          <h2>COTIZACIÓN</h2>
          <p>{quote.numero}</p>
        </div>
        <div className="docCompany">
          <b>{empresa.razonSocial}</b>
          <p>RUC {empresa.ruc}</p>
          <p>{empresa.direccion}</p>
          <p>{empresa.telefono} · {empresa.correo}</p>
        </div>
      </div>

      <div className="docGrid">
        <div><b>Cliente:</b> {findName(scoped.clientes, quote.clienteId, "razonSocial")}</div>
        <div><b>Establecimiento:</b> {findName(scoped.establecimientos, quote.establecimientoId, "nombre")}</div>
        <div><b>Área usuaria:</b> {findName(scoped.areas, quote.areaId, "nombre")}</div>
        <div><b>Solicitante:</b> {quote.solicitante || "-"}</div>
        <div><b>Cargo:</b> {quote.cargoSolicitante || "-"}</div>
        <div><b>N° requerimiento:</b> {quote.requerimientoNumero || "-"}</div>
        <div><b>Fecha requerimiento:</b> {quote.requerimientoFecha || "-"}</div>
        <div><b>Referencia:</b> {quote.referencia || "-"}</div>
      </div>

      <div className="quoteMode">
        <b>Configuración:</b> {structureLabel(quote.estructura)}
      </div>

      {quote.estructura === "EQUIPO_ACTIVIDADES" && (quote.equipos || []).map((eq, index) => (
        <div className="docBox" key={eq.id || index}>
          <h3>Equipo {index + 1}: {eq.nombre || "-"}</h3>
          <p>Marca: {eq.marca || "-"} · Modelo: {eq.modelo || "-"} · Serie: {eq.serie || "-"} · Código: {eq.codigoPatrimonial || "-"}</p>
          <SimpleRows rows={eq.actividades || []} />
        </div>
      ))}

      {quote.estructura === "ACTIVIDADES_GENERALES_EQUIPOS" && (
        <>
          <div className="docBox">
            <h3>Actividades generales</h3>
            <SimpleRows rows={quote.actividadesGenerales || []} />
          </div>

          <div className="docBox">
            <h3>Equipos incluidos</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Serie</th>
                  <th>Código</th>
                </tr>
              </thead>
              <tbody>
                {(quote.equiposGenerales || []).length ? (quote.equiposGenerales || []).map((eq, index) => (
                  <tr key={eq.id || index}>
                    <td>{index + 1}</td>
                    <td>{eq.nombre || "-"}</td>
                    <td>{eq.marca || "-"}</td>
                    <td>{eq.modelo || "-"}</td>
                    <td>{eq.serie || "-"}</td>
                    <td>{eq.codigoPatrimonial || "-"}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="6">Sin equipos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {quote.estructura === "SOLO_REPUESTOS" && (
        <div className="docBox">
          <h3>Repuestos / productos</h3>
          <SimpleRows rows={quote.repuestos || []} />
        </div>
      )}

      <div className="sectionTitle">Condiciones comerciales y técnicas</div>
      <div className="docGrid">
        <div><b>Tiempo:</b> {quote.tiempoEjecucion || "-"}</div>
        <div><b>Garantía:</b> {quote.garantia || "-"}</div>
        <div><b>Pago:</b> {quote.formaPago || "-"}</div>
        <div><b>Validez:</b> {quote.validez || "-"}</div>
        <div><b>Lugar:</b> {quote.lugarAtencion || "-"}</div>
      </div>

      <h3 className="finalTotalBox">
        Total base: {money(base)} · IGV: {money(igv)} · Total: {money(total)}
      </h3>

      <div className="singleSignature">
        <div>Gerente General / Representante Comercial</div>
      </div>
    </div>
  );
}

function SimpleRows({ rows }) {
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Descripción</th>
          <th>Cantidad</th>
          <th>Precio</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {rows.length ? rows.map((row, index) => (
          <tr key={row.id || index}>
            <td>{row.orden || index + 1}</td>
            <td>{row.descripcion || "-"}</td>
            <td>{toNumber(row.cantidad || 1) || 1}</td>
            <td>{money(row.precio)}</td>
            <td>{money(rowAmount(row))}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan="5">Sin detalle registrado.</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Ejecucion({ data, empresa, scoped, saveData }) {
  const [quoteId, setQuoteId] = useState(scoped.cotizaciones[0]?.id || "");
  const [tecnico, setTecnico] = useState("");
  const [estado, setEstado] = useState("En ejecución");
  const [jobState, setJobState] = useState({});
  const quote = scoped.cotizaciones.find(q => q.id === quoteId);
  const jobs = quote ? extractJobs(quote) : [];

  React.useEffect(() => {
    const next = {};
    jobs.forEach((job) => {
      next[job.id] = jobState[job.id] || {
        estado: "Pendiente",
        observaciones: "",
        evidencia: "",
        evidenciaNombre: ""
      };
    });
    setJobState(next);
  }, [quoteId]);

  function updateJob(id, key, value) {
    setJobState((previous) => ({
      ...previous,
      [id]: {
        estado: "Pendiente",
        observaciones: "",
        evidencia: "",
        evidenciaNombre: "",
        ...(previous[id] || {}),
        [key]: value
      }
    }));
  }

  function loadEvidence(jobId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJobState((previous) => ({
        ...previous,
        [jobId]: {
          estado: "Pendiente",
          observaciones: "",
          evidencia: "",
          evidenciaNombre: "",
          ...(previous[jobId] || {}),
          evidencia: reader.result,
          evidenciaNombre: file.name
        }
      }));
    };
    reader.readAsDataURL(file);
  }

  function save() {
    if (!quote) return alert("Selecciona cotización");
    if (!jobs.length) return alert("La cotización seleccionada no tiene actividades/repuestos para ejecutar.");

    const trabajos = jobs.map((job, index) => ({
      ...job,
      orden: index + 1,
      estado: jobState[job.id]?.estado || "Pendiente",
      observaciones: jobState[job.id]?.observaciones || "",
      evidencia: jobState[job.id]?.evidencia || "",
      evidenciaNombre: jobState[job.id]?.evidenciaNombre || ""
    }));

    const existing = data.ejecuciones.find((item) => item.cotizacionId === quote.id);
    const item = {
      ...(existing || {}),
      id: existing?.id || uid("OS"),
      empresaId: empresa.id,
      cotizacionId: quote.id,
      numero: existing?.numero || `${empresa.serieOS}-${String(scoped.ejecuciones.length + 1).padStart(4, "0")}`,
      fecha: today(),
      tecnico,
      estado,
      trabajos
    };

    saveData({
      ...data,
      ejecuciones: existing
        ? data.ejecuciones.map((row) => row.id === existing.id ? item : row)
        : [...data.ejecuciones, item],
      cotizaciones: data.cotizaciones.map(q => q.id === quote.id ? { ...q, estado: estado === "Finalizado" ? "Finalizado" : "En ejecución" } : q)
    }, "Ejecución guardada con actividades, estado, observaciones y evidencias");
    alert("Ejecución guardada");
  }

  return <Card title="Ejecución ligada a cotización">
    <Select label="Cotización" value={quoteId} onChange={setQuoteId}>
      <option value="">Seleccione cotización</option>
      {scoped.cotizaciones.map(q => <option key={q.id} value={q.id}>{q.numero} · {findName(scoped.clientes, q.clienteId, "razonSocial")}</option>)}
    </Select>

    <div className="grid3">
      <Input label="Técnico responsable" value={tecnico} onChange={setTecnico} />
      <Select label="Estado general" value={estado} onChange={setEstado}>
        <option>En ejecución</option>
        <option>Observado</option>
        <option>Finalizado</option>
      </Select>
      <Field label="Actividades detectadas"><div className="pillInfo">{jobs.length} actividades / ítems</div></Field>
    </div>

    {quote && <div className="executionSummary">
      <b>{quote.numero}</b>
      <span>{structureLabel(quote.estructura)} · {findName(scoped.clientes, quote.clienteId, "razonSocial")}</span>
    </div>}

    <div className="executionTable">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Actividad / ítem</th>
            <th>Equipo / detalle</th>
            <th>Estado</th>
            <th>Observaciones</th>
            <th>Evidencia</th>
          </tr>
        </thead>
        <tbody>
          {jobs.length ? jobs.map((job, index) => (
            <tr key={job.id}>
              <td>{index + 1}</td>
              <td><b>{job.titulo}</b></td>
              <td>{job.detalle}</td>
              <td>
                <select
                  value={jobState[job.id]?.estado || "Pendiente"}
                  onChange={(event) => updateJob(job.id, "estado", event.target.value)}
                >
                  <option>Pendiente</option>
                  <option>En proceso</option>
                  <option>Ejecutado</option>
                  <option>Observado</option>
                  <option>No aplica</option>
                </select>
              </td>
              <td>
                <textarea
                  placeholder="Observaciones de campo"
                  value={jobState[job.id]?.observaciones || ""}
                  onChange={(event) => updateJob(job.id, "observaciones", event.target.value)}
                />
              </td>
              <td>
                <input type="file" accept="image/*" capture="environment" onChange={(event) => loadEvidence(job.id, event.target.files?.[0])} />
                {jobState[job.id]?.evidencia && <img className="evidenceThumb" src={jobState[job.id].evidencia} alt="Evidencia" />}
                {jobState[job.id]?.evidenciaNombre && <small>{jobState[job.id].evidenciaNombre}</small>}
              </td>
            </tr>
          )) : <tr><td colSpan="6">Selecciona una cotización con actividades para iniciar la ejecución.</td></tr>}
        </tbody>
      </table>
    </div>

    <div className="actions">
      <button onClick={save}><Save size={16} /> Guardar ejecución</button>
    </div>

    <h3>Órdenes / ejecuciones guardadas</h3>
    <Table rows={scoped.ejecuciones} cols={[
      ["numero", "OS"],
      ["fecha", "Fecha"],
      ["tecnico", "Técnico"],
      ["estado", "Estado"],
      ["trabajos", "Actividades", row => (row.trabajos || []).length]
    ]} />
  </Card>;
}
function extractJobs(q) {
  if (q.estructura === "EQUIPO_ACTIVIDADES") {
    return (q.equipos || []).flatMap((eq, ei) => (eq.actividades || []).map((a, ai) => ({
      id: `${eq.id || ei}-${a.id || ai}`,
      titulo: a.descripcion || `Actividad ${ai + 1}`,
      detalle: `${eq.nombre || "Equipo " + (ei + 1)} · Serie: ${eq.serie || "-"} · Código: ${eq.codigoPatrimonial || "-"}`,
      equipoId: eq.id || "",
      actividadId: a.id || "",
      cantidad: a.cantidad || 1,
      precio: a.precio || 0
    })));
  }

  if (q.estructura === "ACTIVIDADES_GENERALES_EQUIPOS") {
    const equipos = q.equiposGenerales || [];
    const actividades = q.actividadesGenerales || [];
    if (equipos.length) {
      return equipos.flatMap((eq, ei) => actividades.map((a, ai) => ({
        id: `${eq.id || ei}-${a.id || ai}`,
        titulo: a.descripcion || `Actividad general ${ai + 1}`,
        detalle: `${eq.nombre || "Equipo " + (ei + 1)} · Serie: ${eq.serie || "-"} · Código: ${eq.codigoPatrimonial || "-"}`,
        equipoId: eq.id || "",
        actividadId: a.id || "",
        cantidad: a.cantidad || 1,
        precio: a.precio || 0
      })));
    }
    return actividades.map((a, i) => ({
      id: a.id || `ACT-${i}`,
      titulo: a.descripcion || `Actividad general ${i + 1}`,
      detalle: "Actividad general sin equipos registrados",
      actividadId: a.id || "",
      cantidad: a.cantidad || 1,
      precio: a.precio || 0
    }));
  }

  return (q.repuestos || []).map((r, i) => ({
    id: r.id || `REP-${i}`,
    titulo: r.descripcion || `Repuesto/producto ${i + 1}`,
    detalle: `Cantidad: ${r.cantidad || 0}`,
    repuestoId: r.id || "",
    cantidad: r.cantidad || 1,
    precio: r.precio || 0
  }));
}

function Evidencias({ data, empresa, scoped, saveData }) {
  const [form, setForm] = useState({ ejecucionId: "", descripcion: "", foto: "" });
  function save() {
    if (!form.ejecucionId) return alert("Selecciona ejecución");
    saveData({ ...data, evidencias: [...data.evidencias, { id: uid("EVI"), empresaId: empresa.id, fecha: today(), ...form }] }, "Evidencia guardada");
    setForm({ ejecucionId: form.ejecucionId, descripcion: "", foto: "" });
  }
  return <Card title="Evidencias fotográficas">
    <Select label="Ejecución" value={form.ejecucionId} onChange={v => setForm({ ...form, ejecucionId: v })}><option value="">Seleccione ejecución</option>{scoped.ejecuciones.map(e => <option key={e.id} value={e.id}>{e.numero} · {e.tecnico}</option>)}</Select>
    <Input label="Descripción" value={form.descripcion} onChange={v => setForm({ ...form, descripcion: v })} />
    <Field label="Foto / evidencia"><input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setForm({ ...form, foto: reader.result }); reader.readAsDataURL(file); }} /></Field>
    <button onClick={save}><Save size={16} /> Guardar evidencia</button>
    <div className="gallery">{scoped.evidencias.map(e => <div key={e.id}>{e.foto && <img src={e.foto} alt="" />}<p>{e.descripcion}</p></div>)}</div>
  </Card>;
}

function Inventario({ data, empresa, scoped, saveData }) {
  const [form, setForm] = useState({ codigo: "", descripcion: "", tipo: "Repuesto", stock: 0, precio: 0, vencimiento: "", certificado: "" });
  function save() {
    if (!form.descripcion) return alert("Completa descripción");
    saveData({ ...data, productos: [...data.productos, { id: uid("PROD"), empresaId: empresa.id, ...form }] }, "Producto guardado");
    setForm({ codigo: "", descripcion: "", tipo: "Repuesto", stock: 0, precio: 0, vencimiento: "", certificado: "" });
  }
  return <Card title="Inventario"><div className="grid3">
    <Input label="Código" value={form.codigo} onChange={v => setForm({ ...form, codigo: v })} />
    <Input label="Descripción" value={form.descripcion} onChange={v => setForm({ ...form, descripcion: v })} />
    <Input label="Tipo" value={form.tipo} onChange={v => setForm({ ...form, tipo: v })} />
    <Input label="Stock" type="number" value={form.stock} onChange={v => setForm({ ...form, stock: v })} />
    <Input label="Precio" type="number" value={form.precio} onChange={v => setForm({ ...form, precio: v })} />
    <Input label="Vencimiento" type="date" value={form.vencimiento} onChange={v => setForm({ ...form, vencimiento: v })} />
    <Input label="Certificado" value={form.certificado} onChange={v => setForm({ ...form, certificado: v })} />
  </div><button onClick={save}><Save size={16} /> Guardar producto</button><Table rows={scoped.productos} cols={[["codigo", "Código"], ["descripcion", "Descripción"], ["tipo", "Tipo"], ["stock", "Stock"], ["precio", "Precio"], ["vencimiento", "Vencimiento"], ["certificado", "Certificado"]]} /></Card>;
}

function Documentos({ scoped }) { return <Card title="Documentos técnicos"><p>Documentos disponibles: cotización, orden de servicio, acta de conformidad, informe técnico de ejecución y certificado de garantía.</p><Table rows={scoped.cotizaciones} cols={[["numero", "Cotización"], ["fecha", "Fecha"], ["estado", "Estado"], ["total", "Total", row => money(calculateTotal(row) * 1.18)]]} /></Card>; }
function Sync({ data }) { return <Card title="Sync y auditoría"><Table rows={data.syncLog} cols={[["fecha", "Fecha"], ["accion", "Acción"]]} /></Card>; }
function Config() { return <Card title="Configuración V11.8"><ul><li><b>Equipo → actividades:</b> cada equipo tiene trabajos propios.</li><li><b>Actividades generales → equipos múltiples:</b> varias actividades se aplican a todos los equipos listados.</li><li><b>Solo repuestos / venta:</b> productos, repuestos o accesorios sin ejecución técnica.</li></ul></Card>; }

function RowActions({ onEdit, onDelete }) { return <div className="actions compact"><button onClick={onEdit}><Pencil size={14} /> Editar</button><button className="danger" onClick={onDelete}><Trash2 size={14} /> Borrar</button></div>; }
function Table({ rows, cols }) {
  return <div className="table"><table><thead><tr>{cols.map((c, i) => <th key={i}>{c[1]}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, ri) => <tr key={row.id || ri}>{cols.map((c, ci) => <td key={ci}>{c[2] ? c[2](row) : String(row[c[0]] ?? "")}</td>)}</tr>) : <tr><td colSpan={cols.length}>Sin registros.</td></tr>}</tbody></table></div>;
}

async function exportPDF(id, name) {
  const node = document.getElementById(id);

  if (!node) {
    alert("No se encontró documento para exportar");
    return;
  }

  const oldDisplay = node.style.display;
  const oldPosition = node.style.position;
  const oldLeft = node.style.left;

  node.style.display = "block";
  node.style.position = "fixed";
  node.style.left = "0";
  node.style.top = "0";
  node.style.zIndex = "9999";
  node.style.background = "#ffffff";

  await new Promise(resolve => setTimeout(resolve, 300));

  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  const image = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const width = 210;
  const height = canvas.height * width / canvas.width;

  pdf.addImage(image, "PNG", 0, 0, width, Math.min(height, 297));

  pdf.save(`${name || "documento"}.pdf`);

  node.style.display = oldDisplay;
  node.style.position = oldPosition;
  node.style.left = oldLeft;
}
function exportWord(row) { downloadBlob(new Blob([`Cotización ${row.numero}\nEstructura: ${structureLabel(row.estructura)}\nTotal: ${money(calculateTotal(row) * 1.18)}`], { type: "application/msword" }), `${row.numero}.doc`); }
function exportExcel(row) { downloadBlob(new Blob([`Numero,Fecha,Estructura,Estado,Total\n${row.numero},${row.fecha},${structureLabel(row.estructura)},${row.estado},${row.total}`], { type: "text/csv" }), `${row.numero}.csv`); }
function downloadBlob(blob, filename) { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }

createRoot(document.getElementById("root")).render(<App />);
