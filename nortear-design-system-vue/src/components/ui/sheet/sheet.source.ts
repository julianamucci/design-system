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
  texto,
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
 * Import do design system com as peças que a composição usa.
 *
 * `SheetOverlay` não entra em lista nenhuma: ele não é exportado do pacote — o
 * conteúdo monta a camada por dentro. Quem escrevesse o import não compilaria.
 */
function importar(pecas: string[]): string {
  const lista = [...new Set(['Sheet', ...pecas])].sort();
  return `import {\n${lista.map((peca) => `  ${peca},`).join('\n')}\n} from '@/components/ui/sheet'`;
}

const BOTAO = `import { Button } from '@/components/ui/button'`;
const CAMPO = `import { Input } from '@/components/ui/input'\nimport { Label } from '@/components/ui/label'`;

/** Cabeçalho: o título é o nome acessível do painel, a descrição é a descrição. */
function cabecalho(titulo: string, descricao: string, recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<SheetHeader>
${p}  <SheetTitle>${titulo}</SheetTitle>
${p}  <SheetDescription>${descricao}</SheetDescription>
${p}</SheetHeader>`;
}

/**
 * Rodapé canônico: a saída à esquerda, a confirmação à direita. `SheetClose`
 * com `as-child` empresta o fechamento ao botão em vez de embrulhá-lo.
 */
function rodape(saida: string, confirmacao: string, recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<SheetFooter>
${p}  <SheetClose as-child>
${p}    <Button variant="outline">${saida}</Button>
${p}  </SheetClose>
${p}  <Button>${confirmacao}</Button>
${p}</SheetFooter>`;
}

/** Gatilho canônico: `as-child` faz o botão do design system ser o gatilho. */
const GATILHO = (rotulo: string) => `  <SheetTrigger as-child>
    <Button variant="outline">${rotulo}</Button>
  </SheetTrigger>`;

/**
 * Forma canônica do painel: gatilho, conteúdo, cabeçalho e rodapé.
 *
 * `side` mora no CONTEÚDO, não na raiz — é o erro mais fácil de cometer aqui, e
 * o snippet é onde ele se evita.
 */
