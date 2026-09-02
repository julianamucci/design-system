# 16. Construir um tema de marca novo

Instruções completas para criar um tema a partir de um brand book. Escrito para
ser entregue inteiro a quem vai construir — inclusive a outra instância de
Claude — sem precisar ler o resto do repositório antes de começar.

---

## O que um tema é neste projeto

Um tema **reescreve tokens de cor** (e, opcionalmente, a identidade de forma).
Ele NÃO mexe em espaçamento, densidade, tipografia nem movimento: esses são
eixos separados, combináveis com qualquer tema.

```
tema        → cor + raio          (.tema-<id>)
densidade   → padding/gap/altura  (.densidade-*)
fonte       → família tipográfica (.fonte-*)
escala      → razão da escala     (.escala-*)
base-tipo   → tamanho base        (.base-tipo-*)
modo        → claro/escuro        (.dark)
```

As seis classes convivem no `<html>`. Um tema que redefinir espaçamento ou
tamanho de fonte quebra as outras cinco dimensões.

---

## Os 42 tokens obrigatórios

Todo tema declara **os 42 abaixo nos DOIS modos**.

Já foram 39, com os cinco de `--chart-*` herdando do claro — "gráfico não muda de
paleta com o modo", dizia aqui. A medição derrubou: uma cor só, servindo à página
quase branca e ao fundo quase preto, não alcança 3:1 nos dois. No tema Default as
cinco reprovavam o piso em um dos modos, e o `--chart-5` era o Ink da marca,
exatamente o fundo escuro — contraste **1.00**, série invisível.

O valor é **HSL sem a função** — `210 40% 96%`, não `hsl(210 40% 96%)`. O
sistema aplica `hsl(var(--token))` no ponto de uso, e é isso que permite
`hsl(var(--primary) / 0.1)` para as versões suaves.

### Superfícies (6)

| token | o que é |
|---|---|
| `--background` | fundo da página |
| `--foreground` | texto sobre `--background` |
| `--card` | fundo de cartão e superfície elevada |
| `--card-foreground` | texto sobre `--card` |
| `--popover` | fundo de camada flutuante (popover, menu, tooltip) |
| `--popover-foreground` | texto sobre `--popover` |

### Marca e neutros (8)

`--primary` · `--primary-foreground` · `--secondary` · `--secondary-foreground`
· `--muted` · `--muted-foreground` · `--accent` · `--accent-foreground`

`--accent` costuma espelhar `--secondary`; declare os dois mesmo assim.

### Feedback (8)

`--destructive` · `--destructive-foreground` · `--success` ·
`--success-foreground` · `--warning` · `--warning-foreground` · `--info` ·
`--info-foreground`

**Os quatro `*-foreground` de feedback valem `var(--foreground)`**, não uma cor
própria. Motivo na seção de contraste, e é regra dura.

### Formulário e foco (4)

| token | exigência |
|---|---|
| `--border` | borda decorativa |
| `--input` | borda de campo — **mínimo 3:1 contra `--background`** (WCAG 1.4.11) |
| `--input-background` | fundo do campo |
| `--ring` | anel de foco — alinhar com `--primary` |

### Gráficos (8)

`--chart-1` a `--chart-8`, **nos dois blocos**. Oito matizes distinguíveis entre
si, e a ordem não é livre: cada posição é a que mais se afasta das anteriores em
matiz OKLCH. A menor separação dentro das cinco primeiras é 38°, dentro das oito
é 20°, que é o limite da paleta — reordenar aproxima séries vizinhas.

Os graus são OKLCH, não HSL. Recalcular a partir dos números HSL declarados dá
outros valores, porque HSL não é perceptualmente uniforme.

Os três temas de hoje usam a mesma paleta de gráfico, tirada da paleta de sintaxe
do code-block — ela já nascia com variante por modo. Um tema novo **pode** ter
paleta própria: é por isso que estes tokens ficam no tema e não em `tokens.css`.
Se tiver, meça contra a página de CADA modo, com piso de 3:1 (WCAG 1.4.11).

### Sidebar (8)

`--sidebar` · `--sidebar-foreground` · `--sidebar-primary` ·
`--sidebar-primary-foreground` · `--sidebar-accent` ·
`--sidebar-accent-foreground` · `--sidebar-border` · `--sidebar-ring`

