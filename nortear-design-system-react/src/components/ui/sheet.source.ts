/**
 * Transforms do painel Code do Sheet.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é ANDAIME e não entra no snippet: o
 * decorator `<div style={{ contain: "layout", minHeight: 320 }}>` existe porque
 * o painel é portalizado e o Storybook precisa de um quadro com altura para o
 * exemplo não colapsar, e `useTranslation` resolve rótulo, que é conteúdo de
 * quem consome. Os snippets trazem o texto já em português, idioma em que o
 * design system nasce.
 *
 * O `defaultOpen` das stories de direção também é andaime: elas nascem abertas
 * porque a regressão visual e o axe precisam do painel no DOM, não porque a
 * direção dependa disso. Ele só aparece no snippet onde a abertura inicial É o
 * assunto. O gatilho entra sempre com `render={<Button />}`: o gatilho não é um
 * invólucro, é o botão que JÁ existe na interface recebendo as props de
 * abertura — é o que mantém um só elemento focável e um só nome acessível.
 */
import {
  attrs,
  childText,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type SheetArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
};

const LADOS = ['top', 'right', 'bottom', 'left'] as const;

const IMPORT_BUTTON = 'import { Button } from "@/components/ui/button";';

/** Bloco de import do componente, em ordem alfabética das peças usadas. */
function importingSheet(...parts: string[]): string {
  const list = [...parts].sort();
  return `import {\n${list
    .map((part) => `  ${part},`)
    .join('\n')}\n} from "@/components/ui/sheet";`;
}

const PARTS_BASE = [
  'Sheet',
  'SheetClose',
  'SheetContent',
  'SheetDescription',
  'SheetFooter',
  'SheetHeader',
  'SheetTitle',
  'SheetTrigger',
];

const TITLE = 'Filtros avançados';
const DESCRIPTION = 'Configure os filtros para refinar os resultados.';

/**
 * Cabeçalho com título E descrição. Os dois não são decoração: é deles que saem
 * o `aria-labelledby` e o `aria-describedby` do painel, e um diálogo modal sem
 * nome chega ao leitor de tela como uma região anônima.
 */
function header(title = TITLE, descricao = DESCRIPTION): string {
  return `    <SheetHeader>
      <SheetTitle>${title}</SheetTitle>
      <SheetDescription>
        ${descricao}
      </SheetDescription>
    </SheetHeader>`;
}

/**
 * Rodapé com a saída explícita à esquerda e a ação primária por último no DOM.
 * A ordem de leitura e de foco é a do markup — inverter aqui mudaria o que o
 * teclado alcança primeiro, mesmo com o CSS desenhando o contrário.
 */
function footer(acao = 'Aplicar filtros', saida = 'Cancelar'): string {
  return `    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>${saida}</SheetClose>
      <Button>${acao}</Button>
    </SheetFooter>`;
}

/** A composição inteira: raiz, gatilho e painel. */
function sheet(root: string, panel: string, body: string, gatilhoRotulo: string): string {
  return `<Sheet${root}>
  <SheetTrigger render={<Button variant="outline" />}>
    ${gatilhoRotulo}
  </SheetTrigger>
  <SheetContent${panel}>
${body}
  </SheetContent>
</Sheet>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no painel fechado à direita, que é o
 * padrão do componente e o uso canônico. Só o que difere do padrão entra no
 * snippet: repetir `side="right"` ou `modal` ensina ruído a quem copia.
 *
 * `onOpenChange` NÃO é interpolado: o Storybook o entrega como espião, e o corpo
 * do mock apareceria no painel como se fosse código do design system.
 */
export const sheetSource: SourceTransform<SheetArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrs(
    propBool('defaultOpen', args.defaultOpen),
    propBool('modal', args.modal, true),
  );
  const panel = attrs(
    propOption('side', args.side, LADOS, 'right'),
    propBool('showCloseButton', args.showCloseButton, true),
  );
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE)}\n${IMPORT_BUTTON}`,
    sheet(
      root,
      panel,
      `${header()}\n${footer()}`,
      childText(args.triggerLabel, 'Abrir filtros'),
    ),
  );
};

