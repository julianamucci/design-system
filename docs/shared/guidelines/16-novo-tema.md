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

## Os 39 tokens obrigatórios

Todo tema declara **os 39 abaixo no modo claro** e **34 deles no escuro** (os
cinco de `--chart-*` herdam do claro, e é assim de propósito: gráfico não muda
de paleta com o modo).

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

### Gráficos (5)

`--chart-1` a `--chart-5`. Cinco matizes distinguíveis entre si, na paleta da
marca. Só no bloco claro.

### Sidebar (8)

`--sidebar` · `--sidebar-foreground` · `--sidebar-primary` ·
`--sidebar-primary-foreground` · `--sidebar-accent` ·
`--sidebar-accent-foreground` · `--sidebar-border` · `--sidebar-ring`

A sidebar tem paleta própria porque é uma superfície persistente que pode
divergir do corpo da página. Costuma ser `--background` levemente deslocado.

### Raio (6, opcionais)

`--radius` (base) e os cinco derivados por componente: `--radius-button`,
`--radius-input`, `--radius-alert`, `--radius-card`, `--radius-badge`.

Só declare se a marca pede identidade de forma diferente. `warm` e `cold` não
declaram — herdam de `tokens.css`. O `default` declara porque é a referência.
Se declarar, use a escala derivada (`var(--radius-lg)`, `var(--radius-xl)`,
`var(--radius-full)`), nunca um valor em px solto.

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

São **20 arquivos** — 19 existentes mais o do tema. Faltar um deixa o tema
invisível na toolbar, ou com o nome errado na página de cores, ou sem reverter
ao trocar de volta.

Conferência rápida no fim: `git grep -l "tema-<id>"` tem de devolver a mesma
lista de `git grep -l "tema-warm"`, MENOS quatro arquivos que só citam o `warm`
de passagem e não são registro — `themes/default.css` e `themes/densities.css`
(comentários sobre cascade e combinação), `angular/.../SonnerDocs.ts` (um
snippet de exemplo) e `vue/src/App.vue` (o sandbox, que tem seletor próprio).

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

### Página de fundamentos (1 + 1)

6. `src/components/docs/ThemeColorsDocs.*` nas cinco stacks — a lista de temas
   que a página varre, e a lista de detecção de classe.
7. `docs/shared/content/theme-colors/translations.json` — o rótulo em
   `brand.themes.<id>`, nas três línguas (pt-BR, en, es).

### Verificação (1)

8. `docs/shared/testing/cor.ts` — a constante `TEMAS`. **Este é o mais
   importante**: toda sonda de contraste do repositório itera essa lista, então
   acrescentar o tema ali faz seis stories de portão passarem a medi-lo
   automaticamente, nos dois modos.

### Opcional (1)

9. `nortear-design-system-vue/src/App.vue` — o sandbox do Vue tem seletor de
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
cd nortear-design-system-<stack> && npx vitest run form-estados input-otp-estados

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
- **Esquecer o bloco `.tema-<id>` de re-declaração**: sem ele, voltar ao tema
  pela toolbar pode não reverter — o navegador mantém valor computado depois de
  a classe sair. É por isso que existe `.tema-default` mesmo o `:root` já tendo
  os mesmos valores.
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
