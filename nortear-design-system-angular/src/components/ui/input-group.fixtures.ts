import type { InputGroupAlign } from './input-group';

/**
 * Andaime das stories do InputGroup — um módulo, quatro arquivos de story.
 *
 * Existe pelo mesmo motivo do `media-player.fixtures.ts`: num `*.stories.ts`
 * todo export nomeado vira story, então o andaime não pode morar lá — e a saída
 * fácil é copiar a constante para cada arquivo. Cópia divergida não é variação,
 * é o defeito: corrigir uma delas deixa as outras erradas sem nenhum sinal, e é
 * disso que a regra `fixture_duplicada_entre_stories` trata.
 *
 * Nada de `storybook/test` aqui dentro: os rótulos e os seletores servem tanto à
 * play quanto ao template, e arrastar o runner de teste para dentro do módulo o
 * levaria junto para qualquer consumidor.
 */

// ─── Ícones ──────────────────────────────────────────────────────────────────
//
// Marcação literal, e não `NdsButtonIcon`: o mapa daquele componente cobre
// plus/trash/pencil/chevron/download/loader/x/copy/check, e a lupa e o par de
// olhos não estão nele. É a mesma decisão já tomada em `TooltipDocs`.
//
// O desenho sai do pacote `lucide` (search, eye, eye-off), copiado como
// marcação porque o template do Angular exige tag estática e o pacote entrega
// uma lista `[tag, attrs]` de tag variável. `aria-hidden` está em todos: o
// ícone do addon é decoração, e o que ele ilustra já está no rótulo do campo.

const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
  'stroke-linejoin="round" aria-hidden="true">';

export const ICON_SEARCH =
  `${SVG_OPEN}<path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>`;

export const ICON_REVEAL =
  `${SVG_OPEN}<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>`;

export const ICON_HIDE =
  `${SVG_OPEN}<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></svg>`;

// ─── Rótulos canônicos das stories ───────────────────────────────────────────
//
// Os textos moram aqui, e não repetidos em cada arquivo, pelo motivo que esta
// campanha já pagou: uma story com o rótulo escrito à mão sai com outro texto e
// nenhuma asserção vê. Onde a asserção depende de um nome ou de um id, ela lê
// desta constante — literal solto faz a busca LANÇAR em vez de reprovar.

export const SITE_GROUP_LABEL = 'Endereço do site';
export const SITE_PREFIX = 'https://';
export const SITE_SUFFIX = '.com';
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

/** Id do texto que descreve o erro. Sai daqui para asserção e template casarem. */
export const INVALID_MESSAGE_ID = 'input-group-error';
export const INVALID_MESSAGE = 'Endereço inválido';

/** Id do campo rotulado da composição de formato. */
export const AFFIX_FIELD_ID = 'input-group-site';

// ─── Seletores ───────────────────────────────────────────────────────────────
//
// A busca por papel não alcança o addon — ele não tem papel nenhum, e é essa a
// decisão que a página de acessibilidade documenta. Então a play o encontra
// pelo `data-slot` e pela posição, que é o que a folha compartilhada lê.

/** A moldura. Com várias na tela, `groupsIn` devolve todas na ordem do DOM. */
export function groupIn(root: HTMLElement): HTMLElement {
  const group = root.querySelector<HTMLElement>('[data-slot="input-group"]');
  if (!group) throw new Error('Nenhuma moldura de InputGroup na story');
  return group;
}

export function groupsIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-slot="input-group"]')];
}

/**
 * O campo dentro da moldura, pela CLASSE do controle.
 *
 * Pela classe, e não pelo elemento `input`: é o que faz a busca alcançar também
 * a área de texto — a mesma razão pela qual o atalho do addon a usa.
 */
export function controlOf(group: HTMLElement): HTMLInputElement | HTMLTextAreaElement {
  const control = group.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    '.nds-input-group-control',
  );
  if (!control) throw new Error('A moldura não tem campo com .nds-input-group-control');
  return control;
}

/** O addon de uma posição, ou `null` — a busca por papel não o alcança. */
export function addonOfAlign(group: HTMLElement, align: InputGroupAlign): HTMLElement | null {
  return group.querySelector<HTMLElement>(
    `[data-slot="input-group-addon"][data-align="${align}"]`,
  );
}

/** Todos os addons da moldura, na ordem do DOM. */
export function addonsIn(group: HTMLElement): HTMLElement[] {
  return [...group.querySelectorAll<HTMLElement>('[data-slot="input-group-addon"]')];
}
