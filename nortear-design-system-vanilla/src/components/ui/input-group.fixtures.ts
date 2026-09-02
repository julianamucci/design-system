import { Eye, EyeOff, Search, X } from 'lucide';
import {
  createInputGroup,
  createInputGroupAddon,
  createInputGroupButton,
  createInputGroupInput,
  createInputGroupText,
  createInputGroupTextarea,
  type InputGroupAlign,
  type InputGroupButtonOptions,
} from './input-group';

/**
 * Andaime das stories do InputGroup — um construtor, quatro arquivos de story.
 *
 * O módulo existe pelo mesmo motivo do `stepper.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então a função de montagem apareceria como
 * uma aba fantasma na barra lateral. Sem lugar para morar, ela seria copiada
 * quatro vezes — e cópia de andaime é como a regra `fixture_duplicada_entre_
 * stories` nasceu.
 *
 * O que ele monta é EXATAMENTE o que `input-group.source.ts` ensina no painel
 * Code. Os dois andam juntos de propósito: snippet que diverge da story mente
 * sobre o que a story renderiza, e ninguém percebe — o painel Code não entra no
 * DOM da play.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

type LucideIconNode = [string, Record<string, string>];

/**
 * Monta um ícone do lucide por `createElementNS`.
 *
 * Mesma decisão do `stepper.ts`: os nós vêm da lista `[tag, attrs]` do pacote
 * agnóstico `lucide`, e não de um `d` copiado à mão — copiado, ele congela na
 * versão do dia e some do radar quando o pacote muda o desenho. Construir nós é
 * imune a XSS: não há `innerHTML` no caminho.
 *
 * `aria-hidden` sai daqui e não do call site: o ícone do addon é decoração, e a
 * decisão 5 da página de acessibilidade vale para todos eles. Deixá-la ao
 * chamador é como um deles acabaria sem.
 */
