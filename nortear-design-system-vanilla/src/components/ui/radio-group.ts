// ─── Radio Group — Vanilla factory standalone ───────────────────────────────
//
// Visual: classes .nds-radio-* (standalone).
// Estado controlado via aria-checked + display do .nds-radio-indicator.
// Native <input type="radio"> presente em cada item para participação em forms.

import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

const RADIO_INDICATOR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" ' +
  'aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>';

export type RadioGroupItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RadioGroupOptions = {
  name: string;
  items: RadioGroupItem[];
  defaultValue?: string;
  /** Desabilita o grupo inteiro — equivalente a marcar todos os itens. */
  disabled?: boolean;
  /**
   * Direção da navegação por setas. Vira `aria-orientation` no grupo, e é o
   * mesmo atributo que o CSS compartilhado usa para dispor as opções em linha —
   * layout e anúncio do leitor de tela não têm como divergir.
   */
  orientation?: 'vertical' | 'horizontal';
  onValueChange?: (value: string) => void;
  class?: string;
};

export function createRadioGroup(options: RadioGroupOptions): HTMLElement {
  const { name, items, defaultValue, disabled: groupDisabled, orientation, onValueChange } = options;

  const fieldset = document.createElement('fieldset');
  fieldset.dataset.slot = 'radio-group';
  fieldset.className = cn('nds-radio-group', options.class);
  // `<fieldset>` sozinho tem role implícito `group`, não `radiogroup`: sem esta
  // linha o leitor de tela não anuncia nem o conjunto exclusivo nem a contagem
  // de opções, e cada story teria de repetir o atributo por fora.
  fieldset.setAttribute('role', 'radiogroup');
  if (orientation) fieldset.setAttribute('aria-orientation', orientation);

  const isDisabled = (item: RadioGroupItem): boolean => groupDisabled || item.disabled === true;

  /**
   * Roving tabindex: o grupo é UM ponto de parada do Tab, não um por opção.
   * Fica na ordem de tabulação o item escolhido; sem escolha, o primeiro
   * habilitado. É o que faz o Tab sair do grupo em vez de percorrê-lo.
   */
  function updateTabStops(): void {
    const todos = Array.from(
      fieldset.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]'),
    );
    const habilitados = todos.filter((b) => !b.disabled);
    const marcado = habilitados.find((b) => b.getAttribute('aria-checked') === 'true');
    const parada = marcado ?? habilitados[0];
    // Todos saem da ordem de tabulação e só a parada volta. O item bloqueado é
    // incluído de propósito: `disabled` já o torna infocável, mas deixar o
    // `tabindex="0"` implícito do <button> faz o markup dizer o contrário do
    // comportamento — e é o markup que as outras stacks emitem e a auditoria
    // cross-stack compara.
    todos.forEach((b) => {
      b.tabIndex = b === parada ? 0 : -1;
    });
  }

  function selectItem(value: string): void {
    fieldset.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]').forEach((btn) => {
      const v = btn.dataset.value!;
      const isSelected = v === value;
      btn.setAttribute('aria-checked', String(isSelected));
      btn.dataset.state = isSelected ? 'checked' : 'unchecked';
      const ind = btn.querySelector<HTMLElement>('[data-slot="radio-indicator"]');
      if (ind) ind.style.display = isSelected ? '' : 'none';
    });
    fieldset.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((inp) => {
      inp.checked = inp.value === value;
    });
    updateTabStops();
    onValueChange?.(value);
  }

  items.forEach((item) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'nds-radio-row';

    const labelId = `${name}-${item.value}-label`;

    const itemBtn = document.createElement('button');
    itemBtn.type = 'button';
    itemBtn.dataset.slot = 'radio-group-item';
    itemBtn.dataset.value = item.value;
    itemBtn.className = 'nds-radio-item';
    itemBtn.setAttribute('role', 'radio');
    itemBtn.setAttribute('aria-checked', String(item.value === defaultValue));
    itemBtn.dataset.state = item.value === defaultValue ? 'checked' : 'unchecked';
    itemBtn.setAttribute('aria-labelledby', labelId);
    if (isDisabled(item)) itemBtn.disabled = true;

    const indicatorSpan = document.createElement('span');
    indicatorSpan.dataset.slot = 'radio-indicator';
    indicatorSpan.className = 'nds-radio-indicator';
    indicatorSpan.style.display = item.value === defaultValue ? '' : 'none';

    // SVG parseado e anexado (não innerHTML em elemento do fluxo).
    const wrap = document.createElement('span');
    wrap.innerHTML = DOMPurify.sanitize(RADIO_INDICATOR_SVG);
    const svg = wrap.firstElementChild;
    if (svg) indicatorSpan.appendChild(svg);
    itemBtn.appendChild(indicatorSpan);

    const nativeInput = document.createElement('input');
    nativeInput.type = 'radio';
    nativeInput.name = name;
    nativeInput.value = item.value;
    nativeInput.checked = item.value === defaultValue;
    nativeInput.disabled = isDisabled(item);
    nativeInput.setAttribute('aria-hidden', 'true');
    nativeInput.tabIndex = -1;
    // Hidden native input — kept as sibling (not nested inside the button)
    // to satisfy WCAG/axe nested-interactive rule.
    nativeInput.classList.add('nds-sr-only');

    const labelEl = document.createElement('label');
    labelEl.id = labelId;
    labelEl.className = 'nds-radio-label';
    labelEl.textContent = item.label;

    rowEl.append(itemBtn, labelEl, nativeInput);
    fieldset.appendChild(rowEl);

    if (!isDisabled(item)) {
      itemBtn.addEventListener('click', () => selectItem(item.value));
      labelEl.addEventListener('click', () => selectItem(item.value));
      itemBtn.addEventListener('keydown', (e) => {
        const allBtns = Array.from(
          fieldset.querySelectorAll<HTMLButtonElement>('[data-slot="radio-group-item"]:not([disabled])')
        );
        const idx = allBtns.indexOf(itemBtn);
        const passo =
          e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
          : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1
          : 0;
        if (passo === 0) return;
        e.preventDefault();
        // Circula: do último volta ao primeiro, como o padrão WAI-ARIA e como
        // as libs headless das outras stacks.
        const alvo = allBtns[(idx + passo + allBtns.length) % allBtns.length];
        if (!alvo) return;
        alvo.focus();
        // A seta MOVE E SELECIONA — é o que distingue um radiogroup de um punhado
        // de botões, e é o que a seção de acessibilidade do conteúdo descreve.
        // Antes daqui a seta só movia o foco, e o teste que a cobria assertava
        // apenas o foco: o defeito estava documentado como comportamento.
        selectItem(alvo.dataset.value!);
      });
    }
  });

  updateTabStops();

  return fieldset;
}
