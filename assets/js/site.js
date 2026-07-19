/* site.js — navegação, marca, tema (claro/escuro) e i18n (PT/EN/ES)
   compartilhados. Injetados em todas as páginas. Funciona offline. */
(function () {
  "use strict";

  // ---------- idioma e tema (persistidos) ----------
  var IDIOMAS = ["pt", "en", "es"];
  function getLang() {
    var l = localStorage.getItem("cbr-lang");
    if (IDIOMAS.indexOf(l) >= 0) return l;
    var nav = (navigator.language || "pt").slice(0, 2).toLowerCase();
    return IDIOMAS.indexOf(nav) >= 0 ? nav : "pt";
  }
  function getTheme() { return localStorage.getItem("cbr-theme") === "dark" ? "dark" : "light"; }
  var LANG = getLang();
  document.documentElement.setAttribute("lang", LANG === "pt" ? "pt-BR" : LANG);
  document.documentElement.setAttribute("data-theme", getTheme());

  // ---------- textos da navegação/rodapé (chrome) ----------
  var T = {
    nav_inicio:  { pt: "Início", en: "Home", es: "Inicio" },
    nav_teoria:  { pt: "Teoria", en: "Theory", es: "Teoría" },
    nav_proc:    { pt: "Procedimento", en: "Procedure", es: "Procedimiento" },
    nav_sim:     { pt: "Simulador", en: "Simulator", es: "Simulador" },
    nav_lab:     { pt: "Laboratório", en: "Virtual lab", es: "Laboratorio" },
    nav_quiz:    { pt: "Quiz", en: "Quiz", es: "Quiz" },
    nav_ref:     { pt: "Referências", en: "References", es: "Referencias" },
    marca:       { pt: "Ensaio CBR / ISC", en: "CBR Test", es: "Ensayo CBR" },
    rod_titulo:  { pt: "Ensaio CBR / ISC — Recurso didático", en: "CBR Test — Educational resource", es: "Ensayo CBR — Recurso didáctico" },
    rod_desc:    {
      pt: "Material de apoio ao ensino de ensaios geotécnicos para pavimentação. O simulador gera dados sintéticos com fins exclusivamente educacionais e não substitui ensaios de laboratório normatizados.",
      en: "Support material for teaching geotechnical tests for pavement design. The simulator generates synthetic data for educational purposes only and does not replace standardized laboratory tests.",
      es: "Material de apoyo para la enseñanza de ensayos geotécnicos para pavimentación. El simulador genera datos sintéticos con fines exclusivamente educativos y no sustituye ensayos de laboratorio normalizados."
    },
    rod_normas:  { pt: "Normas de referência", en: "Reference standards", es: "Normas de referencia" },
    rod_nav:     { pt: "Navegação", en: "Navigation", es: "Navegación" },
    rod_lic:     { pt: "Projeto de código aberto · Licença MIT", en: "Open-source project · MIT License", es: "Proyecto de código abierto · Licencia MIT" },
    rod_offline: { pt: "Feito para rodar offline, no seu PC ou no GitHub Pages", en: "Runs offline, on your PC or on GitHub Pages", es: "Funciona sin conexión, en su PC o en GitHub Pages" },
    rod_autor:   { pt: "Desenvolvido por", en: "Developed by", es: "Desarrollado por" }
  };
  function tr(key) { return (T[key] && (T[key][LANG] || T[key].pt)) || key; }

  // ---------- links do autor ----------
  var LINKS = {
    site: "https://vortexinfra.com",
    github: "https://github.com/czanchetta/ensaio-cbr-didatico",
    linkedin: "https://www.linkedin.com/in/celsozanchetta/pt/"
  };
  var LOGO = "assets/img/logo-vortex.png";

  var paginas = [
    { href: "index.html", k: "nav_inicio" },
    { href: "teoria.html", k: "nav_teoria" },
    { href: "procedimento.html", k: "nav_proc" },
    { href: "simulador.html", k: "nav_sim" },
    { href: "bancada.html", k: "nav_lab" },
    { href: "quiz.html", k: "nav_quiz" },
    { href: "referencias.html", k: "nav_ref" }
  ];

  var atual = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (atual === "") atual = "index.html";

  var links = paginas.map(function (p) {
    var cls = p.href.toLowerCase() === atual ? ' class="ativo"' : "";
    return '<a href="' + p.href + '"' + cls + ' data-i18n="' + p.k + '">' + tr(p.k) + "</a>";
  }).join("");

  function langBtns() {
    return IDIOMAS.map(function (l) {
      return '<button data-lang="' + l + '"' + (l === LANG ? ' class="ativo"' : "") + '>' +
        l.toUpperCase() + "</button>";
    }).join("");
  }

  var header =
    '<header class="topo"><div class="topo-inner">' +
    '<a class="marca" href="index.html">' +
    '<img class="logo-img" src="' + LOGO + '" alt="Vortex">' +
    '<span data-i18n="marca">' + tr("marca") + "</span></a>" +
    '<button class="btn-menu" aria-label="menu">&#9776;</button>' +
    '<nav class="menu">' + links + "</nav>" +
    '<div class="topo-acoes">' +
    '<div class="lang-switch">' + langBtns() + "</div>" +
    '<button class="theme-toggle" title="Tema claro/escuro">' +
    (getTheme() === "dark" ? "☀️" : "🌙") + "</button>" +
    "</div></div></header>";

  var footer =
    '<footer class="rodape"><div class="rodape-inner">' +
    "<div style='max-width:420px'>" +
    '<img class="logo-rodape" src="' + LOGO + '" alt="Vortex"><br>' +
    '<h4 data-i18n="rod_titulo">' + tr("rod_titulo") + "</h4>" +
    '<p data-i18n="rod_desc">' + tr("rod_desc") + "</p>" +
    "<div class='rodape-links' style='margin-top:.6rem'>" +
    '<a href="' + LINKS.site + '" target="_blank" rel="noopener">🌐 vortexinfra.com</a>' +
    '<a href="' + LINKS.github + '" target="_blank" rel="noopener">💻 GitHub</a>' +
    '<a href="' + LINKS.linkedin + '" target="_blank" rel="noopener">in LinkedIn</a>' +
    "</div></div>" +
    "<div><h4 data-i18n='rod_normas'>" + tr("rod_normas") + "</h4>" +
    "<p>DNIT 172/2016-ME<br>ABNT NBR 9895:2016<br>ASTM D1883 &middot; AASHTO T193</p></div>" +
    "<div><h4 data-i18n='rod_nav'>" + tr("rod_nav") + "</h4><p>" +
    paginas.map(function (p) { return '<a href="' + p.href + '" data-i18n="' + p.k + '">' + tr(p.k) + "</a>"; }).join("<br>") +
    "</p></div>" +
    "</div><div class='rodape-inner' style='margin-top:1rem;font-size:.8rem;opacity:.85'>" +
    "<span><span data-i18n='rod_autor'>" + tr("rod_autor") + "</span> " +
    "<a href='" + LINKS.site + "' target='_blank' rel='noopener'>Celso Zanchetta · Vortex</a></span>" +
    "<span data-i18n='rod_lic'>" + tr("rod_lic") + "</span></div></footer>";

  var slotH = document.getElementById("site-header");
  var slotF = document.getElementById("site-footer");
  if (slotH) slotH.outerHTML = header; else document.body.insertAdjacentHTML("afterbegin", header);
  if (slotF) slotF.outerHTML = footer; else document.body.insertAdjacentHTML("beforeend", footer);

  // ---------- motor de i18n para o conteúdo das páginas ----------
  // Aplica as traduções de window.I18N (definido por i18n-<pagina>.js, se houver)
  function aplicaI18n() {
    var dict = window.I18N || {};
    // blocos de prosa por idioma: mostra só o do idioma ativo.
    // IMPORTANTE: restrito a blocos de conteúdo (data-lang-block) para NÃO
    // atingir os botões do seletor de idioma, que usam data-lang como valor.
    document.querySelectorAll("[data-lang-block]").forEach(function (elm) {
      elm.style.display = (elm.getAttribute("data-lang-block") === LANG) ? "" : "none";
    });
    document.querySelectorAll("[data-i18n]").forEach(function (elm) {
      var key = elm.getAttribute("data-i18n");
      var val = null;
      if (T[key]) val = T[key][LANG];
      else if (dict[key]) val = dict[key][LANG];
      if (val != null) elm.innerHTML = val;
    });
    // atributos traduzíveis (placeholder, title, aria-label, content)
    document.querySelectorAll("[data-i18n-attr]").forEach(function (elm) {
      var spec = elm.getAttribute("data-i18n-attr"); // "attr:key;attr:key"
      spec.split(";").forEach(function (par) {
        var kv = par.split(":"); if (kv.length !== 2) return;
        var attr = kv[0].trim(), key = kv[1].trim();
        var src = T[key] || dict[key];
        if (src && src[LANG] != null) elm.setAttribute(attr, src[LANG]);
      });
    });
    // título da página
    if (dict.__title__ && dict.__title__[LANG]) document.title = dict.__title__[LANG];
    // notifica scripts da página (ex.: simulador/bancada) para re-renderizar rótulos
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: LANG } }));
  }

  // expõe utilidades para as páginas
  window.CBRi18n = {
    lang: function () { return LANG; },
    t: function (key) {
      var dict = window.I18N || {};
      var src = T[key] || dict[key];
      return (src && (src[LANG] || src.pt)) || key;
    },
    onChange: function (cb) { document.addEventListener("i18n:changed", function (e) { cb(e.detail.lang); }); }
  };

  aplicaI18n();

  // ---------- eventos ----------
  var btn = document.querySelector(".btn-menu");
  var menu = document.querySelector("nav.menu");
  if (btn && menu) btn.addEventListener("click", function () { menu.classList.toggle("aberto"); });

  document.querySelectorAll(".lang-switch button").forEach(function (b) {
    b.addEventListener("click", function () {
      LANG = b.dataset.lang;
      localStorage.setItem("cbr-lang", LANG);
      document.documentElement.setAttribute("lang", LANG === "pt" ? "pt-BR" : LANG);
      document.querySelectorAll(".lang-switch button").forEach(function (x) {
        x.classList.toggle("ativo", x.dataset.lang === LANG);
      });
      aplicaI18n();
    });
  });

  var tt = document.querySelector(".theme-toggle");
  if (tt) tt.addEventListener("click", function () {
    var novo = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem("cbr-theme", novo);
    document.documentElement.setAttribute("data-theme", novo);
    tt.textContent = novo === "dark" ? "☀️" : "🌙";
    document.dispatchEvent(new CustomEvent("theme:changed", { detail: { theme: novo } }));
  });
})();
