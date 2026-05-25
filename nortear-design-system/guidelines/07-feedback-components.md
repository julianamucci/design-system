# Feedback Components (Basecoat — Vanilla TypeScript)

---

## Alert

**Propósito**: mensagem estática e persistente que comunica informações importantes ao usuário.

**Quando usar**: mensagens que o usuário precisa ver e potencialmente agir. Para mensagens temporárias, usar **Toast**.

| Situação | Componente |
|----------|------------|
| Mensagem persistente, requer atenção ou ação | Alert |
| Confirmação temporária (salvo, enviado) | Toast |
| Erro crítico que bloqueia o fluxo | Alert |

**Implementação**:
```ts
export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning';

export interface AlertOptions {
  title?: string;
  description: string;
  variant?: AlertVariant;
  icon?: SVGSVGElement;
}

export function createAlert({ title, description, variant = 'default', icon }: AlertOptions): HTMLDivElement {
  const alert = document.createElement('div');
  alert.setAttribute('role', 'alert');
  alert.className = cn(
    'relative w-full rounded-lg border p-4',
    variant === 'default' && 'bg-background text-foreground border-border',
    variant === 'destructive' && 'border-destructive/50 text-destructive bg-destructive/10',
    variant === 'success' && 'bg-success/10 text-success border-success/30',
    variant === 'warning' && 'bg-warning/10 text-warning border-warning/30'
  );

  if (icon) {
    icon.setAttribute('aria-hidden', 'true');
    icon.className = cn(icon.className, 'h-4 w-4 absolute left-4 top-4');
    alert.appendChild(icon);
  }

  const content = document.createElement('div');
  content.className = icon ? 'pl-7' : '';

  if (title) {
    const titleEl = document.createElement('h5');
    titleEl.className = 'mb-1 font-medium leading-none tracking-tight';
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }

  const desc = document.createElement('div');
  desc.className = 'text-sm leading-relaxed';
  desc.textContent = description;
  content.appendChild(desc);

  alert.appendChild(content);
  return alert;
}
```

**Regra**: cor nunca é o único indicador de estado — sempre acompanhar com ícone + texto.

---

## Badge

```ts
export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export function createBadge(label: string, variant: BadgeVariant = 'default'): HTMLSpanElement {
  const badge = document.createElement('span');
  badge.className = cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors',
    variant === 'default' && 'border-transparent bg-primary text-primary-foreground',
    variant === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
    variant === 'outline' && 'border-border text-foreground',
    variant === 'destructive' && 'border-transparent bg-destructive text-destructive-foreground'
  );
  badge.textContent = label;
  return badge;
}

// Warning/Success via className customizado:
const warningBadge = createBadge('Pendente');
warningBadge.className = cn(warningBadge.className, 'bg-warning/10 text-warning border-warning/30');
```

---

## Progress

```ts
export function createProgress(value: number, ariaLabel: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'progressbar');
  wrapper.setAttribute('aria-label', ariaLabel);
  wrapper.setAttribute('aria-valuenow', String(value));
  wrapper.setAttribute('aria-valuemin', '0');
  wrapper.setAttribute('aria-valuemax', '100');
  wrapper.className = 'relative h-2 w-full overflow-hidden rounded-full bg-muted';

  const bar = document.createElement('div');
  bar.className = 'h-full bg-primary transition-all';
  bar.style.width = `${value}%`;

  wrapper.appendChild(bar);
  return wrapper;
}
```

---

## Skeleton

```ts
export function createSkeleton(className?: string): HTMLDivElement {
  const skeleton = document.createElement('div');
  skeleton.className = cn('animate-pulse rounded-md bg-muted', className);
  return skeleton;
}
```

**Acessibilidade**: adicionar `aria-busy="true"` no container pai e `aria-label="Carregando..."` no wrapper.

---

## Toast

**Propósito**: notificações temporárias não bloqueantes.

```ts
export type ToastType = 'default' | 'success' | 'error' | 'warning';

export function showToast(message: string, type: ToastType = 'default', duration = 4000): void {
  const toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.className = cn(
    'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg',
    'bg-card text-card-foreground border-border',
    type === 'success' && 'border-success/30 bg-success/10 text-success',
    type === 'error' && 'border-destructive/50 bg-destructive/10 text-destructive',
    type === 'warning' && 'border-warning/30 bg-warning/10 text-warning'
  );
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, duration);
}
```

**Posição**: `fixed top-4 right-4` (equivalente a `top-right`)
