/**
 * Transforms do painel Code do Popover.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta — `contain: layout`, `minHeight`,
 * `position: relative`, o parágrafo "Área externa", a chave de remontagem — é
 * andaime: o painel é portalizado e precisa de um quadro contra o que se
 * posicionar dentro do Storybook, e a dispensa por clique fora precisa de um
 * alvo inerte para não depender da geometria da página. Nada disso é do
 * componente, e por isso nada disso entra no snippet.
 *
 * O gatilho entra sempre com `asChild` sobre um `<Button>`: o gatilho não é um
 * invólucro, é o botão que JÁ existe na interface recebendo as props de
 * abertura. É isso que mantém um só elemento focável e um só nome acessível.
 */
import {
  attrs,
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type PopoverArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  defaultOpen: boolean;
  modal: boolean;
};

const LADOS = ['top', 'right', 'bottom', 'left'] as const;
const ALINHAMENTOS = ['start', 'center', 'end'] as const;

/** Distância padrão entre gatilho e painel, em px. */
const DISTANCIA_DEFAULT = 4;

const IMPORT_BUTTON = 'import { Button } from "@/components/ui/button";';

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingPopover(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list
    .map((part) => `  ${part},`)
    .join('\n')}\n} from "@/components/ui/popover";`;
}

/** Gatilho: o botão de verdade da interface, com as props emprestadas. */
function trigger(label: string): string {
  return `  <PopoverTrigger asChild>
    <Button variant="outline">${label}</Button>
  </PopoverTrigger>`;
}

/**
 * Cabeçalho nomeado. Com `PopoverTitle` a lib monta o `aria-labelledby`
 * sozinha — e `role="dialog"` sem nome reprova na regra `aria-dialog-name`.
 */
function header(title: string, descricao?: string): string {
  const lineDescription = descricao
    ? `\n      <PopoverDescription>\n        ${descricao}\n      </PopoverDescription>`
    : '';
  return `    <PopoverHeader>
      <PopoverTitle>${title}</PopoverTitle>${lineDescription}
    </PopoverHeader>`;
}

/** A composição inteira: raiz, gatilho e painel. */
function popover(root: string, gatilhoRotulo: string, panel: string, content: string): string {
  return `<Popover${root}>
${trigger(gatilhoRotulo)}
  <PopoverContent${panel}>
${content}
  </PopoverContent>
</Popover>`;
}

/** Par de ações do rodapé do painel, encostado à direita. */
const ACTIONS_DEFAULT = `    <div className="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Cancelar</Button>
      <Button size="sm">Salvar</Button>
    </div>`;

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no painel fechado, que é o padrão do
 * componente e o uso canônico. Só o que difere do padrão entra no snippet.
 *
 * `onOpenChange` NÃO é interpolado: o Storybook o entrega como espião, e o corpo
 * do mock apareceria no painel como se fosse código do design system.
 */
export const popoverSource: SourceTransform<PopoverArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrs(propBool('defaultOpen', args.defaultOpen), propBool('modal', args.modal));
  const panel = attrsMultilinha([
    propOption('side', args.side, LADOS, 'bottom'),
    propOption('align', args.align, ALINHAMENTOS, 'center'),
    typeof args.sideOffset === 'number' && args.sideOffset !== DISTANCIA_DEFAULT
      ? propNumber('sideOffset', args.sideOffset)
      : undefined,
  ]);

  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      root,
      'Abrir popover',
      panel,
      `${header('Configurações de exibição', 'Ajuste a aparência do conteúdo da página.')}
${ACTIONS_DEFAULT}`,
    ),
  );
};

/**
 * Conteúdo livre — a AUSÊNCIA de título é o assunto. Sem `PopoverTitle` o painel
 * herda o nome acessível do gatilho, que é como o Vanilla (referência de
 * markup) resolve o caso: um diálogo anônimo reprovaria no axe.
 */
export function popoverContentLivreSource(): string {
  return jsxSnippet(
    `${importingPopover('Popover', 'PopoverContent', 'PopoverTrigger')}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Ver atalhos',
      '',
      `    <p className="nds-text-body">
      Use Ctrl + K para abrir a busca em qualquer tela.
    </p>`,
    ),
  );
}

