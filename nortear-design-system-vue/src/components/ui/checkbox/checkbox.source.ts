/**
 * Transforms do painel Code do Checkbox.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A caixa nunca aparece sozinha: o par caixa + rótulo associado por `id`/`for` é
 * o que dá nome acessível ao controle e o que faz o clique no texto alternar o
 * estado. Todo snippet daqui mostra o par.
 */
import { attr, attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type CheckboxArgs = {
  checked: boolean | 'indeterminate';
  disabled: boolean;
  required: boolean;
  name: string;
  value: string;
};

const IMPORT = `import { Checkbox } from '@/components/ui/checkbox'`;

/**
 * Estado inicial da caixa.
 *
 * `checked` é o alias do componente para o estado NÃO controlado, e o
 * indeterminado é o terceiro valor dele — não existe prop dedicada. Sai escrito
 * como ligação (`:checked`), e nunca como atributo puro: o valor é uma união de
 * booleano com texto, e atributo puro entregaria a string vazia.
 *
 * `false` é o padrão e não entra; qualquer outro valor (o espião de ação de um
 * control, um objeto) também não vira código.
 */
function attrChecked(valor: unknown): string {
  if (valor === true) return ':checked="true"';
  if (valor === 'indeterminate') return `:checked="'indeterminate'"`;
  return '';
}

/** O par canônico: a caixa, o rótulo, e o `for` que amarra os dois. */
function par(opcoes: {
  id: string;
  rotulo: string;
  caixa?: Array<string | false>;
  moldura?: string;
}): string {
  const { id, rotulo, caixa = [], moldura = '' } = opcoes;
  return `<div class="nds-cluster"${attrs('data-spacing="sm"', moldura)}>
  <Checkbox id="${id}"${attrs(...caixa)} />
  <label for="${id}" class="nds-label">${rotulo}</label>
</div>`;
}

const LABEL_TERMOS = 'Aceito os termos e condições';

/**
 * Playground: o par canônico, com estado inicial, desabilitado, obrigatório,
 * nome e valor saindo dos controls.
 *
 * `name` e `value` são controls de texto: passam por `attr`, que descarta o que
 * não for string — o Storybook troca arg de ação por um espião, e o corpo do
 * mock interpolado apareceria no painel como se fosse o exemplo.
 */
export const checkboxSource: SourceTransform<CheckboxArgs> = (_gerado, ctx) =>
  vueSnippet(
    IMPORT,
    par({
      id: 'termos',
      rotulo: LABEL_TERMOS,
      caixa: [
        attrChecked(ctx?.args?.checked),
        attrBool('disabled', ctx?.args?.disabled, false),
        attrBool('required', ctx?.args?.required, false),
        attr('name', ctx?.args?.name),
        // O valor enviado no submit nasce em "on": repeti-lo ensinaria ruído.
        attr('value', ctx?.args?.value, 'on'),
      ],
    }),
  );

/** Estado de partida: a caixa nasce desmarcada, sem prop nenhuma. */
export function checkboxDesmarcadoSource(): string {
  return vueSnippet(IMPORT, par({ id: 'termos', rotulo: LABEL_TERMOS }));
}

/** Marcado de saída — estado inicial, sem controle externo. */
export function checkboxCheckedSource(): string {
  return vueSnippet(
    IMPORT,
    par({ id: 'termos', rotulo: LABEL_TERMOS, caixa: [attrChecked(true)] }),
  );
}

/**
 * Misto: o terceiro valor do próprio estado, e não um atributo à parte. O
 * indicador desenha um traço, porque o fundo é o mesmo do marcado — o desenho é
 * a única coisa que separa "alguns" de "todos".
 */
export function checkboxMistoSource(): string {
  return vueSnippet(
    IMPORT,
    par({
      id: 'selecionar-todos',
      rotulo: 'Selecionar todos os itens',
      caixa: [attrChecked('indeterminate')],
    }),
  );
}

/**
 * Desabilitado. `data-disabled` na moldura do par é o que esmaece o rótulo:
 * a raiz da caixa não é um `<input>`, então nenhum seletor de irmão desabilitado
 * alcança o texto.
 */
export function checkboxDisabledSource(): string {
  return vueSnippet(
    IMPORT,
    par({
      id: 'sessao',
      rotulo: 'Manter sessão ativa',
      moldura: 'data-disabled="true"',
      caixa: [attrBool('disabled', true, false)],
    }),
  );
}

/** Desabilitado e marcado — desabilitado não é o mesmo que vazio. */
export function checkboxDisabledCheckedSource(): string {
  return vueSnippet(
    IMPORT,
    par({
      id: 'notificacoes',
      rotulo: 'Receber notificações push',
      moldura: 'data-disabled="true"',
      caixa: [attrBool('disabled', true, false), attrChecked(true)],
    }),
  );
}

/**
 * Erro: o estado inválido é anunciado por `aria-invalid`, e a frase que explica
 * o erro chega ao nome acessível por `aria-describedby`. Cor sozinha não
 * comunica erro a quem não a distingue.
 */
export function checkboxErrorSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-stack" data-spacing="xs">
  <div class="nds-cluster" data-spacing="sm">
    <Checkbox id="termos" aria-invalid="true" aria-describedby="termos-erro" />
    <label for="termos" class="nds-label">${LABEL_TERMOS}</label>
  </div>
  <p id="termos-erro" class="nds-text-body nds-text-destructive nds-pl-6">
    Você precisa aceitar os termos para continuar.
  </p>
</div>`,
  );
}

/**
 * Foco visível: não há prop a ligar — o anel sai do próprio componente quando o
 * foco vem do teclado. O que o exemplo mostra é a forma canônica.
 */
export function checkboxFocusSource(): string {
  return vueSnippet(
    IMPORT,
    par({ id: 'foco', rotulo: 'Foco visível via teclado' }),
  );
}

/** Composição mínima: a caixa e o rótulo que a nomeia. */
export function checkboxWithLabelSource(): string {
  return vueSnippet(IMPORT, par({ id: 'termos', rotulo: LABEL_TERMOS }));
}

/**
 * Com texto auxiliar. A descrição entra por `aria-describedby`, e não dentro do
 * rótulo: o nome acessível fica curto, e a explicação é lida depois dele.
 *
 * O alinhamento passa a ser pelo topo, e a caixa ganha um recuo de dois pixels
 * para pousar na primeira linha do texto.
 */
export function checkboxWithDescriptionSource(): string {
  return vueSnippet(
    IMPORT,
    `<div class="nds-cluster" data-align="start" data-spacing="sm">
  <Checkbox id="novidades" class="nds-mt-0-5" aria-describedby="novidades-ajuda" />
  <div class="nds-stack" data-spacing="xs">
    <label for="novidades" class="nds-label">Receber novidades por email</label>
    <p id="novidades-ajuda" class="nds-text-body">
      Enviaremos atualizações mensais sobre o produto.
    </p>
  </div>
</div>`,
  );
}

const PREFERENCIAS = `const preferencias = [
  { id: 'notificacao-email', rotulo: 'Receber novidades por email' },
  { id: 'notificacao-push', rotulo: 'Receber notificações push' },
  { id: 'notificacao-sessao', rotulo: 'Manter sessão ativa' },
]`;

/**
 * Grupo em `fieldset`. A `legend` é o nome do conjunto — sem ela, cada caixa é
 * anunciada solta e a pergunta que as reúne se perde.
 */
export function checkboxGroupSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${PREFERENCIAS}`,
    `<fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm">
  <legend class="nds-text-body nds-font-semibold nds-px-1">Preferências de notificação</legend>
  <div
    v-for="preferencia in preferencias"
    :key="preferencia.id"
    class="nds-cluster"
    data-spacing="sm"
  >
    <Checkbox :id="preferencia.id" />
    <label :for="preferencia.id" class="nds-label">{{ preferencia.rotulo }}</label>
  </div>
</fieldset>`,
  );
}

