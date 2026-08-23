// Snippet do painel Code do Switch — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';
import type { SwitchSize } from './switch';

/**
 * As chaves são as MESMAS dos args da story, para que `{ ...ctx.args }` entre
 * sem tradução — inclusive `'aria-label'`, que é o nome canônico da opção.
 */
export type SwitchSnippetOptions = {
  checked?: boolean;
  disabled?: boolean;
  size?: SwitchSize;
  /** `id` do controle, que é o que o rótulo aponta com `htmlFor`. */
  id?: string;
  /** Texto do rótulo VISÍVEL. Vazio = controle nomeado só por `aria-label`. */
  label?: string;
  'aria-label'?: string;
  /** Presença liga a linha do callback; string troca a expressão mostrada. */
  onCheckedChange?: unknown;
  class?: string;
};

const CALLBACK_DEFAULT = '(ligado) => salvarPreferencia(ligado)';

const ID_DEFAULT = 'notificacoes-email';
const LABEL_DEFAULT = 'Receber notificações por email';

function expressao(value: unknown): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : CALLBACK_DEFAULT;
}

function controlLines(o: SwitchSnippetOptions, id: string, withLabel: boolean): string[] {
  return options([
    ['id', withLabel ? text(id) : undefined],
    // Sem rótulo visível o nome acessível é obrigatório: `aria-checked` sozinho
    // faz o leitor anunciar "ligado" sem dizer o quê.
    ['aria-label', withLabel ? undefined : text(o['aria-label'] || 'Modo escuro')],
    ['checked', o.checked ? 'true' : undefined],
    ['disabled', o.disabled ? 'true' : undefined],
    ['size', o.size && o.size !== 'default' ? text(o.size) : undefined],
    ['class', o.class ? text(o.class) : undefined],
    ['onCheckedChange', expressao(o.onCheckedChange)],
  ]);
}

/**
 * A chamada real de `createSwitch`, com o par canônico Switch + Label.
 *
 * O controle não tem filho nenhum: quem o nomeia é um `<label for>` apontando
 * para o `id`, e o rótulo descreve o estado ATIVO da função. O rótulo vem de
 * `createLabel`, que é design system, e não de um `rotulo()` que só existe
 * dentro do arquivo de story.
 */
export function switchSnippet(o: SwitchSnippetOptions = {}): string {
  const label = o.label === undefined ? LABEL_DEFAULT : o.label;
  const withLabel = Boolean(label);
  const id = o.id ?? ID_DEFAULT;
  const lines = controlLines(o, id, withLabel);

  if (!withLabel) {
    return snippet(
      importing('switch', 'createSwitch'),
      `const controle = ${chamada('createSwitch', lines)};`,
      montar('controle'),
    );
  }

  return snippet(
    [importing('switch', 'createSwitch'), importing('label', 'createLabel')].join('\n'),
    `const controle = ${chamada('createSwitch', lines)};
const rotulo = createLabel({ htmlFor: ${text(id)}, text: ${text(label)} });`,
    `const linha = document.createElement('div');
linha.className = 'nds-cluster';
linha.dataset.spacing = 'sm';
linha.append(controle, rotulo);`,
    montar('linha'),
  );
}

/** Um item da lista de preferências: rótulo, texto auxiliar e o controle. */
export type SwitchPanelItem = {
  id: string;
  label: string;
  description: string;
  checked?: boolean;
};

/**
 * Switch em painel: rótulo e descrição à esquerda, controle à direita.
 *
 * Só o rótulo nomeia o controle — a descrição fica como texto auxiliar, fora do
 * nome acessível. É a forma das listas de preferências, e o agrupador é o
 * `nds-cluster` do design system.
 */
export function switchPanelSnippet(items: SwitchPanelItem[]): string {
  const body =
    items.length === 1
      ? umPanelBody(items[0])
      : `const preferencias = [
${items
  .map(
    (i) =>
      `  { id: ${text(i.id)}, label: ${text(i.label)}, description: ${text(i.description)}${
        // `false` é o padrão da fábrica: repeti-lo item a item não ensina nada.
        i.checked ? ', checked: true' : ''
      } },`,
  )
  .join('\n')}
];

const lista = document.createElement('div');
lista.className = 'nds-stack';
lista.dataset.spacing = 'sm';

preferencias.forEach(({ id, label, description, checked }) => {
  const painel = document.createElement('div');
  painel.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-4';
  painel.dataset.align = 'center';
  painel.dataset.justify = 'between';

  const textos = document.createElement('div');
  textos.className = 'nds-stack nds-pr-4';
  textos.dataset.spacing = 'xs';

  const auxiliar = document.createElement('p');
  auxiliar.className = 'nds-text-body';
  auxiliar.textContent = description;

  textos.append(createLabel({ htmlFor: id, text: label }), auxiliar);
  painel.append(textos, createSwitch({ id, checked }));
  lista.append(painel);
});`;

  return snippet(
    [importing('switch', 'createSwitch'), importing('label', 'createLabel')].join('\n'),
    body,
    montar(items.length === 1 ? 'painel' : 'lista'),
  );
}

