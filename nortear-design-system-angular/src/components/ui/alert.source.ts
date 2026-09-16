/**
 * Transforms do painel Code do Alert.
 *
 * Módulo próprio, e não função solta no arquivo de story, porque é o que põe
 * estes construtores sob o `source-snippets.test.ts`: aquela guarda varre
 * `./**\/*.source.ts` por glob e CHAMA cada export para ler a saída. Construtor
 * inline é função local — nem exportada, nem alcançável —, então o que ele
 * publica ao leitor não tem portão nenhum.
 *
 * Um construtor por story, chamável SEM argumento. Só o que difere do padrão
 * aparece escrito: `variant`, `role` e `dismissLabel` somem quando estão no
 * default, porque snippet que repete valor padrão ensina ruído a quem copia.
 *
 * O FECHAMENTO é a forma que mais engana. O `NdsAlert` não remove o próprio
 * host — ao fechar ele grava `hidden` e emite `(dismiss)`. Quem tira o nó do
 * DOM é o consumidor, com um `@if` sobre um signal que o `(dismiss)` desliga. As
 * stories remontam o alerta por `@for` para o canvas não terminar vazio; isso é
 * andaime de story e não entra aqui.
 */
import type { AlertIconKind, AlertRole, AlertVariant } from './alert';

export type AlertArgs = {
  variant: AlertVariant;
  role: AlertRole;
  dismissible: boolean;
  dismissLabel: string;
  title: string;
  description: string;
  onDismiss?: () => void;
};

/** Opções de UM alerta no template. */
type AlertMarkupOptions = {
  variant?: AlertVariant;
  role?: AlertRole;
  /** Omitido, acompanha a variante; `false` mostra o alerta sem ícone. */
  icon?: AlertIconKind | false;
  /** String vazia mostra a composição sem título. */
  title?: string;
  description?: string;
  className?: string;
  dismissible?: boolean;
  dismissLabel?: string;
  /** Rótulo do botão no slot de ação; omitido, sem ação. */
  action?: string;
};

/**
 * Nível do título, um só para todo snippet.
 *
 * No Angular o nível É o elemento — não existe prop de nível —, então quem
 * ensina a hierarquia é a tag escrita aqui. Tanto os cards da docs page quanto
 * as stories abrem num `h3`, então o título do alerta desce um degrau e fica em
 * `h4`. Não há opção para variar: o snippet tem de escrever a MESMA tag que a
 * story renderiza, e é isso que o `alert.source.test.ts` cobra nos dois lados.
 */
const TITLE_TAG = 'h4';

const TITLE_DEFAULT = 'Atenção';
const DESCRIPTION_DEFAULT = 'Suas alterações serão aplicadas na próxima sessão.';
const DISMISS_LABEL_DEFAULT = 'Fechar alerta';

/** Signal que o `@if` dos snippets de fechamento lê. */
const VISIBLE_MEMBER = '  readonly visible = signal(true);';

const IMPORT_SIGNAL = "import { signal } from '@angular/core';";
const IMPORT_BUTTON = "import { NdsButton } from '@/components/ui/button';";

/** `default` não tem cor semântica e recebe o informativo; `destructive` usa `error`. */
function variantIcon(variant: AlertVariant): AlertIconKind {
  if (variant === 'destructive') return 'error';
  if (variant === 'default') return 'info';
  return variant;
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}

/** Os nomes que o alerta usa, para o `imports` do componente e a linha de import. */
function alertNames(o: AlertMarkupOptions): string[] {
  const variant = o.variant ?? 'default';
  const icon = o.icon === undefined ? variantIcon(variant) : o.icon;
  const title = o.title ?? TITLE_DEFAULT;
  const names = ['NdsAlert'];
  if (title) names.push('NdsAlertTitle');
  names.push('NdsAlertDescription');
  if (o.action) names.push('NdsAlertAction');
  if (icon) names.push('NdsAlertIcon');
  return names;
}

/**
 * Um `<div ndsAlert>` com os filhos na ordem em que o leitor de tela os
 * encontra. Ícone SEM `.nds-icon`: `.nds-alert > svg` já dimensiona.
 *
 * Com `dismissible`, o alerta vem dentro de `@if (visible())` e o `(dismiss)`
 * desliga o signal — é o que tira o nó do DOM.
 */