A sidebar tem paleta própria porque é uma superfície persistente que pode
divergir do corpo da página. Costuma ser `--background` levemente deslocado.

### Raio (6, opcionais)

`--radius` (base) e os cinco derivados por componente: `--radius-button`,
`--radius-input`, `--radius-alert`, `--radius-card`, `--radius-badge`.

Declare se a marca pede identidade de forma própria. Os três temas de hoje
declaram, e cada um mostra um caminho:

| tema | o que declara | identidade |
|---|---|---|
| `default` | `--radius: 0.875rem` + os cinco por componente, com `--radius-card` fora da escala | cantos generosos |
| `warm` | `--radius: 1.5rem` | cantos macios, quase cápsula no controle |
| `cold` | `--radius: 0`, `--radius-badge: 0` **e** `--radius-card: 0` | canto reto |

Sobrescrever a BASE é o que move a escala inteira, e é o caminho preferido — os
degraus continuam derivando sozinhos. Se declarar por componente, use a escala
(`var(--radius-lg)`, `var(--radius-xl)`, `var(--radius-full)`) ou uma expressão
que diga a RAZÃO do valor; nunca px solto.

**O `cold` precisa de três linhas, e as duas extras vêm do mesmo lugar:**
`--radius-badge` aponta para `--radius-full` (9999px fixo) e `--radius-xl` é o
único degrau ADITIVO da escada (`base + 4px`). Nenhum dos dois zera junto com a
base — os degraus de baixo zeram porque passam por `max(0px, …)`, os de cima
não. Um tema que se declara quadrado e zera só `--radius` fica com badge em
cápsula e cartão de 4px.

**E o `--radius-card` do `default` é o caso que ensina o resto.** O raio de
cartão da escala é `base + 4`, e esse `+4` foi desenhado para parear com inset de
**4px** — está escrito em `tokens.css`. As seções das docs pages aninham a
**16px**, e aí `Rᵢ = Rₑ − E` devolvia 2px: quadrado o bastante para parecer
defeito de renderização, redondo o bastante para não parecer decisão.

A saída não é abrir exceção na regra de aninhamento. Foi testada, e ela não
fecha: um piso do tipo `max(6px, Rₑ − E)` conserta o Default, não mexe no `warm`
e deixa o filho do `cold` MAIS REDONDO que o pai; um piso relativo ao pai faz
filho e pai empatarem. Quanto mais guarda a exceção precisa, mais ela avisa que
o mecanismo é o errado.

A saída é a proporção: o raio do cartão tem de superar o inset com folga. O
Default escreve isso como conta, não como número —
`calc(var(--spacing-4) + var(--radius-xs))`, o inset mais o menor raio que ainda
se percebe —, e o filho concêntrico cai exatamente em `--radius-xs`. Custou
afastar-se do brand book, que prescreve 18px de cartão: 18 não comporta
aninhamento a 16.

**O `cold` precisa das duas linhas, e o motivo vale para qualquer tema reto:**
`--radius-badge` aponta para `--radius-full`, que é `9999px` fixo e não deriva da
base. Zerar só a base deixaria o badge em cápsula dentro de um tema quadrado.

Zerar a base é seguro porque os três degraus de baixo passam por
`max(0px, …)` em `tokens.css`. Sem isso, `calc(0px - 6px)` daria raio negativo —
valor inválido, que derruba a declaração em silêncio nos 86 lugares que os leem.

**Cor é diferente de raio, e a assimetria é proposital:** os 42 tokens de cor
NÃO existem em `tokens.css`. Cada tema declara os 42, e o Default é um tema como
os outros — `cssClass: 'tema-default'`, não string vazia. A consequência prática
é que **a classe `tema-*` no `<html>` é obrigatória**: sem ela não há cor, a
página abre em preto sobre branco, e nem build nem type-check veem. Quem aplica
dentro do repositório é `applyTheme()`, o `preview-head.html` de cada stack e o
`<html>` do sandbox, guardados pela regra `tema_ausente_no_ponto_de_entrada`.
Quem consumir o pacote fora daqui aplica por conta.

---

## As regras de contraste, que não são negociáveis

O projeto tem um portão automático que mede a paleta nos três temas × dois
modos. Um tema que não passe nele não entra.

1. **Texto normal: 4.5:1** sobre a superfície onde ele de fato aparece.
2. **`--input`: 3:1** contra `--background`. É borda de controle, não
   decoração.
