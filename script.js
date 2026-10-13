const state={images:{},players:[],transfers:[],fixtures:[],results:[],news:[],messages:[],press:[],board:[],settings:{},custom:{club:'',initials:'CR',color:'#42d392',color2:'#167b57',hidden:[]}};
const tabNames={'dashboard':'Visão geral','news':'Notícias','inbox':'Mensagens','squad':'Elenco','transfers':'Mercado','calendar':'Calendário','press':'Imprensa','board':'Diretoria','customize':'Personalizar','settings':'Meu save'};
const $=id=>document.getElementById(id);let toastTimer;
function toast(m){$('toast').textContent=m;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',2600)}
function goTab(id){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===id));window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>goTab(b.dataset.tab)));
function openSetup(){$('setup').style.display='flex'}
function finishSetup(){const club=$('setupClub').value.trim();if(club){state.custom.club=club;applyCustomization(false)}$('setup').style.display='none';renderImageSummary();toast('Painel aberto! Você pode adicionar ou trocar as fotos quando quiser.')}
function handleImage(file,key){if(!file)return;const reader=new FileReader();reader.onload=()=>{state.images[key]=reader.result;$('status-'+key)&&($('status-'+key).textContent='Imagem selecionada: '+file.name);renderImage(key);renderImageSummary();if(key==='crest'){state.custom.badge=reader.result;renderCrest()}toast('Imagem anexada como referência.');};reader.readAsDataURL(file)}
document.querySelectorAll('input[data-image]').forEach(inp=>inp.addEventListener('change',e=>handleImage(e.target.files[0],inp.dataset.image)));
function renderImage(key){const target=$('preview-'+key);if(!target)return;target.innerHTML='';if(state.images[key]){const img=document.createElement('img');img.src=state.images[key];img.className='preview';img.alt='Imagem de referência: '+key;target.appendChild(img)}}
$('matchPhoto').addEventListener('change',e=>handleImage(e.target.files[0],'match'));
$('customBadge').addEventListener('change',e=>handleImage(e.target.files[0],'crest'));
function renderImageSummary(){const names={calendar:'Calendário',squad:'Elenco',stats:'Classificação/estatísticas',board:'Finanças/diretoria',crest:'Escudo/identidade',match:'Estatísticas da partida'};const keys=Object.keys(names).filter(k=>state.images[k]);$('imageSummary').textContent=keys.length?keys.map(k=>names[k]).join(' · '):'Nenhuma imagem importada.';['calendar','squad','stats','board','crest','match'].forEach(renderImage);if(state.images.calendar)$('calendarSummary').textContent='Imagem do calendário anexada. Confira os jogos e registre os próximos manualmente.'}
function addRow(table,values,onDelete){const tr=document.createElement('tr');values.forEach(v=>{const td=document.createElement('td');td.textContent=v??'—';tr.appendChild(td)});const td=document.createElement('td');const b=document.createElement('button');b.className='btn small';b.textContent='Remover';b.onclick=()=>{onDelete();tr.remove();persist()};td.appendChild(b);tr.appendChild(td);$(table).querySelector('tbody').appendChild(tr);return tr}
$('playerForm').addEventListener('submit',e=>{e.preventDefault();const p={name:$('pName').value,pos:$('pPos').value,age:$('pAge').value,ovr:$('pOvr').value,fit:$('pFit').value,status:$('pStatus').value};state.players.push(p);addRow('squadTable',[p.name,p.pos,p.age||'—',p.ovr||'—',p.fit?p.fit+'%':'—',p.status],()=>state.players.splice(state.players.indexOf(p),1));e.target.reset();persist();toast('Jogador adicionado ao elenco.')});
$('transferForm').addEventListener('submit',e=>{e.preventDefault();const t={name:$('tName').value,pos:$('tPos').value,value:$('tValue').value,priority:$('tPriority').value,notes:$('tNotes').value};state.transfers.push(t);addRow('transferTable',[t.name,t.pos,t.value,t.priority,t.notes],()=>state.transfers.splice(state.transfers.indexOf(t),1));e.target.reset();persist();toast('Alvo adicionado ao radar.')});
$('fixtureForm').addEventListener('submit',e=>{e.preventDefault();const f={date:$('fDate').value,opp:$('fOpp').value,comp:$('fComp').value,venue:$('fVenue').value,status:'Pendente'};state.fixtures.push(f);addRow('fixtureTable',[f.date||'A definir',f.opp,f.comp||'—',f.venue,f.status],()=>state.fixtures.splice(state.fixtures.indexOf(f),1));if(state.fixtures.length===1){$('nextOpponent').textContent=f.opp;$('calendarSummary').textContent=(f.date?f.date+' · ':'')+(f.comp||'Partida')+' · '+f.venue}e.target.reset();persist();toast('Partida adicionada ao calendário.')});
$('resultForm').addEventListener('submit',e=>{e.preventDefault();const r={opp:$('rOpp').value,comp:$('rComp').value,gf:+$('rGF').value,ga:+$('rGA').value,poss:$('rPoss').value,shots:$('rShots').value,cards:$('rCards').value,mvp:$('rMvp').value,notes:$('rNotes').value};r.outcome=r.gf>r.ga?'Vitória':r.gf===r.ga?'Empate':'Derrota';state.results.unshift(r);const matchingFixture=state.fixtures.find(f=>f.opp.toLowerCase().trim()===r.opp.toLowerCase().trim()&&(!r.comp||!f.comp||f.comp.toLowerCase().trim()===r.comp.toLowerCase().trim())&&f.status==='Pendente');if(matchingFixture){matchingFixture.status='Jogado · '+r.gf+'–'+r.ga;rebuildFixtures()}renderResults();$('dashResult').textContent=r.gf+'–'+r.ga;$('dashResult').className=r.outcome==='Vitória'?'green':r.outcome==='Derrota'?'red':'gold';e.target.reset();persist();toast('Estatísticas da partida registradas.')});
function renderResults(){$('resultList').innerHTML='';$('recentResults').textContent='';state.results.forEach((r,i)=>{const d=document.createElement('div');d.className='inbox-item';const h=document.createElement('h4');h.textContent=r.outcome+' · '+r.gf+'–'+r.ga+' vs '+r.opp;const p=document.createElement('p');p.textContent=[r.comp,r.poss?'Posse '+r.poss+'%':'',r.shots?'Finalizações '+r.shots:'',r.cards?'Cartões '+r.cards:'',r.mvp?'Destaque: '+r.mvp:'',r.notes].filter(Boolean).join(' · ');d.append(h,p);$('resultList').appendChild(d);if(i<4){const item=document.createElement('p');item.textContent=r.outcome+' · '+r.gf+'–'+r.ga+' vs '+r.opp;$('recentResults').appendChild(item)}});if(!state.results.length)$('recentResults').textContent='Nenhuma partida registrada ainda.'}
function addNews(){const n={headline:$('newsHeadline').value.trim(),body:$('newsBody').value.trim(),source:$('newsSource').value};if(!n.headline||!n.body){toast('Preencha manchete e texto.');return}state.news.unshift(n);renderNews();$('newsHeadline').value='';$('newsBody').value='';persist();toast('Notícia publicada.')}
function renderNews(){$('newsList').innerHTML='';state.news.forEach(n=>{const d=document.createElement('div');d.className='news';const ic=document.createElement('div');ic.className='news-icon';ic.textContent='📰';const content=document.createElement('div');const h=document.createElement('h4');h.textContent=n.headline;const p=document.createElement('p');p.textContent=n.body;const small=document.createElement('div');small.className='sub';small.textContent=n.source;content.append(h,p,small);d.append(ic,content);$('newsList').appendChild(d)})}
function addMessage(){const m={from:$('msgFrom').value,title:$('msgTitle').value.trim(),body:$('msgBody').value.trim()};if(!m.title||!m.body){toast('Preencha assunto e mensagem.');return}state.messages.unshift(m);renderMessages();$('msgTitle').value='';$('msgBody').value='';persist();toast('Mensagem guardada.')}
function renderMessages(){$('messageList').innerHTML='';state.messages.forEach(m=>{const d=document.createElement('div');d.className='inbox-item';const f=document.createElement('div');f.className='from';f.textContent=m.from;const h=document.createElement('h4');h.textContent=m.title;const p=document.createElement('p');p.textContent=m.body;d.append(f,h,p);$('messageList').appendChild(d)})}
function generatePress(){const topic=$('pressTopic').value;const qs={'Vitória importante':['O que funcionou melhor no plano de jogo?','Como evitar que o elenco perca a concentração?'],'Derrota pesada':['A equipe sentiu a pressão em algum momento?','Você pretende fazer mudanças na escalação?'],'Clássico':['O peso emocional do clássico influenciou?','O que este resultado representa para a torcida?'],'Jogador insatisfeito':['Como pretende administrar a insatisfação do atleta?','A hierarquia do elenco pode mudar?'],'Mercado de transferências':['Quais posições são prioridade na janela?','O clube está preparado para perder titulares?'],'Crise com a diretoria':['Você sente que ainda tem respaldo da direção?','O que precisa mudar nos próximos jogos?'],'Promessa da base':['O jovem está pronto para ter mais minutos?','Como evitar pressão excessiva sobre ele?']}[topic];$('pressQuestions').innerHTML='';qs.forEach((q,i)=>{const p=document.createElement('p');p.textContent=(i+1)+'. '+q;$('pressQuestions').appendChild(p)})}
function savePress(){const p={topic:$('pressTopic').value,questions:$('pressQuestions').innerText,answers:$('pressAnswers').value};state.press.unshift(p);const d=document.createElement('div');d.className='inbox-item';const h=document.createElement('h4');h.textContent='Coletiva · '+p.topic;const body=document.createElement('p');body.textContent=p.questions+' | Respostas: '+p.answers;d.append(h,body);$('pressLog').prepend(d);persist();toast('Coletiva guardada.')}
function saveBoard(){const b={message:$('boardMessage').value,objective:$('boardObjective').value,trust:$('boardTrust').value};state.board.unshift(b);$('boardLog').innerHTML='';const d=document.createElement('div');d.className='inbox-item';const h=document.createElement('h4');h.textContent='Objetivo: '+b.objective+' · Confiança: '+b.trust+'%';const p=document.createElement('p');p.textContent=b.message||'Sem mensagem adicional.';d.append(h,p);$('boardLog').appendChild(d);persist();toast('Dados da diretoria atualizados.')}
const menuDefs=[['dashboard','Visão geral'],['news','Notícias'],['inbox','Mensagens'],['squad','Elenco'],['transfers','Mercado'],['calendar','Calendário'],['press','Imprensa'],['board','Diretoria'],['customize','Personalizar'],['settings','Meu save']];
function buildMenuOptions(){const wrap=$('menuOptions');wrap.innerHTML='';menuDefs.forEach(([id,label])=>{const lab=document.createElement('label');lab.style.cssText='display:flex;gap:8px;align-items:center;color:var(--text);font-size:13px';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!state.custom.hidden.includes(id);cb.dataset.menu=id;cb.style.accentColor='var(--accent)';lab.append(cb,document.createTextNode(label));wrap.appendChild(lab)})}
function applyCustomization(show=true){const c=$('customClub')?.value.trim()||state.custom.club||$('setupClub')?.value.trim()||'';const initials=$('customInitials')?.value.trim()||c.slice(0,3).toUpperCase()||'CR';const color=$('customColor')?.value||state.custom.color;const color2=$('customColor2')?.value||state.custom.color2;state.custom={...state.custom,club:c,initials,color,color2,hidden:[...document.querySelectorAll('[data-menu]:not(:checked)')].map(x=>x.dataset.menu)};document.documentElement.style.setProperty('--accent',color);document.documentElement.style.setProperty('--accent2',color2);$('brandTitle').textContent=c||'Carreira Realista';$('previewClub').textContent=c||'Carreira Realista';$('clubCrest').textContent=initials;$('previewCrest').textContent=initials;$('homeInitial').textContent=initials;$('homeName').textContent=c||'Seu Clube';if(state.custom.badge){['clubCrest','previewCrest'].forEach(id=>{const el=$(id);el.textContent='';el.style.backgroundImage=`url("${state.custom.badge}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center'})}document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('hidden',state.custom.hidden.includes(b.dataset.tab))});if(state.custom.hidden.includes(document.querySelector('.section.active')?.id))goTab('dashboard');if(show){persist();toast('Menu e identidade personalizados!')}}
function renderCrest(){if(state.custom.badge){['clubCrest','previewCrest'].forEach(id=>{const el=$(id);el.textContent='';el.style.backgroundImage=`url("${state.custom.badge}")`;el.style.backgroundSize='cover';el.style.backgroundPosition='center'})}}
function resetCustomization(){state.custom={club:'',initials:'CR',color:'#42d392',color2:'#167b57',hidden:[]};$('customClub').value='';$('customInitials').value='';$('customColor').value='#42d392';$('customColor2').value='#167b57';state.custom.badge=null;['clubCrest','previewCrest'].forEach(id=>{const el=$(id);el.style.backgroundImage='';el.textContent='CR'});buildMenuOptions();applyCustomization();toast('Personalização restaurada.')}
$('customClub').addEventListener('input',()=>{$('previewClub').textContent=$('customClub').value||'Carreira Realista'});
$('customInitials').addEventListener('input',()=>{$('previewCrest').textContent=$('customInitials').value||'CR'});
$('customColor').addEventListener('input',()=>document.documentElement.style.setProperty('--accent',$('customColor').value));
function applySaveSettings(){state.settings={manager:$('managerName').value,season:$('seasonName').value,league:$('leagueName').value,budget:$('budgetName').value,rules:$('saveRules').value};if(state.settings.manager)$('welcomeTitle').textContent='Bom trabalho, '+state.settings.manager+'! 👋';if(state.settings.season)$('seasonTag').textContent='TEMPORADA '+state.settings.season.toUpperCase();if(state.settings.budget)$('dashBudget').textContent=state.settings.budget;persist();toast('Identificação do save atualizada.')}
function persist(){try{const serial={...state,images:{}};localStorage.setItem('careerRealistaState',JSON.stringify(serial));}catch(e){console.warn('Não foi possível guardar os dados localmente',e)}}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='meu-save-carreira-realista.json';a.click();URL.revokeObjectURL(a.href)}
$('importJson').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);Object.assign(state,d);state.images=state.images||{};rebuild();persist();toast('Save importado.')}catch(err){toast('Arquivo JSON inválido.')}};reader.readAsText(file)});
function rebuild(){['squadTable','transferTable','fixtureTable'].forEach(id=>$(id).querySelector('tbody').innerHTML='');state.players.forEach(p=>addRow('squadTable',[p.name,p.pos,p.age||'—',p.ovr||'—',p.fit?p.fit+'%':'—',p.status],()=>state.players.splice(state.players.indexOf(p),1)));state.transfers.forEach(t=>addRow('transferTable',[t.name,t.pos,t.value,t.priority,t.notes],()=>state.transfers.splice(state.transfers.indexOf(t),1)));rebuildFixtures();renderResults();renderNews();renderMessages();buildMenuOptions();applyCustomization(false);renderImageSummary()}

async function runOCR(){
  const key=$('ocrImageKey').value;
  const data=state.images[key];
  if(!data){$('ocrStatus').textContent='Envie primeiro uma imagem de '+key+' na configuração inicial.';return}
  if(!window.Tesseract){$('ocrStatus').textContent='Não foi possível carregar o OCR. Confira sua conexão e recarregue a página.';return}
  const btn=document.querySelector('button[onclick="runOCR()"]');
  if(btn){btn.disabled=true;btn.textContent='Lendo imagem…'}
  $('ocrStatus').textContent='Reconhecendo texto da imagem. Isso pode levar um pouco…';
  try{
    const result=await Tesseract.recognize(data,'por+eng',{logger:m=>{
      if(m.status && m.progress!=null)$('ocrStatus').textContent=m.status+' · '+Math.round(m.progress*100)+'%';
    }});
    $('ocrText').value=(result.data&&result.data.text)||'Nenhum texto reconhecido.';
    $('ocrStatus').textContent='Leitura concluída. Revise e corrija o texto antes de importar.';
    toast('OCR concluído. Revise o texto reconhecido.');
  }catch(err){
    console.error(err);$('ocrStatus').textContent='Falha ao ler a imagem. Tente uma captura mais nítida ou digite os dados manualmente.';
  }finally{if(btn){btn.disabled=false;btn.textContent='🔎 Reconhecer texto'}}
}
function sendOCRToCalendar(){
  const text=$('ocrText').value.trim();
  if(!text){toast('Faça uma leitura OCR ou cole o texto primeiro.');return}
  $('bulkFixtures').value=text.split(/\r?\n/).filter(Boolean).map(line=>{
    const clean=line.replace(/\s{2,}/g,' ').trim();
    const parts=clean.split(/\s*[|;]\s*/);
    if(parts.length>=2)return [parts[0],parts[1],parts[2]||'',parts[3]||''].join(' | ');
    return clean+' |  |  | ';
  }).join('\n');
  $('setup').style.display='none';goTab('calendar');
  toast('Texto enviado para a importação. Confira cada linha antes de importar.');
}
function importBulkFixtures(){
  const raw=$('bulkFixtures').value.trim();
  if(!raw){toast('Cole uma lista de partidas primeiro.');return}
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  let added=0;
  lines.forEach(line=>{
    const parts=line.split(/\s*[|;]\s*/).map(x=>x.trim());
    if(parts.length<2||!parts[1])return;
    const f={date:parts[0]||'',opp:parts[1],comp:parts[2]||'',venue:/fora|away|visitante/i.test(parts[3]||'')?'Fora':/neutro/i.test(parts[3]||'')?'Neutro':'Casa',status:'Pendente'};
    state.fixtures.push(f);added++;
  });
  rebuildFixtures();
  if(added){const f=state.fixtures.find(x=>x.status==='Pendente');if(f){$('nextOpponent').textContent=f.opp;$('calendarSummary').textContent=(f.date?f.date+' · ':'')+(f.comp||'Partida')+' · '+f.venue}persist();toast(added+' partida(s) adicionada(s).')}
  else toast('Nenhuma linha válida. Use: data | adversário | competição | local');
}
function rebuildFixtures(){
  const body=$('fixtureTable').querySelector('tbody');body.innerHTML='';
  state.fixtures.forEach(f=>addRow('fixtureTable',[f.date||'A definir',f.opp,f.comp||'—',f.venue||'Casa',f.status||'Pendente'],()=>state.fixtures.splice(state.fixtures.indexOf(f),1)));
}

buildMenuOptions();
