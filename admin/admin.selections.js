(function(){
  const $ = (s, c=document)=>c.querySelector(s);

  function toast(msg, type){
    let box = $('#bc-toast');
    if(!box){
      box = document.createElement('div');
      box.id = 'bc-toast';
      box.style.position='fixed'; box.style.right='16px'; box.style.bottom='16px';
      box.style.padding='12px 14px'; box.style.borderRadius='10px';
      box.style.zIndex='9999'; box.style.font='14px system-ui';
      box.style.background = type==='error' ? '#3a0f12' : '#0f2e1f';
      box.style.border = type==='error' ? '1px solid #7a1a22' : '1px solid #1b4d36';
      box.style.color='#e6e9f0';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    clearTimeout(box._t); box._t=setTimeout(()=>box.remove(),3000);
  }

  async function tryPost(url, body){
    const res = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error('HTTP '+res.status);
    return res.json().catch(()=>({ok:true}));
  }

  async function saveSelectorPref(galleryCode, selector){
    const base = window.BC_API_BASE || '';
    const payload = { galleryCode, selector };
    const candidates = [
      base + '/galleries/updateSelector',
      base + '/updateGallery',
      base + '/gallery/selector',
      base + '/galleries/'+encodeURIComponent(galleryCode)+'/selector'
    ];
    let lastErr=null;
    for(const url of candidates){
      try{ return await tryPost(url, payload); }
      catch(e){ lastErr=e; }
    }
    throw lastErr || new Error('No selector endpoint succeeded');
  }

  function wireSelections(){
    const panel = document.getElementById('panel-selections');
    if(!panel) return;
    const form = panel.querySelector('form');
    if(!form) return;

    const codeInput = form.querySelector('input[type="text"]');
    const radios = form.querySelectorAll('input[name="selector"]');

    form.addEventListener('submit', e=>e.preventDefault());

    const saveBtn = [...form.querySelectorAll('.button')].find(b=>!b.classList.contains('outline'));
    if(saveBtn && !saveBtn._wired){
      saveBtn._wired=true;
      saveBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        const galleryCode = (codeInput?.value || '').trim();
        if(!galleryCode){ toast('Enter gallery code', 'error'); return; }
        const selected = [...radios].find(r=>r.checked)?.value || 'client';
        try{
          toast('Saving selection preference...', 'info');
          const data = await saveSelectorPref(galleryCode, selected);
          const table = panel.querySelector('.card + .card .table');
          if(table) table.textContent = JSON.stringify(data);
          toast('Saved', 'info');
        }catch(err){
          toast('Save failed: ' + err.message, 'error');
        }
      });
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', wireSelections);
  }else{
    wireSelections();
  }
})();
