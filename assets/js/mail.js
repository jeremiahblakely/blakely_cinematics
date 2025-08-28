(() => {
  const $ = (s, r = document) => r.querySelector(s);

  const FOLDERS = ["Inbox","Bookings","Clients","Finance","VIP","Support","Snoozed","Archived"];

  let DATA = { aliases: [], threads: [] };
  let state = { folder: "Inbox", alias: "ALL", search: "", selectedThreadId: null };

  const fmtDate = iso => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

  function applyFilters() {
    let out = DATA.threads.slice();
    if (state.folder) out = out.filter(t => (t.labels || []).includes(state.folder));
    if (state.alias !== "ALL") out = out.filter(t => t.alias === state.alias);
    if (state.search) {
      const q = state.search.toLowerCase();
      out = out.filter(t =>
        (t.subject || "").toLowerCase().includes(q) ||
        (t.from || "").toLowerCase().includes(q) ||
        (t.snippet || "").toLowerCase().includes(q)
      );
    }
    out.sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    return out;
  }

  function renderFolders() {
    const pane = $("#foldersPane");
    if (!pane) return;
    pane.innerHTML = "";

    // counts
    const counts = Object.fromEntries(FOLDERS.map(f => [f,0]));
    DATA.threads.forEach(t => (t.labels||[]).forEach(l => { if (counts[l] != null) counts[l]++; }));

    FOLDERS.forEach(folder => {
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = `${folder}${counts[folder] ? ` (${counts[folder]})` : ""}`;
      a.className = "folderLink";
      if (state.folder === folder) a.classList.add("active");
      a.addEventListener("click", (e) => {
        e.preventDefault();
        state.folder = folder;
        renderFolders();
        renderThreadList();
        $("#messageBody").innerHTML = "";
      });
      pane.appendChild(a);
    });
  }

  function renderAliasFilter() {
    const sel = $("#aliasFilter");
    if (!sel) return;
    sel.innerHTML = "";
    sel.insertAdjacentHTML("beforeend", `<option value="ALL">All aliases</option>`);
    DATA.aliases.forEach(a => sel.insertAdjacentHTML("beforeend", `<option value="${a}">${a}</option>`));
    sel.value = state.alias;
    sel.onchange = () => { state.alias = sel.value; renderThreadList(); };
  }

  function renderThreadList() {
    const list = $("#threadList");
    if (!list) return;
    list.innerHTML = "";

    const threads = applyFilters();
    if (!threads.length) {
      list.innerHTML = `<div style="padding:12px; color:#6b7280;">No threads</div>`;
      return;
    }

    threads.forEach(t => {
      const row = document.createElement("div");
      row.className = "threadRow";
      if (t.id === state.selectedThreadId) row.classList.add("selected");

      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";

      const subj = document.createElement("div");
      subj.className = "subject";
      subj.textContent = t.subject || "(no subject)";

      const time = document.createElement("div");
      time.className = "meta";
      time.textContent = fmtDate(t.lastMessageAt);

      top.appendChild(subj); top.appendChild(time);

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${t.from || ""}`;

      const snip = document.createElement("div");
      snip.className = "snippet";
      snip.textContent = t.snippet || "";

      if (t.unreadCount > 0) {
        const dot = document.createElement("span");
        dot.title = `${t.unreadCount} unread`;
        dot.style.display = "inline-block";
        dot.style.width = "8px";
        dot.style.height = "8px";
        dot.style.borderRadius = "999px";
        dot.style.background = "#10b981";
        dot.style.marginRight = "6px";
        subj.prepend(dot);
      }

      row.appendChild(top);
      row.appendChild(meta);
      row.appendChild(snip);

      row.onclick = () => { state.selectedThreadId = t.id; renderThreadList(); renderMessageView(t); };
      list.appendChild(row);
    });

    // auto-select first if none selected
    if (!state.selectedThreadId && threads.length) {
      state.selectedThreadId = threads[0].id;
      renderThreadList();
      renderMessageView(threads[0]);
    }
  }

  function renderMessageView(thread) {
    const body = $("#messageBody");
    if (!body) return;
    $("#messageView").scrollTop = 0;

    if (!thread) { body.innerHTML = ""; return; }

    const parts = (thread.messages || []).map(m => `
      <article>
        <div class="byline">
          <strong>${m.from || ""}</strong>
          <span style="margin:0 6px;">→</span>
          ${m.to || ""}
          <span style="margin-left:10px;">${fmtDate(m.date)}</span>
        </div>
        <div>${m.bodyHtml || ""}</div>
      </article>
    `);

    body.innerHTML = `
      <header>
        <div class="title">${thread.subject || "(no subject)"}</div>
        <div class="meta">${thread.from || ""} • ${fmtDate(thread.lastMessageAt)}</div>
      </header>
      ${parts.join("")}
    `;
  }

  function wireSearch() {
    const input = $("#searchBox");
    if (!input) return;
    input.oninput = () => { state.search = input.value.trim(); renderThreadList(); };
  }

  async function init() {
    try {
      const res = await fetch("../assets/data/mock-mail.json", { cache: "no-store" });
      DATA = await res.json();
    } catch (e) {
      console.error("Failed to load mock-mail.json", e);
      DATA = { aliases: [], threads: [] };
    }
    renderAliasFilter();
    renderFolders();
    wireSearch();
    renderThreadList();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

