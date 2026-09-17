/**
 * Transforms do painel Code do Popover.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. Todas as stories do componente passam os seus
 * valores por `args`, então a transform do meta cascateia e monta a composição
 * certa a partir deles — não há override por story aqui.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type PopoverArgs = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  /** Deslocamento no eixo do ALINHAMENTO. O `sideOffset` é o eixo principal. */
  alignOffset: number;
  /** Modo modal — foco preso, rolagem travada, `aria-modal`. Os três juntos. */
  modal: boolean;
  /** Abre já na montagem. No snippet vira estado local com `bind:open`. */
  defaultOpen: boolean;
  open: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  saveLabel: string;
  cancelLabel: string;
  nameLabel: string;
  emailLabel: string;
  submitLabel: string;
  variant:
    | 'default'
    | 'withTitle'
    | 'form'
    | 'tableFilter'
    | 'colorPicker'
    | 'quickSettings'
    | 'options';
  /**
   * Nome acessível declarado do painel, para a composição SEM título. Com
   * título quem nomeia é o `aria-labelledby`, e o rótulo não entra no snippet.
   */
  panelLabel?: string;
};

/** Monta o `import` do design system com uma peça por linha. */
function importDoPopover(names: string[]): string {
  return `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from "@/components/ui/popover";`;
}

const HEADER = ['PopoverHeader', 'PopoverTitle', 'PopoverDescription'];

function header(title: string, description: string): string {
  // Sem descrição, a linha e o import saem juntos (ver `popoverSource`): o
  // painel da `Focused` é só título e ações.
  const descriptionLine = description
    ? `
      <PopoverDescription>${description}</PopoverDescription>`
    : '';
  return `    <PopoverHeader>
      <PopoverTitle>${title}</PopoverTitle>${descriptionLine}
    </PopoverHeader>`;
}

/**
 * Botão que fecha o painel por dentro — o único papel do `PopoverClose`.
 * Sempre `ghost`: a ação secundária não disputa peso com o botão primário do
 * rodapé, e é essa a variante que a story renderiza.
 *
 * DESISTIR é o que a peça de fechar representa, e só o Cancelar entra aqui. O
 * botão de confirmação fecha por CÓDIGO (`open = false`), porque é a diferença
 * entre os dois caminhos que separa "desistiu" de "concluiu" no relatório: pela
 * peça, o fechamento é reportado como `close-button`; por código, como `api`.
 */
function close(label: string, indentacao: string): string {
  return `${indentacao}<PopoverClose>
${indentacao}  {#snippet child({ props })}
${indentacao}    <Button variant="ghost" size="sm" {...props}>${label}</Button>
${indentacao}  {/snippet}
${indentacao}</PopoverClose>`;
}

type Part = {
  /** Nomes vindos de `@/components/ui/popover`, além dos três da base. */
  names: string[];
  /** Linhas de import de outros componentes do design system. */
  externos: string[];
  /** Estado local que a composição exige (`$state`, handlers). */
  state: string;
  /** Conteúdo do `PopoverContent`, já indentado em 4 espaços. */
  markup: string;
  /**
   * A composição tem botão de CONFIRMAÇÃO, e ele fecha o painel por código —
   * o que exige `bind:open` e o `$state` de abertura no snippet, mesmo quando
   * o painel não nasce aberto.
   */
  fechaPorCodigo: boolean;
};