/**
 * Painel de um lado nomeado — `side` mora no conteúdo, não na raiz.
 *
 * Gatilho, descrição e rodapé são os MESMOS das quatro direções: o que muda de
 * uma para a outra é só a borda de onde o painel desliza, e trocar o conteúdo
 * junto faria parecer que a direção pede outra composição.
 */
function bySide(side: string, title: string): string {
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE)}\n${IMPORT_BUTTON}`,
    sheet('', ` side="${side}"`, `${header(title)}\n${footer()}`, 'Abrir filtros'),
  );
}

/**
 * Esquerda: a direção é o assunto e nenhum control a descreve neste arquivo. É
 * o lado da navegação secundária — onde a pessoa espera encontrar o menu.
 */
export function sheetSideEsquerdoSource(): string {
  return bySide('left', 'Painel esquerdo');
}

/**
 * Topo: ocupa a largura inteira e a altura vem do conteúdo. Serve a filtros
 * horizontais e avisos ricos demais para caber num Alert.
 */
export function sheetSideSuperiorSource(): string {
  return bySide('top', 'Painel superior');
}

/**
 * Base: o mesmo desenho do Drawer, sem o gesto de arrastar. Quando o gesto
 * importa, o componente é o Drawer.
 */
export function sheetSideInferiorSource(): string {
  return bySide('bottom', 'Painel inferior');
}

/**
 * Aberto na montagem. `defaultOpen` é o caminho NÃO controlado: quem abre e
 * fecha continua sendo o componente, e o valor só diz por onde começar.
 */
export function sheetOpenSource(): string {
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE)}\n${IMPORT_BUTTON}`,
    sheet(' defaultOpen', '', `${header()}\n${footer()}`, 'Abrir filtros'),
  );
}

/**
 * Sem o botão do canto — a AUSÊNCIA é o assunto. Só se sustenta porque o rodapé
 * oferece outra saída: Escape continua fechando, mas tirar a saída visível de um
 * painel sem rodapé deixaria quem usa ponteiro sem caminho nenhum.
 */
export function sheetNoButtonCloseSource(): string {
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE)}\n${IMPORT_BUTTON}`,
    sheet(
      '',
      ' showCloseButton={false}',
      `${header()}
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
    </SheetFooter>`,
      'Abrir filtros',
    ),
  );
}

/**
 * Abertura controlada de fora, e por isso SEM gatilho interno: quem abre é o
 * botão que já existe no fluxo. `onOpenChange` precisa devolver o valor ao dono
 * do estado — sem isso o fechamento por Escape ou pelo overlay não chega até
 * ele, e o painel reabre no render seguinte.
 */
export function sheetControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importingSheet(
  'Sheet',
  'SheetClose',
  'SheetContent',
  'SheetDescription',
  'SheetFooter',
  'SheetHeader',
  'SheetTitle',
)}
${IMPORT_BUTTON}

const [aberto, setAberto] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
  <Button variant="outline" onClick={() => setAberto(true)}>
    Abrir filtros
  </Button>

  <Sheet open={aberto} onOpenChange={setAberto}>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>${TITLE}</SheetTitle>
        <SheetDescription>
          ${DESCRIPTION}
        </SheetDescription>
      </SheetHeader>
      <SheetFooter>
        <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</div>`,
  );
}

/**
 * Formulário de filtros no corpo do painel. O `SheetBody` é quem rola: cabeçalho
 * e rodapé ficam parados, e é isso que mantém "Aplicar" ao alcance mesmo com a
 * lista de campos crescendo.
 */
