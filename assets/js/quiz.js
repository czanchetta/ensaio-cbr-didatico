/* quiz.js — banco de questões trilíngue (PT/EN/ES) e lógica do quiz CBR/ISC.
   Reage a i18n:changed para trocar o idioma das questões. */
(function () {
  "use strict";

  var BANCO = {
    pt: [
    {
      q: "O que representa um CBR de 100%?",
      op: [
        "Um solo totalmente saturado",
        "Um solo com a mesma capacidade de suporte da brita-padrão de referência",
        "Um solo com 100% de grau de compactação",
        "Um solo com expansão nula"
      ],
      certa: 1,
      exp: "O CBR é a razão entre a pressão no solo e a pressão-padrão da brita de referência. 100% significa suporte igual ao da brita-padrão."
    },
    {
      q: "Quais são as pressões-padrão adotadas para as penetrações de 2,54 e 5,08 mm?",
      op: [
        "6,9 MPa e 10,3 MPa (≈1000 e 1500 psi)",
        "1,0 MPa e 2,0 MPa",
        "70 MPa e 105 MPa",
        "100 kPa e 150 kPa"
      ],
      certa: 0,
      exp: "As pressões-padrão são 6,9 MPa (≈70,3 kgf/cm² ≈1000 psi) a 2,54 mm e 10,3 MPa (≈105,5 kgf/cm² ≈1500 psi) a 5,08 mm."
    },
    {
      q: "Em geral, qual penetração governa o valor final do CBR?",
      op: [
        "Sempre a de 5,08 mm",
        "A de 2,54 mm, na maioria dos casos (adota-se o maior CBR)",
        "A média das duas",
        "A de 12,7 mm"
      ],
      certa: 1,
      exp: "Adota-se o MAIOR entre os dois CBR. Normalmente é o de 2,54 mm; se o de 5,08 mm for maior, repete-se o ensaio para confirmar."
    },
    {
      q: "Quantos golpes por camada e quantas camadas são usados na energia MODIFICADA no molde CBR?",
      op: ["12 golpes, 3 camadas", "26 golpes, 5 camadas", "55 golpes, 5 camadas", "55 golpes, 3 camadas"],
      certa: 2,
      exp: "Energia modificada: 55 golpes por camada em 5 camadas. Normal = 12; intermediária = 26 (todas em 5 camadas no molde CBR)."
    },
    {
      q: "Por quanto tempo o corpo de prova permanece imerso antes da penetração?",
      op: ["24 horas", "48 horas", "4 dias (96 h)", "7 dias"],
      certa: 2,
      exp: "A imersão dura 4 dias (96 h), simulando a condição mais desfavorável de umidade em serviço, com leitura diária da expansão."
    },
    {
      q: "Qual a velocidade de penetração do pistão no ensaio?",
      op: ["1,27 mm/min", "5,0 mm/min", "0,5 mm/min", "10 mm/min"],
      certa: 0,
      exp: "O pistão avança a 1,27 mm/min (equivalente a 0,05 pol/min)."
    },
    {
      q: "O que ocorre com o CBR quando o solo é moldado bem acima da umidade ótima?",
      op: [
        "Aumenta, pois há mais água lubrificando",
        "Não muda, pois o CBR só depende do tipo de solo",
        "Diminui, pois cai a densidade e a resistência (ramo úmido)",
        "Aumenta linearmente com a umidade"
      ],
      certa: 2,
      exp: "No ramo úmido, o excesso de água reduz a densidade seca e a resistência; o CBR cai acentuadamente e a expansão tende a crescer."
    },
    {
      q: "A correção da concavidade da curva carga×penetração é aplicada quando:",
      op: [
        "A curva é uma reta perfeita",
        "O início da curva é côncavo para cima (acomodação inicial)",
        "O ensaio foi feito sem imersão",
        "A carga diminui com a penetração"
      ],
      certa: 1,
      exp: "Quando o trecho inicial é côncavo para cima, traça-se a tangente no ponto de inflexão e desloca-se a origem; as pressões são lidas a partir da nova origem."
    },
    {
      q: "Um solo argiloso de alta plasticidade tende a apresentar, em relação a uma areia bem graduada:",
      op: [
        "Maior CBR e menor expansão",
        "Menor CBR e maior expansão",
        "Mesmo CBR e mesma expansão",
        "Maior CBR e maior expansão"
      ],
      certa: 1,
      exp: "Argilas plásticas têm menor capacidade de suporte (CBR baixo) e maior potencial de expansão que areias/pedregulhos bem graduados."
    },
    {
      q: "Para reforço de subleito, um critério típico do DNIT é:",
      op: [
        "CBR ≥ 2% e expansão ≤ 2%",
        "CBR ≥ 12% e expansão ≤ 1%",
        "CBR ≥ 80% e expansão ≤ 0,5%",
        "Qualquer CBR, desde que a expansão seja alta"
      ],
      certa: 1,
      exp: "Para reforço de subleito costuma-se exigir CBR ≥ 12% e expansão ≤ 1%. Sub-base: CBR ≥ 20%; base: CBR ≥ 60–80% conforme o tráfego."
    }
  ],
    en: [
  {
    "q": "What does a CBR of 100% represent?",
    "op": [
      "A fully saturated soil",
      "A soil with the same bearing capacity as the standard reference crushed stone",
      "A soil with 100% degree of compaction",
      "A soil with zero expansion"
    ],
    "certa": 1,
    "exp": "CBR is the ratio between the pressure on the soil and the standard pressure of the reference crushed stone. 100% means support equal to that of the standard crushed stone."
  },
  {
    "q": "What are the standard pressures adopted for penetrations of 2.54 and 5.08 mm?",
    "op": [
      "6.9 MPa and 10.3 MPa (≈1000 and 1500 psi)",
      "1.0 MPa and 2.0 MPa",
      "70 MPa and 105 MPa",
      "100 kPa and 150 kPa"
    ],
    "certa": 0,
    "exp": "The standard pressures are 6.9 MPa (≈70.3 kgf/cm² ≈1000 psi) at 2.54 mm and 10.3 MPa (≈105.5 kgf/cm² ≈1500 psi) at 5.08 mm."
  },
  {
    "q": "In general, which penetration governs the final CBR value?",
    "op": [
      "Always the 5.08 mm one",
      "The 2.54 mm one, in most cases (the higher CBR is adopted)",
      "The average of both",
      "The 12.7 mm one"
    ],
    "certa": 1,
    "exp": "The HIGHER of the two CBR values is adopted. It is usually the 2.54 mm one; if the 5.08 mm value is higher, the test is repeated to confirm."
  },
  {
    "q": "How many blows per layer and how many layers are used for MODIFIED compaction energy in the CBR mold?",
    "op": [
      "12 blows, 3 layers",
      "26 blows, 5 layers",
      "55 blows, 5 layers",
      "55 blows, 3 layers"
    ],
    "certa": 2,
    "exp": "Modified energy: 55 blows per layer in 5 layers. Standard = 12; intermediate = 26 (all in 5 layers in the CBR mold)."
  },
  {
    "q": "For how long does the specimen remain soaked before penetration?",
    "op": [
      "24 hours",
      "48 hours",
      "4 days (96 h)",
      "7 days"
    ],
    "certa": 2,
    "exp": "Soaking lasts 4 days (96 h), simulating the most unfavorable moisture condition in service, with daily swell readings."
  },
  {
    "q": "What is the penetration speed of the piston in the test?",
    "op": [
      "1.27 mm/min",
      "5.0 mm/min",
      "0.5 mm/min",
      "10 mm/min"
    ],
    "certa": 0,
    "exp": "The piston advances at 1.27 mm/min (equivalent to 0.05 in/min)."
  },
  {
    "q": "What happens to the CBR when the soil is molded well above the optimum moisture content?",
    "op": [
      "It increases, because more water lubricates the soil",
      "It does not change, since CBR only depends on the soil type",
      "It decreases, since dry density and strength drop (wet side)",
      "It increases linearly with moisture"
    ],
    "certa": 2,
    "exp": "On the wet side, excess water reduces dry density and strength; the CBR drops sharply and expansion tends to increase."
  },
  {
    "q": "The correction for concavity of the load × penetration curve is applied when:",
    "op": [
      "The curve is a perfect straight line",
      "The initial part of the curve is concave upward (initial seating)",
      "The test was performed without soaking",
      "The load decreases with penetration"
    ],
    "certa": 1,
    "exp": "When the initial portion is concave upward, a tangent is drawn at the inflection point and the origin is shifted; pressures are then read from the new origin."
  },
  {
    "q": "A high-plasticity clayey soil tends to show, compared to a well-graded sand:",
    "op": [
      "Higher CBR and lower expansion",
      "Lower CBR and higher expansion",
      "Same CBR and same expansion",
      "Higher CBR and higher expansion"
    ],
    "certa": 1,
    "exp": "Plastic clays have lower bearing capacity (low CBR) and greater expansion potential than well-graded sands/gravels."
  },
  {
    "q": "For subgrade reinforcement, a typical DNIT criterion is:",
    "op": [
      "CBR ≥ 2% and expansion ≤ 2%",
      "CBR ≥ 12% and expansion ≤ 1%",
      "CBR ≥ 80% and expansion ≤ 0.5%",
      "Any CBR, as long as expansion is high"
    ],
    "certa": 1,
    "exp": "For subgrade reinforcement, a CBR ≥ 12% and expansion ≤ 1% is usually required. Subbase: CBR ≥ 20%; base: CBR ≥ 60–80% depending on traffic."
  }
],
    es: [
  {
    "q": "¿Qué representa un CBR del 100%?",
    "op": [
      "Un suelo totalmente saturado",
      "Un suelo con la misma capacidad de soporte que la piedra triturada patrón de referencia",
      "Un suelo con 100% de grado de compactación",
      "Un suelo con expansión nula"
    ],
    "certa": 1,
    "exp": "El CBR es la relación entre la presión en el suelo y la presión patrón de la piedra triturada de referencia. 100% significa un soporte igual al de la piedra triturada patrón."
  },
  {
    "q": "¿Cuáles son las presiones patrón adoptadas para las penetraciones de 2,54 y 5,08 mm?",
    "op": [
      "6,9 MPa y 10,3 MPa (≈1000 y 1500 psi)",
      "1,0 MPa y 2,0 MPa",
      "70 MPa y 105 MPa",
      "100 kPa y 150 kPa"
    ],
    "certa": 0,
    "exp": "Las presiones patrón son 6,9 MPa (≈70,3 kgf/cm² ≈1000 psi) a 2,54 mm y 10,3 MPa (≈105,5 kgf/cm² ≈1500 psi) a 5,08 mm."
  },
  {
    "q": "En general, ¿qué penetración rige el valor final del CBR?",
    "op": [
      "Siempre la de 5,08 mm",
      "La de 2,54 mm, en la mayoría de los casos (se adopta el mayor CBR)",
      "El promedio de ambas",
      "La de 12,7 mm"
    ],
    "certa": 1,
    "exp": "Se adopta el MAYOR entre los dos valores de CBR. Normalmente es el de 2,54 mm; si el de 5,08 mm es mayor, se repite el ensayo para confirmar."
  },
  {
    "q": "¿Cuántos golpes por capa y cuántas capas se usan en la energía MODIFICADA en el molde CBR?",
    "op": [
      "12 golpes, 3 capas",
      "26 golpes, 5 capas",
      "55 golpes, 5 capas",
      "55 golpes, 3 capas"
    ],
    "certa": 2,
    "exp": "Energía modificada: 55 golpes por capa en 5 capas. Normal = 12; intermedia = 26 (todas en 5 capas en el molde CBR)."
  },
  {
    "q": "¿Durante cuánto tiempo permanece sumergida la probeta antes de la penetración?",
    "op": [
      "24 horas",
      "48 horas",
      "4 días (96 h)",
      "7 días"
    ],
    "certa": 2,
    "exp": "La inmersión dura 4 días (96 h), simulando la condición de humedad más desfavorable en servicio, con lectura diaria de la expansión."
  },
  {
    "q": "¿Cuál es la velocidad de penetración del pistón en el ensayo?",
    "op": [
      "1,27 mm/min",
      "5,0 mm/min",
      "0,5 mm/min",
      "10 mm/min"
    ],
    "certa": 0,
    "exp": "El pistón avanza a 1,27 mm/min (equivalente a 0,05 pulg/min)."
  },
  {
    "q": "¿Qué ocurre con el CBR cuando el suelo se moldea muy por encima de la humedad óptima?",
    "op": [
      "Aumenta, pues hay más agua lubricando",
      "No cambia, pues el CBR solo depende del tipo de suelo",
      "Disminuye, pues cae la densidad y la resistencia (rama húmeda)",
      "Aumenta linealmente con la humedad"
    ],
    "certa": 2,
    "exp": "En la rama húmeda, el exceso de agua reduce la densidad seca y la resistencia; el CBR cae marcadamente y la expansión tiende a aumentar."
  },
  {
    "q": "La corrección de la concavidad de la curva carga×penetración se aplica cuando:",
    "op": [
      "La curva es una recta perfecta",
      "El inicio de la curva es cóncavo hacia arriba (acomodación inicial)",
      "El ensayo se realizó sin inmersión",
      "La carga disminuye con la penetración"
    ],
    "certa": 1,
    "exp": "Cuando el tramo inicial es cóncavo hacia arriba, se traza la tangente en el punto de inflexión y se desplaza el origen; las presiones se leen a partir del nuevo origen."
  },
  {
    "q": "Un suelo arcilloso de alta plasticidad tiende a presentar, en relación con una arena bien graduada:",
    "op": [
      "Mayor CBR y menor expansión",
      "Menor CBR y mayor expansión",
      "El mismo CBR y la misma expansión",
      "Mayor CBR y mayor expansión"
    ],
    "certa": 1,
    "exp": "Las arcillas plásticas tienen menor capacidad de soporte (CBR bajo) y mayor potencial de expansión que las arenas/gravas bien graduadas."
  },
  {
    "q": "Para refuerzo de subrasante, un criterio típico del DNIT es:",
    "op": [
      "CBR ≥ 2% y expansión ≤ 2%",
      "CBR ≥ 12% y expansión ≤ 1%",
      "CBR ≥ 80% y expansión ≤ 0,5%",
      "Cualquier CBR, siempre que la expansión sea alta"
    ],
    "certa": 1,
    "exp": "Para refuerzo de subrasante se suele exigir CBR ≥ 12% y expansión ≤ 1%. Subbase: CBR ≥ 20%; base: CBR ≥ 60–80% según el tráfico."
  }
]
  };


  function lang() { return (window.CBRi18n && window.CBRi18n.lang()) || "pt"; }
  function tr(k) { return (window.CBRi18n && window.CBRi18n.t(k)) || k; }
  function questoes() { return BANCO[lang()] || BANCO.pt; }

  var acertos = 0, respondidas = 0;
  var cont = document.getElementById("quiz");

  function render() {
    acertos = 0; respondidas = 0;
    cont.innerHTML = "";
    questoes().forEach(function (item, qi) {
      var div = document.createElement("div");
      div.className = "pergunta";
      var html = "<b>" + (qi + 1) + ". " + item.q + "</b><div class='opcoes'>";
      item.op.forEach(function (op, oi) {
        html += "<button data-q='" + qi + "' data-o='" + oi + "'>" +
          String.fromCharCode(65 + oi) + ") " + op + "</button>";
      });
      html += "</div><div class='feedback' id='fb-" + qi + "'></div>";
      div.innerHTML = html;
      cont.appendChild(div);
    });
    atualizaPlacar();
  }

  function atualizaPlacar() {
    document.getElementById("placar").textContent =
      tr("quiz_placar") + ": " + acertos + " / " + respondidas +
      "  (" + tr("quiz_de") + " " + questoes().length + " " + tr("quiz_questoes") + ")";
  }

  cont.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-q]");
    if (!b) return;
    var qi = +b.dataset.q, oi = +b.dataset.o;
    var item = questoes()[qi];
    var grupo = b.parentElement;
    if (grupo.dataset.resolvida) return;
    grupo.dataset.resolvida = "1";
    respondidas++;
    var certo = oi === item.certa;
    if (certo) acertos++;
    grupo.querySelectorAll("button").forEach(function (btn) {
      var o = +btn.dataset.o;
      btn.disabled = true;
      if (o === item.certa) btn.classList.add("certo");
      else if (o === oi) btn.classList.add("errado");
    });
    var fb = document.getElementById("fb-" + qi);
    fb.classList.add("mostra");
    fb.style.background = certo ? "#d7f0df" : "#fbdcd7";
    fb.innerHTML = (certo ? "<b>" + tr("quiz_correto") + "</b> " : "<b>" + tr("quiz_incorreto") + "</b> ") + item.exp;
    atualizaPlacar();
  });

  document.getElementById("reiniciar").addEventListener("click", function () {
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // troca de idioma recria o quiz no novo idioma
  if (window.CBRi18n) window.CBRi18n.onChange(function () { render(); });

  render();
})();
