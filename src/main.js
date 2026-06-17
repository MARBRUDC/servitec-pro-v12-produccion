/* SERVITEC PRO V13.29.3 SUPABASE Y DOCUMENTOS MOVIL */
const VERSION='SERVITEC PRO V13.29.3 SUPABASE + DOCUMENTOS MÓVIL';
const STORE='servitec_pro_state_v1328';
const SESSION='servitec_session_user_v1328';
const CLOUD_ID='global';
const ENV=window.SERVITEC_ENV||{};
const SUPABASE_URL=(ENV.VITE_SUPABASE_URL||ENV.SUPABASE_URL||'').replace(/\/$/,'');
const SUPABASE_KEY=ENV.VITE_SUPABASE_KEY||ENV.SUPABASE_KEY||ENV.VITE_SUPABASE_ANON_KEY||ENV.SUPABASE_ANON_KEY||'';
let cloudStatus=(SUPABASE_URL&&SUPABASE_KEY)?'Supabase configurado':'Modo local';
let cloudTimer=null, cloudReady=false;
const LEGACY=['servitec_pro_state_v1327','servitec_pro_state_v1317','servitec_v139'];
const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
const uid=()=>Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const num=v=>Number(String(v??'').replace(',', '.'))||0; const money=n=>'S/ '+num(n).toFixed(2); const year=()=>new Date().getFullYear();
const MODES={GENERAL:'Actividades generales → varios equipos',PROPIAS:'Cada equipo con sus propias actividades',MIXTO:'Servicio + repuestos',SOLO_EQUIPOS:'Solo equipos',SOLO_REPUESTOS:'Solo repuestos'};
const SERVICE_TYPES=['Mantenimiento preventivo','Mantenimiento correctivo','Calibración','Diagnóstico','Instalación','Venta','Servicio + repuestos'];
function configOptionsFor(tipo){
  // El tipo de servicio define el rubro comercial; la configuración define cómo se arma la cotización.
  return [MODES.GENERAL, MODES.PROPIAS, MODES.MIXTO, MODES.SOLO_EQUIPOS, MODES.SOLO_REPUESTOS];
}
function ensureValidConfig(q){let opts=configOptionsFor(q.tipo||SERVICE_TYPES[0]); if(!opts.includes(q.config)) q.config=opts[0]; return q.config}
const MODULES=['Dashboard','Empresas','Clientes','Cotizaciones','Órdenes','Ejecución','Actas','Informes','Inventario','Configuración','Usuarios'];
const ACTIONS=['ver','crear','editar','eliminar','pdf'];
const ROLES=['ADMIN','GERENTE','OPERADOR','TECNICO','LECTURA'];
const ROLE_PERMS={
  ADMIN:Object.fromEntries(MODULES.map(m=>[m,{ver:1,crear:1,editar:1,eliminar:1,pdf:1,costos:1} ])),
  GERENTE:Object.fromEntries(MODULES.map(m=>[m,{ver:1,crear:0,editar:0,eliminar:0,pdf:1,costos:1} ])),
  OPERADOR:{Dashboard:{ver:1},Clientes:{ver:1,crear:1,editar:1,eliminar:0},Cotizaciones:{ver:1,crear:1,editar:1,eliminar:0,pdf:1,costos:1},Ejecución:{ver:1,crear:1,editar:1},Actas:{ver:1,crear:1,editar:1,pdf:1},Informes:{ver:1,crear:1,editar:1,pdf:1},Inventario:{ver:1,crear:1,editar:1},Empresas:{ver:1},Configuración:{ver:1},Usuarios:{ver:0}},
  TECNICO:{Dashboard:{ver:1},Ejecución:{ver:1,crear:1,editar:1},Actas:{ver:1,crear:1,editar:1,pdf:1},Informes:{ver:1,crear:1,editar:1,pdf:1},Cotizaciones:{ver:0,costos:0},Clientes:{ver:1},Inventario:{ver:1},Empresas:{ver:0},Configuración:{ver:0},Usuarios:{ver:0}},
  LECTURA:Object.fromEntries(MODULES.map(m=>[m,{ver:1,crear:0,editar:0,eliminar:0,pdf:0,costos:0} ]))
};
function rolePerms(rol){return clone(ROLE_PERMS[rol]||ROLE_PERMS.LECTURA)}
function sessionUserId(){return localStorage.getItem(SESSION)||''}
function isLogged(){let sid=sessionUserId();return !!sid && state.usuarios?.some(u=>u.id===sid && (u.estado||'ACTIVO')==='ACTIVO')}
function currentUser(){let sid=sessionUserId()||state.currentUserId;return state.usuarios?.find(u=>u.id===sid)||state.usuarios?.[0]||{rol:'ADMIN',empresaId:state.activeEmpresaId,permisos:rolePerms('ADMIN')}}
function permsOf(u=currentUser()){return u.permisos||rolePerms(u.rol||'LECTURA')}
function can(m,a='ver'){let u=currentUser(); if((u.rol||'').toUpperCase()==='ADMIN')return true; return !!(permsOf(u)[m]?.[a])}
function moduleList(){return MODULES.filter(m=>can(m,'ver'))}
function logAudit(accion,modulo,doc=''){state.auditoria=state.auditoria||[];state.auditoria.unshift({id:uid(),fecha:new Date().toISOString(),usuario:currentUser().nombre||currentUser().usuario||'Sistema',accion,modulo,documento:doc});state.auditoria=state.auditoria.slice(0,300)}