function alertMarkup(o: AlertMarkupOptions = {}): string {
  const variant = o.variant ?? 'default';
  const icon = o.icon === undefined ? variantIcon(variant) : o.icon;
  const title = o.title ?? TITLE_DEFAULT;
  const description = o.description ?? DESCRIPTION_DEFAULT;

  const attrs = [
    variant === 'default' ? '' : `variant="${variant}"`,
    !o.role || o.role === 'alert' ? '' : `role="${o.role}"`,
    o.className ? `class="${o.className}"` : '',
    o.dismissible ? 'dismissible' : '',
    o.dismissible && o.dismissLabel && o.dismissLabel !== DISMISS_LABEL_DEFAULT
      ? `dismissLabel="${o.dismissLabel}"`
      : '',
    o.dismissible ? '(dismiss)="visible.set(false)"' : '',
  ].filter(Boolean);

  const children = [
    icon ? `<svg ndsAlertIcon kind="${icon}"></svg>` : '',
    title ? `<${TITLE_TAG} ndsAlertTitle>${title}</${TITLE_TAG}>` : '',
    `<section ndsAlertDescription>${description}</section>`,
    o.action
      ? `<div ndsAlertAction>\n  <button ndsButton variant="default" size="sm">${o.action}</button>\n</div>`
      : '',
  ].filter(Boolean);

  const open = attrs.length ? `<div ndsAlert ${attrs.join(' ')}>` : '<div ndsAlert>';
  const block = `${open}\n${indent(children.join('\n'), 2)}\n</div>`;
  return o.dismissible ? `@if (visible()) {\n${indent(block, 2)}\n}` : block;
}

/** Envelope de componente standalone, igual em todos os construtores. */
function example(
  names: string[],
  template: string,
  extras: { imports?: string[]; members?: string[] } = {},
): string {
  const alertNamesOnly = names.filter((n) => n.startsWith('NdsAlert'));
  const lines = [
    `import {\n  ${alertNamesOnly.join(', ')},\n} from '@/components/ui/alert';`,
    ...(extras.imports ?? []),
  ];
  const body = extras.members?.length ? `\n${extras.members.join('\n')}\n` : '';
  return `${lines.join('\n')}

@Component({
  imports: [${names.join(', ')}],
  template: \`
${indent(template, 4)}
  \`,
})
export class Example {${body}}`;
}

/** Exemplo de UM alerta — imports e membros derivados das opções. */
function singleAlertExample(o: AlertMarkupOptions): string {
  const names = alertNames(o);
  const imports: string[] = [];
  if (o.dismissible) imports.push(IMPORT_SIGNAL);
  if (o.action) {
    names.push('NdsButton');
    imports.push(IMPORT_BUTTON);
  }
  return example(names, alertMarkup(o), {
    imports,
    members: o.dismissible ? [VISIBLE_MEMBER] : [],
  });
}

/** Ação e botão de fechar no mesmo alerta — story e card da docs page. */
const ACTION_AND_DISMISS: AlertMarkupOptions = {
  title: 'Sessão expira em 5 minutos',
  description: 'Salve seu trabalho para não perder as alterações.',
  action: 'Salvar agora',
  dismissible: true,
};

// ─── Snippets de template (sem envelope) ──────────────────────────────────────
//
// A docs page mostra só a marcação, sem o `@Component` em volta.

/**
 * Card "Dispensável" da docs page: o `@if` sobre o `(dismiss)` é a peça.
 * Default + ícone informativo com o título e a descrição padrão — o mesmo texto
 * do preview do card (`infoTitle`/`infoDesc`), como nas outras stacks.
 */
export function alertDismissibleTemplateSnippet(): string {
  return alertMarkup({ dismissible: true });
}

/** Card "Ação e botão de fechar" da docs page. */
export function alertActionAndDismissTemplateSnippet(): string {
  return alertMarkup({ ...ACTION_AND_DISMISS });
}

// ─── Playground ───────────────────────────────────────────────────────────────

/** Transform do Playground — acompanha os controls. */
export function alertPlaygroundSource(
  _generated?: string,
  ctx: { args?: Partial<AlertArgs> } = {},
): string {
  const {
    variant = 'default',
    role = 'alert',
    dismissible = false,
    dismissLabel = DISMISS_LABEL_DEFAULT,
    title = TITLE_DEFAULT,
    description = DESCRIPTION_DEFAULT,
  } = ctx.args ?? {};
  // O Playground mostra o ícone informativo em qualquer variante, como a story.
  return singleAlertExample({
    variant: typeof variant === 'string' ? variant : 'default',
    role: typeof role === 'string' ? role : 'alert',
    icon: 'info',
    title,
    description,
    dismissible: dismissible === true,
    dismissLabel,
  });
}

// ─── Variantes ────────────────────────────────────────────────────────────────

export function alertDefaultSource(): string {
  return singleAlertExample({});
}

export function alertDestructiveSource(): string {
  return singleAlertExample({
    variant: 'destructive',
    title: 'Erro ao salvar',
    description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.',
  });
}

export function alertSuccessSource(): string {
  return singleAlertExample({
    variant: 'success',
    title: 'Perfil atualizado',
    description: 'Suas informações foram salvas com sucesso.',
  });
}

export function alertWarningSource(): string {
  return singleAlertExample({
    variant: 'warning',
    title: 'Assinatura expirando',
    description: 'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
  });
}

export function alertInfoSource(): string {
  return singleAlertExample({
    variant: 'info',
    title: 'Dica',
    description: 'Você pode fixar os filtros mais usados para acessá-los mais rápido.',
  });
}

/** Story `Dismissible` — o alerta sai do DOM pelo `@if` que o `(dismiss)` desliga. */
export function alertDismissibleSource(): string {
  return singleAlertExample({
    title: 'Preferências salvas',
    description: 'Você pode fechar este aviso quando quiser.',
    dismissible: true,
  });
}

