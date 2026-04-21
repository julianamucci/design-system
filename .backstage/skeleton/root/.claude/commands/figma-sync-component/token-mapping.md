# Token Mapping — Tailwind CSS → Vue Tokens (Figma Variables)

Referência para o comando `/figma-sync-component`.  
Converta as classes do `cva` nos nomes exatos das variáveis da coleção **Vue library** da biblioteca **Vue Tokens**.

---

## Arquivo Figma de destino

| Arquivo              | File Key                  |
|----------------------|---------------------------|
| Vue-components       | `4LdwZd2uksGto7PIiGsz0A`  |
| Vue Tokens (library) | `wbsQJnV1k3XjfVZTv8xjQZ`  |

Nome da biblioteca no teamLibrary: **`"Vue Tokens"`**  
Nome da coleção: **`"Vue library"`** (key: `5c05b731cd13f38cb88a856c02480c4713065269`)

---

## Mapeamento de cores (light mode)

| Classe Tailwind                    | Variável Figma                          | Hex fallback |
|------------------------------------|-----------------------------------------|--------------|
| `bg-primary`                       | `light/color/primary`                   | `#272729`    |
| `text-primary-foreground`          | `light/color/primaryForeground`         | `#FAFAFA`    |
| `bg-secondary`                     | `light/color/secondary`                 | `#F5F5F5`    |
| `text-secondary-foreground`        | `light/color/secondaryForeground`       | `#272729`    |
| `bg-destructive`                   | `light/color/destructive`               | `#EF4444`    |
| `text-destructive-foreground`      | `light/color/destructiveForeground`     | `#FAFAFA`    |
| `bg-background`                    | `light/color/background`                | `#FFFFFF`    |
| `text-foreground`                  | `light/color/foreground`                | `#171717`    |
| `bg-muted`                         | `light/color/muted`                     | `#F5F5F5`    |
| `text-muted-foreground`            | `light/color/mutedForeground`           | `#737373`    |
| `bg-accent`                        | `light/color/accent`                    | `#F5F5F5`    |
| `text-accent-foreground`           | `light/color/accentForeground`          | `#272729`    |
| `bg-success` / `text-success`      | `light/color/success`                   | `#22C55E`    |
| `text-success-foreground`          | `light/color/successForeground`         | `#FFFFFF`    |
| `bg-warning` / `text-warning`      | `light/color/warning`                   | `#FACCF3`    |
| `text-warning-foreground`          | `light/color/warningForeground`         | `#0A0A0A`    |
| `bg-info` / `text-info`            | `light/color/info`                      | `#3B82F6`    |
| `text-info-foreground`             | `light/color/infoForeground`            | `#FFFFFF`    |
| `border` / `border-border`         | `light/color/border`                    | `#E5E5E5`    |
| `border-input`                     | `light/color/input`                     | `#E5E5E5`    |
| `bg-input`                         | `light/color/inputBackground`           | `#FFFFFF`    |
| `ring` / `border-ring`             | `light/color/ring`                      | `#A3A3A3`    |
| `text-primary` (link)              | `light/color/primary`                   | `#272729`    |
| `text-white`                       | *(sem variável)* — hex direto           | `#FFFFFF`    |

### Sidebar
| Classe                             | Variável Figma                          | Hex       |
|------------------------------------|----------------------------------------|-----------|
| `bg-sidebar`                       | `light/color/sidebar/background`        | `#FAFAFA` |
| `text-sidebar-foreground`          | `light/color/sidebar/foreground`        | `#171717` |
| `bg-sidebar-primary`               | `light/color/sidebar/primary`           | `#272729` |
| `text-sidebar-primary-foreground`  | `light/color/sidebar/primaryForeground` | `#FAFAFA` |
| `bg-sidebar-accent`                | `light/color/sidebar/accent`            | `#F5F5F5` |
| `text-sidebar-accent-foreground`   | `light/color/sidebar/accentForeground`  | `#272729` |
| `border-sidebar-border`            | `light/color/sidebar/border`            | `#E5E5E5` |

---

## Mapeamento de espaçamento — Tailwind → px (base 4px)

| Classe          | px   | Classe          | px   |
|-----------------|------|-----------------|------|
| `p-0` / `gap-0` | 0    | `p-4` / `gap-4` | 16   |
| `p-0.5`         | 2    | `p-5`           | 20   |
| `p-1`           | 4    | `p-6`           | 24   |
| `p-1.5`         | 6    | `p-8`           | 32   |
| `p-2`           | 8    | `p-10`          | 40   |
| `p-2.5`         | 10   | `p-12`          | 48   |
| `p-3`           | 12   | `gap-1.5`       | 6    |
| `p-3.5`         | 14   | `gap-2`         | 8    |
| `px-N` / `py-N` | N×4  | `gap-N`         | N×4  |