const seed={activeEmpresaId:'emp1',currentUserId:'u_admin',auditoria:[],usuarios:[{id:'u_admin',nombre:'Administrador',usuario:'admin',correo:'admin@servitec.local',clave:'admin123',rol:'ADMIN',estado:'ACTIVO',empresaId:'emp1',permisos:rolePerms('ADMIN')}],empresas:[{id:'emp1',nombre:'Nueva empresa',ruc:'',telefono:'',correo:'',direccion:'',representante:'',cargoRepresentante:'',logo:'',firma:'',moneda:'Soles (S/)',formaPago:'Crédito comercial',tiempoEjecucion:'10 días calendarios',lugarServicio:'En establecimiento del cliente',validez:'15 días calendario',garantia:'06 meses',observacionesCot:'Incluye mano de obra especializada.\nIncluye pruebas de funcionamiento.',contactoComercial:'',telefonoContacto:'',banco:'',cuenta:'',cci:'',prefijos:{cotizacion:'COT',acta:'ACT',informe:'INF',os:'OS'},correlativos:{cotizacion:1,acta:1,informe:1,os:1}}],clientes:[],cotizaciones:[],ejecuciones:[],inventario:[]};
let state=load(), tab='Dashboard', draft=null, msg='';
function clone(o){return JSON.parse(JSON.stringify(o||{}))}
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
function score(s){return (s?.empresas?.length||0)*10+(s?.clientes?.length||0)*20+(s?.cotizaciones?.length||0)*50+(s?.ejecuciones?.length||0)*30}
function load(){let found=[read(STORE),...LEGACY.map(read)].filter(Boolean).sort((a,b)=>score(b)-score(a))[0];let s={...clone(seed),...(found||{})};normalize(s);localStorage.setItem(STORE,JSON.stringify(s));return s}
function save(syncCloud=true){normalize(state);let raw=JSON.stringify(state);[STORE,'servitec_pro_state_v1317','servitec_v139'].forEach(k=>{try{localStorage.setItem(k,raw)}catch(e){console.warn('storage',k,e)}});if(syncCloud)scheduleCloudSave()}
function cloudHeaders(extra={}){return {apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json',...extra}}
function hasCloud(){return !!(SUPABASE_URL&&SUPABASE_KEY)}
async function loadCloud(){
  if(!hasCloud()){cloudStatus='Modo local: Supabase no configurado';return false}
  try{
    cloudStatus='Sincronizando nube...';
    let r=await fetch(`${SUPABASE_URL}/rest/v1/app_state?id=eq.${encodeURIComponent(CLOUD_ID)}&select=payload,updated_at`,{headers:cloudHeaders()});
    if(!r.ok)throw new Error('HTTP '+r.status);
    let d=await r.json();
    if(d&&d[0]&&d[0].payload){
      let localScore=score(state), cloudScore=score(d[0].payload);
      // Si la nube tiene más data, se usa nube. Si local tiene más, se conserva local y se sube.
      if(cloudScore>=localScore){state={...clone(seed),...d[0].payload};normalize(state);save(false)}
      else scheduleCloudSave(50);
    }else scheduleCloudSave(50);
    cloudReady=true;cloudStatus='Supabase activo';return true;
  }catch(e){console.warn('Supabase load',e);cloudStatus='Modo local: error Supabase';return false}
}
function scheduleCloudSave(delay=700){
  if(!hasCloud())return;clearTimeout(cloudTimer);cloudTimer=setTimeout(saveCloud,delay);
}
async function saveCloud(){
  if(!hasCloud())return;
  try{
    let payload={id:CLOUD_ID,payload:state,updated_at:new Date().toISOString()};
    let r=await fetch(`${SUPABASE_URL}/rest/v1/app_state`,{method:'POST',headers:cloudHeaders({Prefer:'resolution=merge-duplicates'}),body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('HTTP '+r.status);
    cloudStatus='Supabase activo';
  }catch(e){console.warn('Supabase save',e);cloudStatus='Modo local: no se pudo guardar en nube'}
}
async function forceSyncCloud(){let ok=await loadCloud();render();alert(ok?'Datos sincronizados con Supabase.':'No se pudo sincronizar. Revisa variables Vercel y tabla app_state.')}
function normalize(s=state){s.empresas=s.empresas?.length?s.empresas:clone(seed.empresas);s.clientes=s.clientes||[];s.cotizaciones=s.cotizaciones||[];s.ejecuciones=s.ejecuciones||[];s.inventario=s.inventario||[];s.usuarios=s.usuarios?.length?s.usuarios:clone(seed.usuarios);s.auditoria=s.auditoria||[];if(!s.currentUserId||!s.usuarios.some(u=>u.id===s.currentUserId))s.currentUserId=s.usuarios[0]?.id;for(const u of s.usuarios){
  u.estado=u.estado||'ACTIVO';
  u.rol=u.rol||'LECTURA';
  u.empresaId=u.empresaId||s.activeEmpresaId;
  const base=rolePerms(u.rol);
  if(u.rol==='ADMIN'){
    u.permisos=base;
  }else{
    u.permisos=u.permisos||{};
    for(const m of MODULES){u.permisos[m]=u.permisos[m]||{};for(const a of ['ver','crear','editar','eliminar','pdf','costos']){if(u.permisos[m][a]===undefined)u.permisos[m][a]=base[m]?.[a]?1:0}}
  }
}if(!s.activeEmpresaId||!s.empresas.some(e=>e.id===s.activeEmpresaId))s.activeEmpresaId=s.empresas[0]?.id;for(const e of s.empresas){e.prefijos={cotizacion:'COT',acta:'ACT',informe:'INF',os:'OS',...(e.prefijos||{})};e.correlativos={cotizacion:Number(e.correlativoCotizacion||e.correlativos?.cotizacion||1),acta:Number(e.correlativoActa||e.correlativos?.acta||1),informe:Number(e.correlativoInforme||e.correlativos?.informe||1),os:Number(e.correlativoOS||e.correlativos?.os||1)};e.representante=e.representante||e.gerente||'';e.cargoRepresentante=e.cargoRepresentante||e.cargoGerente||'';e.moneda=e.moneda||'Soles (S/)';}for(const c of s.clientes){c.establecimientos=c.establecimientos||[];for(const es of c.establecimientos)es.areas=es.areas||[]}for(const q of s.cotizaciones){q.empresaId=q.empresaId||s.activeEmpresaId;q.tipo=q.tipo||q.tipoServicio||'Mantenimiento preventivo';q.acts=q.acts||q.actividades||[];q.equipos=q.equipos||[];q.repuestos=q.repuestos||[];ensureValidConfig(q);for(const eq of q.equipos){eq.cantidad=eq.cantidad||1;eq.acts=eq.acts||[]}applyTax(q)}}
function activeEmpresa(){return state.empresas.find(e=>e.id===state.activeEmpresaId)||state.empresas[0]||{}}

function renderLogin(){
  document.title=VERSION+' - Login';
  const remembered=localStorage.getItem('servitec_remember_user')||'';
  app.innerHTML=`<section class="loginBox"><div class="loginCard"><h2>SERVITEC PRO</h2><h3>Ingreso al sistema</h3><p>Ingrese sus credenciales para acceder al sistema.</p><label>Usuario<input id="login_user" autocomplete="username" placeholder="Ingrese usuario" value="${esc(remembered)}"></label><label>Contraseña<div class="passWrap"><input id="login_pass" type="password" autocomplete="current-password" placeholder="Ingrese contraseña"><button class="eyeBtn" type="button" onclick="togglePassword('login_pass',this)">👁</button></div></label><label class="checkline"><input id="remember_user" type="checkbox" ${remembered?'checked':''}> Recordar usuario</label><button class="btn green" onclick="doLogin()">Ingresar</button>${msg?`<p class="notice">${esc(msg)}</p>`:''}</div></section>`;
}
function doLogin(){
  const user=$('#login_user')?.value.trim();
  const pass=$('#login_pass')?.value;
  const u=(state.usuarios||[]).find(x=>(x.usuario===user || x.correo===user) && String(x.clave||'')===String(pass||'') && (x.estado||'ACTIVO')==='ACTIVO');
  if(!u){msg='Usuario, contraseña o estado inválido.';renderLogin();return}
  state.currentUserId=u.id;
  if(u.empresaId && state.empresas.some(e=>e.id===u.empresaId)) state.activeEmpresaId=u.empresaId;
  if($('#remember_user')?.checked)localStorage.setItem('servitec_remember_user',user);else localStorage.removeItem('servitec_remember_user');
  localStorage.setItem(SESSION,u.id);
  logAudit('Inició sesión','Usuarios',u.usuario||u.nombre);
  save(); msg=''; tab='Dashboard'; render();
}
function logout(){
  const u=currentUser();
  logAudit('Cerró sesión','Usuarios',u.usuario||u.nombre);
  save();
  localStorage.removeItem(SESSION);
  msg='Sesión cerrada. Puede ingresar con otro usuario.';
  renderLogin();
}
function empCot(){return state.cotizaciones.filter(q=>q.empresaId===activeEmpresa().id)}
function fmt(pref,n){return `${pref}-${year()}-${String(Number(n)||1).padStart(4,'0')}`}
function nextNum(tipo){let e=activeEmpresa(); return fmt(e.prefijos?.[tipo]||tipo.toUpperCase(), e.correlativos?.[tipo]||1)}
function consume(tipo){let e=activeEmpresa(); let n=nextNum(tipo); e.correlativos[tipo]=Number(e.correlativos[tipo]||1)+1; return n}
function applyTax(q){let sub=calcSub(q);q.subtotal=sub;q.igv=+(sub*.18).toFixed(2);q.total=+(sub*1.18).toFixed(2);return q}
function calcSub(q){let a=(q.acts||[]).reduce((s,x)=>s+num(x.cantidad)*num(x.precio),0);let r=(q.repuestos||[]).reduce((s,x)=>s+num(x.cantidad)*num(x.precio),0);if(q.config===MODES.PROPIAS)return (q.equipos||[]).reduce((s,e)=>s+(e.acts||[]).reduce((z,x)=>z+num(x.cantidad)*num(x.precio),0),0);if(q.config===MODES.SOLO_REPUESTOS)return r;if(q.config===MODES.SOLO_EQUIPOS)return (q.equipos||[]).reduce((s,e)=>s+num(e.cantidad)*num(e.precio),0);return a+r}
function render(){normalize();if(!isLogged()){renderLogin();return}state.currentUserId=sessionUserId();let u=currentUser();if(u.empresaId && u.rol!=='ADMIN' && state.empresas.some(e=>e.id===u.empresaId))state.activeEmpresaId=u.empresaId;if(!can(tab,'ver'))tab=moduleList()[0]||'Dashboard';document.title=VERSION;app.innerHTML=`<header class="top"><div><h1>${VERSION}</h1><small>Login seguro + permisos reales + documentos dinámicos + exportación por documento seleccionado</small><br><small>Usuario: <b>${esc(u.nombre||u.usuario)}</b> · Rol: <b>${esc(u.rol)}</b></small></div><div class="bar topActions"><button class="btn" onclick="logout()">Salir</button></div></header><nav class="nav">${moduleList().map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;bind();initSignaturePads()}
const back=()=>`<button class="btn primary" onclick="tab='Dashboard';draft=null;render()">← Atrás</button>`;
function table(h,rows){return `<div class="tableWrap"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map(c=>`<td>${c??''}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${h.length}">Sin registros.</td></tr>`}</tbody></table></div>`}
const views={
Dashboard(){return `<section class="wrap"><h2>Dashboard</h2><div class="grid"><div class="card"><b>Empresa activa</b><h3>${esc(activeEmpresa().nombre)}</h3></div><div class="card"><b>Clientes</b><h2>${state.clientes.filter(c=>(c.empresaId||activeEmpresa().id)===activeEmpresa().id).length}</h2></div><div class="card"><b>Cotizaciones</b><h2>${empCot().length}</h2></div><div class="card"><b>Inventario</b><h2>${state.inventario.filter(i=>(i.empresaId||activeEmpresa().id)===activeEmpresa().id).length}</h2></div></div><p class="notice">Base limpia: módulos por permisos, empresa activa, correlativos reales y almacenamiento único ${STORE}.</p>${msg?`<p class="notice">${esc(msg)}</p>`:''}</section>`},
Empresas(){return viewEmpresas()},
Clientes(){return viewClientes()},
Cotizaciones(){return draft?quoteForm():quoteList()},
Órdenes(){return viewOrdenes()},
Ejecución(){return viewExec()},
Actas(){return viewDocs('ACTA DE CONFORMIDAD')},
Informes(){return viewDocs('INFORME TÉCNICO')},
Inventario(){return viewInv()},
Configuración(){return viewConfig()},
Usuarios(){return viewUsuarios()}
};
/* ==========================================================
   MODULO ORDENES V13.30
========================================================== */

function viewOrdenes(){

  return `
  <section class="wrap">

    ${back()}

    <h2>Órdenes</h2>

    <p class="notice">
      Gestión de Órdenes de Servicio y Compra
    </p>

    <div class="bar">
      <button class="btn green">
        + Nueva Orden
      </button>
    </div>

    <div class="card">

      <h3>Módulo Órdenes V13.30</h3>

      <p>
        Aquí se administrarán:
      </p>

      <ul>
        <li>Órdenes de Servicio</li>
        <li>Órdenes de Compra</li>
        <li>SIAF</li>
        <li>Expedientes</li>
        <li>Plazos</li>
        <li>Alertas de vencimiento</li>
      </ul>

    </div>

  </section>
  `;
}
function viewEmpresas(){let e=activeEmpresa();return `<section class="wrap">${back()}<h2>Empresas</h2><p class="notice"><b>Empresa activa:</b> ${esc(e.nombre)}</p><select id="empSel">${state.empresas.map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${esc(x.nombre)}</option>`)}</select><div class="bar"><button class="btn" onclick="newEmpresa()">Nueva</button><button class="btn green" onclick="saveEmpresa()">Guardar cambios</button><button class="btn" onclick="state.activeEmpresaId=$('#empSel').value;save();render()">Activar empresa</button><button class="btn danger" onclick="delEmpresa()">Eliminar</button></div><div class="grid"><label class="field"><b>Razón social</b><input id="e_nombre" value="${esc(e.nombre)}"></label><label><b>RUC</b><input id="e_ruc" value="${esc(e.ruc)}"></label><label><b>Teléfono</b><input id="e_telefono" value="${esc(e.telefono)}"></label><label><b>Correo</b><input id="e_correo" value="${esc(e.correo)}"></label><label><b>Dirección</b><input id="e_direccion" value="${esc(e.direccion)}"></label><label><b>Representante</b><input id="e_representante" value="${esc(e.representante)}"></label><label><b>Cargo firmante</b><input id="e_cargo" value="${esc(e.cargoRepresentante)}"></label><label><b>Moneda</b><input id="e_moneda" value="${esc(e.moneda)}"></label></div><div class="grid2"><label><b>Logo empresa</b><input type="file" id="e_logo" accept="image/*"><small>${e.logo?'Logo cargado ✅':'Sin logo'}</small></label><label><b>Firma</b><input type="file" id="e_firma" accept="image/*"><small>${e.firma?'Firma cargada ✅':'Sin firma'}</small></label></div><h3>Condiciones comerciales y banco</h3><div class="grid"><input id="e_pago" placeholder="Forma de pago" value="${esc(e.formaPago)}"><input id="e_tiempo" placeholder="Tiempo de ejecución" value="${esc(e.tiempoEjecucion)}"><input id="e_lugar" placeholder="Lugar del servicio" value="${esc(e.lugarServicio)}"><input id="e_validez" placeholder="Validez" value="${esc(e.validez)}"><input id="e_garantia" placeholder="Garantía" value="${esc(e.garantia)}"><input id="e_contacto" placeholder="Contacto comercial" value="${esc(e.contactoComercial)}"><input id="e_telcontacto" placeholder="Teléfono contacto" value="${esc(e.telefonoContacto)}"><input id="e_banco" placeholder="Banco" value="${esc(e.banco)}"><input id="e_cuenta" placeholder="Cuenta" value="${esc(e.cuenta)}"><input id="e_cci" placeholder="CCI" value="${esc(e.cci)}"></div><textarea id="e_obs" placeholder="Observaciones comerciales">${esc(e.observacionesCot)}</textarea><h3>Correlativos por empresa</h3><p class="notice">Estos campos son el <b>próximo número a emitir</b>. Si colocas 206, la siguiente cotización será COT-${year()}-0206.</p>${table(['Documento','Prefijo','Próximo número','Vista previa'],[['cotizacion','Cotización'],['acta','Acta'],['informe','Informe'],['os','Orden servicio']].map(([k,l])=>[l,`<input id="pref_${k}" value="${esc(e.prefijos[k])}">`,`<input type="number" id="corr_${k}" value="${Number(e.correlativos[k]||1)}">`,`<b>${fmt(e.prefijos[k],e.correlativos[k])}</b>`]))}</section>`}
async function file64(id){let f=$(id)?.files?.[0]; if(!f)return null; return await new Promise(res=>{let r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(f)})}
async function saveEmpresa(){let e=activeEmpresa();Object.assign(e,{nombre:$('#e_nombre').value,ruc:$('#e_ruc').value,telefono:$('#e_telefono').value,correo:$('#e_correo').value,direccion:$('#e_direccion').value,representante:$('#e_representante').value,cargoRepresentante:$('#e_cargo').value,moneda:$('#e_moneda').value,formaPago:$('#e_pago').value,tiempoEjecucion:$('#e_tiempo').value,lugarServicio:$('#e_lugar').value,validez:$('#e_validez').value,garantia:$('#e_garantia').value,contactoComercial:$('#e_contacto').value,telefonoContacto:$('#e_telcontacto').value,banco:$('#e_banco').value,cuenta:$('#e_cuenta').value,cci:$('#e_cci').value,observacionesCot:$('#e_obs').value});for(const k of ['cotizacion','acta','informe','os']){e.prefijos[k]=$('#pref_'+k).value||k.toUpperCase();e.correlativos[k]=Number($('#corr_'+k).value)||1}let logo=await file64('#e_logo'),firma=await file64('#e_firma'); if(logo)e.logo=logo;if(firma)e.firma=firma;save();msg='Empresa guardada.';render()}
function newEmpresa(){let e=clone(seed.empresas[0]);e.id=uid();e.nombre='Nueva empresa';state.empresas.push(e);state.activeEmpresaId=e.id;save();render()}function delEmpresa(){if(state.empresas.length<=1)return alert('Debe existir al menos una empresa.');if(confirm('¿Eliminar empresa activa?')){let id=activeEmpresa().id;state.empresas=state.empresas.filter(e=>e.id!==id);state.activeEmpresaId=state.empresas[0].id;save();render()}}
function viewClientes(){let cs=state.clientes.filter(c=>(c.empresaId||activeEmpresa().id)===activeEmpresa().id);let c=cs[0];return `<section class="wrap">${back()}<h2>Clientes</h2><div class="grid"><input id="cli_nom" placeholder="Nombre / razón social"><input id="cli_ruc" placeholder="RUC"><input id="cli_tel" placeholder="Teléfono"><input id="cli_cor" placeholder="Correo"><input id="cli_dir" placeholder="Dirección"><input id="cli_resp" placeholder="Responsable"></div><div class="bar"><button class="btn green" onclick="addCliente()">Guardar cliente nuevo</button></div>${table(['Cliente','RUC','Responsable','Acciones'],cs.map(x=>[x.nombre,x.ruc,x.responsable,`<button class="btn" onclick="editCliente('${x.id}')">Editar</button><button class="btn danger" onclick="delCliente('${x.id}')">Eliminar</button>`]))}${c?`<div class="card"><h3>Establecimientos de ${esc(c.nombre)}</h3><div class="grid2"><input id="est_nom" placeholder="Nuevo establecimiento"><input id="est_dir" placeholder="Dirección establecimiento"></div><button class="btn green" onclick="addEst('${c.id}')">Agregar establecimiento</button>${(c.establecimientos||[]).map(e=>`<div class="card"><b>${esc(e.nombre)}</b><br><small>${esc(e.direccion)}</small><div class="grid2"><input id="area_${e.id}" placeholder="Área usuaria"><button class="btn" onclick="addArea('${c.id}','${e.id}')">Agregar área</button></div><ul>${(e.areas||[]).map(a=>`<li>${esc(a.nombre)}</li>`).join('')}</ul></div>`).join('')}</div>`:''}</section>`}
function addCliente(){state.clientes.push({id:uid(),empresaId:activeEmpresa().id,nombre:$('#cli_nom').value,ruc:$('#cli_ruc').value,telefono:$('#cli_tel').value,correo:$('#cli_cor').value,direccion:$('#cli_dir').value,responsable:$('#cli_resp').value,establecimientos:[]});save();render()}function editCliente(id){let c=state.clientes.find(x=>x.id===id);let n=prompt('Nombre cliente',c.nombre);if(n!==null)c.nombre=n;save();render()}function delCliente(id){if(confirm('¿Eliminar cliente?')){state.clientes=state.clientes.filter(c=>c.id!==id);save();render()}}function addEst(cid){let c=state.clientes.find(x=>x.id===cid);c.establecimientos.push({id:uid(),nombre:$('#est_nom').value,direccion:$('#est_dir').value,areas:[]});save();render()}function addArea(cid,eid){let c=state.clientes.find(x=>x.id===cid),e=c.establecimientos.find(x=>x.id===eid);e.areas.push({id:uid(),nombre:$('#area_'+eid).value});save();render()}
function newDraft(){let c=state.clientes.find(x=>(x.empresaId||activeEmpresa().id)===activeEmpresa().id)||{}, es=c.establecimientos?.[0]||{}, ar=es.areas?.[0]||{};return {id:uid(),empresaId:activeEmpresa().id,numero:nextNum('cotizacion'),clienteId:c.id||'',clienteNombre:c.nombre||'',estId:es.id||'',establecimientoNombre:es.nombre||'',areaId:ar.id||'',areaNombre:ar.nombre||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,acts:[],equipos:[],repuestos:[],estado:'Cotización',fecha:new Date().toISOString(),subtotal:0,igv:0,total:0}}
function quoteList(){let qs=empCot();return `<section class="wrap">${back()}<h2>Cotizaciones</h2><p class="notice"><b>Empresa activa:</b> ${esc(activeEmpresa().nombre)}</p><button class="btn green" onclick="draft=newDraft();render()">Nueva</button>${table(['N°','Cliente','Tipo de servicio','Configuración','Estado','Total','Acciones'],qs.map(q=>[q.numero,q.clienteNombre,q.tipo||'Mantenimiento preventivo',q.config,q.estado,money(q.total),`<button class="btn" onclick="draft=clone(state.cotizaciones.find(x=>x.id==='${q.id}'));render()">Editar</button> <button class="btn green" onclick="printQuote('${q.id}')">PDF</button> <button class="btn" onclick="exportQuoteWord('${q.id}')">Word</button> <button class="btn" onclick="exportQuoteExcel('${q.id}')">Excel</button> <button class="btn" onclick="goExec('${q.id}')">Ejecutar</button> <button class="btn danger" onclick="delQuote('${q.id}')">Eliminar</button>`]))}</section>`}
function quoteForm(){let clients=state.clientes.filter(c=>(c.empresaId||activeEmpresa().id)===activeEmpresa().id);let c=clients.find(x=>x.id===draft.clienteId)||clients[0]||{}, ests=c.establecimientos||[], es=ests.find(x=>x.id===draft.estId)||ests[0]||{}, areas=es.areas||[];ensureValidConfig(draft);applyTax(draft);let cfgs=configOptionsFor(draft.tipo);return `<section class="wrap">${back()}<h2>${draft.id&&state.cotizaciones.some(q=>q.id===draft.id)?'Editar':'Nueva'} cotización</h2><p class="notice"><b>Tipo de servicio</b> define si es mantenimiento preventivo, correctivo, calibración, venta, etc. <b>Configuración</b> define cómo se arman las partidas.</p><div class="grid"><select id="q_cli">${clients.map(x=>`<option value="${x.id}" ${x.id===draft.clienteId?'selected':''}>${esc(x.nombre)}</option>`)}</select><select id="q_est">${ests.map(x=>`<option value="${x.id}" ${x.id===draft.estId?'selected':''}>${esc(x.nombre)}</option>`)}</select><select id="q_area">${areas.map(x=>`<option value="${x.id}" ${x.id===draft.areaId?'selected':''}>${esc(x.nombre)}</option>`)}</select><select id="q_tipo">${SERVICE_TYPES.map(x=>`<option ${x===(draft.tipo||'Mantenimiento preventivo')?'selected':''}>${x}</option>`)}</select><select id="q_config">${cfgs.map(x=>`<option ${x===draft.config?'selected':''}>${x}</option>`)}</select></div><div class="bar"><span class="pill">${esc(draft.numero)}</span><span class="pill">${esc(draft.tipo)}</span><span class="pill">${esc(draft.config)}</span><b class="total">Total con IGV: ${money(draft.total)}</b></div>${quoteItems()}<div class="bar"><button class="btn green" onclick="saveQuote()">Guardar y volver a lista</button><button class="btn" onclick="draft=null;render()">Cancelar</button></div></section>`}
function addActividad(){draft.acts.push({id:uid(),descripcion:'',cantidad:1,precio:0});render()}
function addRepuesto(){draft.repuestos.push({id:uid(),codigo:'',descripcion:'',cantidad:1,precio:0});render()}
function addEquipo(){draft.equipos.push({id:uid(),nombre:'',cantidad:1,marca:'',modelo:'',serie:'',precio:0,acts:[]});render()}
function addEqAct(eqid){let e=draft.equipos.find(x=>x.id===eqid);if(e){e.acts=e.acts||[];e.acts.push({id:uid(),descripcion:'',cantidad:1,precio:0});render()}}
function quoteItems(){let cfg=ensureValidConfig(draft);let out='';
  if(cfg===MODES.GENERAL){out+=`<h3>Actividades generales del servicio</h3><p class="notice">Estas actividades se aplican a todos los equipos incluidos.</p><button class="btn green" onclick="addActividad()">+ Actividad</button>${itemTable(draft.acts,'act')}<h3>Equipos incluidos</h3><button class="btn green" onclick="addEquipo()">+ Equipo</button>${equipTable(false)}`}
  if(cfg===MODES.PROPIAS){out+=`<h3>Equipos con actividades propias</h3><p class="notice">Cada equipo tiene su propia lista de actividades, precios, evidencias y ejecución.</p><button class="btn green" onclick="addEquipo()">+ Equipo</button>${draft.equipos.map(e=>eqOwnCard(e)).join('')}`}
  if(cfg===MODES.MIXTO){out+=`<h3>Actividades del servicio</h3><button class="btn green" onclick="addActividad()">+ Actividad</button>${itemTable(draft.acts,'act')}<h3>Repuestos / accesorios</h3><button class="btn green" onclick="addRepuesto()">+ Repuesto</button>${itemTable(draft.repuestos,'rep')}<h3>Equipos incluidos</h3><button class="btn green" onclick="addEquipo()">+ Equipo</button>${equipTable(false)}`}
  if(cfg===MODES.SOLO_EQUIPOS){out+=`<h3>Solo equipos</h3><p class="notice">Use este modo para venta/alquiler de equipos sin actividades ni repuestos asociados.</p><button class="btn green" onclick="addEquipo()">+ Equipo</button>${equipTable(true)}`}
  if(cfg===MODES.SOLO_REPUESTOS){out+=`<h3>Solo repuestos / accesorios</h3><p class="notice">Use este modo cuando no corresponda registrar actividades ni equipos.</p><button class="btn green" onclick="addRepuesto()">+ Repuesto</button>${itemTable(draft.repuestos,'rep')}`}
  return out
}
function itemTable(arr,type){return `<div class="tableWrap"><table><thead><tr>${type==='rep'?'<th>Código</th>':''}<th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${arr.map(x=>`<tr>${type==='rep'?`<td><input data-id="${x.id}" data-type="${type}" data-k="codigo" value="${esc(x.codigo)}"></td>`:''}<td><textarea data-id="${x.id}" data-type="${type}" data-k="descripcion">${esc(x.descripcion)}</textarea></td><td><input type="text" inputmode="decimal" data-id="${x.id}" data-type="${type}" data-k="cantidad" value="${esc(x.cantidad)}"></td><td><input type="text" inputmode="decimal" data-id="${x.id}" data-type="${type}" data-k="precio" value="${esc(x.precio)}"></td><td>${money(num(x.cantidad)*num(x.precio))}</td></tr>`).join('')}</tbody></table></div>`}
function eqOwnCard(e){e.acts=e.acts||[];return `<div class="card"><h3>Equipo: ${esc(e.nombre||'Sin nombre')}</h3>${equipTable(false,[e])}<div class="bar"><button class="btn green" onclick="addEqAct('${e.id}')">+ Actividad para este equipo</button></div>${ownActTable(e)}</div>`}
function ownActTable(eq){return `<div class="tableWrap"><table><thead><tr><th>Actividad</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${(eq.acts||[]).map(a=>`<tr><td><textarea data-eqact="${a.id}" data-eqparent="${eq.id}" data-k="descripcion">${esc(a.descripcion)}</textarea></td><td><input type="text" inputmode="decimal" data-eqact="${a.id}" data-eqparent="${eq.id}" data-k="cantidad" value="${esc(a.cantidad)}"></td><td><input type="text" inputmode="decimal" data-eqact="${a.id}" data-eqparent="${eq.id}" data-k="precio" value="${esc(a.precio)}"></td><td>${money(num(a.cantidad)*num(a.precio))}</td></tr>`).join('')}</tbody></table></div>`}
function equipTable(withPrice=false,list=draft.equipos){return `<div class="tableWrap"><table><thead><tr><th>Tipo / Equipo</th><th>Cant.</th><th>Marca</th><th>Modelo</th><th>Serie</th>${withPrice?'<th>Precio</th><th>Subtotal</th>':''}</tr></thead><tbody>${list.map(e=>`<tr><td><input data-eqid="${e.id}" data-k="nombre" value="${esc(e.nombre)}"></td><td><input type="text" inputmode="decimal" data-eqid="${e.id}" data-k="cantidad" value="${esc(e.cantidad||1)}"></td><td><input data-eqid="${e.id}" data-k="marca" value="${esc(e.marca)}"></td><td><input data-eqid="${e.id}" data-k="modelo" value="${esc(e.modelo)}"></td><td><input data-eqid="${e.id}" data-k="serie" value="${esc(e.serie)}"></td>${withPrice?`<td><input type="text" inputmode="decimal" data-eqid="${e.id}" data-k="precio" value="${esc(e.precio||0)}"></td><td>${money(num(e.cantidad)*num(e.precio))}</td>`:''}</tr>`).join('')}</tbody></table></div>`}
function saveQuote(){let c=state.clientes.find(x=>x.id===$('#q_cli').value)||{}, es=(c.establecimientos||[]).find(x=>x.id===$('#q_est').value)||{}, ar=(es.areas||[]).find(x=>x.id===$('#q_area').value)||{};Object.assign(draft,{empresaId:activeEmpresa().id,clienteId:c.id,clienteNombre:c.nombre,estId:es.id,establecimientoNombre:es.nombre,areaId:ar.id,areaNombre:ar.nombre,tipo:$('#q_tipo').value,config:$('#q_config').value});applyTax(draft);let i=state.cotizaciones.findIndex(q=>q.id===draft.id);if(i>=0){state.cotizaciones[i]=clone(draft)}else{draft.numero=nextNum('cotizacion');consume('cotizacion');state.cotizaciones.push(clone(draft))}save();draft=null;render()}function delQuote(id){if(confirm('¿Eliminar cotización?')){state.cotizaciones=state.cotizaciones.filter(q=>q.id!==id);state.ejecuciones=state.ejecuciones.filter(e=>e.cotizacionId!==id);save();render()}}
function rows(q){let r=[]; if(q.config===MODES.PROPIAS){for(const eq of (q.equipos||[]))for(const a of (eq.acts||[]))r.push({n:r.length+1,desc:`${eq.nombre||'Equipo'} - ${a.descripcion}`,cant:a.cantidad,precio:a.precio,sub:num(a.cantidad)*num(a.precio)});return r} if(q.config===MODES.SOLO_EQUIPOS){for(const eq of (q.equipos||[]))r.push({n:r.length+1,desc:`${eq.nombre||'Equipo'} ${eq.marca||''} ${eq.modelo||''} ${eq.serie||''}`,cant:eq.cantidad||1,precio:eq.precio||0,sub:(+eq.cantidad||0)*(+eq.precio||0)});return r} r=[...(q.acts||[]).map((x,i)=>({n:i+1,desc:x.descripcion,cant:x.cantidad,precio:x.precio,sub:num(x.cantidad)*num(x.precio)})),...(q.repuestos||[]).map((x,i)=>({n:(q.acts||[]).length+i+1,desc:(x.codigo?x.codigo+' - ':'')+x.descripcion,cant:x.cantidad,precio:x.precio,sub:num(x.cantidad)*num(x.precio)}))];return r}
function printQuote(id){let q=state.cotizaciones.find(x=>x.id===id), e=state.empresas.find(x=>x.id===q.empresaId)||activeEmpresa();let w=open('','_blank');if(!w)return alert('Permite ventanas emergentes para generar PDF.');w.document.write(docCot(q,e));w.document.close();setTimeout(()=>w.print(),300)}
function docCot(q,e){let rs=rows(q);return `<!doctype html><html><head><title>${esc(q.numero)}</title><link rel="stylesheet" href="styles.css?v=13.29.3"></head><body class="docprint onepage"><div class="wm">${e.logo?`<img src="${e.logo}">`:''}</div><div class="head"><div>${e.logo?`<img class="logo" src="${e.logo}">`:''}<h2>${esc(e.nombre)}</h2><p><b>RUC:</b> ${esc(e.ruc)}<br><b>Dirección:</b> ${esc(e.direccion)}<br><b>Tel:</b> ${esc(e.telefono)} · ${esc(e.correo)}</p></div><div><h2>${esc(q.numero)}</h2><p><b>Fecha:</b> ${new Date(q.fecha).toLocaleDateString()}<br><b>Moneda:</b> ${esc(e.moneda)}</p></div></div><h1>COTIZACIÓN</h1><p><b>Cliente:</b> ${esc(q.clienteNombre)}<br><b>Establecimiento:</b> ${esc(q.establecimientoNombre)} · <b>Área:</b> ${esc(q.areaNombre||'-')}<br><b>Tipo de servicio:</b> ${esc(q.tipo||'Mantenimiento preventivo')} · <b>Configuración:</b> ${esc(q.config||'-')}</p>${table(['Ítem','Descripción','Cant.','P. Unit.','Subtotal'],rs.map(r=>[r.n,esc(r.desc),r.cant,money(r.precio),money(r.sub)]))}<p><b>Equipos incluidos:</b> ${(q.equipos||[]).map(x=>`${esc(x.nombre)} ${esc(x.marca||'')} ${esc(x.modelo||'')} ${esc(x.serie||'')}`).join('; ')||'-'}</p><div style="width:260px;margin-left:auto">${table(['Concepto','Monto'],[['Subtotal',money(q.subtotal)],['IGV 18%',money(q.igv)],['TOTAL',`<b>${money(q.total)}</b>`]])}</div><div class="grid2"><div><b>Condiciones</b><p>Forma de pago: ${esc(e.formaPago)}<br>Tiempo de ejecución: ${esc(e.tiempoEjecucion)}<br>Lugar: ${esc(e.lugarServicio)}<br>Validez: ${esc(e.validez)}<br>Garantía: ${esc(e.garantia)}</p><p>${esc(e.observacionesCot).replaceAll('\n','<br>')}</p></div><div><b>Datos bancarios</b><p>Banco: ${esc(e.banco)}<br>Cuenta: ${esc(e.cuenta)}<br>CCI: ${esc(e.cci)}<br>Contacto: ${esc(e.contactoComercial)} ${esc(e.telefonoContacto)}</p></div></div><div class="firmas"><div class="firma">${e.firma?`<img src="${e.firma}">`:''}<b>${esc(e.representante)}</b><br>${esc(e.cargoRepresentante)}<br>${esc(e.nombre)}</div></div></body></html>`}
function defaultFirmas(){return {area:{nombre:'',cargo:'',dni:'',firma:''},tecnico:{nombre:currentUser()?.nombre||'',cargo:'Técnico responsable',dni:'',firma:''}}}
function serviceType(q){return String(q.tipo||q.tipoServicio||'Mantenimiento preventivo').toLowerCase()}
function execTemplateFields(q){let t=serviceType(q);if(t.includes('correctivo'))return ['Falla reportada','Diagnóstico inicial','Causa probable','Repuestos utilizados','Pruebas realizadas','Resultado final'];if(t.includes('calibr'))return ['Patrón utilizado','Código certificado patrón','Fecha de calibración','Resultado metrológico','Aprobado / No aprobado'];if(t.includes('instal'))return ['Lugar de instalación','Condiciones encontradas','Pruebas de puesta en marcha','Capacitación / inducción'];if(t.includes('venta'))return ['Verificación de entrega','Serie / lote entregado','Accesorios entregados','Conformidad de recepción'];if(t.includes('diagn'))return ['Síntoma reportado','Pruebas de diagnóstico','Hallazgo técnico','Acción recomendada'];if(t.includes('repuestos'))return ['Repuesto instalado / entregado','Código / lote','Cantidad usada','Prueba posterior'];return ['Condición inicial','Actividad ejecutada','Prueba funcional','Resultado final'];}
function activitySourceFor(q,eq){let cfg=String(q.config||'');if(cfg.includes('propias'))return (eq.acts&&eq.acts.length?eq.acts:[]);if(cfg.includes('Solo repuestos'))return (q.repuestos||[]).map(r=>({id:r.id,descripcion:`Entrega de repuesto: ${r.descripcion||r.codigo||'Repuesto'}`}));if(cfg.includes('Solo equipos'))return [{id:'eq_'+eq.id,descripcion:'Entrega / verificación de equipo'}];return (q.acts&&q.acts.length?q.acts:[{id:'srv_'+(eq.id||uid()),descripcion:q.tipo||'Servicio ejecutado'}]);}
function newExecActivity(a,q,idx){let fields={};for(const f of execTemplateFields(q))fields[f]='';return {id:a.id||uid(),orden:idx+1,descripcion:a.descripcion||a.nombre||a.codigo||'Actividad',estado:'Pendiente',comentario:'',recomendacion:'',antes:'',durante:'',despues:'',detalles:fields}}
function syncExecWithQuote(ex,q){ex.tipo=q.tipo||ex.tipo||'Mantenimiento preventivo';ex.config=q.config||ex.config||'';let sourceEquipos=(q.equipos&&q.equipos.length?q.equipos:[{id:'general',nombre:'Servicio general',cantidad:1,marca:'',modelo:'',serie:''}]);for(const eqSrc of sourceEquipos){let eq=ex.equipos.find(x=>x.id===eqSrc.id);if(!eq){eq={id:eqSrc.id,nombre:eqSrc.nombre||'Servicio general',marca:eqSrc.marca||'',modelo:eqSrc.modelo||'',serie:eqSrc.serie||'',cantidad:eqSrc.cantidad||1,actividades:[]};ex.equipos.push(eq)}Object.assign(eq,{nombre:eqSrc.nombre||eq.nombre,marca:eqSrc.marca||eq.marca,modelo:eqSrc.modelo||eq.modelo,serie:eqSrc.serie||eq.serie,cantidad:eqSrc.cantidad||eq.cantidad||1});let acts=activitySourceFor(q,eqSrc);for(let i=0;i<acts.length;i++){let aSrc=acts[i],a=eq.actividades.find(x=>x.id===aSrc.id);if(!a){a=newExecActivity(aSrc,q,i);eq.actividades.push(a)}a.orden=i+1;a.descripcion=aSrc.descripcion||a.descripcion;a.detalles=a.detalles||{};for(const f of execTemplateFields(q))if(!(f in a.detalles))a.detalles[f]=''}eq.actividades=eq.actividades.filter(a=>acts.some(x=>x.id===a.id))}ex.equipos=ex.equipos.filter(eq=>sourceEquipos.some(x=>x.id===eq.id)||eq.id==='general');return ex}
function ensureExec(q){let ex=state.ejecuciones.find(e=>e.cotizacionId===q.id);if(!ex){ex={id:uid(),empresaId:q.empresaId,cotizacionId:q.id,os:'',siaf:'',tipo:q.tipo||'Mantenimiento preventivo',config:q.config||'',firmas:defaultFirmas(),equipos:[]};state.ejecuciones.push(ex)}ex.firmas=ex.firmas||defaultFirmas();ex.firmas.area=ex.firmas.area||{nombre:'',cargo:'',dni:'',firma:''};ex.firmas.tecnico=ex.firmas.tecnico||{nombre:currentUser()?.nombre||'',cargo:'Técnico responsable',dni:'',firma:''};syncExecWithQuote(ex,q);save();return ex}
function execServiceBox(q){let t=q.tipo||'Mantenimiento preventivo';let labels=execTemplateFields(q);return `<p class="notice"><b>Tipo de servicio:</b> ${esc(t)} · <b>Configuración:</b> ${esc(q.config||'-')}<br>La ejecución se genera desde la cotización. Cada actividad mantiene su propio estado, sustento, recomendación y evidencias.</p><div class="chips">${labels.map(x=>`<span class="pill small">${esc(x)}</span>`).join('')}</div>`}


function exportQuoteWord(id){let q=state.cotizaciones.find(x=>x.id===id);if(!q)return alert('Selecciona una cotización.');let e=state.empresas.find(x=>x.id===q.empresaId)||activeEmpresa();download(`${q.numero}_COTIZACION.doc`,docCot(q,e),'application/msword')}
function exportQuoteExcel(id){let q=state.cotizaciones.find(x=>x.id===id);if(!q)return alert('Selecciona una cotización.');let e=state.empresas.find(x=>x.id===q.empresaId)||activeEmpresa();let rs=rows(q);let data=[['COTIZACIÓN',q.numero],['Empresa',e.nombre],['RUC',e.ruc],['Cliente',q.clienteNombre],['Establecimiento',q.establecimientoNombre],['Área',q.areaNombre||''],['Tipo de servicio',q.tipo||''],['Configuración',q.config||''],[],['Ítem','Descripción','Cantidad','Precio unitario','Subtotal'],...rs.map(r=>[r.n,sanitizeCell(r.desc),r.cant,num(r.precio),num(r.sub)]),[],['Subtotal',q.subtotal],['IGV 18%',q.igv],['Total',q.total],[],['Forma de pago',e.formaPago||''],['Tiempo de ejecución',e.tiempoEjecucion||''],['Lugar',e.lugarServicio||''],['Validez',e.validez||''],['Garantía',e.garantia||''],['Banco',e.banco||''],['Cuenta',e.cuenta||''],['CCI',e.cci||'']];download(`${q.numero}_COTIZACION.xls`,toExcel(data),'application/vnd.ms-excel')}
function docEjecucion(q,e,ex){return `<!doctype html><html><head><meta charset="utf-8"><title>EJECUCION ${q.numero}</title><link rel="stylesheet" href="styles.css?v=13.29.3"></head><body class="docprint"><div class="wm">${e.logo?`<img src="${e.logo}">`:''}</div><div class="head"><div>${e.logo?`<img class="logo" src="${e.logo}">`:''}<b>${esc(e.nombre)}</b><br>RUC ${esc(e.ruc)}</div><div><b>EJECUCIÓN TÉCNICA</b><br>${esc(q.numero)}<br>OS/OC: ${esc(ex.os)} · SIAF: ${esc(ex.siaf)}</div></div><h1>EJECUCIÓN TÉCNICA DEL SERVICIO</h1><p><b>Cliente:</b> ${esc(q.clienteNombre)}<br><b>Establecimiento:</b> ${esc(q.establecimientoNombre)}<br><b>Área:</b> ${esc(q.areaNombre||'-')}<br><b>Tipo de servicio:</b> ${esc(q.tipo||'')}<br><b>Configuración:</b> ${esc(q.config||'')}</p><h3>Actividades ejecutadas</h3>${table(['Equipo','Actividad','Estado','Detalle','Comentario','Recomendación'],detailRows(ex))}<h3>Evidencias por actividad</h3>${evidenceBlock(ex)}${signatureSection(e,ex)}</body></html>`}
function exportExecWord(id){let q=state.cotizaciones.find(x=>x.id===id);if(!q)return alert('Selecciona una ejecución.');let e=state.empresas.find(x=>x.id===q.empresaId)||activeEmpresa();let ex=state.ejecuciones.find(x=>x.cotizacionId===id)||ensureExec(q);download(`EJECUCION_${q.numero}.doc`,docEjecucion(q,e,ex),'application/msword')}
function exportExecExcel(id){let q=state.cotizaciones.find(x=>x.id===id);if(!q)return alert('Selecciona una ejecución.');let ex=state.ejecuciones.find(x=>x.cotizacionId===id)||ensureExec(q);let data=[['EJECUCIÓN',q.numero],['Cliente',q.clienteNombre],['Tipo de servicio',q.tipo],['Configuración',q.config],['OS/OC',ex.os||''],['SIAF',ex.siaf||''],[],['Equipo','Actividad','Estado','Detalles','Comentario','Recomendación'],...detailRows(ex).map(r=>r.map(sanitizeCell))];download(`EJECUCION_${q.numero}.xls`,toExcel(data),'application/vnd.ms-excel')}

function goExec(id){
  if(!can('Ejecución','ver')){alert('Tu usuario no tiene permiso para ingresar al módulo de Ejecución. Solicita permiso al administrador.');return}
  localStorage.setItem('exec_q', id);
  tab='Ejecución';
  render();
}

function firmaCard(ex, rol, titulo){
  const f=(ex.firmas&&ex.firmas[rol])||{};
  const signed=f.firma?'<span class="ok">Firma guardada ✅</span>':'<span class="muted">Pendiente de firma</span>';
  return `<div class="card sigbox"><h3>${esc(titulo)}</h3><div class="grid3"><input id="sig_${rol}_nombre" placeholder="Nombre" value="${esc(f.nombre||'')}"><input id="sig_${rol}_cargo" placeholder="Cargo" value="${esc(f.cargo||'')}"><input id="sig_${rol}_dni" placeholder="DNI" value="${esc(f.dni||'')}"></div><canvas class="sigpad" id="sig_${rol}_canvas" data-ex="${ex.id}" data-rol="${rol}" data-signed="${f.firma?'1':'0'}"></canvas><div class="bar"><button type="button" class="btn" onclick="clearSig('${ex.id}','${rol}')">Limpiar firma</button>${signed}</div></div>`;
}
function initSignaturePads(){
  document.querySelectorAll('canvas.sigpad').forEach(cv=>{
    if(cv.dataset.ready==='1') return;
    cv.dataset.ready='1';
    const ctx=cv.getContext('2d');
    const fit=()=>{
      const old=cv.toDataURL('image/png');
      const r=cv.getBoundingClientRect();
      cv.width=Math.max(300,Math.floor(r.width||400));
      cv.height=150;
      ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle='#003366';
      const ex=state.ejecuciones.find(x=>x.id===cv.dataset.ex);
      const imgData=ex?.firmas?.[cv.dataset.rol]?.firma;
      if(imgData){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,cv.width,cv.height);img.src=imgData;}
    };
    fit();
    let drawing=false,last=null;
    const pos=(ev)=>{const t=ev.touches?ev.touches[0]:ev;const r=cv.getBoundingClientRect();return {x:(t.clientX-r.left)*(cv.width/r.width),y:(t.clientY-r.top)*(cv.height/r.height)}};
    const down=(ev)=>{drawing=true;last=pos(ev);ev.preventDefault();};
    const move=(ev)=>{if(!drawing)return;const p=pos(ev);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;cv.dataset.signed='1';ev.preventDefault();};
    const up=(ev)=>{drawing=false;last=null;};
    cv.addEventListener('mousedown',down);cv.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
    cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});window.addEventListener('touchend',up);
  });
}
function signatureSection(e,ex){
  ex.firmas=ex.firmas||defaultFirmas();
  const area=ex.firmas.area||{}, tec=ex.firmas.tecnico||{};
  const contratista={nombre:e.representante||e.gerente||e.nombre,cargo:e.cargoRepresentante||'Empresa contratista',dni:'',firma:e.firma||''};
  return `<h3>Firmas</h3><div class="firmas">${firmaPrint(area,'Responsable área usuaria')}${firmaPrint(tec,'Técnico responsable')}${firmaPrint(contratista,'Empresa contratista')}</div>`;
}

function viewExec(){let qs=empCot();if(!qs.length)return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">No hay cotizaciones registradas.</p></section>`;let id=localStorage.getItem('exec_q')||qs[0].id,q=qs.find(x=>x.id===id)||qs[0],ex=ensureExec(q);return `<section class="wrap">${back()}<h2>Ejecución detallada por actividad</h2><select onchange="localStorage.setItem('exec_q',this.value);render()">${qs.map(x=>`<option value="${x.id}" ${x.id===q.id?'selected':''}>${x.numero} - ${x.clienteNombre} - ${x.tipo||''}</option>`)}</select>${execServiceBox(q)}<div class="grid2"><input id="ex_os" placeholder="OS/OC" value="${esc(ex.os)}"><input id="ex_siaf" placeholder="SIAF" value="${esc(ex.siaf)}"></div><h3>Firmas para acta</h3><p class="notice">Firma con mouse o pantalla táctil. Estas firmas se imprimirán automáticamente en el acta de conformidad.</p><div class="grid2">${firmaCard(ex,'area','Responsable área usuaria')}${firmaCard(ex,'tecnico','Técnico responsable')}</div><div class="notice"><b>Orden de trabajo:</b> completa OS/OC, SIAF, firmas y luego registra cada actividad con sus evidencias. El botón Guardar también está al final para uso en celular.</div>${ex.equipos.map((eq,ei)=>`<div class="card execEquipo"><h3>Equipo ${ei+1}: ${esc(eq.nombre||'Servicio general')}</h3><p><b>Marca:</b> ${esc(eq.marca||'-')} · <b>Modelo:</b> ${esc(eq.modelo||'-')} · <b>Serie:</b> ${esc(eq.serie||'-')}</p>${eq.actividades.map((a,ai)=>`<div class="card execActividad"><div class="actHead"><b>Actividad ${ai+1}: ${esc(a.descripcion)}</b><span>${esc(q.tipo||'Servicio')}</span></div><div class="grid3"><label>Estado<select data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}" data-k="estado"><option ${a.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${a.estado==='En proceso'?'selected':''}>En proceso</option><option ${a.estado==='Terminado'?'selected':''}>Terminado</option><option ${a.estado==='Observado'?'selected':''}>Observado</option></select></label><label>Comentario / observación<textarea data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}" data-k="comentario" placeholder="Describe lo ejecutado, hallazgos o conformidad">${esc(a.comentario)}</textarea></label><label>Recomendación<textarea data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}" data-k="recomendacion" placeholder="Recomendación técnica por actividad">${esc(a.recomendacion)}</textarea></label></div><h4>Detalles específicos del servicio</h4><div class="grid3">${Object.keys(a.detalles||{}).map(k=>`<label>${esc(k)}<input data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}" data-detail="${esc(k)}" value="${esc(a.detalles[k])}"></label>`).join('')}</div><h4>Evidencias de la actividad ${ai+1}</h4><div class="grid3"><label>Antes<input type="file" accept="image/*" data-img="antes" data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}">${a.antes?'<span class="ok"> cargado ✅</span>':''}</label><label>Durante<input type="file" accept="image/*" data-img="durante" data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}">${a.durante?'<span class="ok"> cargado ✅</span>':''}</label><label>Después<input type="file" accept="image/*" data-img="despues" data-ex="${ex.id}" data-eq="${eq.id}" data-ac="${a.id}">${a.despues?'<span class="ok"> cargado ✅</span>':''}</label></div></div>`).join('')}</div>`).join('')}<div class="bar saveBottom"><button class="btn green bigSave" onclick="saveExec('${ex.id}')">Guardar ejecución</button><button class="btn" onclick="exportExecWord('${q.id}')">Word ejecución</button><button class="btn" onclick="exportExecExcel('${q.id}')">Excel ejecución</button></div></section>`}
async function saveExec(id){let ex=state.ejecuciones.find(x=>x.id===id);ex.os=$('#ex_os').value;ex.siaf=$('#ex_siaf').value;ex.firmas=ex.firmas||defaultFirmas();for(const r of ['area','tecnico']){ex.firmas[r]=ex.firmas[r]||{};ex.firmas[r].nombre=$(`#sig_${r}_nombre`)?.value||'';ex.firmas[r].cargo=$(`#sig_${r}_cargo`)?.value||'';ex.firmas[r].dni=$(`#sig_${r}_dni`)?.value||'';let cv=$(`#sig_${r}_canvas`);if(cv&&cv.dataset.signed==='1')ex.firmas[r].firma=cv.toDataURL('image/png')}for(const el of $$('[data-ex]')){let eq=ex.equipos.find(x=>x.id===el.dataset.eq),a=eq?.actividades.find(x=>x.id===el.dataset.ac);if(!a)continue;if(el.dataset.k)a[el.dataset.k]=el.value;if(el.dataset.detail){a.detalles=a.detalles||{};a.detalles[el.dataset.detail]=el.value}if(el.dataset.img&&el.files?.[0])a[el.dataset.img]=await new Promise(res=>{let r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(el.files[0])})}let q=state.cotizaciones.find(q=>q.id===ex.cotizacionId);if(q){q.ordenNumero=ex.os;q.siaf=ex.siaf;q.estado=ex.os&&ex.siaf?'En ejecución':q.estado}save();msg='Ejecución detallada, firmas y evidencias guardadas por actividad.';render()}
function clearSig(exid,rol){let ex=state.ejecuciones.find(x=>x.id===exid);if(ex?.firmas?.[rol])ex.firmas[rol].firma='';save();render()}
function firmaPrint(f,titulo){return `<div class="firma">${f?.firma?`<img src="${f.firma}">`:''}<b>${esc(f?.nombre||titulo)}</b><br>${esc(f?.cargo||'')}<br>${f?.dni?`DNI: ${esc(f.dni)}`:''}<br>${titulo}</div>`}

function viewDocs(tipo){let qs=empCot().filter(q=>state.ejecuciones.some(e=>e.cotizacionId===q.id));return `<section class="wrap">${back()}<h2>${tipo}</h2><p class="notice">El PDF mantiene el formato del sistema. Los botones Word/Excel permiten ajustes únicos sin modificar el PDF original.</p>${table(['Cotización','Cliente','Tipo de servicio','Acción'],qs.map(q=>[q.numero,q.clienteNombre,q.tipo||'',`<button class="btn green" onclick="printDoc('${q.id}','${tipo}')">Generar PDF</button> <button class="btn" onclick="exportDocWord('${q.id}','${tipo}')">Word</button> <button class="btn" onclick="exportDocExcel('${q.id}','${tipo}')">Excel</button>`]))}</section>`}
function printDoc(id,tipo){let q=state.cotizaciones.find(q=>q.id===id),e=state.empresas.find(x=>x.id===q.empresaId)||activeEmpresa(),ex=state.ejecuciones.find(x=>x.cotizacionId===id)||ensureExec(q);let w=open('','_blank');w.document.write(tipo.includes('ACTA')?docActa(q,e,ex):docInforme(q,e,ex));w.document.close();setTimeout(()=>w.print(),300)}
function actRows(ex){let out=[];for(const eq of ex.equipos)for(const a of eq.actividades)out.push([eq.nombre,`Actividad ${a.orden||''}: ${a.descripcion}`,a.estado,a.comentario||'',a.recomendacion||'']);return out}
function detailRows(ex){let out=[];for(const eq of ex.equipos)for(const a of eq.actividades){let det=Object.entries(a.detalles||{}).filter(([k,v])=>v).map(([k,v])=>`<b>${esc(k)}:</b> ${esc(v)}`).join('<br>');out.push([eq.nombre,`Actividad ${a.orden||''}: ${esc(a.descripcion)}`,esc(a.estado),det||'-',esc(a.comentario||''),esc(a.recomendacion||'')])}return out}
function evidenceBlock(ex){return ex.equipos.map(eq=>`<h3>${esc(eq.nombre)}</h3>${eq.actividades.map(a=>`<div class="evblock"><b>Actividad ${a.orden||''}: ${esc(a.descripcion)}</b><div class="evids">${['antes','durante','despues'].map(k=>`<div><small>${k.toUpperCase()}</small>${a[k]?`<img src="${a[k]}">`:'<p>Sin evidencia</p>'}</div>`).join('')}</div></div>`).join('')}`).join('')}
function serviceNarrative(q,ex){let t=String(q.tipo||'').toLowerCase();
  if(t.includes('correctivo'))return {acta:'Se deja constancia de la atención correctiva realizada, incluyendo diagnóstico, acciones ejecutadas, repuestos si corresponde y pruebas finales.',informe:'El servicio correctivo se desarrolla con diagnóstico inicial, identificación de causa probable, actividades correctivas, repuestos utilizados y verificación funcional final.',objetivo:'Evaluar, corregir y verificar la operatividad del equipo intervenido.'};
  if(t.includes('preventivo'))return {acta:'Se deja constancia del mantenimiento preventivo ejecutado conforme al alcance programado y validado por el área usuaria.',informe:'El mantenimiento preventivo comprende limpieza, inspección, ajuste, verificación funcional y recomendaciones para continuidad operativa.',objetivo:'Ejecutar actividades preventivas para conservar la operatividad y reducir fallas del equipamiento.'};
  if(t.includes('calibr'))return {acta:'Se deja constancia del servicio de calibración/verificación realizado y la conformidad de recepción del área usuaria.',informe:'El servicio de calibración detalla patrón utilizado, resultado metrológico, condición de aprobación y evidencias de verificación.',objetivo:'Verificar parámetros de medición y registrar resultados técnicos de calibración.'};
  if(t.includes('instal'))return {acta:'Se deja constancia de instalación, puesta en marcha y entrega operativa del equipo o sistema.',informe:'La instalación considera condiciones encontradas, actividades de montaje, puesta en marcha, pruebas y capacitación básica.',objetivo:'Instalar y verificar el funcionamiento inicial del equipo o sistema.'};
  if(t.includes('venta'))return {acta:'Se deja constancia de la entrega de bienes, equipos, accesorios o repuestos descritos en la cotización.',informe:'El documento técnico de entrega registra características, series/lotes, verificación visual y conformidad de recepción.',objetivo:'Registrar la entrega conforme de los bienes cotizados.'};
  return {acta:'Se deja constancia de la ejecución del servicio contratado y la conformidad del área usuaria.',informe:'El servicio se desarrolla según alcance contratado, registrando actividades, hallazgos, evidencias y recomendaciones.',objetivo:'Documentar técnicamente la ejecución del servicio.'};}
function docActa(q,e,ex){let n=serviceNarrative(q,ex);return `<!doctype html><html><head><title>ACTA ${q.numero}</title><link rel="stylesheet" href="styles.css?v=13.29.3"></head><body class="docprint"><div class="wm">${e.logo?`<img src="${e.logo}">`:''}</div><div class="head"><div>${e.logo?`<img class="logo" src="${e.logo}">`:''}<b>${esc(e.nombre)}</b><br>RUC ${esc(e.ruc)}</div><div><b>ACTA DE CONFORMIDAD</b><br>${esc(q.numero)}<br>OS/OC: ${esc(ex.os)} · SIAF: ${esc(ex.siaf)}</div></div><h1>ACTA DE CONFORMIDAD DE SERVICIO</h1><p>${n.acta}</p><h3>Datos del servicio</h3><p><b>Cliente:</b> ${esc(q.clienteNombre)}<br><b>Establecimiento:</b> ${esc(q.establecimientoNombre)}<br><b>Área usuaria:</b> ${esc(q.areaNombre)}<br><b>Tipo de servicio:</b> ${esc(q.tipo)}<br><b>Configuración:</b> ${esc(q.config)}</p><h3>Relación de actividades conformes</h3>${table(['Equipo','Actividad ejecutada','Estado','Observación','Recomendación'],actRows(ex))}<h3>Observaciones de conformidad</h3><p>El responsable del área usuaria firma la presente acta en señal de conformidad de las actividades registradas y sustentadas en la ejecución.</p><div class="firmas">${firmaPrint(ex.firmas?.area,'Responsable área usuaria')}${firmaPrint(ex.firmas?.tecnico,'Técnico responsable')}<div class="firma">${e.firma?`<img src="${e.firma}">`:''}<b>${esc(e.representante||'Representante')}</b><br>${esc(e.cargoRepresentante||'')}<br>${esc(e.nombre)}<br>Empresa contratista</div></div></body></html>`}
function docInforme(q,e,ex){let rows=detailRows(ex), n=serviceNarrative(q,ex);return `<!doctype html><html><head><title>INFORME ${q.numero}</title><link rel="stylesheet" href="styles.css?v=13.29.3"></head><body class="docprint"><div class="wm">${e.logo?`<img src="${e.logo}">`:''}</div><div class="head"><div>${e.logo?`<img class="logo" src="${e.logo}">`:''}<b>${esc(e.nombre)}</b><br>RUC ${esc(e.ruc)}</div><div><b>INFORME TÉCNICO</b><br>${esc(q.numero)}</div></div><h1>INFORME TÉCNICO</h1><p><b>Señores:</b> ${esc(q.clienteNombre)}<br><b>Atención:</b> Área usuaria - ${esc(q.areaNombre||'-')}<br><b>Asunto:</b> Informe técnico del servicio ${esc(q.tipo)} según ${esc(q.numero)}.</p><h3>1. Objetivo</h3><p>${n.objetivo}</p><h3>2. Antecedentes</h3><p>${n.informe}</p><h3>3. Datos del establecimiento y servicio</h3><p><b>Establecimiento:</b> ${esc(q.establecimientoNombre)}<br><b>OS/OC:</b> ${esc(ex.os)} · <b>SIAF:</b> ${esc(ex.siaf)}<br><b>Tipo de servicio:</b> ${esc(q.tipo)} · <b>Configuración:</b> ${esc(q.config)}</p><h3>4. Actividades realizadas y sustento técnico</h3>${table(['Equipo','Actividad','Estado','Detalles específicos','Comentario técnico','Recomendación'],rows)}<h3>5. Evidencias por actividad</h3>${evidenceBlock(ex)}<h3>6. Hallazgos / observaciones</h3><p>${rows.map(r=>r[4]).filter(Boolean).join('<br>')||'No se registraron observaciones críticas adicionales durante la intervención.'}</p><h3>7. Conclusiones</h3><p>Las actividades fueron ejecutadas conforme al alcance contratado, quedando cada actividad sustentada con estado, comentario, recomendación y evidencias independientes.</p><h3>8. Recomendaciones</h3><p>${ex.equipos.flatMap(eq=>eq.actividades.map(a=>a.recomendacion).filter(Boolean)).map(esc).join('<br>')||'Mantener programación periódica de mantenimiento y operación responsable del equipamiento.'}</p><h3>9. Garantía</h3><p>${esc(e.garantia||'Según alcance del servicio ejecutado.')}</p><div class="firmas">${firmaPrint(ex.firmas?.tecnico,'Técnico responsable')}<div class="firma">${e.firma?`<img src="${e.firma}">`:''}<b>${esc(e.representante)}</b><br>${esc(e.cargoRepresentante)}<br>${esc(e.nombre)}</div></div></body></html>`}
function exportDocWord(id,tipo){let q=state.cotizaciones.find(q=>q.id===id),e=state.empresas.find(x=>x.id===q.empresaId)||activeEmpresa(),ex=state.ejecuciones.find(x=>x.cotizacionId===id)||ensureExec(q);let html=tipo.includes('ACTA')?docActa(q,e,ex):docInforme(q,e,ex);download(`${tipo.includes('ACTA')?'ACTA':'INFORME'}_${q.numero}.doc`,html,'application/msword')}
function exportDocExcel(id,tipo){let q=state.cotizaciones.find(q=>q.id===id),ex=state.ejecuciones.find(x=>x.cotizacionId===id)||ensureExec(q);let rows=[['Cotización',q.numero],['Cliente',q.clienteNombre],['Tipo de servicio',q.tipo],['Configuración',q.config],[],['Equipo','Actividad','Estado','Detalles','Comentario','Recomendación'],...detailRows(ex).map(r=>r.map(x=>String(x).replace(/<[^>]*>/g,'')))];download(`${tipo.includes('ACTA')?'ACTA':'INFORME'}_${q.numero}.xls`,toExcel(rows),'application/vnd.ms-excel')}
function viewInv(){return `<section class="wrap">${back()}<h2>Inventario</h2><div class="grid"><select id="i_tipo"><option>Equipo</option><option>Repuesto</option><option>Accesorio</option></select><input id="i_cod" placeholder="Código"><input id="i_desc" placeholder="Descripción"><input id="i_stock" type="number" placeholder="Stock"></div><button class="btn green" onclick="state.inventario.push({id:uid(),empresaId:activeEmpresa().id,tipo:$('#i_tipo').value,codigo:$('#i_cod').value,descripcion:$('#i_desc').value,stock:$('#i_stock').value});save();render()">Agregar</button>${table(['Tipo','Código','Descripción','Stock'],state.inventario.filter(i=>i.empresaId===activeEmpresa().id).map(i=>[i.tipo,i.codigo,i.descripcion,i.stock]))}</section>`}

function viewUsuarios(){
  if(!can('Usuarios','ver'))return `<section class="wrap"><h2>Sin acceso</h2><p>No tienes permiso para ver usuarios.</p></section>`;
  let editing=state._editUserId?state.usuarios.find(u=>u.id===state._editUserId):null;
  let u=editing||{id:'',nombre:'',usuario:'',correo:'',clave:'',rol:'TECNICO',estado:'ACTIVO',empresaId:activeEmpresa().id,permisos:rolePerms('TECNICO')};
  let p=u.permisos||rolePerms(u.rol);
  let permTable=`<div class="tableWrap"><table><thead><tr><th>Módulo</th>${ACTIONS.map(a=>`<th>${a}</th>`).join('')}<th>Costos</th></tr></thead><tbody>${MODULES.map(m=>`<tr><td><b>${m}</b></td>${ACTIONS.map(a=>`<td><input type="checkbox" data-perm-mod="${m}" data-perm-act="${a}" ${p[m]?.[a]?'checked':''}></td>`).join('')}<td><input type="checkbox" data-perm-mod="${m}" data-perm-act="costos" ${p[m]?.costos?'checked':''}></td></tr>`).join('')}</tbody></table></div>`;
  return `<section class="wrap">${back()}<h2>Usuarios y permisos</h2><p class="notice">El usuario TÉCNICO no debe ver costos, precios, IGV, totales, configuración ni usuarios salvo que se le habilite manualmente.</p><div class="grid"><label><b>Nombre</b><input id="u_nombre" value="${esc(u.nombre)}"></label><label><b>Usuario</b><input id="u_usuario" value="${esc(u.usuario)}"></label><label><b>Correo</b><input id="u_correo" value="${esc(u.correo)}"></label><label><b>Contraseña</b><div class="passWrap"><input id="u_clave" type="password" value="${esc(u.clave)}"><button class="eyeBtn" type="button" onclick="togglePassword('u_clave',this)">👁</button></div></label><label><b>Empresa asignada</b><select id="u_empresa">${state.empresas.map(e=>`<option value="${e.id}" ${e.id===u.empresaId?'selected':''}>${esc(e.nombre)}</option>`).join('')}</select></label><label><b>Rol</b><select id="u_rol" onchange="setRolePerms(this.value)">${ROLES.map(r=>`<option ${r===u.rol?'selected':''}>${r}</option>`).join('')}</select></label><label><b>Estado</b><select id="u_estado"><option ${u.estado==='ACTIVO'?'selected':''}>ACTIVO</option><option ${u.estado==='INACTIVO'?'selected':''}>INACTIVO</option></select></label></div><h3>Permisos por módulo</h3>${permTable}<div class="bar"><button class="btn green" onclick="saveUser()">${editing?'Actualizar usuario':'Crear usuario'}</button><button class="btn" onclick="state._editUserId=null;render()">Nuevo / limpiar</button></div><h3>Usuarios registrados</h3>${table(['Nombre','Usuario','Empresa','Rol','Estado','Acciones'],state.usuarios.map(x=>[esc(x.nombre),esc(x.usuario),esc(state.empresas.find(e=>e.id===x.empresaId)?.nombre||'-'),esc(x.rol),esc(x.estado),`<button class="btn" onclick="editUser('${x.id}')">Editar</button> <button class="btn danger" onclick="deleteUser('${x.id}')">Eliminar</button>`]))}</section>`
}
function collectPerms(){let p={};for(const m of MODULES)p[m]={};$$('[data-perm-mod]').forEach(cb=>{let m=cb.dataset.permMod,a=cb.dataset.permAct;p[m][a]=cb.checked?1:0});return p}
function setRolePerms(rol){let p=rolePerms(rol);$$('[data-perm-mod]').forEach(cb=>{cb.checked=!!p[cb.dataset.permMod]?.[cb.dataset.permAct]})}
function saveUser(){
  if(!can('Usuarios','crear')&&!state._editUserId){alert('No tienes permiso para crear usuarios.');return}
  if(!can('Usuarios','editar')&&state._editUserId){alert('No tienes permiso para editar usuarios.');return}
  let id=state._editUserId||uid();let u=state.usuarios.find(x=>x.id===id)||{id};
  Object.assign(u,{nombre:$('#u_nombre').value.trim(),usuario:$('#u_usuario').value.trim(),correo:$('#u_correo').value.trim(),clave:$('#u_clave').value,empresaId:$('#u_empresa').value,rol:$('#u_rol').value,estado:$('#u_estado').value,permisos:collectPerms()});
  if(!u.nombre||!u.usuario){alert('Nombre y usuario son obligatorios.');return}
  if(!state.usuarios.some(x=>x.id===id))state.usuarios.push(u);
  state._editUserId=null;logAudit('Guardó usuario','Usuarios',u.usuario);save();msg='Usuario guardado correctamente.';render();
}
function editUser(id){state._editUserId=id;render()}
function deleteUser(id){if(id==='u_admin'){alert('No se puede eliminar el administrador base.');return}if(!can('Usuarios','eliminar')){alert('No tienes permiso para eliminar usuarios.');return}if(confirm('¿Eliminar usuario?')){let u=state.usuarios.find(x=>x.id===id);state.usuarios=state.usuarios.filter(x=>x.id!==id);logAudit('Eliminó usuario','Usuarios',u?.usuario||id);save();render()}}
function viewConfig(){return `<section class="wrap">${back()}<h2>Configuración y respaldo</h2><p class="notice">El respaldo evita volver a ingresar datos ante cualquier cambio de versión.</p><div class="bar"><button class="btn green" onclick="forceSyncCloud()">Sincronizar Supabase</button><button class="btn green" onclick="exportBackup()">Exportar respaldo JSON</button><label class="btn">Importar respaldo JSON<input class="hidden" type="file" accept="application/json,.json,.txt" onchange="importBackup(this)"></label><button class="btn danger" onclick="if(confirm('¿Limpiar solo operación? Conserva empresas.')){state.clientes=[];state.cotizaciones=[];state.ejecuciones=[];state.inventario=[];logAudit('Limpió base operativa','Configuración');save();render()}">Limpiar base operativa</button></div><p><b>Clave principal:</b> ${STORE}<br><b>Estado nube:</b> ${esc(cloudStatus)}<br><b>URL Supabase:</b> ${SUPABASE_URL?'Configurada':'No configurada'}</p><h3>Auditoría reciente</h3>${table(['Fecha','Usuario','Acción','Módulo','Documento'],(state.auditoria||[]).slice(0,25).map(a=>[new Date(a.fecha).toLocaleString(),esc(a.usuario),esc(a.accion),esc(a.modulo),esc(a.documento)]))}</section>`}

function togglePassword(id,btn){let el=document.getElementById(id);if(!el)return;el.type=el.type==='password'?'text':'password';if(btn)btn.textContent=el.type==='password'?'👁':'🙈'}
function sanitizeCell(v){return String(v??'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}
function toCsv(rows){return rows.map(r=>r.map(c=>'"'+sanitizeCell(c).replaceAll('"','""')+'"').join(',')).join('\n')}
function toExcel(rows){return '<table>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+sanitizeCell(c)+'</td>').join('')+'</tr>').join('')+'</table>'}
function moduleRows(){
  if(tab==='Empresas')return [['Razón social','RUC','Teléfono','Correo','Dirección'],...state.empresas.map(e=>[e.nombre,e.ruc,e.telefono,e.correo,e.direccion])];
  if(tab==='Clientes')return [['Cliente','RUC','Establecimientos'],...state.clientes.filter(c=>(c.empresaId||activeEmpresa().id)===activeEmpresa().id).map(c=>[c.nombre,c.ruc,(c.establecimientos||[]).map(e=>e.nombre).join('; ')])];
  if(tab==='Cotizaciones')return [['N°','Cliente','Tipo','Configuración','Subtotal','IGV','Total'],...empCot().map(q=>[q.numero,q.clienteNombre,q.tipo,q.config,q.subtotal,q.igv,q.total])];
  if(tab==='Ejecución')return [['Cotización','Equipo','Actividad','Estado','Comentario','Recomendación'],...state.ejecuciones.filter(ex=>empCot().some(q=>q.id===ex.cotizacionId)).flatMap(ex=>{let q=state.cotizaciones.find(x=>x.id===ex.cotizacionId)||{};return ex.equipos.flatMap(eq=>eq.actividades.map(a=>[q.numero,eq.nombre,a.descripcion,a.estado,a.comentario,a.recomendacion]))})];
  if(tab==='Actas'||tab==='Informes')return [['Cotización','Cliente','Tipo','Estado'],...empCot().filter(q=>state.ejecuciones.some(e=>e.cotizacionId===q.id)).map(q=>[q.numero,q.clienteNombre,q.tipo,q.estado])];
  if(tab==='Inventario')return [['Tipo','Código','Descripción','Stock'],...state.inventario.filter(i=>i.empresaId===activeEmpresa().id).map(i=>[i.tipo,i.codigo,i.descripcion,i.stock])];
  if(tab==='Usuarios')return [['Nombre','Usuario','Empresa','Rol','Estado'],...state.usuarios.map(u=>[u.nombre,u.usuario,state.empresas.find(e=>e.id===u.empresaId)?.nombre||'',u.rol,u.estado])];
  if(tab==='Configuración')return [['Fecha','Usuario','Acción','Módulo','Documento'],...(state.auditoria||[]).map(a=>[new Date(a.fecha).toLocaleString(),a.usuario,a.accion,a.modulo,a.documento])];
  return [['Indicador','Valor'],['Empresas',state.empresas.length],['Clientes',state.clientes.length],['Cotizaciones',empCot().length]];
}
function exportModuleExcel(){alert('La exportación general se desactivó para producción. Selecciona una cotización, ejecución, acta o informe y usa Word/Excel del documento seleccionado.')}
function exportModuleWord(){alert('La exportación general se desactivó para producción. Selecciona una cotización, ejecución, acta o informe y usa Word/Excel del documento seleccionado.')}
function exportBackup(){download(`RESPALDO_SERVITEC_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2),'application/json')}function importBackup(input){let f=input.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);normalize();save();msg='Respaldo importado correctamente.';render()}catch(e){alert('Archivo inválido')}};r.readAsText(f)}function download(n,c,t){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:t}));a.download=n;a.click()}
function updateDraftTotalBox(){
  if(!draft) return;
  applyTax(draft);
  const t=document.querySelector('.total');
  if(t) t.textContent='Total con IGV: '+money(draft.total);
}
function bind(){
  if(window.__servitecBound) return;
  window.__servitecBound=true;
  document.addEventListener('input',ev=>{
    let el=ev.target;
    if(!draft) return;
    if(el.dataset.eqact){
      let eq=draft.equipos.find(x=>x.id===el.dataset.eqparent);let it=eq?.acts?.find(x=>x.id===el.dataset.eqact);
      if(it){it[el.dataset.k]=el.value;updateDraftTotalBox()}
    }else if(el.dataset.type){
      let arr=el.dataset.type==='act'?draft.acts:draft.repuestos;
      let it=arr.find(x=>x.id===el.dataset.id);
      if(it){it[el.dataset.k]=el.value;updateDraftTotalBox()}
    }else if(el.dataset.eqid){
      let it=draft.equipos.find(x=>x.id===el.dataset.eqid);
      if(it){it[el.dataset.k]=el.value}
    }
  });
  document.addEventListener('change',ev=>{
    let el=ev.target;
    if(!draft) return;
    if(el.id==='q_cli'){let c=state.clientes.find(x=>x.id===el.value)||{};let es=c.establecimientos?.[0]||{};let ar=es.areas?.[0]||{};Object.assign(draft,{clienteId:c.id||'',clienteNombre:c.nombre||'',estId:es.id||'',establecimientoNombre:es.nombre||'',areaId:ar.id||'',areaNombre:ar.nombre||''});render()}
    if(el.id==='q_est'){let c=state.clientes.find(x=>x.id===draft.clienteId)||{};let es=(c.establecimientos||[]).find(x=>x.id===el.value)||{};let ar=es.areas?.[0]||{};Object.assign(draft,{estId:es.id||'',establecimientoNombre:es.nombre||'',areaId:ar.id||'',areaNombre:ar.nombre||''});render()}
    if(el.id==='q_area'){let c=state.clientes.find(x=>x.id===draft.clienteId)||{};let es=(c.establecimientos||[]).find(x=>x.id===draft.estId)||{};let ar=(es.areas||[]).find(x=>x.id===el.value)||{};Object.assign(draft,{areaId:ar.id||'',areaNombre:ar.nombre||''})}
    if(el.id==='q_tipo'){draft.tipo=el.value;ensureValidConfig(draft);render()}
    if(el.id==='q_config'){draft.config=el.value;ensureValidConfig(draft);render()}
    if(el.dataset.type||el.dataset.eqid||el.dataset.eqact){save()}
  });
  document.addEventListener('blur',ev=>{if(draft&&(ev.target.dataset.type||ev.target.dataset.eqid||ev.target.dataset.eqact)){save()}},true);
}
window.addEventListener('beforeunload',()=>save(false));bind();render();loadCloud().then(()=>render());
