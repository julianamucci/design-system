# Layout Components (Basecoat — Vanilla TypeScript)

---

## Aspect Ratio

**Propósito**: manter proporções fixas de mídia independente do tamanho do container.

**Quando usar**: sempre que exibir imagem, vídeo ou iframe com proporção conhecida.

**Implementação**:
```ts
export interface AspectRatioOptions {
  ratio: number;           // ex: 16/9, 1, 4/3
  children?: HTMLElement;
}

export function createAspectRatio({ ratio, children }: AspectRatioOptions): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.paddingBottom = `${(1 / ratio) * 100}%`;
  container.style.overflow = 'hidden';

  if (children) {
    children.style.position = 'absolute';
    children.style.inset = '0';
    children.className = cn(children.className, 'object-cover w-full h-full');
    container.appendChild(children);
  }

  return container;
}
```

**Ratios comuns**: `16/9`, `1`, `4/3`, `3/4`

**Acessibilidade**:
- Imagem informativa: `img.alt = 'Descrição significativa'`
- Imagem decorativa: `img.alt = ''` + `img.setAttribute('aria-hidden', 'true')`

---

## Card

**Propósito**: agrupar conteúdo relacionado em um container visualmente delimitado.

**Implementação**:
```ts
export interface CardOptions {
  title?: string;
  description?: string;
  content?: HTMLElement | string;
  footer?: HTMLElement;
}

export function createCard({ title, description, content, footer }: CardOptions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'rounded-lg border border-border bg-card text-card-foreground shadow-sm';

  if (title || description) {
    const header = document.createElement('div');
    header.className = 'flex flex-col space-y-1.5 p-6';

    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'font-semibold leading-none tracking-tight';
      h3.textContent = title;
      header.appendChild(h3);
    }

    if (description) {
      const p = document.createElement('p');
      p.className = 'text-muted-foreground';
      p.textContent = description;
      header.appendChild(p);
    }

    card.appendChild(header);
  }

  if (content) {
    const body = document.createElement('div');
    body.className = 'p-6 pt-0';
    if (typeof content === 'string') {
      body.textContent = content;
    } else {
      body.appendChild(content);
    }
    card.appendChild(body);
  }

  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'flex items-center p-6 pt-0 border-t border-border';
    footerEl.appendChild(footer);
    card.appendChild(footerEl);
  }

  return card;
}
```

**Tokens obrigatórios**: `bg-card text-card-foreground border-border`

**Acessibilidade**:
- Botões dentro do Card: `aria-label` contextual com identificador
- Card clicável: adicionar `tabindex="0"` + `role="link"` + `onkeydown` para Enter/Space

---

## Separator

**Propósito**: divisor visual horizontal ou vertical.

**Implementação**:
```ts
export function createSeparator(orientation: 'horizontal' | 'vertical' = 'horizontal'): HTMLElement {
  const sep = document.createElement('hr');
  sep.setAttribute('role', 'separator');
  sep.setAttribute('aria-orientation', orientation);

  if (orientation === 'horizontal') {
    sep.className = 'border-none h-px bg-border my-4';
  } else {
    sep.className = 'border-none w-px bg-border mx-2 inline-block self-stretch';
  }

  return sep;
}
```

**Decorativo**: adicionar `sep.setAttribute('aria-hidden', 'true')` quando for apenas visual.

---

## Scroll Area

**Propósito**: área com scroll customizado e consistente.

**Implementação**:
```ts
export function createScrollArea(options: { height?: string; content: HTMLElement }): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'rounded-md border border-border overflow-auto';
  wrapper.style.height = options.height ?? '288px'; // 72 * 4 = 288px

  const inner = document.createElement('div');
  inner.className = 'p-4';
  inner.appendChild(options.content);
  wrapper.appendChild(inner);

  return wrapper;
}
```