function part(a: PopoverArgs): Part {
  const head = header(a.title, a.description);

  if (a.variant === 'default') {
    return {
      names: [],
      externos: [],
      state: '',
      markup: `    <p>${a.description}</p>`,
      fechaPorCodigo: false,
    };
  }

  if (a.variant === 'form') {
    return {
      names: [...HEADER, 'PopoverClose'],
      externos: [
        `import { Button } from "@/components/ui/button";`,
        `import { Input } from "@/components/ui/input";`,
        `import { Label } from "@/components/ui/label";`,
      ],
      state: `let nome = $state("Ana Ribeiro");
let email = $state("ana@nortear.com.br");

function salvar(evento: SubmitEvent) {
  // Fechar no clique do botão cancelaria o submit: o fechamento vai no
  // \`submit\`, depois do \`preventDefault\` — salvou, e só então fechou.
  evento.preventDefault();
  open = false;
}`,
      markup: `${head}
    <form class="nds-stack" data-spacing="md" onsubmit={salvar}>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-nome">${a.nameLabel}</Label>
        <Input id="perfil-nome" bind:value={nome} />
      </div>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-email">${a.emailLabel}</Label>
        <Input id="perfil-email" type="email" bind:value={email} />
      </div>
      <div class="nds-cluster" data-justify="end" data-spacing="sm">
${close(a.cancelLabel, '        ')}
        <Button type="submit" size="sm">${a.submitLabel}</Button>
      </div>
    </form>`,
      fechaPorCodigo: true,
    };
  }

  if (a.variant === 'tableFilter') {
    return {
      names: HEADER,
      externos: [`import { Button } from "@/components/ui/button";`],
      state: `function aplicar() {
  // Aplicar É a decisão: fecha por código, e o motivo do fechamento chega como
  // \`api\`. Dentro de \`PopoverClose\` chegaria como \`close-button\`.
  open = false;
}`,
      markup: `${head}
    <div class="nds-stack nds-text-body" data-spacing="xs">
      <label class="nds-cluster" data-spacing="sm">
        <input type="checkbox" class="nds-size-4" checked />
        <span>Ativo</span>
      </label>
      <label class="nds-cluster" data-spacing="sm">
        <input type="checkbox" class="nds-size-4" />
        <span>Pendente</span>
      </label>
      <label class="nds-cluster" data-spacing="sm">
        <input type="checkbox" class="nds-size-4" />
        <span>Arquivado</span>
      </label>
    </div>
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm" onclick={aplicar}>Aplicar</Button>
    </div>`,
      fechaPorCodigo: true,
    };
  }

  if (a.variant === 'colorPicker') {
    // Cada amostra escrita por extenso, com nome acessível próprio: a cor não é
    // o nome, e sem `aria-label` o botão fica sem nome nenhum.
    return {
      names: HEADER,
      externos: [],
      state: '',
      markup: `${head}
    <div class="nds-cluster" data-spacing="sm">
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-primary" aria-label="Primária"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-secondary" aria-label="Secundária"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-success" aria-label="Sucesso"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-warning" aria-label="Atenção"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-info" aria-label="Informação"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-destructive" aria-label="Destrutiva"></button>
    </div>`,
      fechaPorCodigo: false,
    };
  }

  if (a.variant === 'options') {
    // Painel de opções: só caixas, sem rodapé de ação. É a composição que a
    // story do modo modal renderiza, e o que ela ensina é justamente que o
    // painel não precisa de botão nenhum para ter o que tabular — cada caixa
    // se basta, e marcar já é o efeito.
    return {
      names: HEADER,
      externos: [
        `import { Button } from "@/components/ui/button";`,
        `import { Checkbox } from "@/components/ui/checkbox";`,
        `import { Label } from "@/components/ui/label";`,
      ],
      state: `let remember = $state(true);
let emailNotice = $state(false);`,
      markup: `${head}
    <div class="nds-stack" data-spacing="sm">
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="popover-option-remember" bind:checked={remember} />
        <Label for="popover-option-remember">Lembrar minha escolha</Label>
      </div>
      <div class="nds-cluster" data-spacing="sm">
        <Checkbox id="popover-option-email" bind:checked={emailNotice} />
        <Label for="popover-option-email">Receber aviso por e-mail</Label>
      </div>
    </div>`,
      fechaPorCodigo: false,
    };
  }

  if (a.variant === 'quickSettings') {
    return {
      names: HEADER,
      externos: [],
      state: '',
      markup: `${head}
    <div class="nds-stack nds-text-body" data-spacing="sm">
      <label class="nds-cluster" data-align="center" data-justify="between">
        <span>Notificações</span>
        <input type="checkbox" class="nds-size-4" checked />
      </label>
      <label class="nds-cluster" data-align="center" data-justify="between">
        <span>Modo escuro</span>
        <input type="checkbox" class="nds-size-4" />
      </label>
      <label class="nds-cluster" data-align="center" data-justify="between">
        <span>Modo compacto</span>
        <input type="checkbox" class="nds-size-4" />
      </label>
    </div>`,
      fechaPorCodigo: false,
    };
  }

  return {
    names: [...HEADER, 'PopoverClose'],
    externos: [`import { Button } from "@/components/ui/button";`],
    state: `function salvar() {
  // Salvou: fecha por CÓDIGO. Só o Cancelar é \`PopoverClose\` — é a diferença
  // entre os dois caminhos que separa "desistiu" de "concluiu" no relatório.
  open = false;
}`,
    markup: `${head}
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
${close(a.cancelLabel, '      ')}
      <Button size="sm" onclick={salvar}>${a.saveLabel}</Button>
    </div>`,
    fechaPorCodigo: true,
  };
}