/**
 * Formulário curto dentro do painel. É o que separa popover de tooltip: o
 * conteúdo é interativo, então o foco entra nele ao abrir e o Tab caminha pelos
 * campos sem sair do painel.
 */
export function popoverFormSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`,
    popover(
      '',
      'Editar perfil',
      '',
      `${header('Editar perfil')}
    <form className="nds-stack" data-spacing="sm">
      <Label htmlFor="perfil-nome" className="nds-text-caption">Nome</Label>
      <Input id="perfil-nome" defaultValue="Joana" />
      <Label htmlFor="perfil-email" className="nds-text-caption">Email</Label>
      <Input id="perfil-email" type="email" defaultValue="joana@example.com" />
      <Button type="submit" size="sm" className="nds-mt-1">Atualizar</Button>
    </form>`,
    ),
  );
}

/**
 * Aberto por estado inicial. Enquanto aberto, o gatilho aponta para o painel por
 * `aria-controls` — e o painel só existe no DOM nesse intervalo, o que é
 * justamente o estado que a regressão visual precisa alcançar.
 */
export function popoverOpenSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      ' defaultOpen',
      'Abrir popover',
      '',
      header('Configurações de exibição', 'Ajuste a aparência do conteúdo da página.'),
    ),
  );
}

/**
 * Controlado de fora. Dois botões, e não um que alterna: o `pointerdown` do
 * clique fora dispensa o painel ANTES do `click`, então um alternador leria o
 * estado já invertido pela lib e reabriria o que acabou de fechar.
 */
export function popoverControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importingPopover(
  'Popover',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
${IMPORT_BUTTON}

const [aberto, setAberto] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
  <div className="nds-cluster" data-spacing="md">
    <Button onClick={() => setAberto(true)}>Abrir externamente</Button>
    <Button variant="outline" onClick={() => setAberto(false)}>
      Fechar externamente
    </Button>
  </div>

  <Popover open={aberto} onOpenChange={setAberto}>
    <PopoverTrigger asChild>
      <Button variant="outline">Preferências</Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Estado controlado</PopoverTitle>
        <PopoverDescription>
          A abertura vive fora do componente.
        </PopoverDescription>
      </PopoverHeader>
    </PopoverContent>
  </Popover>
</div>`,
  );
}

/**
 * Modal: prende o foco e bloqueia a rolagem do corpo enquanto aberto — e ainda
 * assim não anuncia `aria-modal`. Esconder o resto da página do leitor de tela é
 * contrato de Dialog; um popover continua sendo conteúdo AO LADO, não no lugar.
 */
export function popoverModalSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      ' defaultOpen modal',
      'Abrir modal',
      '',
      `${header('Popover modal', 'Interações fora do popover ficam bloqueadas.')}
    <div className="nds-cluster" data-justify="end" data-spacing="sm">
      <Button size="sm">OK</Button>
    </div>`,
    ),
  );
}

/**
 * Edição rápida sem trocar de tela. O gatilho nomeia a ação E o objeto —
 * "Editar perfil", nunca "Mais" ou "Clique aqui" —, porque é o nome do gatilho
 * que a pessoa ouve antes de decidir abrir.
 */
