/**
 * Transforms do painel Code do Popover.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O que fica de fora, porque é andaime da story:
 *
 *   · a moldura de contenção de layout em volta do gatilho, que existe para o
 *     painel portalizado não empurrar a foto do Chromatic;
 *   · o parágrafo "Área externa", alvo inerte para o clique-fora da `play`;
 *   · a consulta ao painel por `data-slot`, que é medição e não composição.
 */
import { attr, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type PopoverArgs = {
  defaultOpen: boolean;
  modal: boolean;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
};

/** Lado e alinhamento que o painel assume quando ninguém pede outro. */
const SIDE_DEFAULT = 'bottom';
const ALIGNMENT_DEFAULT = 'center';

/**
 * Booleano escrito por LIGAÇÃO explícita — `:nome="true"`, nunca o atributo
 * pelado.
 *
 * O atributo pelado só chega como `true` se a inferência de tipo do SFC tiver
 * marcado a prop como Boolean. Quando ela não marca — e aqui os tipos das props
 * vêm importados de fora do arquivo —, o que chega é a string vazia, que é
 * FALSA. O popover nasceria fechado num snippet que diz o contrário.
 */
function bool(name: string, value: unknown, padrao: boolean): string {
  if (typeof value !== 'boolean' || value === padrao) return '';
  return `:${name}="${value}"`;
}

/** Import do design system, uma peça por linha e em ordem alfabética. */
function importa(...parts: string[]): string {
  const list = [...new Set(parts)].sort();
  return `import {\n${list.map((part) => `  ${part},`).join('\n')}\n} from '@/components/ui/popover'`;
}

/** As peças de sempre, mais o botão que faz de gatilho. */
const IMPORT_BASE = `${importa(
  'Popover',
  'PopoverContent',
  'PopoverDescription',
  'PopoverHeader',
  'PopoverTitle',
  'PopoverTrigger',
)}
import { Button } from '@/components/ui/button'`;

/**
 * Painel de exemplo: cabeçalho com título e descrição, e o par de ações no pé.
 *
 * O título não é enfeite — é ele que REIVINDICA o nome acessível do painel.
 * Sem título, o painel herda o texto do gatilho; com título, o nome do diálogo
 * é o título.
 */
function configPanel(recuo = 2): string {
  const p = ' '.repeat(recuo);
  return `${p}<PopoverContent align="start">
${p}  <PopoverHeader>
${p}    <PopoverTitle>Configuracoes de exibição</PopoverTitle>
${p}    <PopoverDescription>Ajuste a aparência do conteúdo da página.</PopoverDescription>
${p}  </PopoverHeader>
${p}  <div class="nds-cluster" data-justify="end" data-spacing="sm">
${p}    <Button variant="ghost" size="sm">Cancelar</Button>
${p}    <Button size="sm">Salvar</Button>
${p}  </div>
${p}</PopoverContent>`;
}

/**
 * Raiz + gatilho + painel.
 *
 * `as-child` no gatilho é o que faz o `Button` do design system VIRAR o
 * gatilho, em vez de ganhar um botão em volta: dois botões aninhados são
 * markup inválido, e o de fora roubaria o clique.
 */
function popover(options: { root?: string; label: string; panel: string }): string {
  return `<Popover${attrs(options.root)}>
  <PopoverTrigger as-child>
    <Button variant="outline">${options.label}</Button>
  </PopoverTrigger>
${options.panel}
</Popover>`;
}

/**
 * Forma canônica: um gatilho que anuncia o diálogo, e um painel portalizado
 * com título, descrição e ações.
 *
 * `side` e `align` moram no PAINEL, não na raiz — é o painel que se posiciona
 * contra o gatilho.
 */
export const popoverSource: SourceTransform<PopoverArgs> = (_gerado, ctx) => {
  const root = attrs(
    bool('default-open', ctx?.args?.defaultOpen, false),
    bool('modal', ctx?.args?.modal, false),
  );
  const position = attrs(
    attr('side', ctx?.args?.side, SIDE_DEFAULT),
    attr('align', ctx?.args?.align, ALIGNMENT_DEFAULT),
  );

  return vueSnippet(
    IMPORT_BASE,
    `<Popover${root}>
  <PopoverTrigger as-child>
    <Button variant="outline">Abrir popover</Button>
  </PopoverTrigger>
  <PopoverContent${position}>
    <PopoverHeader>
      <PopoverTitle>Configuracoes de exibição</PopoverTitle>
      <PopoverDescription>
        Ajuste a aparência do conteúdo da página.
      </PopoverDescription>
    </PopoverHeader>
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Cancelar</Button>
      <Button size="sm">Salvar</Button>
    </div>
  </PopoverContent>
</Popover>`,
  );
};

/**
 * Conteúdo livre: só o painel com um texto. SEM título — e a ausência é o
 * assunto, porque é ela que faz o painel herdar o nome acessível do gatilho.
 * Um painel de papel `dialog` sem nome nenhum reprovaria em `aria-dialog-name`.
 */
export function popoverContentLivreSource(): string {
  return vueSnippet(
    `${importa('Popover', 'PopoverContent', 'PopoverTrigger')}
import { Button } from '@/components/ui/button'`,
    popover({
      root: ':default-open="true"',
      label: 'Ver atalhos',
      panel: `  <PopoverContent align="start">
    <p class="nds-text-body">Use Ctrl + K para abrir a busca em qualquer tela.</p>
  </PopoverContent>`,
    }),
  );
}

/**
 * Cabeçalho completo: título, descrição e o par de ações. Com título, é ele
 * que nomeia o painel — e não o texto do gatilho.
 */
export function popoverWithTitleSource(): string {
  return vueSnippet(
    IMPORT_BASE,
    popover({
      root: ':default-open="true"',
      label: 'Configuracoes',
      panel: configPanel(),
    }),
  );
}

/**
 * Formulário curto dentro do painel: é a razão de existir do popover — ele
 * guarda conteúdo INTERATIVO, e não uma dica de passagem.
 *
 * Os campos vêm por `v-model`: um campo que exibe valor sem devolvê-lo aceita
 * digitação e perde o que foi digitado no próximo render.
 */
export function popoverFormSource(): string {
  return vueSnippet(
    `${importa('Popover', 'PopoverContent', 'PopoverHeader', 'PopoverTitle', 'PopoverTrigger')}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'

const nome = ref('Ana Ribeiro')
const email = ref('ana@nortear.com.br')`,
    popover({
      root: ':default-open="true"',
      label: 'Editar perfil',
      panel: `  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>Editar perfil</PopoverTitle>
    </PopoverHeader>
    <form class="nds-stack" data-spacing="sm" @submit.prevent>
      <Label for="perfil-nome" class="nds-text-caption">Nome</Label>
      <Input id="perfil-nome" v-model="nome" />
      <Label for="perfil-email" class="nds-text-caption">Email</Label>
      <Input id="perfil-email" v-model="email" type="email" />
      <Button type="submit" size="sm">Atualizar</Button>
    </form>
  </PopoverContent>`,
    }),
  );
}

/**
 * Estado fechado: é AUSÊNCIA. O painel nem existe no DOM — desmontado, e não
 * escondido, então leitor de tela e busca do navegador não encontram conteúdo
 * que não está lá.
 */
export function popoverClosedSource(): string {
  return vueSnippet(IMPORT_BASE, popover({ label: 'Abrir popover', panel: configPanel() }));
}

/** Estado aberto na montagem: `default-open` é a forma não-controlada de abrir. */
export function popoverOpenSource(): string {
  return vueSnippet(
    IMPORT_BASE,
    popover({
      root: ':default-open="true"',
      label: 'Abrir popover',
      panel: configPanel(),
    }),
  );
}

/**
 * Ancoragem acima: `side` é a PREFERÊNCIA, não uma garantia — sem espaço acima
 * o painel vira para baixo sozinho. O que ele nunca faz é trocar de eixo.
 *
 * `side-offset` é a folga entre painel e gatilho, em px.
 */
export function popoverAboveSource(): string {
  return vueSnippet(
    IMPORT_BASE,
    popover({
      root: ':default-open="true"',
      label: 'Abrir acima',
      panel: `  <PopoverContent side="top" :side-offset="12">
    <PopoverHeader>
      <PopoverTitle>Ancorado acima</PopoverTitle>
      <PopoverDescription>Sem espaço acima, o painel vira para baixo sozinho.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>`,
    }),
  );
}

/**
 * Abertura comandada de fora: `v-model:open` entrega o estado a quem consome.
 *
 * Dois botões, e não um alternador: um alternador FORA do painel dispara a
 * dispensa por clique-fora antes do próprio clique, e o par fechar+abrir
 * reabriria o painel no mesmo gesto.
 */
export function popoverControlledSource(): string {
  return vueSnippet(
    `${IMPORT_BASE}
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <div class="nds-cluster" data-spacing="sm">
    <Button @click="aberto = true">Abrir externamente</Button>
    <Button variant="outline" @click="aberto = false">Fechar externamente</Button>
  </div>
  <Popover v-model:open="aberto">
    <PopoverTrigger as-child>
      <Button variant="outline">Trigger</Button>
    </PopoverTrigger>
${configPanel(4)}
  </Popover>
</div>`,
  );
}

/**
 * Modo modal: prende o foco no painel e bloqueia a rolagem do corpo.
 *
 * Não é o contrato de Dialog: o painel continua sem `aria-modal`, porque um
 * popover é conteúdo AO LADO, não no lugar do resto da página.
 */
export function popoverModalSource(): string {
  return vueSnippet(
    IMPORT_BASE,
    popover({
      root: ':default-open="true" :modal="true"',
      label: 'Abrir modal',
      panel: configPanel(),
    }),
  );
}

/**
 * Editar perfil: o caso clássico — formulário curto, com o par de ações no pé
 * do painel em vez de um botão solto.
 */
export function popoverEditarPerfilSource(): string {
  return vueSnippet(
    `${importa(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'

const nome = ref('Ana Ribeiro')
const email = ref('ana@nortear.com.br')`,
    popover({
      root: ':default-open="true"',
      label: 'Editar perfil',
      panel: `  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>Editar perfil</PopoverTitle>
      <PopoverDescription>Altere o nome e o email da conta.</PopoverDescription>
    </PopoverHeader>
    <form class="nds-stack" data-spacing="sm" @submit.prevent>
      <Label for="conta-nome" class="nds-text-caption">Nome</Label>
      <Input id="conta-nome" v-model="nome" />
      <Label for="conta-email" class="nds-text-caption">Email</Label>
      <Input id="conta-email" v-model="email" type="email" />
      <div class="nds-cluster" data-justify="end" data-spacing="sm">
        <Button variant="ghost" size="sm">Cancelar</Button>
        <Button type="submit" size="sm">Atualizar</Button>
      </div>
    </form>
  </PopoverContent>`,
    }),
  );
}

/**
 * Filtro de listagem: escolha MÚLTIPLA, e por isso marcar um status não fecha
 * o painel — fechar no primeiro clique obrigaria a reabrir para cada critério.
 *
 * Cada linha é um `<label>` em volta do campo: o rótulo fica associado sem
 * precisar de `for`/`id` casados à mão.
 */
export function popoverFilterSource(): string {
  return vueSnippet(
    `${importa(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
import { Button } from '@/components/ui/button'
import { reactive } from 'vue'

const status = reactive<Record<string, boolean>>({
  Ativo: true,
  Pendente: false,
  Arquivado: false,
})`,
    popover({
      root: ':default-open="true"',
      label: 'Filtros',
      panel: `  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>Filtrar por status</PopoverTitle>
      <PopoverDescription>Combine quantos status quiser na listagem.</PopoverDescription>
    </PopoverHeader>
    <div class="nds-stack nds-text-body" data-spacing="xs">
      <label v-for="(marcado, nome) in status" :key="nome" class="nds-cluster" data-spacing="sm">
        <input v-model="status[nome]" type="checkbox" class="nds-size-4" />
        <span>{{ nome }}</span>
      </label>
    </div>
    <div class="nds-cluster" data-justify="end" data-spacing="sm">
      <Button variant="ghost" size="sm">Limpar</Button>
      <Button size="sm">Aplicar</Button>
    </div>
  </PopoverContent>`,
    }),
  );
}

/**
 * Paleta restrita: cada amostra é um botão com nome acessível PRÓPRIO. A cor
 * não é o nome — quem não a distingue precisa do rótulo, e sem ele a amostra
 * fica muda.
 *
 * As seis saem escritas uma a uma, e não de um laço com `:class` montado em
 * runtime: classe montada por expressão não é auditável, e o verificador de
 * classe morta leria a expressão como se fosse o nome da classe.
 */
export function colorPopoverSelectorSource(): string {
  const amostras = [
    ['nds-bg-primary', 'Primária'],
    ['nds-bg-secondary', 'Secundária'],
    ['nds-bg-success', 'Sucesso'],
    ['nds-bg-warning', 'Atenção'],
    ['nds-bg-info', 'Informação'],
    ['nds-bg-destructive', 'Destrutiva'],
  ]
    .map(
      ([className, name]) =>
        `      <button type="button" class="nds-size-8 nds-rounded-full nds-border-soft nds-focus-ring ${className}" aria-label="${name}"></button>`,
    )
    .join('\n');

  return vueSnippet(
    `${importa(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
import { Button } from '@/components/ui/button'`,
    popover({
      root: ':default-open="true"',
      label: 'Escolher cor da etiqueta',
      panel: `  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>Cor da etiqueta</PopoverTitle>
      <PopoverDescription>Escolha uma cor da paleta do tema.</PopoverDescription>
    </PopoverHeader>
    <div class="nds-cluster" data-spacing="sm">
${amostras}
    </div>
  </PopoverContent>`,
    }),
  );
}

/**
 * Preferências booleanas: cada linha vale por si, e nenhuma depende do resto —
 * é o que separa isto de um grupo de escolha única.
 *
 * O rótulo e o campo dividem a linha por `data-justify="between"`; o campo fica
 * dentro do `<label>`, então a associação não depende de `for`/`id`.
 */
export function popoverPreferenciasSource(): string {
  return vueSnippet(
    `${importa(
      'Popover',
      'PopoverContent',
      'PopoverDescription',
      'PopoverHeader',
      'PopoverTitle',
      'PopoverTrigger',
    )}
import { Button } from '@/components/ui/button'
import { reactive } from 'vue'

const preferencias = reactive<Record<string, boolean>>({
  'Notificações': true,
  'Modo escuro': false,
  'Modo compacto': false,
})`,
    popover({
      root: ':default-open="true"',
      label: 'Configuracoes rápidas',
      panel: `  <PopoverContent align="start">
    <PopoverHeader>
      <PopoverTitle>Preferências</PopoverTitle>
      <PopoverDescription>Cada linha vale por si — nada aqui depende do resto.</PopoverDescription>
    </PopoverHeader>
    <div class="nds-stack nds-text-body" data-spacing="sm">
      <label
        v-for="(ligada, nome) in preferencias"
        :key="nome"
        class="nds-cluster"
        data-align="center"
        data-justify="between"
      >
        <span>{{ nome }}</span>
        <input v-model="preferencias[nome]" type="checkbox" class="nds-size-4" />
      </label>
    </div>
  </PopoverContent>`,
    }),
  );
}
