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
  variant: 'default' | 'withTitle' | 'form' | 'tableFilter' | 'colorPicker' | 'quickSettings';
};

/** Monta o `import` do design system com uma peça por linha. */
function importDoPopover(nomes: string[]): string {
  return `import {\n${nomes.map((n) => `  ${n},`).join('\n')}\n} from "@/components/ui/popover";`;
}

const HEADER = ['PopoverHeader', 'PopoverTitle', 'PopoverDescription'];

function cabecalho(title: string, description: string): string {
  return `    <PopoverHeader>
      <PopoverTitle>${title}</PopoverTitle>
      <PopoverDescription>${description}</PopoverDescription>
    </PopoverHeader>`;
}

/** Botão que fecha o painel por dentro — o único papel do `PopoverClose`. */
function fechar(rotulo: string, variante: 'outline' | 'ghost', indentacao: string): string {
  return `${indentacao}<PopoverClose>
${indentacao}  {#snippet child({ props })}
${indentacao}    <Button variant="${variante}" size="sm" {...props}>${rotulo}</Button>
${indentacao}  {/snippet}
${indentacao}</PopoverClose>`;
}

type Part = {
  /** Nomes vindos de `@/components/ui/popover`, além dos três da base. */
  nomes: string[];
  /** Linhas de import de outros componentes do design system. */
  externos: string[];
  /** Estado local que a composição exige (`$state`, handlers). */
  estado: string;
  /** Conteúdo do `PopoverContent`, já indentado em 4 espaços. */
  markup: string;
};

function part(a: PopoverArgs): Part {
  const head = cabecalho(a.title, a.description);

  if (a.variant === 'default') {
    return {
      nomes: [],
      externos: [],
      estado: '',
      markup: `    <p class="nds-text-body">${a.description}</p>`,
    };
  }

  if (a.variant === 'form') {
    return {
      nomes: [...HEADER, 'PopoverClose'],
      externos: [
        `import { Button } from "@/components/ui/button";`,
        `import { Input } from "@/components/ui/input";`,
        `import { Label } from "@/components/ui/label";`,
      ],
      estado: `let nome = $state("Ana Ribeiro");
let email = $state("ana@nortear.com.br");

function salvar(evento: SubmitEvent) {
  evento.preventDefault();
}`,
      markup: `${head}
    <form class="nds-stack" data-spacing="sm" onsubmit={salvar}>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-nome">${a.nameLabel}</Label>
        <Input id="perfil-nome" bind:value={nome} />
      </div>
      <div class="nds-stack" data-spacing="xs">
        <Label for="perfil-email">${a.emailLabel}</Label>
        <Input id="perfil-email" type="email" bind:value={email} />
      </div>
      <div class="nds-cluster" data-justify="end" data-spacing="sm">
${fechar(a.cancelLabel, 'ghost', '        ')}
        <Button type="submit" size="sm">${a.submitLabel}</Button>
      </div>
    </form>`,
    };
  }

  if (a.variant === 'tableFilter') {
    return {
      nomes: HEADER,
      externos: [`import { Button } from "@/components/ui/button";`],
      estado: '',
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
      <Button size="sm">Aplicar</Button>
    </div>`,
    };
  }

  if (a.variant === 'colorPicker') {
    // Cada amostra escrita por extenso, com nome acessível próprio: a cor não é
    // o nome, e sem `aria-label` o botão fica sem nome nenhum.
    return {
      nomes: HEADER,
      externos: [],
      estado: '',
      markup: `${head}
    <div class="nds-cluster" data-spacing="sm">
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-primary" aria-label="Primária"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-secondary" aria-label="Secundária"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-success" aria-label="Sucesso"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-warning" aria-label="Atenção"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-info" aria-label="Informação"></button>
      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring nds-bg-destructive" aria-label="Destrutiva"></button>
    </div>`,
    };
  }

  if (a.variant === 'quickSettings') {
    return {
      nomes: HEADER,
      externos: [],
      estado: '',
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
    };
  }

  return {
    nomes: [...HEADER, 'PopoverClose'],
    externos: [`import { Button } from "@/components/ui/button";`],
    estado: '',
    markup: `${head}
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
${fechar(a.cancelLabel, 'outline', '      ')}
      <Button size="sm">${a.saveLabel}</Button>
    </div>`,
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

  const { nomes, externos, estado, markup } = part(a);
  const aberto = Boolean(a.open || a.defaultOpen);

  const script = [
    importDoPopover(['Popover', 'PopoverTrigger', 'PopoverContent', ...nomes]),
    ...(externos.length ? externos : [`import { Button } from "@/components/ui/button";`]),
    ...(aberto ? ['', 'let aberto = $state(true);'] : []),
    ...(estado ? ['', estado] : []),
  ].join('\n');

  const propsDoContent = attrs(
    a.side === 'bottom' ? '' : `side="${a.side}"`,
    a.align === 'center' ? '' : `align="${a.align}"`,
    a.sideOffset === 4 ? '' : `sideOffset={${a.sideOffset}}`,
  );

  return svelteSnippet(
    script,
    `<Popover${aberto ? ' bind:open={aberto}' : ''}>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props}>${a.triggerLabel}</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent${propsDoContent}>
${markup}
  </PopoverContent>
</Popover>`,
  );
}
