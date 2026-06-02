/* SERVITEC PRO V13.18 ESTABLE - version unica limpia para PC/celular */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9), money=n=>'S/ '+(Number(n)||0).toFixed(2);
const MODES={GENERAL:'Actividades generales → varios equipos',PROPIAS:'Cada equipo con sus propias actividades',REPUESTOS:'Venta de repuestos / accesorios'};
const seed={empresas:[{id:'emp1',nombre:'SERVITEC BIOMEDICAL',ruc:'20600000001',telefono:'999 999 999',correo:'ventas@servitec.pe',direccion:'',logo:'',firma:'',gerente:'GERENTE GENERAL',observacionesCot:'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.',formaPago:'Según coordinación / contado comercial',tiempoEjecucion:'Según programación y disponibilidad del área usuaria',lugarServicio:'En establecimiento del cliente',validez:'15 días calendario',garantia:'Según alcance del servicio ejecutado'}],clientes:[{id:'cli1',nombre:'Hospital Regional Demo',ruc:'-',establecimientos:[{id:'est1',nombre:'Sede Principal',areas:[{id:'ar1',nombre:'Odontología'},{id:'ar2',nombre:'Centro quirúrgico'}]}]}],cotizaciones:[],inventario:[]};
let state=load(), tab='Dashboard', draft=null, cloud='Modo local', timer=null;
const env=window.SERVITEC_ENV||{}; const hasCloud=!!(env.SUPABASE_URL&&env.SUPABASE_KEY);
function clone(o){return JSON.parse(JSON.stringify(o))} function load(){try{return {...clone(seed),...JSON.parse(localStorage.getItem('servitec_v139')||'{}')}}catch{return clone(seed)}}
function persist(){localStorage.setItem('servitec_v139',JSON.stringify(state)); if(hasCloud){clearTimeout(timer);timer=setTimeout(saveCloud,500)}}
async function loadCloud(){if(!hasCloud){cloud='Modo local: variables no leídas';render();return} cloud='Conectando Supabase...';render();try{let r=await fetch(`${env.SUPABASE_URL}/rest/v1/app_state?id=eq.global&select=payload`,{headers:{apikey:env.SUPABASE_KEY,Authorization:`Bearer ${env.SUPABASE_KEY}`}});let d=await r.json();if(d?.[0]?.payload){state={...clone(seed),...d[0].payload};localStorage.setItem('servitec_v139',JSON.stringify(state))}cloud='Nube Supabase activa';render()}catch(e){cloud='Modo local: Supabase no respondió';render()}}
async function saveCloud(){try{await fetch(`${env.SUPABASE_URL}/rest/v1/app_state`,{method:'POST',headers:{apikey:env.SUPABASE_KEY,Authorization:`Bearer ${env.SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:'global',payload:state,updated_at:new Date().toISOString()})});cloud='Nube Supabase activa';$('.tag')&&($('.tag').textContent=cloud)}catch(e){cloud='Modo local: error Supabase';$('.tag')&&($('.tag').textContent=cloud)}}
function render(){app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.18 ESTABLE</h1><b>Cotización dinámica + Nube + PDFs corporativos</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind()}
const views={Dashboard(){return `<section class="wrap"><h2>Dashboard</h2><div class="grid"><div class="card"><b>Empresas</b><h2>${state.empresas.length}</h2></div><div class="card"><b>Clientes</b><h2>${state.clientes.length}</h2></div><div class="card"><b>Cotizaciones</b><h2>${state.cotizaciones.length}</h2></div><div class="card"><b>Inventario</b><h2>${state.inventario.length}</h2></div></div><p class="notice">Versión con ejecución real controlada por Orden de Compra/Servicio y SIAF. La ejecución toma las actividades reales de la cotización seleccionada.</p></section>`},Empresas(){return `<section class="wrap">${back()}<h2>Empresas</h2><p class="notice">Aquí se guarda el logo, firma del gerente, datos comerciales y observaciones que salen automáticamente en los PDF.</p><div class="grid"><input id="empNom" placeholder="Razón social"><input id="empRuc" placeholder="RUC"><input id="empTel" placeholder="Teléfono"><input id="empCor" placeholder="Correo"><input id="empDir" placeholder="Dirección"><input id="empGer" placeholder="Gerente / Representante"></div><br><button class="btn green" data-act="saveEmpresa">+ Nueva empresa</button><hr>${state.empresas.map(e=>empresaCard(e)).join('')}</section>`},Clientes(){let c=state.clientes[0];return `<section class="wrap">${back()}<h2>Clientes</h2><div class="grid2"><input id="cliNom" placeholder="Nombre cliente"><input id="cliRuc" placeholder="RUC"></div><br><button class="btn green" data-act="saveCliente">+ Nuevo cliente</button><hr><div class="grid2"><select id="cliSel">${state.clientes.map(x=>`<option value="${x.id}">${x.nombre}</option>`).join('')}</select><input id="estNom" placeholder="Nuevo establecimiento"></div><br><button class="btn green" data-act="saveEst">Agregar establecimiento</button>${c?`<div class="card"><h3>${c.nombre}</h3>${c.establecimientos.map(e=>`<div class="card"><b>${e.nombre}</b><ul>${e.areas.map(a=>`<li>${a.nombre}</li>`).join('')}</ul><div class="grid2"><input id="area_${e.id}" placeholder="Área usuaria"><button class="btn" data-act="saveArea" data-id="${e.id}">Agregar área</button></div></div>`).join('')}</div>`:''}</section>`},Cotizaciones(){return draft?quoteForm():quoteList()},Ejecución(){return viewEjecucion()},Actas(){return docs('ACTA DE CONFORMIDAD')},Informes(){return docs('INFORME TÉCNICO')},Inventario(){return `<section class="wrap">${back()}<h2>Inventario / QR / Código de barras</h2><div class="grid"><select id="invTipo"><option>Equipo</option><option>Repuesto</option><option>Accesorio</option></select><input id="invCod" placeholder="Código"><input id="invDesc" placeholder="Descripción"><input id="invSerie" placeholder="Serie"></div><br><button class="btn green" data-act="saveInv">Agregar</button>${table(['Tipo','Descripción','Código','QR','Barras'],state.inventario.map(i=>[i.tipo,i.descripcion,i.codigo,`▣ ${i.codigo||i.id}`,`|||| ${i.codigo||i.id} ||||`]))}</section>`},Configuración(){return `<section class="wrap">${back()}<h2>Configuración</h2><p class="notice">${cloud}</p><p>Variables Vercel: VITE_SUPABASE_URL y VITE_SUPABASE_KEY.</p></section>`}};
function back(){return `<button class="btn primary" onclick="tab='Dashboard';draft=null;render()">← Atrás</button>`} function table(h,rows){return `<div class="tableWrap"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c||''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function estadoCot(q){return q.estado || (q.ordenNumero&&q.siaf?'En ejecución':'Cotización')}
function estadoBadge(q){let e=estadoCot(q);let cls=e==='Cotización'?'gray':e==='Aprobada'?'blue':e==='En ejecución'?'orange':e==='Ejecutada'?'green':'gray';return `<span class="badge ${cls}">${e}</span>`}
function quoteList(){return `<section class="wrap">${back()}<h2>Cotizaciones</h2><button class="btn green" onclick="draft=newDraft();render()">+ Nueva cotización</button>${table(['N°','Cliente','Configuración','Estado','Total','Acciones'],state.cotizaciones.map(q=>[q.numero,q.clienteNombre,q.config,estadoBadge(q),money(q.total),`<div class="actions"><button class="btn" onclick="draft=clone(state.cotizaciones.find(x=>x.id==='${q.id}'));render()">Editar</button><button class="btn green" onclick="printQuote('${q.id}','COTIZACIÓN')">PDF</button><button class="btn" onclick="tab='Ejecución';localStorage.setItem('servitec_exec_qid','${q.id}');render()">Ejecutar</button><button class="btn" onclick="csv('${q.id}')">Excel</button><button class="btn" onclick="word('${q.id}')">Word</button><button class="btn danger" onclick="delQuote('${q.id}')">Eliminar</button></div>`]))}</section>`}
function newDraft(){let c=state.clientes[0]||{}, e=c.establecimientos?.[0]||{}, a=e.areas?.[0]||{};return {id:uid(),numero:`COT-${new Date().getFullYear()}-${String(state.cotizaciones.length+1).padStart(4,'0')}`,empresaId:state.empresas[0]?.id||'',clienteId:c.id||'',estId:e.id||'',areaId:a.id||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,equipos:[],acts:[],repuestos:[],total:0,fecha:new Date().toISOString()}}
function cdata(){let c=state.clientes.find(x=>x.id===draft.clienteId)||state.clientes[0]||{}, e=(c.establecimientos||[]).find(x=>x.id===draft.estId)||c.establecimientos?.[0]||{}, a=(e.areas||[]).find(x=>x.id===draft.areaId)||e.areas?.[0]||{};return {c,ests:c.establecimientos||[],e,areas:e.areas||[],a}}
function qtotal(q=draft){if(q.config===MODES.REPUESTOS)return q.repuestos.reduce((s,r)=>s+(+r.cantidad||0)*(+r.precio||0),0);if(q.config===MODES.PROPIAS)return q.equipos.reduce((s,e)=>s+(e.acts||[]).reduce((a,x)=>a+(+x.cantidad||0)*(+x.precio||0),0),0);return q.acts.reduce((s,a)=>s+(+a.cantidad||0)*(+a.precio||0),0)}
function quoteForm(){let {c,ests,e,areas}=cdata();draft.total=qtotal();return `<section class="wrap">${back()}<h2>Nueva cotización</h2><div class="grid"><select data-k="clienteId">${state.clientes.map(x=>`<option value="${x.id}" ${x.id===draft.clienteId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="estId">${ests.map(x=>`<option value="${x.id}" ${x.id===draft.estId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="areaId">${areas.map(x=>`<option value="${x.id}" ${x.id===draft.areaId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="tipo">${['Mantenimiento preventivo','Mantenimiento correctivo','Calibración','Servicio + repuestos','Venta'].map(x=>`<option ${x===draft.tipo?'selected':''}>${x}</option>`)}</select><select data-k="config">${Object.values(MODES).map(x=>`<option ${x===draft.config?'selected':''}>${x}</option>`)}</select></div><div class="bar"><span class="pill">${draft.config}</span><b class="total">Total: ${money(draft.total)}</b></div>${modeView()}<div class="bar"><button class="btn green" onclick="saveQuote()">Guardar y volver a lista</button><button class="btn danger" onclick="draft=null;render()">Cancelar</button></div></section>`}
function modeView(){if(draft.config===MODES.REPUESTOS)return repView(); if(draft.config===MODES.PROPIAS)return propiaView(); return generalView()}
function generalView(){return `<p class="notice">Una sola lista de actividades se aplicará a todos los equipos. Primero registra/importa las actividades generales y luego los equipos donde se ejecutarán.</p><h3>Actividades generales</h3><div class="bar"><button class="btn green" onclick="draft.acts.push(act());render()">+ Actividad</button><button class="btn" onclick="importGeneral()">Importar solo descripciones</button></div>${actsTable(draft.acts)}<h3>Equipos incluidos</h3><div class="bar"><button class="btn green" onclick="draft.equipos.push(eq());render()">+ Equipo</button></div>${equiposTable(draft.equipos)}</section>`}
function propiaView(){return `<p class="notice">Cada equipo maneja su propia lista de actividades.</p><div class="bar"><button class="btn green" onclick="draft.equipos.push(eq());render()">+ Equipo con actividades propias</button></div>${draft.equipos.map((e,i)=>`<div class="card"><h3>Equipo ${i+1}</h3>${eqFields(e)}<div class="bar"><button class="btn green" onclick="addActEq('${e.id}')">+ Actividad para este equipo</button><button class="btn" onclick="importEq('${e.id}')">Importar actividades de este equipo</button></div>${actsTable(e.acts||[],e.id)}</div>`).join('')}`}
function repView(){return `<p class="notice">Modo venta: no se muestran equipos, solo repuestos/accesorios.</p><div class="bar"><button class="btn green" onclick="draft.repuestos.push(rep());render()">+ Repuesto</button><button class="btn" onclick="importRep()">Importar descripciones</button></div><h3>Repuestos / accesorios</h3><div class="tableWrap"><table><thead><tr><th>Código</th><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${draft.repuestos.map(r=>`<tr><td><input placeholder="Código" data-r="${r.id}" data-p="codigo" value="${esc(r.codigo)}"></td><td><textarea placeholder="Descripción" data-r="${r.id}" data-p="descripcion">${esc(r.descripcion)}</textarea></td><td><input type="number" placeholder="1" data-r="${r.id}" data-p="cantidad" value="${r.cantidad}"></td><td><input type="number" placeholder="0" data-r="${r.id}" data-p="precio" value="${r.precio}"></td><td>${money((+r.cantidad||0)*(+r.precio||0))}</td></tr>`).join('')}</tbody></table></div>`}
function eq(){return{id:uid(),nombre:'',marca:'',modelo:'',serie:'',acts:[]}} function act(){return{id:uid(),descripcion:'',cantidad:1,precio:0}} function rep(){return{id:uid(),codigo:'',descripcion:'',cantidad:1,precio:0}}
function eqFields(e){return `<div class="grid"><input placeholder="Equipo biomédico" data-eq="${e.id}" data-p="nombre" value="${esc(e.nombre)}"><input placeholder="Marca" data-eq="${e.id}" data-p="marca" value="${esc(e.marca)}"><input placeholder="Modelo" data-eq="${e.id}" data-p="modelo" value="${esc(e.modelo)}"><input placeholder="Serie" data-eq="${e.id}" data-p="serie" value="${esc(e.serie)}"></div>`}
function equiposTable(list){return `<div class="tableWrap"><table><thead><tr><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th></tr></thead><tbody>${list.map(eq=>`<tr><td><input placeholder="Equipo biomédico" data-eq="${eq.id}" data-p="nombre" value="${esc(eq.nombre)}"></td><td><input placeholder="Marca" data-eq="${eq.id}" data-p="marca" value="${esc(eq.marca)}"></td><td><input placeholder="Modelo" data-eq="${eq.id}" data-p="modelo" value="${esc(eq.modelo)}"></td><td><input placeholder="Serie" data-eq="${eq.id}" data-p="serie" value="${esc(eq.serie)}"></td></tr>`).join('')}</tbody></table></div>`}
function actsTable(list,eid=''){return `<div class="tableWrap"><table><thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>${list.map(a=>`<tr><td><textarea placeholder="Descripción de actividad" data-a="${a.id}" data-eid="${eid}" data-p="descripcion">${esc(a.descripcion)}</textarea></td><td><input type="number" placeholder="1" data-a="${a.id}" data-eid="${eid}" data-p="cantidad" value="${a.cantidad}"></td><td><input type="number" placeholder="0" data-a="${a.id}" data-eid="${eid}" data-p="precio" value="${a.precio}"></td><td>${money((+a.cantidad||0)*(+a.precio||0))}</td></tr>`).join('')}</tbody></table></div>`}
function bind(){
  document.querySelectorAll('[data-k]').forEach(el=>el.onchange=()=>{
    let k=el.dataset.k;
    if(k==='clienteId'){
      draft.clienteId=el.value;
      let c=state.clientes.find(x=>x.id===el.value);
      draft.estId=c?.establecimientos?.[0]?.id||'';
      draft.areaId=c?.establecimientos?.[0]?.areas?.[0]?.id||'';
    }else if(k==='estId'){
      draft.estId=el.value;
      let {e}=cdata();
      draft.areaId=e?.areas?.[0]?.id||'';
    }else draft[k]=el.value;
    render();
  });

  // Edición estable para campo: NO redibujar toda la tabla en cada tecla.
  // Así el cursor no salta cuando se escribe 100, 1500, 6500, etc.
  document.querySelectorAll('[data-eq]').forEach(el=>{
    el.oninput=()=>{
      let e=draft.equipos.find(x=>x.id===el.dataset.eq);
      if(e) e[el.dataset.p]=el.value;
      persistDraftSoft();
    };
  });

  document.querySelectorAll('[data-a]').forEach(el=>{
    el.oninput=()=>{
      let eq = el.dataset.eid ? draft.equipos.find(x=>x.id===el.dataset.eid) : null;
      let list = eq ? (eq.acts||[]) : draft.acts;
      let a=list.find(x=>x.id===el.dataset.a);
      if(a){
        a[el.dataset.p]=el.value;
        updateRowSubtotal(el,a);
        updateTotalSoft();
        persistDraftSoft();
      }
    };
  });

  document.querySelectorAll('[data-r]').forEach(el=>{
    el.oninput=()=>{
      let r=draft.repuestos.find(x=>x.id===el.dataset.r);
      if(r){
        r[el.dataset.p]=el.value;
        updateRowSubtotal(el,r);
        updateTotalSoft();
        persistDraftSoft();
      }
    };
  });

  document.querySelectorAll('[data-emp-field]').forEach(el=>{el.oninput=()=>{let e=state.empresas.find(x=>x.id===el.dataset.id); if(e){e[el.dataset.empField]=el.value; persist();}}});
  document.querySelectorAll('[data-emp-file]').forEach(el=>{el.onchange=()=>{let file=el.files&&el.files[0]; if(!file)return; let e=state.empresas.find(x=>x.id===el.dataset.id); let field=el.dataset.empFile; let reader=new FileReader(); reader.onload=()=>{if(e){e[field]=reader.result; persist(); render();}}; reader.readAsDataURL(file);}});
  document.querySelectorAll('[data-act]').forEach(el=>el.onclick=()=>actions[el.dataset.act](el));
}

function updateRowSubtotal(el,item){
  const tr=el.closest('tr');
  if(!tr)return;
  const cells=[...tr.children];
  const last=cells[cells.length-1];
  if(last) last.textContent=money((+item.cantidad||0)*(+item.precio||0));
}
function updateTotalSoft(){
  if(!draft)return;
  draft.total=qtotal();
  const t=document.querySelector('.total');
  if(t)t.textContent='Total: '+money(draft.total);
}
function persistDraftSoft(){
  // No sincroniza cada tecla a Supabase; evita lentitud en campo.
  // Se persiste al guardar la cotización.
  try{localStorage.setItem('servitec_draft_v1311',JSON.stringify(draft));}catch(e){}
}
const actions={saveEmpresa(){let n=$('#empNom').value.trim();if(!n)return;state.empresas.push({id:uid(),nombre:n,ruc:$('#empRuc').value,telefono:$('#empTel').value,correo:$('#empCor').value,direccion:$('#empDir').value,gerente:$('#empGer').value||'GERENTE GENERAL',logo:'',firma:'',observacionesCot:'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.',formaPago:'Según coordinación / contado comercial',tiempoEjecucion:'Según programación y disponibilidad del área usuaria',lugarServicio:'En establecimiento del cliente',validez:'15 días calendario',garantia:'Según alcance del servicio ejecutado'});persist();render()},saveCliente(){let n=$('#cliNom').value.trim();if(!n)return;state.clientes.push({id:uid(),nombre:n,ruc:$('#cliRuc').value,establecimientos:[]});persist();render()},saveEst(){let cid=$('#cliSel').value,n=$('#estNom').value.trim();if(!n)return;state.clientes=state.clientes.map(c=>c.id===cid?{...c,establecimientos:[...c.establecimientos,{id:uid(),nombre:n,areas:[]}]}:c);persist();render()},saveArea(el){let n=$('#area_'+el.dataset.id).value.trim();if(!n)return;state.clientes=state.clientes.map(c=>({...c,establecimientos:c.establecimientos.map(e=>e.id===el.dataset.id?{...e,areas:[...e.areas,{id:uid(),nombre:n}]}:e)}));persist();render()},saveInv(){let d=$('#invDesc').value.trim();if(!d)return;state.inventario.push({id:uid(),tipo:$('#invTipo').value,codigo:$('#invCod').value,descripcion:d,serie:$('#invSerie').value});persist();render()}};
function parseImport(raw){
  return (raw||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(line=>{
    let parts=line.split('|').map(x=>x.trim()).filter(x=>x!==''), descripcion='', cantidad=1, precio=0;
    if(parts.length>=3){descripcion=parts[0]; cantidad=Number(parts[1])||1; precio=Number(parts[2])||0;}
    else if(parts.length===2){descripcion=parts[0]; precio=Number(parts[1])||0;}
    else {descripcion=parts[0]||line;}
    return {descripcion,cantidad,precio};
  });
}
function importModal(t,cb){
  const id='modal_'+uid();
  const ejemplo='Diagnóstico general\nLimpieza interna|80\nCalibración funcional|1|150\nPruebas operativas';
  document.body.insertAdjacentHTML('beforeend',`<div class="modalMask" id="${id}"><div class="modalBox"><h2>${t}</h2><p class="muted">Pega TODA la lista. Una descripción por línea. También puedes usar: <b>Descripción|Precio</b> o <b>Descripción|Cantidad|Precio</b>.</p><textarea id="${id}_txt" rows="12" placeholder="${ejemplo}"></textarea><div class="modalBtns"><button class="btn" id="${id}_cancel">Cancelar</button><button class="btn green" id="${id}_ok">Importar lista completa</button></div></div></div>`);
  document.getElementById(id+'_txt').focus();
  document.getElementById(id+'_cancel').onclick=()=>document.getElementById(id).remove();
  document.getElementById(id+'_ok').onclick=()=>{
    const items=parseImport(document.getElementById(id+'_txt').value);
    document.getElementById(id).remove();
    if(!items.length){alert('No se detectaron actividades. Pega una lista, una por línea.');return;}
    cb(items);
  };
}
function importGeneral(){importModal('Importar actividades generales',items=>{draft.acts.push(...items.map(x=>({...act(),...x})));render();});}
function importEq(id){let e=draft.equipos.find(x=>x.id===id);importModal('Importar actividades del equipo',items=>{e.acts.push(...items.map(x=>({...act(),...x})));render();});}
function importRep(){importModal('Importar repuestos / accesorios',items=>{draft.repuestos.push(...items.map(x=>({...rep(),descripcion:x.descripcion,cantidad:x.cantidad,precio:x.precio})));render();});}
function addActEq(id){draft.equipos.find(x=>x.id===id).acts.push(act());render()}
function saveQuote(){let {c,e,a}=cdata();draft.total=qtotal();draft.clienteNombre=c.nombre;draft.establecimientoNombre=e.nombre;draft.areaNombre=a.nombre;let i=state.cotizaciones.findIndex(q=>q.id===draft.id);i>=0?state.cotizaciones[i]=clone(draft):state.cotizaciones.push(clone(draft));draft=null;persist();render()}function delQuote(id){if(confirm('¿Eliminar cotización?')){state.cotizaciones=state.cotizaciones.filter(q=>q.id!==id);persist();render()}}
function rows(q){if(q.config===MODES.REPUESTOS)return q.repuestos||[];if(q.config===MODES.PROPIAS)return(q.equipos||[]).flatMap(e=>(e.acts||[]).map(a=>({...a,descripcion:`${e.nombre||'Equipo'}: ${a.descripcion}`})));return q.acts||[]}
function safe(v=''){return String(v||'')}
function docTable(rs){return `<table><thead><tr><th>#</th><th>Descripción</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead><tbody>${rs.map((r,i)=>`<tr><td>${i+1}</td><td>${r.descripcion||''}</td><td>${r.cantidad||1}</td><td>${money(r.precio)}</td><td>${money((+r.cantidad||1)*(+r.precio||0))}</td></tr>`).join('')}</tbody></table>`}
function groupSubtotal(rs){return rs.reduce((s,r)=>s+(+r.cantidad||1)*(+r.precio||0),0)}
function cotizacionBody(q){
  if(q.config===MODES.REPUESTOS){
    return `<h3>Repuestos / accesorios</h3>${docTable(q.repuestos||[])}`;
  }
  if(q.config===MODES.PROPIAS){
    return (q.equipos||[]).map((e,i)=>{
      const acts=e.acts||[];
      const st=groupSubtotal(acts);
      return `<div class="group"><h3>Equipo ${i+1}: ${safe(e.nombre)||'Equipo biomédico'}</h3><div class="small"><b>Marca:</b> ${safe(e.marca)||'-'} &nbsp; <b>Modelo:</b> ${safe(e.modelo)||'-'} &nbsp; <b>Serie:</b> ${safe(e.serie)||'-'}</div>${docTable(acts)}<p class="subtotal">Subtotal ${safe(e.nombre)||'equipo'}: ${money(st)}</p></div>`
    }).join('') || `<p>No se registraron equipos.</p>`;
  }
  return `<h3>Equipos incluidos</h3><table><thead><tr><th>#</th><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th></tr></thead><tbody>${(q.equipos||[]).map((e,i)=>`<tr><td>${i+1}</td><td>${safe(e.nombre)||'Equipo biomédico'}</td><td>${safe(e.marca)||'-'}</td><td>${safe(e.modelo)||'-'}</td><td>${safe(e.serie)||'-'}</td></tr>`).join('')}</tbody></table><h3>Actividades generales</h3>${docTable(q.acts||[])}`;
}
function quoteDoc(q){
  let emp=state.empresas.find(e=>e.id===q.empresaId)||state.empresas[0]||{};
  let cli=state.clientes.find(c=>c.id===q.clienteId)||{};
  let numero=q.numero||'COT-0000';
  let title='COTIZACION-'+numero;
  let subtotal=Number(q.total)||0;
  return `<html><head><title>${title}</title><style>
  @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#001b3f;font-size:12px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:5px solid #0f7f73;padding-bottom:14px;margin-bottom:16px}.pdfLogo{max-height:62px;max-width:190px;margin-bottom:6px}.brand{font-size:27px;font-weight:900;color:#0f7f73;letter-spacing:.5px}.empresa{font-size:12px;line-height:1.45}.docTitle{text-align:right}.docTitle h1{font-size:28px;margin:0;color:#001b3f}.docTitle .num{font-size:17px;font-weight:800;color:#b30000;margin-top:6px}.box{background:#f1f7ff;padding:12px 14px;border-radius:10px;margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:5px 24px}.intro{margin:14px 0;line-height:1.55}.group{margin-top:12px;page-break-inside:avoid}.group h3{background:#e8f7f6;border-left:6px solid #0f7f73;padding:8px 10px;margin:12px 0 8px;color:#001b3f;text-transform:uppercase}.small{font-size:11px;margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0 10px}th{background:#0f7f73;color:#fff;font-weight:800}th,td{border:1px solid #cfe0f2;padding:7px;vertical-align:top}td:nth-child(1),td:nth-child(3){text-align:center}td:nth-child(4),td:nth-child(5){text-align:right}.subtotal{text-align:right;font-weight:800;margin:3px 0 12px}.summary{margin-left:auto;width:330px;border:1px solid #cfe0f2;border-radius:8px;overflow:hidden}.summary div{display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #cfe0f2}.summary div:last-child{border-bottom:0;background:#0f7f73;color:white;font-size:18px;font-weight:900}.cond{border:1px solid #cfe0f2;border-radius:8px;padding:10px;margin-top:14px;line-height:1.55}.cond h3{margin:0 0 7px;color:#0f7f73}.obs{margin-top:8px}.firma{margin-top:28px;text-align:center;width:300px;margin-left:auto;margin-right:auto;page-break-inside:avoid}.pdfFirma{max-height:70px;max-width:220px;display:block;margin:0 auto 4px}.firma .line{border-top:1px solid #001b3f;padding-top:8px;font-weight:800}.footer{margin-top:14px;font-size:10px;color:#456;display:flex;justify-content:space-between;page-break-inside:avoid}
  </style></head><body>
  <div class="head"><div>${emp.logo?`<img class="pdfLogo" src="${emp.logo}">`:''}<div class="brand">${emp.nombre||'SERVITEC PRO'}</div><div class="empresa">RUC ${emp.ruc||''} · ${emp.telefono||''} · ${emp.correo||''}<br>${emp.direccion||'Dirección comercial / oficina principal'}</div></div><div class="docTitle"><h1>COTIZACIÓN</h1><div class="num">N° ${numero}</div></div></div>
  <div class="box"><div><b>CLIENTE:</b> ${q.clienteNombre||''}</div><div><b>RUC:</b> ${cli.ruc||'-'}</div><div><b>ESTABLECIMIENTO:</b> ${q.establecimientoNombre||''}</div><div><b>ÁREA:</b> ${q.areaNombre||''}</div><div><b>FECHA:</b> ${new Date(q.fecha||Date.now()).toLocaleDateString('es-PE')}</div><div><b>TIPO:</b> ${q.tipo||''}</div></div>
  <p class="intro"><b>Estimados señores:</b><br>Por medio de la presente nos es grato saludarles y presentar nuestra propuesta económica para la ejecución del servicio solicitado.</p>
  ${cotizacionBody(q)}
  <div class="summary"><div><span>VALOR VENTA</span><b>${money(subtotal)}</b></div><div><span>I.G.V. / Impuestos</span><b>Según corresponda</b></div><div><span>TOTAL</span><b>${money(subtotal)}</b></div></div>
  <div class="cond"><h3>CONDICIONES COMERCIALES</h3><b>Moneda:</b> Soles (S/).<br><b>Forma de pago:</b> ${emp.formaPago||'Según coordinación / contado comercial'}.<br><b>Tiempo de ejecución:</b> ${emp.tiempoEjecucion||'Según programación y disponibilidad del área usuaria'}.<br><b>Lugar del servicio:</b> ${emp.lugarServicio||'En establecimiento del cliente'}.<br><b>Validez de oferta:</b> ${emp.validez||'15 días calendario'}.<br><b>Garantía:</b> ${emp.garantia||'Según alcance del servicio ejecutado'}.<div class="obs"><b>Observaciones:</b><br>${(emp.observacionesCot||'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.').split('\n').map(x=>safe(x)).join('<br>')}</div></div>
  <p>Sin otro particular, quedamos de ustedes.</p>
  <div class="firma">${emp.firma?`<img class="pdfFirma" src="${emp.firma}">`:''}<div class="line">${emp.gerente||'GERENTE GENERAL'}<br>${emp.nombre||'SERVITEC PRO'}</div></div>
  <div class="footer"><span>${emp.telefono||''} · ${emp.correo||''}</span><span>Pág. 1</span></div>
  </body></html>`
}
function legacyDoc(q,t){let emp=state.empresas.find(e=>e.id===q.empresaId)||state.empresas[0]||{};return `<html><head><title>${t}-${q.numero||''}</title><style>body{font-family:Arial;margin:35px;color:#001b3f}.head{display:flex;justify-content:space-between;border-bottom:5px solid #0f7f73;padding-bottom:12px}.logo{font-size:28px;font-weight:900;color:#0f7f73}.box{background:#f1f7ff;padding:14px;border-radius:12px;margin:16px 0}table{width:100%;border-collapse:collapse}th{background:#0f7f73;color:#fff}th,td{border:1px solid #d7e4f5;padding:9px}.total{text-align:right;font-size:23px;font-weight:900}.firmas{display:flex;justify-content:space-between;margin-top:70px}.line{border-top:1px solid #001b3f;width:240px;text-align:center;padding-top:8px}</style></head><body><div class="head"><div><div class="logo">${emp.nombre}</div><div>RUC ${emp.ruc} · ${emp.telefono||''} · ${emp.correo||''}</div></div><h1>${t}</h1></div><div class="box"><b>N°:</b> ${q.numero}<br><b>Cliente:</b> ${q.clienteNombre}<br><b>Establecimiento:</b> ${q.establecimientoNombre}<br><b>Área:</b> ${q.areaNombre}<br><b>Tipo:</b> ${q.tipo}<br><b>Configuración:</b> ${q.config}</div>${docTable(rows(q))}<p class="total">Total: ${money(q.total)}</p><div class="firmas"><div class="line">Responsable técnico</div><div class="line">Área usuaria / conformidad</div></div></body></html>`}
function doc(q,t){return t==='COTIZACIÓN'?quoteDoc(q):legacyDoc(q,t)}
function printQuote(id,t){let q=state.cotizaciones.find(x=>x.id===id);let w=open('','_blank');w.document.write(doc(q,t));w.document.close();setTimeout(()=>w.print(),250)}function csv(id){let q=state.cotizaciones.find(x=>x.id===id);download(q.numero+'.csv',['descripcion,cantidad,precio,subtotal',...rows(q).map(r=>`"${r.descripcion}",${r.cantidad||1},${r.precio||0},${(+r.cantidad||1)*(+r.precio||0)}`)].join('\n'),'text/csv')}function word(id){let q=state.cotizaciones.find(x=>x.id===id);download('COTIZACION-'+q.numero+'.doc',doc(q,'COTIZACIÓN'),'application/msword')}function download(n,c,t){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:t}));a.download=n;a.click()}

function execRowsBase(q){
  if(q.config===MODES.PROPIAS){
    return (q.equipos||[]).flatMap(e=>(e.acts||[]).map(a=>({id:`${e.id||uid()}_${a.id||uid()}`,equipo:e.nombre||'Equipo biomédico',descripcion:a.descripcion,cantidad:a.cantidad||1,precio:a.precio||0,equipoId:e.id||'',actividadId:a.id||''})));
  }
  if(q.config===MODES.REPUESTOS){
    return (q.repuestos||[]).map(r=>({id:r.id||uid(),equipo:'Repuesto / accesorio',descripcion:r.descripcion,cantidad:r.cantidad||1,precio:r.precio||0,actividadId:r.id||''}));
  }
  // MODO GENERAL CORREGIDO:
  // En cotización una lista de actividades puede aplicar a varios equipos.
  // En ejecución NO debe mostrarse agrupado; debe abrirse como matriz Equipo x Actividad
  // para que cada equipo tenga su propia evidencia, estado y comentario técnico.
  const equipos=(q.equipos&&q.equipos.length?q.equipos:[{id:'grupo',nombre:'Equipos incluidos',marca:'',modelo:'',serie:''}]);
  const acts=q.acts||[];
  return equipos.flatMap(e=>acts.map(a=>({
    id:`${e.id||'eq'}_${a.id||uid()}`,
    equipo:e.nombre||'Equipo biomédico',
    descripcion:a.descripcion,
    cantidad:a.cantidad||1,
    precio:a.precio||0,
    equipoId:e.id||'',
    actividadId:a.id||''
  })));
}
function allDone(q){let rs=q.execRows||[];return rs.length>0 && rs.every(r=>r.estado==='Terminado'||r.estado==='Conforme')}
function updateExecCell(qid,i,field,val){let q=state.cotizaciones.find(x=>x.id===qid);if(!q)return;q.execRows=q.execRows||execRowsBase(q);q.execRows[i]=q.execRows[i]||{};q.execRows[i][field]=val;if(allDone(q))q.estado='Ejecutada';else q.estado='En ejecución';persist()}
function tableExec(rs,q){let exec=q.execRows||[];return `<div class="tableWrap"><table><thead><tr><th>Equipo/Grupo</th><th>Actividad/Repuesto</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${rs.map((r,i)=>{let er=exec[i]||{};return `<tr><td>${r.equipo||''}</td><td>${r.descripcion||''}</td><td><select onchange="updateExecCell('${q.id}',${i},'estado',this.value)"><option ${er.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${er.estado==='En proceso'?'selected':''}>En proceso</option><option ${er.estado==='Terminado'?'selected':''}>Terminado</option><option ${er.estado==='Conforme'?'selected':''}>Conforme</option><option ${er.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Observación técnica" onchange="updateExecCell('${q.id}',${i},'observacion',this.value)">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecCell('${q.id}',${i},'evidencia','Foto registrada')"><small>${er.evidencia||''}</small></td></tr>`}).join('')}</tbody></table></div><div class="bar"><span class="pill">Estado: ${estadoCot(q)}</span>${allDone(q)?'<span class="badge green">Lista para acta e informe</span>':'<span class="badge orange">Ejecución en curso</span>'}</div>`}
function docs(t){let qs=state.cotizaciones.filter(q=>q.ordenNumero&&q.siaf);return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice">Se generan desde cotizaciones autorizadas con Orden y SIAF.</p>${qs.length?qs.map(q=>`<div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${estadoBadge(q)} · ${money(q.total)}<br><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'} · <b>SIAF:</b> ${q.siaf||'-'}<br><button class="btn green" onclick="printQuote('${q.id}','${t}')">Generar PDF</button></div>`).join(''):'<p class="notice">No hay cotizaciones autorizadas para generar documentos.</p>'}</section>`}function esc(s=''){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}

function empresaCard(e){return `<div class="card"><h3>${e.nombre}</h3><div class="grid"><input data-emp-field="nombre" data-id="${e.id}" value="${esc(e.nombre)}" placeholder="Razón social"><input data-emp-field="ruc" data-id="${e.id}" value="${esc(e.ruc)}" placeholder="RUC"><input data-emp-field="telefono" data-id="${e.id}" value="${esc(e.telefono)}" placeholder="Teléfono"><input data-emp-field="correo" data-id="${e.id}" value="${esc(e.correo)}" placeholder="Correo"><input data-emp-field="direccion" data-id="${e.id}" value="${esc(e.direccion)}" placeholder="Dirección"><input data-emp-field="gerente" data-id="${e.id}" value="${esc(e.gerente||'GERENTE GENERAL')}" placeholder="Gerente / representante"></div><div class="grid2"><label class="uploadBox"><b>Logo empresa</b><input type="file" accept="image/*" data-emp-file="logo" data-id="${e.id}">${e.logo?'<span>Logo cargado ✅</span>':'<span>Sin logo</span>'}</label><label class="uploadBox"><b>Firma gerente</b><input type="file" accept="image/*" data-emp-file="firma" data-id="${e.id}">${e.firma?'<span>Firma cargada ✅</span>':'<span>Sin firma</span>'}</label></div><h4>Condiciones comerciales para PDF</h4><div class="grid">
<label class="fieldHint"><b>Forma de pago</b><small>Se imprime en: FORMA DE PAGO</small><input data-emp-field="formaPago" data-id="${e.id}" value="${esc(e.formaPago||'')}" placeholder="Ej.: Crédito comercial"></label>
<label class="fieldHint"><b>Tiempo de ejecución</b><small>Se imprime en: TIEMPO DE EJECUCIÓN</small><input data-emp-field="tiempoEjecucion" data-id="${e.id}" value="${esc(e.tiempoEjecucion||'')}" placeholder="Ej.: Según programación"></label>
<label class="fieldHint"><b>Lugar del servicio</b><small>Se imprime en: LUGAR DEL SERVICIO</small><input data-emp-field="lugarServicio" data-id="${e.id}" value="${esc(e.lugarServicio||'')}" placeholder="Ej.: En establecimiento del cliente"></label>
<label class="fieldHint"><b>Validez de oferta</b><small>Se imprime en: VALIDEZ DE OFERTA</small><input data-emp-field="validez" data-id="${e.id}" value="${esc(e.validez||'')}" placeholder="Ej.: 15 días calendario"></label>
<label class="fieldHint"><b>Garantía</b><small>Se imprime en: GARANTÍA</small><input data-emp-field="garantia" data-id="${e.id}" value="${esc(e.garantia||'')}" placeholder="Ej.: Según alcance del servicio"></label>
</div><label class="fieldHint full"><b>Observaciones comerciales</b><small>Se imprime en: OBSERVACIONES</small><textarea data-emp-field="observacionesCot" data-id="${e.id}" rows="4" placeholder="Observaciones de cotización">${esc(e.observacionesCot||'')}</textarea></label></div>`}
function selectedExecId(){return localStorage.getItem('servitec_exec_qid')||state.cotizaciones[0]?.id||''}
function viewEjecucion(){let qid=selectedExecId();let q=state.cotizaciones.find(x=>x.id===qid)||state.cotizaciones[0];if(!state.cotizaciones.length)return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">No hay cotizaciones registradas.</p></section>`;return `<section class="wrap">${back()}<h2>Ejecución controlada</h2><p class="notice">Selecciona una cotización. Para pasar a campo debe tener Orden de Compra/Servicio y SIAF.</p><select id="execSel" onchange="localStorage.setItem('servitec_exec_qid',this.value);render()">${state.cotizaciones.map(x=>`<option value="${x.id}" ${x.id===q.id?'selected':''}>${x.numero} - ${x.clienteNombre} - ${estadoCot(x)}</option>`).join('')}</select>${execGate(q)}</section>`}
function execGate(q){if(!q.ordenNumero||!q.siaf){return `<div class="card"><h3>Autorizar ejecución</h3><p>La cotización <b>${q.numero}</b> está en fase <b>${estadoCot(q)}</b>. Para iniciar ejecución registra la orden y el SIAF.</p><div class="grid"><select id="execTipo"><option value="Orden de servicio">Orden de servicio</option><option value="Orden de compra">Orden de compra</option></select><input id="execOrden" placeholder="N° orden de compra/servicio"><input id="execSiaf" placeholder="N° SIAF"><input id="execFecha" type="date" value="${new Date().toISOString().slice(0,10)}"></div><br><button class="btn green" onclick="autorizarExec('${q.id}')">Autorizar e iniciar ejecución</button></div>`}let fresh=execRowsBase(q);if(q.config===MODES.GENERAL&&(!q.execRows||q.execRows.length!==fresh.length)){q.execRows=fresh.map(r=>({...r,estado:'Pendiente',observacion:'',evidencia:''}));persist()}let base=q.execRows&&q.execRows.length?q.execRows:fresh;return `<div class="card"><h3>Ejecución autorizada</h3><p><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero} · <b>SIAF:</b> ${q.siaf} · <b>Fecha:</b> ${q.fechaOrden||''}</p></div>${tableExec(base,q)}`}
function autorizarExec(id){let q=state.cotizaciones.find(x=>x.id===id);let orden=$('#execOrden').value.trim(), siaf=$('#execSiaf').value.trim();if(!orden||!siaf){alert('Registra N° de orden y N° SIAF para iniciar ejecución.');return}q.ordenTipo=$('#execTipo').value;q.ordenNumero=orden;q.siaf=siaf;q.fechaOrden=$('#execFecha').value;q.estado='En ejecución';q.execRows=execRowsBase(q).map((r,i)=>({...r,estado:'Pendiente',observacion:'',evidencia:''}));persist();render()}

loadCloud();render();


/* =========================
   SERVITEC PRO V13.16 - CIERRE OPERATIVO
   Capa de corrección: empresa activa, PDF ordenado, ejecución ampliada,
   acta e informe diferenciados. No elimina la lógica estable previa.
========================= */
function ensureActiveEmpresa(){ if(!state.activeEmpresaId && state.empresas && state.empresas[0]) state.activeEmpresaId=state.empresas[0].id; }
function activeEmpresa(){ ensureActiveEmpresa(); return state.empresas.find(e=>e.id===state.activeEmpresaId)||state.empresas[0]||{}; }
function render(){ensureActiveEmpresa();app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.18 ESTABLE</h1><b>Cotización dinámica + Nube + PDFs corporativos</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind();}
views.Dashboard=function(){let emp=activeEmpresa();return `<section class="wrap"><h2>Dashboard</h2><div class="grid"><div class="card"><b>Empresas</b><h2>${state.empresas.length}</h2></div><div class="card"><b>Clientes</b><h2>${state.clientes.length}</h2></div><div class="card"><b>Cotizaciones</b><h2>${state.cotizaciones.length}</h2></div><div class="card"><b>Inventario</b><h2>${state.inventario.length}</h2></div></div><p class="notice"><b>Empresa activa:</b> ${emp.nombre||'No definida'}<br>Versión con empresa activa, ejecución ampliada, acta de conformidad e informe técnico diferenciados.</p></section>`}
views.Empresas=function(){let act=activeEmpresa();return `<section class="wrap">${back()}<h2>Empresas</h2><p class="notice">Empresa activa actual: <b>${act.nombre||'Sin empresa'}</b>. La empresa activa alimenta cotizaciones, PDF, ejecución, actas e informes.</p><div class="grid"><input id="empNom" placeholder="Razón social"><input id="empRuc" placeholder="RUC"><input id="empTel" placeholder="Teléfono"><input id="empCor" placeholder="Correo"><input id="empDir" placeholder="Dirección"><input id="empGer" placeholder="Gerente / Representante"><input id="empCargo" placeholder="Cargo del gerente"></div><br><button class="btn green" data-act="saveEmpresa">+ Nueva empresa</button><hr>${state.empresas.map(e=>empresaCard(e)).join('')}</section>`}
function newDraft(){let c=state.clientes[0]||{}, e=c.establecimientos?.[0]||{}, a=e.areas?.[0]||{};return {id:uid(),numero:`COT-${new Date().getFullYear()}-${String(state.cotizaciones.length+1).padStart(4,'0')}`,empresaId:activeEmpresa()?.id||'',clienteId:c.id||'',estId:e.id||'',areaId:a.id||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,equipos:[],acts:[],repuestos:[],total:0,fecha:new Date().toISOString()}}
function empresaCard(e){let activa=state.activeEmpresaId===e.id;return `<div class="card ${activa?'activeCompany':''}"><div class="bar"><h3 style="margin:0">${e.nombre}</h3><span class="badge ${activa?'green':'gray'}">${activa?'EMPRESA ACTIVA':'Empresa registrada'}</span><button class="btn ${activa?'muted':'green'}" data-act="activateEmpresa" data-id="${e.id}">${activa?'Activa':'Activar empresa'}</button></div><div class="grid"><input data-emp-field="nombre" data-id="${e.id}" value="${esc(e.nombre)}" placeholder="Razón social"><input data-emp-field="ruc" data-id="${e.id}" value="${esc(e.ruc)}" placeholder="RUC"><input data-emp-field="telefono" data-id="${e.id}" value="${esc(e.telefono)}" placeholder="Teléfono"><input data-emp-field="correo" data-id="${e.id}" value="${esc(e.correo)}" placeholder="Correo"><input data-emp-field="direccion" data-id="${e.id}" value="${esc(e.direccion)}" placeholder="Dirección"><input data-emp-field="gerente" data-id="${e.id}" value="${esc(e.gerente||'GERENTE GENERAL')}" placeholder="Gerente / representante"><input data-emp-field="cargoGerente" data-id="${e.id}" value="${esc(e.cargoGerente||'GERENTE GENERAL')}" placeholder="Cargo del gerente"></div><div class="grid2"><label class="uploadBox"><b>Logo empresa</b><input type="file" accept="image/*" data-emp-file="logo" data-id="${e.id}">${e.logo?'<span>Logo cargado ✅</span>':'<span>Sin logo</span>'}</label><label class="uploadBox"><b>Firma gerente</b><input type="file" accept="image/*" data-emp-file="firma" data-id="${e.id}">${e.firma?'<span>Firma cargada ✅</span>':'<span>Sin firma</span>'}</label></div><h4>Condiciones comerciales para PDF</h4><div class="grid">
<label class="fieldHint"><b>Forma de pago</b><small>Se imprime en: FORMA DE PAGO</small><input data-emp-field="formaPago" data-id="${e.id}" value="${esc(e.formaPago||'')}" placeholder="Ej.: Crédito comercial"></label>
<label class="fieldHint"><b>Tiempo de ejecución</b><small>Se imprime en: TIEMPO DE EJECUCIÓN</small><input data-emp-field="tiempoEjecucion" data-id="${e.id}" value="${esc(e.tiempoEjecucion||'')}" placeholder="Ej.: Según programación"></label>
<label class="fieldHint"><b>Lugar del servicio</b><small>Se imprime en: LUGAR DEL SERVICIO</small><input data-emp-field="lugarServicio" data-id="${e.id}" value="${esc(e.lugarServicio||'')}" placeholder="Ej.: En establecimiento del cliente"></label>
<label class="fieldHint"><b>Validez de oferta</b><small>Se imprime en: VALIDEZ DE OFERTA</small><input data-emp-field="validez" data-id="${e.id}" value="${esc(e.validez||'')}" placeholder="Ej.: 15 días calendario"></label>
<label class="fieldHint"><b>Garantía</b><small>Se imprime en: GARANTÍA</small><input data-emp-field="garantia" data-id="${e.id}" value="${esc(e.garantia||'')}" placeholder="Ej.: Según alcance del servicio"></label>
</div><label class="fieldHint full"><b>Observaciones comerciales</b><small>Se imprime en: OBSERVACIONES</small><textarea data-emp-field="observacionesCot" data-id="${e.id}" rows="4" placeholder="Observaciones de cotización">${esc(e.observacionesCot||'')}</textarea></label></div>`}
function cotizacionBody(q){
  if(q.config===MODES.REPUESTOS){return `<h3>Repuestos / accesorios</h3>${docTable(q.repuestos||[])}`;}
  if(q.config===MODES.PROPIAS){return (q.equipos||[]).map((e,i)=>{const acts=e.acts||[];const st=groupSubtotal(acts);return `<div class="group"><h3>Equipo ${i+1}: ${safe(e.nombre)||'Equipo biomédico'}</h3><div class="small"><b>Marca:</b> ${safe(e.marca)||'-'} &nbsp; <b>Modelo:</b> ${safe(e.modelo)||'-'} &nbsp; <b>Serie:</b> ${safe(e.serie)||'-'}</div>${docTable(acts)}<p class="subtotal">Subtotal ${safe(e.nombre)||'equipo'}: ${money(st)}</p></div>`}).join('') || `<p>No se registraron equipos.</p>`;}
  return `<h3>Actividades generales</h3>${docTable(q.acts||[])}<h3>Equipos donde se ejecutará el servicio</h3><table><thead><tr><th>#</th><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th></tr></thead><tbody>${(q.equipos||[]).map((e,i)=>`<tr><td>${i+1}</td><td>${safe(e.nombre)||'Equipo biomédico'}</td><td>${safe(e.marca)||'-'}</td><td>${safe(e.modelo)||'-'}</td><td>${safe(e.serie)||'-'}</td></tr>`).join('')}</tbody></table>`;
}
function quoteDoc(q){
  let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};
  let cli=state.clientes.find(c=>c.id===q.clienteId)||{};
  let numero=q.numero||'COT-0000';
  let title='COTIZACION-'+numero;
  let subtotal=Number(q.total)||0;
  return `<html><head><title>${title}</title><style>
  @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#001b3f;font-size:12px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:5px solid #0f7f73;padding-bottom:14px;margin-bottom:16px}.pdfLogo{max-height:62px;max-width:190px;margin-bottom:6px}.brand{font-size:27px;font-weight:900;color:#0f7f73;letter-spacing:.5px}.empresa{font-size:12px;line-height:1.45}.docTitle{text-align:right}.docTitle h1{font-size:28px;margin:0;color:#001b3f}.docTitle .num{font-size:17px;font-weight:800;color:#b30000;margin-top:6px}.box{background:#f1f7ff;padding:12px 14px;border-radius:10px;margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:5px 24px}.intro{margin:14px 0;line-height:1.55}.group{margin-top:12px;page-break-inside:avoid}.group h3,h3{background:#e8f7f6;border-left:6px solid #0f7f73;padding:8px 10px;margin:12px 0 8px;color:#001b3f;text-transform:uppercase}.small{font-size:11px;margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0 10px}th{background:#0f7f73;color:#fff;font-weight:800}th,td{border:1px solid #cfe0f2;padding:7px;vertical-align:top}td:nth-child(1),td:nth-child(3){text-align:center}td:nth-child(4),td:nth-child(5){text-align:right}.subtotal{text-align:right;font-weight:800;margin:3px 0 12px}.summary{margin-left:auto;width:330px;border:1px solid #cfe0f2;border-radius:8px;overflow:hidden}.summary div{display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #cfe0f2}.summary div:last-child{border-bottom:0;background:#0f7f73;color:white;font-size:18px;font-weight:900}.cond{border:1px solid #cfe0f2;border-radius:8px;padding:10px;margin-top:14px;line-height:1.55}.cond h3{margin:0 0 7px;color:#0f7f73;background:transparent;border:0;padding:0}.obs{margin-top:8px}.firma{margin-top:28px;text-align:center;width:300px;margin-left:auto;margin-right:auto;page-break-inside:avoid}.pdfFirma{max-height:70px;max-width:220px;display:block;margin:0 auto 4px}.firma .line{border-top:1px solid #001b3f;padding-top:8px;font-weight:800}.footer{margin-top:18px;font-size:10px;color:#456;text-align:right}
  </style></head><body>
  <div class="head"><div>${emp.logo?`<img class="pdfLogo" src="${emp.logo}">`:''}<div class="brand">${emp.nombre||'SERVITEC PRO'}</div><div class="empresa">RUC ${emp.ruc||''} · ${emp.telefono||''} · ${emp.correo||''}<br>${emp.direccion||'Dirección comercial / oficina principal'}</div></div><div class="docTitle"><h1>COTIZACIÓN</h1><div class="num">N° ${numero}</div></div></div>
  <div class="box"><div><b>CLIENTE:</b> ${q.clienteNombre||''}</div><div><b>RUC:</b> ${cli.ruc||'-'}</div><div><b>ESTABLECIMIENTO:</b> ${q.establecimientoNombre||''}</div><div><b>ÁREA:</b> ${q.areaNombre||''}</div><div><b>FECHA:</b> ${new Date(q.fecha||Date.now()).toLocaleDateString('es-PE')}</div><div><b>TIPO:</b> ${q.tipo||''}</div></div>
  <p class="intro"><b>Estimados señores:</b><br>Por medio de la presente nos es grato saludarles y presentar nuestra propuesta económica para la ejecución del servicio solicitado.</p>
  ${cotizacionBody(q)}
  <div class="summary"><div><span>VALOR VENTA</span><b>${money(subtotal)}</b></div><div><span>I.G.V. / Impuestos</span><b>Según corresponda</b></div><div><span>TOTAL</span><b>${money(subtotal)}</b></div></div>
  <div class="cond"><h3>CONDICIONES COMERCIALES</h3><b>Moneda:</b> Soles (S/).<br><b>Forma de pago:</b> ${emp.formaPago||'Según coordinación / contado comercial'}.<br><b>Tiempo de ejecución:</b> ${emp.tiempoEjecucion||'Según programación y disponibilidad del área usuaria'}.<br><b>Lugar del servicio:</b> ${emp.lugarServicio||'En establecimiento del cliente'}.<br><b>Validez de oferta:</b> ${emp.validez||'15 días calendario'}.<br><b>Garantía:</b> ${emp.garantia||'Según alcance del servicio ejecutado'}.<div class="obs"><b>Observaciones:</b><br>${(emp.observacionesCot||'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.').split('\n').map(x=>safe(x)).join('<br>')}</div></div>
  <p>Sin otro particular, quedamos de ustedes.</p>
  <div class="firma">${emp.firma?`<img class="pdfFirma" src="${emp.firma}">`:''}<div class="line">${emp.gerente||'GERENTE GENERAL'}<br>${emp.cargoGerente||'GERENTE GENERAL'}<br>${emp.nombre||'SERVITEC PRO'}</div></div>
  <div class="footer">Pág. 1</div>
  </body></html>`
}
function updateExecEvidence(qid,i,file){let q=state.cotizaciones.find(x=>x.id===qid);if(!q||!file)return;let reader=new FileReader();reader.onload=()=>{q.execRows=q.execRows||execRowsBase(q);q.execRows[i]=q.execRows[i]||{};q.execRows[i].evidencia=reader.result;q.execRows[i].evidenciaNombre=file.name;persist();render()};reader.readAsDataURL(file)}
function updateExecMeta(qid,field,val){let q=state.cotizaciones.find(x=>x.id===qid);if(!q)return;q[field]=val;persist()}
function addExecExtra(qid){let q=state.cotizaciones.find(x=>x.id===qid);if(!q)return;q.execExtras=q.execExtras||[];q.execExtras.push({id:uid(),descripcion:'',estado:'Pendiente',observacion:''});persist();render()}
function updateExecExtra(qid,i,field,val){let q=state.cotizaciones.find(x=>x.id===qid);if(!q)return;q.execExtras=q.execExtras||[];q.execExtras[i]=q.execExtras[i]||{id:uid()};q.execExtras[i][field]=val;persist()}
function updateExecExtraEvidence(qid,i,file){let q=state.cotizaciones.find(x=>x.id===qid);if(!q||!file)return;let reader=new FileReader();reader.onload=()=>{q.execExtras=q.execExtras||[];q.execExtras[i]=q.execExtras[i]||{id:uid()};q.execExtras[i].evidencia=reader.result;q.execExtras[i].evidenciaNombre=file.name;persist();render()};reader.readAsDataURL(file)}
function tableExec(rs,q){let exec=q.execRows||[];let extra=q.execExtras||[];return `<h3>Actividades cotizadas</h3><div class="tableWrap"><table><thead><tr><th>Equipo/Grupo</th><th>Actividad/Repuesto</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${rs.map((r,i)=>{let er=exec[i]||{};return `<tr><td>${r.equipo||''}</td><td>${r.descripcion||''}</td><td><select onchange="updateExecCell('${q.id}',${i},'estado',this.value)"><option ${er.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${er.estado==='En proceso'?'selected':''}>En proceso</option><option ${er.estado==='Terminado'?'selected':''}>Terminado</option><option ${er.estado==='Conforme'?'selected':''}>Conforme</option><option ${er.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Observación técnica" onchange="updateExecCell('${q.id}',${i},'observacion',this.value)">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecEvidence('${q.id}',${i},this.files[0])"><small>${er.evidenciaNombre||''}</small></td></tr>`}).join('')}</tbody></table></div><h3>Actividades adicionales en campo</h3><p class="notice">Agrega trabajos encontrados durante la intervención para que el equipo quede operativo. No modifica el valor de la cotización original.</p><button class="btn green" onclick="addExecExtra('${q.id}')">+ Actividad adicional</button><div class="tableWrap"><table><thead><tr><th>Descripción adicional</th><th>Estado</th><th>Comentario</th><th>Evidencia</th></tr></thead><tbody>${extra.map((r,i)=>`<tr><td><textarea placeholder="Ej.: Ajuste de tarjeta, limpieza de ventilador, cambio de fusible" onchange="updateExecExtra('${q.id}',${i},'descripcion',this.value)">${r.descripcion||''}</textarea></td><td><select onchange="updateExecExtra('${q.id}',${i},'estado',this.value)"><option ${r.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${r.estado==='En proceso'?'selected':''}>En proceso</option><option ${r.estado==='Terminado'?'selected':''}>Terminado</option><option ${r.estado==='Conforme'?'selected':''}>Conforme</option><option ${r.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Comentario de la actividad adicional" onchange="updateExecExtra('${q.id}',${i},'observacion',this.value)">${r.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecExtraEvidence('${q.id}',${i},this.files[0])"><small>${r.evidenciaNombre||''}</small></td></tr>`).join('')}</tbody></table></div><h3>Comentarios, recomendaciones y conformidad</h3><div class="grid2"><textarea placeholder="Comentarios técnicos generales" onchange="updateExecMeta('${q.id}','comentarioTecnico',this.value)">${q.comentarioTecnico||''}</textarea><textarea placeholder="Recomendaciones técnicas" onchange="updateExecMeta('${q.id}','recomendaciones',this.value)">${q.recomendaciones||''}</textarea><input placeholder="Garantía del servicio" value="${esc(q.garantiaExec||'Según alcance del servicio ejecutado')}" onchange="updateExecMeta('${q.id}','garantiaExec',this.value)"><input placeholder="Responsable área usuaria" value="${esc(q.usuarioConformidad||'')}" onchange="updateExecMeta('${q.id}','usuarioConformidad',this.value)"><input placeholder="DNI responsable área usuaria" value="${esc(q.usuarioDni||'')}" onchange="updateExecMeta('${q.id}','usuarioDni',this.value)"><input placeholder="Cargo / área usuaria" value="${esc(q.usuarioCargo||'')}" onchange="updateExecMeta('${q.id}','usuarioCargo',this.value)"></div><textarea placeholder="Observaciones del área usuaria para el acta" onchange="updateExecMeta('${q.id}','usuarioObservaciones',this.value)">${q.usuarioObservaciones||''}</textarea><div class="bar"><span class="pill">Estado: ${estadoCot(q)}</span>${allDone(q)?'<span class="badge green">Lista para acta e informe</span>':'<span class="badge orange">Ejecución en curso</span>'}</div>`}
function execGate(q){if(!q.ordenNumero||!q.siaf){return `<div class="card"><h3>Autorizar ejecución</h3><p>La cotización <b>${q.numero}</b> está en fase <b>${estadoCot(q)}</b>. Para iniciar ejecución registra la orden y el SIAF.</p><div class="grid"><select id="execTipo"><option value="Orden de servicio">Orden de servicio</option><option value="Orden de compra">Orden de compra</option></select><input id="execOrden" placeholder="N° orden de compra/servicio"><input id="execSiaf" placeholder="N° SIAF"><input id="execFecha" type="date" value="${new Date().toISOString().slice(0,10)}"></div><br><button class="btn green" onclick="autorizarExec('${q.id}')">Autorizar e iniciar ejecución</button></div>`}let fresh=execRowsBase(q);if(q.config===MODES.GENERAL&&(!q.execRows||q.execRows.length!==fresh.length)){q.execRows=fresh.map(r=>({...r,estado:'Pendiente',observacion:'',evidencia:''}));persist()}let base=q.execRows&&q.execRows.length?q.execRows:fresh;return `<div class="card"><h3>Ejecución autorizada</h3><p><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero} · <b>SIAF:</b> ${q.siaf} · <b>Fecha:</b> ${q.fechaOrden||''}</p></div>${tableExec(base,q)}`}
function baseDocHead(emp,title){return `<html><head><title>${title}</title><style>@page{size:A4;margin:18mm}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:12px;margin:0}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #0f7f73;padding-bottom:10px;margin-bottom:14px}.logoImg{max-height:58px;max-width:170px}.brand{font-size:24px;font-weight:900;color:#0f7f73}.slogan{background:#6aa6b7;color:white;border-radius:18px;padding:8px 18px;font-weight:700}.title{text-align:center;font-size:20px;font-weight:900;text-decoration:underline;margin:24px 0 18px}.box{background:#f1f7ff;padding:10px;border-radius:8px;margin:10px 0;line-height:1.45}table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #555;padding:6px;vertical-align:top}th{background:#eef2f7}.firmaRow{display:flex;justify-content:space-between;margin-top:70px;gap:40px}.firma{width:45%;text-align:center}.line{border-top:1px solid #111;padding-top:8px}.sectionTitle{font-weight:900;margin-top:14px}.photoGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px}.photoGrid img{width:100%;max-height:260px;object-fit:contain;border:1px solid #ddd}.footer{font-size:10px;color:#555;margin-top:18px;text-align:right}</style></head><body><div class="head"><div>${emp.logo?`<img class="logoImg" src="${emp.logo}">`:''}<div class="brand">${emp.nombre||'SERVITEC PRO'}</div><div>RUC ${emp.ruc||''} · ${emp.telefono||''} · ${emp.correo||''}</div><div>${emp.direccion||''}</div></div><div class="slogan">Construimos relaciones de confianza y largo plazo.</div></div>`}
function equiposDocRows(q){return (q.equipos||[]).map((e,i)=>`<tr><td>${i+1}</td><td>${safe(e.nombre)||'Equipo biomédico'}</td><td>${safe(e.marca)||'-'}</td><td>${safe(e.modelo)||'-'}</td><td>${safe(e.serie)||'-'}</td></tr>`).join('') || `<tr><td>1</td><td>Equipos según cotización</td><td>-</td><td>-</td><td>-</td></tr>`}
function execActivityList(q){let base=(q.execRows||execRowsBase(q)).map(r=>r.descripcion).filter(Boolean);let extra=(q.execExtras||[]).map(r=>r.descripcion).filter(Boolean);return {base,extra}}
function evidenceImgs(q){let a=[];(q.execRows||[]).forEach(r=>{if(r.evidencia&&String(r.evidencia).startsWith('data:image'))a.push(r.evidencia)});(q.execExtras||[]).forEach(r=>{if(r.evidencia&&String(r.evidencia).startsWith('data:image'))a.push(r.evidencia)});return a}
function actaDoc(q){let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};return `${baseDocHead(emp,'ACTA-'+q.numero)}<div class="title">ACTA DE CONFORMIDAD DEL SERVICIO</div><p>Yo, <b>${q.usuarioConformidad||'................................................'}</b> con DNI N° <b>${q.usuarioDni||'................'}</b>, personal encargado de <b>${q.usuarioCargo||q.areaNombre||'área usuaria'}</b>, doy conformidad del servicio ejecutado a los siguientes equipos:</p><table><thead><tr><th>ITEM</th><th>EQUIPO</th><th>MARCA</th><th>MODELO</th><th>SERIE</th></tr></thead><tbody>${equiposDocRows(q)}</tbody></table><p>Con ${q.ordenTipo||'orden'} N° <b>${q.ordenNumero||'-'}</b> y N° Exp. SIAF <b>${q.siaf||'-'}</b>, correspondiente a <b>${q.clienteNombre||''}</b>.</p><p><b>FECHA:</b> ${new Date(q.fechaOrden||Date.now()).toLocaleDateString('es-PE')}</p><p><b>Observaciones del área usuaria:</b><br>${(q.usuarioObservaciones||'Sin observaciones.').split('\n').map(x=>safe(x)).join('<br>')}</p><div class="firmaRow"><div class="firma"><div class="line">Personal que da la conformidad<br>${q.usuarioConformidad||''}</div></div><div class="firma"><div class="line">Personal que ejecuta el mantenimiento<br>${emp.gerente||'Responsable técnico'}</div></div></div><div class="footer">Pág. 1</div></body></html>`}
function informeDoc(q){let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};let acts=execActivityList(q);let imgs=evidenceImgs(q);return `${baseDocHead(emp,'INFORME-'+q.numero)}<div class="title">INFORME DEL SERVICIO DE ${String(q.tipo||'MANTENIMIENTO').toUpperCase()} DE EQUIPOS BIOMÉDICOS</div><p><b>SEÑORES:</b> ${q.clienteNombre||''}<br><b>ATENCIÓN:</b> ${q.areaNombre||''}<br><b>ASUNTO:</b> Servicio de ${q.tipo||''} en ${q.establecimientoNombre||''}.<br><b>ANTECEDENTES:</b> ${q.ordenTipo||'Orden'} N° ${q.ordenNumero||'-'} · SIAF N° ${q.siaf||'-'}.</p><table><thead><tr><th>ITEM</th><th>EQUIPO</th><th>MARCA</th><th>MODELO</th><th>SERIE</th></tr></thead><tbody>${equiposDocRows(q)}</tbody></table><div class="sectionTitle">Se realizó:</div><ul>${acts.base.map(a=>`<li>${a}</li>`).join('')||'<li>Actividades según cotización autorizada.</li>'}</ul><div class="sectionTitle">Otras actividades realizadas:</div><ul>${acts.extra.map(a=>`<li>${a}</li>`).join('')||'<li>No se registraron actividades adicionales.</li>'}</ul><p><b>Comentarios técnicos:</b> ${q.comentarioTecnico||'Sin comentarios adicionales.'}</p><p><b>Recomendación:</b> ${q.recomendaciones||'Continuar con el uso adecuado del equipo y programar su mantenimiento preventivo.'}</p><p><b>Garantía:</b> ${q.garantiaExec||emp.garantia||'Según alcance del servicio ejecutado'}.</p><p><b>Fecha:</b> ${new Date(q.fechaOrden||Date.now()).toLocaleDateString('es-PE')}</p>${imgs.length?`<div class="sectionTitle">Panel Fotográfico:</div><div class="photoGrid">${imgs.map(src=>`<img src="${src}">`).join('')}</div>`:''}<div class="firmaRow"><div class="firma"><div class="line">Responsable técnico<br>${emp.gerente||''}</div></div><div class="firma"><div class="line">Área usuaria<br>${q.usuarioConformidad||''}</div></div></div><div class="footer">Pág. 1</div></body></html>`}
function legacyDoc(q,t){return t==='ACTA DE CONFORMIDAD'?actaDoc(q):informeDoc(q)}
function doc(q,t){return t==='COTIZACIÓN'?quoteDoc(q):legacyDoc(q,t)}
actions.activateEmpresa=function(el){state.activeEmpresaId=el.dataset.id;persist();render()}
actions.saveEmpresa=function(){let n=$('#empNom').value.trim();if(!n)return;let e={id:uid(),nombre:n,ruc:$('#empRuc').value,telefono:$('#empTel').value,correo:$('#empCor').value,direccion:$('#empDir').value,gerente:$('#empGer').value||'GERENTE GENERAL',cargoGerente:$('#empCargo')?.value||'GERENTE GENERAL',logo:'',firma:'',observacionesCot:'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.',formaPago:'Según coordinación / contado comercial',tiempoEjecucion:'Según programación y disponibilidad del área usuaria',lugarServicio:'En establecimiento del cliente',validez:'15 días calendario',garantia:'Según alcance del servicio ejecutado'};state.empresas.push(e);state.activeEmpresaId=e.id;persist();render()}

/* =========================
   SERVITEC PRO V13.17 - PARCHE PRODUCTIVO
   Persistencia estable + Supabase + IGV 18% + empresa activa + totales coherentes
========================= */
function storageKeys(){return ['servitec_pro_state_v1317','servitec_v139'];}
function migrateLocalState(){
  let merged=clone(seed);
  for(const k of storageKeys().reverse()){
    try{let raw=localStorage.getItem(k); if(raw){merged={...merged,...JSON.parse(raw)}}}catch(e){}
  }
  state={...merged};
  ensureActiveEmpresa();
  normalizeState();
}
function normalizeState(){
  state.empresas=Array.isArray(state.empresas)?state.empresas:[];
  state.clientes=Array.isArray(state.clientes)?state.clientes:[];
  state.cotizaciones=Array.isArray(state.cotizaciones)?state.cotizaciones:[];
  state.inventario=Array.isArray(state.inventario)?state.inventario:[];
  ensureActiveEmpresa();
  state.cotizaciones.forEach(q=>applyTax(q));
}
function persist(){
  normalizeState();
  for(const k of storageKeys()) localStorage.setItem(k,JSON.stringify(state));
  if(hasCloud){clearTimeout(timer);timer=setTimeout(saveCloud,450)}
}
async function loadCloud(){
  migrateLocalState();
  if(!hasCloud){cloud='Modo local: configura Supabase';render();return}
  cloud='Conectando Supabase...';render();
  try{
    let r=await fetch(`${env.SUPABASE_URL}/rest/v1/app_state?id=eq.global&select=payload,updated_at`,{headers:{apikey:env.SUPABASE_KEY,Authorization:`Bearer ${env.SUPABASE_KEY}`}});
    let d=await r.json();
    if(Array.isArray(d)&&d[0]&&d[0].payload){state={...clone(seed),...state,...d[0].payload};}
    normalizeState();
    for(const k of storageKeys()) localStorage.setItem(k,JSON.stringify(state));
    cloud='Nube Supabase activa';render();
  }catch(e){cloud='Modo local: Supabase no respondió';render()}
}
async function saveCloud(){
  if(!hasCloud)return;
  try{
    await fetch(`${env.SUPABASE_URL}/rest/v1/app_state?on_conflict=id`,{method:'POST',headers:{apikey:env.SUPABASE_KEY,Authorization:`Bearer ${env.SUPABASE_KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({id:'global',payload:state,updated_at:new Date().toISOString()})});
    cloud='Nube Supabase activa';let tag=document.querySelector('.tag');if(tag)tag.textContent=cloud;
  }catch(e){cloud='Modo local: error guardando nube';let tag=document.querySelector('.tag');if(tag)tag.textContent=cloud;}
}
function calcSubtotal(q=draft){
  if(!q)return 0;
  if(q.config===MODES.REPUESTOS)return (q.repuestos||[]).reduce((s,r)=>s+(+r.cantidad||0)*(+r.precio||0),0);
  if(q.config===MODES.PROPIAS)return (q.equipos||[]).reduce((s,e)=>s+(e.acts||[]).reduce((a,x)=>a+(+x.cantidad||0)*(+x.precio||0),0),0);
  return (q.acts||[]).reduce((s,a)=>s+(+a.cantidad||0)*(+a.precio||0),0);
}
function taxRate(q){return q&&q.igvIncluido===false?0:0.18;}
function applyTax(q){
  if(!q)return q;
  q.subtotal=Number(calcSubtotal(q).toFixed(2));
  q.igv=Number((q.subtotal*taxRate(q)).toFixed(2));
  q.total=Number((q.subtotal+q.igv).toFixed(2));
  return q;
}
function qtotal(q=draft){return applyTax(q).total;}
function totalsBar(q=draft){applyTax(q);return `<div class="totalsBox"><div><span>Subtotal</span><b>${money(q.subtotal)}</b></div><div><span>IGV 18%</span><b>${money(q.igv)}</b></div><div class="grand"><span>Total</span><b>${money(q.total)}</b></div></div>`;}
function updateTotalSoft(){
  if(!draft)return;
  applyTax(draft);
  const t=document.querySelector('.total'); if(t)t.textContent='Total con IGV: '+money(draft.total);
  const box=document.querySelector('.totalsBox'); if(box){const tmp=document.createElement('div');tmp.innerHTML=totalsBar(draft);box.replaceWith(tmp.firstChild);}
}
function newDraft(){let c=state.clientes[0]||{}, e=c.establecimientos?.[0]||{}, a=e.areas?.[0]||{};return applyTax({id:uid(),numero:`COT-${new Date().getFullYear()}-${String(state.cotizaciones.length+1).padStart(4,'0')}`,empresaId:state.activeEmpresaId||state.empresas[0]?.id||'',clienteId:c.id||'',estId:e.id||'',areaId:a.id||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,equipos:[],acts:[],repuestos:[],subtotal:0,igv:0,total:0,igvIncluido:true,fecha:new Date().toISOString(),estado:'Cotización'});}
function saveQuote(){let {c,e,a}=cdata();applyTax(draft);draft.empresaId=state.activeEmpresaId||draft.empresaId||state.empresas[0]?.id||'';draft.clienteNombre=c.nombre;draft.establecimientoNombre=e.nombre;draft.areaNombre=a.nombre;let i=state.cotizaciones.findIndex(q=>q.id===draft.id);i>=0?state.cotizaciones[i]=clone(draft):state.cotizaciones.push(clone(draft));draft=null;persist();alert('Cotización guardada correctamente. Subtotal, IGV y total quedaron registrados.');render()}
function quoteList(){normalizeState();return `<section class="wrap">${back()}<h2>Cotizaciones</h2><button class="btn green" onclick="draft=newDraft();render()">+ Nueva cotización</button>${table(['N°','Cliente','Configuración','Estado','Subtotal','IGV','Total','Acciones'],state.cotizaciones.map(q=>[q.numero,q.clienteNombre,q.config,estadoBadge(q),money(q.subtotal),money(q.igv),money(q.total),`<div class="actions"><button class="btn" onclick="draft=clone(state.cotizaciones.find(x=>x.id==='${q.id}'));render()">Editar</button><button class="btn green" onclick="printQuote('${q.id}','COTIZACIÓN')">PDF</button><button class="btn" onclick="tab='Ejecución';localStorage.setItem('servitec_exec_qid','${q.id}');render()">Ejecutar</button><button class="btn" onclick="csv('${q.id}')">Excel</button><button class="btn" onclick="word('${q.id}')">Word</button><button class="btn danger" onclick="delQuote('${q.id}')">Eliminar</button></div>`]))}</section>`}
function quoteForm(){let {c,ests,e,areas}=cdata();applyTax(draft);return `<section class="wrap">${back()}<h2>Nueva cotización</h2><p class="notice"><b>Empresa activa:</b> ${(activeEmpresa().nombre||'Sin empresa')}. El IGV se calcula automáticamente al 18%.</p><div class="grid"><select data-k="clienteId">${state.clientes.map(x=>`<option value="${x.id}" ${x.id===draft.clienteId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="estId">${ests.map(x=>`<option value="${x.id}" ${x.id===draft.estId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="areaId">${areas.map(x=>`<option value="${x.id}" ${x.id===draft.areaId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="tipo">${['Mantenimiento preventivo','Mantenimiento correctivo','Calibración','Servicio + repuestos','Venta'].map(x=>`<option ${x===draft.tipo?'selected':''}>${x}</option>`)}</select><select data-k="config">${Object.values(MODES).map(x=>`<option ${x===draft.config?'selected':''}>${x}</option>`)}</select></div><div class="bar"><span class="pill">${draft.config}</span><b class="total">Total con IGV: ${money(draft.total)}</b></div>${totalsBar(draft)}${modeView()}<div class="bar"><button class="btn green" onclick="saveQuote()">Guardar y volver a lista</button><button class="btn" onclick="applyTax(draft);render()">Actualizar totales</button></div></section>`}
function render(){ensureActiveEmpresa();normalizeState();app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.18 ESTABLE</h1><b>Cotización dinámica + Nube real + IGV 18% + PDFs corporativos</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind();}
views.Configuración=function(){return `<section class="wrap">${back()}<h2>Configuración de nube</h2><p class="notice"><b>Estado:</b> ${cloud}</p><p>En Vercel crea estas variables de entorno:</p><div class="card"><b>VITE_SUPABASE_URL</b><br><small>URL del proyecto Supabase.</small><hr><b>VITE_SUPABASE_KEY</b><br><small>anon public key de Supabase.</small></div><p>Luego ejecuta en Supabase el archivo <b>supabase-schema.sql</b>, redeploy en Vercel y listo: las cotizaciones quedarán guardadas en nube. Sin eso, trabaja en modo local.</p></section>`}
function quoteDoc(q){
  applyTax(q);
  let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};
  let cli=state.clientes.find(c=>c.id===q.clienteId)||{};
  let numero=q.numero||'COT-0000';
  let title='COTIZACION-'+numero;
  return `<html><head><title>${title}</title><style>@page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#001b3f;font-size:12px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:5px solid #0f7f73;padding-bottom:14px;margin-bottom:16px}.pdfLogo{max-height:62px;max-width:190px;margin-bottom:6px}.brand{font-size:27px;font-weight:900;color:#0f7f73;letter-spacing:.5px}.empresa{font-size:12px;line-height:1.45}.docTitle{text-align:right}.docTitle h1{font-size:28px;margin:0;color:#001b3f}.docTitle .num{font-size:17px;font-weight:800;color:#b30000;margin-top:6px}.box{background:#f1f7ff;padding:12px 14px;border-radius:10px;margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:5px 24px}.intro{margin:14px 0;line-height:1.55}.group{margin-top:12px;page-break-inside:avoid}.group h3{background:#e8f7f6;border-left:6px solid #0f7f73;padding:8px 10px;margin:12px 0 8px;color:#001b3f;text-transform:uppercase}.small{font-size:11px;margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0 10px}th{background:#0f7f73;color:#fff;font-weight:800}th,td{border:1px solid #cfe0f2;padding:7px;vertical-align:top}td:nth-child(1),td:nth-child(3){text-align:center}td:nth-child(4),td:nth-child(5){text-align:right}.subtotal{text-align:right;font-weight:800;margin:3px 0 12px}.summary{margin-left:auto;width:330px;border:1px solid #cfe0f2;border-radius:8px;overflow:hidden}.summary div{display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #cfe0f2}.summary div:last-child{border-bottom:0;background:#0f7f73;color:white;font-size:18px;font-weight:900}.cond{border:1px solid #cfe0f2;border-radius:8px;padding:10px;margin-top:14px;line-height:1.55}.cond h3{margin:0 0 7px;color:#0f7f73}.firma{margin-top:28px;text-align:center;width:300px;margin-left:auto;margin-right:auto;page-break-inside:avoid}.pdfFirma{max-height:70px;max-width:220px;display:block;margin:0 auto 4px}.firma .line{border-top:1px solid #001b3f;padding-top:8px;font-weight:800}.footer{margin-top:14px;font-size:10px;color:#456;display:flex;justify-content:space-between;page-break-inside:avoid}</style></head><body><div class="head"><div>${emp.logo?`<img class="pdfLogo" src="${emp.logo}">`:''}<div class="brand">${emp.nombre||'SERVITEC PRO'}</div><div class="empresa">RUC ${emp.ruc||''} · ${emp.telefono||''} · ${emp.correo||''}<br>${emp.direccion||'Dirección comercial / oficina principal'}</div></div><div class="docTitle"><h1>COTIZACIÓN</h1><div class="num">N° ${numero}</div></div></div><div class="box"><div><b>CLIENTE:</b> ${q.clienteNombre||''}</div><div><b>RUC:</b> ${cli.ruc||'-'}</div><div><b>ESTABLECIMIENTO:</b> ${q.establecimientoNombre||''}</div><div><b>ÁREA:</b> ${q.areaNombre||''}</div><div><b>FECHA:</b> ${new Date(q.fecha||Date.now()).toLocaleDateString('es-PE')}</div><div><b>TIPO:</b> ${q.tipo||''}</div></div><p class="intro"><b>Estimados señores:</b><br>Por medio de la presente nos es grato saludarles y presentar nuestra propuesta económica para la ejecución del servicio solicitado.</p>${cotizacionBody(q)}<div class="summary"><div><span>VALOR VENTA</span><b>${money(q.subtotal)}</b></div><div><span>I.G.V. 18%</span><b>${money(q.igv)}</b></div><div><span>TOTAL</span><b>${money(q.total)}</b></div></div><div class="cond"><h3>CONDICIONES COMERCIALES</h3><b>Moneda:</b> Soles (S/).<br><b>Forma de pago:</b> ${emp.formaPago||'Según coordinación / contado comercial'}.<br><b>Tiempo de ejecución:</b> ${emp.tiempoEjecucion||'Según programación y disponibilidad del área usuaria'}.<br><b>Lugar del servicio:</b> ${emp.lugarServicio||'En establecimiento del cliente'}.<br><b>Validez de oferta:</b> ${emp.validez||'15 días calendario'}.<br><b>Garantía:</b> ${emp.garantia||'Según alcance del servicio ejecutado'}.<div class="obs"><b>Observaciones:</b><br>${(emp.observacionesCot||'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.').split('\n').map(x=>safe(x)).join('<br>')}</div></div><p>Sin otro particular, quedamos de ustedes.</p><div class="firma">${emp.firma?`<img class="pdfFirma" src="${emp.firma}">`:''}<div class="line">${emp.gerente||'GERENTE GENERAL'}<br>${emp.cargoGerente||'GERENTE GENERAL'}<br>${emp.nombre||'SERVITEC PRO'}</div></div><div class="footer"><span>${emp.telefono||''} · ${emp.correo||''}</span><span>Pág. 1</span></div></body></html>`
}
function csv(id){let q=state.cotizaciones.find(x=>x.id===id);applyTax(q);download(q.numero+'.csv',['descripcion,cantidad,precio,subtotal','SUBTOTAL,,,'+q.subtotal,'IGV 18%,,,'+q.igv,'TOTAL,,,'+q.total,...rows(q).map(r=>`"${r.descripcion}",${r.cantidad||1},${r.precio||0},${(+r.cantidad||1)*(+r.precio||0)}`)].join('\n'),'text/csv')}

/* =========================
   SERVITEC PRO V13.17.3 - PARCHE ACTA CONFORMIDAD
   Agrega datos del encargado del área usuaria / establecimiento y firmas para acta.
   No altera cotización, informe ni lógica de ejecución existente.
========================= */
function updateExecSignature(qid,field,file){
  let q=state.cotizaciones.find(x=>x.id===qid);
  if(!q||!file)return;
  let reader=new FileReader();
  reader.onload=()=>{q[field]=reader.result;q[field+'Nombre']=file.name;persist();render()};
  reader.readAsDataURL(file);
}
function tableExec(rs,q){let exec=q.execRows||[];let extra=q.execExtras||[];return `<h3>Actividades cotizadas</h3><div class="tableWrap"><table><thead><tr><th>Equipo/Grupo</th><th>Actividad/Repuesto</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${rs.map((r,i)=>{let er=exec[i]||{};return `<tr><td>${r.equipo||''}</td><td>${r.descripcion||''}</td><td><select onchange="updateExecCell('${q.id}',${i},'estado',this.value)"><option ${er.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${er.estado==='En proceso'?'selected':''}>En proceso</option><option ${er.estado==='Terminado'?'selected':''}>Terminado</option><option ${er.estado==='Conforme'?'selected':''}>Conforme</option><option ${er.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Observación técnica" onchange="updateExecCell('${q.id}',${i},'observacion',this.value)">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecEvidence('${q.id}',${i},this.files[0])"><small>${er.evidenciaNombre||''}</small></td></tr>`}).join('')}</tbody></table></div><h3>Actividades adicionales en campo</h3><p class="notice">Agrega trabajos encontrados durante la intervención para que el equipo quede operativo. No modifica el valor de la cotización original.</p><button class="btn green" onclick="addExecExtra('${q.id}')">+ Actividad adicional</button><div class="tableWrap"><table><thead><tr><th>Descripción adicional</th><th>Estado</th><th>Comentario</th><th>Evidencia</th></tr></thead><tbody>${extra.map((r,i)=>`<tr><td><textarea placeholder="Ej.: Ajuste de tarjeta, limpieza de ventilador, cambio de fusible" onchange="updateExecExtra('${q.id}',${i},'descripcion',this.value)">${r.descripcion||''}</textarea></td><td><select onchange="updateExecExtra('${q.id}',${i},'estado',this.value)"><option ${r.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${r.estado==='En proceso'?'selected':''}>En proceso</option><option ${r.estado==='Terminado'?'selected':''}>Terminado</option><option ${r.estado==='Conforme'?'selected':''}>Conforme</option><option ${r.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Comentario de la actividad adicional" onchange="updateExecExtra('${q.id}',${i},'observacion',this.value)">${r.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecExtraEvidence('${q.id}',${i},this.files[0])"><small>${r.evidenciaNombre||''}</small></td></tr>`).join('')}</tbody></table></div><h3>Comentarios, recomendaciones y conformidad</h3><div class="grid2"><textarea placeholder="Comentarios técnicos generales" onchange="updateExecMeta('${q.id}','comentarioTecnico',this.value)">${q.comentarioTecnico||''}</textarea><textarea placeholder="Recomendaciones técnicas" onchange="updateExecMeta('${q.id}','recomendaciones',this.value)">${q.recomendaciones||''}</textarea><input placeholder="Garantía del servicio" value="${esc(q.garantiaExec||'Según alcance del servicio ejecutado')}" onchange="updateExecMeta('${q.id}','garantiaExec',this.value)"><input placeholder="Encargado / responsable del área usuaria" value="${esc(q.usuarioConformidad||'')}" onchange="updateExecMeta('${q.id}','usuarioConformidad',this.value)"><input placeholder="DNI del encargado" value="${esc(q.usuarioDni||'')}" onchange="updateExecMeta('${q.id}','usuarioDni',this.value)"><input placeholder="Cargo del encargado" value="${esc(q.usuarioCargo||'')}" onchange="updateExecMeta('${q.id}','usuarioCargo',this.value)"><input placeholder="Teléfono / contacto del encargado" value="${esc(q.usuarioTelefono||'')}" onchange="updateExecMeta('${q.id}','usuarioTelefono',this.value)"><input placeholder="Correo del encargado" value="${esc(q.usuarioCorreo||'')}" onchange="updateExecMeta('${q.id}','usuarioCorreo',this.value)"><input placeholder="Nombre del técnico responsable" value="${esc(q.tecnicoNombre||'')}" onchange="updateExecMeta('${q.id}','tecnicoNombre',this.value)"><input placeholder="DNI del técnico" value="${esc(q.tecnicoDni||'')}" onchange="updateExecMeta('${q.id}','tecnicoDni',this.value)"><input placeholder="Cargo del técnico" value="${esc(q.tecnicoCargo||'Técnico responsable')}" onchange="updateExecMeta('${q.id}','tecnicoCargo',this.value)"><input placeholder="Colegiatura / código técnico, si aplica" value="${esc(q.tecnicoCodigo||'')}" onchange="updateExecMeta('${q.id}','tecnicoCodigo',this.value)"></div><textarea placeholder="Observaciones del área usuaria para el acta" onchange="updateExecMeta('${q.id}','usuarioObservaciones',this.value)">${q.usuarioObservaciones||''}</textarea><div class="grid2"><label class="uploadBox"><b>Firma área usuaria</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaAreaUsuaria',this.files[0])"><span>${q.firmaAreaUsuariaNombre||q.firmaAreaUsuaria?'Firma cargada ✅':'Sin firma'}</span></label><label class="uploadBox"><b>Firma técnico responsable</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaTecnico',this.files[0])"><span>${q.firmaTecnicoNombre||q.firmaTecnico?'Firma cargada ✅':'Sin firma'}</span></label></div><div class="bar"><span class="pill">Estado: ${estadoCot(q)}</span>${allDone(q)?'<span class="badge green">Lista para acta e informe</span>':'<span class="badge orange">Ejecución en curso</span>'}</div>`}
function actaDoc(q){let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};let tecnico=q.tecnicoNombre||emp.gerente||'Responsable técnico';let tecnicoCargo=q.tecnicoCargo||emp.cargoGerente||'Técnico responsable';return `${baseDocHead(emp,'ACTA-'+q.numero)}<style>.firmaImg{max-height:72px;max-width:220px;display:block;margin:0 auto 6px}.datosBox{background:#f8fafc;border:1px solid #d7e4f5;border-radius:8px;padding:10px;margin:10px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}.firmaRow{display:flex;justify-content:space-between;margin-top:60px;gap:40px}.firma{width:45%;text-align:center}.line{border-top:1px solid #111;padding-top:8px}</style><div class="title">ACTA DE CONFORMIDAD DEL SERVICIO</div><div class="datosBox"><div><b>Cliente:</b> ${q.clienteNombre||''}</div><div><b>Establecimiento:</b> ${q.establecimientoNombre||''}</div><div><b>Área usuaria:</b> ${q.areaNombre||''}</div><div><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'}</div><div><b>SIAF:</b> ${q.siaf||'-'}</div><div><b>Fecha:</b> ${new Date(q.fechaOrden||Date.now()).toLocaleDateString('es-PE')}</div></div><p>Yo, <b>${q.usuarioConformidad||'................................................'}</b>, identificado(a) con DNI N° <b>${q.usuarioDni||'................'}</b>, en calidad de <b>${q.usuarioCargo||'encargado del área usuaria'}</b> del establecimiento <b>${q.establecimientoNombre||''}</b>, área <b>${q.areaNombre||''}</b>, dejo constancia de haber recibido a conformidad el servicio ejecutado.</p><div class="datosBox"><div><b>Teléfono encargado:</b> ${q.usuarioTelefono||'-'}</div><div><b>Correo encargado:</b> ${q.usuarioCorreo||'-'}</div><div><b>Técnico responsable:</b> ${tecnico}</div><div><b>DNI técnico:</b> ${q.tecnicoDni||'-'}</div><div><b>Cargo técnico:</b> ${tecnicoCargo}</div><div><b>Código / colegiatura:</b> ${q.tecnicoCodigo||'-'}</div></div><table><thead><tr><th>ITEM</th><th>EQUIPO</th><th>MARCA</th><th>MODELO</th><th>SERIE</th></tr></thead><tbody>${equiposDocRows(q)}</tbody></table><p>El servicio corresponde a la cotización <b>${q.numero||''}</b>, ${q.ordenTipo||'orden'} N° <b>${q.ordenNumero||'-'}</b> y N° Exp. SIAF <b>${q.siaf||'-'}</b>.</p><p><b>Observaciones del área usuaria:</b><br>${(q.usuarioObservaciones||'Sin observaciones.').split('\n').map(x=>safe(x)).join('<br>')}</p><div class="firmaRow"><div class="firma">${q.firmaAreaUsuaria?`<img class="firmaImg" src="${q.firmaAreaUsuaria}">`:''}<div class="line">Área usuaria / conformidad<br><b>${q.usuarioConformidad||''}</b><br>DNI: ${q.usuarioDni||'-'}</div></div><div class="firma">${q.firmaTecnico?`<img class="firmaImg" src="${q.firmaTecnico}">`:''}<div class="line">Técnico responsable<br><b>${tecnico}</b><br>DNI: ${q.tecnicoDni||'-'}</div></div></div><div class="footer">Pág. 1</div></body></html>`}
function legacyDoc(q,t){return t==='ACTA DE CONFORMIDAD'?actaDoc(q):informeDoc(q)}
function doc(q,t){return t==='COTIZACIÓN'?quoteDoc(q):legacyDoc(q,t)}

/* =========================
   SERVITEC PRO V13.17.4 - ACTA EDITABLE DESDE ACTAS
   Mantiene ejecución, matriz equipos y nube. Agrega formulario de conformidad visible en pestaña Actas.
========================= */
function actaDatosForm(q){
  return `<div class="card"><h3>Datos para acta de conformidad</h3><p class="notice">Completa estos datos antes de generar el PDF. Se guardan con la ejecución.</p>
  <div class="grid2">
    <input placeholder="Encargado / responsable del área usuaria" value="${esc(q.usuarioConformidad||'')}" onchange="updateExecMeta('${q.id}','usuarioConformidad',this.value)">
    <input placeholder="DNI del encargado" value="${esc(q.usuarioDni||'')}" onchange="updateExecMeta('${q.id}','usuarioDni',this.value)">
    <input placeholder="Cargo del encargado" value="${esc(q.usuarioCargo||'')}" onchange="updateExecMeta('${q.id}','usuarioCargo',this.value)">
    <input placeholder="Teléfono del encargado" value="${esc(q.usuarioTelefono||'')}" onchange="updateExecMeta('${q.id}','usuarioTelefono',this.value)">
    <input placeholder="Correo del encargado" value="${esc(q.usuarioCorreo||'')}" onchange="updateExecMeta('${q.id}','usuarioCorreo',this.value)">
    <input placeholder="Nombre del técnico responsable" value="${esc(q.tecnicoNombre||'')}" onchange="updateExecMeta('${q.id}','tecnicoNombre',this.value)">
    <input placeholder="DNI del técnico" value="${esc(q.tecnicoDni||'')}" onchange="updateExecMeta('${q.id}','tecnicoDni',this.value)">
    <input placeholder="Cargo del técnico" value="${esc(q.tecnicoCargo||'Técnico responsable')}" onchange="updateExecMeta('${q.id}','tecnicoCargo',this.value)">
    <input placeholder="Colegiatura / código técnico, si aplica" value="${esc(q.tecnicoCodigo||'')}" onchange="updateExecMeta('${q.id}','tecnicoCodigo',this.value)">
  </div>
  <textarea placeholder="Observaciones del área usuaria para el acta" onchange="updateExecMeta('${q.id}','usuarioObservaciones',this.value)">${esc(q.usuarioObservaciones||'')}</textarea>
  <div class="grid2">
    <label class="uploadBox"><b>Firma área usuaria</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaAreaUsuaria',this.files[0])"><span>${q.firmaAreaUsuariaNombre||q.firmaAreaUsuaria?'Firma cargada ✅':'Sin firma'}</span></label>
    <label class="uploadBox"><b>Firma técnico responsable</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaTecnico',this.files[0])"><span>${q.firmaTecnicoNombre||q.firmaTecnico?'Firma cargada ✅':'Sin firma'}</span></label>
  </div>
  <div class="bar"><button class="btn green" onclick="printQuote('${q.id}','ACTA DE CONFORMIDAD')">Generar PDF de acta</button><button class="btn" onclick="tab='Ejecución';localStorage.setItem('servitec_exec_qid','${q.id}');render()">Ir a ejecución</button></div>
  </div>`;
}
function docs(t){
  let qs=state.cotizaciones.filter(q=>q.ordenNumero&&q.siaf);
  if(t==='ACTA DE CONFORMIDAD'){
    return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice">Completa los datos del encargado, técnico y firmas; luego genera el acta.</p>${qs.length?qs.map(q=>`<div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${estadoBadge(q)} · ${money(q.total)}<br><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'} · <b>SIAF:</b> ${q.siaf||'-'}<br><b>Establecimiento:</b> ${q.establecimientoNombre||'-'} · <b>Área:</b> ${q.areaNombre||'-'}</div>${actaDatosForm(q)}`).join(''):'<p class="notice">No hay cotizaciones autorizadas para generar acta.</p>'}</section>`;
  }
  return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice">Se generan desde cotizaciones autorizadas con Orden y SIAF.</p>${qs.length?qs.map(q=>`<div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${estadoBadge(q)} · ${money(q.total)}<br><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'} · <b>SIAF:</b> ${q.siaf||'-'}<br><button class="btn green" onclick="printQuote('${q.id}','${t}')">Generar PDF</button></div>`).join(''):'<p class="notice">No hay cotizaciones autorizadas para generar documentos.</p>'}</section>`;
}
views.Actas=function(){return docs('ACTA DE CONFORMIDAD')};
views.Informes=function(){return docs('INFORME TÉCNICO')};
function render(){ensureActiveEmpresa();normalizeState();app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.18 ESTABLE</h1><b>Cotización dinámica + Nube real + IGV 18% + PDFs corporativos</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind();}

/* =========================
   SERVITEC PRO V13.17.5 - TRAZABILIDAD DE EQUIPOS
   Parche puntual sobre base estable: identifica cada equipo en cotización/ejecución
   con marca, modelo, serie, código patrimonial y ubicación. Mantiene nube, acta e informe.
========================= */
function equipoEtiqueta(e={}){
  const p=[];
  if(e.nombre)p.push(`<b>${safe(e.nombre)}</b>`);
  const mm=[e.marca,e.modelo].filter(Boolean).join(' '); if(mm)p.push(mm);
  if(e.serie)p.push(`Serie: ${safe(e.serie)}`);
  if(e.codigoPatrimonial||e.codigo)p.push(`Patrimonial: ${safe(e.codigoPatrimonial||e.codigo)}`);
  if(e.ubicacion)p.push(`Ubicación: ${safe(e.ubicacion)}`);
  return p.join('<br>') || 'Equipo biomédico';
}
function eq(){return{id:uid(),nombre:'',marca:'',modelo:'',serie:'',codigoPatrimonial:'',ubicacion:'',acts:[]}}
function eqFields(e){return `<div class="grid"><input placeholder="Equipo biomédico" data-eq="${e.id}" data-p="nombre" value="${esc(e.nombre)}"><input placeholder="Marca" data-eq="${e.id}" data-p="marca" value="${esc(e.marca)}"><input placeholder="Modelo" data-eq="${e.id}" data-p="modelo" value="${esc(e.modelo)}"><input placeholder="Serie" data-eq="${e.id}" data-p="serie" value="${esc(e.serie)}"><input placeholder="Código patrimonial" data-eq="${e.id}" data-p="codigoPatrimonial" value="${esc(e.codigoPatrimonial||e.codigo||'')}"><input placeholder="Ubicación / ambiente" data-eq="${e.id}" data-p="ubicacion" value="${esc(e.ubicacion||'')}"></div>`}
function equiposTable(list){return `<div class="tableWrap"><table><thead><tr><th>Equipo</th><th>Marca</th><th>Modelo</th><th>Serie</th><th>Patrimonial</th><th>Ubicación</th></tr></thead><tbody>${list.map(eq=>`<tr><td><input placeholder="Equipo biomédico" data-eq="${eq.id}" data-p="nombre" value="${esc(eq.nombre)}"></td><td><input placeholder="Marca" data-eq="${eq.id}" data-p="marca" value="${esc(eq.marca)}"></td><td><input placeholder="Modelo" data-eq="${eq.id}" data-p="modelo" value="${esc(eq.modelo)}"></td><td><input placeholder="Serie" data-eq="${eq.id}" data-p="serie" value="${esc(eq.serie)}"></td><td><input placeholder="Código patrimonial" data-eq="${eq.id}" data-p="codigoPatrimonial" value="${esc(eq.codigoPatrimonial||eq.codigo||'')}"></td><td><input placeholder="Ubicación / ambiente" data-eq="${eq.id}" data-p="ubicacion" value="${esc(eq.ubicacion||'')}"></td></tr>`).join('')}</tbody></table></div>`}
function execRowsBase(q){
  if(q.config===MODES.PROPIAS){
    return (q.equipos||[]).flatMap(e=>(e.acts||[]).map(a=>({id:`${e.id||uid()}_${a.id||uid()}`,equipo:e.nombre||'Equipo biomédico',marca:e.marca||'',modelo:e.modelo||'',serie:e.serie||'',codigoPatrimonial:e.codigoPatrimonial||e.codigo||'',ubicacion:e.ubicacion||'',descripcion:a.descripcion,cantidad:a.cantidad||1,precio:a.precio||0,equipoId:e.id||'',actividadId:a.id||''})));
  }
  if(q.config===MODES.REPUESTOS){
    return (q.repuestos||[]).map(r=>({id:r.id||uid(),equipo:'Repuesto / accesorio',descripcion:r.descripcion,cantidad:r.cantidad||1,precio:r.precio||0,actividadId:r.id||''}));
  }
  const equipos=(q.equipos&&q.equipos.length?q.equipos:[{id:'grupo',nombre:'Equipos incluidos',marca:'',modelo:'',serie:'',codigoPatrimonial:'',ubicacion:''}]);
  const acts=q.acts||[];
  return equipos.flatMap(e=>acts.map(a=>({
    id:`${e.id||'eq'}_${a.id||uid()}`,
    equipo:e.nombre||'Equipo biomédico',marca:e.marca||'',modelo:e.modelo||'',serie:e.serie||'',codigoPatrimonial:e.codigoPatrimonial||e.codigo||'',ubicacion:e.ubicacion||'',
    descripcion:a.descripcion,cantidad:a.cantidad||1,precio:a.precio||0,equipoId:e.id||'',actividadId:a.id||''
  })));
}
function tableExec(rs,q){let exec=q.execRows||[];let extra=q.execExtras||[];return `<h3>Actividades cotizadas</h3><p class="notice">Cada fila corresponde a un equipo individualizado y una actividad. Usa serie/patrimonial para diferenciar equipos repetidos.</p><div class="tableWrap"><table><thead><tr><th>Equipo identificado</th><th>Actividad/Repuesto</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${rs.map((r,i)=>{let er=exec[i]||{};return `<tr><td>${equipoEtiqueta(r)}</td><td>${r.descripcion||''}</td><td><select onchange="updateExecCell('${q.id}',${i},'estado',this.value)"><option ${er.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${er.estado==='En proceso'?'selected':''}>En proceso</option><option ${er.estado==='Terminado'?'selected':''}>Terminado</option><option ${er.estado==='Conforme'?'selected':''}>Conforme</option><option ${er.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Observación técnica" onchange="updateExecCell('${q.id}',${i},'observacion',this.value)">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecEvidence('${q.id}',${i},this.files[0])"><small>${er.evidenciaNombre||''}</small></td></tr>`}).join('')}</tbody></table></div><h3>Actividades adicionales en campo</h3><p class="notice">Agrega trabajos encontrados durante la intervención para que el equipo quede operativo. No modifica el valor de la cotización original.</p><button class="btn green" onclick="addExecExtra('${q.id}')">+ Actividad adicional</button><div class="tableWrap"><table><thead><tr><th>Descripción adicional</th><th>Estado</th><th>Comentario</th><th>Evidencia</th></tr></thead><tbody>${extra.map((r,i)=>`<tr><td><textarea placeholder="Ej.: Ajuste de tarjeta, limpieza de ventilador, cambio de fusible" onchange="updateExecExtra('${q.id}',${i},'descripcion',this.value)">${r.descripcion||''}</textarea></td><td><select onchange="updateExecExtra('${q.id}',${i},'estado',this.value)"><option ${r.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${r.estado==='En proceso'?'selected':''}>En proceso</option><option ${r.estado==='Terminado'?'selected':''}>Terminado</option><option ${r.estado==='Conforme'?'selected':''}>Conforme</option><option ${r.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Comentario de la actividad adicional" onchange="updateExecExtra('${q.id}',${i},'observacion',this.value)">${r.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecExtraEvidence('${q.id}',${i},this.files[0])"><small>${r.evidenciaNombre||''}</small></td></tr>`).join('')}</tbody></table></div><h3>Comentarios, recomendaciones y conformidad</h3><div class="grid2"><textarea placeholder="Comentarios técnicos generales" onchange="updateExecMeta('${q.id}','comentarioTecnico',this.value)">${q.comentarioTecnico||''}</textarea><textarea placeholder="Recomendaciones técnicas" onchange="updateExecMeta('${q.id}','recomendaciones',this.value)">${q.recomendaciones||''}</textarea><input placeholder="Garantía del servicio" value="${esc(q.garantiaExec||'Según alcance del servicio ejecutado')}" onchange="updateExecMeta('${q.id}','garantiaExec',this.value)"><input placeholder="Encargado / responsable del área usuaria" value="${esc(q.usuarioConformidad||'')}" onchange="updateExecMeta('${q.id}','usuarioConformidad',this.value)"><input placeholder="DNI del encargado" value="${esc(q.usuarioDni||'')}" onchange="updateExecMeta('${q.id}','usuarioDni',this.value)"><input placeholder="Cargo del encargado" value="${esc(q.usuarioCargo||'')}" onchange="updateExecMeta('${q.id}','usuarioCargo',this.value)"><input placeholder="Teléfono / contacto del encargado" value="${esc(q.usuarioTelefono||'')}" onchange="updateExecMeta('${q.id}','usuarioTelefono',this.value)"><input placeholder="Correo del encargado" value="${esc(q.usuarioCorreo||'')}" onchange="updateExecMeta('${q.id}','usuarioCorreo',this.value)"><input placeholder="Nombre del técnico responsable" value="${esc(q.tecnicoNombre||'')}" onchange="updateExecMeta('${q.id}','tecnicoNombre',this.value)"><input placeholder="DNI del técnico" value="${esc(q.tecnicoDni||'')}" onchange="updateExecMeta('${q.id}','tecnicoDni',this.value)"><input placeholder="Cargo del técnico" value="${esc(q.tecnicoCargo||'Técnico responsable')}" onchange="updateExecMeta('${q.id}','tecnicoCargo',this.value)"><input placeholder="Colegiatura / código técnico, si aplica" value="${esc(q.tecnicoCodigo||'')}" onchange="updateExecMeta('${q.id}','tecnicoCodigo',this.value)"></div><textarea placeholder="Observaciones del área usuaria para el acta" onchange="updateExecMeta('${q.id}','usuarioObservaciones',this.value)">${q.usuarioObservaciones||''}</textarea><div class="grid2"><label class="uploadBox"><b>Firma área usuaria</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaAreaUsuaria',this.files[0])"><span>${q.firmaAreaUsuariaNombre||q.firmaAreaUsuaria?'Firma cargada ✅':'Sin firma'}</span></label><label class="uploadBox"><b>Firma técnico responsable</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaTecnico',this.files[0])"><span>${q.firmaTecnicoNombre||q.firmaTecnico?'Firma cargada ✅':'Sin firma'}</span></label></div><div class="bar"><span class="pill">Estado: ${estadoCot(q)}</span>${allDone(q)?'<span class="badge green">Lista para acta e informe</span>':'<span class="badge orange">Ejecución en curso</span>'}</div>`}
function equiposDocRows(q){return (q.equipos||[]).map((e,i)=>`<tr><td>${i+1}</td><td>${safe(e.nombre)||'Equipo biomédico'}</td><td>${safe(e.marca)||'-'}</td><td>${safe(e.modelo)||'-'}</td><td>${safe(e.serie)||'-'}</td><td>${safe(e.codigoPatrimonial||e.codigo)||'-'}</td><td>${safe(e.ubicacion)||'-'}</td></tr>`).join('') || `<tr><td>1</td><td>Equipos según cotización</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`}
function render(){ensureActiveEmpresa();normalizeState();app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.18 ESTABLE</h1><b>Cotización dinámica + Nube real + IGV 18% + ejecución por serie/patrimonial + documentos diferenciados</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind();}

/* =========================
   SERVITEC PRO V13.18.1 - ACTAS/INFORMES INTEGRADOS
   Corrección puntual:
   - Actas e informes con selector superior + detalle único.
   - Acta lee datos reales de ejecución: responsable, DNI, cargo, teléfono, correo, técnico y firmas.
   - Tabla de equipos con Patrimonial y Ubicación visibles.
   - Informe técnico independiente con observaciones, evidencias, recomendaciones y firmas.
========================= */
function docKey(t){return t==='ACTA DE CONFORMIDAD'?'servitec_acta_qid':'servitec_informe_qid'}
function docSelected(t,qs){let k=docKey(t);let id=localStorage.getItem(k);let q=qs.find(x=>x.id===id)||qs[0]||null;if(q)localStorage.setItem(k,q.id);return q}
function docSelector(t,qs,q){return `<div class="card"><label><b>Seleccione cotización / ejecución:</b></label><select onchange="localStorage.setItem('${docKey(t)}',this.value);render()">${qs.map(x=>`<option value="${x.id}" ${q&&x.id===q.id?'selected':''}>${x.numero} - ${x.clienteNombre||''} - ${estadoCot(x)} - ${x.ordenTipo||'Orden'} ${x.ordenNumero||''} / SIAF ${x.siaf||''}</option>`).join('')}</select></div>`}
function docs(t){
  let qs=state.cotizaciones.filter(q=>q.ordenNumero&&q.siaf);
  let q=docSelected(t,qs);
  if(!qs.length)return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice">No hay cotizaciones autorizadas con Orden y SIAF para generar documentos.</p></section>`;
  if(t==='ACTA DE CONFORMIDAD'){
    return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice">Selecciona una ejecución. Solo se muestra el acta seleccionada para evitar una lista interminable.</p>${docSelector(t,qs,q)}${q?`<div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${estadoBadge(q)} · ${money(q.total)}<br><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'} · <b>SIAF:</b> ${q.siaf||'-'}<br><b>Establecimiento:</b> ${q.establecimientoNombre||'-'} · <b>Área:</b> ${q.areaNombre||'-'}</div>${actaDatosForm(q)}`:''}</section>`;
  }
  return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice">Selecciona una ejecución. El informe es independiente del acta y jala observaciones, evidencias y recomendaciones de ejecución.</p>${docSelector(t,qs,q)}${q?`<div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${estadoBadge(q)} · ${money(q.total)}<br><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'} · <b>SIAF:</b> ${q.siaf||'-'}<br><b>Establecimiento:</b> ${q.establecimientoNombre||'-'} · <b>Área:</b> ${q.areaNombre||'-'}<br><br><button class="btn green" onclick="printQuote('${q.id}','${t}')">Generar PDF de informe técnico</button><button class="btn" onclick="tab='Ejecución';localStorage.setItem('servitec_exec_qid','${q.id}');render()">Ir a ejecución</button></div>`:''}</section>`;
}
views.Actas=function(){return docs('ACTA DE CONFORMIDAD')};
views.Informes=function(){return docs('INFORME TÉCNICO')};
function equiposDocRows(q){
  const equipos=(q.equipos&&q.equipos.length?q.equipos:[]);
  if(equipos.length){
    return equipos.map((e,i)=>`<tr><td>${i+1}</td><td>${safe(e.nombre)||'Equipo biomédico'}</td><td>${safe(e.marca)||'-'}</td><td>${safe(e.modelo)||'-'}</td><td>${safe(e.serie)||'-'}</td><td>${safe(e.codigoPatrimonial||e.codigo)||'-'}</td><td>${safe(e.ubicacion)||'-'}</td></tr>`).join('');
  }
  return `<tr><td>1</td><td>Equipos según cotización</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
}
function actaDoc(q){
  let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};
  let tecnico=q.tecnicoNombre||emp.gerente||'Responsable técnico';
  let tecnicoCargo=q.tecnicoCargo||emp.cargoGerente||'Técnico responsable';
  return `${baseDocHead(emp,'ACTA-'+q.numero)}<style>.firmaImg{max-height:72px;max-width:220px;display:block;margin:0 auto 6px}.datosBox{background:#f8fafc;border:1px solid #d7e4f5;border-radius:8px;padding:10px;margin:10px 0;display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}.firmaRow{display:flex;justify-content:space-between;margin-top:55px;gap:38px}.firma{width:45%;text-align:center}.line{border-top:1px solid #111;padding-top:8px}table.equipos th,table.equipos td{font-size:11px;padding:5px}</style><div class="title">ACTA DE CONFORMIDAD DEL SERVICIO</div><div class="datosBox"><div><b>Cliente:</b> ${q.clienteNombre||''}</div><div><b>Establecimiento:</b> ${q.establecimientoNombre||''}</div><div><b>Área usuaria:</b> ${q.areaNombre||''}</div><div><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'}</div><div><b>SIAF:</b> ${q.siaf||'-'}</div><div><b>Fecha:</b> ${new Date(q.fechaOrden||Date.now()).toLocaleDateString('es-PE')}</div></div><p>Yo, <b>${q.usuarioConformidad||'................................................'}</b>, identificado(a) con DNI N° <b>${q.usuarioDni||'................'}</b>, en calidad de <b>${q.usuarioCargo||'encargado del área usuaria'}</b> del establecimiento <b>${q.establecimientoNombre||''}</b>, área <b>${q.areaNombre||''}</b>, dejo constancia de haber recibido a conformidad el servicio ejecutado.</p><div class="datosBox"><div><b>Teléfono encargado:</b> ${q.usuarioTelefono||'-'}</div><div><b>Correo encargado:</b> ${q.usuarioCorreo||'-'}</div><div><b>Técnico responsable:</b> ${tecnico}</div><div><b>DNI técnico:</b> ${q.tecnicoDni||'-'}</div><div><b>Cargo técnico:</b> ${tecnicoCargo}</div><div><b>Código / colegiatura:</b> ${q.tecnicoCodigo||'-'}</div></div><table class="equipos"><thead><tr><th>ITEM</th><th>EQUIPO</th><th>MARCA</th><th>MODELO</th><th>SERIE</th><th>PATRIMONIAL</th><th>UBICACIÓN</th></tr></thead><tbody>${equiposDocRows(q)}</tbody></table><p>El servicio corresponde a la cotización <b>${q.numero||''}</b>, ${q.ordenTipo||'orden'} N° <b>${q.ordenNumero||'-'}</b> y N° Exp. SIAF <b>${q.siaf||'-'}</b>.</p><p><b>Observaciones del área usuaria:</b><br>${(q.usuarioObservaciones||'Sin observaciones.').split('\n').map(x=>safe(x)).join('<br>')}</p><div class="firmaRow"><div class="firma">${q.firmaAreaUsuaria?`<img class="firmaImg" src="${q.firmaAreaUsuaria}">`:''}<div class="line">Área usuaria / conformidad<br><b>${q.usuarioConformidad||''}</b><br>DNI: ${q.usuarioDni||'-'}<br>${q.usuarioCargo||''}</div></div><div class="firma">${q.firmaTecnico?`<img class="firmaImg" src="${q.firmaTecnico}">`:''}<div class="line">Técnico responsable<br><b>${tecnico}</b><br>DNI: ${q.tecnicoDni||'-'}<br>${tecnicoCargo}</div></div></div><div class="footer">Pág. 1</div></body></html>`;
}
function informeDoc(q){
  let emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};
  let tecnico=q.tecnicoNombre||emp.gerente||'Responsable técnico';
  let tecnicoCargo=q.tecnicoCargo||emp.cargoGerente||'Técnico responsable';
  let acts=execActivityList(q);let imgs=evidenceImgs(q);
  return `${baseDocHead(emp,'INFORME-'+q.numero)}<style>.firmaImg{max-height:72px;max-width:220px;display:block;margin:0 auto 6px}.sectionTitle{font-size:14px;color:#0f7f73;border-left:5px solid #0f7f73;padding-left:8px;margin-top:16px}.equipos th,.equipos td{font-size:11px;padding:5px}</style><div class="title">INFORME TÉCNICO DEL SERVICIO</div><p><b>SEÑORES:</b> ${q.clienteNombre||''}<br><b>ESTABLECIMIENTO:</b> ${q.establecimientoNombre||''}<br><b>ÁREA USUARIA:</b> ${q.areaNombre||''}<br><b>ASUNTO:</b> Servicio de ${q.tipo||''}.<br><b>REFERENCIA:</b> ${q.ordenTipo||'Orden'} N° ${q.ordenNumero||'-'} · SIAF N° ${q.siaf||'-'} · Cotización ${q.numero||''}.</p><div class="sectionTitle">1. Antecedentes</div><p>El presente informe se emite como sustento técnico de las actividades ejecutadas según la orden y cotización de referencia.</p><div class="sectionTitle">2. Objetivo</div><p>Dejar constancia técnica de los trabajos ejecutados, resultados obtenidos, observaciones, recomendaciones y evidencias asociadas al servicio.</p><div class="sectionTitle">3. Equipos intervenidos</div><table class="equipos"><thead><tr><th>ITEM</th><th>EQUIPO</th><th>MARCA</th><th>MODELO</th><th>SERIE</th><th>PATRIMONIAL</th><th>UBICACIÓN</th></tr></thead><tbody>${equiposDocRows(q)}</tbody></table><div class="sectionTitle">4. Actividades cotizadas ejecutadas</div><ul>${acts.base.map(a=>`<li>${a}</li>`).join('')||'<li>Actividades según cotización autorizada.</li>'}</ul><div class="sectionTitle">5. Actividades adicionales en campo</div><ul>${acts.extra.map(a=>`<li>${a}</li>`).join('')||'<li>No se registraron actividades adicionales.</li>'}</ul><div class="sectionTitle">6. Observaciones técnicas</div><p>${(q.comentarioTecnico||'Sin comentarios técnicos adicionales.').split('\n').map(x=>safe(x)).join('<br>')}</p><div class="sectionTitle">7. Recomendaciones</div><p>${(q.recomendaciones||'Continuar con el uso adecuado del equipo y programar su mantenimiento preventivo de acuerdo al plan del establecimiento.').split('\n').map(x=>safe(x)).join('<br>')}</p><div class="sectionTitle">8. Garantía</div><p>${q.garantiaExec||emp.garantia||'Según alcance del servicio ejecutado'}.</p><div class="sectionTitle">9. Evidencias fotográficas</div>${imgs.length?`<div class="photoGrid">${imgs.map(src=>`<img src="${src}">`).join('')}</div>`:'<p>No se adjuntaron evidencias fotográficas.</p>'}<div class="firmaRow"><div class="firma">${q.firmaTecnico?`<img class="firmaImg" src="${q.firmaTecnico}">`:''}<div class="line">Técnico responsable<br><b>${tecnico}</b><br>DNI: ${q.tecnicoDni||'-'}<br>${tecnicoCargo}</div></div><div class="firma">${q.firmaAreaUsuaria?`<img class="firmaImg" src="${q.firmaAreaUsuaria}">`:''}<div class="line">Área usuaria / conformidad<br><b>${q.usuarioConformidad||''}</b><br>DNI: ${q.usuarioDni||'-'}</div></div></div><div class="footer">Pág. 1</div></body></html>`;
}
function legacyDoc(q,t){return t==='ACTA DE CONFORMIDAD'?actaDoc(q):informeDoc(q)}
function doc(q,t){return t==='COTIZACIÓN'?quoteDoc(q):legacyDoc(q,t)}
function render(){ensureActiveEmpresa();normalizeState();app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.18.1 ESTABLE</h1><b>Cotización dinámica + Nube real + IGV 18% + acta/informe integrados</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind();}



/* =========================
   SERVITEC PRO V13.19 FINAL EMPRESARIAL
   Consolidación:
   - Versión única.
   - Correlativos por empresa.
   - Ejecución como fuente única de datos.
   - Firma táctil en pantalla para área usuaria y técnico.
   - Acta/Informe leen datos desde ejecución.
========================= */

const SERVITEC_VERSION_FINAL='SERVITEC PRO V13.19 FINAL EMPRESARIAL';

function empresaConfigDoc(e){
  e=e||activeEmpresa()||{};
  e.correlativos=e.correlativos||{};
  if(e.correlativos.cotizacion==null)e.correlativos.cotizacion=Number(e.corrCotizacion||0);
  if(e.correlativos.acta==null)e.correlativos.acta=Number(e.corrActa||0);
  if(e.correlativos.informe==null)e.correlativos.informe=Number(e.corrInforme||0);
  if(e.correlativos.os==null)e.correlativos.os=Number(e.corrOs||0);
  e.prefijos=e.prefijos||{};
  e.prefijos.cotizacion=e.prefijos.cotizacion||'COT';
  e.prefijos.acta=e.prefijos.acta||'ACT';
  e.prefijos.informe=e.prefijos.informe||'INF';
  e.prefijos.os=e.prefijos.os||'OS';
  return e;
}
function docYear(){return new Date().getFullYear()}
function fmtDoc(prefix,n){return `${prefix}-${docYear()}-${String(Number(n)||1).padStart(4,'0')}`}
function nextDocNumber(tipo){
  let emp=empresaConfigDoc(activeEmpresa());
  emp.correlativos[tipo]=Number(emp.correlativos[tipo]||0)+1;
  return fmtDoc(emp.prefijos[tipo]||tipo.toUpperCase(), emp.correlativos[tipo]);
}
function currentNextDocNumber(tipo){
  let emp=empresaConfigDoc(activeEmpresa());
  return fmtDoc(emp.prefijos[tipo]||tipo.toUpperCase(), Number(emp.correlativos[tipo]||0)+1);
}
function setCorr(tipo,val){
  let emp=empresaConfigDoc(activeEmpresa());
  emp.correlativos[tipo]=Number(val)||0;
  persist();
}
function setPref(tipo,val){
  let emp=empresaConfigDoc(activeEmpresa());
  emp.prefijos[tipo]=(val||'').trim().toUpperCase()||tipo.toUpperCase();
  persist();
}
function resetCorrYear(){
  if(!confirm('¿Reiniciar correlativos de la empresa activa?'))return;
  let emp=empresaConfigDoc(activeEmpresa());
  emp.correlativos={cotizacion:0,acta:0,informe:0,os:0};
  persist();render();
}

const oldNormalizeFinal = typeof normalizeState==='function' ? normalizeState : function(){};
normalizeState=function(){
  oldNormalizeFinal();
  (state.empresas||[]).forEach(empresaConfigDoc);
};

const oldSaveQuoteFinal = typeof saveQuote==='function' ? saveQuote : null;
saveQuote=function(){
  let isNew=!state.cotizaciones.find(q=>draft&&q.id===draft.id);
  if(draft && isNew){
    empresaConfigDoc(activeEmpresa());
    if(!draft.numero || /BORRADOR|COT-\d{4}-0000/.test(String(draft.numero))){
      draft.numero=nextDocNumber('cotizacion');
    }
  }
  let {c,e,a}=cdata();
  draft.total=qtotal();
  draft.clienteNombre=c.nombre;
  draft.establecimientoNombre=e.nombre;
  draft.areaNombre=a.nombre;
  let i=state.cotizaciones.findIndex(q=>q.id===draft.id);
  i>=0?state.cotizaciones[i]=clone(draft):state.cotizaciones.push(clone(draft));
  draft=null;persist();render();
};

const oldNewDraftFinal = typeof newDraft==='function' ? newDraft : null;
newDraft=function(){
  let c=state.clientes[0]||{}, e=c.establecimientos?.[0]||{}, a=e.areas?.[0]||{};
  return {id:uid(),numero:currentNextDocNumber('cotizacion'),empresaId:activeEmpresa()?.id||'',clienteId:c.id||'',estId:e.id||'',areaId:a.id||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,equipos:[],acts:[],repuestos:[],total:0,subtotal:0,igv:0,fecha:new Date().toISOString()};
};

function ensureActaNumero(q){ if(!q.actaNumero){q.actaNumero=nextDocNumber('acta');persist();} return q.actaNumero; }
function ensureInformeNumero(q){ if(!q.informeNumero){q.informeNumero=nextDocNumber('informe');persist();} return q.informeNumero; }

const oldPrintQuoteFinal = typeof printQuote==='function' ? printQuote : null;
printQuote=function(id,t){
  let q=state.cotizaciones.find(x=>x.id===id);
  if(!q)return;
  if(t==='ACTA DE CONFORMIDAD')ensureActaNumero(q);
  if(t==='INFORME TÉCNICO')ensureInformeNumero(q);
  persist();
  let w=open('','_blank');
  w.document.write(doc(q,t));
  w.document.close();
  setTimeout(()=>w.print(),250);
};

function signaturePad(qid,field,label){
  return `<div class="card"><h4>${label}</h4><div class="sigBox"><canvas id="canvas_${field}_${qid}" width="520" height="180" style="width:100%;height:180px;background:white;border:1px solid #cbd5e1;border-radius:10px;touch-action:none"></canvas></div><div class="bar"><button class="btn" onclick="clearSignature('${qid}','${field}')">Limpiar firma</button><button class="btn green" onclick="saveSignature('${qid}','${field}')">Guardar firma dibujada</button></div><p class="muted">También puedes subir una imagen de firma si ya la tienes escaneada.</p></div>`;
}
function initSignatureCanvas(canvas){
  if(!canvas || canvas.dataset.ready)return;
  canvas.dataset.ready='1';
  const ctx=canvas.getContext('2d');
  ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.strokeStyle='#111';
  let drawing=false;
  function pos(e){
    const r=canvas.getBoundingClientRect();
    const p=e.touches?e.touches[0]:e;
    return {x:(p.clientX-r.left)*(canvas.width/r.width),y:(p.clientY-r.top)*(canvas.height/r.height)};
  }
  function start(e){drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();}
  function move(e){if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault();}
  function end(e){drawing=false;e&&e.preventDefault();}
  canvas.addEventListener('mousedown',start); canvas.addEventListener('mousemove',move); window.addEventListener('mouseup',end);
  canvas.addEventListener('touchstart',start,{passive:false}); canvas.addEventListener('touchmove',move,{passive:false}); canvas.addEventListener('touchend',end,{passive:false});
}
function initSignaturePads(){
  setTimeout(()=>document.querySelectorAll('canvas[id^="canvas_firma"]').forEach(initSignatureCanvas),50);
}
function clearSignature(qid,field){
  let c=document.getElementById(`canvas_${field}_${qid}`);
  if(c)c.getContext('2d').clearRect(0,0,c.width,c.height);
}
function saveSignature(qid,field){
  let q=state.cotizaciones.find(x=>x.id===qid), c=document.getElementById(`canvas_${field}_${qid}`);
  if(!q||!c)return;
  q[field]=c.toDataURL('image/png');
  q[field+'Nombre']='Firma dibujada en pantalla';
  persist(); alert('Firma guardada correctamente');
  render();
}

const oldTableExecFinal = typeof tableExec==='function' ? tableExec : null;
tableExec=function(rs,q){
  let exec=q.execRows||[], extra=q.execExtras||[];
  let base=`<h3>Actividades cotizadas</h3><p class="notice">Cada fila corresponde a un equipo individualizado y una actividad. Usa serie/patrimonial para diferenciar equipos repetidos.</p><div class="tableWrap"><table><thead><tr><th>Equipo identificado</th><th>Actividad/Repuesto</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${rs.map((r,i)=>{let er=exec[i]||{};return `<tr><td>${equipoEtiqueta(r)}</td><td>${r.descripcion||''}</td><td><select onchange="updateExecCell('${q.id}',${i},'estado',this.value)"><option ${er.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${er.estado==='En proceso'?'selected':''}>En proceso</option><option ${er.estado==='Terminado'?'selected':''}>Terminado</option><option ${er.estado==='Conforme'?'selected':''}>Conforme</option><option ${er.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Observación técnica" onchange="updateExecCell('${q.id}',${i},'observacion',this.value)">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecEvidence('${q.id}',${i},this.files[0])"><small>${er.evidenciaNombre||''}</small></td></tr>`}).join('')}</tbody></table></div>`;
  let extras=`<h3>Actividades adicionales en campo</h3><p class="notice">Agrega trabajos encontrados durante la intervención para que el equipo quede operativo. No modifica el valor de la cotización original.</p><button class="btn green" onclick="addExecExtra('${q.id}')">+ Actividad adicional</button><div class="tableWrap"><table><thead><tr><th>Descripción adicional</th><th>Estado</th><th>Comentario</th><th>Evidencia</th></tr></thead><tbody>${extra.map((r,i)=>`<tr><td><textarea placeholder="Ej.: Ajuste de tarjeta, limpieza de ventilador, cambio de fusible" onchange="updateExecExtra('${q.id}',${i},'descripcion',this.value)">${r.descripcion||''}</textarea></td><td><select onchange="updateExecExtra('${q.id}',${i},'estado',this.value)"><option ${r.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${r.estado==='En proceso'?'selected':''}>En proceso</option><option ${r.estado==='Terminado'?'selected':''}>Terminado</option><option ${r.estado==='Conforme'?'selected':''}>Conforme</option><option ${r.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Comentario de la actividad adicional" onchange="updateExecExtra('${q.id}',${i},'observacion',this.value)">${r.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecExtraEvidence('${q.id}',${i},this.files[0])"><small>${r.evidenciaNombre||''}</small></td></tr>`).join('')}</tbody></table></div>`;
  let datos=`<h3>Datos para acta — Área usuaria / conformidad</h3><div class="grid2"><input placeholder="Nombre del responsable del área usuaria" value="${esc(q.usuarioConformidad||'')}" onchange="updateExecMeta('${q.id}','usuarioConformidad',this.value)"><input placeholder="DNI del responsable" value="${esc(q.usuarioDni||'')}" onchange="updateExecMeta('${q.id}','usuarioDni',this.value)"><input placeholder="Cargo del responsable" value="${esc(q.usuarioCargo||'')}" onchange="updateExecMeta('${q.id}','usuarioCargo',this.value)"><input placeholder="Teléfono" value="${esc(q.usuarioTelefono||'')}" onchange="updateExecMeta('${q.id}','usuarioTelefono',this.value)"><input placeholder="Correo" value="${esc(q.usuarioCorreo||'')}" onchange="updateExecMeta('${q.id}','usuarioCorreo',this.value)"></div><textarea placeholder="Observaciones del área usuaria para el acta" onchange="updateExecMeta('${q.id}','usuarioObservaciones',this.value)">${q.usuarioObservaciones||''}</textarea><div class="grid2"><label class="uploadBox"><b>Subir firma área usuaria</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaAreaUsuaria',this.files[0])"><span>${q.firmaAreaUsuariaNombre||q.firmaAreaUsuaria?'Firma cargada ✅':'Sin firma'}</span></label>${signaturePad(q.id,'firmaAreaUsuaria','Firmar en pantalla — Área usuaria')}</div><h3>Datos para acta/informe — Técnico responsable</h3><div class="grid2"><input placeholder="Nombre del técnico responsable" value="${esc(q.tecnicoNombre||'')}" onchange="updateExecMeta('${q.id}','tecnicoNombre',this.value)"><input placeholder="DNI del técnico" value="${esc(q.tecnicoDni||'')}" onchange="updateExecMeta('${q.id}','tecnicoDni',this.value)"><input placeholder="Cargo del técnico" value="${esc(q.tecnicoCargo||'Técnico responsable')}" onchange="updateExecMeta('${q.id}','tecnicoCargo',this.value)"><input placeholder="Colegiatura / código técnico, si aplica" value="${esc(q.tecnicoCodigo||'')}" onchange="updateExecMeta('${q.id}','tecnicoCodigo',this.value)"></div><div class="grid2"><label class="uploadBox"><b>Subir firma técnico</b><input type="file" accept="image/*" onchange="updateExecSignature('${q.id}','firmaTecnico',this.files[0])"><span>${q.firmaTecnicoNombre||q.firmaTecnico?'Firma cargada ✅':'Sin firma'}</span></label>${signaturePad(q.id,'firmaTecnico','Firmar en pantalla — Técnico')}</div><h3>Datos técnicos para informe</h3><div class="grid2"><textarea placeholder="Comentarios técnicos generales" onchange="updateExecMeta('${q.id}','comentarioTecnico',this.value)">${q.comentarioTecnico||''}</textarea><textarea placeholder="Recomendaciones técnicas" onchange="updateExecMeta('${q.id}','recomendaciones',this.value)">${q.recomendaciones||''}</textarea><input placeholder="Garantía del servicio" value="${esc(q.garantiaExec||'Según alcance del servicio ejecutado')}" onchange="updateExecMeta('${q.id}','garantiaExec',this.value)"></div>`;
  return base+extras+datos+`<div class="bar"><span class="pill">Estado: ${estadoCot(q)}</span>${allDone(q)?'<span class="badge green">Lista para acta e informe</span>':'<span class="badge orange">Ejecución en curso</span>'}</div>`;
};

const oldViewsConfigFinal = views.Configuración;
views.Configuración=function(){
  let emp=empresaConfigDoc(activeEmpresa());
  return `<section class="wrap">${back()}<h2>Configuración</h2><p class="notice">${cloud}</p><h3>Configuración documental por empresa</h3><div class="card"><p><b>Empresa activa:</b> ${emp.nombre||'-'}</p><p class="notice">Coloca el último número ya usado. El sistema generará el siguiente automáticamente.</p><div class="tableWrap"><table><thead><tr><th>Documento</th><th>Prefijo</th><th>Último usado</th><th>Siguiente</th></tr></thead><tbody>${[['cotizacion','Cotización'],['acta','Acta'],['informe','Informe'],['os','Orden servicio']].map(([k,l])=>`<tr><td>${l}</td><td><input value="${esc(emp.prefijos[k]||'')}" onchange="setPref('${k}',this.value);render()"></td><td><input type="number" value="${Number(emp.correlativos[k]||0)}" onchange="setCorr('${k}',this.value);render()"></td><td><b>${currentNextDocNumber(k)}</b></td></tr>`).join('')}</tbody></table></div><button class="btn danger" onclick="resetCorrYear()">Reiniciar correlativos de empresa activa</button></div><h3>Limpieza operativa</h3><div class="card"><p>Conserva empresas y configuración empresarial. Limpia clientes, cotizaciones, ejecuciones, actas, informes e inventario de prueba.</p><button class="btn danger" onclick="limpiarOperacion()">Limpiar base operativa</button></div><p>Variables Vercel: VITE_SUPABASE_URL y VITE_SUPABASE_KEY.</p></section>`;
};
function limpiarOperacion(){
  if(!confirm('Esto eliminará clientes, cotizaciones, ejecuciones e inventario de prueba. NO elimina empresas. ¿Continuar?'))return;
  state.clientes=[];
  state.cotizaciones=[];
  state.inventario=[];
  localStorage.removeItem('servitec_exec_qid');
  localStorage.removeItem('servitec_acta_qid');
  localStorage.removeItem('servitec_informe_qid');
  persist();render();
}

const oldActaDocFinal = typeof actaDoc==='function' ? actaDoc : null;
actaDoc=function(q){
  if(q && !q.actaNumero) ensureActaNumero(q);
  return oldActaDocFinal ? oldActaDocFinal(q).replace(/ACTA DE CONFORMIDAD DEL SERVICIO/g,`ACTA DE CONFORMIDAD DEL SERVICIO<br><small>${q.actaNumero||''}</small>`) : '';
};
const oldInformeDocFinal = typeof informeDoc==='function' ? informeDoc : null;
informeDoc=function(q){
  if(q && !q.informeNumero) ensureInformeNumero(q);
  return oldInformeDocFinal ? oldInformeDocFinal(q).replace(/INFORME TÉCNICO DEL SERVICIO/g,`INFORME TÉCNICO DEL SERVICIO<br><small>${q.informeNumero||''}</small>`) : '';
};

const oldRenderFinal = render;
render=function(){
  ensureActiveEmpresa(); normalizeState();
  app.innerHTML=`<header class="top"><div><h1>${SERVITEC_VERSION_FINAL}</h1><b>Cotización + ejecución única + actas/informes automáticos + firmas táctiles + correlativos por empresa</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); initSignaturePads();
};
normalizeState();


/* =========================
   SERVITEC PRO V13.20 - OPERACIONES MASIVAS
   Cotización resumida por tipo/cantidad -> ejecución individual por equipo.
========================= */
const SERVITEC_VERSION_MASIVA='SERVITEC PRO V13.20 OPERACIONES MASIVAS';
function qtyEq(e){return Math.max(1, parseInt(e.cantidad||e.qty||1,10)||1)}
function pad3(n){return String(n).padStart(3,'0')}
function totalEquiposCot(q){return (q.equipos||[]).reduce((s,e)=>s+qtyEq(e),0)}
function resumenTipos(q){
  const m={};
  (q.execRows&&q.execRows.length?q.execRows:execRowsBase(q)).forEach(r=>{let k=r.tipoEquipo||r.equipo||'Equipo';m[k]=(m[k]||0)+1});
  return m;
}
function estadoResumen(q){
  const rows=q.execRows||[];
  const total=rows.length;
  const done=rows.filter(r=>['Terminado','Conforme'].includes(r.estado)).length;
  const obs=rows.filter(r=>r.estado==='Observado').length;
  return {total,done,obs,pending:Math.max(0,total-done),pct:total?Math.round(done*100/total):0};
}
function setExecFilter(qid,k,v){let q=state.cotizaciones.find(x=>x.id===qid); if(!q)return; q.execFilter=q.execFilter||{}; q.execFilter[k]=v; persist(); render();}
function masivoEquipoLabel(r){
  return `<b>${pad3(r.item||1)} / ${r.totalItems||''}</b><br><b>${safe(r.tipoEquipo||r.equipo||'Equipo')}</b><br><small>Marca: ${safe(r.marca)||'-'} · Modelo: ${safe(r.modelo)||'-'}<br>Serie: ${safe(r.serie)||'-'} · Patrimonial: ${safe(r.codigoPatrimonial||r.patrimonial)||'-'}<br>Ubicación: ${safe(r.ubicacion)||'-'}</small>`;
}
function bulkItemsFromText(qid,raw){
  let q=state.cotizaciones.find(x=>x.id===qid); if(!q)return;
  const lines=(raw||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length){alert('Pega al menos una fila.');return;}
  q.execRows=q.execRows&&q.execRows.length?q.execRows:execRowsBase(q);
  let i=0;
  lines.forEach(line=>{
    const p=line.split('|').map(x=>x.trim());
    if(p.length<2)return;
    const [tipo,marca,modelo,serie,codigoPatrimonial,ubicacion]=p;
    let row=q.execRows[i++]; if(!row)return;
    Object.assign(row,{tipoEquipo:tipo||row.tipoEquipo||row.equipo, equipo:tipo||row.equipo, marca:marca||'', modelo:modelo||'', serie:serie||'', codigoPatrimonial:codigoPatrimonial||'', ubicacion:ubicacion||''});
  });
  persist(); render(); alert('Carga masiva aplicada a '+Math.min(i,q.execRows.length)+' ítems.');
}
function importMassModal(qid){
  const id='mass_'+uid();
  const ejemplo='Termómetro|Fluke|51-II|SER-001|PAT-001|Laboratorio\nTermómetro|Fluke|51-II|SER-002|PAT-002|Laboratorio\nTermohigrómetro|Testo|608-H1|TH-001|PAT-159|Farmacia';
  document.body.insertAdjacentHTML('beforeend',`<div class="modalMask" id="${id}"><div class="modalBox"><h2>Importar datos masivos de equipos</h2><p class="muted">Pega una fila por equipo con el formato:<br><b>Tipo|Marca|Modelo|Serie|Patrimonial|Ubicación</b><br>Se asignará en orden a los ítems generados.</p><textarea id="${id}_txt" rows="14" placeholder="${ejemplo}"></textarea><div class="modalBtns"><button class="btn" onclick="document.getElementById('${id}').remove()">Cancelar</button><button class="btn green" onclick="bulkItemsFromText('${qid}',document.getElementById('${id}_txt').value);document.getElementById('${id}').remove()">Aplicar carga masiva</button></div></div></div>`);
}
function exportMassTemplate(qid){
  let q=state.cotizaciones.find(x=>x.id===qid); if(!q)return;
  q.execRows=q.execRows&&q.execRows.length?q.execRows:execRowsBase(q);
  const rows=['Item|Tipo|Marca|Modelo|Serie|Patrimonial|Ubicacion'];
  q.execRows.forEach(r=>rows.push(`${pad3(r.item||1)}|${r.tipoEquipo||r.equipo||''}|||||`));
  download('plantilla-equipos-'+(q.numero||'ejecucion')+'.csv', rows.join('\n'), 'text/csv');
}

/* Cotización: permitir cantidad por tipo de equipo */
const oldEqV1320 = typeof eq==='function' ? eq : null;
eq=function(){let e=oldEqV1320?oldEqV1320():{id:uid(),nombre:'',marca:'',modelo:'',serie:'',acts:[]}; if(!e.cantidad)e.cantidad=1; return e;}
const oldEquiposTableV1320 = typeof equiposTable==='function' ? equiposTable : null;
equiposTable=function(list){return `<div class="tableWrap"><table><thead><tr><th>Tipo / Equipo</th><th>Cantidad</th><th>Marca base</th><th>Modelo base</th><th>Serie base</th><th>Patrimonial base</th><th>Ubicación base</th></tr></thead><tbody>${list.map(eq=>`<tr><td><input placeholder="Ej.: Termómetro" data-eq="${eq.id}" data-p="nombre" value="${esc(eq.nombre)}"></td><td><input type="number" min="1" placeholder="1" data-eq="${eq.id}" data-p="cantidad" value="${esc(eq.cantidad||1)}"></td><td><input placeholder="Marca" data-eq="${eq.id}" data-p="marca" value="${esc(eq.marca)}"></td><td><input placeholder="Modelo" data-eq="${eq.id}" data-p="modelo" value="${esc(eq.modelo)}"></td><td><input placeholder="Serie base/opcional" data-eq="${eq.id}" data-p="serie" value="${esc(eq.serie)}"></td><td><input placeholder="Patrimonial base/opcional" data-eq="${eq.id}" data-p="codigoPatrimonial" value="${esc(eq.codigoPatrimonial||eq.codigo||'')}"></td><td><input placeholder="Ubicación / ambiente" data-eq="${eq.id}" data-p="ubicacion" value="${esc(eq.ubicacion||'')}"></td></tr>`).join('')}</tbody></table></div><p class="notice"><b>Total equipos a ejecutar:</b> ${(list||[]).reduce((s,e)=>s+qtyEq(e),0)}. En ejecución se generará un ítem individual por cada equipo.</p>`;}
const oldQtotalV1320 = typeof qtotal==='function' ? qtotal : null;
qtotal=function(q=draft){
  if(!q)return 0;
  if(q.config===MODES.GENERAL){
    const base=(q.acts||[]).reduce((s,a)=>s+(+a.cantidad||0)*(+a.precio||0),0);
    const qty=totalEquiposCot(q)||1;
    return base*qty;
  }
  return oldQtotalV1320?oldQtotalV1320(q):0;
}

/* Ejecución: expandir por cantidad y permitir editar datos individuales */
execRowsBase=function(q){
  if(q.config===MODES.PROPIAS){
    let out=[]; let n=1;
    (q.equipos||[]).forEach(e=>{
      const cant=qtyEq(e);
      for(let j=1;j<=cant;j++){
        (e.acts||[]).forEach(a=>out.push({id:`${e.id}_${j}_${a.id}`,item:n,totalItems:0,tipoEquipo:e.nombre||'Equipo biomédico',equipo:e.nombre||'Equipo biomédico',marca:e.marca||'',modelo:e.modelo||'',serie:e.serie||'',codigoPatrimonial:e.codigoPatrimonial||e.codigo||'',ubicacion:e.ubicacion||'',descripcion:a.descripcion,cantidad:a.cantidad||1,precio:a.precio||0,equipoId:e.id,actividadId:a.id,estado:'Pendiente',observacion:'',evidencia:''}));
        n++;
      }
    });
    out.forEach(x=>x.totalItems=n-1); return out;
  }
  if(q.config===MODES.REPUESTOS){
    let out=(q.repuestos||[]).map((r,i)=>({id:r.id||uid(),item:i+1,totalItems:(q.repuestos||[]).length,tipoEquipo:'Repuesto / accesorio',equipo:'Repuesto / accesorio',descripcion:r.descripcion,cantidad:r.cantidad||1,precio:r.precio||0,actividadId:r.id||'',estado:'Pendiente',observacion:'',evidencia:''})); return out;
  }
  const equipos=(q.equipos&&q.equipos.length?q.equipos:[{id:'grupo',nombre:'Equipos incluidos',marca:'',modelo:'',serie:'',cantidad:1}]);
  const acts=q.acts||[];
  let total=equipos.reduce((s,e)=>s+qtyEq(e),0), item=1, out=[];
  equipos.forEach(e=>{
    for(let j=1;j<=qtyEq(e);j++){
      const tipo=e.nombre||'Equipo biomédico';
      acts.forEach(a=>out.push({
        id:`${e.id||'eq'}_${j}_${a.id||uid()}`,item,totalItems:total,tipoEquipo:tipo,equipo:tipo,marca:e.marca||'',modelo:e.modelo||'',serie:j===1?(e.serie||''):'',codigoPatrimonial:j===1?(e.codigoPatrimonial||e.codigo||''):'',ubicacion:e.ubicacion||'',descripcion:a.descripcion,cantidad:a.cantidad||1,precio:a.precio||0,equipoId:e.id||'',actividadId:a.id||'',estado:'Pendiente',observacion:'',evidencia:''
      }));
      item++;
    }
  });
  return out;
}

function rowInput(q,i,field,val,ph){return `<input value="${esc(val||'')}" placeholder="${ph||field}" onchange="updateExecCell('${q.id}',${i},'${field}',this.value)">`}
tableExec=function(rs,q){
  let exec=q.execRows&&q.execRows.length?q.execRows:rs;
  q.execRows=exec;
  const sum=estadoResumen(q), tipos=resumenTipos(q), f=q.execFilter||{};
  const qtxt=(f.q||'').toLowerCase(), estado=f.estado||'Todos', tipo=f.tipo||'Todos';
  let shown=exec.map((r,i)=>({r,i})).filter(({r})=>{
    const hay=[r.tipoEquipo,r.equipo,r.marca,r.modelo,r.serie,r.codigoPatrimonial,r.ubicacion,r.descripcion,r.observacion].join(' ').toLowerCase();
    return (!qtxt||hay.includes(qtxt)) && (estado==='Todos'||(r.estado||'Pendiente')===estado) && (tipo==='Todos'||(r.tipoEquipo||r.equipo)===tipo);
  });
  return `<h3>Matriz de ejecución masiva</h3><div class="grid"><div class="card"><b>Total</b><h2>${sum.total}</h2></div><div class="card"><b>Completados</b><h2>${sum.done}</h2></div><div class="card"><b>Pendientes</b><h2>${sum.pending}</h2></div><div class="card"><b>Avance</b><h2>${sum.pct}%</h2></div></div><div class="card"><b>Recuento por tipo:</b><br>${Object.entries(tipos).map(([k,v])=>`<span class="pill">${k}: ${v}</span>`).join(' ')||'-'}</div><div class="bar"><button class="btn green" onclick="exportMassTemplate('${q.id}')">Descargar plantilla CSV</button><button class="btn" onclick="importMassModal('${q.id}')">Importar datos masivos</button></div><div class="grid"><input placeholder="Buscar serie, patrimonial, ubicación..." value="${esc(f.q||'')}" onchange="setExecFilter('${q.id}','q',this.value)"><select onchange="setExecFilter('${q.id}','estado',this.value)">${['Todos','Pendiente','En proceso','Terminado','Conforme','Observado'].map(x=>`<option ${estado===x?'selected':''}>${x}</option>`).join('')}</select><select onchange="setExecFilter('${q.id}','tipo',this.value)"><option>Todos</option>${Object.keys(tipos).map(x=>`<option ${tipo===x?'selected':''}>${x}</option>`).join('')}</select></div><p class="notice">Mostrando ${shown.length} de ${exec.length} ítems. Cada ítem puede tener marca, modelo, serie, patrimonial, ubicación, estado, observación y evidencia.</p><div class="tableWrap"><table><thead><tr><th>Item</th><th>Tipo / datos del equipo</th><th>Actividad</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${shown.map(({r,i})=>{let er=exec[i]||r;return `<tr><td><b>${pad3(er.item||i+1)} / ${er.totalItems||exec.length}</b></td><td><div class="grid2">${rowInput(q,i,'tipoEquipo',er.tipoEquipo||er.equipo,'Tipo')}${rowInput(q,i,'marca',er.marca,'Marca')}${rowInput(q,i,'modelo',er.modelo,'Modelo')}${rowInput(q,i,'serie',er.serie,'Serie')}${rowInput(q,i,'codigoPatrimonial',er.codigoPatrimonial||er.patrimonial,'Patrimonial')}${rowInput(q,i,'ubicacion',er.ubicacion,'Ubicación')}</div></td><td>${safe(er.descripcion)||''}</td><td><select onchange="updateExecCell('${q.id}',${i},'estado',this.value)">${['Pendiente','En proceso','Terminado','Conforme','Observado'].map(x=>`<option ${er.estado===x?'selected':''}>${x}</option>`).join('')}</select></td><td><textarea placeholder="Observación técnica" onchange="updateExecCell('${q.id}',${i},'observacion',this.value)">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*" onchange="updateExecEvidence('${q.id}',${i},this.files[0])"><small>${er.evidenciaNombre||''}</small></td></tr>`}).join('')}</tbody></table></div>${oldTableExecFinal?oldTableExecFinal([],q).replace(/<h3>Actividades cotizadas[\s\S]*?<h3>Actividades adicionales en campo<\/h3>/,'<h3>Actividades adicionales en campo</h3>'):''}`;
}

/* Acta e informe: resumen masivo */
equiposDocRows=function(q){
  const rows=q.execRows&&q.execRows.length?q.execRows:execRowsBase(q);
  return rows.map((e,i)=>`<tr><td>${pad3(e.item||i+1)}</td><td>${safe(e.tipoEquipo||e.equipo)||'Equipo'}</td><td>${safe(e.marca)||'-'}</td><td>${safe(e.modelo)||'-'}</td><td>${safe(e.serie)||'-'}</td><td>${safe(e.codigoPatrimonial||e.patrimonial)||'-'}</td><td>${safe(e.ubicacion)||'-'}</td><td>${safe(e.estado)||'Pendiente'}</td></tr>`).join('') || `<tr><td>001</td><td>Equipos según cotización</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
}
function resumenMasivoHtml(q){const tipos=resumenTipos(q);return `<div class="datosBox"><b>Resumen de equipos:</b><br>${Object.entries(tipos).map(([k,v])=>`${v} ${k}`).join('<br>')}<br><b>Total:</b> ${(q.execRows&&q.execRows.length)||totalEquiposCot(q)} equipos</div>`;}
const oldActaV1320=typeof actaDoc==='function'?actaDoc:null;
actaDoc=function(q){let html=oldActaV1320?oldActaV1320(q):'';return html.replace(/<table><thead><tr><th>ITEM<\/th>[\s\S]*?<\/table>/,resumenMasivoHtml(q));}
const oldInformeV1320=typeof informeDoc==='function'?informeDoc:null;
informeDoc=function(q){let html=oldInformeV1320?oldInformeV1320(q):'';return html.replace(/<\/body><\/html>$/,`<h3>Anexo técnico de equipos intervenidos</h3><table><thead><tr><th>ITEM</th><th>TIPO</th><th>MARCA</th><th>MODELO</th><th>SERIE</th><th>PATRIMONIAL</th><th>UBICACIÓN</th><th>RESULTADO</th></tr></thead><tbody>${equiposDocRows(q)}</tbody></table></body></html>`);}

const oldExecGateV1320=typeof execGate==='function'?execGate:null;
execGate=function(q){
  if(!q.ordenNumero||!q.siaf)return oldExecGateV1320?oldExecGateV1320(q):'';
  let fresh=execRowsBase(q);
  if(!q.execRows||q.execRows.length!==fresh.length){q.execRows=fresh;persist();}
  return `<div class="card"><h3>Ejecución autorizada</h3><p><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero} · <b>SIAF:</b> ${q.siaf} · <b>Fecha:</b> ${q.fechaOrden||''}</p><p><b>Total de equipos generados:</b> ${q.execRows.length}</p></div>${tableExec(q.execRows,q)}`;
}

const oldRenderV1320=render;
render=function(){ensureActiveEmpresa(); normalizeState&&normalizeState(); app.innerHTML=`<header class="top"><div><h1>${SERVITEC_VERSION_MASIVA}</h1><b>Operaciones masivas: cotización resumida → ejecución individual por equipo + importación CSV</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind(); if(typeof initSignaturePads==='function')initSignaturePads();}
render();

/* =========================
   SERVITEC PRO V13.20.2 - INTEGRIDAD DE DATOS MULTIEMPRESA
   Corrige:
   - Filtro real por empresa activa en clientes, cotizaciones, ejecución, actas, informes e inventario.
   - Cliente -> Establecimiento -> Área usuaria dentro de la empresa activa.
   - Configuración empresarial y correlativos guardados dentro de app_state en Supabase.
========================= */
const SERVITEC_VERSION_INTEGRIDAD='SERVITEC PRO V13.20.2 INTEGRIDAD DE DATOS';
function empId(){ ensureActiveEmpresa(); return state.activeEmpresaId || state.empresas?.[0]?.id || ''; }
function belongsEmpresa(x){ return !x || !x.empresaId || x.empresaId===empId(); }
function clientesEmpresa(){ normalizeState(); return (state.clientes||[]).filter(c=>belongsEmpresa(c)); }
function cotizacionesEmpresa(){ normalizeState(); return (state.cotizaciones||[]).filter(q=>belongsEmpresa(q)); }
function inventarioEmpresa(){ normalizeState(); return (state.inventario||[]).filter(i=>belongsEmpresa(i)); }
function ensureEmpresaFields(){
  normalizeState();
  const id=empId();
  (state.clientes||[]).forEach(c=>{ if(!c.empresaId)c.empresaId=id; c.establecimientos=Array.isArray(c.establecimientos)?c.establecimientos:[]; c.establecimientos.forEach(e=>{ if(!e.id)e.id=uid(); e.areas=Array.isArray(e.areas)?e.areas:[]; }); });
  (state.cotizaciones||[]).forEach(q=>{ if(!q.empresaId)q.empresaId=id; });
  (state.inventario||[]).forEach(i=>{ if(!i.empresaId)i.empresaId=id; });
  (state.empresas||[]).forEach(e=>empresaConfigDoc(e));
}

const _loadCloudIntegridad = loadCloud;
loadCloud = async function(){
  if(!hasCloud){ await _loadCloudIntegridad(); ensureEmpresaFields(); return; }
  cloud='Conectando Supabase...'; render();
  try{
    let r=await fetch(`${env.SUPABASE_URL}/rest/v1/app_state?id=eq.global&select=payload,updated_at`,{headers:{apikey:env.SUPABASE_KEY,Authorization:`Bearer ${env.SUPABASE_KEY}`}});
    let d=await r.json();
    if(Array.isArray(d)&&d[0]&&d[0].payload){ state={...clone(seed),...d[0].payload}; }
    else { migrateLocalState(); }
    ensureActiveEmpresa(); ensureEmpresaFields(); normalizeState();
    for(const k of storageKeys()) localStorage.setItem(k,JSON.stringify(state));
    cloud='Nube Supabase activa'; render();
  }catch(e){ cloud='Modo local: Supabase no respondió'; migrateLocalState(); ensureEmpresaFields(); render(); }
};

const _persistIntegridad = persist;
persist = function(){ ensureEmpresaFields(); _persistIntegridad(); };

actions.activateEmpresa=function(el){
  state.activeEmpresaId=el.dataset.id;
  localStorage.removeItem('servitec_exec_qid');
  localStorage.removeItem('servitec_acta_qid');
  localStorage.removeItem('servitec_informe_qid');
  persist(); tab='Dashboard'; render();
};

actions.saveCliente=function(){
  let n=$('#cliNom')?.value.trim(); if(!n)return alert('Ingresa el nombre del cliente.');
  state.clientes.push({id:uid(),empresaId:empId(),nombre:n,ruc:$('#cliRuc')?.value||'',establecimientos:[]});
  persist(); render();
};
actions.saveEst=function(){
  let cid=$('#cliSel')?.value, n=$('#estNom')?.value.trim(); if(!cid)return alert('Selecciona un cliente.'); if(!n)return alert('Ingresa el establecimiento.');
  state.clientes=state.clientes.map(c=>c.id===cid?{...c,empresaId:c.empresaId||empId(),establecimientos:[...(c.establecimientos||[]),{id:uid(),nombre:n,areas:[]}]}:c);
  persist(); render();
};
actions.saveArea=function(el){
  let n=$('#area_'+el.dataset.id)?.value.trim(); if(!n)return alert('Ingresa el área usuaria.');
  state.clientes=state.clientes.map(c=>({...c,establecimientos:(c.establecimientos||[]).map(e=>e.id===el.dataset.id?{...e,areas:[...(e.areas||[]),{id:uid(),nombre:n}]}:e)}));
  persist(); render();
};
actions.saveInv=function(){
  let d=$('#invDesc')?.value.trim(); if(!d)return;
  state.inventario.push({id:uid(),empresaId:empId(),tipo:$('#invTipo')?.value||'Equipo',codigo:$('#invCod')?.value||'',descripcion:d,serie:$('#invSerie')?.value||''});
  persist();render();
};

views.Dashboard=function(){
  ensureEmpresaFields(); let emp=activeEmpresa(), cs=clientesEmpresa(), qs=cotizacionesEmpresa(), inv=inventarioEmpresa();
  return `<section class="wrap"><h2>Dashboard</h2><div class="grid"><div class="card"><b>Empresa activa</b><h3>${emp.nombre||'-'}</h3></div><div class="card"><b>Clientes</b><h2>${cs.length}</h2></div><div class="card"><b>Cotizaciones</b><h2>${qs.length}</h2></div><div class="card"><b>Inventario</b><h2>${inv.length}</h2></div></div><p class="notice">Multiempresa real activo: clientes, cotizaciones, ejecución, actas, informes e inventario se filtran por la empresa activa.</p></section>`;
};
views.Clientes=function(){
  ensureEmpresaFields(); let cs=clientesEmpresa(); let c=cs[0];
  return `<section class="wrap">${back()}<h2>Clientes</h2><p class="notice"><b>Empresa activa:</b> ${activeEmpresa().nombre||'-'}. Los clientes, establecimientos y áreas se guardan en esta empresa.</p><div class="grid2"><input id="cliNom" placeholder="Nombre cliente"><input id="cliRuc" placeholder="RUC"></div><br><button class="btn green" data-act="saveCliente">+ Nuevo cliente</button><hr><h3>Establecimientos</h3><div class="grid2"><select id="cliSel">${cs.map(x=>`<option value="${x.id}">${x.nombre}</option>`).join('')}</select><input id="estNom" placeholder="Nuevo establecimiento"></div><br><button class="btn green" data-act="saveEst">Agregar establecimiento</button>${cs.length?cs.map(c=>`<div class="card"><h3>${c.nombre}</h3><small>RUC: ${c.ruc||'-'}</small>${(c.establecimientos||[]).map(e=>`<div class="card"><b>${e.nombre}</b><ul>${(e.areas||[]).map(a=>`<li>${a.nombre}</li>`).join('')||'<li class="muted">Sin áreas registradas</li>'}</ul><div class="grid2"><input id="area_${e.id}" placeholder="Área usuaria"><button class="btn" data-act="saveArea" data-id="${e.id}">Agregar área</button></div></div>`).join('')||'<p class="notice">Sin establecimientos registrados.</p>'}</div>`).join(''):'<p class="notice">No hay clientes registrados para la empresa activa.</p>'}</section>`;
};

function firstClienteEmpresa(){ return clientesEmpresa()[0]||{}; }
newDraft=function(){
  let c=firstClienteEmpresa(), e=c.establecimientos?.[0]||{}, a=e.areas?.[0]||{};
  return applyTax({id:uid(),numero:typeof currentNextDocNumber==='function'?currentNextDocNumber('cotizacion'):`COT-${new Date().getFullYear()}-${String(cotizacionesEmpresa().length+1).padStart(4,'0')}`,empresaId:empId(),clienteId:c.id||'',estId:e.id||'',areaId:a.id||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,equipos:[],acts:[],repuestos:[],subtotal:0,igv:0,total:0,igvIncluido:true,fecha:new Date().toISOString(),estado:'Cotización'});
};
cdata=function(){
  let cs=clientesEmpresa(); let c=cs.find(x=>x.id===draft.clienteId)||cs[0]||{};
  let e=(c.establecimientos||[]).find(x=>x.id===draft.estId)||c.establecimientos?.[0]||{};
  let a=(e.areas||[]).find(x=>x.id===draft.areaId)||e.areas?.[0]||{};
  return {c,ests:c.establecimientos||[],e,areas:e.areas||[],a};
};
const _quoteFormIntegridad = quoteForm;
quoteForm=function(){
  let cs=clientesEmpresa(); if(!cs.length)return `<section class="wrap">${back()}<h2>Nueva cotización</h2><p class="notice">Primero registra un cliente para la empresa activa: <b>${activeEmpresa().nombre||'-'}</b>.</p><button class="btn" onclick="tab='Clientes';render()">Ir a Clientes</button></section>`;
  let {ests,areas}=cdata(); applyTax(draft);
  return `<section class="wrap">${back()}<h2>Nueva cotización</h2><p class="notice"><b>Empresa activa:</b> ${activeEmpresa().nombre||'Sin empresa'}.</p><div class="grid"><select data-k="clienteId">${cs.map(x=>`<option value="${x.id}" ${x.id===draft.clienteId?'selected':''}>${x.nombre}</option>`).join('')}</select><select data-k="estId">${ests.map(x=>`<option value="${x.id}" ${x.id===draft.estId?'selected':''}>${x.nombre}</option>`).join('')}</select><select data-k="areaId">${areas.map(x=>`<option value="${x.id}" ${x.id===draft.areaId?'selected':''}>${x.nombre}</option>`).join('')}</select><select data-k="tipo">${['Mantenimiento preventivo','Mantenimiento correctivo','Calibración','Servicio + repuestos','Venta'].map(x=>`<option ${x===draft.tipo?'selected':''}>${x}</option>`).join('')}</select><select data-k="config">${Object.values(MODES).map(x=>`<option ${x===draft.config?'selected':''}>${x}</option>`).join('')}</select></div><div class="bar"><span class="pill">${draft.config}</span><b class="total">Total con IGV: ${money(draft.total)}</b></div>${totalsBar(draft)}${modeView()}<div class="bar"><button class="btn green" onclick="saveQuote()">Guardar y volver a lista</button><button class="btn" onclick="applyTax(draft);render()">Actualizar totales</button></div></section>`;
};
saveQuote=function(){
  let {c,e,a}=cdata(); if(!c.id)return alert('Selecciona un cliente válido de la empresa activa.');
  applyTax(draft); draft.empresaId=empId(); draft.clienteNombre=c.nombre||''; draft.establecimientoNombre=e.nombre||''; draft.areaNombre=a.nombre||'';
  let i=state.cotizaciones.findIndex(q=>q.id===draft.id); i>=0?state.cotizaciones[i]=clone(draft):state.cotizaciones.push(clone(draft));
  if(typeof bumpCorr==='function')bumpCorr('cotizacion');
  draft=null; persist(); alert('Cotización guardada en la empresa activa.'); render();
};
quoteList=function(){
  ensureEmpresaFields(); let qs=cotizacionesEmpresa();
  return `<section class="wrap">${back()}<h2>Cotizaciones</h2><p class="notice"><b>Empresa activa:</b> ${activeEmpresa().nombre||'-'}</p><button class="btn green" onclick="draft=newDraft();render()">+ Nueva cotización</button>${table(['N°','Cliente','Configuración','Estado','Subtotal','IGV','Total','Acciones'],qs.map(q=>[q.numero,q.clienteNombre,q.config,estadoBadge(q),money(q.subtotal),money(q.igv),money(q.total),`<div class="actions"><button class="btn" onclick="draft=clone(state.cotizaciones.find(x=>x.id==='${q.id}'));render()">Editar</button><button class="btn green" onclick="printQuote('${q.id}','COTIZACIÓN')">PDF</button><button class="btn" onclick="tab='Ejecución';localStorage.setItem('servitec_exec_qid','${q.id}');render()">Ejecutar</button><button class="btn danger" onclick="delQuote('${q.id}')">Eliminar</button></div>`]))}</section>`;
};

views.Inventario=function(){let inv=inventarioEmpresa();return `<section class="wrap">${back()}<h2>Inventario / QR / Código de barras</h2><p class="notice"><b>Empresa activa:</b> ${activeEmpresa().nombre||'-'}</p><div class="grid"><select id="invTipo"><option>Equipo</option><option>Repuesto</option><option>Accesorio</option></select><input id="invCod" placeholder="Código"><input id="invDesc" placeholder="Descripción"><input id="invSerie" placeholder="Serie"></div><br><button class="btn green" data-act="saveInv">Agregar</button>${table(['Tipo','Descripción','Código','QR','Barras'],inv.map(i=>[i.tipo,i.descripcion,i.codigo,`▣ ${i.codigo||i.id}`,`|||| ${i.codigo||i.id} ||||`]))}</section>`};
function selectedExecEmpresa(){ let qs=cotizacionesEmpresa().filter(q=>q.ordenNumero&&q.siaf); let saved=localStorage.getItem('servitec_exec_qid'); return qs.find(q=>q.id===saved)?.id || qs[0]?.id || ''; }
viewEjecucion=function(){let qs=cotizacionesEmpresa(); if(!qs.length)return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">No hay cotizaciones para la empresa activa.</p></section>`;let qid=selectedExecEmpresa()||qs[0].id;let q=state.cotizaciones.find(x=>x.id===qid)||qs[0];return `<section class="wrap">${back()}<h2>Ejecución controlada</h2><p class="notice"><b>Empresa activa:</b> ${activeEmpresa().nombre||'-'}. Solo se muestran cotizaciones de esta empresa.</p><select id="execSel" onchange="localStorage.setItem('servitec_exec_qid',this.value);render()">${qs.map(x=>`<option value="${x.id}" ${x.id===q.id?'selected':''}>${x.numero} - ${x.clienteNombre} - ${estadoCot(x)}</option>`).join('')}</select>${execGate(q)}</section>`};
docs=function(t){let key=t==='ACTA DE CONFORMIDAD'?'servitec_acta_qid':'servitec_informe_qid';let qs=cotizacionesEmpresa().filter(q=>q.ordenNumero&&q.siaf);let selected=localStorage.getItem(key);let q=qs.find(x=>x.id===selected)||qs[0];return `<section class="wrap">${back()}<h2>${t}</h2><p class="notice"><b>Empresa activa:</b> ${activeEmpresa().nombre||'-'}. Selecciona una ejecución de esta empresa.</p>${qs.length?`<select onchange="localStorage.setItem('${key}',this.value);render()">${qs.map(x=>`<option value="${x.id}" ${q&&x.id===q.id?'selected':''}>${x.numero} - ${x.clienteNombre} - ${x.ordenTipo||'Orden'} ${x.ordenNumero||''}</option>`).join('')}</select><div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${estadoBadge(q)}<br><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero||'-'} · <b>SIAF:</b> ${q.siaf||'-'}<br><button class="btn green" onclick="printQuote('${q.id}','${t}')">Generar PDF</button></div>`:'<p class="notice">No hay ejecuciones autorizadas para esta empresa.</p>'}</section>`;};
views.Actas=function(){return docs('ACTA DE CONFORMIDAD')};
views.Informes=function(){return docs('INFORME TÉCNICO')};

const _renderIntegridad = render;
render=function(){
  ensureActiveEmpresa(); ensureEmpresaFields();
  app.innerHTML=`<header class="top"><div><h1>${SERVITEC_VERSION_INTEGRIDAD}</h1><b>Multiempresa real + integridad Cliente → Establecimiento → Área + configuración en nube</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
ensureEmpresaFields();


/* =========================
   SERVITEC PRO V13.20.3 - EMPRESAS Y CONFIGURACIÓN REAL
   Saneamiento:
   - Empresas con selector único, no tarjetas infinitas.
   - Guardado explícito con botón.
   - Logo/firma/condiciones/correlativos quedan dentro de state.empresas y se persisten en Supabase app_state.
   - Mantiene intacta la ejecución masiva y documentos.
========================= */
const SERVITEC_VERSION_EMP_CONFIG='SERVITEC PRO V13.20.6 CAMPOS COMERCIALES GUIADOS';
let _pendingEmpFiles={};
function empresaEditId(){
  ensureActiveEmpresa();
  let saved=localStorage.getItem('servitec_empresa_edit_id');
  if(!(state.empresas||[]).some(e=>e.id===saved)) saved=state.activeEmpresaId || state.empresas?.[0]?.id || '';
  return saved;
}
function empresaEdit(){
  const id=empresaEditId();
  return (state.empresas||[]).find(e=>e.id===id) || state.empresas?.[0] || null;
}
function setEmpresaEdit(id){
  if(!id)return;
  localStorage.setItem('servitec_empresa_edit_id',id);
  _pendingEmpFiles={};
  render();
}
function getInputVal(id){return document.getElementById(id)?.value ?? '';}
function setPendingEmpFile(field,file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{_pendingEmpFiles[field]=reader.result; const el=document.getElementById('pending_'+field); if(el)el.textContent='Archivo listo para guardar ✅';};
  reader.readAsDataURL(file);
}
function guardarEmpresaSeleccionada(){
  let emp=empresaEdit();
  if(!emp)return alert('Selecciona una empresa.');
  emp.nombre=getInputVal('emp_nombre').trim() || emp.nombre || 'Empresa sin nombre';
  emp.ruc=getInputVal('emp_ruc').trim();
  emp.telefono=getInputVal('emp_telefono').trim();
  emp.correo=getInputVal('emp_correo').trim();
  emp.direccion=getInputVal('emp_direccion').trim();
  emp.gerente=getInputVal('emp_gerente').trim();
  emp.cargoGerente=getInputVal('emp_cargo').trim();
  emp.formaPago=getInputVal('emp_formaPago').trim();
  emp.tiempoEjecucion=getInputVal('emp_tiempoEjecucion').trim();
  emp.lugarServicio=getInputVal('emp_lugarServicio').trim();
  emp.validez=getInputVal('emp_validez').trim();
  emp.garantia=getInputVal('emp_garantia').trim();
  emp.observacionesCot=getInputVal('emp_observacionesCot');
  emp.prefijos=emp.prefijos||{}; emp.correlativos=emp.correlativos||{};
  ['cotizacion','acta','informe','os'].forEach(k=>{
    emp.prefijos[k]=getInputVal('emp_pref_'+k).trim().toUpperCase() || (emp.prefijos[k]||k.toUpperCase());
    emp.correlativos[k]=Number(getInputVal('emp_corr_'+k))||0;
  });
  if(_pendingEmpFiles.logo) emp.logo=_pendingEmpFiles.logo;
  if(_pendingEmpFiles.firma) emp.firma=_pendingEmpFiles.firma;
  empresaConfigDoc(emp);
  _pendingEmpFiles={};
  persist();
  alert('Empresa y configuración guardadas en la nube. Abre en PC/celular y debe verse igual.');
  render();
}
function nuevaEmpresaReal(){
  const e={id:uid(),nombre:'Nueva empresa',ruc:'',telefono:'',correo:'',direccion:'',gerente:'',cargoGerente:'GERENTE GENERAL',logo:'',firma:'',formaPago:'Según coordinación / contado comercial',tiempoEjecucion:'Según programación y disponibilidad del área usuaria',lugarServicio:'En establecimiento del cliente',validez:'15 días calendario',garantia:'Según alcance del servicio ejecutado',observacionesCot:'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.',prefijos:{cotizacion:'COT',acta:'ACT',informe:'INF',os:'OS'},correlativos:{cotizacion:0,acta:0,informe:0,os:0}};
  state.empresas=state.empresas||[]; state.empresas.push(e);
  localStorage.setItem('servitec_empresa_edit_id',e.id);
  persist(); render();
}
function activarEmpresaSeleccionada(){
  let emp=empresaEdit(); if(!emp)return;
  state.activeEmpresaId=emp.id;
  localStorage.removeItem('servitec_exec_qid');
  localStorage.removeItem('servitec_acta_qid');
  localStorage.removeItem('servitec_informe_qid');
  persist(); alert('Empresa activa cambiada. El sistema filtrará clientes, cotizaciones, ejecución, actas, informes e inventario.'); tab='Dashboard'; render();
}
function eliminarEmpresaSeleccionada(){
  let emp=empresaEdit(); if(!emp)return;
  if((state.empresas||[]).length<=1)return alert('Debe existir al menos una empresa.');
  if(!confirm('¿Eliminar esta empresa? No se eliminarán datos ya guardados de otras empresas.'))return;
  state.empresas=state.empresas.filter(e=>e.id!==emp.id);
  if(state.activeEmpresaId===emp.id)state.activeEmpresaId=state.empresas[0]?.id||'';
  localStorage.setItem('servitec_empresa_edit_id',state.activeEmpresaId||state.empresas[0]?.id||'');
  persist(); render();
}
function docConfigRows(emp){
  empresaConfigDoc(emp);
  return [['cotizacion','Cotización'],['acta','Acta'],['informe','Informe'],['os','Orden servicio']].map(([k,l])=>`<tr><td>${l}</td><td><input id="emp_pref_${k}" value="${esc(emp.prefijos[k]||'')}" placeholder="Prefijo"></td><td><input id="emp_corr_${k}" type="number" value="${Number(emp.correlativos[k]||0)}" placeholder="Último usado"></td><td><b>${fmtDoc(emp.prefijos[k]||k.toUpperCase(),Number(emp.correlativos[k]||0)+1)}</b></td></tr>`).join('');
}
views.Empresas=function(){
  ensureEmpresaFields();
  let emp=empresaEdit();
  if(!emp)return `<section class="wrap">${back()}<h2>Empresas</h2><p class="notice">No hay empresas registradas.</p><button class="btn green" onclick="nuevaEmpresaReal()">+ Nueva empresa</button></section>`;
  let active=activeEmpresa();
  return `<section class="wrap">${back()}<h2>Empresas</h2><p class="notice">Primero selecciona una empresa, edita y luego presiona <b>Guardar cambios</b>. Nada se guarda a medias.</p><div class="bar"><select onchange="setEmpresaEdit(this.value)">${(state.empresas||[]).map(e=>`<option value="${e.id}" ${e.id===emp.id?'selected':''}>${e.nombre||'Empresa sin nombre'}</option>`).join('')}</select><button class="btn green" onclick="nuevaEmpresaReal()">+ Nueva empresa</button><button class="btn" onclick="activarEmpresaSeleccionada()">Activar empresa</button><button class="btn danger" onclick="eliminarEmpresaSeleccionada()">Eliminar empresa</button></div><p class="notice"><b>Empresa activa:</b> ${active.nombre||'-'} ${active.id===emp.id?'<span class="badge green">editando activa</span>':'<span class="badge gray">editando otra empresa</span>'}</p><div class="card activeCompany"><h3>Datos de empresa</h3><div class="grid"><input id="emp_nombre" value="${esc(emp.nombre||'')}" placeholder="Razón social"><input id="emp_ruc" value="${esc(emp.ruc||'')}" placeholder="RUC"><input id="emp_telefono" value="${esc(emp.telefono||'')}" placeholder="Teléfono"><input id="emp_correo" value="${esc(emp.correo||'')}" placeholder="Correo"><input id="emp_direccion" value="${esc(emp.direccion||'')}" placeholder="Dirección"><input id="emp_gerente" value="${esc(emp.gerente||'')}" placeholder="Representante / gerente"><input id="emp_cargo" value="${esc(emp.cargoGerente||'GERENTE GENERAL')}" placeholder="Cargo del representante"></div><h3>Logo y firma</h3><div class="grid2"><label class="uploadBox"><b>Logo empresa</b><input type="file" accept="image/*" onchange="setPendingEmpFile('logo',this.files[0])"><span id="pending_logo">${emp.logo?'Logo guardado ✅':'Sin logo'}</span></label><label class="uploadBox"><b>Firma gerente</b><input type="file" accept="image/*" onchange="setPendingEmpFile('firma',this.files[0])"><span id="pending_firma">${emp.firma?'Firma guardada ✅':'Sin firma'}</span></label></div><h3>Condiciones comerciales para PDF</h3>
<p class="notice">Llena cada campo según la línea que se imprimirá en la cotización. Así evitamos confusiones en campo y oficina.</p>
<div class="grid">
  <label class="fieldHint"><b>Forma de pago</b><small>Se imprime en: FORMA DE PAGO</small><input id="emp_formaPago" value="${esc(emp.formaPago||'')}" placeholder="Ej.: Crédito comercial / Contado comercial"></label>
  <label class="fieldHint"><b>Tiempo de ejecución</b><small>Se imprime en: TIEMPO DE EJECUCIÓN</small><input id="emp_tiempoEjecucion" value="${esc(emp.tiempoEjecucion||'')}" placeholder="Ej.: Según programación y disponibilidad"></label>
  <label class="fieldHint"><b>Lugar del servicio</b><small>Se imprime en: LUGAR DEL SERVICIO</small><input id="emp_lugarServicio" value="${esc(emp.lugarServicio||'')}" placeholder="Ej.: En establecimiento del cliente"></label>
  <label class="fieldHint"><b>Validez de oferta</b><small>Se imprime en: VALIDEZ DE OFERTA</small><input id="emp_validez" value="${esc(emp.validez||'')}" placeholder="Ej.: 15 días calendario"></label>
  <label class="fieldHint"><b>Garantía</b><small>Se imprime en: GARANTÍA</small><input id="emp_garantia" value="${esc(emp.garantia||'')}" placeholder="Ej.: Según alcance del servicio"></label>
</div>
<label class="fieldHint full"><b>Observaciones comerciales</b><small>Se imprime en: OBSERVACIONES / condiciones adicionales</small><textarea id="emp_observacionesCot" rows="5" placeholder="Ej.: Incluye mano de obra especializada. No incluye repuestos...">${esc(emp.observacionesCot||'')}</textarea></label><h3>Correlativos por empresa</h3><p class="notice">Coloca el último número usado. El sistema generará el siguiente automáticamente.</p><div class="tableWrap"><table><thead><tr><th>Documento</th><th>Prefijo</th><th>Último usado</th><th>Siguiente</th></tr></thead><tbody>${docConfigRows(emp)}</tbody></table></div><div class="bar"><button class="btn green" onclick="guardarEmpresaSeleccionada()">Guardar cambios</button><button class="btn" onclick="activarEmpresaSeleccionada()">Activar esta empresa</button></div></div></section>`;
};
views.Configuración=function(){
  let emp=activeEmpresa(); empresaConfigDoc(emp);
  return `<section class="wrap">${back()}<h2>Configuración</h2><p class="notice">${cloud}</p><div class="card"><h3>Empresa activa</h3><p><b>${emp.nombre||'-'}</b></p><p>Los logos, firmas, condiciones comerciales y correlativos ahora se editan desde <b>Empresas</b> con botón Guardar cambios.</p><button class="btn green" onclick="tab='Empresas';render()">Ir a Empresas</button></div><div class="card"><h3>Limpieza operativa</h3><p>Conserva empresas y configuración empresarial. Limpia clientes, cotizaciones, ejecuciones, actas, informes e inventario de prueba.</p><button class="btn danger" onclick="limpiarOperacion&&limpiarOperacion()">Limpiar base operativa</button></div><p>Variables Vercel: VITE_SUPABASE_URL y VITE_SUPABASE_KEY.</p></section>`;
};
const _renderEmpConfig=render;
render=function(){
  ensureActiveEmpresa(); ensureEmpresaFields();
  app.innerHTML=`<header class="top"><div><h1>${SERVITEC_VERSION_EMP_CONFIG}</h1><b>Empresas con selector + botón guardar + configuración persistente en nube</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* =========================
   SERVITEC PRO V13.20.4 - PDF COTIZACIÓN PROFESIONAL
   Ajuste controlado: solo redefine la plantilla PDF de cotización y el rótulo de versión.
   No modifica ejecución, actas, informes, operaciones masivas ni relaciones de datos.
========================= */
const SERVITEC_VERSION_PDF='SERVITEC PRO V13.20.6 CAMPOS COMERCIALES GUIADOS';
function quoteDoc(q){
  applyTax(q);
  const emp=state.empresas.find(e=>e.id===q.empresaId)||activeEmpresa()||{};
  const cli=state.clientes.find(c=>c.id===q.clienteId)||{};
  const numero=q.numero||'COT-0000';
  const title='COTIZACION-'+numero;
  const obs=(emp.observacionesCot||'• Incluye mano de obra especializada.\n• No incluye repuestos, consumibles o trabajos adicionales no descritos.\n• Toda actividad adicional será cotizada por separado.')
    .split('\n').map(x=>safe(x)).join('<br>');
  return `<html><head><title>${title}</title><style>
  @page{size:A4;margin:14mm 16mm 14mm 16mm}
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#001b3f;font-size:11px;line-height:1.32}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #0f7f73;padding-bottom:10px;margin-bottom:12px;page-break-inside:avoid}
  .pdfLogo{max-height:58px;max-width:180px;margin-bottom:4px;object-fit:contain}
  .brand{font-size:24px;font-weight:900;color:#0f7f73;letter-spacing:.4px;line-height:1.12;text-transform:uppercase}
  .empresa{font-size:10.5px;line-height:1.25;color:#001b3f}
  .docTitle{text-align:right;min-width:210px}.docTitle h1{font-size:25px;margin:0 0 7px;color:#001b3f}.docTitle .num{font-size:15px;font-weight:900;color:#b30000}
  .box{background:#f7fbff;border:1px solid #d8e6f5;padding:9px 12px;border-radius:9px;margin:10px 0 11px;display:grid;grid-template-columns:1fr 1fr;gap:4px 22px;page-break-inside:avoid}
  .intro{margin:11px 0 9px;line-height:1.45;page-break-inside:avoid}
  .group{margin-top:10px;page-break-inside:avoid}.group h3{background:#e8f7f6;border-left:5px solid #0f7f73;padding:7px 9px;margin:10px 0 6px;color:#001b3f;text-transform:uppercase;font-size:13px}.small{font-size:10px;margin:0 0 5px}
  table{width:100%;border-collapse:collapse;margin:6px 0 8px;page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}th{background:#0f7f73;color:#fff;font-weight:800}th,td{border:1px solid #cfe0f2;padding:5px 6px;vertical-align:top}td:nth-child(1),td:nth-child(3){text-align:center}td:nth-child(4),td:nth-child(5){text-align:right}.subtotal{text-align:right;font-weight:800;margin:2px 0 9px}
  .summary{margin-left:auto;width:310px;border:1px solid #cfe0f2;border-radius:8px;overflow:hidden;page-break-inside:avoid}.summary div{display:flex;justify-content:space-between;padding:7px 9px;border-bottom:1px solid #cfe0f2}.summary div:last-child{border-bottom:0;background:#f6f8fb;color:#6b7280;font-size:16px;font-weight:900}
  .cond{border:1px solid #cfe0f2;border-radius:8px;padding:9px 11px;margin-top:11px;line-height:1.43;page-break-inside:avoid}.cond h3{margin:0 0 6px;color:#0f7f73;font-size:13px}.obs{margin-top:4px}
  .closing{margin-top:16px;page-break-inside:avoid;break-inside:avoid}.closing p{margin:0 0 20px}.firma{text-align:center;width:340px;margin-left:auto;margin-right:auto;page-break-inside:avoid;break-inside:avoid}.pdfFirma{max-height:68px;max-width:210px;display:block;margin:0 auto 4px;object-fit:contain}.firma .line{border-top:1px solid #001b3f;padding-top:7px;font-weight:800;line-height:1.25}
  .footer{margin-top:10px;font-size:9.5px;color:#456;display:flex;justify-content:space-between;page-break-inside:avoid}
  @media print{.closing{break-inside:avoid;page-break-inside:avoid}.cond,.summary,.head{break-inside:avoid;page-break-inside:avoid}}
  </style></head><body>
  <div class="head"><div>${emp.logo?`<img class="pdfLogo" src="${emp.logo}">`:''}<div class="brand">${emp.nombre||'SERVITEC PRO'}</div><div class="empresa">RUC ${emp.ruc||''} · ${emp.telefono||''} · ${emp.correo||''}<br>${emp.direccion||'Dirección comercial / oficina principal'}</div></div><div class="docTitle"><h1>COTIZACIÓN</h1><div class="num">N° ${numero}</div></div></div>
  <div class="box"><div><b>CLIENTE:</b> ${q.clienteNombre||''}</div><div><b>RUC:</b> ${cli.ruc||'-'}</div><div><b>ESTABLECIMIENTO:</b> ${q.establecimientoNombre||''}</div><div><b>ÁREA:</b> ${q.areaNombre||''}</div><div><b>FECHA:</b> ${new Date(q.fecha||Date.now()).toLocaleDateString('es-PE')}</div><div><b>TIPO:</b> ${q.tipo||''}</div></div>
  <p class="intro"><b>Estimados señores:</b><br>Por medio de la presente nos es grato saludarles y presentar nuestra propuesta económica para la ejecución del servicio solicitado.</p>
  ${cotizacionBody(q)}
  <div class="summary"><div><span>VALOR VENTA</span><b>${money(q.subtotal)}</b></div><div><span>I.G.V. 18%</span><b>${money(q.igv)}</b></div><div><span>TOTAL</span><b>${money(q.total)}</b></div></div>
  <div class="cond"><h3>CONDICIONES COMERCIALES</h3><b>Moneda:</b> Soles (S/).<br><b>Forma de pago:</b> ${emp.formaPago||'Según coordinación / contado comercial'}.<br><b>Tiempo de ejecución:</b> ${emp.tiempoEjecucion||'Según programación y disponibilidad del área usuaria'}.<br><b>Lugar del servicio:</b> ${emp.lugarServicio||'En establecimiento del cliente'}.<br><b>Validez de oferta:</b> ${emp.validez||'15 días calendario'}.<br><b>Garantía:</b> ${emp.garantia||'Según alcance del servicio ejecutado'}.<div class="obs"><b>Observaciones:</b><br>${obs}</div></div>
  <div class="closing"><p>Sin otro particular, quedamos de ustedes.</p><div class="firma">${emp.firma?`<img class="pdfFirma" src="${emp.firma}">`:''}<div class="line">${emp.gerente||'GERENTE GENERAL'}<br>${emp.cargoGerente||'GERENTE GENERAL'}<br>${emp.nombre||'SERVITEC PRO'}</div></div></div>
  <div class="footer"><span>${emp.telefono||''} · ${emp.correo||''}</span><span>${numero}</span></div>
  </body></html>`;
}
render=function(){
  ensureActiveEmpresa(); ensureEmpresaFields();
  app.innerHTML=`<header class="top"><div><h1>${SERVITEC_VERSION_PDF}</h1><b>Campos comerciales guiados + PDF cotización profesional + configuración empresarial</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* =========================
   SERVITEC PRO V13.20.7 - CLIENTES JERÁRQUICOS
   Corrección real:
   - Cliente con selector + Nuevo/Guardar/Eliminar.
   - Establecimiento ligado al cliente seleccionado.
   - Área usuaria ligada al establecimiento seleccionado.
   - Todo filtrado por empresa activa.
========================= */
const SERVITEC_VERSION_CLIENTES='SERVITEC PRO V13.20.7 CLIENTES JERÁRQUICOS';

function _keyCli(){return 'servitec_cliente_sel_'+empId();}
function _keyEst(cid){return 'servitec_est_sel_'+empId()+'_'+(cid||'none');}
function _keyArea(eid){return 'servitec_area_sel_'+empId()+'_'+(eid||'none');}
function _setLS(k,v){try{localStorage.setItem(k,v||'')}catch(e){}}
function _getLS(k){try{return localStorage.getItem(k)||''}catch(e){return ''}}

function _clientesActuales(){ensureEmpresaFields&&ensureEmpresaFields(); return clientesEmpresa?clientesEmpresa():(state.clientes||[]).filter(c=>(c.empresaId||empId())===empId());}
function _clienteSeleccionado(){
  const cs=_clientesActuales();
  let id=_getLS(_keyCli());
  if(id==='__new__') return null;
  let c=cs.find(x=>x.id===id)||cs[0]||null;
  if(c) _setLS(_keyCli(),c.id);
  return c;
}
function _establecimientoSeleccionado(c){
  let ests=(c&&c.establecimientos)||[];
  let id=_getLS(_keyEst(c&&c.id));
  if(id==='__new__') return null;
  let e=ests.find(x=>x.id===id)||ests[0]||null;
  if(e) _setLS(_keyEst(c.id),e.id);
  return e;
}
function _areaSeleccionada(e){
  let areas=(e&&e.areas)||[];
  let id=_getLS(_keyArea(e&&e.id));
  if(id==='__new__') return null;
  let a=areas.find(x=>x.id===id)||areas[0]||null;
  if(a) _setLS(_keyArea(e.id),a.id);
  return a;
}
function _clienteById(id){return (state.clientes||[]).find(c=>c.id===id)}
function _updateCliente(id, fn){
  state.clientes=(state.clientes||[]).map(c=>c.id===id?fn(c):c);
}

function nuevoClienteJer(){_setLS(_keyCli(),'__new__'); render();}
function seleccionarClienteJer(v){_setLS(_keyCli(),v); render();}
function guardarClienteJer(){
  const selected=_getLS(_keyCli());
  const nombre=($('#cli_nombre')?.value||'').trim();
  if(!nombre)return alert('Ingresa el nombre o razón social del cliente.');
  const data={
    nombre,
    ruc:$('#cli_ruc')?.value||'',
    direccion:$('#cli_direccion')?.value||'',
    telefono:$('#cli_telefono')?.value||'',
    correo:$('#cli_correo')?.value||'',
    responsable:$('#cli_responsable')?.value||''
  };
  if(selected==='__new__' || !_clienteById(selected)){
    const id=uid();
    state.clientes.push({id,empresaId:empId(),...data,establecimientos:[]});
    _setLS(_keyCli(),id);
  }else{
    _updateCliente(selected,c=>({...c,empresaId:c.empresaId||empId(),...data,establecimientos:c.establecimientos||[]}));
  }
  persist(); render();
}
function eliminarClienteJer(){
  const c=_clienteSeleccionado(); if(!c)return;
  if(!confirm('¿Eliminar cliente y todos sus establecimientos/áreas?'))return;
  state.clientes=(state.clientes||[]).filter(x=>x.id!==c.id);
  _setLS(_keyCli(),'');
  persist(); render();
}

function nuevoEstJer(){const c=_clienteSeleccionado(); if(!c)return alert('Primero selecciona o guarda un cliente.'); _setLS(_keyEst(c.id),'__new__'); render();}
function seleccionarEstJer(v){const c=_clienteSeleccionado(); if(c)_setLS(_keyEst(c.id),v); render();}
function guardarEstJer(){
  const c=_clienteSeleccionado(); if(!c)return alert('Primero selecciona un cliente.');
  const selected=_getLS(_keyEst(c.id));
  const nombre=($('#est_nombre')?.value||'').trim();
  if(!nombre)return alert('Ingresa el nombre del establecimiento.');
  const data={nombre,direccion:$('#est_direccion')?.value||'',responsable:$('#est_responsable')?.value||'',telefono:$('#est_telefono')?.value||'',correo:$('#est_correo')?.value||''};
  _updateCliente(c.id,cli=>{
    let ests=cli.establecimientos||[];
    if(selected==='__new__' || !ests.find(e=>e.id===selected)){
      const id=uid(); _setLS(_keyEst(cli.id),id);
      ests=[...ests,{id,...data,areas:[]}];
    }else{
      ests=ests.map(e=>e.id===selected?{...e,...data,areas:e.areas||[]}:e);
    }
    return {...cli,establecimientos:ests};
  });
  persist(); render();
}
function eliminarEstJer(){
  const c=_clienteSeleccionado(); const e=_establecimientoSeleccionado(c); if(!c||!e)return;
  if(!confirm('¿Eliminar establecimiento y sus áreas usuarias?'))return;
  _updateCliente(c.id,cli=>({...cli,establecimientos:(cli.establecimientos||[]).filter(x=>x.id!==e.id)}));
  _setLS(_keyEst(c.id),'');
  persist(); render();
}

function nuevaAreaJer(){const c=_clienteSeleccionado(); const e=_establecimientoSeleccionado(c); if(!e)return alert('Primero selecciona o guarda un establecimiento.'); _setLS(_keyArea(e.id),'__new__'); render();}
function seleccionarAreaJer(v){const c=_clienteSeleccionado(); const e=_establecimientoSeleccionado(c); if(e)_setLS(_keyArea(e.id),v); render();}
function guardarAreaJer(){
  const c=_clienteSeleccionado(); const e=_establecimientoSeleccionado(c); if(!c||!e)return alert('Primero selecciona un establecimiento.');
  const selected=_getLS(_keyArea(e.id));
  const nombre=($('#area_nombre')?.value||'').trim();
  if(!nombre)return alert('Ingresa el nombre del área usuaria.');
  const data={nombre,responsable:$('#area_responsable')?.value||'',cargo:$('#area_cargo')?.value||'',dni:$('#area_dni')?.value||'',telefono:$('#area_telefono')?.value||'',correo:$('#area_correo')?.value||''};
  _updateCliente(c.id,cli=>{
    const ests=(cli.establecimientos||[]).map(est=>{
      if(est.id!==e.id)return est;
      let areas=est.areas||[];
      if(selected==='__new__' || !areas.find(a=>a.id===selected)){
        const id=uid(); _setLS(_keyArea(est.id),id);
        areas=[...areas,{id,...data}];
      }else{
        areas=areas.map(a=>a.id===selected?{...a,...data}:a);
      }
      return {...est,areas};
    });
    return {...cli,establecimientos:ests};
  });
  persist(); render();
}
function eliminarAreaJer(){
  const c=_clienteSeleccionado(); const e=_establecimientoSeleccionado(c); const a=_areaSeleccionada(e); if(!c||!e||!a)return;
  if(!confirm('¿Eliminar área usuaria?'))return;
  _updateCliente(c.id,cli=>({...cli,establecimientos:(cli.establecimientos||[]).map(est=>est.id===e.id?{...est,areas:(est.areas||[]).filter(x=>x.id!==a.id)}:est)}));
  _setLS(_keyArea(e.id),'');
  persist(); render();
}

views.Clientes=function(){
  ensureEmpresaFields&&ensureEmpresaFields();
  const cs=_clientesActuales();
  const c=_clienteSeleccionado();
  const cNew=_getLS(_keyCli())==='__new__' || !c;
  const ests=(c&&c.establecimientos)||[];
  const e=c?_establecimientoSeleccionado(c):null;
  const eNew=c && (_getLS(_keyEst(c.id))==='__new__' || !e);
  const areas=(e&&e.areas)||[];
  const a=e?_areaSeleccionada(e):null;
  const aNew=e && (_getLS(_keyArea(e.id))==='__new__' || !a);
  const cliOptions=`<option value="__new__" ${cNew?'selected':''}>+ Nuevo cliente</option>`+cs.map(x=>`<option value="${x.id}" ${c&&x.id===c.id?'selected':''}>${esc(x.nombre)}</option>`).join('');
  const estOptions=c?`<option value="__new__" ${eNew?'selected':''}>+ Nuevo establecimiento</option>`+ests.map(x=>`<option value="${x.id}" ${e&&x.id===e.id?'selected':''}>${esc(x.nombre)}</option>`).join(''):'';
  const areaOptions=e?`<option value="__new__" ${aNew?'selected':''}>+ Nueva área usuaria</option>`+areas.map(x=>`<option value="${x.id}" ${a&&x.id===a.id?'selected':''}>${esc(x.nombre)}</option>`).join(''):'';
  const rows=cs.map(x=>`<tr onclick="seleccionarClienteJer('${x.id}')" style="cursor:pointer"><td><b>${esc(x.nombre)}</b></td><td>${esc(x.ruc||'-')}</td><td>${(x.establecimientos||[]).length}</td><td>${(x.establecimientos||[]).reduce((n,e)=>n+(e.areas||[]).length,0)}</td></tr>`).join('');
  return `<section class="wrap">${back()}<h2>Clientes</h2>
  <p class="notice"><b>Empresa activa:</b> ${esc(activeEmpresa().nombre||'-')}. Cliente → establecimiento → área usuaria quedan guardados dentro de esta empresa.</p>
  <div class="card">
    <h3>Cliente</h3>
    <div class="grid2"><label class="fieldHint"><b>Cliente seleccionado</b><small>Selecciona un cliente para editarlo o crea uno nuevo.</small><select onchange="seleccionarClienteJer(this.value)">${cliOptions}</select></label></div>
    <div class="bar"><button class="btn" onclick="nuevoClienteJer()">Nuevo</button><button class="btn green" onclick="guardarClienteJer()">Guardar</button><button class="btn danger" onclick="eliminarClienteJer()">Eliminar</button></div>
    <div class="grid">
      <label class="fieldHint"><b>Nombre / razón social</b><small>Se usará en cotización, acta e informe.</small><input id="cli_nombre" value="${esc(cNew?'':(c.nombre||''))}" placeholder="Ej.: Red de Salud Cajabamba"></label>
      <label class="fieldHint"><b>RUC</b><small>Documento tributario del cliente.</small><input id="cli_ruc" value="${esc(cNew?'':(c.ruc||''))}" placeholder="RUC"></label>
      <label class="fieldHint"><b>Dirección</b><small>Dirección fiscal o institucional.</small><input id="cli_direccion" value="${esc(cNew?'':(c.direccion||''))}" placeholder="Dirección"></label>
      <label class="fieldHint"><b>Teléfono</b><small>Contacto general del cliente.</small><input id="cli_telefono" value="${esc(cNew?'':(c.telefono||''))}" placeholder="Teléfono"></label>
      <label class="fieldHint"><b>Correo</b><small>Correo general del cliente.</small><input id="cli_correo" value="${esc(cNew?'':(c.correo||''))}" placeholder="Correo"></label>
      <label class="fieldHint"><b>Responsable</b><small>Responsable administrativo o contacto principal.</small><input id="cli_responsable" value="${esc(cNew?'':(c.responsable||''))}" placeholder="Responsable"></label>
    </div>
  </div>

  <div class="card">
    <h3>Establecimientos del cliente</h3>
    ${c?`<div class="grid2"><label class="fieldHint"><b>Establecimiento seleccionado</b><small>Depende del cliente seleccionado.</small><select onchange="seleccionarEstJer(this.value)">${estOptions}</select></label></div>
    <div class="bar"><button class="btn" onclick="nuevoEstJer()">Nuevo establecimiento</button><button class="btn green" onclick="guardarEstJer()">Guardar establecimiento</button><button class="btn danger" onclick="eliminarEstJer()">Eliminar establecimiento</button></div>
    <div class="grid">
      <label class="fieldHint"><b>Nombre establecimiento</b><small>Ej.: Hospital Cajabamba, CS Malcas, Sede Principal.</small><input id="est_nombre" value="${esc(eNew?'':(e.nombre||''))}" placeholder="Nombre establecimiento"></label>
      <label class="fieldHint"><b>Dirección</b><small>Dirección del establecimiento.</small><input id="est_direccion" value="${esc(eNew?'':(e.direccion||''))}" placeholder="Dirección establecimiento"></label>
      <label class="fieldHint"><b>Responsable</b><small>Responsable del establecimiento.</small><input id="est_responsable" value="${esc(eNew?'':(e.responsable||''))}" placeholder="Responsable"></label>
      <label class="fieldHint"><b>Teléfono</b><small>Teléfono del establecimiento.</small><input id="est_telefono" value="${esc(eNew?'':(e.telefono||''))}" placeholder="Teléfono"></label>
      <label class="fieldHint"><b>Correo</b><small>Correo del establecimiento.</small><input id="est_correo" value="${esc(eNew?'':(e.correo||''))}" placeholder="Correo"></label>
    </div>`:`<p class="notice">Primero guarda un cliente para agregar establecimientos.</p>`}
  </div>

  <div class="card">
    <h3>Áreas usuarias del establecimiento</h3>
    ${e?`<div class="grid2"><label class="fieldHint"><b>Área usuaria seleccionada</b><small>Depende del establecimiento seleccionado.</small><select onchange="seleccionarAreaJer(this.value)">${areaOptions}</select></label></div>
    <div class="bar"><button class="btn" onclick="nuevaAreaJer()">Nueva área</button><button class="btn green" onclick="guardarAreaJer()">Guardar área</button><button class="btn danger" onclick="eliminarAreaJer()">Eliminar área</button></div>
    <div class="grid">
      <label class="fieldHint"><b>Nombre del área</b><small>Ej.: Odontología, Laboratorio, Farmacia, UCI.</small><input id="area_nombre" value="${esc(aNew?'':(a.nombre||''))}" placeholder="Nombre área usuaria"></label>
      <label class="fieldHint"><b>Responsable del área</b><small>Aparece en acta de conformidad.</small><input id="area_responsable" value="${esc(aNew?'':(a.responsable||''))}" placeholder="Responsable"></label>
      <label class="fieldHint"><b>Cargo</b><small>Cargo del responsable.</small><input id="area_cargo" value="${esc(aNew?'':(a.cargo||''))}" placeholder="Cargo"></label>
      <label class="fieldHint"><b>DNI</b><small>DNI del responsable.</small><input id="area_dni" value="${esc(aNew?'':(a.dni||''))}" placeholder="DNI"></label>
      <label class="fieldHint"><b>Teléfono</b><small>Contacto del responsable.</small><input id="area_telefono" value="${esc(aNew?'':(a.telefono||''))}" placeholder="Teléfono"></label>
      <label class="fieldHint"><b>Correo</b><small>Correo del responsable.</small><input id="area_correo" value="${esc(aNew?'':(a.correo||''))}" placeholder="Correo"></label>
    </div>`:`<p class="notice">Primero selecciona o guarda un establecimiento para agregar áreas usuarias.</p>`}
  </div>

  <h3>Lista de clientes de la empresa activa</h3>
  <div class="tableWrap"><table><thead><tr><th>Cliente</th><th>RUC</th><th>Establecimientos</th><th>Áreas</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Sin clientes registrados.</td></tr>'}</tbody></table></div>
  </section>`;
};

render=function(){
  ensureActiveEmpresa(); ensureEmpresaFields();
  app.innerHTML=`<header class="top"><div><h1>${SERVITEC_VERSION_CLIENTES}</h1><b>Base operativa: empresas/configuración + clientes jerárquicos + PDF cotización profesional</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* =========================
   SERVITEC PRO V13.20.8 - COTIZACIONES CON ACCIONES SUPERIORES
   - Lista compacta.
   - Botones Nueva / Editar / PDF / Ejecutar / Eliminar arriba.
   - Acción sobre cotización seleccionada.
========================= */
const SERVITEC_VERSION_COTIZACIONES='SERVITEC PRO V13.20.8 COTIZACIONES ORDENADAS';

function _keyCot(){return 'servitec_cot_sel_'+empId();}
function _setCotSel(id){try{localStorage.setItem(_keyCot(),id||'')}catch(e){}}
function _getCotSel(){try{return localStorage.getItem(_keyCot())||''}catch(e){return ''}}
function _cotsActuales(){return cotizacionesEmpresa?cotizacionesEmpresa():(state.cotizaciones||[]).filter(q=>(q.empresaId||q.empresa_id||empId())===empId());}
function _cotSel(){
  const qs=_cotsActuales();
  let id=_getCotSel();
  let q=qs.find(x=>x.id===id)||qs[0]||null;
  if(q)_setCotSel(q.id);
  return q;
}
function seleccionarCotizacion(id){_setCotSel(id);render();}
function nuevaCotizacionTop(){draft={tipo:'cotizacion'}; if(typeof nuevaCotizacion==='function') return nuevaCotizacion(); tab='Cotizaciones'; render();}
function editarCotizacionTop(){const q=_cotSel(); if(!q)return alert('Selecciona una cotización.'); if(typeof editarCotizacion==='function')return editarCotizacion(q.id); alert('Función editar no disponible en esta versión.');}
function pdfCotizacionTop(){const q=_cotSel(); if(!q)return alert('Selecciona una cotización.'); if(typeof pdfCotizacion==='function')return pdfCotizacion(q.id); if(typeof quoteDoc==='function'){const w=window.open('','_blank'); w.document.write(quoteDoc(q)); w.document.close(); return;} alert('Función PDF no disponible.');}
function ejecutarCotizacionTop(){const q=_cotSel(); if(!q)return alert('Selecciona una cotización.'); if(typeof ejecutarCotizacion==='function')return ejecutarCotizacion(q.id); if(typeof autorizarEjecucion==='function')return autorizarEjecucion(q.id); alert('Función ejecutar no disponible.');}
function eliminarCotizacionTop(){const q=_cotSel(); if(!q)return alert('Selecciona una cotización.'); if(!confirm('¿Eliminar cotización '+(q.codigo||q.numero||'')+'?'))return; state.cotizaciones=(state.cotizaciones||[]).filter(x=>x.id!==q.id); _setCotSel(''); persist(); render();}
function _fmtMoney(n){n=Number(n||0); return 'S/ '+n.toFixed(2);}
function _cotCodigo(q){return q.codigo||q.numero||q.nro||'COT-'+(q.id||'').slice(0,6);}
function _cotCliente(q){
  if(q.cliente)return q.cliente;
  const c=(state.clientes||[]).find(x=>x.id===(q.clienteId||q.cliente_id));
  return c?c.nombre:'-';
}
function _cotConfig(q){return q.configuracion||q.modo||q.tipoConfiguracion||q.tipo||'-';}
function _cotEstado(q){return q.estado||'Borrador';}
function _cotTotal(q){return Number(q.total||q.totalFinal||q.importe||0);}
function _cotSubtotal(q){return Number(q.subtotal||0);}
function _cotIgv(q){return Number(q.igv||0);}

views.Cotizaciones=function(){
  ensureEmpresaFields&&ensureEmpresaFields();
  const qs=_cotsActuales();
  const q=_cotSel();
  const options=qs.map(x=>`<option value="${x.id}" ${q&&x.id===q.id?'selected':''}>${esc(_cotCodigo(x))} - ${esc(_cotCliente(x))} - ${_fmtMoney(_cotTotal(x))}</option>`).join('');
  const rows=qs.map(x=>`<tr onclick="seleccionarCotizacion('${x.id}')" class="${q&&q.id===x.id?'selectedRow':''}" style="cursor:pointer">
    <td><b>${esc(_cotCodigo(x))}</b></td>
    <td>${esc(_cotCliente(x))}</td>
    <td>${esc(_cotConfig(x))}</td>
    <td><span class="pill">${esc(_cotEstado(x))}</span></td>
    <td>${_fmtMoney(_cotSubtotal(x))}</td>
    <td>${_fmtMoney(_cotIgv(x))}</td>
    <td><b>${_fmtMoney(_cotTotal(x))}</b></td>
  </tr>`).join('');
  return `<section class="wrap">${back()}<h2>Cotizaciones</h2>
  <p class="notice"><b>Empresa activa:</b> ${esc(activeEmpresa().nombre||'-')}</p>
  <div class="card">
    <h3>Gestión de cotizaciones</h3>
    <div class="grid2">
      <label class="fieldHint"><b>Cotización seleccionada</b><small>Selecciona una cotización y luego usa los botones superiores.</small>
        <select onchange="seleccionarCotizacion(this.value)">${options||'<option>Sin cotizaciones</option>'}</select>
      </label>
    </div>
    <div class="bar">
      <button class="btn" onclick="nuevaCotizacionTop()">Nueva</button>
      <button class="btn" onclick="editarCotizacionTop()" ${q?'':'disabled'}>Editar</button>
      <button class="btn green" onclick="pdfCotizacionTop()" ${q?'':'disabled'}>PDF</button>
      <button class="btn" onclick="ejecutarCotizacionTop()" ${q?'':'disabled'}>Ejecutar</button>
      <button class="btn danger" onclick="eliminarCotizacionTop()" ${q?'':'disabled'}>Eliminar</button>
    </div>
  </div>
  <div class="tableWrap"><table>
    <thead><tr><th>N°</th><th>Cliente</th><th>Configuración</th><th>Estado</th><th>Subtotal</th><th>IGV</th><th>Total</th></tr></thead>
    <tbody>${rows||'<tr><td colspan="7">Sin cotizaciones registradas para esta empresa.</td></tr>'}</tbody>
  </table></div>
  </section>`;
};

render=function(){
  ensureActiveEmpresa(); ensureEmpresaFields();
  const version = (tab==='Cotizaciones') ? SERVITEC_VERSION_COTIZACIONES : (typeof SERVITEC_VERSION_CLIENTES!=='undefined'?SERVITEC_VERSION_CLIENTES:'SERVITEC PRO V13.20.8 COTIZACIONES ORDENADAS');
  app.innerHTML=`<header class="top"><div><h1>${version}</h1><b>Base operativa: clientes jerárquicos + cotizaciones con acciones superiores + PDF profesional</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* ============================================================
   SERVITEC PRO V13.21.0 ADMINISTRADOR ESTABLE
   Capa consolidada del modelo administrador.
   Objetivo: no seguir dependiendo de renders antiguos acumulados.
   Alcance:
   - Header único V13.21.0.
   - Empresas: selector + acciones + configuración guiada.
   - Clientes: cliente → establecimiento → área.
   - Cotizaciones: selector/lista compacta + acciones superiores.
   - Cotización comercial sin serie/patrimonial/ubicación.
   Nota: mantiene persistencia Supabase vía persist()/saveCloud() existente.
============================================================ */
const VERSION_ADMIN_ESTABLE = 'SERVITEC PRO V13.21.0 ADMINISTRADOR ESTABLE';

function s21_empId(){
  if(typeof empId==='function') return empId();
  if(!state.activeEmpresaId && state.empresas && state.empresas[0]) state.activeEmpresaId=state.empresas[0].id;
  return state.activeEmpresaId || (state.empresas&&state.empresas[0]&&state.empresas[0].id) || '';
}
function s21_activeEmpresa(){
  const id=s21_empId();
  return (state.empresas||[]).find(e=>e.id===id) || (state.empresas||[])[0] || {};
}
function s21_escape(v){return (typeof esc==='function') ? esc(v) : String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');}
function s21_money(n){return (typeof money==='function') ? money(n) : ('S/ '+(Number(n)||0).toFixed(2));}
function s21_uid(){return (typeof uid==='function') ? uid() : Math.random().toString(36).slice(2,9);}
function s21_ls(k,v){try{ if(v===undefined) return localStorage.getItem(k)||''; localStorage.setItem(k,v||''); }catch(e){}}
function s21_filterByEmpresa(arr){const id=s21_empId(); return (arr||[]).filter(x=>(x.empresaId||x.empresa_id||id)===id);}
function s21_ensureEmpresa(e){
  e.correlativoCotizacion = Number(e.correlativoCotizacion || e.corrCot || 1);
  e.correlativoActa = Number(e.correlativoActa || e.corrActa || 1);
  e.correlativoInforme = Number(e.correlativoInforme || e.corrInf || 1);
  e.correlativoOS = Number(e.correlativoOS || e.corrOS || 1);
  e.moneda = e.moneda || 'Soles (S/)';
  e.formaPago = e.formaPago || 'Crédito comercial';
  e.tiempoEjecucion = e.tiempoEjecucion || 'Según programación y disponibilidad';
  e.lugarServicio = e.lugarServicio || 'En establecimiento del cliente';
  e.validez = e.validez || '15 días calendario';
  e.garantia = e.garantia || 'Según alcance del servicio';
  e.observacionesCot = e.observacionesCot || 'Incluye mano de obra especializada.\nNo incluye repuestos, consumibles o trabajos adicionales no descritos.';
  return e;
}
function s21_allEmpresas(){state.empresas=state.empresas||[]; state.empresas.forEach(s21_ensureEmpresa); return state.empresas;}
function s21_setActiveEmpresa(id){
  state.activeEmpresaId=id;
  try{
    localStorage.removeItem('servitec_exec_qid');
    localStorage.removeItem('servitec_cot_sel_'+id);
  }catch(e){}
  persist(); render();
}

/* ---------- EMPRESAS ---------- */
function s21_empSelKey(){return 'servitec_emp_edit_sel';}
function s21_empSelected(){
  s21_allEmpresas();
  let id=s21_ls(s21_empSelKey());
  let e=(state.empresas||[]).find(x=>x.id===id) || s21_activeEmpresa();
  if(e) s21_ls(s21_empSelKey(),e.id);
  return e;
}
function s21_selectEmpresaEdit(id){s21_ls(s21_empSelKey(),id); render();}
function s21_newEmpresa(){
  const id=s21_uid();
  const e=s21_ensureEmpresa({id,nombre:'Nueva empresa',ruc:'',telefono:'',correo:'',direccion:'',gerente:'',cargoGerente:'',logo:'',firma:''});
  state.empresas.push(e); s21_ls(s21_empSelKey(),id); state.activeEmpresaId=id; persist(); render();
}
function s21_saveEmpresa(){
  const e=s21_empSelected(); if(!e)return;
  const get=id=>(document.getElementById(id)?.value||'');
  Object.assign(e,{
    nombre:get('s21_emp_nombre'), ruc:get('s21_emp_ruc'), telefono:get('s21_emp_telefono'),
    correo:get('s21_emp_correo'), direccion:get('s21_emp_direccion'), gerente:get('s21_emp_gerente'),
    cargoGerente:get('s21_emp_cargo'), moneda:get('s21_emp_moneda'),
    formaPago:get('s21_emp_formaPago'), tiempoEjecucion:get('s21_emp_tiempo'),
    lugarServicio:get('s21_emp_lugar'), validez:get('s21_emp_validez'),
    garantia:get('s21_emp_garantia'), observacionesCot:get('s21_emp_obs'),
    banco:get('s21_emp_banco'), cuenta:get('s21_emp_cuenta'), cci:get('s21_emp_cci'),
    contactoComercial:get('s21_emp_contacto'), telefonoComercial:get('s21_emp_tel_contacto'),
    correlativoCotizacion:Number(get('s21_corr_cot')||1), correlativoActa:Number(get('s21_corr_acta')||1),
    correlativoInforme:Number(get('s21_corr_inf')||1), correlativoOS:Number(get('s21_corr_os')||1)
  });
  persist(); alert('Empresa guardada correctamente.'); render();
}
function s21_deleteEmpresa(){
  const e=s21_empSelected(); if(!e)return;
  if((state.empresas||[]).length<=1)return alert('Debe existir al menos una empresa.');
  if(!confirm('¿Eliminar empresa seleccionada?'))return;
  state.empresas=state.empresas.filter(x=>x.id!==e.id);
  state.activeEmpresaId=state.empresas[0].id;
  s21_ls(s21_empSelKey(),state.activeEmpresaId);
  persist(); render();
}
function s21_fileEmpresa(field,input){
  const e=s21_empSelected(); const file=input.files&&input.files[0]; if(!e||!file)return;
  const r=new FileReader(); r.onload=()=>{e[field]=r.result; persist(); render();}; r.readAsDataURL(file);
}
views.Empresas=function(){
  const es=s21_allEmpresas(); const e=s21_empSelected()||{};
  return `<section class="wrap">${back()}<h2>Empresas</h2>
  <p class="notice"><b>Empresa activa:</b> ${s21_escape(s21_activeEmpresa().nombre||'-')}. Edita una empresa y pulsa Guardar cambios para sincronizar en nube.</p>
  <div class="card">
    <label class="fieldHint"><b>Empresa seleccionada</b><small>Selecciona la empresa que deseas editar.</small>
      <select onchange="s21_selectEmpresaEdit(this.value)">${es.map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select>
    </label>
    <div class="bar">
      <button class="btn" onclick="s21_newEmpresa()">Nueva</button>
      <button class="btn green" onclick="s21_saveEmpresa()">Guardar cambios</button>
      <button class="btn" onclick="s21_setActiveEmpresa('${e.id||''}')">Activar empresa</button>
      <button class="btn danger" onclick="s21_deleteEmpresa()">Eliminar</button>
    </div>
  </div>
  <div class="card">
    <h3>Datos de empresa</h3>
    <div class="grid">
      <label class="fieldHint"><b>Razón social</b><small>Se imprime en cabecera del PDF.</small><input id="s21_emp_nombre" value="${s21_escape(e.nombre||'')}"></label>
      <label class="fieldHint"><b>RUC</b><small>Se imprime en cabecera del PDF.</small><input id="s21_emp_ruc" value="${s21_escape(e.ruc||'')}"></label>
      <label class="fieldHint"><b>Teléfono</b><small>Teléfono general de empresa.</small><input id="s21_emp_telefono" value="${s21_escape(e.telefono||'')}"></label>
      <label class="fieldHint"><b>Correo</b><small>Correo general de empresa.</small><input id="s21_emp_correo" value="${s21_escape(e.correo||'')}"></label>
      <label class="fieldHint"><b>Dirección</b><small>Dirección comercial o fiscal.</small><input id="s21_emp_direccion" value="${s21_escape(e.direccion||'')}"></label>
      <label class="fieldHint"><b>Representante / firmante</b><small>Nombre que aparece bajo la firma.</small><input id="s21_emp_gerente" value="${s21_escape(e.gerente||'')}"></label>
      <label class="fieldHint"><b>Cargo del firmante</b><small>Ej.: Gerente General.</small><input id="s21_emp_cargo" value="${s21_escape(e.cargoGerente||'')}"></label>
    </div>
    <div class="grid2">
      <label class="uploadBox"><b>Logo empresa</b><small>Se imprime en cotización, acta e informe.</small><input type="file" accept="image/*" onchange="s21_fileEmpresa('logo',this)">${e.logo?'<span>Logo cargado ✅</span>':'<span>Sin logo</span>'}</label>
      <label class="uploadBox"><b>Firma</b><small>Se imprime en documentos comerciales.</small><input type="file" accept="image/*" onchange="s21_fileEmpresa('firma',this)">${e.firma?'<span>Firma cargada ✅</span>':'<span>Sin firma</span>'}</label>
    </div>
  </div>
  <div class="card">
    <h3>Condiciones comerciales para PDF</h3>
    <div class="grid">
      <label class="fieldHint"><b>Moneda</b><small>Se imprime en: MONEDA.</small><input id="s21_emp_moneda" value="${s21_escape(e.moneda||'Soles (S/)')}"></label>
      <label class="fieldHint"><b>Forma de pago</b><small>Se imprime en: FORMA DE PAGO.</small><input id="s21_emp_formaPago" value="${s21_escape(e.formaPago||'')}"></label>
      <label class="fieldHint"><b>Tiempo de ejecución</b><small>Se imprime en: TIEMPO DE EJECUCIÓN.</small><input id="s21_emp_tiempo" value="${s21_escape(e.tiempoEjecucion||'')}"></label>
      <label class="fieldHint"><b>Lugar del servicio</b><small>Se imprime en: LUGAR DEL SERVICIO.</small><input id="s21_emp_lugar" value="${s21_escape(e.lugarServicio||'')}"></label>
      <label class="fieldHint"><b>Validez de oferta</b><small>Se imprime en: VALIDEZ DE OFERTA.</small><input id="s21_emp_validez" value="${s21_escape(e.validez||'')}"></label>
      <label class="fieldHint"><b>Garantía</b><small>Se imprime en: GARANTÍA.</small><input id="s21_emp_garantia" value="${s21_escape(e.garantia||'')}"></label>
    </div>
    <label class="fieldHint full"><b>Observaciones comerciales</b><small>Se imprime en: OBSERVACIONES.</small><textarea id="s21_emp_obs" rows="5">${s21_escape(e.observacionesCot||'')}</textarea></label>
  </div>
  <div class="card">
    <h3>Contacto comercial y datos bancarios</h3>
    <div class="grid">
      <label class="fieldHint"><b>Contacto comercial</b><small>Se imprime en: CONTACTO.</small><input id="s21_emp_contacto" value="${s21_escape(e.contactoComercial||'')}"></label>
      <label class="fieldHint"><b>Teléfono contacto</b><small>Se imprime en: CELULAR / CONTACTO.</small><input id="s21_emp_tel_contacto" value="${s21_escape(e.telefonoComercial||'')}"></label>
      <label class="fieldHint"><b>Banco</b><small>Se imprime en: BANCO.</small><input id="s21_emp_banco" value="${s21_escape(e.banco||'')}"></label>
      <label class="fieldHint"><b>Cuenta</b><small>Se imprime en: CUENTA.</small><input id="s21_emp_cuenta" value="${s21_escape(e.cuenta||'')}"></label>
      <label class="fieldHint"><b>CCI</b><small>Se imprime en: CCI.</small><input id="s21_emp_cci" value="${s21_escape(e.cci||'')}"></label>
    </div>
  </div>
  <div class="card">
    <h3>Correlativos por empresa</h3>
    <div class="grid">
      <label class="fieldHint"><b>Cotización</b><small>Próximo número interno.</small><input type="number" id="s21_corr_cot" value="${s21_escape(e.correlativoCotizacion||1)}"></label>
      <label class="fieldHint"><b>Acta</b><small>Próximo número interno.</small><input type="number" id="s21_corr_acta" value="${s21_escape(e.correlativoActa||1)}"></label>
      <label class="fieldHint"><b>Informe</b><small>Próximo número interno.</small><input type="number" id="s21_corr_inf" value="${s21_escape(e.correlativoInforme||1)}"></label>
      <label class="fieldHint"><b>Orden servicio</b><small>Próximo número interno.</small><input type="number" id="s21_corr_os" value="${s21_escape(e.correlativoOS||1)}"></label>
    </div>
  </div>
  </section>`;
};

/* ---------- CLIENTES JERÁRQUICOS ---------- */
function s21_cliKey(){return 's21_cli_'+s21_empId();}
function s21_estKey(cid){return 's21_est_'+s21_empId()+'_'+(cid||'');}
function s21_areaKey(eid){return 's21_area_'+s21_empId()+'_'+(eid||'');}
function s21_clientes(){return s21_filterByEmpresa(state.clientes||[]);}
function s21_cliSel(){let cs=s21_clientes(); let id=s21_ls(s21_cliKey()); if(id==='__new__')return null; let c=cs.find(x=>x.id===id)||cs[0]||null; if(c)s21_ls(s21_cliKey(),c.id); return c;}
function s21_estSel(c){let ests=(c&&c.establecimientos)||[]; let id=s21_ls(s21_estKey(c&&c.id)); if(id==='__new__')return null; let e=ests.find(x=>x.id===id)||ests[0]||null; if(e)s21_ls(s21_estKey(c.id),e.id); return e;}
function s21_areaSel(e){let areas=(e&&e.areas)||[]; let id=s21_ls(s21_areaKey(e&&e.id)); if(id==='__new__')return null; let a=areas.find(x=>x.id===id)||areas[0]||null; if(a)s21_ls(s21_areaKey(e.id),a.id); return a;}
function s21_selectCli(v){s21_ls(s21_cliKey(),v); render();}
function s21_newCli(){s21_ls(s21_cliKey(),'__new__'); render();}
function s21_saveCli(){
  let id=s21_ls(s21_cliKey()); const nombre=(document.getElementById('s21_cli_nombre')?.value||'').trim(); if(!nombre)return alert('Ingresa nombre del cliente.');
  const data={nombre,ruc:val('s21_cli_ruc'),direccion:val('s21_cli_dir'),telefono:val('s21_cli_tel'),correo:val('s21_cli_cor'),responsable:val('s21_cli_resp')};
  if(id==='__new__'||!(state.clientes||[]).find(c=>c.id===id)){id=s21_uid(); state.clientes.push({id,empresaId:s21_empId(),...data,establecimientos:[]});}
  else state.clientes=state.clientes.map(c=>c.id===id?{...c,...data,empresaId:c.empresaId||s21_empId(),establecimientos:c.establecimientos||[]}:c);
  s21_ls(s21_cliKey(),id); persist(); render();
}
function s21_delCli(){let c=s21_cliSel(); if(!c)return; if(!confirm('¿Eliminar cliente?'))return; state.clientes=state.clientes.filter(x=>x.id!==c.id); s21_ls(s21_cliKey(),''); persist(); render();}
function s21_selectEst(v){let c=s21_cliSel(); if(c)s21_ls(s21_estKey(c.id),v); render();}
function s21_newEst(){let c=s21_cliSel(); if(!c)return alert('Primero guarda cliente.'); s21_ls(s21_estKey(c.id),'__new__'); render();}
function val(id){return document.getElementById(id)?.value||''}
function s21_saveEst(){
  const c=s21_cliSel(); if(!c)return alert('Selecciona cliente.');
  let id=s21_ls(s21_estKey(c.id)); const nombre=(val('s21_est_nombre')).trim(); if(!nombre)return alert('Ingresa establecimiento.');
  const data={nombre,direccion:val('s21_est_dir'),responsable:val('s21_est_resp'),telefono:val('s21_est_tel'),correo:val('s21_est_cor')};
  state.clientes=state.clientes.map(cli=>{
    if(cli.id!==c.id)return cli; let ests=cli.establecimientos||[];
    if(id==='__new__'||!ests.find(e=>e.id===id)){id=s21_uid(); ests.push({id,...data,areas:[]});}
    else ests=ests.map(e=>e.id===id?{...e,...data,areas:e.areas||[]}:e);
    return {...cli,establecimientos:ests};
  });
  s21_ls(s21_estKey(c.id),id); persist(); render();
}
function s21_delEst(){let c=s21_cliSel(), e=s21_estSel(c); if(!c||!e)return; if(!confirm('¿Eliminar establecimiento?'))return; state.clientes=state.clientes.map(cli=>cli.id===c.id?{...cli,establecimientos:(cli.establecimientos||[]).filter(x=>x.id!==e.id)}:cli); s21_ls(s21_estKey(c.id),''); persist(); render();}
function s21_selectArea(v){let c=s21_cliSel(), e=s21_estSel(c); if(e)s21_ls(s21_areaKey(e.id),v); render();}
function s21_newArea(){let c=s21_cliSel(), e=s21_estSel(c); if(!e)return alert('Primero guarda establecimiento.'); s21_ls(s21_areaKey(e.id),'__new__'); render();}
function s21_saveArea(){
  const c=s21_cliSel(), e=s21_estSel(c); if(!c||!e)return alert('Selecciona establecimiento.');
  let id=s21_ls(s21_areaKey(e.id)); const nombre=(val('s21_area_nombre')).trim(); if(!nombre)return alert('Ingresa área.');
  const data={nombre,responsable:val('s21_area_resp'),cargo:val('s21_area_cargo'),dni:val('s21_area_dni'),telefono:val('s21_area_tel'),correo:val('s21_area_cor')};
  state.clientes=state.clientes.map(cli=>{
    if(cli.id!==c.id)return cli;
    return {...cli,establecimientos:(cli.establecimientos||[]).map(est=>{
      if(est.id!==e.id)return est; let areas=est.areas||[];
      if(id==='__new__'||!areas.find(a=>a.id===id)){id=s21_uid(); areas.push({id,...data});}
      else areas=areas.map(a=>a.id===id?{...a,...data}:a);
      return {...est,areas};
    })};
  });
  s21_ls(s21_areaKey(e.id),id); persist(); render();
}
function s21_delArea(){let c=s21_cliSel(), e=s21_estSel(c), a=s21_areaSel(e); if(!a)return; if(!confirm('¿Eliminar área?'))return; state.clientes=state.clientes.map(cli=>cli.id===c.id?{...cli,establecimientos:(cli.establecimientos||[]).map(est=>est.id===e.id?{...est,areas:(est.areas||[]).filter(x=>x.id!==a.id)}:est)}:cli); s21_ls(s21_areaKey(e.id),''); persist(); render();}

views.Clientes=function(){
  const cs=s21_clientes(), c=s21_cliSel(), cNew=s21_ls(s21_cliKey())==='__new__'||!c;
  const ests=(c&&c.establecimientos)||[], e=c?s21_estSel(c):null, eNew=c&&(s21_ls(s21_estKey(c.id))==='__new__'||!e);
  const areas=(e&&e.areas)||[], a=e?s21_areaSel(e):null, aNew=e&&(s21_ls(s21_areaKey(e.id))==='__new__'||!a);
  return `<section class="wrap">${back()}<h2>Clientes</h2><p class="notice"><b>Empresa activa:</b> ${s21_escape(s21_activeEmpresa().nombre||'-')}</p>
  <div class="card"><h3>Cliente</h3><label class="fieldHint"><b>Cliente seleccionado</b><small>Selecciona, crea o edita un cliente.</small><select onchange="s21_selectCli(this.value)"><option value="__new__" ${cNew?'selected':''}>+ Nuevo cliente</option>${cs.map(x=>`<option value="${x.id}" ${c&&x.id===c.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select></label><div class="bar"><button class="btn" onclick="s21_newCli()">Nuevo</button><button class="btn green" onclick="s21_saveCli()">Guardar</button><button class="btn danger" onclick="s21_delCli()">Eliminar</button></div><div class="grid">${['nombre|Nombre / razón social|Se imprime en documentos|s21_cli_nombre','ruc|RUC|Documento tributario|s21_cli_ruc','direccion|Dirección|Dirección del cliente|s21_cli_dir','telefono|Teléfono|Contacto del cliente|s21_cli_tel','correo|Correo|Correo del cliente|s21_cli_cor','responsable|Responsable|Contacto principal|s21_cli_resp'].map(s=>{let [k,l,h,id]=s.split('|');return `<label class="fieldHint"><b>${l}</b><small>${h}</small><input id="${id}" value="${s21_escape(cNew?'':(c[k]||''))}"></label>`}).join('')}</div></div>
  <div class="card"><h3>Establecimiento</h3>${c?`<label class="fieldHint"><b>Establecimiento seleccionado</b><small>Depende del cliente seleccionado.</small><select onchange="s21_selectEst(this.value)"><option value="__new__" ${eNew?'selected':''}>+ Nuevo establecimiento</option>${ests.map(x=>`<option value="${x.id}" ${e&&x.id===e.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select></label><div class="bar"><button class="btn" onclick="s21_newEst()">Nuevo</button><button class="btn green" onclick="s21_saveEst()">Guardar</button><button class="btn danger" onclick="s21_delEst()">Eliminar</button></div><div class="grid">${['nombre|Nombre establecimiento|Ej.: Hospital, centro de salud, sede|s21_est_nombre','direccion|Dirección|Dirección del establecimiento|s21_est_dir','responsable|Responsable|Responsable del establecimiento|s21_est_resp','telefono|Teléfono|Contacto del establecimiento|s21_est_tel','correo|Correo|Correo del establecimiento|s21_est_cor'].map(s=>{let [k,l,h,id]=s.split('|');return `<label class="fieldHint"><b>${l}</b><small>${h}</small><input id="${id}" value="${s21_escape(eNew?'':(e[k]||''))}"></label>`}).join('')}</div>`:'<p class="notice">Guarda primero un cliente.</p>'}</div>
  <div class="card"><h3>Área usuaria</h3>${e?`<label class="fieldHint"><b>Área usuaria seleccionada</b><small>Depende del establecimiento seleccionado.</small><select onchange="s21_selectArea(this.value)"><option value="__new__" ${aNew?'selected':''}>+ Nueva área usuaria</option>${areas.map(x=>`<option value="${x.id}" ${a&&x.id===a.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select></label><div class="bar"><button class="btn" onclick="s21_newArea()">Nueva</button><button class="btn green" onclick="s21_saveArea()">Guardar</button><button class="btn danger" onclick="s21_delArea()">Eliminar</button></div><div class="grid">${['nombre|Nombre del área|Ej.: Odontología, Laboratorio|s21_area_nombre','responsable|Responsable del área|Aparece en acta|s21_area_resp','cargo|Cargo|Cargo del responsable|s21_area_cargo','dni|DNI|DNI del responsable|s21_area_dni','telefono|Teléfono|Contacto de área|s21_area_tel','correo|Correo|Correo del área|s21_area_cor'].map(s=>{let [k,l,h,id]=s.split('|');return `<label class="fieldHint"><b>${l}</b><small>${h}</small><input id="${id}" value="${s21_escape(aNew?'':(a[k]||''))}"></label>`}).join('')}</div>`:'<p class="notice">Guarda primero un establecimiento.</p>'}</div>
  <h3>Lista de clientes</h3><div class="tableWrap"><table><thead><tr><th>Cliente</th><th>RUC</th><th>Establecimientos</th><th>Áreas</th></tr></thead><tbody>${cs.map(x=>`<tr onclick="s21_selectCli('${x.id}')" style="cursor:pointer"><td><b>${s21_escape(x.nombre)}</b></td><td>${s21_escape(x.ruc||'-')}</td><td>${(x.establecimientos||[]).length}</td><td>${(x.establecimientos||[]).reduce((n,e)=>n+(e.areas||[]).length,0)}</td></tr>`).join('')||'<tr><td colspan="4">Sin clientes.</td></tr>'}</tbody></table></div></section>`;
};

/* ---------- COTIZACIONES ADMIN ---------- */
function s21_cots(){return s21_filterByEmpresa(state.cotizaciones||[]);}
function s21_cotKey(){return 's21_cot_'+s21_empId();}
function s21_cotSel(){let qs=s21_cots(); let id=s21_ls(s21_cotKey()); let q=qs.find(x=>x.id===id)||qs[0]||null; if(q)s21_ls(s21_cotKey(),q.id); return q;}
function s21_selectCot(id){s21_ls(s21_cotKey(),id); render();}
function s21_cotCode(q){return q.numero||q.codigo||('COT-'+(q.id||'').slice(0,6));}
function s21_cotCliente(q){return q.clienteNombre || ((state.clientes||[]).find(c=>c.id===q.clienteId)||{}).nombre || '-';}
function s21_newCot(){draft = (typeof newDraft==='function') ? newDraft() : {id:s21_uid(),empresaId:s21_empId(),equipos:[],acts:[],total:0,fecha:new Date().toISOString()}; tab='Cotizaciones'; render();}
function s21_editCot(){let q=s21_cotSel(); if(!q)return; draft=JSON.parse(JSON.stringify(q)); render();}
function s21_pdfCot(){let q=s21_cotSel(); if(!q)return; if(typeof printQuote==='function')return printQuote(q.id,'COTIZACIÓN'); const w=open('','_blank'); w.document.write(typeof quoteDoc==='function'?quoteDoc(q):JSON.stringify(q)); w.document.close();}
function s21_execCot(){let q=s21_cotSel(); if(!q)return; try{localStorage.setItem('servitec_exec_qid',q.id)}catch(e){} tab='Ejecución'; render();}
function s21_delCot(){let q=s21_cotSel(); if(!q)return; if(!confirm('¿Eliminar cotización seleccionada?'))return; state.cotizaciones=state.cotizaciones.filter(x=>x.id!==q.id); s21_ls(s21_cotKey(),''); persist(); render();}
views.Cotizaciones=function(){
  if(draft) return quoteForm();
  const qs=s21_cots(), q=s21_cotSel();
  return `<section class="wrap">${back()}<h2>Cotizaciones</h2><p class="notice"><b>Empresa activa:</b> ${s21_escape(s21_activeEmpresa().nombre||'-')}</p>
  <div class="card"><h3>Gestión de cotizaciones</h3><label class="fieldHint"><b>Cotización seleccionada</b><small>Selecciona una cotización y luego usa los botones superiores.</small><select onchange="s21_selectCot(this.value)">${qs.map(x=>`<option value="${x.id}" ${q&&x.id===q.id?'selected':''}>${s21_escape(s21_cotCode(x))} - ${s21_escape(s21_cotCliente(x))} - ${s21_money(x.total)}</option>`).join('')||'<option>Sin cotizaciones</option>'}</select></label><div class="bar"><button class="btn" onclick="s21_newCot()">Nueva</button><button class="btn" onclick="s21_editCot()" ${q?'':'disabled'}>Editar</button><button class="btn green" onclick="s21_pdfCot()" ${q?'':'disabled'}>PDF</button><button class="btn" onclick="s21_execCot()" ${q?'':'disabled'}>Ejecutar</button><button class="btn danger" onclick="s21_delCot()" ${q?'':'disabled'}>Eliminar</button></div></div>
  <div class="tableWrap"><table><thead><tr><th>N°</th><th>Cliente</th><th>Configuración</th><th>Estado</th><th>Total</th></tr></thead><tbody>${qs.map(x=>`<tr onclick="s21_selectCot('${x.id}')" class="${q&&x.id===q.id?'selectedRow':''}" style="cursor:pointer"><td><b>${s21_escape(s21_cotCode(x))}</b></td><td>${s21_escape(s21_cotCliente(x))}</td><td>${s21_escape(x.config||x.configuracion||x.tipo||'-')}</td><td>${s21_escape(x.estado||'Cotización')}</td><td><b>${s21_money(x.total)}</b></td></tr>`).join('')||'<tr><td colspan="5">Sin cotizaciones para esta empresa.</td></tr>'}</tbody></table></div></section>`;
};

/* ---------- COTIZACIÓN LIMPIA: equipos sin serie/patrimonial/ubicación ---------- */
const _s21_oldEqFields = typeof eqFields==='function' ? eqFields : null;
eqFields=function(e){return `<div class="grid"><label class="fieldHint"><b>Tipo / equipo</b><small>Resumen comercial del equipo.</small><input placeholder="Ej.: Datalogger" data-eq="${e.id}" data-p="nombre" value="${s21_escape(e.nombre)}"></label><label class="fieldHint"><b>Cantidad</b><small>Cantidad comercial de equipos de este tipo.</small><input type="number" placeholder="1" data-eq="${e.id}" data-p="cantidad" value="${s21_escape(e.cantidad||1)}"></label><label class="fieldHint"><b>Marca base</b><small>Marca referencial. No es serie individual.</small><input placeholder="Ej.: Varias / Testo" data-eq="${e.id}" data-p="marca" value="${s21_escape(e.marca)}"></label><label class="fieldHint"><b>Modelo base</b><small>Modelo referencial. La serie se llena en ejecución.</small><input placeholder="Ej.: Varias / 174H" data-eq="${e.id}" data-p="modelo" value="${s21_escape(e.modelo)}"></label></div>`};
equiposTable=function(list){return `<div class="tableWrap"><table><thead><tr><th>Tipo / Equipo</th><th>Cantidad</th><th>Marca base</th><th>Modelo base</th></tr></thead><tbody>${(list||[]).map(eq=>`<tr><td><input placeholder="Tipo / Equipo" data-eq="${eq.id}" data-p="nombre" value="${s21_escape(eq.nombre)}"></td><td><input type="number" placeholder="1" data-eq="${eq.id}" data-p="cantidad" value="${s21_escape(eq.cantidad||1)}"></td><td><input placeholder="Marca base" data-eq="${eq.id}" data-p="marca" value="${s21_escape(eq.marca)}"></td><td><input placeholder="Modelo base" data-eq="${eq.id}" data-p="modelo" value="${s21_escape(eq.modelo)}"></td></tr>`).join('')}</tbody></table></div><p class="notice"><b>Total equipos a ejecutar:</b> ${(list||[]).reduce((s,e)=>s+(Number(e.cantidad)||1),0)}</p>`};
const _s21_oldEq = typeof eq==='function' ? eq : null;
eq=function(){let x=_s21_oldEq?_s21_oldEq():{id:s21_uid(),nombre:'',marca:'',modelo:'',acts:[]}; x.cantidad=x.cantidad||1; delete x.serie; delete x.patrimonial; delete x.ubicacion; return x;};

render=function(){
  if(typeof ensureActiveEmpresa==='function')ensureActiveEmpresa();
  s21_allEmpresas();
  app.innerHTML=`<header class="top"><div><h1>${VERSION_ADMIN_ESTABLE}</h1><b>Modelo Administrador: Empresas + Clientes + Cotizaciones + PDF profesional</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* ============================================================
   SERVITEC PRO V13.21.1 - CLIENTES PERSISTENTES
   Corrección puntual:
   - Cliente guarda y recupera Dirección, Teléfono, Correo y Responsable.
   - Compatibilidad con nombres antiguos: dir/address, phone, email, contacto.
   - Fuerza persistencia en nube si existe saveCloud().
============================================================ */
const VERSION_ADMIN_ESTABLE_211='SERVITEC PRO V13.21.1 ADMINISTRADOR ESTABLE';

function s211_pick(obj, keys, fallback=''){
  obj=obj||{};
  for(const k of keys){
    if(obj[k]!==undefined && obj[k]!==null && String(obj[k]).trim()!=='') return obj[k];
  }
  return fallback;
}
async function s211_persist(){
  try{ if(typeof persist==='function') persist(); }catch(e){}
  try{ if(typeof saveCloud==='function') await saveCloud(); }catch(e){}
}
function s211_clienteDataFromForm(){
  return {
    nombre: (document.getElementById('s21_cli_nombre')?.value||'').trim(),
    ruc: document.getElementById('s21_cli_ruc')?.value||'',
    direccion: document.getElementById('s21_cli_dir')?.value||'',
    dir: document.getElementById('s21_cli_dir')?.value||'',
    address: document.getElementById('s21_cli_dir')?.value||'',
    telefono: document.getElementById('s21_cli_tel')?.value||'',
    phone: document.getElementById('s21_cli_tel')?.value||'',
    correo: document.getElementById('s21_cli_cor')?.value||'',
    email: document.getElementById('s21_cli_cor')?.value||'',
    responsable: document.getElementById('s21_cli_resp')?.value||'',
    contacto: document.getElementById('s21_cli_resp')?.value||''
  };
}
s21_saveCli=async function(){
  let id=s21_ls(s21_cliKey());
  const data=s211_clienteDataFromForm();
  if(!data.nombre)return alert('Ingresa nombre del cliente.');
  state.clientes=state.clientes||[];
  if(id==='__new__'||!state.clientes.find(c=>c.id===id)){
    id=s21_uid();
    state.clientes.push({id,empresaId:s21_empId(),...data,establecimientos:[]});
  }else{
    state.clientes=state.clientes.map(c=>{
      if(c.id!==id)return c;
      return {
        ...c,
        ...data,
        empresaId:c.empresaId||s21_empId(),
        establecimientos:c.establecimientos||[]
      };
    });
  }
  s21_ls(s21_cliKey(),id);
  await s211_persist();
  alert('Cliente guardado correctamente.');
  render();
};

views.Clientes=function(){
  const cs=s21_clientes(), c=s21_cliSel(), cNew=s21_ls(s21_cliKey())==='__new__'||!c;
  const ests=(c&&c.establecimientos)||[], e=c?s21_estSel(c):null, eNew=c&&(s21_ls(s21_estKey(c.id))==='__new__'||!e);
  const areas=(e&&e.areas)||[], a=e?s21_areaSel(e):null, aNew=e&&(s21_ls(s21_areaKey(e.id))==='__new__'||!a);

  const cDireccion=s211_pick(c,['direccion','dir','address']);
  const cTelefono=s211_pick(c,['telefono','phone','celular']);
  const cCorreo=s211_pick(c,['correo','email']);
  const cResponsable=s211_pick(c,['responsable','contacto','representante']);

  return `<section class="wrap">${back()}<h2>Clientes</h2><p class="notice"><b>Empresa activa:</b> ${s21_escape(s21_activeEmpresa().nombre||'-')}</p>
  <div class="card"><h3>Cliente</h3><label class="fieldHint"><b>Cliente seleccionado</b><small>Selecciona, crea o edita un cliente.</small><select onchange="s21_selectCli(this.value)"><option value="__new__" ${cNew?'selected':''}>+ Nuevo cliente</option>${cs.map(x=>`<option value="${x.id}" ${c&&x.id===c.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select></label><div class="bar"><button class="btn" onclick="s21_newCli()">Nuevo</button><button class="btn green" onclick="s21_saveCli()">Guardar</button><button class="btn danger" onclick="s21_delCli()">Eliminar</button></div>
  <div class="grid">
    <label class="fieldHint"><b>Nombre / razón social</b><small>Se imprime en documentos.</small><input id="s21_cli_nombre" value="${s21_escape(cNew?'':(c.nombre||''))}"></label>
    <label class="fieldHint"><b>RUC</b><small>Documento tributario.</small><input id="s21_cli_ruc" value="${s21_escape(cNew?'':(c.ruc||''))}"></label>
    <label class="fieldHint"><b>Dirección</b><small>Dirección del cliente.</small><input id="s21_cli_dir" value="${s21_escape(cNew?'':cDireccion)}"></label>
    <label class="fieldHint"><b>Teléfono</b><small>Contacto del cliente.</small><input id="s21_cli_tel" value="${s21_escape(cNew?'':cTelefono)}"></label>
    <label class="fieldHint"><b>Correo</b><small>Correo del cliente.</small><input id="s21_cli_cor" value="${s21_escape(cNew?'':cCorreo)}"></label>
    <label class="fieldHint"><b>Responsable</b><small>Contacto principal.</small><input id="s21_cli_resp" value="${s21_escape(cNew?'':cResponsable)}"></label>
  </div></div>
  <div class="card"><h3>Establecimiento</h3>${c?`<label class="fieldHint"><b>Establecimiento seleccionado</b><small>Depende del cliente seleccionado.</small><select onchange="s21_selectEst(this.value)"><option value="__new__" ${eNew?'selected':''}>+ Nuevo establecimiento</option>${ests.map(x=>`<option value="${x.id}" ${e&&x.id===e.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select></label><div class="bar"><button class="btn" onclick="s21_newEst()">Nuevo</button><button class="btn green" onclick="s21_saveEst()">Guardar</button><button class="btn danger" onclick="s21_delEst()">Eliminar</button></div><div class="grid">${['nombre|Nombre establecimiento|Ej.: Hospital, centro de salud, sede|s21_est_nombre','direccion|Dirección|Dirección del establecimiento|s21_est_dir','responsable|Responsable|Responsable del establecimiento|s21_est_resp','telefono|Teléfono|Contacto del establecimiento|s21_est_tel','correo|Correo|Correo del establecimiento|s21_est_cor'].map(s=>{let [k,l,h,id]=s.split('|');return `<label class="fieldHint"><b>${l}</b><small>${h}</small><input id="${id}" value="${s21_escape(eNew?'':s211_pick(e,[k,k==='direccion'?'dir':'',k==='telefono'?'phone':'',k==='correo'?'email':''].filter(Boolean)))}"></label>`}).join('')}</div>`:'<p class="notice">Guarda primero un cliente.</p>'}</div>
  <div class="card"><h3>Área usuaria</h3>${e?`<label class="fieldHint"><b>Área usuaria seleccionada</b><small>Depende del establecimiento seleccionado.</small><select onchange="s21_selectArea(this.value)"><option value="__new__" ${aNew?'selected':''}>+ Nueva área usuaria</option>${areas.map(x=>`<option value="${x.id}" ${a&&x.id===a.id?'selected':''}>${s21_escape(x.nombre)}</option>`).join('')}</select></label><div class="bar"><button class="btn" onclick="s21_newArea()">Nueva</button><button class="btn green" onclick="s21_saveArea()">Guardar</button><button class="btn danger" onclick="s21_delArea()">Eliminar</button></div><div class="grid">${['nombre|Nombre del área|Ej.: Odontología, Laboratorio|s21_area_nombre','responsable|Responsable del área|Aparece en acta|s21_area_resp','cargo|Cargo|Cargo del responsable|s21_area_cargo','dni|DNI|DNI del responsable|s21_area_dni','telefono|Teléfono|Contacto de área|s21_area_tel','correo|Correo|Correo del área|s21_area_cor'].map(s=>{let [k,l,h,id]=s.split('|');return `<label class="fieldHint"><b>${l}</b><small>${h}</small><input id="${id}" value="${s21_escape(aNew?'':s211_pick(a,[k,k==='telefono'?'phone':'',k==='correo'?'email':''].filter(Boolean)))}"></label>`}).join('')}</div>`:'<p class="notice">Guarda primero un establecimiento.</p>'}</div>
  <h3>Lista de clientes</h3><div class="tableWrap"><table><thead><tr><th>Cliente</th><th>RUC</th><th>Dirección</th><th>Teléfono</th><th>Establecimientos</th><th>Áreas</th></tr></thead><tbody>${cs.map(x=>`<tr onclick="s21_selectCli('${x.id}')" style="cursor:pointer"><td><b>${s21_escape(x.nombre)}</b></td><td>${s21_escape(x.ruc||'-')}</td><td>${s21_escape(s211_pick(x,['direccion','dir','address'],'-'))}</td><td>${s21_escape(s211_pick(x,['telefono','phone','celular'],'-'))}</td><td>${(x.establecimientos||[]).length}</td><td>${(x.establecimientos||[]).reduce((n,e)=>n+(e.areas||[]).length,0)}</td></tr>`).join('')||'<tr><td colspan="6">Sin clientes.</td></tr>'}</tbody></table></div></section>`;
};

render=function(){
  if(typeof ensureActiveEmpresa==='function')ensureActiveEmpresa();
  s21_allEmpresas();
  app.innerHTML=`<header class="top"><div><h1>${VERSION_ADMIN_ESTABLE_211}</h1><b>Modelo Administrador: clientes persistentes + empresas + cotizaciones + PDF profesional</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* ============================================================
   SERVITEC PRO V13.21.2 - RECUPERACIÓN EJECUCIÓN
   Corrección puntual:
   - El menú Ejecución vuelve a abrir siempre.
   - Vista independiente de funciones antiguas duplicadas.
   - Genera ítems técnicos desde la cotización:
     Tipo/Equipo + cantidad + actividades.
   - En ejecución recién se llena Serie, Patrimonial y Ubicación.
   - No muestra costos.
============================================================ */
const VERSION_ADMIN_ESTABLE_212='SERVITEC PRO V13.21.2 EJECUCIÓN RECUPERADA';

function s212_e(v){return (typeof s21_escape==='function')?s21_escape(v):String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}
function s212_uid(){return (typeof s21_uid==='function')?s21_uid():Math.random().toString(36).slice(2,9)}
function s212_empId(){return (typeof s21_empId==='function')?s21_empId():(state.activeEmpresaId||'')}
function s212_activeEmpresa(){return (typeof s21_activeEmpresa==='function')?s21_activeEmpresa():((state.empresas||[]).find(e=>e.id===s212_empId())||{})}
function s212_persist(){try{persist&&persist()}catch(e){} try{saveCloud&&saveCloud()}catch(e){}}
function s212_cots(){
  const emp=s212_empId();
  return (state.cotizaciones||[]).filter(q=>(q.empresaId||q.empresa_id||emp)===emp);
}
function s212_selectedExecId(){
  try{return localStorage.getItem('servitec_exec_qid')||''}catch(e){return ''}
}
function s212_setExecId(id){
  try{localStorage.setItem('servitec_exec_qid',id||'')}catch(e){}
}
function s212_estado(q){return q.estado||((q.ordenNumero&&q.siaf)?'En ejecución':'Cotización')}
function s212_qty(e){return Math.max(1,parseInt(e.cantidad||e.qty||1,10)||1)}
function s212_pad(n,total){return String(n).padStart(String(total||999).length,'0')}

function s212_acts(q){
  if(q.config && String(q.config).toLowerCase().includes('repuesto')) return q.repuestos||[];
  if(q.acts&&q.acts.length)return q.acts;
  if(q.actividades&&q.actividades.length)return q.actividades;
  return [{id:'act_general',descripcion:q.tipo||'Actividad técnica'}];
}
function s212_baseRows(q){
  const equipos=(q.equipos&&q.equipos.length?q.equipos:[{id:'eq_grupo',nombre:'Equipo',cantidad:1,marca:'',modelo:''}]);
  const acts=s212_acts(q);
  let total=equipos.reduce((s,e)=>s+s212_qty(e),0);
  let idx=0, rows=[];
  equipos.forEach(eq=>{
    const qty=s212_qty(eq);
    for(let n=1;n<=qty;n++){
      idx++;
      acts.forEach((a,ai)=>{
        rows.push({
          id:(eq.id||'eq')+'_'+idx+'_'+(a.id||ai),
          item:idx,
          totalItems:total,
          tipoEquipo:eq.nombre||eq.tipo||'Equipo',
          marca:eq.marca||'',
          modelo:eq.modelo||'',
          serie:'',
          patrimonial:'',
          codigoPatrimonial:'',
          ubicacion:'',
          actividad:a.descripcion||a.nombre||String(a)||'Actividad técnica',
          estado:'Pendiente',
          observacion:'',
          evidencia:'',
          evidenciaNombre:''
        });
      });
    }
  });
  return rows;
}
function s212_ensureExecRows(q){
  if(!q.execRows || !Array.isArray(q.execRows) || !q.execRows.length){
    q.execRows=s212_baseRows(q);
    s212_persist();
  }
  return q.execRows;
}
function s212_resumen(q){
  const rows=s212_ensureExecRows(q);
  const equiposUnicos={};
  rows.forEach(r=>{equiposUnicos[r.item]=true});
  const total=Object.keys(equiposUnicos).length;
  const done=rows.filter(r=>['Terminado','Conforme'].includes(r.estado)).length;
  const pending=rows.filter(r=>!['Terminado','Conforme'].includes(r.estado)).length;
  const pct=rows.length?Math.round(done*100/rows.length):0;
  const tipos={};
  rows.forEach(r=>{tipos[r.tipoEquipo]=(tipos[r.tipoEquipo]||0)+0; if(!tipos['_'+r.item]){tipos[r.tipoEquipo]=(tipos[r.tipoEquipo]||0)+1; tipos['_'+r.item]=true;}});
  return {rows,total,done,pending,pct,tipos};
}
function s212_updateRow(qid,i,field,val){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  s212_ensureExecRows(q);
  q.execRows[i]=q.execRows[i]||{};
  q.execRows[i][field]=val;
  q.estado='En ejecución';
  s212_persist();
}
function s212_fileRow(qid,i,file){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q||!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    s212_ensureExecRows(q);
    q.execRows[i].evidencia=reader.result;
    q.execRows[i].evidenciaNombre=file.name;
    q.estado='En ejecución';
    s212_persist();
    render();
  };
  reader.readAsDataURL(file);
}
function s212_authorize(qid){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  const orden=(document.getElementById('s212_orden')?.value||'').trim();
  const siaf=(document.getElementById('s212_siaf')?.value||'').trim();
  if(!orden||!siaf)return alert('Registra N° de orden y N° SIAF.');
  q.ordenTipo=document.getElementById('s212_tipo')?.value||'Orden de servicio';
  q.ordenNumero=orden;
  q.siaf=siaf;
  q.fechaOrden=document.getElementById('s212_fecha')?.value||new Date().toISOString().slice(0,10);
  q.estado='En ejecución';
  q.execRows=s212_baseRows(q);
  s212_persist();
  render();
}
function s212_resetExec(qid){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  if(!confirm('¿Regenerar la ejecución? Se perderán observaciones/evidencias cargadas.'))return;
  q.execRows=s212_baseRows(q);
  q.estado='En ejecución';
  s212_persist();
  render();
}
function s212_filterRows(q){
  const rows=s212_ensureExecRows(q);
  const tipo=document.getElementById('s212_filter_tipo')?.value || q.execFilter?.tipo || 'Todos';
  const estado=document.getElementById('s212_filter_estado')?.value || q.execFilter?.estado || 'Todos';
  const buscar=(document.getElementById('s212_search')?.value || q.execFilter?.buscar || '').toLowerCase();
  return rows.filter(r=>{
    if(tipo!=='Todos' && r.tipoEquipo!==tipo)return false;
    if(estado!=='Todos' && r.estado!==estado)return false;
    if(buscar){
      const blob=[r.tipoEquipo,r.marca,r.modelo,r.serie,r.patrimonial,r.codigoPatrimonial,r.ubicacion,r.actividad,r.observacion].join(' ').toLowerCase();
      if(!blob.includes(buscar))return false;
    }
    return true;
  });
}
function s212_setFilter(qid,k,v){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  q.execFilter=q.execFilter||{};
  q.execFilter[k]=v;
  s212_persist();
  render();
}

views['Ejecución']=function(){
  const qs=s212_cots();
  if(!qs.length)return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">No hay cotizaciones para la empresa activa.</p></section>`;
  let qid=s212_selectedExecId();
  let q=qs.find(x=>x.id===qid)||qs[0];
  s212_setExecId(q.id);
  const auth=!!(q.ordenNumero&&q.siaf);
  const resumen=auth?s212_resumen(q):null;
  const tipos=auth?[...new Set((q.execRows||[]).map(r=>r.tipoEquipo))]:[];
  const filtered=auth?s212_filterRows(q):[];
  return `<section class="wrap">${back()}<h2>Ejecución técnica</h2>
  <p class="notice"><b>Empresa activa:</b> ${s212_e(s212_activeEmpresa().nombre||'-')}. La ejecución no muestra costos; aquí se registran datos técnicos reales.</p>
  <div class="card">
    <label class="fieldHint"><b>Cotización / orden seleccionada</b><small>Selecciona la cotización que pasará a ejecución.</small>
    <select onchange="s212_setExecId(this.value);render()">${qs.map(x=>`<option value="${x.id}" ${x.id===q.id?'selected':''}>${s212_e(x.numero||x.codigo||x.id)} - ${s212_e(x.clienteNombre||'-')} - ${s212_e(s212_estado(x))}</option>`).join('')}</select></label>
  </div>
  ${!auth?`<div class="card"><h3>Autorizar ejecución</h3><p>Para iniciar campo registra orden y SIAF. Luego el sistema generará los ítems individuales según cantidades de cotización.</p><div class="grid"><label class="fieldHint"><b>Tipo de orden</b><small>Orden que autoriza el servicio.</small><select id="s212_tipo"><option>Orden de servicio</option><option>Orden de compra</option></select></label><label class="fieldHint"><b>N° orden</b><small>Número de OC/OS.</small><input id="s212_orden" placeholder="N° orden"></label><label class="fieldHint"><b>N° SIAF</b><small>Expediente SIAF.</small><input id="s212_siaf" placeholder="N° SIAF"></label><label class="fieldHint"><b>Fecha</b><small>Fecha de autorización.</small><input id="s212_fecha" type="date" value="${new Date().toISOString().slice(0,10)}"></label></div><div class="bar"><button class="btn green" onclick="s212_authorize('${q.id}')">Autorizar e iniciar ejecución</button></div></div>`:
  `<div class="grid"><div class="card"><b>Total equipos</b><h2>${resumen.total}</h2></div><div class="card"><b>Registros técnicos</b><h2>${resumen.rows.length}</h2></div><div class="card"><b>Terminados</b><h2>${resumen.done}</h2></div><div class="card"><b>Avance</b><h2>${resumen.pct}%</h2></div></div>
  <div class="card"><h3>Filtros de ejecución</h3><div class="grid"><label class="fieldHint"><b>Tipo de equipo</b><small>Filtra por categoría.</small><select id="s212_filter_tipo" onchange="s212_setFilter('${q.id}','tipo',this.value)"><option>Todos</option>${tipos.map(t=>`<option ${q.execFilter?.tipo===t?'selected':''}>${s212_e(t)}</option>`).join('')}</select></label><label class="fieldHint"><b>Estado</b><small>Filtra por avance.</small><select id="s212_filter_estado" onchange="s212_setFilter('${q.id}','estado',this.value)">${['Todos','Pendiente','En proceso','Terminado','Conforme','Observado'].map(e=>`<option ${q.execFilter?.estado===e?'selected':''}>${e}</option>`).join('')}</select></label><label class="fieldHint"><b>Buscar</b><small>Serie, patrimonial, ubicación, actividad.</small><input id="s212_search" value="${s212_e(q.execFilter?.buscar||'')}" onchange="s212_setFilter('${q.id}','buscar',this.value)" placeholder="Buscar..."></label></div><div class="bar"><button class="btn" onclick="s212_resetExec('${q.id}')">Regenerar ítems</button></div></div>
  <div class="tableWrap"><table><thead><tr><th>Item</th><th>Equipo</th><th>Datos técnicos</th><th>Actividad</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${filtered.map((r,i)=>{
    const realIndex=(q.execRows||[]).indexOf(r);
    return `<tr><td><b>${s212_pad(r.item,r.totalItems)} / ${r.totalItems}</b></td><td><b>${s212_e(r.tipoEquipo)}</b><br><small>Marca base: ${s212_e(r.marca||'-')}<br>Modelo base: ${s212_e(r.modelo||'-')}</small></td><td><input placeholder="Marca real" value="${s212_e(r.marca||'')}" onchange="s212_updateRow('${q.id}',${realIndex},'marca',this.value)"><input placeholder="Modelo real" value="${s212_e(r.modelo||'')}" onchange="s212_updateRow('${q.id}',${realIndex},'modelo',this.value)"><input placeholder="Serie" value="${s212_e(r.serie||'')}" onchange="s212_updateRow('${q.id}',${realIndex},'serie',this.value)"><input placeholder="Patrimonial" value="${s212_e(r.patrimonial||r.codigoPatrimonial||'')}" onchange="s212_updateRow('${q.id}',${realIndex},'patrimonial',this.value);s212_updateRow('${q.id}',${realIndex},'codigoPatrimonial',this.value)"><input placeholder="Ubicación" value="${s212_e(r.ubicacion||'')}" onchange="s212_updateRow('${q.id}',${realIndex},'ubicacion',this.value)"></td><td>${s212_e(r.actividad)}</td><td><select onchange="s212_updateRow('${q.id}',${realIndex},'estado',this.value)">${['Pendiente','En proceso','Terminado','Conforme','Observado'].map(e=>`<option ${r.estado===e?'selected':''}>${e}</option>`).join('')}</select></td><td><textarea placeholder="Observación técnica" onchange="s212_updateRow('${q.id}',${realIndex},'observacion',this.value)">${s212_e(r.observacion||'')}</textarea></td><td><input type="file" accept="image/*" onchange="s212_fileRow('${q.id}',${realIndex},this.files[0])"><small>${s212_e(r.evidenciaNombre||'')}</small></td></tr>`;
  }).join('')||'<tr><td colspan="7">Sin ítems para mostrar.</td></tr>'}</tbody></table></div>`}
  </section>`;
};

render=function(){
  if(typeof ensureActiveEmpresa==='function')ensureActiveEmpresa();
  if(typeof s21_allEmpresas==='function')s21_allEmpresas();
  app.innerHTML=`<header class="top"><div><h1>${VERSION_ADMIN_ESTABLE_212}</h1><b>Modelo Administrador + ejecución técnica recuperada</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${(views[tab]||views.Dashboard)()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();


/* ============================================================
   SERVITEC PRO V13.22.0 - EJECUCIÓN MOBILE FIRST
   Parche seguro:
   - Solo reemplaza la vista de Ejecución.
   - No toca Empresas, Clientes, Cotizaciones ni PDF.
   - Cambia tabla por tarjetas móviles.
   - Mantiene autosave y datos técnicos.
   - Genera 1 equipo por unidad, no una fila por actividad.
============================================================ */
const VERSION_EJECUCION_MOBILE='SERVITEC PRO V13.22.0 EJECUCIÓN MOBILE FIRST';

function s220_e(v){return (typeof s21_escape==='function')?s21_escape(v):String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}
function s220_uid(){return (typeof s21_uid==='function')?s21_uid():Math.random().toString(36).slice(2,9)}
function s220_empId(){return (typeof s21_empId==='function')?s21_empId():(state.activeEmpresaId||'')}
function s220_activeEmpresa(){return (typeof s21_activeEmpresa==='function')?s21_activeEmpresa():((state.empresas||[]).find(e=>e.id===s220_empId())||{})}
function s220_persist(){try{persist&&persist()}catch(e){} try{saveCloud&&saveCloud()}catch(e){}}
function s220_ls(k,v){try{if(v===undefined)return localStorage.getItem(k)||''; localStorage.setItem(k,v||'')}catch(e){return ''}}
function s220_cots(){const emp=s220_empId();return (state.cotizaciones||[]).filter(q=>(q.empresaId||q.empresa_id||emp)===emp)}
function s220_execKey(){return 'servitec_exec_qid'}
function s220_selQid(){return s220_ls(s220_execKey())}
function s220_setQid(id){s220_ls(s220_execKey(),id)}
function s220_pad(n,total){return String(n).padStart(String(total||999).length,'0')}
function s220_qty(e){return Math.max(1,parseInt(e.cantidad||e.qty||1,10)||1)}
function s220_code(q){return q.numero||q.codigo||('COT-'+String(q.id||'').slice(0,6))}
function s220_cliente(q){return q.clienteNombre||((state.clientes||[]).find(c=>c.id===q.clienteId)||{}).nombre||'-'}
function s220_acts(q, eq){
  let acts=[];
  if(eq && eq.acts && eq.acts.length) acts=eq.acts;
  else if(q.acts&&q.acts.length) acts=q.acts;
  else if(q.actividades&&q.actividades.length) acts=q.actividades;
  else acts=[{id:'act_general',descripcion:q.tipo||'Actividad técnica'}];
  return acts.map((a,i)=>({
    id:a.id||('act_'+i),
    descripcion:a.descripcion||a.nombre||String(a)||'Actividad técnica',
    estado:a.estado||'Pendiente'
  }));
}
function s220_generateEquipos(q){
  const equipos=(q.equipos&&q.equipos.length?q.equipos:[{id:'eq_grupo',nombre:'Equipo',cantidad:1,marca:'',modelo:''}]);
  const total=equipos.reduce((s,e)=>s+s220_qty(e),0);
  let idx=0, rows=[];
  equipos.forEach(eq=>{
    const qty=s220_qty(eq);
    for(let n=1;n<=qty;n++){
      idx++;
      rows.push({
        id:'equipo_'+idx+'_'+s220_uid(),
        item:idx,
        totalItems:total,
        tipoEquipo:eq.nombre||eq.tipo||'Equipo',
        marca:eq.marca||'',
        modelo:eq.modelo||'',
        serie:'',
        patrimonial:'',
        codigoPatrimonial:'',
        ubicacion:'',
        estado:'Pendiente',
        fase:'Pendiente',
        fechaRetiro:'',
        observacionRecojo:'',
        codigoCalibracion:'',
        resultado:'',
        observacionTecnica:'',
        evidenciaAntes:'',
        evidenciaDurante:'',
        evidenciaDespues:'',
        actividades:s220_acts(q,eq)
      });
    }
  });
  return rows;
}
function s220_normalizeExec(q){
  if(q.execEquipos && Array.isArray(q.execEquipos) && q.execEquipos.length) return q.execEquipos;
  if(q.execRows && Array.isArray(q.execRows) && q.execRows.length){
    const grouped={};
    q.execRows.forEach(r=>{
      const key=r.item || Object.keys(grouped).length+1;
      if(!grouped[key]){
        grouped[key]={
          id:'equipo_'+key+'_'+s220_uid(),
          item:r.item||Number(key),
          totalItems:r.totalItems||0,
          tipoEquipo:r.tipoEquipo||'Equipo',
          marca:r.marca||'',
          modelo:r.modelo||'',
          serie:r.serie||'',
          patrimonial:r.patrimonial||r.codigoPatrimonial||'',
          codigoPatrimonial:r.codigoPatrimonial||r.patrimonial||'',
          ubicacion:r.ubicacion||'',
          estado:r.estado||'Pendiente',
          fase:r.estado||'Pendiente',
          fechaRetiro:r.fechaRetiro||'',
          observacionRecojo:'',
          codigoCalibracion:'',
          resultado:'',
          observacionTecnica:r.observacion||'',
          evidenciaAntes:r.evidencia||'',
          evidenciaDurante:'',
          evidenciaDespues:'',
          actividades:[]
        };
      }
      grouped[key].actividades.push({
        id:r.id||s220_uid(),
        descripcion:r.actividad||'Actividad técnica',
        estado:r.estado||'Pendiente'
      });
    });
    q.execEquipos=Object.values(grouped);
    const total=q.execEquipos.length;
    q.execEquipos.forEach((x,i)=>{x.item=i+1;x.totalItems=total});
    s220_persist();
    return q.execEquipos;
  }
  q.execEquipos=s220_generateEquipos(q);
  s220_persist();
  return q.execEquipos;
}
function s220_resumen(q){
  const rows=s220_normalizeExec(q);
  const total=rows.length;
  const registrados=rows.filter(r=>['Registrado','Retirado','En taller','Finalizado','Observado'].includes(r.estado)).length;
  const pendientes=rows.filter(r=>r.estado==='Pendiente').length;
  const taller=rows.filter(r=>r.estado==='En taller').length;
  const finalizados=rows.filter(r=>r.estado==='Finalizado').length;
  const observados=rows.filter(r=>r.estado==='Observado').length;
  const tipos={};
  rows.forEach(r=>{
    if(!tipos[r.tipoEquipo]) tipos[r.tipoEquipo]={total:0,registrados:0,finalizados:0};
    tipos[r.tipoEquipo].total++;
    if(r.estado!=='Pendiente') tipos[r.tipoEquipo].registrados++;
    if(r.estado==='Finalizado') tipos[r.tipoEquipo].finalizados++;
  });
  return {rows,total,registrados,pendientes,taller,finalizados,observados,tipos};
}
function s220_update(qid,idx,field,val){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  const rows=s220_normalizeExec(q);
  if(!rows[idx])return;
  rows[idx][field]=val;
  if(['marca','modelo','serie','patrimonial','codigoPatrimonial','ubicacion'].includes(field) && rows[idx].estado==='Pendiente'){
    rows[idx].estado='Registrado';
  }
  rows[idx].updatedAt=new Date().toISOString();
  q.estado='En ejecución';
  q.execSaveStatus='✓ Guardado';
  s220_persist();
}
function s220_updateAct(qid,idx,actIndex,field,val){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  const rows=s220_normalizeExec(q);
  if(!rows[idx]||!rows[idx].actividades||!rows[idx].actividades[actIndex])return;
  rows[idx].actividades[actIndex][field]=val;
  rows[idx].updatedAt=new Date().toISOString();
  q.estado='En ejecución';
  q.execSaveStatus='✓ Guardado';
  s220_persist();
}
function s220_file(qid,idx,field,file){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q||!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    const rows=s220_normalizeExec(q);
    rows[idx][field]=reader.result;
    rows[idx][field+'Nombre']=file.name;
    rows[idx].updatedAt=new Date().toISOString();
    if(rows[idx].estado==='Pendiente')rows[idx].estado='Registrado';
    q.estado='En ejecución';
    q.execSaveStatus='✓ Guardado';
    s220_persist();
    render();
  };
  reader.readAsDataURL(file);
}
function s220_authorize(qid){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  const orden=(document.getElementById('s220_orden')?.value||'').trim();
  const siaf=(document.getElementById('s220_siaf')?.value||'').trim();
  if(!orden||!siaf)return alert('Registra N° de orden y N° SIAF.');
  q.ordenTipo=document.getElementById('s220_tipo')?.value||'Orden de servicio';
  q.ordenNumero=orden;
  q.siaf=siaf;
  q.fechaOrden=document.getElementById('s220_fecha')?.value||new Date().toISOString().slice(0,10);
  q.estado='En ejecución';
  q.execEquipos=s220_generateEquipos(q);
  delete q.execRows;
  q.execSaveStatus='✓ Ejecución generada';
  s220_persist();
  render();
}
function s220_reset(qid){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  if(!confirm('¿Regenerar ítems? Se perderán datos técnicos ya registrados.'))return;
  q.execEquipos=s220_generateEquipos(q);
  delete q.execRows;
  q.execSaveStatus='✓ Ítems regenerados';
  s220_persist();
  render();
}
function s220_setFilter(qid,k,v){
  const q=(state.cotizaciones||[]).find(x=>x.id===qid); if(!q)return;
  q.execFilter=q.execFilter||{};
  q.execFilter[k]=v;
  s220_persist();
  render();
}
function s220_filter(q,rows){
  const tipo=q.execFilter?.tipo||'Todos';
  const estado=q.execFilter?.estado||'Todos';
  const buscar=(q.execFilter?.buscar||'').toLowerCase();
  return rows.filter(r=>{
    if(tipo!=='Todos' && r.tipoEquipo!==tipo)return false;
    if(estado!=='Todos' && r.estado!==estado)return false;
    if(buscar){
      const blob=[r.item,r.tipoEquipo,r.marca,r.modelo,r.serie,r.patrimonial,r.codigoPatrimonial,r.ubicacion,r.codigoCalibracion,r.resultado,r.observacionTecnica,r.observacionRecojo].join(' ').toLowerCase();
      if(!blob.includes(buscar))return false;
    }
    return true;
  });
}
function s220_statusClass(s){
  return s==='Finalizado'?'done':s==='En taller'?'workshop':s==='Observado'?'obs':s==='Registrado'||s==='Retirado'?'reg':'pend';
}
function s220_card(q,r,idx){
  return `<div class="execCard ${s220_statusClass(r.estado)}">
    <div class="execCardHead">
      <div><b>Equipo ${s220_pad(r.item,r.totalItems)} / ${r.totalItems}</b><h3>${s220_e(r.tipoEquipo)}</h3></div>
      <select class="statusSelect" onchange="s220_update('${q.id}',${idx},'estado',this.value)">
        ${['Pendiente','Registrado','Retirado','En taller','Finalizado','Observado'].map(s=>`<option ${r.estado===s?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="mobileGrid">
      <label><b>Marca</b><input value="${s220_e(r.marca||'')}" placeholder="Marca" oninput="s220_update('${q.id}',${idx},'marca',this.value)"></label>
      <label><b>Modelo</b><input value="${s220_e(r.modelo||'')}" placeholder="Modelo" oninput="s220_update('${q.id}',${idx},'modelo',this.value)"></label>
      <label><b>Serie</b><input value="${s220_e(r.serie||'')}" placeholder="Serie" oninput="s220_update('${q.id}',${idx},'serie',this.value)"></label>
      <label><b>Patrimonial</b><input value="${s220_e(r.patrimonial||r.codigoPatrimonial||'')}" placeholder="Código patrimonial" oninput="s220_update('${q.id}',${idx},'patrimonial',this.value);s220_update('${q.id}',${idx},'codigoPatrimonial',this.value)"></label>
      <label><b>Ubicación</b><input value="${s220_e(r.ubicacion||'')}" placeholder="Área / ubicación" oninput="s220_update('${q.id}',${idx},'ubicacion',this.value)"></label>
      <label><b>Fecha retiro</b><input type="date" value="${s220_e(r.fechaRetiro||'')}" onchange="s220_update('${q.id}',${idx},'fechaRetiro',this.value)"></label>
    </div>
    <details>
      <summary>Actividades del equipo</summary>
      <div class="actList">${(r.actividades||[]).map((a,ai)=>`<div class="actItem"><span>${s220_e(a.descripcion)}</span><select onchange="s220_updateAct('${q.id}',${idx},${ai},'estado',this.value)">${['Pendiente','En proceso','Terminado','Conforme','Observado'].map(s=>`<option ${a.estado===s?'selected':''}>${s}</option>`).join('')}</select></div>`).join('')||'<small>Sin actividades.</small>'}</div>
    </details>
    <details>
      <summary>Recojo / traslado</summary>
      <label><b>Observación de recojo</b><textarea placeholder="Estado inicial, accesorios, condiciones de retiro..." oninput="s220_update('${q.id}',${idx},'observacionRecojo',this.value)">${s220_e(r.observacionRecojo||'')}</textarea></label>
    </details>
    <details>
      <summary>Calibración / taller</summary>
      <div class="mobileGrid">
        <label><b>Código de calibración</b><input value="${s220_e(r.codigoCalibracion||'')}" placeholder="Ej.: CAL-2026-001" oninput="s220_update('${q.id}',${idx},'codigoCalibracion',this.value)"></label>
        <label><b>Resultado</b><input value="${s220_e(r.resultado||'')}" placeholder="Aprobado / Observado" oninput="s220_update('${q.id}',${idx},'resultado',this.value)"></label>
      </div>
      <label><b>Observación técnica</b><textarea placeholder="Observación técnica final..." oninput="s220_update('${q.id}',${idx},'observacionTecnica',this.value)">${s220_e(r.observacionTecnica||'')}</textarea></label>
    </details>
    <details>
      <summary>Evidencias</summary>
      <div class="photoGrid">
        <label class="photoBtn">📷 Antes<input type="file" accept="image/*" capture="environment" onchange="s220_file('${q.id}',${idx},'evidenciaAntes',this.files[0])"><small>${s220_e(r.evidenciaAntesNombre||'')}</small></label>
        <label class="photoBtn">📷 Durante<input type="file" accept="image/*" capture="environment" onchange="s220_file('${q.id}',${idx},'evidenciaDurante',this.files[0])"><small>${s220_e(r.evidenciaDuranteNombre||'')}</small></label>
        <label class="photoBtn">📷 Después<input type="file" accept="image/*" capture="environment" onchange="s220_file('${q.id}',${idx},'evidenciaDespues',this.files[0])"><small>${s220_e(r.evidenciaDespuesNombre||'')}</small></label>
      </div>
    </details>
  </div>`;
}

views['Ejecución']=function(){
  const qs=s220_cots();
  if(!qs.length)return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">No hay cotizaciones para la empresa activa.</p></section>`;
  let qid=s220_selQid();
  let q=qs.find(x=>x.id===qid)||qs[0];
  s220_setQid(q.id);
  const auth=!!(q.ordenNumero&&q.siaf);
  if(!auth){
    return `<section class="wrap">${back()}<h2>Ejecución técnica</h2>
    <p class="notice"><b>Empresa activa:</b> ${s220_e(s220_activeEmpresa().nombre||'-')}. Aquí inicia el flujo técnico sin costos.</p>
    <div class="card">
      <label class="fieldHint"><b>Cotización seleccionada</b><small>Selecciona la cotización que pasará a ejecución.</small>
        <select onchange="s220_setQid(this.value);render()">${qs.map(x=>`<option value="${x.id}" ${x.id===q.id?'selected':''}>${s220_e(s220_code(x))} - ${s220_e(s220_cliente(x))}</option>`).join('')}</select>
      </label>
    </div>
    <div class="card"><h3>Autorizar ejecución</h3>
      <p>Registra orden y SIAF para generar los equipos individuales. Serie, patrimonial y ubicación se llenan recién en campo.</p>
      <div class="grid">
        <label class="fieldHint"><b>Tipo de orden</b><small>Documento que autoriza el servicio.</small><select id="s220_tipo"><option>Orden de servicio</option><option>Orden de compra</option></select></label>
        <label class="fieldHint"><b>N° orden</b><small>Número de OC/OS.</small><input id="s220_orden" placeholder="N° orden"></label>
        <label class="fieldHint"><b>N° SIAF</b><small>Expediente SIAF.</small><input id="s220_siaf" placeholder="N° SIAF"></label>
        <label class="fieldHint"><b>Fecha</b><small>Fecha de autorización.</small><input id="s220_fecha" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
      </div>
      <div class="bar"><button class="btn green" onclick="s220_authorize('${q.id}')">Autorizar e iniciar ejecución</button></div>
    </div></section>`;
  }
  const resumen=s220_resumen(q);
  const rows=resumen.rows;
  const tipos=Object.keys(resumen.tipos);
  const filtered=s220_filter(q,rows);
  return `<section class="wrap execMobile">${back()}<h2>Ejecución técnica</h2>
    <p class="notice"><b>Cotización:</b> ${s220_e(s220_code(q))} | <b>Cliente:</b> ${s220_e(s220_cliente(q))} | <b>OS/OC:</b> ${s220_e(q.ordenNumero)} | <b>SIAF:</b> ${s220_e(q.siaf)}</p>
    <div class="saveStatus">${s220_e(q.execSaveStatus||'✓ Listo para registrar')}</div>
    <div class="summaryGrid">
      <div><b>Total</b><strong>${resumen.total}</strong></div>
      <div><b>Registrados</b><strong>${resumen.registrados}</strong></div>
      <div><b>Pendientes</b><strong>${resumen.pendientes}</strong></div>
      <div><b>En taller</b><strong>${resumen.taller}</strong></div>
      <div><b>Finalizados</b><strong>${resumen.finalizados}</strong></div>
      <div><b>Observados</b><strong>${resumen.observados}</strong></div>
    </div>
    <div class="typeSummary">${tipos.map(t=>`<span>${s220_e(t)}: <b>${resumen.tipos[t].registrados}/${resumen.tipos[t].total}</b></span>`).join('')}</div>
    <div class="card stickyFilters">
      <h3>Filtros</h3>
      <div class="grid">
        <label class="fieldHint"><b>Tipo</b><select onchange="s220_setFilter('${q.id}','tipo',this.value)"><option>Todos</option>${tipos.map(t=>`<option ${q.execFilter?.tipo===t?'selected':''}>${s220_e(t)}</option>`).join('')}</select></label>
        <label class="fieldHint"><b>Estado</b><select onchange="s220_setFilter('${q.id}','estado',this.value)">${['Todos','Pendiente','Registrado','Retirado','En taller','Finalizado','Observado'].map(s=>`<option ${q.execFilter?.estado===s?'selected':''}>${s}</option>`).join('')}</select></label>
        <label class="fieldHint"><b>Buscar</b><input value="${s220_e(q.execFilter?.buscar||'')}" placeholder="Serie, patrimonial, ubicación, código..." onchange="s220_setFilter('${q.id}','buscar',this.value)"></label>
      </div>
      <div class="bar"><button class="btn" onclick="s220_reset('${q.id}')">Regenerar equipos</button></div>
    </div>
    <div class="execList">${filtered.map(r=>s220_card(q,r,rows.indexOf(r))).join('')||'<p class="notice">Sin equipos para mostrar con el filtro actual.</p>'}</div>
  </section>`;
};

render=function(){
  if(typeof ensureActiveEmpresa==='function')ensureActiveEmpresa();
  if(typeof s21_allEmpresas==='function')s21_allEmpresas();
  app.innerHTML=`<header class="top"><div><h1>${VERSION_EJECUCION_MOBILE}</h1><b>Ejecución mobile first + autosave + resumen por equipos</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${(views[tab]||views.Dashboard)()}</main>`;
  bind(); if(typeof initSignaturePads==='function')initSignaturePads();
};
render();
