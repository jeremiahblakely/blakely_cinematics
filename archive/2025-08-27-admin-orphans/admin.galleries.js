(function(){
  const $ = (s, c=document)=>c.querySelector(s);

  function toast(msg, type){
    let box = $('#bc-toast');
    if(!box){
      box = document.createElement('div');
      box.id = 'bc-toast';
      box.style.position = 'fixed';
      box.style.right = '16px';
      box.style.bottom = '16px';
      box.style.padding = '12px 14px';
      box.style.borderRadius = '10px';
      box.style.zIndex = '9999';
      box.style.font = '14px system-ui';
      box.style.background = type==='error' ? '#3a0f12' : '#0f2e1f';
      box.style.border = type==='error' ? '1px solid #7a1a22' : '1px solid #1b4d36';
      box.style.color = '#e6e9f0';
      document.body.appendChild(box);
    }
    box.textContent = msg;
    clearTimeout(box._t);
    box._t = setTimeout(()=>box.remove(), 3000);
  }

  async function tryPost(url, body){
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if(!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
    return res.json().catch(()=>({ok:true}));
  }

  async function createGallery(clientName, sessionType){
    const base = window.BC_API_BASE || '';
    const candidates = [
      base + '/createGallery',
      base + '/gallery',
      base + '/galleries/create'
    ];
    const payload = { clientName, sessionType };
    let lastErr = null;
    for(const url of candidates){
      try { return await tryPost(url, payload); }
      catch(e){ lastErr = e; }
    }
    throw lastErr || new Error('No gallery endpoint succeeded');
  }

  async function findGallery(query){
    const base = window.BC_API_BASE || '';
    const candidates = [
      base + '/gallery?code=' + encodeURIComponent(query),
      base + '/galleries?code=' + encodeURIComponent(query),
      base + '/getGallery?code=' + encodeURIComponent(query)
    ];
    let lastErr = null;
    for(const url of candidates){
      try {
        const res = await fetch(url, { method:'GET' });
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch(e){ lastErr = e; }
    }
    throw lastErr || new Error('No gallery lookup endpoint succeeded');
  }

  function wireGalleries(){
    const panel = document.getElementById('panel-galleries');
    if(!panel) return;
    const form = panel.querySelector('form');
    if(!form) return;
    const nameInput = form.querySelector('input[type="text"]');
    const typeSelect = form.querySelector('select');
    const btnCreate = form.querySelector('button.button:not(.outline)');
    const btnFind = form.querySelector('button.button.outline');

    if(btnCreate && !btnCreate._wired){
      btnCreate._wired = true;
      btnCreate.addEventListener('click', async (e)=>{
        e.preventDefault();
        const clientName = (nameInput?.value || '').trim();
        const sessionType = (typeSelect?.value || '').trim();
        if(!clientName){ toast('Enter client name', 'error'); return; }
        try{
          toast('Creating gallery...', 'info');
          const data = await createGallery(clientName, sessionType || 'Signature Session');
          toast('Gallery created', 'info');
          const recent = panel.querySelector('.card + .card .table');
          if(recent) recent.textContent = JSON.stringify(data);
        }catch(err){
          toast('Create failed: ' + err.message, 'error');
        }
      });
    }

    if(btnFind && !btnFind._wired){
      btnFind._wired = true;
      btnFind.addEventListener('click', async (e)=>{
        e.preventDefault();
        const code = (nameInput?.value || '').trim();
        if(!code){ toast('Enter gallery code or name', 'error'); return; }
        try{
          toast('Searching...', 'info');
          const data = await findGallery(code);
          const recent = panel.querySelector('.card + .card .table');
          if(recent) recent.textContent = JSON.stringify(data);
          toast('Found', 'info');
        }catch(err){
          toast('Find failed: ' + err.message, 'error');
        }
      });
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', wireGalleries);
  }else{
    wireGalleries();
  }
})();
