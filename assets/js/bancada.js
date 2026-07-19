/* ============================================================
   bancada.js — Laboratório virtual do ensaio CBR
   Orquestra 4 fases (preparar/compactar, imergir, penetrar,
   calcular) em dois modos: guiado e demonstração.
   Cena desenhada em SVG e animada por JS puro. Trilíngue.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var SVG = "http://www.w3.org/2000/svg";
  function t(k) { return (window.CBRi18n && window.CBRi18n.t(k)) || k; }
  function lang() { return (window.CBRi18n && window.CBRi18n.lang()) || "pt"; }
  var TOL = 0.10; // tolerância de leitura ±10%
  var chartPenFinal = null, chartCompFinal = null;

  var estado = {
    modo: "guiado",     // "guiado" | "demo"
    etapa: 1,
    solo: "areia_arg",
    energia: "intermediaria",
    umidade: 14,
    sim: null,
    leituraIdx: 0,      // índice atual na planilha de penetração
    rodando: false,
    concluido: false
  };

  // ---------- utilidades ----------
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVG, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function log(msg, cls) {
    var li = document.createElement("li");
    li.innerHTML = msg; if (cls) li.className = cls;
    $("log").appendChild(li);
    $("log").parentElement.scrollTop = 99999;
  }
  function setStatus(html) { $("status-cena").innerHTML = html; }
  function marcaEtapa(n) {
    estado.etapa = n;
    document.querySelectorAll(".etapas .et").forEach(function (e) {
      var d = parseInt(e.dataset.et, 10);
      e.classList.toggle("ativa", d === n);
      e.classList.toggle("feita", d < n);
    });
  }
  function ehControle(pen) { return pen === 2.54 || pen === 5.08; }
  function corTexto() { return getComputedStyle(document.body).getPropertyValue("--texto").trim() || "#1c2b36"; }

  // ---------- seletor de solos (nomes traduzidos) ----------
  var bSolo = $("b-solo");
  function preencheSolos() {
    var v = bSolo.value;
    bSolo.innerHTML = "";
    Object.keys(CBR.SOLOS).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k; o.textContent = CBR.nomeSolo(k); bSolo.appendChild(o);
    });
    bSolo.value = v || estado.solo;
  }
  preencheSolos();
  bSolo.value = estado.solo;

  function woptAtual() {
    var s = CBR.SOLOS[bSolo.value], e = CBR.ENERGIAS[$("b-energia").value];
    return CBR.round(s.wopt * e.fWopt, 1);
  }
  function atualizaHint() {
    var w = woptAtual();
    var sl = $("b-umidade");
    sl.min = Math.max(2, w - 12); sl.max = w + 12;
    $("b-wopt-hint").textContent = t("hint_wopt").replace("{w}", w);
  }

  // ============================================================
  //  DESENHO DA CENA (estados: vazio, molde, imersao, prensa)
  // ============================================================
  function limpaCena() { $("cena").innerHTML = ""; }

  function baseBancada(g) {
    el("rect", { x: 0, y: 420, width: 400, height: 40, fill: "#8a5a2b" }, g);      // bancada
    el("rect", { x: 0, y: 416, width: 400, height: 6, fill: "#a06a35" }, g);
  }

  // Molde com N camadas preenchidas (0..5) e nível de solo
  function desenhaMolde(camadas, opts) {
    opts = opts || {};
    limpaCena();
    var g = el("g", {}, $("cena"));
    baseBancada(g);
    // molde (cilindro) 120..280 x, topo em 120, base em 400
    var mx = 130, mw = 140, topo = 120, base = 400;
    el("rect", { x: mx - 8, y: topo - 6, width: mw + 16, height: 12, rx: 3, fill: "#6b7d8c" }, g); // colar
    el("rect", { x: mx, y: topo, width: mw, height: base - topo, fill: "#dfe6ec",
      stroke: "#6b7d8c", "stroke-width": 4 }, g);
    // camadas de solo (de baixo p/ cima), 5 camadas
    var alturaCamada = (base - topo) / 5;
    var solo = CBR.SOLOS[bSolo.value];
    var corSolo = solo.plast > 0.6 ? "#a9763f" : (solo.plast > 0.35 ? "#c19a5b" : "#d9b382");
    for (var i = 0; i < camadas; i++) {
      var y = base - (i + 1) * alturaCamada;
      el("rect", { x: mx + 2, y: y, width: mw - 4, height: alturaCamada - 1, fill: corSolo,
        opacity: 0.75 + i * 0.04 }, g);
      el("line", { x1: mx + 2, y1: y, x2: mx + mw - 2, y2: y, stroke: "#8a5a2b",
        "stroke-width": 1, "stroke-dasharray": "3 3" }, g);
    }
    // soquete (aparece durante compactação)
    if (opts.soquete) {
      var sy = opts.soqueteY || (base - camadas * alturaCamada - 60);
      var sg = el("g", { id: "soquete" }, g);
      el("rect", { x: mx + mw / 2 - 6, y: 20, width: 12, height: sy - 20, fill: "#556270" }, sg); // haste
      el("rect", { x: mx + mw / 2 - 22, y: sy, width: 44, height: 34, rx: 4, fill: "#3d4a57" }, sg); // massa
      el("text", { x: mx + mw / 2, y: sy + 22, "text-anchor": "middle", fill: "#fff",
        "font-size": 10 }, sg).textContent = "soquete";
    }
    // rótulo
    el("text", { x: mx + mw / 2, y: topo - 14, "text-anchor": "middle", fill: "#12385c",
      "font-size": 12, "font-weight": "bold" }, g).textContent = "Molde Ø152,4 mm";
    return g;
  }

  // Cena de imersão: molde submerso em tanque + extensômetro
  function desenhaImersao(nivelExp) {
    limpaCena();
    var g = el("g", {}, $("cena"));
    baseBancada(g);
    // tanque
    el("rect", { x: 70, y: 150, width: 260, height: 260, fill: "#bfe0ef", opacity: 0.5,
      stroke: "#7fb4cf", "stroke-width": 3 }, g);
    // água (ondas)
    el("rect", { x: 72, y: 175, width: 256, height: 233, fill: "#8fc7e0", opacity: 0.55 }, g);
    // molde submerso
    var mx = 150, mw = 100, topo = 200, base = 390;
    el("rect", { x: mx, y: topo, width: mw, height: base - topo, fill: "#c19a5b",
      stroke: "#6b7d8c", "stroke-width": 3, opacity: 0.9 }, g);
    // discos de sobrecarga
    el("rect", { x: mx - 6, y: topo - 10, width: mw + 12, height: 10, rx: 2, fill: "#556270" }, g);
    // tripé + extensômetro
    el("line", { x1: mx, y1: topo - 10, x2: mx - 20, y2: 150, stroke: "#444", "stroke-width": 2 }, g);
    el("line", { x1: mx + mw, y1: topo - 10, x2: mx + mw + 20, y2: 150, stroke: "#444", "stroke-width": 2 }, g);
    el("circle", { cx: mx + mw / 2, cy: 145, r: 18, fill: "#fff", stroke: "#12385c", "stroke-width": 2 }, g);
    el("text", { id: "exp-read", x: mx + mw / 2, y: 149, "text-anchor": "middle",
      "font-size": 10, fill: "#c0392b", "font-weight": "bold" }, g).textContent =
      (nivelExp != null ? nivelExp.toFixed(2) : "0.00");
    el("text", { x: 200, y: 172, "text-anchor": "middle", fill: "#12385c", "font-size": 11,
      "font-weight": "bold" }, g).textContent = "Imersão — 4 dias";
    return g;
  }

  // Cena de prensa: pistão sobre o molde + mostrador analógico de carga
  // mostrarNumero=false (modo guiado): o aluno LÊ o ponteiro; sem número.
  var DIAL_MAX = 20; // fundo de escala do relógio (kN)
  function desenhaPrensa(penetracaoMM, cargaKN, mostrarNumero) {
    limpaCena();
    var g = el("g", {}, $("cena"));
    baseBancada(g);
    var mx = 130, mw = 140, topo = 230, base = 400;
    // pórtico da prensa
    el("rect", { x: 40, y: 30, width: 320, height: 12, fill: "#3d4a57" }, g);
    el("rect", { x: 46, y: 30, width: 12, height: 380, fill: "#556270" }, g);
    el("rect", { x: 342, y: 30, width: 12, height: 380, fill: "#556270" }, g);
    // molde
    el("rect", { x: mx, y: topo, width: mw, height: base - topo, fill: "#c19a5b",
      stroke: "#6b7d8c", "stroke-width": 4 }, g);
    el("rect", { x: mx - 6, y: topo - 8, width: mw + 12, height: 8, rx: 2, fill: "#556270" }, g); // sobrecarga
    // pistão — desce conforme penetração (escala visual: 1 mm ~ 3 px)
    var escala = 3.2;
    var pistTopo = 60, pistBaseY = topo - 8 + penetracaoMM * escala;
    el("rect", { x: mx + mw / 2 - 5, y: pistTopo, width: 10, height: pistBaseY - pistTopo,
      fill: "#2b3944", id: "pistao" }, g);
    el("rect", { x: mx + mw / 2 - 14, y: pistTopo - 14, width: 28, height: 16, rx: 3, fill: "#12385c" }, g);
    el("text", { x: mx + mw / 2, y: (pistTopo + topo) / 2, "text-anchor": "middle",
      fill: "#2b3944", "font-size": 9, transform: "rotate(-90 " + (mx + mw / 2) + " " + ((pistTopo + topo) / 2) + ")" }, g)
      .textContent = "pistão 3 pol²";

    // ---- mostrador analógico (relógio) do anel dinamométrico ----
    var cx = 318, cy = 95, R = 46;
    var dg = el("g", {}, g);
    el("circle", { cx: cx, cy: cy, r: R + 4, fill: "#eef3f7", stroke: "#12385c", "stroke-width": 3 }, dg);
    el("circle", { cx: cx, cy: cy, r: R, fill: "#fff", stroke: "#9fb2c2", "stroke-width": 1 }, dg);
    el("text", { x: cx, y: cy - R + 14, "text-anchor": "middle", "font-size": 8, fill: "#4d5d6a" }, dg)
      .textContent = t("th_ckn").toUpperCase();
    // arco de -120° a +120°: graduações a cada 2 kN, números a cada 5 kN
    var ang0 = -120, span = 240;
    function pol(ang, r) { var rad = ang * Math.PI / 180; return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }; }
    for (var v = 0; v <= DIAL_MAX; v += 2) {
      var a = ang0 + span * (v / DIAL_MAX);
      var maior = (v % 5 === 0) || (v % 10 === 0);
      var p1 = pol(a, R - (maior ? 9 : 5)), p2 = pol(a, R - 1);
      el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#33475a",
        "stroke-width": maior ? 1.6 : 0.8 }, dg);
      if (v % 5 === 0) {
        var pl = pol(a, R - 17);
        el("text", { x: pl.x, y: pl.y + 3, "text-anchor": "middle", "font-size": 8, fill: "#12385c" }, dg)
          .textContent = v;
      }
    }
    // ponteiro
    var ang = ang0 + Math.min(cargaKN / DIAL_MAX, 1) * span;
    var tip = pol(ang, R - 8), tail = pol(ang + 180, 8);
    el("line", { x1: tail.x, y1: tail.y, x2: tip.x, y2: tip.y, stroke: "#c0392b", "stroke-width": 2.4,
      "stroke-linecap": "round" }, dg);
    el("circle", { cx: cx, cy: cy, r: 4, fill: "#12385c" }, dg);
    // número (só quando permitido — demo ou após confirmar)
    if (mostrarNumero) {
      el("text", { x: cx, y: cy + R - 6, "text-anchor": "middle", "font-size": 13, fill: "#c0392b",
        "font-weight": "bold", "font-family": "Courier New,monospace" }, dg).textContent = cargaKN.toFixed(2);
    } else {
      el("text", { x: cx, y: cy + R - 6, "text-anchor": "middle", "font-size": 12, fill: "#8a99a6" }, dg)
        .textContent = "? kN";
    }
    // régua de penetração
    el("text", { x: mx + mw + 14, y: topo + 10, "font-size": 10, fill: corTexto() }, g)
      .textContent = t("msg_penetracao") + ": " + penetracaoMM.toFixed(2) + " mm";
    return g;
  }

  // ============================================================
  //  FLUXO DO ENSAIO
  // ============================================================
  function reseta() {
    estado.sim = null; estado.leituraIdx = 0; estado.concluido = false;
    $("log").innerHTML = "";
    $("planilha-box").style.display = "none";
    $("resultado-box").style.display = "none";
    $("graficos-finais").style.display = "none";
    $("controles-preparo").style.display = "";
    $("passo-titulo").textContent = t("passo1_tit");
    $("passo-texto").innerHTML = t("passo1_txt");
    $("btn-principal").textContent = t("btn_iniciar");
    $("btn-principal").disabled = false;
    $("btn-principal").onclick = null;
    marcaEtapa(1);
    desenhaMolde(0);
    setStatus(t("msg_inicio"));
  }

  async function iniciar() {
    if (estado.rodando) return;
    estado.rodando = true;
    $("btn-principal").disabled = true;
    $("controles-preparo").style.display = "none";
    estado.solo = bSolo.value;
    estado.energia = $("b-energia").value;
    estado.umidade = parseFloat($("b-umidade").value);
    estado.sim = CBR.simular({ solo: estado.solo, energia: estado.energia,
      umidade: estado.umidade, ruidoPct: 3, seed: 11 });

    var en = CBR.ENERGIAS[estado.energia];
    log(t("msg_solo") + ": <b>" + CBR.nomeSolo(estado.solo) + "</b>");
    log(t("msg_energia") + ": <b>" + CBR.nomeEnergia(estado.energia) + "</b> (" + en.golpes + " " + t("msg_golpes") + ")");
    log(t("msg_umid_mold") + ": <b>" + estado.umidade + "%</b> (" + t("msg_otima") + ": " + estado.sim.compactacao.wopt_energia + "%)");

    await faseCompactacao();
    await faseImersao();
    await fasePenetracao();   // guiado: pausa p/ leituras; demo: automático
  }

  // ---- Fase 2: compactação (animação de golpes) ----
  async function faseCompactacao() {
    marcaEtapa(2);
    $("passo-titulo").textContent = t("msg_comp_tit");
    var en = CBR.ENERGIAS[estado.energia];
    $("passo-texto").innerHTML = t("msg_comp_txt").replace("{n}", en.golpes);
    var base = 400, topo = 120, alturaCamada = (base - topo) / 5;
    var golpesVis = estado.modo === "demo" ? 3 : Math.min(en.golpes, 5); // golpes visuais
    for (var c = 1; c <= 5; c++) {
      desenhaMolde(c - 1, { soquete: true });
      setStatus(t("msg_camada") + " <b>" + c + "/5</b> — " + t("msg_compactando"));
      var soq = $("soquete");
      var repouso = base - (c - 1) * alturaCamada - c * alturaCamada / 5 - 50;
      for (var gpe = 0; gpe < golpesVis; gpe++) {
        if (soq) { soq.setAttribute("transform", "translate(0," + (repouso - 20) + ")"); }
        await sleep(estado.modo === "demo" ? 70 : 110);
        if (soq) { soq.setAttribute("transform", "translate(0," + repouso + ")"); }
        await sleep(estado.modo === "demo" ? 50 : 90);
      }
      desenhaMolde(c, { soquete: c < 5, soqueteY: 40 });
      log(t("msg_camada") + " " + c + " " + t("msg_camada_ok") + " (" + en.golpes + " " + t("msg_golpes2") + ").", "ok");
      await sleep(estado.modo === "demo" ? 120 : 200);
    }
    desenhaMolde(5);
    var comp = estado.sim.compactacao;
    log(t("msg_gd") + " = <b>" + comp.gd_moldagem + " g/cm³</b> · " + t("msg_gc") + " = <b>" +
      comp.grau_compactacao + "%</b>", "ok");
    setStatus(t("msg_cp_moldado") + " " + comp.grau_compactacao + "%.");
    await sleep(estado.modo === "demo" ? 400 : 600);
  }

  // ---- Fase 3: imersão (4 dias, expansão) ----
  async function faseImersao() {
    marcaEtapa(3);
    $("passo-titulo").textContent = t("msg_imersao_tit");
    $("passo-texto").innerHTML = t("msg_imersao_txt");
    var expTotal = estado.sim.resultado.expansao_pct;
    for (var dia = 0; dia <= 4; dia++) {
      var nivel = expTotal * (1 - Math.exp(-dia / 1.6)); // curva de embebição
      desenhaImersao(nivel);
      setStatus(t("et3").replace(/^[0-9]+ · /, "") + " — " + t("msg_dia") + " <b>" + dia + "/4</b> · " + nivel.toFixed(2) + "%");
      if (dia > 0) log(t("msg_dia") + " " + dia + ": " + t("msg_expansao_ac") + " = " + nivel.toFixed(2) + "%");
      await sleep(estado.modo === "demo" ? 250 : 420);
    }
    log(t("msg_exp_final") + " = <b>" + expTotal.toFixed(2) + "%</b>" +
      (expTotal > 2 ? " " + t("msg_elevada") : " " + t("msg_aceitavel")), expTotal > 2 ? "" : "ok");
    setStatus(t("msg_imersao_fim") + " (" + expTotal.toFixed(2) + "%)");
    await sleep(estado.modo === "demo" ? 400 : 600);
  }

  // ---- Fase 4: penetração ----
  async function fasePenetracao() {
    marcaEtapa(4);
    $("passo-titulo").textContent = t("msg_pen_tit");
    var curva = estado.sim.penetracao.curva;
    montaPlanilha();
    $("planilha-box").style.display = "";
    if (estado.modo === "demo") {
      $("passo-texto").innerHTML = t("msg_pen_demo");
      for (var i = 0; i < curva.length; i++) {
        await passoPenetracao(i, true);
        await sleep(280);
      }
      finaliza();
    } else {
      $("passo-texto").innerHTML = t("msg_pen_guiado");
      estado.leituraIdx = 0;
      $("btn-principal").textContent = t("btn_aplicar");
      $("btn-principal").disabled = false;
      $("btn-principal").onclick = avancaGuiado;
      desenhaPrensa(0, 0, true); // pistão em repouso, carga 0 (número visível: é zero)
      setStatus(t("msg_pistao_pos"));
    }
  }

  function montaPlanilha() {
    var curva = estado.sim.penetracao.curva;
    // no modo guiado NÃO há coluna "Mostrador" com o valor — o aluno lê o relógio.
    var thMost = estado.modo === "demo"
      ? "<th>" + t("th_most") + " (" + t("th_ckn") + ")</th>" : "";
    var h = "<thead><tr><th>" + t("th_pen") + " (mm)</th>" + thMost +
            "<th>" + t("th_registrar") + " (" + t("th_ckn") + ")</th><th>✓</th></tr></thead><tbody>";
    curva.forEach(function (p, i) {
      var destaca = ehControle(p.penetracao_mm);
      var tdMost = estado.modo === "demo" ? "<td class='mostrador' id='most-" + i + "'>—</td>" : "";
      h += "<tr id='lin-" + i + "'" + (destaca ? " style='background:#fbf4e9'" : "") + ">" +
        "<td>" + p.penetracao_mm + (destaca ? " ★" : "") + "</td>" + tdMost +
        "<td id='reg-" + i + "'>—</td>" +
        "<td class='status' id='st-" + i + "'>—</td></tr>";
    });
    h += "</tbody>";
    $("planilha").innerHTML = h;
  }

  // registra automaticamente (modo demo)
  async function passoPenetracao(i, autoRegistra) {
    var p = estado.sim.penetracao.curva[i];
    desenhaPrensa(p.penetracao_mm, p.forca_kN, true); // demo: número visível
    var most = $("most-" + i); if (most) most.textContent = p.forca_kN.toFixed(2);
    var lin = $("lin-" + i); if (lin) lin.scrollIntoView({ block: "nearest" });
    setStatus(t("msg_penetracao") + " <b>" + p.penetracao_mm + " mm</b> · " + p.forca_kN.toFixed(2) + " kN");
    if (autoRegistra) {
      $("reg-" + i).textContent = p.forca_kN.toFixed(2);
      $("st-" + i).textContent = "✓"; $("st-" + i).className = "status certo";
      if (ehControle(p.penetracao_mm))
        log(t("msg_registrado") + " " + p.penetracao_mm + " mm: " + p.forca_kN.toFixed(2) + " kN (" + t("msg_controle") + ").", "ok");
    }
  }

  // modo guiado: avança uma penetração; o número NÃO aparece — o aluno lê o ponteiro
  async function avancaGuiado() {
    var i = estado.leituraIdx;
    var curva = estado.sim.penetracao.curva;
    if (i >= curva.length) return;
    $("btn-principal").disabled = true;
    var p = curva[i];
    // anima a descida do pistão suavemente, ponteiro subindo, SEM número
    var passos = 8, from = i > 0 ? curva[i - 1].penetracao_mm : 0;
    for (var s = 1; s <= passos; s++) {
      var pen = from + (p.penetracao_mm - from) * s / passos;
      var carga = p.forca_kN * (pen / p.penetracao_mm);
      desenhaPrensa(pen, carga, false); // <-- número escondido
      await sleep(45);
    }
    var lin = $("lin-" + i); if (lin) lin.scrollIntoView({ block: "nearest" });
    setStatus(t("msg_leia") + " " + p.penetracao_mm + " mm.");
    // campo para o aluno registrar a leitura do ponteiro
    var reg = $("reg-" + i);
    reg.innerHTML = "<input type='number' step='0.01' id='in-" + i + "' placeholder='kN'>";
    var inp = $("in-" + i);
    inp.focus();
    inp.onkeydown = function (ev) { if (ev.key === "Enter") confirmaLeitura(i, p); };
    $("btn-principal").textContent = t("btn_confirmar");
    $("btn-principal").disabled = false;
    $("btn-principal").onclick = function () { confirmaLeitura(i, p); };
  }

  function confirmaLeitura(i, p) {
    var inp = $("in-" + i);
    var val = parseFloat(inp.value);
    var alvo = p.forca_kN;
    var st = $("st-" + i);
    if (isNaN(val)) { inp.style.borderColor = "#c0392b"; return; }
    var err = Math.abs(val - alvo) / (alvo || 1);
    if (err <= TOL) {
      st.textContent = "✓"; st.className = "status certo";
      inp.replaceWith(document.createTextNode(val.toFixed(2)));
      if (ehControle(p.penetracao_mm))
        log(t("msg_registrado") + " " + p.penetracao_mm + " mm: " + val.toFixed(2) + " kN (" + t("msg_controle") + ").", "ok");
    } else {
      st.textContent = "≠"; st.className = "status erro";
      log("⚠️ " + p.penetracao_mm + " mm: " + val.toFixed(2) + " kN " + t("msg_difere"), "");
      inp.replaceWith(document.createTextNode(val.toFixed(2)));
    }
    estado.leituraIdx++;
    if (estado.leituraIdx >= estado.sim.penetracao.curva.length) {
      finaliza();
    } else {
      $("btn-principal").textContent = t("btn_aplicar");
      $("btn-principal").onclick = avancaGuiado;
    }
  }

  // ---- Fase 5: cálculo, resultado e GRÁFICOS ----
  function finaliza() {
    marcaEtapa(5);
    estado.rodando = false;
    estado.concluido = true;
    var r = estado.sim;
    $("passo-titulo").textContent = t("msg_calc_tit");
    $("passo-texto").innerHTML = t("msg_calc_txt");
    $("btn-principal").textContent = t("btn_novo");
    $("btn-principal").disabled = false;
    $("btn-principal").onclick = reseta;

    var cls = CBR.classificar(r.resultado.cbr_final);
    var gov = r.resultado.governa === "2.54" ? "2,54" : "5,08";
    log("P 2,54 mm = " + r.penetracao.p254_MPa + " MPa → CBR = " + r.resultado.cbr_254 + "%", "calc");
    log("P 5,08 mm = " + r.penetracao.p508_MPa + " MPa → CBR = " + r.resultado.cbr_508 + "%", "calc");
    log("<b>" + t("msg_cbr_ensaio") + " = " + r.resultado.cbr_final + "%</b> (" + t("governa") + " " + gov + " mm)", "calc");

    var box = $("resultado-box");
    box.style.display = "";
    box.innerHTML =
      "<div class='resultado-final'>" +
      "<div class='cbr-grande'>CBR = " + r.resultado.cbr_final + "%</div>" +
      "<p class='centro'><span class='classe-tag' style='background:" + cls.cor + "'>" + CBR.nomeClasse(cls.classe) + "</span></p>" +
      "<table class='tab' style='margin-top:.6rem'><tbody>" +
      "<tr><td>" + t("res_cbr254") + "</td><td><b>" + r.resultado.cbr_254 + "%</b></td></tr>" +
      "<tr><td>" + t("res_cbr508") + "</td><td><b>" + r.resultado.cbr_508 + "%</b></td></tr>" +
      "<tr><td>" + t("res_gc") + "</td><td>" + r.compactacao.grau_compactacao + "%</td></tr>" +
      "<tr><td>" + t("res_exp") + "</td><td>" + r.resultado.expansao_pct + "%</td></tr>" +
      "<tr><td>" + t("res_uso") + "</td><td>" + cls.uso + "</td></tr>" +
      "</tbody></table></div>";
    setStatus(t("msg_concluido") + " — CBR = <b>" + r.resultado.cbr_final + "%</b> (" + CBR.nomeClasse(cls.classe) + ").");

    // gráficos consistentes com o ensaio + link para o simulador
    desenhaGraficosFinais(r);
    var url = "simulador.html?solo=" + encodeURIComponent(estado.solo) +
      "&energia=" + encodeURIComponent(estado.energia) +
      "&umidade=" + encodeURIComponent(estado.umidade);
    $("btn-ver-sim").setAttribute("href", url);
    $("graficos-finais").style.display = "";
    $("graficos-finais").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function desenhaGraficosFinais(r) {
    if (typeof Chart === "undefined") return;
    var cTxt = corTexto();
    var cor = CBR.classificar(r.resultado.cbr_final).cor;
    // carga × penetração (mesmos pontos lidos no ensaio)
    var pts = r.penetracao.curva.map(function (p) { return { x: p.penetracao_mm, y: p.pressao_MPa }; });
    var anota = {
      id: "ctrlLab",
      afterDraw: function (c) {
        var xa = c.scales.x, ya = c.scales.y, ctx = c.ctx;
        ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "#c0392b";
        [2.54, 5.08].forEach(function (d) {
          var px = xa.getPixelForValue(d);
          ctx.beginPath(); ctx.moveTo(px, ya.top); ctx.lineTo(px, ya.bottom); ctx.stroke();
        });
        ctx.restore();
      }
    };
    if (chartPenFinal) chartPenFinal.destroy();
    chartPenFinal = new Chart($("g-pen"), {
      type: "line",
      data: { datasets: [{ label: t("aba_pen"), data: pts, borderColor: cor,
        backgroundColor: cor + "22", borderWidth: 3, tension: 0.25, pointRadius: 3, fill: true }] },
      plugins: [anota],
      options: { responsive: true, maintainAspectRatio: false,
        scales: {
          x: { type: "linear", min: 0, title: { display: true, text: t("ch_pen"), color: cTxt }, ticks: { color: cTxt } },
          y: { min: 0, title: { display: true, text: t("ch_pressao"), color: cTxt }, ticks: { color: cTxt } }
        },
        plugins: { legend: { display: false }, title: { display: true, text: t("aba_pen"), color: cTxt } } }
    });
    // curva de compactação com o ponto de moldagem
    var cc = CBR.curvaCompactacao(estado.solo, estado.energia);
    var cpts = cc.pontos.map(function (p) { return { x: p.w, y: p.gd }; });
    var apice = [{ x: cc.woptE, y: cc.gdmaxE }];
    var atual = [{ x: r.compactacao.umidade_moldagem, y: r.compactacao.gd_moldagem }];
    if (chartCompFinal) chartCompFinal.destroy();
    chartCompFinal = new Chart($("g-comp"), {
      type: "line",
      data: { datasets: [
        { label: t("ch_curva"), data: cpts, borderColor: "#1d5a8a", borderWidth: 3, tension: 0.3, pointRadius: 0, fill: false },
        { label: t("ch_apice"), data: apice, borderColor: "#2f7d4f", backgroundColor: "#2f7d4f", pointRadius: 6, pointStyle: "rectRot", showLine: false },
        { label: t("ch_moldagem"), data: atual, borderColor: "#c0392b", backgroundColor: "#c0392b", pointRadius: 7, showLine: false }
      ] },
      options: { responsive: true, maintainAspectRatio: false,
        scales: {
          x: { type: "linear", title: { display: true, text: t("ch_umid"), color: cTxt }, ticks: { color: cTxt } },
          y: { title: { display: true, text: t("ch_gd"), color: cTxt }, ticks: { color: cTxt } }
        },
        plugins: { legend: { position: "top", labels: { color: cTxt } },
          title: { display: true, text: t("aba_comp"), color: cTxt } } }
    });
  }

  // ============================================================
  //  EVENTOS
  // ============================================================
  $("b-umidade").addEventListener("input", function () { $("b-umidade-val").textContent = this.value; });
  bSolo.addEventListener("change", function () { atualizaHint(); $("b-umidade").value = woptAtual(); $("b-umidade-val").textContent = woptAtual(); });
  $("b-energia").addEventListener("change", function () { atualizaHint(); $("b-umidade").value = woptAtual(); $("b-umidade-val").textContent = woptAtual(); });

  function setModo(m) {
    if (estado.rodando) return;
    estado.modo = m;
    $("modo-guiado").classList.toggle("ativo", m === "guiado");
    $("modo-demo").classList.toggle("ativo", m === "demo");
    reseta();
  }
  $("modo-guiado").addEventListener("click", function () { setModo("guiado"); });
  $("modo-demo").addEventListener("click", function () { setModo("demo"); });

  $("btn-principal").addEventListener("click", function () {
    // o handler padrão é iniciar; nas fases seguintes é reatribuído via .onclick
    if (!estado.rodando && estado.etapa === 1) iniciar();
  });

  // reação à troca de idioma
  if (window.CBRi18n) window.CBRi18n.onChange(function () {
    preencheSolos(); atualizaHint();
    if (estado.concluido && estado.sim) {
      // recalcula rótulos do resultado e gráficos no novo idioma
      var i = estado.leituraIdx; estado.leituraIdx = estado.sim.penetracao.curva.length;
      finaliza(); estado.leituraIdx = i;
    } else if (!estado.rodando) {
      $("passo-titulo").textContent = t("passo1_tit");
      $("passo-texto").innerHTML = t("passo1_txt");
      $("btn-principal").textContent = t("btn_iniciar");
      setStatus(t("msg_inicio"));
    }
  });
  // reação à troca de tema — redesenha gráficos finais com nova cor de texto
  document.addEventListener("theme:changed", function () {
    if (estado.concluido && estado.sim) desenhaGraficosFinais(estado.sim);
  });

  // Início
  atualizaHint();
  $("b-umidade").value = woptAtual();
  $("b-umidade-val").textContent = woptAtual();
  reseta();
})();
