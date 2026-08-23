/**
 * Transforms do painel Code do Input.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O campo aparece SEMPRE com rótulo. O `<Input>` não tem nome acessível próprio
 * — quem o dá é o rótulo associado —, então um snippet com o campo sozinho é um
 * campo que o leitor de tela anuncia como nada. As stories de tipo mais novas
 * (busca, arquivo) já nascem assim; as antigas ficaram para trás.
 */
import {
  attr,
  attrBool,
  attrs,
  attrsMultilinha,
  asCode,
  indentar,
  text,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type InputArgs = {
  type: string;
  placeholder: string;
  disabled: boolean;
};

const IMPORTS = `import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'`;

/** Moldura do exemplo e o respiro entre o rótulo e o campo. */
const WIDTH = 'nds-w-xs';

/** Empilha rótulo, campo e o que vier depois (apoio, mensagem de erro). */
function empilhado(children: string[], width = WIDTH, espaco = 'xs'): string {
  const className = ['nds-stack', width].filter(Boolean).join(' ');
  return `<div class="${className}" data-spacing="${espaco}">
${indentar(children.join('\n'))}
</div>`;
}

/**
 * Par rótulo + campo. O `for` do rótulo e o `id` do campo são o que faz o
 * clique no texto levar o foco ao campo — e o que faz o leitor de tela
 * anunciar um pelo outro.
 */
function field(options: {
  id: string;
  label: string;
  input: string;
  depois?: string[];
  width?: string;
}): string {
  const { id, label, input, depois = [], width } = options;
  return empilhado([`<Label for="${id}">${label}</Label>`, input, ...depois], width);
}

/** `<Input>` com id e os atributos que diferem do padrão. */
function input(id: string, ...partes: Array<string | false | null | undefined>): string {
  return `<Input${attrs(`id="${id}"`, ...partes)} />`;
}

/**
 * Forma canônica: um campo de texto rotulado.
 *
 * `type` só entra quando sai de `text`, que é o padrão do HTML — repetir o
 * padrão ensina ruído, e a story de tipos é onde o atributo é o assunto.
 */
export const inputSource: SourceTransform<InputArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    IMPORTS,
    field({
      id: 'nome-completo',
      label: 'Nome completo',
      input: input(
        'nome-completo',
        attr('type', args.type, 'text'),
        attr('placeholder', text(asCode(args.placeholder), 'ex: João da Silva')),
        attrBool('disabled', args.disabled, false),
      ),
    }),
  );
};

/** Um tipo do HTML, rotulado. É o `type` que muda o teclado, o papel e o visual. */
function type(id: string, label: string, tipoHtml: string, marcador?: string): string {
  return vueSnippet(
    IMPORTS,
    field({
      id,
      label,
      input: input(id, `type="${tipoHtml}"`, marcador && `placeholder="${marcador}"`),
    }),
  );
}

/** Texto livre: o tipo padrão, escrito à vista porque aqui ele é o assunto. */
export function inputTypeTextSource(): string {
  return type('nome', 'Nome completo', 'text', 'ex: João da Silva');
}

/** Email: teclado com arroba no celular e validação nativa de formato. */
export function inputTypeEmailSource(): string {
  return type('email', 'Email', 'email', 'ex: joao@empresa.com');
}

/** Senha: o navegador mascara o valor e oferece o gerenciador de senhas. */
export function inputTypeSenhaSource(): string {
  return type('senha', 'Senha', 'password', '••••••••');
}

/** Número: teclado numérico e os controles de incremento do navegador. */
export function inputTypeNumberSource(): string {
  return type('quantidade', 'Quantidade', 'number', 'ex: 42');
}

/**
 * Busca: o papel implícito passa a `searchbox`, e é isso que o leitor de tela
 * anuncia. Nada no visual denuncia se o tipo estiver errado.
 */
export function inputTypeSearchSource(): string {
  return type('busca', 'Buscar', 'search', 'Buscar componentes...');
}

/**
 * Arquivo: sem marcador de exemplo — quem desenha o miolo é o navegador. O
 * botão nativo recebe estilo próprio do design system pela folha do componente.
 */
export function inputTypeFileSource(): string {
  return type('arquivo', 'Arquivo', 'file');
}

/**
 * Campo em repouso, rotulado. É também a marcação do foco e a do exemplo com
 * marcador: focar é INTERAÇÃO, e o marcador já está aqui.
 */
export function inputWithLabelSource(): string {
  return vueSnippet(
    IMPORTS,
    field({
      id: 'nome-completo',
      label: 'Nome completo',
      input: input('nome-completo', 'type="text"', 'placeholder="ex: João da Silva"'),
    }),
  );
}

/**
 * Desabilitado. O rótulo continua visível e associado — escondê-lo tira a
 * referência do que aquele valor significa.
 */
export function inputDisabledSource(): string {
  return vueSnippet(
    IMPORTS,
    field({
      id: 'campo-indisponivel',
      label: 'Campo desabilitado',
      input: input('campo-indisponivel', 'type="text"', 'placeholder="Não disponível"', 'disabled'),
    }),
  );
}

/**
 * Erro. `aria-invalid` é o que anuncia o estado, e `aria-describedby` é o que
 * liga o campo à mensagem: a cor da borda sozinha não alcança quem não enxerga.
 * O alvo do `describedby` precisa EXISTIR — um id que não aponta para nada
 * passa em checagem de atributo e não é lido por ninguém.
 */
