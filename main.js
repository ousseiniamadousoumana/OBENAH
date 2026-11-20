(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const root=document.documentElement;
  const cfg={url:window.SSEINYS_SUPABASE_URL||'',key:window.SSEINYS_SUPABASE_ANON_KEY||'',wa:window.SSEINYS_WHATSAPP||'2290150228050'};
  const configured=()=>window.supabase?.createClient && cfg.url.startsWith('https://') && !cfg.url.includes('VOTRE-PROJET') && cfg.key.length>20 && !cfg.key.includes('VOTRE_CLE');
  const db=configured()?window.supabase.createClient(cfg.url,cfg.key):null;
  window.SSEINYS_DB=db;
  const toast=(msg)=>{let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.append(t)}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3500)};
  try{root.dataset.theme=localStorage.getItem('sseinys-theme')||'dark'}catch{}
  $('#theme')?.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('sseinys-theme',root.dataset.theme)}catch{}});
  const open=()=>{document.body.classList.add('open');$('#open')?.setAttribute('aria-expanded','true');$('#drawer')?.setAttribute('aria-hidden','false')};
  const close=()=>{document.body.classList.remove('open');$('#open')?.setAttribute('aria-expanded','false');$('#drawer')?.setAttribute('aria-hidden','true')};
  $('#open')?.addEventListener('click',open);$('#close')?.addEventListener('click',close);$('#backdrop')?.addEventListener('click',close);
  $('#drawer')?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();$$('.modal.open').forEach(m=>m.classList.remove('open'))}});
  $('#year')&&( $('#year').textContent=new Date().getFullYear());
  if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});$$('.reveal').forEach(x=>io.observe(x))}else $$('.reveal').forEach(x=>x.classList.add('visible'));
  $$('[data-track]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.track)?.scrollBy({left:Number(b.dataset.dir)*Math.min(440,$('#'+b.dataset.track).clientWidth*.8),behavior:'smooth'})));
  $$('[data-open-modal]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.openModal)?.classList.add('open')));
  $$('[data-close-modal]').forEach(b=>b.addEventListener('click',()=>b.closest('.modal')?.classList.remove('open')));
  $$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')}));
  const paymentNames={mynita:'Mynita',amanata:'Amanata','airtel-money':'Airtel Money','moov-money':'Moov Money',wave:'Wave','mtn-momo':'MTN Mobile Money'};
  const selectedPayment=(form)=>{const v=new FormData(form).get('payment_method');return paymentNames[v]||'À convenir'};
  const toWhatsApp=(message,tab)=>{const url='https://wa.me/'+cfg.wa+'?text='+encodeURIComponent(message);if(tab){tab.location.href=url;return}window.open(url,'_blank','noopener')};
  async function saveOrder(payload){if(!db)return {saved:false,reason:'not-configured'};const {error}=await db.from('orders').insert(payload);if(error){console.error(error);return {saved:false,reason:error.message}}return {saved:true}}
  // Order forms used on service/product pages. Record first, then open WhatsApp with complete summary.
  $$('[data-order-form]').forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault();const waTab=window.open('about:blank','_blank');const fd=new FormData(form);const data=Object.fromEntries(fd.entries());
    const kind=form.dataset.orderForm;const summary=Object.entries(data).filter(([k,v])=>v&&k!=='payment_method').map(([k,v])=>`${k}: ${v}`).join('\n');
    const payment=selectedPayment(form);const payload={customer_name:data.name||data.full_name||'Client',customer_email:data.email||null,customer_phone:data.phone||null,category:kind,service_or_product:data.item||data.service||data.project_type||kind,details:summary,payment_method:payment,status:'new',source_page:location.pathname};
    const result=await saveOrder(payload);
    const ref=result.saved?'\nDemande enregistrée dans le système SSEINY’S.':'';
    const message=`Bonjour SSEINY'S, je souhaite effectuer une demande / commande.\n\nType : ${kind}\n${summary}\nMoyen de paiement souhaité : ${payment}${ref}\n\nMerci de me confirmer les modalités et la disponibilité.\nNB : aucun paiement n'a encore été confirmé.`;
    toWhatsApp(message,waTab);toast(result.saved?'Demande enregistrée. WhatsApp va s’ouvrir.':'WhatsApp va s’ouvrir. La base Supabase n’est pas encore configurée ou la demande n’a pas pu être enregistrée.');
    form.reset();
  }));
  // Contact and appointment forms retain the existing home-page contact experience.
  $('#contactForm')?.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));toWhatsApp(`Bonjour SSEINY'S, voici mon message.\nNom : ${d.name}\nE-mail : ${d.email}\nSujet : ${d.subject}\nMessage : ${d.message}`);$('#contactModal')?.classList.remove('open')});
  $('#appointmentForm')?.addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));toWhatsApp(`Demande de rendez-vous SSEINY'S\nNom : ${d.name}\nE-mail : ${d.email}\nDate : ${d.date}\nHeure : ${d.time}\nMotif : ${d.reason}\nCette demande reste à confirmer.`);$('#appointmentModal')?.classList.remove('open')});
  // Member mailing list (opt-in).
  $('#newsletterForm')?.addEventListener('submit',async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));if(!db){toast('Supabase doit être configuré avant l’inscription.');return}const {error}=await db.from('newsletter_subscribers').insert({full_name:d.name,email:d.email});if(error){toast(error.code==='23505'?'Cette adresse est déjà inscrite.':'Inscription impossible : '+error.message);return}e.target.reset();toast('Inscription enregistrée. Bienvenue dans la communauté SSEINY’S.')});
  // Real pageview logging; no personal identifying data is collected.
  if(db){db.from('page_views').insert({path:location.pathname,referrer:document.referrer||null}).then(({error})=>{if(error)console.debug('page view not recorded',error.message)});}
  // Announcement feed: realtime while page is open, plus initial fetch.
  async function loadAnnouncements(){const box=$('#homeAnnouncements');if(!box||!db)return;const {data,error}=await db.from('announcements').select('id,title,body,image_url,published_at').eq('is_published',true).order('published_at',{ascending:false}).limit(5);if(error){box.innerHTML='<div class="empty-state">Les annonces seront disponibles après configuration de Supabase.</div>';return}if(!data.length){box.innerHTML='<div class="empty-state">Aucune annonce publiée pour le moment.</div>';return}box.innerHTML=data.map(a=>`<article class="announcement">${a.image_url?`<img src="${escapeAttr(a.image_url)}" alt="" style="width:100%;max-height:180px;object-fit:cover;border-radius:10px">`:''}<time>${new Date(a.published_at).toLocaleDateString('fr-FR')}</time><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.body)}</p></article>`).join('');const ticker=$('#homeAnnouncementTicker');if(ticker)ticker.textContent=data[0].title+' — '+data[0].body.slice(0,130)}
  function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function escapeAttr(s=''){return escapeHtml(s)}
  loadAnnouncements();if(db&&$('#homeAnnouncements'))db.channel('public-announcements').on('postgres_changes',{event:'*',schema:'public',table:'announcements'},loadAnnouncements).subscribe();
  async function loadPublicStats(){const box=$('#publicStats');if(!box||!db)return;const {data,error}=await db.rpc('public_home_stats');if(error||!data)return;const row=Array.isArray(data)?data[0]:data;const values=[row.month_visits||0,row.month_orders||0,9,row.published_announcements||0];const labels=['Visites du mois','Commandes reçues','Projets présentés','Annonces publiées'];box.innerHTML=values.map((v,i)=>`<div class="stat-card"><span>${labels[i]}</span><strong>${Number(v).toLocaleString('fr-FR')}</strong></div>`).join('')}
  loadPublicStats();
  async function loadGallery(){const grid=$('#galleryGrid');if(!grid||!db)return;const {data,error}=await db.from('gallery_items').select('title,image_url,description').eq('is_published',true).order('created_at',{ascending:false}).limit(60);if(error)return;if(!data.length){grid.innerHTML='<div class="empty-state">La galerie attend ses premières photos.</div>';return}grid.innerHTML=data.map(x=>`<figure class="gallery-item"><img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.title)}" loading="lazy"><figcaption><strong>${escapeHtml(x.title)}</strong>${x.description?`<br>${escapeHtml(x.description)}`:''}</figcaption></figure>`).join('')}
  loadGallery();
  async function loadContentMedia(){const box=$('#projectMedia');if(!box||!db)return;const type=box.dataset.contentType,slug=box.dataset.contentSlug;const {data,error}=await db.from('content_media').select('title,image_url,description').eq('content_type',type).eq('content_slug',slug).eq('is_published',true).order('created_at',{ascending:false});if(error)return;if(!data.length)return;box.innerHTML=data.map(x=>`<figure class="gallery-item"><img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.title)}" loading="lazy"><figcaption><strong>${escapeHtml(x.title)}</strong>${x.description?`<br>${escapeHtml(x.description)}`:''}</figcaption></figure>`).join('')}
  loadContentMedia();
  $('#chatToggle')?.addEventListener('click',()=>$('#chatPanel')?.classList.toggle('open'));$('#chatClose')?.addEventListener('click',()=>$('#chatPanel')?.classList.remove('open'));
  $$('[data-chat]').forEach(b=>b.addEventListener('click',()=>{const body=$('#chatBody');if(!body)return;const key=b.dataset.chat;const messages={contact:'Vous pouvez contacter SSEINY’S directement sur WhatsApp.',appointment:'Utilisez le bouton Prendre rendez-vous pour envoyer votre demande.',partnership:'Pour une proposition de partenariat, présentez votre organisation et votre proposition.'};const el=document.createElement('div');el.className='chat-msg';el.textContent=messages[key]||'Comment pouvons-nous vous aider ?';body.append(el);body.scrollTop=body.scrollHeight;if(key==='contact')toWhatsApp('Bonjour SSEINY’S, je souhaite vous contacter.') }));
  $('#notifToggle')?.addEventListener('click',async()=>{if(!('Notification'in window)){toast('Notifications non disponibles sur cet appareil.');return}try{const p=await Notification.requestPermission();toast(p==='granted'?'Notifications du navigateur autorisées. Les annonces en direct sont visibles sur le site.':'Autorisation de notification non accordée.')}catch{toast('Impossible d’activer les notifications.')}});
  $('#shareToggle')?.addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:"SSEINY'S",text:'Découvrez le portail professionnel SSEINY’S.',url:location.href});else{await navigator.clipboard.writeText(location.href);toast('Lien copié.')}}catch{}});
})();
