# Token Mapping — custom properties CSS → variáveis do Figma

Referência do comando `/figma-sync-component`. Converte as `var(--*)` do CSS
compartilhado (`docs/shared/styles/nds/*.css`) nos caminhos exatos das variáveis.

Os caminhos abaixo saem do export em `docs/shared/tokens/figma/<Colecao>/<modo>.json` —
é o mesmo material que alimenta as coleções do Figma. Ao mudar um token no
projeto, este mapa acompanha o export, não o contrário.

---

## Arquivo destino

| Arquivo | File key |
|---|---|
| Nortear-DS | `XXAmIFVBKHClzx7YdUSkEb` |

A key da **biblioteca de tokens** não está registrada aqui: descubra-a pelas
coleções (ver Etapa 2 da skill) e anote nesta tabela na primeira execução
bem-sucedida.

## Coleções e modos

| Coleção | Modos | Export |
|---|---|---|
| `Cor` | `default-light`, `default-dark`, `cold-light`, `cold-dark`, `warm-light`, `warm-dark` | `figma/Cor/` |
| `Dimensao` | `default`, `confortavel`, `condensado` | `figma/Dimensao/` |
| `Raio` | `default` | `figma/Raio/` |
| `Tipografia` | `major-third`, `golden`, `perfect-fifth`, … | `figma/Tipografia/` |
| `Movimento` | `default` | `figma/Movimento/` |
| `Fonte` | `default`, `lexend`, `pt-serif`, `lxgw-wenkai` | `figma/Fonte/` |
| `Elevacao` | `light`, `dark` | `figma/Elevacao/` |
| `Camada` | `default` | `figma/Camada/` |

As regras `.dark .nds-*` do CSS **não viram variante**: são o modo escuro da
coleção `Cor`. Vincular a variável já cobre os dois.

---

## Cor — `Cor`

| CSS | Variável |
|---|---|
| `--background` · `--foreground` | `superficie/background` · `superficie/foreground` |
| `--card` · `--card-foreground` | `superficie/card` · `superficie/card-foreground` |
| `--popover` · `--popover-foreground` | `superficie/popover` · `superficie/popover-foreground` |
| `--primary` · `--primary-foreground` | `marca/primary` · `marca/primary-foreground` |
| `--secondary` · `--secondary-foreground` | `marca/secondary` · `marca/secondary-foreground` |
| `--muted` · `--muted-foreground` | `marca/muted` · `marca/muted-foreground` |
| `--accent` · `--accent-foreground` | `marca/accent` · `marca/accent-foreground` |
| `--destructive` · `--destructive-foreground` | `feedback/destructive` · `feedback/destructive-foreground` |
| `--success` · `--warning` · `--info` | `feedback/success` · `feedback/warning` · `feedback/info` |
| `--border` · `--input` · `--input-background` | `estrutura/border` · `estrutura/input` · `estrutura/input-background` |
| `--ring` · `--ring-offset-color` | `estrutura/ring` · `estrutura/ring-offset-color` |
| `--chart-1`…`--chart-5` | `grafico/chart-1`…`chart-5` |
| `--sidebar*` | `sidebar/sidebar*` |
| `--code-token-*` | `codigo/code-token-*` |

**Alfa.** `hsl(var(--primary) / 0.9)` é uma cor com opacidade, não outro token.
Vincule `marca/primary` e ponha `0.9` no `opacity` do paint — variável do Figma
não carrega alfa por uso. Vale para os hovers do button (`/0.9`, `/0.8`), para os
fundos soft das variantes semânticas (`/0.1`, `/0.15`) e para as bordas (`/0.3`).

## Espaçamento e dimensão — `Dimensao`

| CSS | Variável |
|---|---|
| `--spacing-0` … `--spacing-24` | `espacamento/spacing-<n>` |
| `--spacing-px` · `--spacing-0-5` | `espacamento/spacing-px` · `espacamento/spacing-0-5` |
| `--spacing-btn-x` · `-sm` · `-lg` | `espacamento/spacing-btn-x*` |
| `--height-xs` … `--height-xl` | `altura/height-*` |
| `--size-xs` … | `tamanho/size-*` |

**Altura fixa só onde o CSS declara.** Componente com texto não tem `height` — a
altura é padding-block + line-height (WCAG 1.4.4, Resize Text 200%). Só os
icon-only declaram width/height, e em `rem`: 1.5 (24px), 2 (32px), 2.25 (36px),
2.5 (40px).

## Raio — `Raio`