/**
 * Selecionar todos: a caixa mestra fica separada do grupo por uma linha, acima
 * dos itens que ela comanda. É ela que assume o estado misto quando só parte da
 * lista está marcada.
 */
export function checkboxSelectAllSource(): string {
  return vueSnippet(
    `${IMPORT}\n\n${PREFERENCIAS}`,
    `<fieldset class="nds-border-default nds-rounded-lg nds-p-4 nds-stack" data-spacing="sm">
  <legend class="nds-text-body nds-font-semibold nds-px-1">Preferências</legend>
  <div class="nds-cluster nds-border-b nds-pb-2" data-align="center" data-spacing="sm">
    <Checkbox id="selecionar-todos" />
    <label for="selecionar-todos" class="nds-label">Selecionar todos os itens</label>
  </div>
  <div
    v-for="preferencia in preferencias"
    :key="preferencia.id"
    class="nds-cluster"
    data-spacing="sm"
  >
    <Checkbox :id="preferencia.id" />
    <label :for="preferencia.id" class="nds-label">{{ preferencia.rotulo }}</label>
  </div>
</fieldset>`,
  );
}

/**
 * Em formulário. `name` e `value` são o que a caixa envia no submit — sem eles
 * o campo não chega ao `FormData`, e o `required` não tem o que exigir.
 *
 * O resto do formulário são os componentes do design system, não marcação crua:
 * um `<button>` escrito à mão perde a altura que cresce com a fonte (WCAG 1.4.4)
 * e as classes que o tema alcança.
 */
export function formCheckboxSource(): string {
  return vueSnippet(
    `import { Button } from '@/components/ui/button'
${IMPORT}
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'`,
    `<form class="nds-stack nds-w-sm" data-spacing="md" @submit.prevent>
  <div class="nds-stack" data-spacing="sm">
    <Label for="nome">Nome</Label>
    <Input id="nome" type="text" placeholder="Seu nome" />
  </div>
  <div class="nds-stack" data-spacing="sm">
    <Label for="email">Email</Label>
    <Input id="email" type="email" placeholder="seu@email.com" />
  </div>
  <div class="nds-cluster" data-align="start" data-spacing="sm">
    <Checkbox id="termos" name="terms" value="accepted" required class="nds-mt-0-5" />
    <div class="nds-stack" data-spacing="xs">
      <Label for="termos">${LABEL_TERMOS}</Label>
      <p class="nds-text-caption nds-text-muted-foreground">
        Campo obrigatório para criar a conta.
      </p>
    </div>
  </div>
  <Button type="submit" class="nds-w-full">Criar conta</Button>
</form>`,
  );
}