3. **Cor semântica pinta FUNDO SUAVE, nunca superfície cheia.** O sistema
   compõe `hsl(var(--destructive) / 0.1)` e escreve o texto por cima em
   `--foreground`. Por isso os `*-foreground` de feedback são
   `var(--foreground)`: uma cor semântica sobre fundo suave raramente alcança
   os 4.5:1 que texto corrido exige, e o contraste não pode depender de qual
   variante a pessoa escolheu.
4. **Ícone e título podem carregar a cor semântica** (elementos curtos, limiar
   de 3:1). Descrição e texto corrido, não.
5. **O modo escuro não é o claro invertido.** Cor de marca costuma precisar
   subir luminosidade e baixar saturação para não vibrar sobre fundo escuro.

---

## Onde o tema precisa ser registrado

São **21 arquivos** — 20 existentes mais o do tema. Faltar um deixa o tema
invisível na toolbar, com o nome errado na página de cores, sem reverter ao
trocar de volta, ou com a página de fundamentos afirmando que os temas são três.

**Nenhum `grep` sozinho encontra os 20**, e vale saber por quê antes de confiar
num. O tema é citado de três formas, e cada busca vê só uma parte:

```bash
git grep -l "tema-warm"       # pela classe  — 21 arquivos, 4 deles não são registro
git grep -lE "['\"]warm['\"]" # pelo ID entre aspas — 15 arquivos
```

O `subdomainThemeMap` só aparece na segunda. E a página de fundamentos
`sistema-de-temas` **não aparece em nenhuma das duas**: lá o tema é citado em
prosa (`default · warm · cold` e `<code>warm</code>`), sem aspas e sem a classe.
Foi exatamente esse arquivo que a primeira versão desta guideline perdeu — e é
o pior de perder, porque texto corrido não tem portão que o cobre. Confira as
duas buscas **e** abra a página de fundamentos.

Cinco arquivos aparecem nas buscas e NÃO são registro: `themes/default.css`
e `themes/densities.css` (comentários sobre cascade e combinação),
`angular/.../SonnerDocs.ts` (um snippet de exemplo),
`content/foundations/densidades/translations.json` (um exemplo de classe em
prosa) e `vue/src/App.vue` (o sandbox, que tem seletor próprio).

### Conteúdo compartilhado (3)

1. `docs/shared/themes/<id>.css` — **o arquivo do tema**. Dois blocos:
   `.tema-<id>` e `.dark.tema-<id>`.
2. `docs/shared/themes/index.css` — acrescentar o `@import`.
3. `docs/shared/themes/theme-config.ts` — acrescentar em três lugares: o tipo
   `ThemeId`, o array `themes[]` (com `id`, `label`, `description`, `cssClass`)
   e o `subdomainThemeMap`.

### Por stack — react, vue, svelte, vanilla, angular (2 × 5)

4. `.storybook/preview.ts` — **dois lugares no mesmo arquivo**: o array de
   classes que a função `applyClasses` limpa antes de aplicar a nova, e o
   `items` do `globalTypes.brand` (a toolbar).
5. `.storybook/preview-head.html` — a constante `BRAND_CLASSES`.

### Páginas de fundamentos (1 + 2)

6. `src/components/docs/ThemeColorsDocs.*` nas cinco stacks — a lista de temas
   que a página varre, e a lista de detecção de classe.
7. `docs/shared/content/theme-colors/translations.json` — o rótulo em
   `brand.themes.<id>`, nas três línguas (pt-BR, en, es).
8. `docs/shared/content/foundations/sistema-de-temas/translations.json` — nas
   três línguas: `toolbar.items.brand.values`, que ENUMERA os valores da
   toolbar (`default · warm · cold`), e `subdomain.items.map`, que enumera quem
   aponta para tema. Os dois são texto corrido que vira mentira se o tema novo
   não entrar — e nenhuma regra de auditoria os alcança, porque é prosa.

### Verificação (1)

9. `docs/shared/testing/cor.ts` — a constante `TEMAS`. **Este é o mais
   importante**: toda sonda de contraste do repositório itera essa lista, então
   acrescentar o tema ali faz seis stories de portão passarem a medi-lo
   automaticamente, nos dois modos.

### Opcional (1)

