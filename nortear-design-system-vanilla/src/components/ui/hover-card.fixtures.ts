// Fixture compartilhada pelas stories do HoverCard.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado é lido como
// story: uma função auxiliar exportada de dentro de um `*.stories.ts` viraria
// uma story em PascalCase que não renderiza nada.

// ─── Markup repetido ──────────────────────────────────────────────────────────
//
// O gatilho mora DENTRO de uma frase, que é o uso canônico (uma menção no meio
// de um texto) e também o que mantém o `target-size` da WCAG 2.5.8 satisfeito:
// o axe dispensa alvos em linha dentro de um bloco de texto — um link solto de
// 20px de altura seria violação.

export const CLASSES_TRIGGER_LINK = 'nds-text-primary nds-font-medium nds-hover-underline';

/** Gatilho que NÃO navega (termo, métrica): botão sem moldura e cursor de ajuda. */
export const CLASSES_TRIGGER_BUTTON =
  'nds-text-primary nds-text-body nds-font-medium nds-underline-dotted nds-cursor-help nds-bg-transparent nds-border-none nds-p-0';

export function construirLink(label: string, href = '/users/joana'): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.className = CLASSES_TRIGGER_LINK;
  a.textContent = label;
  return a;
}

export function construirButton(label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = CLASSES_TRIGGER_BUTTON;
  b.textContent = label;
  return b;
}

/**
 * Envolve o cartão numa FRASE, como nas outras quatro stacks.
 *
 * `antes` e `depois` são o texto que cerca o gatilho — sem eles o alvo em linha
 * viraria um link solto, e é justamente o cerco que o dispensa do mínimo de
 * 24px da WCAG 2.5.8.
 */
export function emFrase(cartao: HTMLElement, antes: string, depois: string): HTMLElement {
  const p = document.createElement('p');
  p.className = 'nds-text-body nds-max-w-sm nds-min-h-50';
  // `contain` é mecânica de layout, não valor de design: mantém o portal fora
  // do fluxo do canvas sem sair do tema nem da escala.
  p.style.contain = 'layout';
  p.append(document.createTextNode(`${antes} `), cartao, document.createTextNode(` ${depois}`));
  return p;
}

/** Cartão de perfil — avatar, nome e uma métrica curta. */
export function construirCartaoPerfil(): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-cluster';
  root.dataset.spacing = 'sm';
  root.dataset.align = 'start';

  const avatar = document.createElement('div');
  avatar.className =
    'nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium';
  avatar.dataset.align = 'center';
  avatar.dataset.justify = 'center';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'JS';

  const info = document.createElement('div');
  info.className = 'nds-stack';
  info.dataset.spacing = 'xs';

  const name = document.createElement('p');
  name.className = 'nds-text-body nds-font-medium nds-leading-none';
  name.textContent = 'Joana Silva';

  const meta = document.createElement('p');
  meta.className = 'nds-text-caption nds-text-muted-foreground';
  meta.textContent = 'Designer · 142 seguidores';

  info.append(name, meta);
  root.append(avatar, info);
  return root;
}

/** Bloco de duas linhas — título em destaque e uma frase de apoio. */
export function construirDuasLines(title: string, helper: string): HTMLElement {
  const root = document.createElement('div');
  root.className = 'nds-stack';
  root.dataset.spacing = 'xs';

  const t = document.createElement('p');
  t.className = 'nds-text-body nds-font-medium nds-leading-none';
  t.textContent = title;

  const a = document.createElement('p');
  a.className = 'nds-text-caption nds-text-muted-foreground';
  a.textContent = helper;

  root.append(t, a);
  return root;
}
