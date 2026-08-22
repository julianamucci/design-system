import { createInput } from './input';

// Andaime compartilhado pelas stories do Input.
//
// Arquivo à parte porque num `*.stories.ts` TODO export nomeado vira uma story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// `campoRotulado` estava copiada em `input-estados` e `input-tipos`. A cópia dos
// estados tinha crescido um objeto de opções (`disabled`, `invalido`,
// `mensagem`); a dos tipos ficara na assinatura posicional antiga, com só o
// essencial. A árvore montada é a MESMA quando os extras não vêm, então a versão
// que fica é a de opções — a outra não sabia dizer nada sobre erro nem sobre
// bloqueio, e corrigir uma nunca corrigia a outra.

export interface FieldLabelledOptions {
  /** id do campo — é o que liga o rótulo ao controle. */
  id: string;
  /** Texto do rótulo visível. Campo sem rótulo não é anunciado por ninguém. */
  rotulo: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Estado de erro. Não é opção da fábrica: é atributo posto no elemento. */
  invalido?: boolean;
  /** Mensagem de erro, ligada ao campo por `aria-describedby`. */
  mensagem?: string;
}

/** Rótulo e campo, ligados por `for`/`id`, com a mensagem de erro quando há. */
export function campoRotulado(opts: FieldLabelledOptions): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack nds-w-xs';
  wrapper.dataset.spacing = 'xs';

  const label = document.createElement('label');
  label.htmlFor = opts.id;
  label.className = 'nds-text-body nds-font-medium';
  label.textContent = opts.rotulo;

  const input = createInput({
    type: opts.type ?? 'text',
    placeholder: opts.placeholder,
    disabled: opts.disabled,
    id: opts.id,
  });
  if (opts.invalido) input.setAttribute('aria-invalid', 'true');

  wrapper.append(label, input);

  if (opts.mensagem) {
    const msg = document.createElement('p');
    msg.id = `${opts.id}-msg`;
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = opts.mensagem;
    input.setAttribute('aria-describedby', msg.id);
    wrapper.append(msg);
  }

  return wrapper;
}