10. `nortear-design-system-vue/src/App.vue` — o sandbox do Vue tem seletor de
    tema próprio. Não é interface de produto (o Storybook é), então só mexa se
    quiser o tema disponível ali também.

---

## Passo a passo

### 1. Extrair do brand book

Levante, com os valores exatos:

- cor primária, e a secundária/acento se houver;
- neutros: qual a temperatura do cinza (matiz e saturação do tint);
- cores de sistema, se a marca define erro/sucesso/aviso/informação;
- se a marca tem identidade de forma (cantos vivos, muito arredondados).

Se o brand book não define alguma família, **derive por deslocamento de matiz a
partir da primária**, mantendo o contraste — foi o que `warm` e `cold` fizeram —
e escreva no comentário do arquivo que aquilo é derivado, não prescrito.

### 2. Escrever o arquivo

Copie `docs/shared/themes/warm.css` como molde. Ele tem a estrutura certa: um
comentário de cabeçalho declarando a ESTRATÉGIA do tema (não a lista de cores —
essa está logo abaixo), o bloco claro comentado por grupo, e o bloco escuro.

O comentário de cabeçalho é obrigatório e diz quatro coisas: qual o tint dos
neutros (matiz e faixa de saturação), o que acontece com as cores de feedback,
o que acontece com os gráficos, e o que é herdado em vez de declarado.

### 3. Registrar nos doze pontos

Lista acima. Depois de registrar, `grep -rn "tema-<id>"` deve devolver os mesmos
arquivos que `grep -rn "tema-warm"`.

### 4. Verificar

```bash
# 1. Portão da paleta — mede os swatches nos temas × modos
cd nortear-design-system-vanilla && npx vitest run paleta-de-tema

# 2. As seis stories que iteram TEMAS (contraste por tema e modo)
cd nortear-design-system-<stack> && npx vitest run form-states input-otp-states

# 3. Token documentado que não existe, e token órfão
node scripts/audit.mjs --all --json

# 4. As cinco suítes completas — o tema entra no cascade de TODA story
cd nortear-design-system-<stack> && npx vitest run
```

O portão da paleta cobra duas coisas por conta própria: que todo token
documentado exista de verdade (ele mede o swatch por dois caminhos
independentes — o rótulo escrito por `getComputedStyle` e o chip pintado por
herança), e que todo par consumido alcance 4.5:1.

### 5. Fotografar

`npm run chromatic` na stack que você tocou por último. O tema novo muda o
cascade de todas as stories, então a foto de regressão é o que separa "mudou o
tema" de "mudou o tema e quebrou dois componentes".

---

## Erros que este projeto já cometeu, para não repetir

- **Declarar cor com a função**: `--primary: hsl(210 40% 50%)` quebra
  `hsl(var(--primary) / 0.1)` em todo lugar que usa versão suave. É `210 40% 50%`.
- **Achar que a duplicação protege a troca de tema**: durante meses esta lista
  dizia que sem re-declarar em `.tema-default` a toolbar podia não reverter,
  porque "o navegador mantém valor computado depois de a classe sair". Isso não
  acontece — remover classe recomputa a cascata. O defeito real era o renderer
  não REMOVER a classe ao voltar para o `defaultValue` (ver a regra do listener
  de canal no `CLAUDE.md`), e o contorno sobreviveu ao conserto. Custou o que
  duplicação sempre custa: os dois arquivos divergiram, e por um momento `.dark`
  e `.dark.tema-default` deram cores diferentes para o mesmo tema. Hoje cada
  tema tem UM lugar e o Default não é especial.
- **Auto-referência em token**: `--ring-offset-color: hsl(var(--ring-offset-color))`
  sobreviveu meses porque o `.dark` redeclarava e quebrava o ciclo — no claro o
  swatch ficava sem cor e ninguém via. O portão da paleta existe por causa disso.
- **Dar cor própria aos `*-foreground` de feedback**: rende 3.09:1 numa tela que
  o sistema não desenha. O valor é `var(--foreground)`.
- **Registrar em quatro stacks**: são **cinco**. `STACKS` em `scripts/audit.mjs`
  é a lista autoritativa.

---

## O que entregar

- `docs/shared/themes/<id>.css`
- os onze registros
- uma linha no `FIXES-NEEDED.md` **só** se alguma cor do brand book não
  alcançou o contraste exigido e você precisou desviar dela — com o valor
  pedido, o valor usado e a razão medida.