/**
 * Forma canônica: gatilho, painel e o cabeçalho que dá nome acessível ao
 * diálogo. Serve o meta dos quatro arquivos de story do componente.
 */
export function popoverSource(_gerado?: string, ctx?: { args?: Partial<PopoverArgs> }): string {
  const a: PopoverArgs = {
    side: 'bottom',
    align: 'center',
    sideOffset: 4,
    alignOffset: 0,
    modal: false,
    defaultOpen: false,
    open: false,
    triggerLabel: 'Abrir popover',
    title: 'Configurações de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
    nameLabel: 'Nome',
    emailLabel: 'Email',
    submitLabel: 'Atualizar',
    variant: 'withTitle',
    ...ctx?.args,
  };

  const part_ = part(a);
  const { externos, state, markup, fechaPorCodigo } = part_;
  // Import que não se usa é ruído que o leitor copia junto.
  const names = a.description || a.variant === 'default'
    ? part_.names
    : part_.names.filter((name) => name !== 'PopoverDescription');
  const isOpen = Boolean(a.open || a.defaultOpen);
  // O estado de abertura entra por dois motivos independentes: o painel nasce
  // aberto, ou o rodapé tem confirmação — que fecha escrevendo nele.
  const hasState = isOpen || fechaPorCodigo;

  const script = [
    importDoPopover(['Popover', 'PopoverTrigger', 'PopoverContent', ...names]),
    ...(externos.length ? externos : [`import { Button } from "@/components/ui/button";`]),
    ...(hasState ? ['', `let open = $state(${isOpen});`] : []),
    ...(state ? ['', state] : []),
  ].join('\n');

  const propsDoContent = attrs(
    a.side === 'bottom' ? '' : `side="${a.side}"`,
    a.align === 'center' ? '' : `align="${a.align}"`,
    a.sideOffset === 4 ? '' : `sideOffset={${a.sideOffset}}`,
    a.alignOffset === 0 ? '' : `alignOffset={${a.alignOffset}}`,
    // Só a composição sem título declara nome: com `PopoverTitle` dentro, o
    // `aria-label` venceria o título visível em vez de somar a ele.
    a.panelLabel && a.variant === 'default' ? `aria-label="${a.panelLabel}"` : '',
  );

  return svelteSnippet(
    script,
    `<Popover${hasState ? ' bind:open={open}' : ''}${a.modal ? ' modal' : ''}>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>${a.triggerLabel}</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent${propsDoContent}>
${markup}
  </PopoverContent>
</Popover>`,
  );
}

// ─── Overrides por story ──────────────────────────────────────────────────────
//
// UM CONSTRUTOR POR STORY, e não a transform do meta cascateando para as
// catorze. Painel que HERDA mostra o exemplo de outra story e acerta por
// coincidência — e coincidência não sobrevive à próxima edição do render.
//
// As stories de VARIAÇÃO e COMPOSIÇÃO nascem abertas para a captura do
// Chromatic, e isso é andaime da foto, não lição: popover que já nasce aberto é
// o oposto do que o componente promete, e o snippet das mesmas variantes na
// docs page também não o ensina. Os overrides delas reaproveitam a transform sem
// o estado de abertura. Nas stories de ESTADO o estado É o assunto, e ali fica.
//
// O `bind:open` que sobra em `withTitle`, `form` e `tableFilter` não é andaime:
// nessas três o botão de confirmação fecha por CÓDIGO, e sem o estado o snippet
// ensinaria um botão inerte.

/** States/Closed — o painel fora do DOM, que é o estado inicial. */
export function popoverClosedSource(): string {
  return popoverSource('', { args: { variant: 'withTitle', defaultOpen: false } });
}

/** States/Open — o painel que nasce aberto, por `defaultOpen`. */
export function popoverOpenSource(): string {
  return popoverSource('', { args: { variant: 'withTitle', defaultOpen: true } });
}

