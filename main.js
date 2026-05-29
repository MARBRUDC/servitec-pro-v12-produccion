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
function render(){app.innerHTML=`<header class="top"><div><h1>SERVITEC PRO V13.13 EJECUCIÓN CONTROLADA</h1><b>Cotización dinámica + Nube + PDFs corporativos</b></div><div class="tag">${cloud}</div></header><nav class="nav">${['Dashboard','Empresas','Clientes','Cotizaciones','Ejecución','Actas','Informes','Inventario','Configuración'].map(x=>`<button class="${tab===x?'active':''}" onclick="tab='${x}';draft=null;render()">${x}</button>`).join('')}</nav><main>${views[tab]()}</main>`; bind()}
const views={Dashboard(){return `<section class="wrap"><h2>Dashboard</h2><div class="grid"><div class="card"><b>Empresas</b><h2>${state.empresas.length}</h2></div><div class="card"><b>Clientes</b><h2>${state.clientes.length}</h2></div><div class="card"><b>Cotizaciones</b><h2>${state.cotizaciones.length}</h2></div><div class="card"><b>Inventario</b><h2>${state.inventario.length}</h2></div></div><p class="notice">Versión con PDF corporativo agrupado por equipo, firma del gerente e importación/edición estable.</p></section>`},Empresas(){return `<section class="wrap">${back()}<h2>Empresas</h2><p class="notice">Aquí se guarda el logo, firma del gerente, datos comerciales y observaciones que salen automáticamente en los PDF.</p><div class="grid"><input id="empNom" placeholder="Razón social"><input id="empRuc" placeholder="RUC"><input id="empTel" placeholder="Teléfono"><input id="empCor" placeholder="Correo"><input id="empDir" placeholder="Dirección"><input id="empGer" placeholder="Gerente / Representante"></div><br><button class="btn green" data-act="saveEmpresa">+ Nueva empresa</button><hr>${state.empresas.map(e=>empresaCard(e)).join('')}</section>`},Clientes(){let c=state.clientes[0];return `<section class="wrap">${back()}<h2>Clientes</h2><div class="grid2"><input id="cliNom" placeholder="Nombre cliente"><input id="cliRuc" placeholder="RUC"></div><br><button class="btn green" data-act="saveCliente">+ Nuevo cliente</button><hr><div class="grid2"><select id="cliSel">${state.clientes.map(x=>`<option value="${x.id}">${x.nombre}</option>`).join('')}</select><input id="estNom" placeholder="Nuevo establecimiento"></div><br><button class="btn green" data-act="saveEst">Agregar establecimiento</button>${c?`<div class="card"><h3>${c.nombre}</h3>${c.establecimientos.map(e=>`<div class="card"><b>${e.nombre}</b><ul>${e.areas.map(a=>`<li>${a.nombre}</li>`).join('')}</ul><div class="grid2"><input id="area_${e.id}" placeholder="Área usuaria"><button class="btn" data-act="saveArea" data-id="${e.id}">Agregar área</button></div></div>`).join('')}</div>`:''}</section>`},Cotizaciones(){return draft?quoteForm():quoteList()},Ejecución(){return viewEjecucion()},Actas(){return docs('ACTA DE CONFORMIDAD')},Informes(){return docs('INFORME TÉCNICO')},Inventario(){return `<section class="wrap">${back()}<h2>Inventario / QR / Código de barras</h2><div class="grid"><select id="invTipo"><option>Equipo</option><option>Repuesto</option><option>Accesorio</option></select><input id="invCod" placeholder="Código"><input id="invDesc" placeholder="Descripción"><input id="invSerie" placeholder="Serie"></div><br><button class="btn green" data-act="saveInv">Agregar</button>${table(['Tipo','Descripción','Código','QR','Barras'],state.inventario.map(i=>[i.tipo,i.descripcion,i.codigo,`▣ ${i.codigo||i.id}`,`|||| ${i.codigo||i.id} ||||`]))}</section>`},Configuración(){return `<section class="wrap">${back()}<h2>Configuración</h2><p class="notice">${cloud}</p><p>Variables Vercel: VITE_SUPABASE_URL y VITE_SUPABASE_KEY.</p></section>`}};
function back(){return `<button class="btn primary" onclick="tab='Dashboard';draft=null;render()">← Atrás</button>`} function table(h,rows){return `<div class="tableWrap"><table><thead><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c||''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function quoteList(){return `<section class="wrap">${back()}<h2>Cotizaciones</h2><button class="btn green" onclick="draft=newDraft();render()">+ Nueva cotización</button>${table(['N°','Cliente','Configuración','Total','Acciones'],state.cotizaciones.map(q=>[q.numero,q.clienteNombre,q.config,money(q.total),`<div class="actions"><button class="btn" onclick="draft=clone(state.cotizaciones.find(x=>x.id==='${q.id}'));render()">Editar</button><button class="btn green" onclick="printQuote('${q.id}','COTIZACIÓN')">PDF</button><button class="btn" onclick="csv('${q.id}')">Excel</button><button class="btn" onclick="word('${q.id}')">Word</button><button class="btn danger" onclick="delQuote('${q.id}')">Eliminar</button></div>`]))}</section>`}
function newDraft(){let c=state.clientes[0]||{}, e=c.establecimientos?.[0]||{}, a=e.areas?.[0]||{};return {id:uid(),numero:`COT-${new Date().getFullYear()}-${String(state.cotizaciones.length+1).padStart(4,'0')}`,empresaId:state.empresas[0]?.id||'',clienteId:c.id||'',estId:e.id||'',areaId:a.id||'',tipo:'Mantenimiento preventivo',config:MODES.GENERAL,equipos:[],acts:[],repuestos:[],total:0,fecha:new Date().toISOString()}}
function cdata(){let c=state.clientes.find(x=>x.id===draft.clienteId)||state.clientes[0]||{}, e=(c.establecimientos||[]).find(x=>x.id===draft.estId)||c.establecimientos?.[0]||{}, a=(e.areas||[]).find(x=>x.id===draft.areaId)||e.areas?.[0]||{};return {c,ests:c.establecimientos||[],e,areas:e.areas||[],a}}
function qtotal(q=draft){if(q.config===MODES.REPUESTOS)return q.repuestos.reduce((s,r)=>s+(+r.cantidad||0)*(+r.precio||0),0);if(q.config===MODES.PROPIAS)return q.equipos.reduce((s,e)=>s+(e.acts||[]).reduce((a,x)=>a+(+x.cantidad||0)*(+x.precio||0),0),0);return q.acts.reduce((s,a)=>s+(+a.cantidad||0)*(+a.precio||0),0)}
function quoteForm(){let {c,ests,e,areas}=cdata();draft.total=qtotal();return `<section class="wrap">${back()}<h2>Nueva cotización</h2><div class="grid"><select data-k="clienteId">${state.clientes.map(x=>`<option value="${x.id}" ${x.id===draft.clienteId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="estId">${ests.map(x=>`<option value="${x.id}" ${x.id===draft.estId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="areaId">${areas.map(x=>`<option value="${x.id}" ${x.id===draft.areaId?'selected':''}>${x.nombre}</option>`)}</select><select data-k="tipo">${['Mantenimiento preventivo','Mantenimiento correctivo','Calibración','Servicio + repuestos','Venta'].map(x=>`<option ${x===draft.tipo?'selected':''}>${x}</option>`)}</select><select data-k="config">${Object.values(MODES).map(x=>`<option ${x===draft.config?'selected':''}>${x}</option>`)}</select></div><div class="bar"><span class="pill">${draft.config}</span><b class="total">Total: ${money(draft.total)}</b></div>${modeView()}<div class="bar"><button class="btn green" onclick="saveQuote()">Guardar y volver a lista</button><button class="btn danger" onclick="draft=null;render()">Cancelar</button></div></section>`}
function modeView(){if(draft.config===MODES.REPUESTOS)return repView(); if(draft.config===MODES.PROPIAS)return propiaView(); return generalView()}
function generalView(){return `<p class="notice">Una sola lista de actividades se aplicará a todos los equipos.</p><div class="bar"><button class="btn green" onclick="draft.equipos.push(eq());render()">+ Equipo</button><button class="btn green" onclick="draft.acts.push(act());render()">+ Actividad</button><button class="btn" onclick="importGeneral()">Importar solo descripciones</button></div><h3>Equipos incluidos</h3>${equiposTable(draft.equipos)}<h3>Actividades generales</h3>${actsTable(draft.acts)}</section>`}
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
  @page{size:A4;margin:18mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#001b3f;font-size:12px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:5px solid #0f7f73;padding-bottom:14px;margin-bottom:16px}.pdfLogo{max-height:62px;max-width:190px;margin-bottom:6px}.brand{font-size:27px;font-weight:900;color:#0f7f73;letter-spacing:.5px}.empresa{font-size:12px;line-height:1.45}.docTitle{text-align:right}.docTitle h1{font-size:28px;margin:0;color:#001b3f}.docTitle .num{font-size:17px;font-weight:800;color:#b30000;margin-top:6px}.box{background:#f1f7ff;padding:12px 14px;border-radius:10px;margin:12px 0;display:grid;grid-template-columns:1fr 1fr;gap:5px 24px}.intro{margin:14px 0;line-height:1.55}.group{margin-top:12px;page-break-inside:avoid}.group h3{background:#e8f7f6;border-left:6px solid #0f7f73;padding:8px 10px;margin:12px 0 8px;color:#001b3f;text-transform:uppercase}.small{font-size:11px;margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:8px 0 10px}th{background:#0f7f73;color:#fff;font-weight:800}th,td{border:1px solid #cfe0f2;padding:7px;vertical-align:top}td:nth-child(1),td:nth-child(3){text-align:center}td:nth-child(4),td:nth-child(5){text-align:right}.subtotal{text-align:right;font-weight:800;margin:3px 0 12px}.summary{margin-left:auto;width:330px;border:1px solid #cfe0f2;border-radius:8px;overflow:hidden}.summary div{display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #cfe0f2}.summary div:last-child{border-bottom:0;background:#0f7f73;color:white;font-size:18px;font-weight:900}.cond{border:1px solid #cfe0f2;border-radius:8px;padding:10px;margin-top:14px;line-height:1.55}.cond h3{margin:0 0 7px;color:#0f7f73}.obs{margin-top:8px}.firma{margin-top:62px;text-align:center;width:300px;margin-left:auto;margin-right:auto}.pdfFirma{max-height:70px;max-width:220px;display:block;margin:0 auto 4px}.firma .line{border-top:1px solid #001b3f;padding-top:8px;font-weight:800}.footer{position:fixed;bottom:8mm;left:18mm;right:18mm;font-size:10px;color:#456;display:flex;justify-content:space-between}
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
function tableExec(rs,q){let exec=q.execRows||[];return `<div class="tableWrap"><table><thead><tr><th>Actividad/Repuesto</th><th>Estado</th><th>Observación</th><th>Evidencia</th></tr></thead><tbody>${rs.map((r,i)=>{let er=exec[i]||{};return `<tr><td>${r.descripcion}</td><td><select onchange="let q=state.cotizaciones.find(x=>x.id==='${q.id}');q.execRows=q.execRows||[];q.execRows[${i}]=q.execRows[${i}]||{};q.execRows[${i}].estado=this.value;persist()"><option ${er.estado==='Pendiente'?'selected':''}>Pendiente</option><option ${er.estado==='En proceso'?'selected':''}>En proceso</option><option ${er.estado==='Conforme'?'selected':''}>Conforme</option><option ${er.estado==='Observado'?'selected':''}>Observado</option></select></td><td><textarea placeholder="Observación técnica" onchange="let q=state.cotizaciones.find(x=>x.id==='${q.id}');q.execRows=q.execRows||[];q.execRows[${i}]=q.execRows[${i}]||{};q.execRows[${i}].observacion=this.value;persist()">${er.observacion||''}</textarea></td><td><input type="file" accept="image/*"></td></tr>`}).join('')}</tbody></table></div>`}function docs(t){return `<section class="wrap">${back()}<h2>${t}</h2>${state.cotizaciones.map(q=>`<div class="card"><b>${q.numero}</b> · ${q.clienteNombre} · ${money(q.total)}<br><button class="btn green" onclick="printQuote('${q.id}','${t}')">Generar PDF</button></div>`).join('')}</section>`}function esc(s=''){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}

function empresaCard(e){return `<div class="card"><h3>${e.nombre}</h3><div class="grid"><input data-emp-field="nombre" data-id="${e.id}" value="${esc(e.nombre)}" placeholder="Razón social"><input data-emp-field="ruc" data-id="${e.id}" value="${esc(e.ruc)}" placeholder="RUC"><input data-emp-field="telefono" data-id="${e.id}" value="${esc(e.telefono)}" placeholder="Teléfono"><input data-emp-field="correo" data-id="${e.id}" value="${esc(e.correo)}" placeholder="Correo"><input data-emp-field="direccion" data-id="${e.id}" value="${esc(e.direccion)}" placeholder="Dirección"><input data-emp-field="gerente" data-id="${e.id}" value="${esc(e.gerente||'GERENTE GENERAL')}" placeholder="Gerente / representante"></div><div class="grid2"><label class="uploadBox"><b>Logo empresa</b><input type="file" accept="image/*" data-emp-file="logo" data-id="${e.id}">${e.logo?'<span>Logo cargado ✅</span>':'<span>Sin logo</span>'}</label><label class="uploadBox"><b>Firma gerente</b><input type="file" accept="image/*" data-emp-file="firma" data-id="${e.id}">${e.firma?'<span>Firma cargada ✅</span>':'<span>Sin firma</span>'}</label></div><h4>Condiciones comerciales para PDF</h4><div class="grid"><input data-emp-field="formaPago" data-id="${e.id}" value="${esc(e.formaPago||'')}" placeholder="Forma de pago"><input data-emp-field="tiempoEjecucion" data-id="${e.id}" value="${esc(e.tiempoEjecucion||'')}" placeholder="Tiempo de ejecución"><input data-emp-field="lugarServicio" data-id="${e.id}" value="${esc(e.lugarServicio||'')}" placeholder="Lugar del servicio"><input data-emp-field="validez" data-id="${e.id}" value="${esc(e.validez||'')}" placeholder="Validez de oferta"><input data-emp-field="garantia" data-id="${e.id}" value="${esc(e.garantia||'')}" placeholder="Garantía"></div><textarea data-emp-field="observacionesCot" data-id="${e.id}" rows="4" placeholder="Observaciones de cotización">${esc(e.observacionesCot||'')}</textarea></div>`}
function selectedExecId(){return localStorage.getItem('servitec_exec_qid')||state.cotizaciones[0]?.id||''}
function viewEjecucion(){let qid=selectedExecId();let q=state.cotizaciones.find(x=>x.id===qid)||state.cotizaciones[0];if(!state.cotizaciones.length)return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">No hay cotizaciones registradas.</p></section>`;return `<section class="wrap">${back()}<h2>Ejecución</h2><p class="notice">Solo una cotización con orden de compra/servicio y SIAF puede pasar a ejecución.</p><select id="execSel" onchange="localStorage.setItem('servitec_exec_qid',this.value);render()">${state.cotizaciones.map(x=>`<option value="${x.id}" ${x.id===q.id?'selected':''}>${x.numero} - ${x.clienteNombre}</option>`).join('')}</select>${execGate(q)}</section>`}
function execGate(q){if(!q.ordenNumero||!q.siaf){return `<div class="card"><h3>Autorizar ejecución</h3><p>La cotización <b>${q.numero}</b> aún está en fase de cotización. Para iniciar ejecución registra la orden y el SIAF.</p><div class="grid"><select id="execTipo"><option value="Orden de servicio">Orden de servicio</option><option value="Orden de compra">Orden de compra</option></select><input id="execOrden" placeholder="N° orden de compra/servicio"><input id="execSiaf" placeholder="N° SIAF"><input id="execFecha" type="date" value="${new Date().toISOString().slice(0,10)}"></div><br><button class="btn green" onclick="autorizarExec('${q.id}')">Iniciar ejecución</button></div>`}return `<div class="card"><h3>Ejecución autorizada</h3><p><b>${q.ordenTipo||'Orden'}:</b> ${q.ordenNumero} · <b>SIAF:</b> ${q.siaf} · <b>Fecha:</b> ${q.fechaOrden||''}</p></div>${tableExec(rows(q),q)}`}
function autorizarExec(id){let q=state.cotizaciones.find(x=>x.id===id);let orden=$('#execOrden').value.trim(), siaf=$('#execSiaf').value.trim();if(!orden||!siaf){alert('Registra N° de orden y N° SIAF para iniciar ejecución.');return}q.ordenTipo=$('#execTipo').value;q.ordenNumero=orden;q.siaf=siaf;q.fechaOrden=$('#execFecha').value;q.estado='En ejecución';q.execRows=rows(q).map((r,i)=>({id:r.id||('r'+i),estado:'Pendiente',observacion:'',descripcion:r.descripcion}));persist();render()}

loadCloud();render();
// FORCE DEPLOY V13-13
