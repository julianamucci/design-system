# Form Components (Basecoat — Vanilla TypeScript)

---

## Button

**Propósito**: elemento de ação — dispara submissões, confirmações e ações do usuário.

**Variantes**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

**Implementação**: ver `01-regras-gerais.md` → "Padrão de criação de componentes".

```ts
import { createButton } from '$lib/components/ui/button';
import { track } from '$lib/analytics';

// Botão simples
const btn = createButton({
  label: 'Salvar',
  variant: 'default',
  onClick: () => handleSalvar(),
});

// Com analytics
const btnCheckout = createButton({
  label: 'Finalizar compra',
  onClick: () => {
    track('button_click', {
      component: 'button',
      variant: 'default',
      location: 'checkout_form',
      label: 'Finalizar compra',
    });
    handleCheckout();
  },
});

// Icon-only — aria-label obrigatório
const btnDelete = createButton({ label: '' });
btnDelete.setAttribute('aria-label', 'Excluir produto Cadeira Gamer Pro');
btnDelete.innerHTML = `<svg aria-hidden="true"><!-- ícone Trash2 --></svg>`;
```

---

## Input

```ts
export interface InputOptions {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  errorId?: string;
}

export function createInput({ id, label, type = 'text', placeholder, required, errorId }: InputOptions): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-2';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.className = 'text-sm font-medium leading-none';
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.name = id;
  input.className = cn(
    'flex h-9 w-full rounded-md border border-input bg-input px-3 py-1 shadow-sm transition-colors',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50'
  );

  if (placeholder) input.placeholder = placeholder;
  if (required) input.required = true;
  if (errorId) {
    input.setAttribute('aria-describedby', errorId);
    input.setAttribute('aria-invalid', 'true');
  }

  wrapper.appendChild(labelEl);
  wrapper.appendChild(input);
  return wrapper;
}
```

**Regras**:
- `label` sempre associado via `for`/`id`
- Placeholder: exemplo real — `'ex: ana@empresa.com'`
- Tokens obrigatórios: `bg-input border-input`

---

## Form (HTML nativo + Zod)

```ts
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

export function createLoginForm(onSubmit: (data: { email: string; nome: string }) => void): HTMLFormElement {
  const form = document.createElement('form');
  form.className = 'space-y-4';
  form.noValidate = true; // Usamos Zod, não validação nativa

  const emailWrapper = createInput({ id: 'email', label: 'E-mail', type: 'email', placeholder: 'ex: ana@empresa.com' });
  const nomeWrapper = createInput({ id: 'nome', label: 'Nome', placeholder: 'ex: Ana Paula Silva' });

  const submitBtn = createButton({ label: 'Entrar', variant: 'default' });
  (submitBtn as HTMLButtonElement).type = 'submit';

  form.append(emailWrapper, nomeWrapper, submitBtn);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(form);

    const data = {
      email: (form.querySelector('#email') as HTMLInputElement).value,
      nome: (form.querySelector('#nome') as HTMLInputElement).value,
    };

    const result = schema.safeParse(data);

    if (!result.success) {
      result.error.errors.forEach(({ path, message }) => {
        showFieldError(form, path[0] as string, message);
      });
      return;
    }

    onSubmit(result.data);
  });

  return form;
}

function showFieldError(form: HTMLFormElement, fieldId: string, message: string) {
  const input = form.querySelector(`#${fieldId}`) as HTMLInputElement;
  const errorId = `${fieldId}-error`;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', errorId);

  const error = document.createElement('p');
  error.id = errorId;
  error.className = 'text-destructive text-sm';
  error.setAttribute('role', 'alert');
  error.textContent = message;
  input.insertAdjacentElement('afterend', error);
}

function clearErrors(form: HTMLFormElement) {
  form.querySelectorAll('[role="alert"]').forEach((el) => el.remove());
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
}
```

---

## Checkbox

```ts
export function createCheckbox(options: { id: string; label: string; checked?: boolean }): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex items-center space-x-2';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = options.id;
  input.checked = options.checked ?? false;
  input.className = 'h-4 w-4 rounded border border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  const label = document.createElement('label');
  label.htmlFor = options.id;
  label.className = 'text-sm font-medium leading-none cursor-pointer';
  label.textContent = options.label;

  wrapper.append(input, label);
  return wrapper;
}
```