function umPanelBody(item: SwitchPanelItem): string {
  return `const painel = document.createElement('div');
painel.className = 'nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4';
painel.dataset.align = 'center';
painel.dataset.justify = 'between';

const textos = document.createElement('div');
textos.className = 'nds-stack nds-pr-4';
textos.dataset.spacing = 'xs';

const auxiliar = document.createElement('p');
auxiliar.className = 'nds-text-body';
auxiliar.textContent = ${text(item.description)};

textos.append(createLabel({ htmlFor: ${text(item.id)}, text: ${text(item.label)} }), auxiliar);
painel.append(textos, ${chamada('createSwitch', options([['id', text(item.id)], ['checked', item.checked ? 'true' : undefined]]))});`;
}

/** Transform de story para o painel com descrição / lista de preferências. */
export function switchSourcePanel(items: SwitchPanelItem[]): SourceTransform<SwitchSnippetOptions> {
  return () => switchPanelSnippet(items);
}

/**
 * Envio em formulário.
 *
 * A fábrica não emite campo oculto próprio — o `<button role="switch">` não é um
 * campo de formulário. O estado vai para um `<input type="hidden">` pelo
 * callback de mudança, que é o caminho documentado desta stack.
 */
export function switchFormSnippet(
  o: { id?: string; label?: string; name?: string; checked?: boolean } = {},
): string {
  const id = o.id ?? 'newsletter';
  const name = o.name ?? 'newsletter';
  const label = o.label ?? 'Aceitar newsletter semanal';
  const checked = o.checked ?? true;

  return snippet(
    [
      importing('switch', 'createSwitch'),
      importing('label', 'createLabel'),
      importing('button', 'createButton'),
    ].join('\n'),
    `const formulario = document.createElement('form');
formulario.className = 'nds-stack';
formulario.dataset.spacing = 'sm';

const oculto = document.createElement('input');
oculto.type = 'hidden';
oculto.name = ${text(name)};
oculto.value = ${text(checked ? 'on' : 'off')};

const controle = createSwitch({
  id: ${text(id)},
  checked: ${checked ? 'true' : 'false'},
  onCheckedChange: (ligado) => { oculto.value = ligado ? 'on' : 'off'; },
});

const linha = document.createElement('div');
linha.className = 'nds-cluster';
linha.dataset.spacing = 'sm';
linha.append(controle, createLabel({ htmlFor: ${text(id)}, text: ${text(label)} }));

formulario.append(linha, oculto, createButton({ type: 'submit', label: 'Salvar preferências' }));`,
    montar('formulario'),
  );
}

/** Transform de story para o envio em formulário. */
export function switchSourceForm(
  o: { id?: string; label?: string; name?: string; checked?: boolean } = {},
): SourceTransform<SwitchSnippetOptions> {
  return () => switchFormSnippet(o);
}

/**
 * Switch inválido.
 *
 * O anel vermelho é da regra `.nds-switch[aria-invalid="true"]` da folha
 * compartilhada — o snippet marca o atributo e aponta a mensagem, e não pinta
 * nada por conta própria.
 */
export function switchInvalidoSnippet(
  o: { id?: string; label?: string; mensagem?: string } = {},
): string {
  const id = o.id ?? 'aceitar-termos';
  const label = o.label ?? 'Aceitar termos de uso';
  const mensagem = o.mensagem ?? 'Você precisa ativar esta opção para continuar.';

  return snippet(
    [importing('switch', 'createSwitch'), importing('label', 'createLabel')].join('\n'),
    `const controle = createSwitch({ id: ${text(id)} });
controle.setAttribute('aria-invalid', 'true');
controle.setAttribute('aria-describedby', ${text(`${id}-msg`)});`,
    `const linha = document.createElement('div');
linha.className = 'nds-cluster';
linha.dataset.spacing = 'sm';
linha.append(controle, createLabel({ htmlFor: ${text(id)}, text: ${text(label)} }));

const mensagem = document.createElement('p');
mensagem.id = ${text(`${id}-msg`)};
mensagem.className = 'nds-text-body nds-text-destructive';
mensagem.textContent = ${text(mensagem)};

const grupo = document.createElement('div');
grupo.className = 'nds-stack';
grupo.dataset.spacing = 'xs';
grupo.append(linha, mensagem);`,
    montar('grupo'),
  );
}

/** Transform de story para o estado inválido. */
export const switchSourceInvalido: SourceTransform<SwitchSnippetOptions> = () =>
  switchInvalidoSnippet();

/** Transform do `meta` — vale para todas as stories do arquivo. */
export const switchSource: SourceTransform<SwitchSnippetOptions> = (_gerado, ctx) =>
  switchSnippet(ctx.args ?? {});

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function switchSourceWith(fixas: SwitchSnippetOptions): SourceTransform<SwitchSnippetOptions> {
  return (_gerado, ctx) => switchSnippet({ ...ctx.args, ...fixas });
}
