const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];const toggle=$('.menu-toggle');if(toggle)toggle.addEventListener('click',()=>$('.links').classList.toggle('open'));
const phone='2290150228050';function sendForm(form){const data=new FormData(form);let lines=['Bonjour SSEINY\'S, je souhaite effectuer une demande.'];for(const [k,v] of data.entries()){if(String(v).trim())lines.push(k+': '+v)}const msg=encodeURIComponent(lines.join('\n'));window.open('https://wa.me/'+phone+'?text='+msg,'_blank','noopener');}
$$('form[data-whatsapp]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();sendForm(f)}));
const page=document.body.dataset.page;$$('[data-year]').forEach(x=>x.textContent=new Date().getFullYear());
