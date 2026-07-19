# Base teórica e modelo de cálculo

Este documento detalha a fundamentação do ensaio e **como o modelo paramétrico** do site
(`assets/js/cbr-core.js`) reproduz seu comportamento. O modelo é **didático e sintético**.

## 1. Definição do CBR / ISC

O Índice de Suporte Califórnia é a razão, em porcentagem, entre a pressão necessária para fazer um
pistão-padrão penetrar o solo e a pressão para a mesma penetração em uma **brita-padrão de
referência**:

```
CBR (%) = (pressão no solo / pressão-padrão) × 100
```

As pressões-padrão (resistência da brita de referência):

| Penetração | Pressão-padrão |
|-----------:|:---------------|
| 2,54 mm (0,1") | 6,9 MPa ≈ 70,3 kgf/cm² ≈ 1000 psi |
| 5,08 mm (0,2") | 10,3 MPa ≈ 105,5 kgf/cm² ≈ 1500 psi |

Calcula-se o CBR nas duas penetrações e adota-se o **maior**. Em regra, o de 2,54 mm governa.

## 2. Compactação

### Curva de compactação
A massa específica seca em função da umidade é modelada por uma parábola centrada na umidade ótima:

```
γd(w) = γd,máx · [1 − k·(w − w_ót)²]
```

O fator `k` controla a abertura da curva — solos plásticos têm curva mais aberta (no código,
`k = 0,006 + 0,010·(1 − plasticidade)`).

### Energias de compactação
As três energias normatizadas (molde CBR, 5 camadas) são representadas por fatores sobre γd,máx,
umidade ótima e CBR:

| Energia | Golpes/camada | Fator γd | Fator w_ót | Fator CBR |
|---------|:-------------:|:--------:|:----------:|:---------:|
| Normal | 12 | 0,92 | 1,18 | 0,33 |
| Intermediária | 26 | 0,96 | 1,08 | 0,60 |
| Modificada | 55 | 1,00 | 1,00 | 1,00 |

Interpretação: mais energia → maior γd,máx, **menor** umidade ótima e **maior** CBR.

## 3. Efeito da umidade sobre o CBR

O CBR tem pico ligeiramente no ramo seco e cai fortemente no ramo úmido (embebição). No modelo:

```
f_umidade(w) = exp(−k'·(w − w_ót + 1)²)
```

com `k' = 0,010` no ramo seco e `0,028` no ramo úmido — a penalização é ~3× maior quando há excesso
de água, refletindo a perda de resistência por saturação.

O CBR base ainda é multiplicado pelo **grau de compactação** elevado a 2,2 (`GC^2.2`), penalizando
moldagens pouco densas.

## 4. Curva carga × penetração

A curva é modelada por uma função **hiperbólica** ajustada para reproduzir exatamente as pressões a
2,54 e 5,08 mm:

```
p(δ) = a·δ / (1 + b·δ)
```

Os coeficientes `a` e `b` são resolvidos a partir de `p(2,54)` e `p(5,08)`. Isso garante que o CBR
lido no gráfico coincida com o CBR calculado. A força no pistão vem de `F = p · A`, com área do
pistão `A = 19,35 cm²` (3 pol²).

## 5. Expansão

A expansão (inchamento na imersão) cresce com a plasticidade e a umidade e cai com a densidade:

```
expansão = exp_ref · (1 + 0,06·máx(0, w − w_ót)) · GC^(−1,5)
```

Solos argilosos plásticos moldados no ramo úmido e pouco densos incham mais — a pior combinação.

## 6. Classificação

| CBR (%) | Classe | Emprego |
|--------:|--------|---------|
| < 2 | Péssimo | Substituir/estabilizar |
| 2–5 | Ruim | Subleito fraco |
| 5–12 | Regular | Subleito |
| 12–20 | Bom | Reforço de subleito |
| 20–60 | Muito bom | Sub-base |
| > 60 | Excelente | Base |

## 7. Correlações

- **Módulo de resiliência:** M_R (MPa) ≈ 10 × CBR, para CBR ≤ 20% (Heukelom & Klomp).

## Limitações do modelo

- Os valores são **sintéticos** e calibrados para tendências, não para reproduzir um solo específico.
- Não modela granulometria detalhada, sucção, história de tensões nem estrutura do solo.
- **Não** deve ser usado para projeto. Para projeto, ensaie o material real conforme a norma
  aplicável (DNIT 172/2016-ME, ABNT NBR 9895, ASTM D1883).

## Referências

Ver [`../referencias.html`](../referencias.html) para normas e bibliografia completas.
