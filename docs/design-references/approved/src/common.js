// Renders the shared app shell (sidebar + top bar) for the mockups.
// <body data-page="..." data-scope="store|chain">
(function () {
  const NAV = [
    { group: null, items: [{ id: "today", icon: "list-checks", label: "My store today", badge: "5" }] },
    {
      group: "Stock & demand",
      items: [
        { id: "stockouts", icon: "trending-up", label: "Stockout risk" },
        { id: "orders", icon: "clipboard-list", label: "Order suggestions", badge: "2" },
        { id: "online", icon: "shopping-bag", label: "Online orders" },
      ],
    },
    {
      group: "Inventory health",
      items: [
        { id: "overstock", icon: "boxes", label: "Overstock" },
        { id: "writeoffs", icon: "calendar-clock", label: "Expiry & write-offs" },
      ],
    },
    {
      group: "Partners & sales",
      items: [
        { id: "suppliers", icon: "handshake", label: "Suppliers" },
        { id: "promotions", icon: "badge-percent", label: "Promotions" },
      ],
    },
    { group: "Head office", items: [{ id: "stores", icon: "map", label: "All stores" }] },
  ];

  const active = document.body.dataset.page;
  const chain = document.body.dataset.scope === "chain";
  const navHtml = NAV.map(
    (g) =>
      (g.group ? `<div class="nav-group">${g.group}</div>` : "") +
      g.items
        .map(
          (i) =>
            `<a class="nav-item ${i.id === active ? "active" : ""}"><i data-lucide="${i.icon}"></i>${i.label}${
              i.badge ? `<span class="nav-badge">${i.badge}</span>` : ""
            }</a>`
        )
        .join("")
  ).join("");

  document.getElementById("sidebar").innerHTML = `
    <div class="brand">
      <div class="brand-logo"><i data-lucide="shopping-cart"></i></div>
      <div><div class="brand-name">Retail Intelligence</div><div class="brand-sub">for Supermarket Chains</div></div>
    </div>
    ${navHtml}
    <div class="sidebar-foot">
      <a class="nav-item"><i data-lucide="settings"></i>Settings</a>
      <a class="nav-item"><i data-lucide="circle-help"></i>Help</a>
      <div class="freshness"><span class="live"></span>Data updated today, 06:00</div>
    </div>`;

  const scopeSel = chain
    ? `<div class="select"><i data-lucide="map"></i><span class="lbl">Viewing</span>All stores · Yerevan<i data-lucide="chevron-down"></i></div>`
    : `<div class="select"><i data-lucide="store"></i><span class="lbl">Store</span><span>Komitas Ave<span class="lbl">, Arabkir</span></span><i data-lucide="chevron-down"></i></div>`;

  document.getElementById("topbar").innerHTML = `
    ${scopeSel}
    <div class="search"><i data-lucide="search"></i>Search products…</div>
    <div class="topbar-right">
      <div class="lang"><span class="on">EN</span><span>Հայ</span></div>
      <div class="icon-btn"><i data-lucide="bell"></i><span class="dot"></span></div>
      ${chain
        ? `<div class="user"><div class="avatar">DS</div><div><div class="user-name">Davit S.</div><div class="meta">Operations, head office</div></div></div>`
        : `<div class="user"><div class="avatar">AM</div><div><div class="user-name">Anna M.</div><div class="meta">Store manager</div></div></div>`}
    </div>`;

  if (location.hash === "#drawer") document.body.classList.add("drawer-open");

  window.addEventListener("load", () => lucide.createIcons({ attrs: { "stroke-width": 2 } }));

  if (window.Chart) {
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = "#7a7f93";
    Chart.defaults.animation = false;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.maintainAspectRatio = false;
  }
})();