export const sheetPlaygroundSource: SourceTransform<SheetArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrs(
    attrBool('default-open', args.defaultOpen, false),
    attrBool('modal', args.modal, true),
    asCode(args.onOpenChange) && `@update:open="${texto(args.onOpenChange)}"`,
  );
  const conteudo = attrs(
    attr('side', args.side, 'right'),
    attrBool('show-close-button', args.showCloseButton, true),
  );
  return vueSnippet(
    `${importar([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BOTAO}`,
    `<Sheet${raiz}>
${GATILHO(texto(args.triggerLabel, LABEL_TRIGGER))}
  <SheetContent${conteudo}>
${cabecalho('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
${rodape('Cancelar', 'Aplicar filtros', 4)}
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
function lado(side: string, titulo: string): string {
  return vueSnippet(
    `${importar([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BOTAO}`,
    `<Sheet default-open>
${GATILHO(LABEL_TRIGGER)}
  <SheetContent${attrs(attr('side', side, 'right'))}>
${cabecalho(titulo, 'Configure os filtros para refinar os resultados.', 4)}
${rodape('Cancelar', 'Aplicar filtros', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/** Direita: o padrão de desktop, e por ser padrão a prop não aparece. */
export function sheetSideDireitoSource(): string {
  return lado('right', 'Painel direito');
}

/** Esquerda: a direção da navegação secundária. */
export function sheetLadoEsquerdoSource(): string {
  return lado('left', 'Painel esquerdo');
}

/** Topo: largura inteira, altura pelo conteúdo. */
export function sheetLadoSuperiorSource(): string {
  return lado('top', 'Painel superior');
}

/** Base: o mesmo desenho do Drawer, sem o gesto de arrastar. */
export function sheetLadoInferiorSource(): string {
  return lado('bottom', 'Painel inferior');
}

/**
 * Estado inicial: sem `default-open` o painel nem chega ao DOM, e o gatilho é a
 * única coisa que existe. É a ausência que é o assunto.
 */
export function sheetClosedSource(): string {
  return vueSnippet(
    `${importar([
      'SheetContent',
      'SheetDescription',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BOTAO}`,
    `<Sheet>
${GATILHO(LABEL_TRIGGER)}
  <SheetContent>
${cabecalho('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/** Aberto de saída, sem estado externo nenhum: `default-open` e mais nada. */
export function sheetAbertoSource(): string {
  return vueSnippet(
    `${importar([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
      'SheetTrigger',
    ])}\n${BOTAO}`,
    `<Sheet default-open>
${GATILHO(LABEL_TRIGGER)}
  <SheetContent>
${cabecalho('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
${rodape('Cancelar', 'Aplicar filtros', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Sem o botão do canto. Só se sustenta porque o rodapé oferece a saída — a
 * lição é o par, não a prop sozinha.
 */
export function sheetSemBotaoFecharSource(): string {
  return vueSnippet(
    `${importar([
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
    ])}\n${BOTAO}`,
    `<Sheet default-open>
  <SheetContent :show-close-button="false">
${cabecalho('Aceitar atualização', 'Uma nova versão está disponível. Continue para atualizar.', 4)}
${rodape('Mais tarde', 'Atualizar agora', 4)}
  </SheetContent>
</Sheet>`,
  );
}

/**
 * Estado do lado de fora: `open` entra ligado e `update:open` devolve cada
 * mudança. Sem devolver, o painel fecharia na tela e o valor continuaria `true`
 * — e ele reabriria no render seguinte.
 */
export function sheetControladoSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${importar([
  'SheetClose',
  'SheetContent',
  'SheetDescription',
  'SheetFooter',
  'SheetHeader',
  'SheetTitle',
])}
${BOTAO}

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button variant="outline" @click="aberto = true">Abrir pelo estado externo</Button>

  <Sheet :open="aberto" @update:open="(valor) => (aberto = valor)">
    <SheetContent>
${cabecalho(
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

/** Campos empilhados dentro do corpo rolável, com rótulo ligado ao campo. */
function campo(id: string, rotulo: string, valor: string, recuo: number): string {
  const p = ' '.repeat(recuo);
  return `${p}<div class="nds-grid" data-spacing="xs">
${p}  <Label for="${id}">${rotulo}</Label>
${p}  <Input id="${id}" default-value="${valor}" />
${p}</div>`;
}

/**
 * Filtros avançados: o caso canônico do painel direito. `SheetBody` é o que
 * separa o corpo rolável do rodapé fixo — sem ele o rodapé rola junto e as
 * ações sobem para fora de alcance.
 */
export function sheetFiltrosAvancadosSource(): string {
  return vueSnippet(
    `${importar([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
    ])}
${BOTAO}
${CAMPO}`,
    `<Sheet default-open>
  <SheetContent>
${cabecalho('Filtros avançados', 'Configure os filtros para refinar os resultados.', 4)}
    <SheetBody>
      <div class="nds-grid" data-spacing="md">
${campo('cat', 'Categoria', 'Componentes', 8)}
${campo('status', 'Status', 'Estável', 8)}
${campo('lang', 'Idioma', 'Português', 8)}
      </div>
    </SheetBody>
${rodape('Cancelar', 'Aplicar filtros', 4)}
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
    `${importar([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
    ])}
${BOTAO}
${CAMPO}`,
    `<Sheet default-open>
  <SheetContent>
${cabecalho(
  'Editar perfil',
  'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
  4,
)}
    <SheetBody>
      <form class="nds-grid" data-spacing="sm">
${campo('profile-name', 'Nome', 'Juliana Mucci', 8)}
${campo('profile-handle', 'Username', '@julianamucci', 8)}
${campo('profile-bio', 'Bio', 'Designer de sistemas em São Paulo', 8)}
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
  const secoes = ['Dashboard', 'Componentes', 'Tokens', 'Documentação', 'Configurações'];
  const links = secoes
    .map(
      (secao) =>
        `        <a href="#" class="nds-rounded-md nds-px-4 nds-py-2 nds-text-body nds-hover-bg-muted-soft">${secao}</a>`,
    )
    .join('\n');
  return vueSnippet(
    importar([
      'SheetBody',
      'SheetContent',
      'SheetDescription',
      'SheetHeader',
      'SheetTitle',
    ]),
    `<Sheet default-open>
  <SheetContent side="left">
${cabecalho('Navegação', 'Acesse as seções principais da aplicação.', 4)}
    <SheetBody>
      <nav class="nds-stack" data-spacing="xs" aria-label="Seções">
${links}
      </nav>
    </SheetBody>
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
    `${importar([
      'SheetBody',
      'SheetClose',
      'SheetContent',
      'SheetDescription',
      'SheetFooter',
      'SheetHeader',
      'SheetTitle',
    ])}
${BOTAO}
${CAMPO}`,
    `<Sheet default-open>
  <SheetContent>
${cabecalho('Preferências de notificação', 'Configure cada tipo de notificação individualmente.', 4)}
    <SheetBody>
      <div class="nds-grid" data-spacing="sm">
        <div v-for="i in 12" :key="i" class="nds-grid" data-spacing="xs">
          <Label :for="\`notif-\${i}\`">Categoria {{ i }}</Label>
          <Input :id="\`notif-\${i}\`" :default-value="\`Configuração \${i}\`" />
        </div>
      </div>
    </SheetBody>
${rodape('Cancelar', 'Salvar preferências', 4)}
  </SheetContent>
</Sheet>`,
  );
}
