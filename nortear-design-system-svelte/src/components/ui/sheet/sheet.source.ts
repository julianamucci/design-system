/**
 * Transforms do painel Code do Sheet.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Sem elas o painel montava a tag pelo nome interno
 * do componente compilado — o andaime da story, que ninguém pode importar.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type SheetArgs = {
  /** Ausente = painel não controlado, que é como o gatilho sozinho o abre. */
  open?: boolean;
  side: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  cancelLabel: string;
};

/**
 * Corpo entre cabeçalho e rodapé. `nenhum` é o painel só de decisão.
 *
 * `navegacao` é o único que dispensa o rodapé: um menu não tem o que confirmar,
 * e a saída dele é o X do canto — é o que as outras quatro stacks já mostram.
 */
type Body = 'nenhum' | 'formulario' | 'rolagem' | 'navegacao';

type Options = Partial<SheetArgs> & { body?: Body };

const DEFAULT: SheetArgs & { body: Body } = {
  side: 'right',
  showCloseButton: true,
  triggerLabel: 'Abrir filtros',
  title: 'Filtros avançados',
  description: 'Configure os filtros para refinar os resultados.',
  actionLabel: 'Aplicar filtros',
  cancelLabel: 'Cancelar',
  body: 'nenhum',
};

/** Peças do design system que a composição usa, na ordem em que se lê o painel. */
function imports(body: Body): string {
  const parts = [
    'Sheet',
    body !== 'nenhum' ? 'SheetBody' : '',
    'SheetClose',
    'SheetContent',
    'SheetDescription',
    'SheetFooter',
    'SheetHeader',
    'SheetTitle',
    'SheetTrigger',
  ].filter(Boolean);

  const extras = [`import { Button } from "@/components/ui/button";`];
  if (body === 'formulario') {
    extras.push(`import { Input } from "@/components/ui/input";`);
    extras.push(`import { Label } from "@/components/ui/label";`);
  }

  return `import {
${parts.map((p) => `  ${p},`).join('\n')}
} from "@/components/ui/sheet";
${extras.join('\n')}`;
}

/** Corpo rolável ou formulário, indentado para dentro do conteúdo. */
function panelBody(body: Body): string {
  if (body === 'formulario') {
    return `
    <SheetBody>
      <form class="nds-grid" data-spacing="sm">
        <div class="nds-grid" data-spacing="xs">
          <Label for="sheet-nome">Nome</Label>
          <Input id="sheet-nome" value="Maria Silva" />
        </div>
        <div class="nds-grid" data-spacing="xs">
          <Label for="sheet-email">Email</Label>
          <Input id="sheet-email" type="email" value="maria@exemplo.com" />
        </div>
      </form>
    </SheetBody>
`;
  }
  if (body === 'navegacao') {
    return `
    <SheetBody>
      <nav aria-label="Navegação secundária" class="nds-stack" data-spacing="xs">
        {#each secoes as secao (secao)}
          <a
            href="#{secao.toLowerCase()}"
            class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent"
          >{secao}</a>
        {/each}
      </nav>
    </SheetBody>
`;
  }
  if (body === 'rolagem') {
    // O corpo é peça do componente: o SheetBody já traz o overflow, o flex que
    // segura o rodapé e o tabindex que a região rolável exige (WCAG 2.1.1).
    return `
    <SheetBody class="nds-stack nds-text-body nds-text-muted-foreground" data-spacing="sm">
      {#each paragrafos as paragrafo (paragrafo)}
        <p>{paragrafo}</p>
      {/each}
    </SheetBody>
`;
  }
  return '';
}

/** Composição completa do painel. */
function panel(o: Options): string {
  const {
    open,
    side,
    showCloseButton,
    triggerLabel,
    title,
    description,
    actionLabel,
    cancelLabel,
    body,
  } = { ...DEFAULT, ...o };

  // `open` ausente é o painel NÃO controlado: o gatilho abre e fecha sozinho, e
  // é a forma mais curta de usar o componente. Presente, o estado é de quem
  // monta o painel — e continua voltando para lá a cada fechamento.
  const controlled = open !== undefined;
  const state = controlled ? `\n\nlet open = $state(${open});` : '';
  const secoesList =
    body === 'navegacao'
      ? `\n\nconst secoes = ['Dashboard', 'Projetos', 'Equipe', 'Configurações'];`
      : '';
  const paragrafosList =
    body === 'rolagem'
      ? `\n\nconst paragrafos = Array.from(
  { length: 14 },
  (_, i) => \`Parágrafo \${i + 1}: conteúdo extenso, mais alto que o painel.\`,
);`
      : '';

  // Menu não confirma nada: sem rodapé, a saída é o X do canto.
  const footerBlock =
    body === 'navegacao'
      ? ''
      : `    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${cancelLabel}</Button>
        {/snippet}
      </SheetClose>
      <Button>${actionLabel}</Button>
    </SheetFooter>
`;

  return svelteSnippet(
    `${imports(body)}${state}${secoesList}${paragrafosList}`,
    `<Sheet${attrs(controlled ? 'bind:open' : '')}>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent${attrs(`side="${side}"`, showCloseButton ? '' : 'showCloseButton={false}')}>
    <SheetHeader>
      <SheetTitle>${title}</SheetTitle>
      <SheetDescription>${description}</SheetDescription>
    </SheetHeader>
${panelBody(body)}${footerBlock}  </SheetContent>
</Sheet>`,
  );
}

/**
 * Playground, as quatro direções e os estados: todas essas stories declaram
 * `args`, e é deles que sai o snippet — direção, botão do canto, textos e o
 * estado externo quando existe.
 */
export function sheetSource(_gerado?: string, ctx?: { args?: Partial<SheetArgs> }): string {
  return panel(ctx?.args ?? {});
}

/** Composição: filtros avançados, com formulário no corpo do painel. */
export function sheetFiltersAvancadosSource(): string {
  return panel({
    open: true,
    body: 'formulario',
    triggerLabel: 'Filtros avançados',
    title: 'Filtros avançados',
    description: 'Refine os resultados configurando os filtros abaixo.',
  });
}

/** Composição: edição de perfil — mesmo formulário, outra decisão no rodapé. */
export function perfilSheetEditSource(): string {
  return panel({
    open: true,
    body: 'formulario',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seu nome e e-mail. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
  });
}

/** Composição: texto mais alto que o painel — o corpo rola, o rodapé fica. */
export function sheetTermosWithScrollSource(): string {
  return panel({
    open: true,
    body: 'rolagem',
    triggerLabel: 'Ver termos',
    title: 'Termos e condições',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  });
}

/** Composição: navegação secundária à esquerda, sem rodapé. */
export function sheetNavegacaoSecundariaSource(): string {
  return panel({
    open: true,
    side: 'left',
    body: 'navegacao',
    triggerLabel: 'Abrir menu',
    title: 'Menu',
    description: 'Navegue entre as áreas do sistema.',
  });
}
