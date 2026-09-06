/**
 * Transforms do painel Code do Sheet.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import {
  attr,
  attrBool,
  attrs,
  asCode,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type SheetArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

const LABEL_TRIGGER = 'Abrir filtros';

/**
 * As cinco seções da navegação secundária.
 *
 * A lista é a mesma nas cinco stacks — o conteúdo compartilhado a descreve, e
 * uma stack com quatro itens documenta uma composição que não existe.
 */
const NAV_SECTIONS = ['Dashboard', 'Projetos', 'Equipe', 'Configurações', 'Faturas'];

/** A fileira de ações do painel inferior, com a destrutiva por último. */
const BOTTOM_ACTIONS: Array<[string, 'outline' | 'destructive']> = [
  ['Compartilhar', 'outline'],
  ['Duplicar', 'outline'],
  ['Excluir', 'destructive'],
];

/**
 * Import do design system com as peças que a composição usa.
 *
 * `SheetOverlay` não entra em lista nenhuma: ele não é exportado do pacote — o
 * conteúdo monta a camada por dentro. Quem escrevesse o import não compilaria.
 */
function importing(parts: string[]): string {
  const list = [...new Set(['Sheet', ...parts])].sort();
  return `import {\n${list.map((part) => `  ${part},`).join('\n')}\n} from '@/components/ui/sheet'`;
}

const BUTTON = `import { Button } from '@/components/ui/button'`;
const FIELD = `import { Input } from '@/components/ui/input'\nimport { Label } from '@/components/ui/label'`;

/** Cabeçalho: o título é o nome acessível do painel, a descrição é a descrição. */
function header(title: string, descricao: string, recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<SheetHeader>
${p}  <SheetTitle>${title}</SheetTitle>
${p}  <SheetDescription>${descricao}</SheetDescription>
${p}</SheetHeader>`;
}

/**
 * Corpo rolável do painel canônico.
 *
 * O Playground RENDERIZA este parágrafo, e o snippet ia do cabeçalho direto ao
 * rodapé: quem copiasse recebia um painel sem a área que rola — justamente a
 * peça que o `SheetBody` existe para trazer, e a que a docs page apresenta.
 */
function body(recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<SheetBody>
${p}  <p class="nds-text-body nds-text-muted-foreground">
${p}    Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola quando o
${p}    conteúdo passa da altura da tela.
${p}  </p>
${p}</SheetBody>`;
}

/**
 * Rodapé canônico: a saída à esquerda, a confirmação à direita. `SheetClose`
 * com `as-child` empresta o fechamento ao botão em vez de embrulhá-lo.
 */