/** States/Controlled — a abertura comandada de fora, por `bind:open`. */
export function popoverControlledSource(): string {
  return popoverSource('', {
    args: {
      variant: 'withTitle',
      open: true,
      triggerLabel: 'Abrir via estado externo',
      title: 'Controlado pelo pai',
      description: 'Este popover é comandado por estado externo via bind:open.',
      saveLabel: 'Confirmar',
    },
  });
}

/**
 * States/Modal — foco preso, rolagem travada e `aria-modal`, os três juntos.
 *
 * É a única transform que escreve `modal`, e é o ponto inteiro da story: sem a
 * prop no snippet, o painel Code ensinaria o popover comum ao lado de uma
 * página que fala de modo modal.
 */
export function popoverModalSource(): string {
  return popoverSource('', {
    args: {
      variant: 'options',
      modal: true,
      defaultOpen: true,
      triggerLabel: 'Abrir modal',
      title: 'Popover modal',
      description: 'O foco fica preso no painel enquanto ele está aberto.',
    },
  });
}

/** States/Focused — o foco entra, caminha por Tab e, saindo pela tecla, fecha e volta ao gatilho. */
export function popoverFocusedSource(): string {
  return popoverSource('', {
    args: {
      variant: 'withTitle',
      defaultOpen: false,
      title: 'Confirmar alteração',
      description: '',
      saveLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
    },
  });
}

/** Variants/Default — conteúdo livre, nomeado por `aria-label`. */
export function popoverDefaultSource(): string {
  return popoverSource('', {
    args: {
      variant: 'default',
      triggerLabel: 'Ver atalhos',
      description: 'Use Ctrl+K para abrir a busca em qualquer tela.',
      panelLabel: 'Informações adicionais',
    },
  });
}

/** Variants/WithTitle — o cabeçalho que nomeia e descreve o painel. */
export function popoverWithTitleSource(): string {
  return popoverSource('', { args: { variant: 'withTitle', triggerLabel: 'Configurações' } });
}

/** Variants/Form — formulário curto, com o submit fechando por código. */
export function popoverFormSource(): string {
  return popoverSource('', {
    args: {
      variant: 'form',
      triggerLabel: 'Editar perfil',
      title: 'Editar perfil',
      description: 'Altere o nome e o email da conta.',
    },
  });
}

// Compositions/EditProfile NÃO tem construtor próprio: ela e a Variants/Form
// renderizam a MESMA composição, com os mesmos rótulos, e dividem o
// `popoverFormSource`. A exceção é declarada em `popover.source.test.ts`, que
// cobra a premissa — se as duas deixarem de ser a mesma composição, o caso
// reprova em vez de continuar quieto.

/** Compositions/TableFilter — status combináveis, com Limpar / Aplicar. */
export function popoverTableFilterSource(): string {
  return popoverSource('', {
    args: {
      variant: 'tableFilter',
      triggerLabel: 'Filtros',
      title: 'Filtrar por status',
      description: 'Combine quantos status quiser na listagem.',
    },
  });
}

/** Compositions/ColorPicker — paleta restrita, cada amostra com nome próprio. */
export function popoverColorPickerSource(): string {
  return popoverSource('', {
    args: {
      variant: 'colorPicker',
      triggerLabel: 'Escolher cor da etiqueta',
      title: 'Cor da etiqueta',
      description: 'Escolha uma cor da paleta do tema.',
    },
  });
}

/** Compositions/QuickSettings — preferências booleanas independentes. */
export function popoverQuickSettingsSource(): string {
  return popoverSource('', {
    args: {
      variant: 'quickSettings',
      triggerLabel: 'Configurações rápidas',
      title: 'Preferências',
      description: 'Cada linha vale por si — nada aqui depende do resto.',
    },
  });
}

/**
 * Compositions/SideTop — o lado preferido, e o vão pedido.
 *
 * O lado é uma PREFERÊNCIA: sem espaço acima, a lib vira o painel para baixo
 * sozinha. O que o snippet ensina são as duas props que a story declara; a
 * folga que a play cria em volta do gatilho é andaime da medição, não lição.
 */
export function popoverSideTopSource(): string {
  return popoverSource('', {
    args: {
      variant: 'withTitle',
      side: 'top',
      sideOffset: 12,
      alignOffset: 8,
      triggerLabel: 'Abrir acima',
      title: 'Ancorado acima',
      description: 'Sem espaço acima, o painel vira para baixo sozinho.',
    },
  });
}