/**
 * Story `DismissibleByKeyboard` — nada a configurar para o teclado: o X é botão
 * de verdade. O que muda é o rótulo acessível, que descreve o que se fecha.
 */
export function alertDismissibleByKeyboardSource(): string {
  return singleAlertExample({
    variant: 'success',
    title: 'Perfil atualizado',
    description: 'Suas informações foram salvas com sucesso.',
    dismissible: true,
    dismissLabel: 'Fechar confirmação',
  });
}

/** Story `Contrast` — as cinco variantes, só título e texto corrido. */
export function alertContrastSource(): string {
  const variants: AlertVariant[] = ['default', 'destructive', 'success', 'warning', 'info'];
  const blocks = variants.map((v) =>
    alertMarkup({
      variant: v,
      icon: false,
      title: `Título ${v}`,
      description: `Texto corrido da variante ${v}.`,
    }),
  );
  return example(
    ['NdsAlert', 'NdsAlertTitle', 'NdsAlertDescription'],
    `<div class="nds-stack" data-spacing="sm">\n${indent(blocks.join('\n'), 2)}\n</div>`,
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

export function alertCompleteSource(): string {
  return singleAlertExample({});
}

/** Sem título: não há input a desligar — o heading simplesmente não é escrito. */
export function alertWithoutTitleSource(): string {
  return singleAlertExample({ title: '' });
}

export function alertWithoutIconSource(): string {
  return singleAlertExample({ icon: false });
}

/**
 * Story `WithoutAnnouncement` — `note` não é live region; o segundo alerta,
 * sem `role` escrito, segue no padrão assertivo.
 */
export function alertWithoutAnnouncementSource(): string {
  const noteBlock = alertMarkup({
    role: 'note',
    title: 'Nota de implementação',
    description: 'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.',
  });
  const defaultBlock = alertMarkup({
    variant: 'destructive',
    title: 'Falha no envio',
    description: 'Mensagem urgente surgida em tempo de execução: anúncio imediato.',
  });
  return example(
    ['NdsAlert', 'NdsAlertTitle', 'NdsAlertDescription', 'NdsAlertIcon'],
    `<div class="nds-stack" data-spacing="md">\n${indent(`${noteBlock}\n${defaultBlock}`, 2)}\n</div>`,
  );
}

/**
 * Story `DynamicInsertion` — o alerta SURGE depois de uma ação, e o anúncio vem
 * do `role="alert"` da própria raiz. Nenhum contêiner `aria-live` em volta: ele
 * aninharia duas regiões vivas.
 */
export function alertDynamicInsertionSource(): string {
  const block = alertMarkup({
    icon: 'success',
    title: 'Operação concluída',
    description: 'O relatório foi gerado com sucesso.',
  });
  return example(
    ['NdsAlert', 'NdsAlertTitle', 'NdsAlertDescription', 'NdsAlertIcon', 'NdsButton'],
    `<button ndsButton variant="default" (click)="generated.set(true)">Gerar relatório</button>
@if (generated()) {
${indent(block, 2)}
}`,
    { imports: [IMPORT_SIGNAL, IMPORT_BUTTON], members: ['  readonly generated = signal(false);'] },
  );
}

// ─── Composições ──────────────────────────────────────────────────────────────

export function alertWithIconSource(): string {
  return singleAlertExample({
    title: 'Informação',
    description: 'Ícone SVG posicionado automaticamente.',
  });
}

export function alertWithActionSource(): string {
  return singleAlertExample({
    title: 'Atualização disponível',
    description: 'Uma nova versão está pronta para instalação.',
    action: 'Atualizar',
  });
}

/** A classe de quem usa SOMA às do design system em cada peça. */
export function alertAdditionalClassSource(): string {
  return example(
    ['NdsAlert', 'NdsAlertTitle', 'NdsAlertDescription', 'NdsAlertAction', 'NdsAlertIcon', 'NdsButton'],
    `<div ndsAlert class="nds-w-full">
  <svg ndsAlertIcon kind="info"></svg>
  <h4 ndsAlertTitle class="nds-w-full">Classe adicional</h4>
  <section ndsAlertDescription class="nds-w-full">A classe do consumidor convive com as do design system.</section>
  <div ndsAlertAction class="nds-w-auto">
    <button ndsButton variant="default" size="sm">Ação</button>
  </div>
</div>`,
    { imports: [IMPORT_BUTTON] },
  );
}

/** Composição `WithoutIcon` — coluna única é a ausência do ícone, não um input. */
export function alertLayoutWithoutIconSource(): string {
  return singleAlertExample({
    icon: false,
    title: 'Sem ícone',
    description: 'Alert sem ícone mantém layout de coluna única.',
  });
}

/**
 * Story `WithActionAndDismiss` — ação e botão de fechar no mesmo alerta. A ação
 * é a terceira coluna do grid e o X segue na calha dele; não há input para isso.
 */
export function alertWithActionAndDismissSource(): string {
  return singleAlertExample(ACTION_AND_DISMISS);
}