export function sheetFiltersSource(): string {
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE, 'SheetBody')}
${IMPORT_BUTTON}
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";`,
    sheet(
      '',
      '',
      `${header(TITLE, 'Refine os resultados por categoria, preço e disponibilidade.')}
    <SheetBody>
      <form
        className="nds-stack"
        data-spacing="md"
        onSubmit={(evento) => evento.preventDefault()}
      >
        <div className="nds-stack" data-spacing="sm">
          <Label htmlFor="filtro-categoria">Categoria</Label>
          <Input id="filtro-categoria" defaultValue="Eletrônicos" />
        </div>
        <div className="nds-stack" data-spacing="sm">
          <Label htmlFor="filtro-minimo">Preço mínimo</Label>
          <Input id="filtro-minimo" type="number" defaultValue="100" />
        </div>
        <div className="nds-stack" data-spacing="sm">
          <Label htmlFor="filtro-maximo">Preço máximo</Label>
          <Input id="filtro-maximo" type="number" defaultValue="2000" />
        </div>
      </form>
    </SheetBody>
${footer()}`,
      'Abrir filtros',
    ),
  );
}

/**
 * Navegação secundária. A `<nav>` nomeada mora dentro do corpo, e o painel não
 * tem rodapé: aqui não há decisão a confirmar — escolher um destino já fecha o
 * painel por si.
 */
export function sheetNavigationSource(): string {
  return jsxSnippet(
    `${importingSheet(
      'Sheet',
      'SheetBody',
      'SheetContent',
      'SheetDescription',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    )}
${IMPORT_BUTTON}

const SECOES = ["Dashboard", "Projetos", "Equipe", "Configurações"];`,
    `<Sheet>
  <SheetTrigger render={<Button variant="outline" />}>
    Abrir menu
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navegação</SheetTitle>
      <SheetDescription>
        Acesse as seções principais do aplicativo.
      </SheetDescription>
    </SheetHeader>
    <SheetBody>
      <nav className="nds-stack" data-spacing="xs" aria-label="Seções">
        {SECOES.map((secao) => (
          <Button key={secao} variant="ghost">
            {secao}
          </Button>
        ))}
      </nav>
    </SheetBody>
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Painel inferior de ações. A ação destrutiva fica por último e é a única com a
 * variante que a anuncia — três botões destrutivos lado a lado tirariam o peso
 * justamente do que precisa de peso.
 */
export function sheetPanelInferiorSource(): string {
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE, 'SheetBody')}
${IMPORT_BUTTON}`,
    sheet(
      '',
      ' side="bottom"',
      `${header('Ações rápidas', 'Escolha uma das ações disponíveis para este item.')}
    <SheetBody>
      <div className="nds-cluster" data-spacing="md">
        <Button variant="outline">Compartilhar</Button>
        <Button variant="outline">Duplicar</Button>
        <Button variant="destructive">Excluir</Button>
      </div>
    </SheetBody>
    <SheetFooter>
      <SheetClose render={<Button variant="outline" />}>Fechar</SheetClose>
    </SheetFooter>`,
      'Abrir ações',
    ),
  );
}

/**
 * Corpo mais alto que o painel. O `SheetBody` traz `tabIndex={0}` de fábrica —
 * região que rola precisa ser alcançável por teclado (WCAG 2.1.1) —, e é o
 * `flex` da folha que segura o rodapé no lugar enquanto o texto corre.
 */
export function sheetContentLongSource(): string {
  return jsxSnippet(
    `${importingSheet(...PARTS_BASE, 'SheetBody')}
${IMPORT_BUTTON}

const PARAGRAFOS = Array.from({ length: 24 }, (_, i) => i + 1);`,
    sheet(
      '',
      '',
      `${header('Termos de uso', 'Leia atentamente antes de aceitar.')}
    <SheetBody className="nds-stack" data-spacing="sm">
      {PARAGRAFOS.map((n) => (
        <p key={n} className="nds-text-body">
          Parágrafo {n}: texto longo o bastante para o corpo precisar rolar
          dentro do painel, sem empurrar o rodapé para fora da tela.
        </p>
      ))}
    </SheetBody>
${footer('Aceitar termos')}`,
      'Ler termos',
    ),
  );
}
