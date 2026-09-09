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
 * `texto` é o corpo do exemplo canônico — um parágrafo entre o cabeçalho e o
 * rodapé — e é o default: o snippet tem de descrever o painel que a story
 * renderiza, e o painel sem corpo esconde justamente a área que rola.
 *
 * `navegacao` é o único que dispensa o rodapé: um menu não tem o que confirmar,
 * e a saída dele é o X do canto — é o que as outras quatro stacks já mostram.
 */
type Body = 'nenhum' | 'texto' | 'formulario' | 'perfil' | 'rolagem' | 'navegacao' | 'acoes';

type Options = Partial<SheetArgs> & {
  body?: Body;
  /**
   * Nível do cabeçalho do título. Ausente, o snippet não escreve nível nenhum.
   */
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

const DEFAULT: SheetArgs & { body: Body } = {
  side: 'right',
  showCloseButton: true,
  triggerLabel: 'Abrir filtros',
  title: 'Filtros avançados',
  description: 'Configure os filtros para refinar os resultados.',
  actionLabel: 'Aplicar filtros',
  cancelLabel: 'Cancelar',
  body: 'texto',
};

/** Peças do design system que a composição usa, na ordem em que se lê o painel. */
function imports(body: Body): string {
  // O menu não tem rodapé, e por isso não importa as peças dele: import morto
  // no exemplo é a linha que quem copia apaga depois de descobrir sozinho.
  const withoutFooter = body === 'navegacao';
  const parts = [
    'Sheet',
    body !== 'nenhum' ? 'SheetBody' : '',
    withoutFooter ? '' : 'SheetClose',
    'SheetContent',
    'SheetDescription',
    withoutFooter ? '' : 'SheetFooter',
    'SheetHeader',
    'SheetTitle',
    'SheetTrigger',
  ].filter(Boolean);

  const extras = [`import { Button } from "@/components/ui/button";`];
  if (body === 'formulario' || body === 'perfil') {
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
  if (body === 'texto') {
    return `
    <SheetBody>
      <p class="nds-text-body nds-text-muted-foreground">
        Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola quando o
        conteúdo passa da altura da tela.
      </p>
    </SheetBody>
`;
  }
  if (body === 'formulario') {
    // Empilhamento, e não grade: é o que a folha compartilhada define para
    // formulário de painel, e o que o Vanilla renderiza.
    //
    // Os campos são os de `variants.compositions.advancedFilters` — Categoria e
    // Preço mínimo. Aqui moravam Nome e Email, que o conteúdo não descreve em
    // composição nenhuma: o snippet ensinava um formulário e a docs page, outro.
    return `
    <SheetBody>
      <form id="filters" class="nds-stack" data-spacing="sm" onsubmit={handleSubmit}>
        <div class="nds-stack" data-spacing="xs">
          <Label for="sheet-categoria">Categoria</Label>
          <Input id="sheet-categoria" value="Eletrônicos" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="sheet-minimo">Preço mínimo</Label>
          <Input id="sheet-minimo" type="number" value="100" />
        </div>
      </form>
    </SheetBody>
`;
  }
  if (body === 'perfil') {
    // Três campos, na ordem das outras stacks: Nome, Nome de usuário, Bio. O
    // formulário genérico de filtros tem dois, e a edição de perfil deixava o
    // do meio de fora quando os dois compartilhavam o mesmo corpo.
    return `
    <SheetBody>
      <form id="profile" class="nds-stack" data-spacing="sm" onsubmit={handleSubmit}>
        <div class="nds-stack" data-spacing="xs">
          <Label for="perfil-nome">Nome</Label>
          <Input id="perfil-nome" value="Juliana Mucci" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="perfil-usuario">Nome de usuário</Label>
          <Input id="perfil-usuario" value="@julianamucci" />
        </div>
        <div class="nds-stack" data-spacing="xs">
          <Label for="perfil-bio">Bio</Label>
          <Input id="perfil-bio" value="Designer de sistemas em São Paulo" />
        </div>
      </form>
    </SheetBody>
`;
  }
  if (body === 'acoes') {
    // Fileira de ações no lugar de formulário: a decisão é a própria ação
    // clicada, e por isso o rodapé só oferece a saída.
    return `
    <SheetBody>
      <div class="nds-cluster" data-spacing="md">
        {#each acoes as acao (acao.label)}
          <Button variant={acao.variant}>{acao.label}</Button>
        {/each}
      </div>
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

/**
 * Título do painel, com o nível de cabeçalho quando ele é pedido.
 *
 * A delegação vai pelo snippet `child`: nesta lib o `level` sozinho troca o
 * `aria-level` e mantém a TAG em `div`. Os dois andam juntos para a tag e o
 * ARIA concordarem. Sem nível pedido nada disso é escrito — valor padrão não
 * se escreve num exemplo que alguém copia.
 */
function panelTitle(title: string, level?: 1 | 2 | 3 | 4 | 5 | 6): string {
  if (!level) return `<SheetTitle>${title}</SheetTitle>`;
  return `<SheetTitle level={${level}}>
        {#snippet child({ props })}
          <h${level} {...props}>${title}</h${level}>
        {/snippet}
      </SheetTitle>`;
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
    titleLevel,
  } = { ...DEFAULT, ...o };

  // `open` ausente é o painel NÃO controlado: o gatilho abre e fecha sozinho, e
  // é a forma mais curta de usar o componente. Presente, o estado é de quem
  // monta o painel — e continua voltando para lá a cada fechamento.
  const controlled = open !== undefined;
  const state = controlled ? `\n\nlet open = $state(${open});` : '';
  // As CINCO seções: o conteúdo compartilhado descreve a lista, e uma stack com
  // quatro documentava uma composição que não existe.
  const secoesList =
    body === 'navegacao'
      ? `\n\nconst secoes = ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'];`
      : '';
  const acoesList =
    body === 'acoes'
      ? `\n\nconst acoes = [
  { label: 'Compartilhar', variant: 'outline' },
  { label: 'Duplicar', variant: 'outline' },
  { label: 'Excluir', variant: 'destructive' },
];`
      : '';
  // Id do `<form>` do corpo, quando há um. O rodapé é IRMÃO do corpo rolável por
  // construção do primitivo — é o que o mantém visível enquanto o formulário
  // rola —, então a ação primária nunca está dentro do `<form>`: sem
  // `type="submit"` e sem o atributo `form` ela é um botão comum, e o painel
  // fica com formulário e NENHUMA forma de submeter. Com dois ou mais campos o
  // navegador não faz o envio implícito, e o Enter num campo não dispara nada.
  const formId = body === 'formulario' ? 'filters' : body === 'perfil' ? 'profile' : undefined;
  const envioBlock = formId
    ? `\n\n// O preview vive dentro de uma página: sem a guarda, o Enter num campo
// tentaria navegar. Aqui é onde o envio de verdade entraria.
function handleSubmit(evento: SubmitEvent) {
  evento.preventDefault();
}`
    : '';
  const paragrafosList =
    body === 'rolagem'
      ? `\n\nconst paragrafos = Array.from(
  { length: 14 },
  (_, i) => \`Parágrafo \${i + 1}: conteúdo extenso, mais alto que o painel.\`,
);`
      : '';

  // Menu não confirma nada: sem rodapé, a saída é o X do canto.
  //
  // A fileira de ações fica no meio-termo: tem rodapé, mas só com a saída — a
  // decisão já foi tomada no corpo, e repetir uma confirmação ali diria que
  // falta um passo que não existe.
  const footerBlock =
    body === 'navegacao'
      ? ''
      : body === 'acoes'
        ? `    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${cancelLabel}</Button>
        {/snippet}
      </SheetClose>
    </SheetFooter>
`
        : `    <SheetFooter>
      <SheetClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>${cancelLabel}</Button>
        {/snippet}
      </SheetClose>
      ${
        formId
          ? `<Button type="submit" form="${formId}">${actionLabel}</Button>`
          : `<Button>${actionLabel}</Button>`
      }
    </SheetFooter>
`;

  return svelteSnippet(
    `${imports(body)}${state}${envioBlock}${secoesList}${acoesList}${paragrafosList}`,
    `<Sheet${attrs(controlled ? 'bind:open' : '')}>
  <SheetTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${triggerLabel}</Button>
    {/snippet}
  </SheetTrigger>
  <SheetContent${attrs(`side="${side}"`, showCloseButton ? '' : 'showCloseButton={false}')}>
    <SheetHeader>
      ${panelTitle(title, titleLevel)}
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

/**
 * Painel aberto de dentro de uma seção que já está em `h2`: o título pede `h3`.
 *
 * A única diferença para a forma canônica é o nível do cabeçalho.
 */
export function sheetHeadingH3Source(): string {
  return panel({ open: true, titleLevel: 3 });
}

/** Composição: filtros avançados, com formulário no corpo do painel. */
export function sheetFiltersAvancadosSource(): string {
  return panel({
    open: true,
    body: 'formulario',
    // O gatilho diz o que o clique FAZ, e o título diz onde a pessoa chegou:
    // repetir "Filtros avançados" nos dois apagava a diferença. Os dois textos
    // são os de `demonstration.labels`, como nas outras stacks.
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
  });
}

/** Composição: edição de perfil — mesmo formulário, outra decisão no rodapé. */
export function perfilSheetEditSource(): string {
  return panel({
    open: true,
    body: 'perfil',
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
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

/**
 * Composição: painel inferior com uma fileira de ações no corpo.
 *
 * O mesmo desenho do Drawer em tela estreita, sem o gesto de arrastar — quando
 * o gesto faz parte da interação esperada, o componente é o Drawer.
 */
export function sheetBottomPanelSource(): string {
  return panel({
    open: true,
    side: 'bottom',
    body: 'acoes',
    triggerLabel: 'Abrir ações',
    title: 'Ações rápidas',
    description: 'Escolha uma das ações disponíveis para este item.',
    cancelLabel: 'Fechar',
  });
}