export function popoverEditarPerfilSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`,
    popover(
      '',
      'Editar perfil',
      '',
      `${header('Editar perfil', 'Altere o nome e o email da conta.')}
    <form className="nds-stack" data-spacing="sm">
      <Label htmlFor="conta-nome" className="nds-text-caption">Nome</Label>
      <Input id="conta-nome" defaultValue="Ana Ribeiro" />
      <Label htmlFor="conta-email" className="nds-text-caption">Email</Label>
      <Input id="conta-email" type="email" defaultValue="ana@nortear.com.br" />
      <div className="nds-cluster" data-justify="end" data-spacing="sm">
        <Button variant="ghost" size="sm">Cancelar</Button>
        <Button type="submit" size="sm">Atualizar</Button>
      </div>
    </form>`,
    ),
  );
}

/**
 * Filtros combináveis. Escolha múltipla não fecha no primeiro clique — fechar
 * obrigaria a reabrir o painel para cada critério —, e o par Limpar / Aplicar
 * fica no fim, na ordem em que a decisão acontece.
 */
export function popoverFilterSource(): string {
  const opcao = (label: string, marcada = false) => `      <label className="nds-cluster" data-spacing="sm">
        <input type="checkbox" className="nds-size-4"${marcada ? ' defaultChecked' : ''} />
        <span>${label}</span>
      </label>`;

  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Filtros',
      '',
      `${header('Filtrar por status', 'Combine quantos status quiser na listagem.')}
    <div className="nds-stack nds-text-body" data-spacing="xs">
${opcao('Ativo', true)}
${opcao('Pendente')}
${opcao('Arquivado')}
    </div>
    <div className="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>`,
    ),
  );
}

/**
 * Paleta restrita. A cor NÃO é o nome: cada amostra carrega o próprio
 * `aria-label`, porque quem não distingue a cor precisa do rótulo — e um botão
 * sem texto nenhum reprova no axe por `button-name`.
 */
export function popoverPaletteSource(): string {
  const amostra = (token: string, label: string) =>
    `      <button type="button" className={\`\${AMOSTRA} nds-bg-${token}\`} aria-label="${label}" />`;

  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}

const AMOSTRA = "nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring";`,
    popover(
      '',
      'Escolher cor da etiqueta',
      '',
      `${header('Cor da etiqueta', 'Escolha uma cor da paleta do tema.')}
    <div className="nds-cluster" data-spacing="sm">
${amostra('primary', 'Primária')}
${amostra('secondary', 'Secundária')}
${amostra('success', 'Sucesso')}
${amostra('warning', 'Atenção')}
${amostra('info', 'Informação')}
${amostra('destructive', 'Destrutiva')}
    </div>`,
    ),
  );
}

/**
 * Preferências booleanas independentes — alternativa leve ao diálogo para
 * ajustes rápidos. Cada linha vale por si: marcar uma não mexe nas outras, e é
 * por isso que são caixas de marcação e não um grupo de escolha única.
 */
export function popoverPreferenciasSource(): string {
  const preferencia = (label: string, ligada = false) => `      <label
        className="nds-cluster"
        data-align="center"
        data-justify="between"
      >
        <span>${label}</span>
        <input type="checkbox" className="nds-size-4"${ligada ? ' defaultChecked' : ''} />
      </label>`;

  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Configurações rápidas',
      '',
      `${header('Preferências', 'Cada linha vale por si — nada aqui depende do resto.')}
    <div className="nds-stack nds-text-body" data-spacing="sm">
${preferencia('Notificações', true)}
${preferencia('Modo escuro')}
${preferencia('Modo compacto')}
    </div>`,
    ),
  );
}

/**
 * Ancorado acima. `side` é preferência, não garantia: sem espaço acima o painel
 * vira para baixo sozinho — a troca é sempre de LADO no mesmo eixo, nunca de
 * eixo. `sideOffset` é a distância entre o gatilho e o painel.
 */
export function popoverAboveSource(): string {
  return jsxSnippet(
    `${importingPopover(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
${IMPORT_BUTTON}`,
    popover(
      '',
      'Abrir acima',
      ' side="top" sideOffset={12}',
      header('Ancorado acima', 'Sem espaço acima, o painel vira para baixo sozinho.'),
    ),
  );
}
