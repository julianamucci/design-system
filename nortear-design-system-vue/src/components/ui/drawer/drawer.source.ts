/**
 * Transforms do painel Code do Drawer.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Duas coisas que as stories fazem e o snippet NÃO repete, porque são andaime:
 * o `<div>` de contenção que segura o painel dentro do quadro do Storybook, e o
 * `default-open` que deixa o Chromatic fotografar o painel montado. Um drawer
 * que se abre sozinho ao carregar a página é justamente o que não se copia — só
 * a story cujo assunto É a montagem aberta escreve a prop.
 */
import { attr, attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type DrawerArgs = {
  direction: 'bottom' | 'top' | 'left' | 'right';
  defaultOpen: boolean;
  dismissible: boolean;
  modal: boolean;
};

/** Ordem canônica das peças no bloco de import — a mesma do `index.ts`. */
const ORDEM = [
  'Drawer',
  'DrawerBody',
  'DrawerClose',
  'DrawerContent',
  'DrawerDescription',
  'DrawerFooter',
  'DrawerHeader',
  'DrawerTitle',
  'DrawerTrigger',
];

/** Bloco de import: as peças do drawer, depois o Button, que é gatilho e ação. */
function importar(pecas: string[], comCampos = false): string {
  const usadas = ORDEM.filter((peca) => pecas.includes(peca));
  const linhas = [
    `import {`,
    ...usadas.map((peca) => `  ${peca},`),
    `} from '@/components/ui/drawer'`,
    `import { Button } from '@/components/ui/button'`,
  ];
  if (comCampos) {
    linhas.push(`import { Input } from '@/components/ui/input'`);
    linhas.push(`import { Label } from '@/components/ui/label'`);
  }
  return linhas.join('\n');
}

type Moldura = {
  /** Props da raiz: `direction`, `default-open`, `:dismissible="false"`… */
  raiz?: string;
  /** Rótulo do gatilho. Vazio significa sem gatilho — quem abre está fora. */
  gatilho?: string;
  titulo: string;
  descricao: string;
  /** Corpo do painel, já indentado em 4 espaços. */
  corpo?: string;
  /** Rodapé completo, já indentado em 4 espaços. */
  rodape: string;
};

/**
 * Estrutura comum: raiz, gatilho, painel, cabeçalho, corpo e rodapé.
 *
 * `as-child` no gatilho não é enfeite: sem ele o design system renderizaria um
 * botão DENTRO de outro botão. O título e a descrição não são decoração — é
 * deles que saem o nome e a descrição acessíveis do painel.
 */
function drawer(m: Moldura): string {
  const { raiz = '', gatilho = '', corpo = '' } = m;
  const disparo = gatilho
    ? `  <DrawerTrigger as-child>
    <Button variant="outline">${gatilho}</Button>
  </DrawerTrigger>
`
    : '';
  const miolo = corpo ? `${corpo}\n` : '';

  return `<Drawer${attrs(raiz)}>
${disparo}  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>${m.titulo}</DrawerTitle>
      <DrawerDescription>${m.descricao}</DrawerDescription>
    </DrawerHeader>
${miolo}${m.rodape}
  </DrawerContent>
</Drawer>`;
}

/**
 * Rodapé do drawer: a ação primária vem PRIMEIRO no DOM.
 *
 * É o inverso do Dialog, e não descuido: o rodapé do drawer empilha em coluna
 * na tela estreita, e a ação principal fica no alto da pilha, onde o polegar
 * alcança.
 */
function rodape(acao: string, saida: string, destrutiva = false): string {
  return `    <DrawerFooter>
      <Button${destrutiva ? ' variant="destructive"' : ''}>${acao}</Button>
      <DrawerClose as-child>
        <Button variant="outline">${saida}</Button>
      </DrawerClose>
    </DrawerFooter>`;
}

/** Rodapé de saída única: não há o que confirmar, só o que fechar. */
function rodapeDeSaida(saida: string): string {
  return `    <DrawerFooter>
      <DrawerClose as-child>
        <Button variant="outline">${saida}</Button>
      </DrawerClose>
    </DrawerFooter>`;
}

const PECAS_COMPLETAS = [
  'Drawer',
  'DrawerBody',
  'DrawerClose',
  'DrawerContent',
  'DrawerDescription',
  'DrawerFooter',
  'DrawerHeader',
  'DrawerTitle',
  'DrawerTrigger',
];

const PECAS_SEM_CORPO = PECAS_COMPLETAS.filter((peca) => peca !== 'DrawerBody');

/**
 * Forma canônica: gatilho, cabeçalho, corpo rolável e o par de ações.
 *
 * Os quatro controls do Playground chegam aqui. `bottom` é o padrão da raiz, e
 * `dismissible` e `modal` nascem ligados — só o que difere entra no snippet.
 */
export const drawerSource: SourceTransform<DrawerArgs> = (_gerado, ctx) => {
  const { direction, defaultOpen, dismissible, modal } = ctx?.args ?? {};
  return vueSnippet(
    importar(PECAS_COMPLETAS),
    drawer({
      raiz: attrs(
        attr('direction', direction, 'bottom'),
        attrBool('default-open', defaultOpen, false),
        attrBool('dismissible', dismissible, true),
        attrBool('modal', modal, true),
      ).trim(),
      gatilho: 'Abrir drawer',
      titulo: 'Editar perfil',
      descricao: 'Atualize seus dados pessoais e foto.',
      corpo: `    <DrawerBody class="nds-text-body nds-text-muted-foreground">
      Conteúdo do drawer.
    </DrawerBody>`,
      rodape: rodape('Confirmar', 'Cancelar'),
    }),
  );
};

/** Molde das quatro direções: só a prop da raiz e o texto mudam. */
function porDirecao(
  direction: DrawerArgs['direction'],
  titulo: string,
  descricao: string,
  gatilho: string,
): string {
  return vueSnippet(
    importar(PECAS_COMPLETAS),
    drawer({
      raiz: attr('direction', direction, 'bottom'),
      gatilho,
      titulo,
      descricao,
      corpo: `    <DrawerBody class="nds-text-body nds-text-muted-foreground">
      Conteúdo do painel.
    </DrawerBody>`,
      rodape: rodapeDeSaida('Fechar'),
    }),
  );
}

/**
 * Variante Bottom: o padrão mobile-first, e a única direção em que a alça
 * aparece. A prop fica de fora — é o valor padrão da raiz.
 */
export function drawerBaixoSource(): string {
  return porDirecao(
    'bottom',
    'Detalhes do pedido',
    'Pedido #4287 confirmado em 15 de março.',
    'Ver detalhes',
  );
}

/** Variante Top: entra por cima. Serve a conteúdo curto e saída imediata. */
export function drawerTopoSource(): string {
  return porDirecao(
    'top',
    'Nova versão disponível',
    'Atualize agora para acessar as novidades.',
    'Ver novidades',
  );
}

/** Variante Left: a direção do menu, onde a pessoa espera encontrá-lo. */
export function drawerEsquerdaSource(): string {
  return porDirecao('left', 'Menu', 'Navegue pelas seções do app.', 'Abrir menu');
}

/** Variante Right: alternativa de desktop para edição e filtros. */
export function drawerDireitaSource(): string {
  return porDirecao(
    'right',
    'Filtros',
    'Refine sua busca por categoria, preço e disponibilidade.',
    'Abrir filtros',
  );
}

/**
 * Estado Closed: só o gatilho na tela.
 *
 * Fechado, o painel não existe no DOM — e o gatilho é o único caminho de
 * entrada.
 */
export function drawerFechadoSource(): string {
  return vueSnippet(
    importar(PECAS_SEM_CORPO),
    drawer({
      gatilho: 'Abrir drawer',
      titulo: 'Editar perfil',
      descricao: 'Atualize seus dados.',
      rodape: rodapeDeSaida('Cancelar'),
    }),
  );
}

/**
 * Estado Open: a montagem já aberta, sem estado externo nenhum.
 *
 * Aqui `default-open` É o assunto. Sem gatilho, porque não há o que clicar: o
 * painel já está na tela quando a página monta.
 */
export function drawerAbertoSource(): string {
  return vueSnippet(
    importar(PECAS_SEM_CORPO.filter((peca) => peca !== 'DrawerTrigger')),
    drawer({
      raiz: 'default-open',
      titulo: 'Editar perfil',
      descricao: 'Atualize seus dados pessoais. As mudanças são salvas ao confirmar.',
      rodape: rodape('Confirmar', 'Cancelar'),
    }),
  );
}

/**
 * Estado Controlled: o componente não decide nada sozinho.
 *
 * Ele abre quando o valor ligado diz que sim e avisa a cada mudança. Sem o
 * evento de volta, fechar por dentro deixaria o valor de fora em `true` e o
 * painel reabriria no ciclo seguinte.
 */
export function drawerControladoSource(): string {
  return vueSnippet(
    `${importar(PECAS_SEM_CORPO.filter((peca) => peca !== 'DrawerTrigger'))}
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster" data-spacing="sm">
    <Button @click="aberto = true">Abrir via estado externo</Button>
    <Button variant="outline" @click="aberto = false">Fechar via estado externo</Button>
  </div>
  <Drawer :open="aberto" @update:open="aberto = $event">
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>Controlado pelo pai</DrawerTitle>
        <DrawerDescription>Este drawer é comandado por estado externo.</DrawerDescription>
      </DrawerHeader>
      <DrawerFooter>
        <DrawerClose as-child>
          <Button variant="outline">Cancelar</Button>
        </DrawerClose>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</div>`,
  );
}

/**
 * Estado NotDismissible: sem dispensa por gesto.
 *
 * Escape e clique no overlay deixam de fechar — então a saída explícita do
 * rodapé é obrigatória. Sem ela o painel ficaria sem nenhum fechamento
 * alcançável por teclado.
 */
export function drawerNaoDispensavelSource(): string {
  return vueSnippet(
    importar(PECAS_SEM_CORPO.filter((peca) => peca !== 'DrawerTrigger')),
    drawer({
      raiz: ':dismissible="false"',
      titulo: 'Aceitar termos',
      descricao: 'Você precisa aceitar os termos para continuar.',
      rodape: rodape('Aceitar', 'Recusar'),
    }),
  );
}

/**
 * Composição WithForm: formulário curto no corpo e par de ações no rodapé.
 *
 * Cada campo mora num bloco com o próprio rótulo — é o `for`/`id` que liga os
 * dois, e sem ele o campo chega ao leitor sem nome.
 */
export function drawerComFormularioSource(): string {
  return vueSnippet(
    importar(PECAS_COMPLETAS, true),
    drawer({
      gatilho: 'Editar perfil',
      titulo: 'Editar perfil',
      descricao: 'Atualize seu nome e e-mail.',
      corpo: `    <DrawerBody>
      <form class="nds-grid" data-spacing="sm">
        <div class="nds-grid" data-spacing="xs">
          <Label for="drawer-name">Nome</Label>
          <Input id="drawer-name" default-value="Juliana Mucci" />
        </div>
        <div class="nds-grid" data-spacing="xs">
          <Label for="drawer-email">E-mail</Label>
          <Input id="drawer-email" type="email" default-value="juliana@example.com" />
        </div>
      </form>
    </DrawerBody>`,
      rodape: `    <DrawerFooter>
      <Button type="submit">Confirmar</Button>
      <DrawerClose as-child>
        <Button variant="outline">Cancelar</Button>
      </DrawerClose>
    </DrawerFooter>`,
    }),
  );
}

/**
 * Composição WithConfirmation: mensagem curta e par de ações.
 *
 * A consequência fica escrita na descrição, não subentendida. Vale para
 * confirmação reversível — ação bloqueante de verdade é outro componente.
 */
export function drawerComConfirmacaoSource(): string {
  return vueSnippet(
    importar(PECAS_SEM_CORPO),
    drawer({
      gatilho: 'Remover anexo',
      titulo: 'Remover anexo?',
      descricao: 'O anexo sai desta mensagem. Você pode adicioná-lo novamente depois.',
      rodape: rodape('Remover', 'Cancelar', true),
    }),
  );
}

/**
 * Composição WithScroll: corpo mais alto que o painel.
 *
 * Quem rola é o CORPO, dentro do teto de altura do painel, e o rodapé com as
 * ações continua na tela — é o que separa "conteúdo longo" de "ação fora de
 * alcance". O corpo já nasce alcançável por teclado (WCAG 2.1.1).
 */
export function drawerComRolagemSource(): string {
  return vueSnippet(
    `${importar(PECAS_COMPLETAS)}

const clausulas = [
  'Do objeto: os serviços são fornecidos no estado em que se encontram, e esta cláusula descreve o alcance de cada um deles.',
  'Do uso: a conta é pessoal e intransferível, e o acesso por terceiros depende de autorização registrada.',
  'Do encerramento: o cancelamento pode ser pedido a qualquer momento, e os dados ficam disponíveis por trinta dias.',
]`,
    drawer({
      gatilho: 'Ver termos',
      titulo: 'Termos de serviço',
      descricao: 'Leia atentamente os termos antes de aceitar.',
      corpo: `    <DrawerBody class="nds-text-body nds-text-muted-foreground">
      <p v-for="(clausula, i) in clausulas" :key="i">{{ clausula }}</p>
    </DrawerBody>`,
      rodape: rodape('Aceitar termos', 'Recusar'),
    }),
  );
}
