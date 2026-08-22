/**
 * Transforms do painel Code do DropdownMenu.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Três coisas das stories NÃO entram no snippet, porque são andaime do quadro
 * do Storybook e não lição:
 *
 * - o `<div>` de contenção com altura mínima, que só existe para o popup caber
 *   no canvas;
 * - o `default-open`, que deixa o Chromatic fotografar o menu montado — um menu
 *   que se abre sozinho ao carregar a página é o oposto do que se copia;
 * - o `:modal="false"` que acompanha esse `default-open` para que o canvas não
 *   fique travado por trás do popup.
 *
 * Só o Playground escreve as duas props, e só quando o control as tira do
 * padrão.
 */
import { attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type DropdownMenuArgs = {
  defaultOpen: boolean;
  modal: boolean;
};

/** Ordem canônica das peças no bloco de import — a mesma do `index.ts`. */
const ORDER = [
  'DropdownMenu',
  'DropdownMenuCheckboxItem',
  'DropdownMenuContent',
  'DropdownMenuGroup',
  'DropdownMenuItem',
  'DropdownMenuLabel',
  'DropdownMenuRadioGroup',
  'DropdownMenuRadioItem',
  'DropdownMenuSeparator',
  'DropdownMenuShortcut',
  'DropdownMenuSub',
  'DropdownMenuSubContent',
  'DropdownMenuSubTrigger',
  'DropdownMenuTrigger',
];

/** Bloco de import: as peças do menu e o Button, que é sempre o gatilho. */
function importing(parts: string[]): string {
  const usadas = ORDER.filter((part) => parts.includes(part));
  return [
    `import {`,
    ...usadas.map((part) => `  ${part},`),
    `} from '@/components/ui/dropdown-menu'`,
    `import { Button } from '@/components/ui/button'`,
  ].join('\n');
}

/** Tríade mínima, presente em toda composição. */
const BASE = ['DropdownMenu', 'DropdownMenuContent', 'DropdownMenuTrigger'];

/**
 * O gatilho e o painel em volta do conteúdo do menu.
 *
 * `as-child` no gatilho não é enfeite: sem ele o design system renderizaria um
 * botão DENTRO de outro botão. `side="bottom"` e `align="start"` NÃO aparecem —
 * são os padrões do painel, e repeti-los ensinaria ruído.
 *
 * O conteúdo já chega indentado com quatro espaços.
 */
function menu(opcoes: { gatilho: string; conteudo: string; raiz?: string }): string {
  const { gatilho, conteudo, raiz = '' } = opcoes;
  return `<DropdownMenu${attrs(raiz)}>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">${gatilho}</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
${conteudo}
  </DropdownMenuContent>
</DropdownMenu>`;
}

/**
 * Forma canônica: um grupo nomeado, duas ações e a saída destrutiva separada
 * delas.
 *
 * Os dois controls do Playground chegam aqui, e os dois nascem no padrão da
 * raiz — fechado e modal.
 */
export const dropdownMenuSource: SourceTransform<DropdownMenuArgs> = (_gerado, ctx) => {
  const { defaultOpen, modal } = ctx?.args ?? {};
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
    ]),
    menu({
      raiz: attrs(
        attrBool('default-open', defaultOpen, false),
        attrBool('modal', modal, true),
      ).trim(),
      gatilho: 'Abrir menu',
      conteudo: `    <DropdownMenuGroup>
      <DropdownMenuLabel>Conta</DropdownMenuLabel>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
    </DropdownMenuGroup>`,
    }),
  );
};

/**
 * Variante Default: o item neutro, que herda a cor do painel.
 *
 * `variant` não aparece: `default` é o padrão do item, e escrevê-lo daria a
 * entender que existe uma escolha a fazer no caso comum.
 */
export function dropdownMenuDefaultSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      gatilho: 'Conta',
      conteudo: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuItem>Equipe</DropdownMenuItem>`,
    }),
  );
}

/**
 * Variante Destructive: a ação irreversível marcada pela cor de perigo.
 *
 * Ela existe para que "Excluir conta" não pareça "Editar perfil", e vem
 * separada das demais.
 */
export function dropdownMenuDestructiveSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem', 'DropdownMenuSeparator']),
    menu({
      gatilho: 'Conta',
      conteudo: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado Closed: só o gatilho na tela.
 *
 * Fechado não é "escondido": o portal desmonta o painel, e um popup só oculto
 * continuaria no percurso do leitor de tela.
 */
export function dropdownMenuClosedSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      gatilho: 'Abrir menu',
      conteudo: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Sair</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado Open: o menu montado, com os três itens que o teclado percorre.
 *
 * Setas, Home, End e o salto por letra vêm do primitivo — não há prop nenhuma a
 * ligar, e escrever uma ensinaria API que não existe.
 */
export function dropdownMenuOpenSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      raiz: 'default-open',
      gatilho: 'Abrir menu',
      conteudo: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuItem>Equipe</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado Controlled: a abertura vem de fora.
 *
 * O gatilho continua ali — o que muda é que a raiz passa a seguir o valor
 * ligado. Sem o evento de volta, fechar por dentro deixaria o valor externo em
 * `true` e o rótulo do botão de fora passaria a mentir.
 */
export function dropdownMenuControlledSource(): string {
  return vueSnippet(
    `${importing([...BASE, 'DropdownMenuItem'])}
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button @click="aberto = !aberto">
    {{ aberto ? 'Fechar pelo estado' : 'Abrir pelo estado' }}
  </Button>
  <DropdownMenu :open="aberto" @update:open="aberto = $event">
    <DropdownMenuTrigger as-child>
      <Button variant="outline">Ações</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Duplicar</DropdownMenuItem>
      <DropdownMenuItem>Arquivar</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>`,
  );
}

/**
 * Estado ItemDisabled: o item indisponível continua no menu, e é pulado.
 *
 * A seta salta por cima dele e o ponteiro não o alcança — as duas coisas vêm da
 * prop, não de cada consumidor.
 */
export function dropdownMenuItemDisabledSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      gatilho: 'Ações',
      conteudo: `    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem disabled>Arquivar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado CheckboxIndeterminate: os três estados de uma marcação lado a lado.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Os três são escritos por extenso de propósito — o assunto da story é o
 * CONTRASTE entre eles, e omitir o desmarcado apagaria metade da lição.
 *
 * O valor entra por `model-value` porque aqui ele é fixo, e não ligado: um
 * `v-model` pediria um estado que a story não tem.
 */
export function dropdownMenuMarkupMistaSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuCheckboxItem']),
    menu({
      gatilho: 'Colunas',
      conteudo: `    <DropdownMenuCheckboxItem model-value="indeterminate">Nome</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="true">E-mail</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="false">Telefone</DropdownMenuCheckboxItem>`,
    }),
  );
}

/**
 * Composição WithLabel: grupos nomeados pelo próprio rótulo.
 *
 * É o que o rótulo entrega além do texto: sem ele o leitor anuncia "grupo" e a
 * pessoa não sabe de qual bloco se trata. O rótulo não é item de menu — a seta
 * não pousa nele.
 */
export function dropdownMenuWithLabelSource(): string {
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
    ]),
    menu({
      gatilho: 'Conta',
      conteudo: `    <DropdownMenuGroup>
      <DropdownMenuLabel>Conta</DropdownMenuLabel>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuLabel>Suporte</DropdownMenuLabel>
      <DropdownMenuItem>Documentação</DropdownMenuItem>
      <DropdownMenuItem>Sair</DropdownMenuItem>
    </DropdownMenuGroup>`,
    }),
  );
}

/**
 * Composição WithCheckboxItems: alternadores independentes entre si.
 *
 * Cada item guarda a própria marcação, e alternar não fecha o menu — quem marca
 * uma coluna costuma marcar a próxima.
 */
export function dropdownMenuWithMarkupSource(): string {
  return vueSnippet(
    `${importing([
      ...BASE,
      'DropdownMenuCheckboxItem',
      'DropdownMenuGroup',
      'DropdownMenuLabel',
    ])}
import { ref } from 'vue'

const mostrarNome = ref(true)
const mostrarEmail = ref(false)`,
    menu({
      gatilho: 'Colunas',
      conteudo: `    <DropdownMenuGroup>
      <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
      <DropdownMenuCheckboxItem v-model="mostrarNome">Nome</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem v-model="mostrarEmail">E-mail</DropdownMenuCheckboxItem>
    </DropdownMenuGroup>`,
    }),
  );
}

/**
 * Composição WithRadioGroup: escolha única, o valor vive no grupo.
 *
 * É o que separa a escolha única da marcação: escolher um item desmarca o
 * anterior sem que ninguém escreva essa regra.
 */
export function dropdownMenuWithChoiceUnicaSource(): string {
  return vueSnippet(
    `${importing([
      ...BASE,
      'DropdownMenuLabel',
      'DropdownMenuRadioGroup',
      'DropdownMenuRadioItem',
    ])}
import { ref } from 'vue'

const tema = ref('light')`,
    menu({
      gatilho: 'Tema',
      conteudo: `    <DropdownMenuRadioGroup v-model="tema">
      <DropdownMenuLabel>Aparência</DropdownMenuLabel>
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>`,
    }),
  );
}

/**
 * Composição WithSubmenu: um segundo nível que abre ao lado.
 *
 * A tríade é obrigatória: `Sub` guarda o estado, `SubTrigger` é o item que
 * abre, `SubContent` é o painel filho. A seta para a direita entra e a da
 * esquerda volta — nada disso pede prop.
 */
export function dropdownMenuWithSubmenuSource(): string {
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuItem',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
    ]),
    menu({
      gatilho: 'Arquivo',
      conteudo: `    <DropdownMenuItem>Renomear</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>PDF</DropdownMenuItem>
        <DropdownMenuItem>CSV</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>`,
    }),
  );
}

/**
 * Composição WithShortcuts: o atalho encostado na borda direita do item.
 *
 * Ele mora DENTRO do item, e sem `aria-hidden`: é assim que ele entra no nome
 * acessível ("Copiar Ctrl C"). Escondido, a pessoa ouviria só "Copiar" e nunca
 * saberia que existe uma tecla.
 */
export function dropdownMenuWithShortcutsSource(): string {
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuShortcut',
    ]),
    menu({
      gatilho: 'Editar',
      conteudo: `    <DropdownMenuItem>
      Desfazer<DropdownMenuShortcut>Ctrl Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Copiar<DropdownMenuShortcut>Ctrl C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Colar<DropdownMenuShortcut>Ctrl V</DropdownMenuShortcut>
    </DropdownMenuItem>`,
    }),
  );
}