export function createLucideIcon(nodes: LucideIconNode[]): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of nodes) {
    const child = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

export const ICONS = {
  search: () => createLucideIcon(Search as unknown as LucideIconNode[]),
  clear: () => createLucideIcon(X as unknown as LucideIconNode[]),
  reveal: () => createLucideIcon(Eye as unknown as LucideIconNode[]),
  hide: () => createLucideIcon(EyeOff as unknown as LucideIconNode[]),
};

// ─── Rótulos canônicos das stories ──────────────────────────────────────────
//
// Os textos vivem aqui, e não repetidos em cada arquivo, pelo motivo que a
// campanha já pagou: uma story com o rótulo escrito à mão sai com outro texto e
// nenhuma asserção vê. Onde a asserção depende de um id ou de um nome, ela lê
// desta constante.

export const SITE_GROUP_LABEL = 'Endereço do site';
export const SITE_PREFIX = 'https://';
export const SITE_PLACEHOLDER = 'minhaempresa';
export const PASTE_LABEL = 'Colar';

export const SEARCH_GROUP_LABEL = 'Buscar componentes';
export const SEARCH_PLACEHOLDER = 'Buscar';
export const SEARCH_SHORTCUT = '⌘K';

export const PASSWORD_GROUP_LABEL = 'Senha';
export const REVEAL_LABEL = 'Mostrar senha';
export const HIDE_LABEL = 'Ocultar senha';

export const NOTE_GROUP_LABEL = 'Anotação';
export const NOTE_PLACEHOLDER = 'Escreva sua anotação';
export const SEND_LABEL = 'Enviar';

/** Id do texto que descreve o erro. Sai daqui para asserção e markup casarem. */
export const INVALID_MESSAGE_ID = 'input-group-erro';
export const INVALID_MESSAGE = 'Endereço inválido';

// ─── Construtor ─────────────────────────────────────────────────────────────

/** Um addon, como a story o descreve antes de virar DOM. */
export interface AddonDef {
  align: InputGroupAlign;
  /** Texto de apoio dentro do addon — prefixo, sufixo, atalho. */
  text?: string;
  /** Ícone decorativo. Fica fora da árvore de acessibilidade. */
  icon?: keyof typeof ICONS;
  /** Botão de verdade. Presente, o addon deixa de ser só decoração. */
  button?: InputGroupButtonOptions;
}

export interface BuildInputGroupOptions {
  /** Nome acessível do grupo. Ausente, o grupo não recebe nome — e é o caso comum. */
  'aria-label'?: string;
  placeholder?: string;
  /** Área de texto no lugar do campo de uma linha. A folha empilha sozinha. */
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
  invalid?: boolean;
  addons?: AddonDef[];
  class?: string;
}

/** Monta o grupo inteiro: moldura, addons e campo. */
export function buildInputGroup(options: BuildInputGroupOptions = {}): HTMLDivElement {
  const group = createInputGroup({
    'aria-label': options['aria-label'],
    class: options.class,
  });

  const control = options.multiline
    ? createInputGroupTextarea({
      placeholder: options.placeholder,
      disabled: options.disabled,
      rows: options.rows,
    })
    : createInputGroupInput({
      placeholder: options.placeholder,
      disabled: options.disabled,
    });

  // Estado é palavra, nunca só cor: o atributo vai no CAMPO e aponta para o
  // texto que descreve o problema. A moldura vermelha é o eco disso.
  if (options.invalid) {
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', INVALID_MESSAGE_ID);
  }

  const addons = (options.addons ?? []).map((def) => {
    const addon = createInputGroupAddon({ align: def.align });
    if (def.icon) addon.appendChild(ICONS[def.icon]());
    if (def.text) addon.appendChild(createInputGroupText({ text: def.text }));
    // O `disabled` DO GRUPO alcança o botão do addon, e não só o campo.
    //
    // Ele chegava só ao controle: um grupo desabilitado esmaecia inteiro pela
    // folha (`:has(:disabled)`) e ainda entregava um "Colar" focável e
    // clicável — aparência de inativo com um controle vivo dentro é a pior das
    // duas, o mesmo defeito que a story do campo já media e que ninguém tinha
    // medido no botão. O `disabled` do próprio addon vence, para a story que
    // precise de um botão vivo num grupo desabilitado poder pedi-lo.
    if (def.button) {
      addon.appendChild(createInputGroupButton({
        ...def.button,
        disabled: def.button.disabled ?? options.disabled,
      }));
    }
    return addon;
  });

  // A ORDEM VISUAL é da folha, por `order` em `[data-align]`; a ordem do DOM só
  // precisa pôr o campo entre os addons para a leitura sequencial bater com o
  // desenho quando nada reordena.
  group.append(...addons.filter((a) => a.dataset.align?.endsWith('start')));
  group.appendChild(control);
  group.append(...addons.filter((a) => a.dataset.align?.endsWith('end')));

  return group;
}

/**
 * O grupo mais o texto que descreve o erro.
 *
 * O texto mora FORA da moldura de propósito: dentro dela ele herdaria o
 * `cursor: text` do addon e disputaria a largura com o que a pessoa digita.
 */
export function buildInvalidField(options: BuildInputGroupOptions = {}): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-stack';
  wrapper.dataset.spacing = 'sm';

  const message = document.createElement('p');
  message.id = INVALID_MESSAGE_ID;
  message.className = 'nds-text-caption nds-text-destructive';
  message.textContent = INVALID_MESSAGE;

  const group = buildInputGroup({ ...options, invalid: true });

  // DESCREVER NÃO É NOMEAR, e o par `aria-invalid` + `aria-describedby` sem
  // nome é o caso exato em que o axe reprova (`label-title-only`, disparada
  // pela descrição). O grupo pode ter nome; o CONTROLE precisa do dele.
  //
  // A falha estava escondida atrás de outra: enquanto a asserção da borda
  // reprovava antes do axe, esta violação nunca chegava a ser relatada.
  group.querySelector('.nds-input-group-control')!
    .setAttribute('aria-label', options['aria-label'] ?? SITE_GROUP_LABEL);

  wrapper.append(group, message);
  return wrapper;
}

/** O addon de uma posição, ou `null` — a busca por papel não o alcança. */
export function addonOfAlign(group: HTMLElement, align: InputGroupAlign): HTMLElement | null {
  return group.querySelector<HTMLElement>(
    `[data-slot="input-group-addon"][data-align="${align}"]`,
  );
}