export function inputWithErrorSource(): string {
  const id = 'email';
  const idMessage = 'email-erro';
  return vueSnippet(
    IMPORTS,
    field({
      id,
      label: 'Email',
      input: `<Input${attrsMultilinha(
        [
          `id="${id}"`,
          'type="email"',
          'placeholder="ex: joao@empresa.com"',
          'aria-invalid="true"',
          `aria-describedby="${idMessage}"`,
        ],
        '  ',
      )}/>`,
      depois: [
        `<p id="${idMessage}" class="nds-text-body nds-text-destructive">
  Email inválido. Use o formato nome@dominio.com
</p>`,
      ],
    }),
  );
}

/**
 * Texto de apoio. Visível não basta: sem `aria-describedby` a instrução não
 * chega a quem usa leitor de tela.
 */
export function inputWithHelperSource(): string {
  const id = 'email';
  const idHelper = 'email-apoio';
  return vueSnippet(
    IMPORTS,
    field({
      id,
      label: 'Email',
      input: input(
        id,
        'type="email"',
        'placeholder="ex: joao@empresa.com"',
        `aria-describedby="${idHelper}"`,
      ),
      depois: [
        `<p id="${idHelper}" class="nds-text-caption nds-text-muted-foreground">Usaremos este endereço para notificações.</p>`,
      ],
    }),
  );
}

/**
 * Campo obrigatório. Quem anuncia a obrigatoriedade é `aria-required`; o
 * asterisco é decoração, e por isso sai da leitura — sem `aria-hidden` o leitor
 * anunciaria "Nome completo asterisco".
 */
export function inputObrigatorioSource(): string {
  const id = 'nome-completo';
  return vueSnippet(
    IMPORTS,
    empilhado([
      `<Label for="${id}">
  Nome completo
  <span class="nds-text-destructive" aria-hidden="true">*</span>
</Label>`,
      input(id, 'type="text"', 'placeholder="ex: João da Silva"', 'aria-required="true"'),
      '<p class="nds-text-caption nds-text-muted-foreground">Campos com * são obrigatórios.</p>',
    ]),
  );
}

/**
 * A mesma marcação sob a paleta escura: a troca é de tema no documento, não de
 * markup. Os três estados juntos são o que precisa continuar distinguível.
 */
export function inputPaletteDarkSource(): string {
  return vueSnippet(
    IMPORTS,
    empilhado(
      [
        field({
          id: 'padrao',
          label: 'Padrão',
          input: input('padrao', 'type="text"', 'placeholder="ex: João da Silva"'),
          width: '',
        }),
        field({
          id: 'com-erro',
          label: 'Com erro',
          input: input(
            'com-erro',
            'type="email"',
            'aria-invalid="true"',
            'aria-describedby="com-erro-msg"',
          ),
          depois: [
            '<p id="com-erro-msg" class="nds-text-body nds-text-destructive">Email inválido</p>',
          ],
          width: '',
        }),
        field({
          id: 'indisponivel',
          label: 'Desabilitado',
          input: input('indisponivel', 'type="text"', 'placeholder="Não disponível"', 'disabled'),
          width: '',
        }),
      ],
      WIDTH,
      'md',
    ),
  );
}

const IMPORT_GROUP = `import { Label } from '@/components/ui/label'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'`;

/**
 * Os três alinhamentos de acessório dentro do grupo.
 *
 * A moldura é do GRUPO; o campo interno fica nu. Se o campo mantivesse a
 * própria borda, apareceria uma linha dupla no meio. Quem posiciona é o CSS a
 * partir do alinhamento declarado, não a ordem em que o acessório foi escrito —
 * mas escrever na ordem visual mantém a leitura do código igual à da tela.
 */
export function inputAlinhamentosSource(): string {
  return vueSnippet(
    IMPORT_GROUP,
    `<div class="nds-stack nds-w-md" data-spacing="lg">
  <div class="nds-stack" data-spacing="xs">
    <Label for="busca">Buscar</Label>
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <InputGroupText>@</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput id="busca" type="search" placeholder="Buscar" />
    </InputGroup>
  </div>

  <div class="nds-stack" data-spacing="xs">
    <Label for="atalho">Atalho</Label>
    <InputGroup>
      <InputGroupInput id="atalho" placeholder="Comando" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>Ctrl+K</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  </div>

  <div class="nds-stack" data-spacing="xs">
    <Label for="assunto">Mensagem</Label>
    <InputGroup>
      <InputGroupAddon align="block-start">
        <InputGroupText>Para: suporte</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput id="assunto" placeholder="Assunto" />
    </InputGroup>
  </div>
</div>`,
  );
}

/**
 * Acessório com botão. O ícone vai dentro de um `InputGroupButton`, e não solto:
 * o glifo sozinho dá um alvo abaixo dos 24x24 que a WCAG 2.5.8 exige, e é o
 * botão que o dimensiona. O nome do botão vem do rótulo declarado, porque o
 * ícone sai da leitura.
 */
export function inputAddonWithButtonSource(): string {
  return vueSnippet(
    `import { XIcon } from 'lucide-vue-next'
import { Label } from '@/components/ui/label'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'`,
    `<div class="nds-stack nds-w-md" data-spacing="xs">
  <Label for="usuario">Usuário</Label>
  <InputGroup>
    <InputGroupAddon align="inline-start">
      <InputGroupText>@</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput id="usuario" placeholder="nome.usuario" />
    <InputGroupAddon align="inline-end">
      <InputGroupButton type="button" size="icon-sm" aria-label="Limpar">
        <XIcon aria-hidden="true" />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</div>`,
  );
}
