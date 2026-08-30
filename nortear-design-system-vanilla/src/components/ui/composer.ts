import { cn } from '@/lib/utils';
import { createButton } from './button';
import {
  createTriggerPopover,
  type TriggerPopoverLabels,
  type TriggerSource,
} from './composer-trigger-popover';

/**
 * A superfície de entrada da conversa. Estrutura e cores em `nds/composer.css`,
 * que também guarda as decisões de acessibilidade que valem mais que o desenho.
 *
 * O QUE O COMPONENTE FAZ: recebe o que foi escrito, diz quando alguém pediu
 * para enviar, e troca o botão de enviar por um de interromper enquanto a
 * resposta é gerada.
 *
 * O QUE ELE NÃO FAZ: decidir o que enviar significa. Ele não limpa o campo
 * sozinho, não sabe se a mensagem chegou e não guarda rascunho. Emite o texto e
 * devolve o controle — a mesma divisão de `approval` no `chat-thread`, e pelo
 * mesmo motivo: o que acontece depois do envio é produto, e produto envelhece
 * por outro relógio que o sistema de design.
 *
 * POR QUE `Enter` ENVIA, e por que isso é uma prop
 *
 * A convenção de conversa em teclado físico é Enter enviar e Shift+Enter
 * quebrar linha, e é o padrão daqui. Mas ela é ERRADA no toque: no teclado
 * virtual o Enter é a tecla de quebrar linha, e um composer que envia ali
 * manda mensagem pela metade a cada tentativa de fazer parágrafo. Por isso
 * `submitOn` existe e `mobile-composer` — a peça vizinha da mesma família —
 * nasce com `'modifier'`.
 *
 * A dica embaixo NÃO é decoração: `Enter envia` é comportamento, e quem não vê
 * a tela precisa saber disso ANTES de apertar a tecla. Ela entra em
 * `aria-describedby` do campo, junto com o limite de caracteres.
 */

/** Como se pede o envio pelo teclado. */
export type ComposerSubmitOn =
  /** Enter envia; Shift+Enter quebra linha. Convenção de teclado físico. */
  | 'enter'
  /** Ctrl/Cmd+Enter envia; Enter quebra linha. É o certo no toque. */
  | 'modifier';

export interface ComposerLabels {
  /** Nome acessível do campo. */
  input: string;
  placeholder: string;
  /** Nome do botão em repouso. */
  submit: string;
  /** Nome do MESMO botão enquanto gera — troca de nome, não só de ícone. */
  stop: string;
  /** A dica de teclado. `{key}` vira a combinação que envia. */
  hint: string;
  /** Descrição do limite. `{max}` vira o número. */
  limit: string;
}

export interface ComposerOptions {
  labels: ComposerLabels;
  /** Texto inicial. O componente não guarda rascunho — quem consome guarda. */
  value?: string;
  /** Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte. */
  rows?: number;
  /** Limite de caracteres. Sem ele não há contador: contar sem teto não informa nada. */
  maxLength?: number;
  disabled?: boolean;
  submitOn?: ComposerSubmitOn;
  /** Controles do início do trilho — anexar, ferramentas. É um ESPAÇO. */
  railStart?: HTMLElement[];
  /**
   * Gatilhos do seletor — menções, comandos, e qualquer outro caractere.
   *
   * Sem eles o campo é só um campo. Com eles, digitar o caractere abre o
   * seletor, e a tecla de envio passa a ESCOLHER enquanto ele estiver aberto.
   */
  triggers?: TriggerSource[];
  /** Textos do seletor. Obrigatórios quando há gatilho, porque são texto de tela. */
  triggerLabels?: TriggerPopoverLabels;
  /** Alguém pediu para enviar. O texto vai junto; limpar o campo é de quem consome. */
  onSubmit?: (value: string) => void;
  /** Alguém pediu para interromper o que está sendo gerado. */
  onStop?: () => void;
  /** O texto mudou. */
  onInput?: (value: string) => void;
  class?: string;
}

