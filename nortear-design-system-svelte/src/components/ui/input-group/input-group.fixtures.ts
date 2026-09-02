/**
 * Andaime compartilhado das stories do InputGroup.
 *
 * Existe pelo mesmo motivo do andaime das outras famílias: os quatro arquivos de
 * story montam as mesmas molduras e fazem as mesmas consultas ao DOM. Copiado
 * por arquivo, o andaime diverge sem sinal — mesmo nome, comportamento
 * diferente, e corrigir um não corrige os outros. É a regra
 * `fixture_duplicada_entre_stories`.
 *
 * Módulo de TS puro: nada de `.svelte` em runtime, só `import type`, que o
 * compilador apaga. A MARCAÇÃO das stories mora nos componentes `*Story.svelte`
 * desta pasta — nesta stack a render function não aceita slot —, e o que mora
 * aqui é só o que os dois lados precisam combinar: texto, id e consulta.
 */
import type { InputGroupAlign } from './index';

// ─── Rótulos canônicos ──────────────────────────────────────────────────────
//
// Os textos vivem aqui, e não repetidos em cada arquivo: uma story com o rótulo
// escrito à mão sai com outro texto e nenhuma asserção vê. Onde a asserção
// depende de um id ou de um nome, ela lê desta constante.

export const SITE_GROUP_LABEL = 'Endereço do site';
export const SITE_PREFIX = 'https://';
export const SITE_SUFFIX = '.com';
export const SITE_PLACEHOLDER = 'minhaempresa';
export const PASTE_LABEL = 'Colar';

export const SEARCH_GROUP_LABEL = 'Buscar componentes';
export const SEARCH_PLACEHOLDER = 'Buscar';
export const SEARCH_SHORTCUT = 'Ctrl+K';

export const PASSWORD_GROUP_LABEL = 'Senha';
export const REVEAL_LABEL = 'Mostrar senha';
export const HIDE_LABEL = 'Ocultar senha';
export const PASSWORD_SAMPLE = 'senha-de-exemplo';

export const NOTE_GROUP_LABEL = 'Anotação';
export const NOTE_PLACEHOLDER = 'Escreva sua anotação';
export const SEND_LABEL = 'Enviar';

/** Id do campo do formato, para o rótulo visível apontar para ele. */
export const SITE_FIELD_ID = 'input-group-site';

/**
 * Ids dos campos que também precisam de rótulo VISÍVEL.
 *
 * Um por story, porque duas molduras na mesma tela com o mesmo id fariam os
 * dois rótulos apontarem para o primeiro campo — e o segundo ficaria sem nome
 * outra vez, agora sem o axe reclamar.
 *
 * O rótulo não é enfeite: `label-title-only` dispara pelo `aria-describedby`, e
 * descrição NÃO é nome. Nenhum dos candidatos que estavam ali serve — o prefixo
 * `https://` completa o formato, o texto de erro é descrição, e o nome do GRUPO
 * pertence ao conjunto campo + botão, não ao campo.
 */
export const INVALID_FIELD_ID = 'input-group-invalid-site';
export const PASSWORD_FIELD_ID = 'input-group-password';

/** Id do texto que descreve o erro. Sai daqui para asserção e marcação casarem. */
export const INVALID_MESSAGE_ID = 'input-group-error';
export const INVALID_MESSAGE = 'Endereço inválido';

/**
 * Seletor do campo interno.
 *
 * Pela CLASSE, e não pelo elemento `input`: é o que faz as asserções alcançarem
 * também a área de texto, e é o mesmo gancho que a folha compartilhada usa para
 * acender a moldura.
 */
export const CONTROL_SELECTOR = '.nds-input-group-control';

/** Seletor da moldura. */
export const GROUP_SELECTOR = '[data-slot="input-group"]';

/** Seletor do compartimento do acompanhamento. */
export const ADDON_SELECTOR = '[data-slot="input-group-addon"]';

/** Seletor do que AGE dentro da moldura. */
export const BUTTON_SELECTOR = '[data-slot="input-group-button"]';

// ─── Consultas ao DOM ───────────────────────────────────────────────────────
//
// Consultadas a cada uso, e nunca guardadas: o painel Interactions reexecuta a
// play no MESMO DOM, e um nó da rodada anterior pode já ter sido substituído —
// ler o atributo dele devolveria o valor de antes.

/** A moldura dentro da story. */
export function inputGroupRoot(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>(GROUP_SELECTOR)!;
}

/** Todas as molduras, para as stories que mostram mais de uma. */
export function inputGroupRoots(canvasElement: HTMLElement): HTMLElement[] {
  return Array.from(canvasElement.querySelectorAll<HTMLElement>(GROUP_SELECTOR));
}

/** O campo interno — input ou área de texto, indiferentemente. */
export function inputGroupControl<T extends HTMLElement = HTMLInputElement>(
  root: HTMLElement,
): T {
  return root.querySelector<T>(CONTROL_SELECTOR)!;
}

/** O addon de uma posição, ou `null` — a busca por papel não o alcança. */
export function addonOfAlign(root: HTMLElement, align: InputGroupAlign): HTMLElement | null {
  return root.querySelector<HTMLElement>(`${ADDON_SELECTOR}[data-align="${align}"]`);
}

/** Os addons de uma moldura, na ordem do DOM. */
export function addonsOf(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ADDON_SELECTOR));
}

/** Onde o elemento começa, na direção de leitura da página. */
export function visualStart(el: HTMLElement): number {
  return el.getBoundingClientRect().left;
}

/** Topo do elemento — é o que separa "acima" de "abaixo". */
export function visualTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top;
}
