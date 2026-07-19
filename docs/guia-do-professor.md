# Guia do professor

Este material foi pensado para apoiar aulas de **mecânica dos solos**, **pavimentação** e
**laboratório de geotecnia**. Abaixo, sugestões de uso, roteiros e atividades.

## Como projetar em aula

1. Abra o site (duplo clique em `index.html` ou `python -m http.server 8000`).
2. Para demonstração, use o **Laboratório virtual → modo Demonstração**: o ensaio roda sozinho,
   ideal para projetar e narrar cada etapa.
3. Para os alunos praticarem, peça que usem o **modo Guiado**, onde eles comandam a prensa e
   registram as leituras.

## Sequência didática sugerida (2–3 aulas)

### Aula 1 — Teoria e procedimento
- Página **Teoria**: discuta o conceito de razão de suporte, as pressões-padrão e a curva de
  compactação. Destaque *por que* o CBR depende da energia e da umidade.
- Página **Procedimento**: percorra a aparelhagem e a sequência do ensaio. Relacione com o
  laboratório físico da instituição, se houver.

### Aula 2 — Laboratório virtual
- **Demonstração** (professor): rode um ensaio completo com areia argilosa, energia intermediária,
  na umidade ótima. Comente cada fase (moldagem em 5 camadas, imersão de 4 dias, penetração).
- **Guiado** (alunos): cada aluno/dupla executa um ensaio, lendo o mostrador e registrando a carga.
  Peça que anotem o CBR final e a classificação.

### Aula 3 — Simulador e análise
- Use o **Simulador** para responder perguntas de investigação (abaixo). Os alunos exportam o CSV
  e podem plotar/analisar em planilha.

## Atividades e perguntas de investigação

Use o **Simulador** (`simulador.html`) para responder:

1. **Efeito da energia.** Fixe um solo e a umidade ótima. Anote o CBR nas três energias
   (normal, intermediária, modificada). Quanto o CBR aumenta da normal para a modificada?
2. **Efeito da umidade.** Fixe solo e energia. Varie a umidade de moldagem em torno da ótima.
   Em que ponto o CBR é máximo? O que acontece no ramo úmido? E com a **expansão**?
3. **Efeito do solo.** Na mesma energia e umidade ótima, ordene os 7 solos por CBR. Relacione com
   a plasticidade e a granulometria.
4. **Critério de projeto.** Qual(is) solo(s) atende(m) ao critério de **reforço de subleito**
   (CBR ≥ 12%, expansão ≤ 1%)? E de **sub-base** (CBR ≥ 20%)?
5. **Correlação.** Estime o módulo de resiliência (M_R ≈ 10 × CBR) para dois solos e comente.

### Roteiro do laboratório virtual (folha do aluno)

| Etapa | O que registrar |
|-------|-----------------|
| Preparação | Solo, energia, umidade de moldagem |
| Compactação | γ_d de moldagem e grau de compactação (%) |
| Imersão | Expansão final (%) — aceitável? (≤ 1% ou ≤ 2%?) |
| Penetração | Carga a 2,54 mm e a 5,08 mm (kN) |
| Cálculo | CBR a 2,54 mm, a 5,08 mm, CBR final e classificação |

## Conexão com o ensaio real

O laboratório virtual **não substitui** a prática de bancada. Use-o para:
- **preparar** os alunos antes de irem ao laboratório físico (reduz erros e tempo);
- **revisar** o procedimento depois da prática;
- **explorar cenários** inviáveis de repetir no laboratório (muitos solos, muitas umidades).

## Avaliação

- O **Quiz** (`quiz.html`) cobre os pontos centrais e dá feedback imediato — use como
  autoavaliação ou diagnóstico rápido em aula.
- Peça um **relatório** a partir do CSV exportado do simulador, comparando dois ou três solos.

## Personalização

Todo o conteúdo é HTML/JS simples. Para adaptar:
- **Novos solos:** edite o objeto `SOLOS` em `assets/js/cbr-core.js`.
- **Novas energias:** edite `ENERGIAS` no mesmo arquivo.
- **Novas questões:** edite o array `QUESTOES` em `assets/js/quiz.js`.
- **Textos e normas:** edite diretamente os arquivos `.html`.

> Lembre os alunos: os números são **didáticos e sintéticos**. O objetivo é entender **relações de
> causa e efeito**, não obter valores de projeto.