| CSS | Variável |
|---|---|
| `--radius-button` · `--radius-input` · `--radius-alert` · `--radius-card` · `--radius-badge` | `radius-button` · `radius-input` · `radius-alert` · `radius-card` · `radius-badge` |
| `--radius-xs` … `--radius-xl` · `--radius-full` | `radius-xs` … `radius-xl` · `radius-full` |

Use sempre o alias do componente (`radius-button`), não o valor da escala que ele
aponta — é o alias que muda quando o tema muda.

## Movimento — `Movimento`

| CSS | Variável |
|---|---|
| `--duration-instant` … `--duration-stately` | `duracao/duration-*` |
| `--ease-linear` · `--ease-standard` · `--ease-size` · `--ease-spring` · `--ease-emphasis` · `--ease-entrance` · `--ease-exit` | `curva/ease-*` |
| `--motion-offset-xs` … `-lg` | `deslocamento/motion-offset-*` |

As curvas são **string** (`cubic-bezier(...)`): colar no custom easing da
interação de protótipo. As durações são número em ms.

## Tipografia — `Tipografia` e `Fonte`

| CSS | Variável |
|---|---|
| `--font-weight-regular` … `--font-weight-extra-bold` | `peso/font-weight-*` |
| `--line-height-tight` … `--line-height-loose` | `entrelinha/line-height-*` |
| `--letter-spacing-tight` · `-normal` · `-wide` | `espacamento-letra/letter-spacing-*` |
| `--text-label` · `--text-p` · `--text-h1`…`h4` | `tamanho/text-*` |
| `--font-family` | `Fonte · font-family-active` |

**Font-size de componente costuma ser literal.** O button, por exemplo, declara
`0.75rem` / `0.875rem` / `1rem` direto — a escala `Tipografia` governa texto de
conteúdo, não o corpo dos controles. Não force um token onde o CSS não usa um:
transcreva o rem em px (1rem = 16px).

## Elevação e camada

| CSS | Variável |
|---|---|
| `--elevation-sm` … `--elevation-xl` | `Elevacao · elevation-*` |
| `--z-dropdown` … `--z-tooltip` | `Camada · z-*` |

Sombra escrita direto no CSS (ex.: `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`)
não tem token — reproduza os valores como effect e registre na `description` que
é literal.

---

## Nomes de camada

Sempre o `data-slot` do Vanilla, sem exceção:

| `data-slot` | Camada |
|---|---|
| `button` · `alert` · `card` · `input` | `button` · `alert` · `card` · `input` |
| `alert-title` · `alert-description` · `alert-action` · `alert-dismiss` | mesmo nome |
| `card-header` · `card-content` · `card-footer` | mesmo nome |

Sem `data-slot` correspondente: `label` para o texto, `icon` para o SVG,
`indicator` para bolinha de estado, `thumb` para switch/slider.

---

## Estrutura do component set

```
Button (COMPONENT_SET)
├── variant=default, size=default, state=default
│   └── button
│       ├── icon (16×16)
│       └── label (text)
├── variant=default, size=default, state=hover
└── variant=outline, size=lg, state=default, disabled=true
```

- Nome do set em PascalCase; nome de variante em `prop=valor` lowercase.
- Ordem das props: `variant`, `size`, `state`, depois os booleanos.
- Booleanos: `disabled`, `pressed`, `invalid` — um por atributo ARIA do CSS.

---

## Código auxiliar

```js
async function importarTokens() {
  const alvo = new Set(['Cor','Dimensao','Raio','Tipografia','Movimento','Fonte','Elevacao','Camada']);
  const varMap = {};
  const collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
  for (const coll of collections.filter(c => alvo.has(c.name))) {
    for (const lv of await figma.teamLibrary.getVariablesInLibraryCollectionAsync(coll.key)) {
      try { varMap[`${coll.name}/${lv.name}`] = await figma.variables.importVariableByKeyAsync(lv.key); }
      catch (_) {}
    }
  }
  return varMap;
}

// alfa é do paint, não da variável
function paintDeToken(varMap, caminho, alfa = 1) {
  const v = varMap[caminho];
  if (!v) throw new Error(`variável ausente: ${caminho}`);
  const base = { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: alfa };
  return figma.variables.setBoundVariableForPaint(base, 'color', v);
}
```

`paintDeToken` lança quando a variável não existe — de propósito. Cair para hex
solto produziria um component set que não acompanha a troca de tema, e o defeito
só apareceria quando alguém trocasse o modo.
