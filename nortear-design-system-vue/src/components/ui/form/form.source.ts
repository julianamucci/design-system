/**
 * Transforms do painel Code do Form.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O assunto do Form é a costura entre rótulo, controle e textos de apoio — e ela
 * só aparece quando o snippet mostra o campo COM o controle projetado dentro. A
 * tag sozinha esconde justamente a lição.
 */
import {
  attr,
  attrBool,
  attrs,
  attrsMultilinha,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type FormArgs = {
  label: string;
  placeholder: string;
  description: string;
  error: string;
  ariaInvalid: boolean;
  disabled: boolean;
};

const IMPORTS = `import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'`;

/**
 * A moldura do exemplo: sem largura máxima o campo estica até a borda da página
 * e a linha do rótulo deixa de ser lida como um par com o controle.
 */
const LARGURA = 'class="nds-max-w-sm"';

/**
 * Control de texto com o padrão do `meta`.
 *
 * Três entradas diferentes, três saídas diferentes: `undefined` é ausência de
 * control (a guarda transversal chama a transform sem args) e cai no padrão;
 * string vazia é o leitor tendo APAGADO o valor, e aí a peça some do snippet;
 * qualquer outra coisa — o espião de ação, um control de objeto — também cai no
 * padrão, porque interpolada apareceria como código no painel.
 */
function comPadrao(valor: unknown, padrao: string): string {
  if (typeof valor !== 'string') return padrao;
  return valor.trim() === '' ? '' : valor;
}

/** Campo raiz: os atributos quebram em linha quando a fila passa da margem. */
function campo(atributos: Array<string | false | null | undefined>, filho: string): string {
  return `<FormField${attrsMultilinha(atributos)}>\n${indentar(filho)}\n</FormField>`;
}

/**
 * Forma canônica: o campo em volta, o controle dentro, e nenhum `id` nem `for`
 * escrito à mão — é o campo que fecha a associação. Escrevê-los no snippet
 * ensinaria a fazer à mão o que o componente já faz.
 */
export const formSource: SourceTransform<FormArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const erro = comPadrao(args.error, '');
  // A mensagem de erro sozinha não alcança quem não enxerga cor: o controle
  // precisa sair inválido junto com ela.
  const invalido = args.ariaInvalid === true || erro !== '';
  return vueSnippet(
    IMPORTS,
    campo(
      [
        LARGURA,
        attr('label', comPadrao(args.label, 'Email')),
        attr('description', comPadrao(args.description, 'Usaremos apenas para contato.')),
        attr('error', erro),
      ],
      `<Input${attrs(
        'type="email"',
        attr('placeholder', comPadrao(args.placeholder, 'ex: joao@empresa.com')),
        invalido && 'aria-invalid="true"',
        attrBool('disabled', args.disabled, false),
      )} />`,
    ),
  );
};

/** Combinação mínima: rótulo e controle, nada abaixo. */
export function formRotuloEControleSource(): string {
  return vueSnippet(
    IMPORTS,
    campo([LARGURA, 'label="Nome completo"'], '<Input type="text" placeholder="ex: João da Silva" />'),
  );
}

/**
 * A peça a mais é o parágrafo de apoio — e ele não é só exibido: o campo o
 * aponta no `aria-describedby` do controle, então é lido junto com o rótulo.
 */
export function formComDescricaoSource(): string {
  return vueSnippet(
    IMPORTS,
    campo(
      [LARGURA, 'label="Senha"', 'description="Use pelo menos 8 caracteres, com letras e números."'],
      '<Input type="password" autocomplete="new-password" />',
    ),
  );
}

/**
 * Estado de erro. A mensagem entra por prop do campo, e o controle é marcado
 * como inválido: a cor da mensagem é a metade que só serve a quem enxerga.
 */
export function formInvalidoSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORTS}

const senha = ref('123')`,
    campo(
      [
        LARGURA,
        'label="Senha"',
        'description="Use pelo menos 8 caracteres, com letras e números."',
        'error="A senha precisa ter pelo menos 8 caracteres."',
      ],
      '<Input v-model="senha" type="password" aria-invalid="true" autocomplete="new-password" />',
    ),
  );
}

/**
 * Campo desabilitado: quem desliga é o CONTROLE, não o campo. O rótulo segue
 * visível e associado — escondê-lo tira a referência do valor que está ali.
 */
export function formDesabilitadoSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORTS}

const cpf = ref('000.000.000-00')`,
    campo(
      [LARGURA, 'label="CPF"', 'description="Preenchido pelo cadastro da empresa."'],
      '<Input v-model="cpf" type="text" disabled />',
    ),
  );
}

/**
 * A mesma marcação sob a paleta escura: a troca é de tema no documento, não de
 * markup. O que o exemplo mostra é o conjunto onde o contraste costuma cair
 * primeiro — rótulo, texto de apoio e mensagem de erro juntos.
 */
export function formPaletaEscuraSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
import { Fieldset, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const email = ref('joao@')
const cidade = ref('São Paulo')`,
    `<div class="nds-stack nds-max-w-sm">
  <FormField label="Nome completo">
    <Input type="text" placeholder="ex: João da Silva" />
  </FormField>
  <FormField
    label="Email"
    description="Usaremos apenas para contato."
    error="Endereço de email incompleto."
  >
    <Input v-model="email" type="email" aria-invalid="true" />
  </FormField>
  <Fieldset legend="Endereço de entrega">
    <FormField label="Cidade">
      <Input v-model="cidade" type="text" disabled />
    </FormField>
  </Fieldset>
</div>`,
  );
}

/**
 * Agrupamento semântico: a legenda é anunciada antes de cada campo do grupo, o
 * que dá contexto a rótulos que sozinhos seriam ambíguos.
 */
export function formFieldsetSource(): string {
  return vueSnippet(
    `import { Fieldset, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'`,
    `<Fieldset class="nds-max-w-sm" legend="Endereço de entrega">
  <FormField label="Rua">
    <Input type="text" placeholder="ex: Av. Paulista, 1000" />
  </FormField>
  <FormField label="Cidade">
    <Input type="text" placeholder="ex: São Paulo" />
  </FormField>
</Fieldset>`,
  );
}

/**
 * Formulário inteiro: controles de tipos diferentes passam pelo mesmo campo, e
 * a ordem de tabulação é a ordem do DOM — nenhum `tabindex` a escrever.
 */
export function formMultiplosCamposSource(): string {
  return vueSnippet(
    `import { FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

function salvar() {
  // envio dos dados
}`,
    `<form class="nds-stack nds-max-w-sm" @submit.prevent="salvar">
  <FormField label="Nome completo" description="Como aparece em documentos oficiais.">
    <Input type="text" name="nome" placeholder="ex: João da Silva" />
  </FormField>
  <FormField label="Email">
    <Input type="email" name="email" placeholder="ex: joao@empresa.com" />
  </FormField>
  <FormField label="Biografia" description="Máximo 280 caracteres.">
    <Textarea name="bio" :rows="3" />
  </FormField>
  <Button type="submit">Salvar</Button>
</form>`,
  );
}
