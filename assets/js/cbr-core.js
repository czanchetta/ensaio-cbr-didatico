/* ============================================================
   cbr-core.js — Núcleo de cálculo do ensaio CBR / ISC
   ------------------------------------------------------------
   Modelo PARAMÉTRICO e SINTÉTICO, com fins didáticos.
   Reproduz o COMPORTAMENTO qualitativo do ensaio (efeito de
   energia de compactação, umidade e tipo de solo) para que o
   aluno explore relações causa-efeito. NÃO são dados de
   laboratório e não devem ser usados em projeto.

   Referências das constantes de padronização:
   - Pressão-padrão a 2,54 mm: 6,9 MPa (≈70,3 kgf/cm² ≈1000 psi)
   - Pressão-padrão a 5,08 mm: 10,3 MPa (≈105,5 kgf/cm² ≈1500 psi)
   - CBR (%) = (pressão medida / pressão-padrão) × 100
   ============================================================ */
(function (global) {
  "use strict";

  // ---- Constantes físicas / de padronização ----
  var PISTAO_AREA_CM2 = 19.35;          // 3 pol² — área do pistão de penetração
  var P_PADRAO = {                      // pressões-padrão (MPa)
    "2.54": 6.9,
    "5.08": 10.3
  };
  var CONV = {
    MPa_kgfcm2: 10.1972,               // 1 MPa = 10,1972 kgf/cm²
    MPa_psi: 145.038,                  // 1 MPa = 145,038 psi
    kN_kgf: 101.972                    // 1 kN = 101,972 kgf
  };

  // Pontos de leitura de penetração (mm) — conforme prática DNIT/ASTM
  var PENETRACOES = [0.63, 1.27, 1.90, 2.54, 3.17, 3.81, 4.45, 5.08, 7.62, 10.16, 12.70];

  // ---- Banco de solos (valores típicos de referência) ----
  // cbrMod  = CBR (%) na umidade ótima, ENERGIA MODIFICADA (referência)
  // wopt    = umidade ótima (%) na energia modificada
  // gdmax   = massa específica seca máxima (g/cm³) na energia modificada
  // exp     = expansão de referência (%) — potencial de inchamento
  // plast   = índice qualitativo de plasticidade (0..1) p/ ruído/curvatura
  var SOLOS = {
    argila_alta: { nome: "Argila de alta plasticidade (CH · A-7-5/6)", cbrMod: 4,  wopt: 24, gdmax: 1.55, exp: 4.5, plast: 0.95, uscs: "CH", aashto: "A-7" },
    argila_baixa:{ nome: "Argila de baixa plasticidade (CL · A-6)",     cbrMod: 8,  wopt: 18, gdmax: 1.72, exp: 2.2, plast: 0.7,  uscs: "CL", aashto: "A-6" },
    silte:       { nome: "Silte (ML · A-4)",                            cbrMod: 12, wopt: 16, gdmax: 1.78, exp: 1.2, plast: 0.5,  uscs: "ML", aashto: "A-4" },
    areia_arg:   { nome: "Areia argilosa (SC · A-2-6)",                 cbrMod: 22, wopt: 12, gdmax: 1.95, exp: 0.8, plast: 0.45, uscs: "SC", aashto: "A-2-6" },
    areia_silt:  { nome: "Areia siltosa (SM · A-2-4)",                  cbrMod: 32, wopt: 11, gdmax: 2.00, exp: 0.3, plast: 0.3,  uscs: "SM", aashto: "A-2-4" },
    areia_bem:   { nome: "Areia bem graduada (SW · A-1-b)",             cbrMod: 45, wopt: 9,  gdmax: 2.05, exp: 0.1, plast: 0.15, uscs: "SW", aashto: "A-1-b" },
    pedregulho:  { nome: "Pedregulho/brita graduada (GW · A-1-a)",      cbrMod: 75, wopt: 7,  gdmax: 2.15, exp: 0.05,plast: 0.05, uscs: "GW", aashto: "A-1-a" }
  };

  // ---- Energias de compactação (molde CBR, 5 camadas) ----
  // golpes  = golpes por camada (soquete grande 4,536 kgf, queda 45,7 cm)
  // fGd     = fator sobre a massa específica seca máxima
  // fWopt   = fator sobre a umidade ótima
  // fCbr    = fator sobre o CBR (efeito combinado densidade)
  var ENERGIAS = {
    normal:       { nome: "Normal",       golpes: 12, fGd: 0.92, fWopt: 1.18, fCbr: 0.33 },
    intermediaria:{ nome: "Intermediária",golpes: 26, fGd: 0.96, fWopt: 1.08, fCbr: 0.60 },
    modificada:   { nome: "Modificada",   golpes: 55, fGd: 1.00, fWopt: 1.00, fCbr: 1.00 }
  };

  // ---- Nomes trilíngues (PT/EN/ES) para solos e energias ----
  var NOMES_SOLO = {
    argila_alta:  { pt: "Argila de alta plasticidade (CH · A-7-5/6)", en: "High-plasticity clay (CH · A-7-5/6)", es: "Arcilla de alta plasticidad (CH · A-7-5/6)" },
    argila_baixa: { pt: "Argila de baixa plasticidade (CL · A-6)", en: "Low-plasticity clay (CL · A-6)", es: "Arcilla de baja plasticidad (CL · A-6)" },
    silte:        { pt: "Silte (ML · A-4)", en: "Silt (ML · A-4)", es: "Limo (ML · A-4)" },
    areia_arg:    { pt: "Areia argilosa (SC · A-2-6)", en: "Clayey sand (SC · A-2-6)", es: "Arena arcillosa (SC · A-2-6)" },
    areia_silt:   { pt: "Areia siltosa (SM · A-2-4)", en: "Silty sand (SM · A-2-4)", es: "Arena limosa (SM · A-2-4)" },
    areia_bem:    { pt: "Areia bem graduada (SW · A-1-b)", en: "Well-graded sand (SW · A-1-b)", es: "Arena bien graduada (SW · A-1-b)" },
    pedregulho:   { pt: "Pedregulho/brita graduada (GW · A-1-a)", en: "Well-graded gravel (GW · A-1-a)", es: "Grava bien graduada (GW · A-1-a)" }
  };
  var NOMES_ENERGIA = {
    normal:        { pt: "Normal", en: "Standard", es: "Normal" },
    intermediaria: { pt: "Intermediária", en: "Intermediate", es: "Intermedia" },
    modificada:    { pt: "Modificada", en: "Modified", es: "Modificada" }
  };
  var CLASSES_I18N = {
    "Péssimo":   { pt: "Péssimo", en: "Very poor", es: "Pésimo" },
    "Ruim":      { pt: "Ruim", en: "Poor", es: "Malo" },
    "Regular":   { pt: "Regular", en: "Fair", es: "Regular" },
    "Bom":       { pt: "Bom", en: "Good", es: "Bueno" },
    "Muito bom": { pt: "Muito bom", en: "Very good", es: "Muy bueno" },
    "Excelente": { pt: "Excelente", en: "Excellent", es: "Excelente" }
  };
  function lang() { return (typeof window !== "undefined" && window.CBRi18n && window.CBRi18n.lang()) || "pt"; }
  function nomeSolo(key, lg) { lg = lg || lang(); return (NOMES_SOLO[key] && NOMES_SOLO[key][lg]) || (SOLOS[key] && SOLOS[key].nome) || key; }
  function nomeEnergia(key, lg) { lg = lg || lang(); return (NOMES_ENERGIA[key] && NOMES_ENERGIA[key][lg]) || key; }
  function nomeClasse(cl, lg) { lg = lg || lang(); return (CLASSES_I18N[cl] && CLASSES_I18N[cl][lg]) || cl; }

  function num(x, d) { return typeof x === "number" && isFinite(x) ? x : d; }
  function round(x, n) { var p = Math.pow(10, n || 0); return Math.round(x * p) / p; }

  /* Curva de compactação (γd vs w) — parábola em torno da ótima da energia. */
  function densidadeSeca(w, woptE, gdmaxE, plast) {
    // largura da parábola: solos plásticos têm curva mais "aberta"
    var k = 0.006 + 0.010 * (1 - plast); // 1/(%²)
    var gd = gdmaxE * (1 - k * Math.pow(w - woptE, 2));
    return Math.max(gd, 0.6 * gdmaxE);
  }

  /* Penalidade de umidade sobre o CBR (embebido).
     Pico levemente no ramo seco; queda acentuada no ramo úmido. */
  function fatorUmidade(w, woptE) {
    var d = w - woptE;
    var kSeco = 0.010;   // penalização suave no ramo seco
    var kUmido = 0.028;  // penalização forte no ramo úmido (embebição)
    var k = d < 0 ? kSeco : kUmido;
    // desloca o pico ~1% abaixo da ótima
    var dPico = d + 1.0;
    var kk = dPico < 0 ? kSeco : kUmido;
    return Math.exp(-kk * dPico * dPico);
  }

  /* Gera a curva carga×penetração pelo modelo hiperbólico
     p(δ) = a·δ / (1 + b·δ), ajustado para reproduzir p254 e p508. */
  function curvaPenetracao(p254, p508) {
    var d1 = 2.54, d2 = 5.08;
    var x1 = 1 / d1, x2 = 1 / d2;
    var y1 = 1 / p254, y2 = 1 / p508;
    var slope = (y1 - y2) / (x1 - x2);   // = 1/a
    var a = 1 / slope;
    var intercept = y1 - slope * x1;     // = b/a
    var b = intercept * a;
    return function (delta) {
      var p = (a * delta) / (1 + b * delta);
      return p > 0 ? p : 0;
    };
  }

  /* Pseudo-ruído determinístico (para reprodutibilidade com "semente"). */
  function ruido(seed) {
    var s = Math.sin(seed * 12.9898) * 43758.5453;
    return (s - Math.floor(s)) - 0.5; // [-0.5, 0.5]
  }

  /* ==========================================================
     simular(opts) → objeto completo do ensaio
     opts = { solo, energia, umidade, ruidoPct, seed }
     ========================================================== */
  function simular(opts) {
    opts = opts || {};
    var solo = SOLOS[opts.solo] || SOLOS.areia_arg;
    var energia = ENERGIAS[opts.energia] || ENERGIAS.intermediaria;
    var ruidoPct = num(opts.ruidoPct, 2) / 100;
    var seed = num(opts.seed, 1);

    // Parâmetros da energia escolhida
    var woptE = solo.wopt * energia.fWopt;
    var gdmaxE = solo.gdmax * energia.fGd;

    // Umidade de moldagem (se não informada, usa a ótima da energia)
    var w = num(opts.umidade, woptE);

    // Densidade seca de moldagem e grau de compactação
    var gd = densidadeSeca(w, woptE, gdmaxE, solo.plast);
    var grauComp = gd / gdmaxE; // 0..1

    // CBR base (na ótima da energia) e penalidades
    var cbrBase = solo.cbrMod * energia.fCbr;
    var fUm = fatorUmidade(w, woptE);
    // pequeno bônus/penalidade por grau de compactação relativo
    var fDens = Math.pow(grauComp, 2.2);
    var cbr254 = cbrBase * fUm * fDens;
    if (cbr254 < 0.3) cbr254 = 0.3;

    // Pressões medidas (MPa)
    var p254 = (cbr254 / 100) * P_PADRAO["2.54"];
    // razão p508/p254 típica ~1,4 → 5,08 mm normalmente NÃO governa
    var razao = 1.40 + 0.10 * (1 - solo.plast); // granulares um pouco maior
    var p508 = p254 * razao;
    var cbr508 = (p508 / P_PADRAO["5.08"]) * 100;

    var f = curvaPenetracao(p254, p508);

    // Monta pontos da curva com ruído opcional
    var curva = PENETRACOES.map(function (delta, i) {
      var pMPa = f(delta);
      var r = 1 + ruidoPct * ruido(seed + i * 1.7) * (0.6 + 0.8 * solo.plast);
      pMPa = pMPa * r;
      if (pMPa < 0) pMPa = 0;
      var forcaKN = pMPa * PISTAO_AREA_CM2 * 0.1; // MPa·cm² = ×10^-1 kN (1 MPa=0,1 kN/cm²)
      return {
        penetracao_mm: delta,
        penetracao_pol: round(delta / 25.4, 3),
        pressao_MPa: round(pMPa, 3),
        pressao_kgfcm2: round(pMPa * CONV.MPa_kgfcm2, 2),
        pressao_psi: round(pMPa * CONV.MPa_psi, 1),
        forca_kN: round(forcaKN, 3),
        forca_kgf: round(forcaKN * CONV.kN_kgf, 1)
      };
    });

    // CBR final = maior valor entre 2,54 e 5,08 mm (com nota se 5,08 governa)
    var cbrFinal = Math.max(cbr254, cbr508);
    var governa = cbr508 > cbr254 ? "5.08" : "2.54";

    // Expansão (%) — cresce com plasticidade e umidade, cai com densidade
    var expBase = solo.exp;
    var fExpUm = 1 + Math.max(0, (w - woptE)) * 0.06;      // ramo úmido incha mais
    var fExpDens = Math.pow(grauComp, -1.5);               // menos denso incha mais
    var expansao = expBase * fExpUm * fExpDens;

    return {
      entrada: {
        solo: opts.solo, energia: opts.energia, umidade: round(w, 1),
        ruidoPct: opts.ruidoPct, seed: seed
      },
      solo: solo,
      energia: energia,
      compactacao: {
        wopt_energia: round(woptE, 1),
        gdmax_energia: round(gdmaxE, 3),
        umidade_moldagem: round(w, 1),
        gd_moldagem: round(gd, 3),
        grau_compactacao: round(grauComp * 100, 1)
      },
      penetracao: {
        curva: curva,
        p254_MPa: round(p254, 3),
        p508_MPa: round(p508, 3),
        p254_padrao_MPa: P_PADRAO["2.54"],
        p508_padrao_MPa: P_PADRAO["5.08"]
      },
      resultado: {
        cbr_254: round(cbr254, 1),
        cbr_508: round(cbr508, 1),
        cbr_final: round(cbrFinal, 1),
        governa: governa,
        expansao_pct: round(expansao, 2)
      }
    };
  }

  /* Curva de compactação completa (para o gráfico γd × w). */
  function curvaCompactacao(soloKey, energiaKey) {
    var solo = SOLOS[soloKey] || SOLOS.areia_arg;
    var energia = ENERGIAS[energiaKey] || ENERGIAS.intermediaria;
    var woptE = solo.wopt * energia.fWopt;
    var gdmaxE = solo.gdmax * energia.fGd;
    var pts = [];
    for (var w = woptE - 8; w <= woptE + 8; w += 1) {
      pts.push({ w: round(w, 1), gd: round(densidadeSeca(w, woptE, gdmaxE, solo.plast), 3) });
    }
    return { woptE: round(woptE, 1), gdmaxE: round(gdmaxE, 3), pontos: pts };
  }

  /* Classificação didática do subleito conforme faixa de CBR (DNIT). */
  function classificar(cbr) {
    if (cbr < 2)  return { classe: "Péssimo", uso: "Subleito inadequado — exige substituição/estabilização", cor: "#c0392b" };
    if (cbr < 5)  return { classe: "Ruim",    uso: "Subleito de baixa capacidade", cor: "#e67e22" };
    if (cbr < 12) return { classe: "Regular", uso: "Subleito aceitável (expansão ≤ 2%)", cor: "#f1c40f" };
    if (cbr < 20) return { classe: "Bom",     uso: "Reforço de subleito (CBR ≥ 12%, expansão ≤ 1%)", cor: "#27ae60" };
    if (cbr < 60) return { classe: "Muito bom",uso: "Sub-base (CBR ≥ 20%, expansão ≤ 1%)", cor: "#16a085" };
    return           { classe: "Excelente", uso: "Base (CBR ≥ 60–80% conforme tráfego)", cor: "#12385c" };
  }

  global.CBR = {
    SOLOS: SOLOS, ENERGIAS: ENERGIAS, PENETRACOES: PENETRACOES,
    P_PADRAO: P_PADRAO, CONV: CONV, PISTAO_AREA_CM2: PISTAO_AREA_CM2,
    simular: simular, curvaCompactacao: curvaCompactacao,
    classificar: classificar, curvaPenetracao: curvaPenetracao,
    round: round,
    NOMES_SOLO: NOMES_SOLO, NOMES_ENERGIA: NOMES_ENERGIA,
    nomeSolo: nomeSolo, nomeEnergia: nomeEnergia, nomeClasse: nomeClasse
  };
})(window);