function footer(saida: string, confirm: string, recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<SheetFooter>
${p}  <SheetClose as-child>
${p}    <Button variant="outline">${saida}</Button>
${p}  </SheetClose>
${p}  <Button>${confirm}</Button>
${p}</SheetFooter>`;
}

/** Gatilho canônico: `as-child` faz o botão do design system ser o gatilho. */
const TRIGGER = (label: string) => `  <SheetTrigger as-child>
    <Button variant="outline">${label}</Button>
  </SheetTrigger>`;

/**
 * Forma canônica do painel: gatilho, conteúdo, cabeçalho e rodapé.
 *
 * `side` mora no CONTEÚDO, não na raiz — é o erro mais fácil de cometer aqui, e
 * o snippet é onde ele se evita.
 */
export const sheetPlaygroundSource: SourceTransform<SheetArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrs(
    attrBool('default-open', args.defaultOpen, false),
    attrBool('modal', args.modal, true),
    asCode(args.onOpenChange) && `@update:open="${text(args.onOpenChange)}"`,
  );
  const content = attrs(
    attr('side', args.side, 'right'),
    attrBool('show-close-button', args.showCloseButton, true),
  );
  return vueSnippet(
    `${importing([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BUTTON}`,
    `<Sheet${root}>
${TRIGGER(text(args.triggerLabel, LABEL_TRIGGER))}
  <SheetContent${content}>
${header('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
${body(4)}
${footer('Cancelar', 'Aplicar filtros', 4)}
  </SheetContent>
</Sheet>`,
  );
};

/**
 * Mesmo painel nas quatro direções: o que muda é `side` e o título.
 *
 * As stories de variante nascem abertas, e o snippet diz por quê — sem
 * `default-open` o leitor copiaria o exemplo e veria um painel fechado, sem
 * nada na tela que explicasse a diferença.
 */
function side(side: string, title: string): string {
  return vueSnippet(
    `${importing([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BUTTON}`,
    `<Sheet default-open>
${TRIGGER(LABEL_TRIGGER)}
  <SheetContent${attrs(attr('side', side, 'right'))}>
${header(title, 'Configure os filtros para refinar os resultados.', 4)}
${footer('Cancelar', 'Aplicar filtros', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/** Direita: o padrão de desktop, e por ser padrão a prop não aparece. */
export function sheetSideDireitoSource(): string {
  return side('right', 'Painel direito');
}

/** Esquerda: a direção da navegação secundária. */
export function sheetSideEsquerdoSource(): string {
  return side('left', 'Painel esquerdo');
}

/** Topo: largura inteira, altura pelo conteúdo. */
export function sheetSideSuperiorSource(): string {
  return side('top', 'Painel superior');
}

/** Base: o mesmo desenho do Drawer, sem o gesto de arrastar. */
export function sheetSideInferiorSource(): string {
  return side('bottom', 'Painel inferior');
}

/**
 * Estado inicial: sem `default-open` o painel nem chega ao DOM, e o gatilho é a
 * única coisa que existe. É a ausência que é o assunto.
 */
export function sheetClosedSource(): string {
  return vueSnippet(
    `${importing([
      'SheetContent',
      'SheetDescription',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BUTTON}`,
    `<Sheet>
${TRIGGER(LABEL_TRIGGER)}
  <SheetContent>
${header('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/** Aberto de saída, sem estado externo nenhum: `default-open` e mais nada. */
export function sheetOpenSource(): string {
  return vueSnippet(
    `${importing([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BUTTON}`,
    `<Sheet default-open>
${TRIGGER(LABEL_TRIGGER)}
  <SheetContent>
${header('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
${footer('Cancelar', 'Aplicar filtros', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Sem o botão do canto. Só se sustenta porque o rodapé oferece a saída — a
 * lição é o par, não a prop sozinha.
 */
export function sheetNoButtonCloseSource(): string {
  return vueSnippet(
    `${importing([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
    ])}\n${BUTTON}`,
    `<Sheet default-open>
  <SheetContent :show-close-button="false">
${header('Aceitar atualização', 'Uma nova versão está disponível. Continue para atualizar.', 4)}
${footer('Mais tarde', 'Atualizar agora', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Estado do lado de fora: `open` entra ligado e `update:open` devolve cada
 * mudança. Sem devolver, o painel fecharia na tela e o valor continuaria `true`
 * — e ele reabriria no render seguinte.
 */
export function sheetControlledSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${importing([
  'SheetClose',
  'SheetContent',
  'SheetDescription',
  'SheetFooter',
  'SheetHeader',
  'SheetTitle',
])}
${BUTTON}

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button variant="outline" @click="aberto = true">Abrir pelo estado externo</Button>

  <Sheet :open="aberto" @update:open="(valor) => (aberto = valor)">
    <SheetContent>
${header(
  'Controlado pelo pai',
  'Este painel é comandado por estado externo, e devolve cada mudança a quem é dono dele.',
  6,
)}
      <SheetFooter>
        <SheetClose as-child>
          <Button variant="outline">Cancelar</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</div>`,
  );
}

/**
 * Campos empilhados dentro do corpo rolável, com rótulo ligado ao campo.
 *
 * `type` entra só quando NÃO é texto: `text` é o padrão do elemento, e
 * escrevê-lo apagaria a informação de que existe um padrão. O parâmetro existe
 * porque o preço é numérico no preview — sem ele o snippet ensinaria um campo
 * de texto ao lado de um campo de número.
 */
function field(id: string, label: string, value: string, recuo: number, type?: string): string {
  const p = ' '.repeat(recuo);
  const tipo = type ? ` type="${type}"` : '';
  return `${p}<div class="nds-stack" data-spacing="xs">
${p}  <Label for="${id}">${label}</Label>
${p}  <Input id="${id}"${tipo} default-value="${value}" />
${p}</div>`;
}

/**
 * Filtros avançados: o caso canônico do painel direito. `SheetBody` é o que
 * separa o corpo rolável do rodapé fixo — sem ele o rodapé rola junto e as
 * ações sobem para fora de alcance.
 *
 * As QUATRO composições levam gatilho, aqui e nas stories. Elas nasceram sem —
 * só `default-open`, e o painel aparecia sem nada que explicasse como se abre —,
 * e é a única stack em que isso acontecia: as outras quatro sempre renderizaram
 * o gatilho ao lado do painel aberto. `default-open` fica porque é o que a
 * regressão visual e o axe alcançam; o gatilho entra porque é o que a pessoa
 * escreve.
 */
export function sheetFiltersAvancadosSource(): string {
  return vueSnippet(
    `${importing([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}
${BUTTON}
${FIELD}`,
    `<Sheet default-open>
${TRIGGER('Abrir filtros')}
  <SheetContent>
${header('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
    <SheetBody>
      <div class="nds-stack" data-spacing="sm">
${field('cat', 'Categoria', 'Eletrônicos', 8)}
${field('min', 'Preço mínimo', '100', 8, 'number')}
      </div>
    </SheetBody>
${footer('Cancelar', 'Aplicar filtros', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Edição de perfil: o corpo é um `form`, e a confirmação é o `submit` dele —
 * o rodapé fica dentro do painel, mas a ação pertence ao formulário.
 */
export function sheetEditPerfilSource(): string {
  return vueSnippet(
    `${importing([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}
${BUTTON}
${FIELD}`,
    `<Sheet default-open>
${TRIGGER('Editar perfil')}
  <SheetContent>
${header(
  'Editar perfil',
  'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
  4,
)}
    <SheetBody>
      <form class="nds-stack" data-spacing="sm">
${field('profile-name', 'Nome', 'Juliana Mucci', 8)}
${field('profile-handle', 'Nome de usuário', '@julianamucci', 8)}
${field('profile-bio', 'Bio', 'Designer de sistemas em São Paulo', 8)}
      </form>
    </SheetBody>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">Cancelar</Button>
      </SheetClose>
      <Button type="submit">Salvar alterações</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Navegação secundária: painel esquerdo, sem rodapé — a lista de links É a
 * ação. O `nav` leva nome próprio porque a página tem outra navegação.
 */
export function sheetNavigationSecundariaSource(): string {
  const links = NAV_SECTIONS.map(
    (section) =>
      `        <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-accent">${section}</a>`,
  ).join('\n');
  return vueSnippet(
    `${importing([
      'SheetBody',
      'SheetContent',
      'SheetDescription',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}
${BUTTON}`,
    `<Sheet default-open>
${TRIGGER('Abrir menu')}
  <SheetContent side="left">
${header('Menu', 'Navegue entre as áreas do sistema.', 4)}
    <SheetBody>
      <nav class="nds-stack" data-spacing="xs" aria-label="Navegação secundária">
${links}
      </nav>
    </SheetBody>
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Painel inferior: uma fileira de ações no corpo, no lugar de formulário.
 *
 * Sem confirmação nenhuma no rodapé — a decisão é a própria ação clicada, e o
 * rodapé só oferece a saída. É o que separa esta composição do painel de
 * filtros, que confirma.
 */
export function sheetBottomPanelSource(): string {
  const actions = BOTTOM_ACTIONS.map(
    ([label, variant]) => `        <Button variant="${variant}">${label}</Button>`,
  ).join('\n');
  return vueSnippet(
    `${importing([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}
${BUTTON}`,
    `<Sheet default-open>
${TRIGGER('Abrir ações')}
  <SheetContent side="bottom">
${header('Ações rápidas', 'Escolha uma das ações disponíveis para este item.', 4)}
    <SheetBody>
      <div class="nds-cluster" data-spacing="md">
${actions}
      </div>
    </SheetBody>
    <SheetFooter>
      <SheetClose as-child>
        <Button variant="outline">Fechar</Button>
      </SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Formulário mais alto que o painel: quem rola é o corpo, e o rodapé fica.
 * `SheetBody` também leva `tabindex="0"` por dentro, para que a região rolável
 * seja alcançável por teclado (WCAG 2.1.1).
 */
export function sheetFormLongSource(): string {
  return vueSnippet(
    `${importing([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
    ])}
${BUTTON}
${FIELD}`,
    `<Sheet default-open>
  <SheetContent>
${header('Preferências de notificação', 'Configure cada tipo de notificação individualmente.', 4)}
    <SheetBody>
      <div class="nds-grid" data-spacing="sm">
        <div v-for="i in 12" :key="i" class="nds-grid" data-spacing="xs">
          <Label :for="\`notif-\${i}\`">Categoria {{ i }}</Label>
          <Input :id="\`notif-\${i}\`" :default-value="\`Configuração \${i}\`" />
        </div>
      </div>
    </SheetBody>
${footer('Cancelar', 'Salvar preferências', 4)}
  </SheetContent>
</Sheet>`,
  );
}