export type ComposerElement = HTMLFormElement & {
  /** O texto agora. */
  getValue: () => string;
  /** Troca o texto — é por aqui que um rascunho volta. */
  setValue: (value: string) => void;
  /**
   * Liga e desliga o estado de geração.
   *
   * É o que troca o botão de enviar pelo de interromper, e o que impede um
   * segundo envio enquanto o primeiro não terminou.
   */
  setRunning: (running: boolean) => void;
};

/** A combinação que envia, para a dica dizer a verdade em cada modo. */
function submitKey(submitOn: ComposerSubmitOn): string {
  return submitOn === 'enter' ? 'Enter' : 'Ctrl+Enter';
}

/** O evento de teclado pede envio? */
function pedeEnvio(event: KeyboardEvent, submitOn: ComposerSubmitOn): boolean {
  if (event.key !== 'Enter') return false;
  // Composição de IME (acento morto, teclado de idioma com candidatos) usa
  // Enter para CONFIRMAR o caractere. Enviar aqui interromperia quem está
  // escrevendo em japonês no meio de uma palavra — e o campo é multilíngue.
  if (event.isComposing) return false;
  if (submitOn === 'modifier') return event.ctrlKey || event.metaKey;
  return !event.shiftKey;
}

let instances = 0;

export function createComposer(options: ComposerOptions): ComposerElement {
  const {
    labels,
    value = '',
    rows = 2,
    maxLength,
    disabled = false,
    submitOn = 'enter',
    railStart = [],
    triggers = [],
    triggerLabels,
    onSubmit,
    onStop,
    onInput,
  } = options;

  const id = `nds-composer-${++instances}`;
  const hintId = `${id}-hint`;

  const form = document.createElement('form') as ComposerElement;
  form.dataset.slot = 'composer';
  form.dataset.state = 'idle';
  form.className = cn('nds-composer', options.class);
  if (disabled) form.dataset.disabled = 'true';

  // ── A moldura e o campo ────────────────────────────────────────────────────

  const field = document.createElement('div');
  field.className = 'nds-composer-field';

  const input = document.createElement('textarea');
  input.dataset.slot = 'composer-input';
  input.className = 'nds-composer-input';
  input.id = id;
  input.rows = rows;
  input.value = value;
  input.placeholder = labels.placeholder;
  input.setAttribute('aria-label', labels.input);
  if (maxLength !== undefined) input.maxLength = maxLength;
  if (disabled) input.disabled = true;

  field.appendChild(input);

  // ── O seletor do caractere gatilho ─────────────────────────────────────────
  //
  // Só existe quando há gatilho declarado E texto para o painel dizer. Sem
  // rótulo o painel abriria com "nada encontrado" em branco, que é pior que
  // não abrir.
  const triggerPopover =
    triggers.length && triggerLabels
      ? createTriggerPopover({
          input,
          sources: triggers,
          labels: triggerLabels,
          onApply: () => {
            desenhar();
            onInput?.(input.value);
          },
        })
      : null;
  if (triggerPopover) field.appendChild(triggerPopover.element);

  // ── O trilho ───────────────────────────────────────────────────────────────

  const rail = document.createElement('div');
  rail.className = 'nds-composer-rail';

  const railStartEl = document.createElement('div');
  railStartEl.className = 'nds-composer-rail-start';
  railStartEl.append(...railStart);

  const railEnd = document.createElement('div');
  railEnd.className = 'nds-composer-rail-end';

  /**
   * O contador é `aria-hidden`, e isso é decisão, não esquecimento.
   *
   * Ele muda a cada tecla. Num leitor de tela isso vira um número reanunciado a
   * cada letra, e o campo fica impossível de usar. O limite chega UMA vez, pela
   * descrição do campo, que é texto estático.
   */
  const counter = maxLength === undefined ? null : document.createElement('span');
  if (counter && maxLength !== undefined) {
    counter.className = 'nds-composer-counter';
    counter.setAttribute('aria-hidden', 'true');
    railEnd.appendChild(counter);
  }

  const submitButton = createButton({ label: labels.submit, size: 'sm', type: 'submit' });
  submitButton.dataset.slot = 'composer-submit';
  if (disabled) submitButton.disabled = true;
  railEnd.appendChild(submitButton);

  rail.append(railStartEl, railEnd);

  // ── A dica ─────────────────────────────────────────────────────────────────

  const hint = document.createElement('p');
  hint.className = 'nds-composer-hint';
  hint.id = hintId;
  form.append(field, rail, hint);

  // A dica descreve o campo — `Enter envia` é comportamento, e saber disso
  // depois de apertar a tecla não serve para nada.
  input.setAttribute('aria-describedby', hintId);

  // ── Estado ─────────────────────────────────────────────────────────────────

  const hintText = () => {
    const base = labels.hint.replace('{key}', submitKey(submitOn));
    if (maxLength === undefined) return base;
    return `${base} · ${labels.limit.replace('{max}', String(maxLength))}`;
  };

  const desenhar = () => {
    hint.textContent = hintText();
    if (counter && maxLength !== undefined) {
      counter.textContent = `${input.value.length}/${maxLength}`;
      // Perto do limite muda cor E peso — cor sozinha não descreve estado.
      counter.dataset.nearLimit = String(input.value.length >= maxLength * 0.9);
    }
    const gerando = form.dataset.state === 'running';
    // O botão troca de NOME, e não só de ícone: é o mesmo controle fazendo
    // outra coisa, e o nome acessível tem de dizer qual.
    submitButton.textContent = gerando ? labels.stop : labels.submit;
    submitButton.type = gerando ? 'button' : 'submit';
    // Vazio não envia. Enquanto gera, o botão continua vivo — é ele que
    // interrompe.
    submitButton.disabled = disabled || (!gerando && input.value.trim() === '');
  };

  const submit = () => {
    const text = input.value.trim();
    if (!text || form.dataset.state === 'running' || disabled) return;
    onSubmit?.(text);
  };

  form.addEventListener('submit', (event) => {
    // O composer não navega: quem decide o que fazer com o texto é quem consome.
    event.preventDefault();
    submit();
  });

  submitButton.addEventListener('click', () => {
    if (form.dataset.state === 'running') onStop?.();
  });

  input.addEventListener('keydown', (event) => {
    // COM O SELETOR ABERTO, AS TECLAS SÃO DELE.
    //
    // É a decisão que atravessa o componente inteiro: envio e escolha disputam
    // a mesma tecla, e enviar no meio de uma menção é o defeito que quem
    // escreve encontra na primeira vez que usa. As setas e o Escape também
    // param aqui — sem isso a seta moveria o cursor no texto enquanto a lista
    // parece andar.
    if (triggerPopover?.isOpen()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        triggerPopover.move(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        triggerPopover.move(-1);
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        triggerPopover.close();
        return;
      }
      // Enter e Tab escolhem. O Tab entra porque quem escreve espera que ele
      // complete, e sem isso ele tiraria o foco do campo com a lista aberta.
      if ((event.key === 'Enter' && !event.isComposing) || event.key === 'Tab') {
        if (triggerPopover.applyActive()) {
          event.preventDefault();
          return;
        }
      }
    }

    if (!pedeEnvio(event, submitOn)) return;
    // Só aqui: sem o `preventDefault` a quebra de linha entra junto com o
    // envio, e o campo fica com um enter sobrando depois de limpo.
    event.preventDefault();
    submit();
  });

  input.addEventListener('input', () => {
    desenhar();
    triggerPopover?.sync();
    onInput?.(input.value);
  });

  // A rolagem e o clique movem o cursor sem disparar `input`, e o gatilho
  // depende de ONDE o cursor está: sem isto o seletor continuaria aberto sobre
  // um `@` que ficou para trás.
  input.addEventListener('click', () => triggerPopover?.sync());
  input.addEventListener('keyup', (event) => {
    if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
      triggerPopover?.sync();
    }
  });
  input.addEventListener('blur', () => triggerPopover?.close());

  form.getValue = () => input.value;
  form.setValue = (novo: string) => {
    input.value = novo;
    desenhar();
  };
  form.setRunning = (running: boolean) => {
    form.dataset.state = running ? 'running' : 'idle';
    desenhar();
  };

  desenhar();
  return form;
}
