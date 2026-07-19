/* simulador.js — lógica do simulador paramétrico (usa CBR, Chart.js, i18n) */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var chartPen = null, chartComp = null, ultimo = null;
  function t(k) { return (window.CBRi18n && window.CBRi18n.t(k)) || k; }
  function lang() { return (window.CBRi18n && window.CBRi18n.lang()) || "pt"; }

  // Popula o seletor de solos (nomes traduzidos)
  var selSolo = $("solo");
  function preencheSolos() {
    var atualVal = selSolo.value;
    selSolo.innerHTML = "";
    Object.keys(CBR.SOLOS).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k; o.textContent = CBR.nomeSolo(k);
      selSolo.appendChild(o);
    });
    selSolo.value = atualVal || "areia_arg";
  }
  preencheSolos();
  selSolo.value = "areia_arg";

  // ---- lê cenário da URL (?solo=&energia=&umidade=) vindo da bancada ----
  (function lerURL() {
    var p = new URLSearchParams(location.search);
    if (p.get("solo") && CBR.SOLOS[p.get("solo")]) selSolo.value = p.get("solo");
    if (p.get("energia") && CBR.ENERGIAS[p.get("energia")]) $("energia").value = p.get("energia");
    window.__umidadeURL = p.get("umidade") ? parseFloat(p.get("umidade")) : null;
  })();

  function woptAtual() {
    var solo = CBR.SOLOS[selSolo.value];
    var en = CBR.ENERGIAS[$("energia").value];
    return CBR.round(solo.wopt * en.fWopt, 1);
  }
  function ajustaFaixaUmidade() {
    var w = woptAtual();
    var sl = $("umidade");
    sl.min = Math.max(2, w - 12);
    sl.max = w + 12;
    $("wopt-hint").textContent = t("hint_wopt").replace("{w}", w);
  }
  function corPorCbr(cbr) { return CBR.classificar(cbr).cor; }

  function atualiza() {
    var opts = {
      solo: selSolo.value, energia: $("energia").value,
      umidade: parseFloat($("umidade").value),
      ruidoPct: parseFloat($("ruido").value), seed: 7
    };
    var r = CBR.simular(opts);
    ultimo = r;
    $("umidade-val").textContent = r.compactacao.umidade_moldagem;
    $("ruido-val").textContent = opts.ruidoPct;
    var cls = CBR.classificar(r.resultado.cbr_final);
    $("kpi-cbr").textContent = r.resultado.cbr_final;
    $("kpi-classe").textContent = CBR.nomeClasse(cls.classe);
    $("kpi-classe").style.color = cls.cor;
    $("kpi-gc").textContent = r.compactacao.grau_compactacao;
    $("kpi-exp").textContent = r.resultado.expansao_pct;
    $("uso-txt").textContent = cls.uso +
      "  ·  CBR 2,54 mm = " + r.resultado.cbr_254 + "%  |  5,08 mm = " + r.resultado.cbr_508 +
      "%  (" + t("governa") + " " + (r.resultado.governa === "2.54" ? "2,54" : "5,08") + " mm)";
    desenhaPenetracao(r); desenhaCompactacao(r); montaTabela(r);
  }

  function corTexto() {
    return getComputedStyle(document.body).getPropertyValue("--texto").trim() || "#1c2b36";
  }

  function desenhaPenetracao(r) {
    var pts = r.penetracao.curva.map(function (p) { return { x: p.penetracao_mm, y: p.pressao_MPa }; });
    var cor = corPorCbr(r.resultado.cbr_final);
    var maxY = Math.max.apply(null, pts.map(function (p) { return p.y; })) * 1.1;
    var cTxt = corTexto();
    var anota = {
      id: "linhasControle",
      afterDraw: function (c) {
        var xa = c.scales.x, ya = c.scales.y, ctx = c.ctx;
        ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "#c0392b"; ctx.fillStyle = "#c0392b";
        ctx.font = "12px Segoe UI";
        [2.54, 5.08].forEach(function (d) {
          var px = xa.getPixelForValue(d);
          ctx.beginPath(); ctx.moveTo(px, ya.top); ctx.lineTo(px, ya.bottom); ctx.stroke();
          ctx.fillText(d + " mm", px + 3, ya.top + 12);
        });
        ctx.restore();
      }
    };
    if (chartPen) chartPen.destroy();
    chartPen = new Chart($("chart-pen"), {
      type: "line",
      data: { datasets: [{ label: t("ch_pressao"), data: pts, borderColor: cor,
        backgroundColor: cor + "22", borderWidth: 3, tension: 0.25, pointRadius: 3, fill: true }] },
      plugins: [anota],
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { type: "linear", title: { display: true, text: t("ch_pen"), color: cTxt }, min: 0, ticks: { color: cTxt } },
          y: { title: { display: true, text: t("ch_pressao"), color: cTxt }, min: 0, suggestedMax: maxY, ticks: { color: cTxt } }
        },
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: function (c) { return c.parsed.y.toFixed(3) + " MPa @ " + c.parsed.x + " mm"; } } } }
      }
    });
  }

  function desenhaCompactacao(r) {
    var cc = CBR.curvaCompactacao(selSolo.value, $("energia").value);
    var pts = cc.pontos.map(function (p) { return { x: p.w, y: p.gd }; });
    var atual = [{ x: r.compactacao.umidade_moldagem, y: r.compactacao.gd_moldagem }];
    var apice = [{ x: cc.woptE, y: cc.gdmaxE }];
    var cTxt = corTexto();
    if (chartComp) chartComp.destroy();
    chartComp = new Chart($("chart-comp"), {
      type: "line",
      data: {
        datasets: [
          { label: t("ch_curva"), data: pts, borderColor: "#1d5a8a", borderWidth: 3, tension: 0.3, pointRadius: 0, fill: false },
          { label: t("ch_apice"), data: apice, borderColor: "#2f7d4f", backgroundColor: "#2f7d4f", pointRadius: 6, pointStyle: "rectRot", showLine: false },
          { label: t("ch_moldagem"), data: atual, borderColor: "#c0392b", backgroundColor: "#c0392b", pointRadius: 7, showLine: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { type: "linear", title: { display: true, text: t("ch_umid"), color: cTxt }, ticks: { color: cTxt } },
          y: { title: { display: true, text: t("ch_gd"), color: cTxt }, ticks: { color: cTxt } }
        },
        plugins: { legend: { position: "top", labels: { color: cTxt } } }
      }
    });
  }

  function montaTabela(r) {
    var h = "<thead><tr><th>" + t("th_pen") + "</th><th>" + t("th_pmpa") + "</th><th>" + t("th_pkgf") +
            "</th><th>" + t("th_ckn") + "</th><th>" + t("th_ckgf") + "</th></tr></thead><tbody>";
    r.penetracao.curva.forEach(function (p) {
      var destaca = (p.penetracao_mm === 2.54 || p.penetracao_mm === 5.08);
      h += "<tr" + (destaca ? " style='font-weight:700;background:#fbf4e9'" : "") + ">";
      h += "<td>" + p.penetracao_mm + "</td><td>" + p.pressao_MPa + "</td><td>" + p.pressao_kgfcm2 +
           "</td><td>" + p.forca_kN + "</td><td>" + p.forca_kgf + "</td></tr>";
    });
    h += "</tbody>";
    $("tab-leituras").innerHTML = h;
  }

  function exportaCSV() {
    if (!ultimo) return;
    var r = ultimo;
    var linhas = [
      "# Ensaio CBR/ISC - simulacao didatica (dados sinteticos)",
      "# Solo:," + CBR.nomeSolo(r.entrada.solo, "pt"),
      "# Energia:," + CBR.nomeEnergia(r.entrada.energia, "pt") + " (" + r.energia.golpes + " golpes/camada)",
      "# Umidade moldagem (%):," + r.compactacao.umidade_moldagem,
      "# Grau compactacao (%):," + r.compactacao.grau_compactacao,
      "# CBR 2.54mm (%):," + r.resultado.cbr_254,
      "# CBR 5.08mm (%):," + r.resultado.cbr_508,
      "# CBR final (%):," + r.resultado.cbr_final,
      "# Expansao (%):," + r.resultado.expansao_pct,
      "", "penetracao_mm,pressao_MPa,pressao_kgfcm2,carga_kN,carga_kgf"
    ];
    r.penetracao.curva.forEach(function (p) {
      linhas.push([p.penetracao_mm, p.pressao_MPa, p.pressao_kgfcm2, p.forca_kN, p.forca_kgf].join(","));
    });
    var blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "cbr_" + selSolo.value + "_" + $("energia").value + ".csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.querySelectorAll(".tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.remove("ativo"); });
      document.querySelectorAll(".aba").forEach(function (x) { x.classList.remove("ativo"); });
      b.classList.add("ativo");
      $(b.dataset.aba).classList.add("ativo");
    });
  });

  selSolo.addEventListener("change", function () { ajustaFaixaUmidade(); $("umidade").value = woptAtual(); atualiza(); });
  $("energia").addEventListener("change", function () { ajustaFaixaUmidade(); $("umidade").value = woptAtual(); atualiza(); });
  $("umidade").addEventListener("input", atualiza);
  $("ruido").addEventListener("input", atualiza);
  $("btn-otima").addEventListener("click", function () { $("umidade").value = woptAtual(); atualiza(); });
  $("btn-csv").addEventListener("click", exportaCSV);

  // reage a troca de idioma e de tema
  if (window.CBRi18n) window.CBRi18n.onChange(function () { preencheSolos(); ajustaFaixaUmidade(); atualiza(); });
  document.addEventListener("theme:changed", function () { atualiza(); });

  // Início
  ajustaFaixaUmidade();
  $("umidade").value = (window.__umidadeURL != null && !isNaN(window.__umidadeURL)) ? window.__umidadeURL : woptAtual();
  atualiza();
})();