---

## Mapeamento de tamanho — altura fixa (h-N)

| Classe | px | Uso típico           |
|--------|-----|----------------------|
| `h-8`  | 32  | size=sm, icon-sm     |
| `h-9`  | 36  | size=default, icon   |
| `h-10` | 40  | size=lg, icon-lg     |
| `h-5`  | 20  | tamanho menor (badge)|
| `h-4`  | 16  | ícone SVG inline     |

---

## Mapeamento de border-radius

| Classe           | px / valor Figma |
|------------------|-----------------|
| `rounded-sm`     | 4               |
| `rounded-md`     | 6               |
| `rounded-lg`     | 8               |
| `rounded-xl`     | 12              |
| `rounded-2xl`    | 16              |
| `rounded-full`   | 9999 (pill)     |

---

## Mapeamento de tipografia

| Classe        | Figma            | valor    |
|---------------|------------------|---------|
| `text-xs`     | fontSize         | 12      |
| `text-sm`     | fontSize         | 14      |
| `text-base`   | fontSize         | 16      |
| `text-lg`     | fontSize         | 18      |
| `font-medium` | fontName.style   | Medium  |
| `font-semibold`| fontName.style  | Semi Bold |
| `font-bold`   | fontName.style   | Bold    |
| `leading-none`| lineHeight       | { unit: 'PIXELS', value: fontSize } |
| `leading-tight`| lineHeight      | { unit: 'PERCENT', value: 120 } |
| `tracking-wide`| letterSpacing   | { unit: 'PERCENT', value: 5 } |

---

## Convenções de nomes de camadas

Os nomes de camadas Figma devem ser **idênticos** ao atributo `data-slot` ou ao nome do elemento no template Vue:

| Template Vue                        | Nome da camada Figma  |
|-------------------------------------|-----------------------|
| `data-slot="button"`                | `button`              |
| `data-slot="badge"`                 | `badge`               |
| `data-slot="input"`                 | `input`               |
| `data-slot="label"`                 | `label`               |
| `data-slot="card"`                  | `card`                |
| `data-slot="card-header"`           | `card-header`         |
| `data-slot="card-content"`          | `card-content`        |
| `data-slot="card-footer"`           | `card-footer`         |
| `data-slot="alert"`                 | `alert`               |
| `data-slot="avatar"`                | `avatar`              |
| `data-slot="avatar-image"`          | `avatar-image`        |
| `data-slot="avatar-fallback"`       | `avatar-fallback`     |
| Texto interno (`<slot />`)          | `label`               |
| Ícone SVG interno                   | `icon`                |
| Indicador / bolinha de estado       | `indicator`           |
| Thumb (switch, slider)              | `thumb`               |

---

## Estrutura do component set — boas práticas

```
ComponentName (COMPONENT_SET)
├── variant=default, size=sm
│   └── [data-slot] (frame/component raiz)
│       ├── icon (frame 16×16)
│       └── label (text)
├── variant=default, size=default
│   └── ...
└── variant=outline, size=lg, disabled=true
    └── ...
```

- **Nome do component set**: PascalCase (`Button`, `Badge`, `Input`, `Card`)
- **Nome das variantes**: sempre `prop=valor` lowercase com vírgula+espaço
- **Ordem das props** na variante: `variant=X, size=Y, state=Z`
- **Booleanos**: `disabled=false` / `disabled=true`
- **Estado hover**: não modelar como variante — usar Change to no Figma manualmente

---

## Código auxiliar — importar variáveis (copiar em qualquer script)

```js
async function importTokens() {
  const libVarMap = {};
  try {
    const collections = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
    const coll = collections.find(c => c.libraryName === "Vue Tokens");
    if (!coll) { console.warn("Biblioteca Vue Tokens não encontrada"); return libVarMap; }
    const libVars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(coll.key);
    for (const lv of libVars) {
      try { libVarMap[lv.name] = await figma.variables.importVariableByKeyAsync(lv.key); }
      catch (_) {}
    }
  } catch (_) {}
  return libVarMap;
}

function tokenPaint(varMap, varName, fallbackHex) {
  const n = parseInt(fallbackHex.replace('#',''), 16);
  const base = { type:'SOLID', color:{ r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255 } };
  const v = varMap[varName];
  return v ? figma.variables.setBoundVariableForPaint(base, 'color', v) : base;
}
```
