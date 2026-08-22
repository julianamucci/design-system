/**
 * Transforms do painel Code do Form.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * O produto do Form não é o que se vê, é a costura de acessibilidade em volta
 * do controle — e ela não aparece no snippet porque o campo a escreve sozinho.
 * O que o snippet ensina é justamente isso: o rótulo NÃO leva `for`, o controle
 * NÃO leva `id`, e nem por isso a associação some.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';

export type FormArgs = {
  label: string;
  /** Tipo do controle projetado no campo. */
  type: string;
  placeholder: string;
  value: string;
  description: string;
  error: string;
  ariaInvalid: boolean;
  disabled: boolean;
  autocomplete: string;
};

const IMPORT_CAMPO = `import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";`;

const IMPORT_GRUPO = `import { Fieldset, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";`;

/** Forma canônica: um campo com rótulo, controle e texto de apoio. */
export function formSource(_gerado?: string, ctx?: { args?: Partial<FormArgs> }): string {
  const {
    label = 'Email',
    type = 'email',
    placeholder = 'ex: joao@empresa.com',
    value = '',
    description = 'Usaremos apenas para contato.',
    error = '',
    ariaInvalid = false,
    disabled = false,
    autocomplete = '',
  } = ctx?.args ?? {};

  // Mesma regra do campo: o controle é inválido quando quem compõe o declara ou
  // quando há mensagem de erro. Um erro visível com o controle ainda válido
  // separa o que a pessoa vê do que ela ouve.
  const invalido = ariaInvalid || Boolean(error);

  const fieldProps = attrsMultilinha([
    `label="${label}"`,
    description ? `description="${description}"` : '',
    error ? `error="${error}"` : '',
  ]);

  const controlProps = attrs(
    `type="${type}"`,
    placeholder ? `placeholder="${placeholder}"` : '',
    value ? `value="${value}"` : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
    disabled ? 'disabled' : '',
    invalido ? 'aria-invalid="true"' : '',
  );

  return svelteSnippet(
    IMPORT_CAMPO,
    `<FormField${fieldProps}>
  <Input${controlProps} />
</FormField>`,
  );
}

/** Variants/LabelAndControl — a combinação mínima: rótulo e controle, nada abaixo. */
export function formRotuloEControleSource(): string {
  return formSource('', {
    args: {
      label: 'Nome completo',
      type: 'text',
      placeholder: 'ex: João da Silva',
      description: '',
    },
  });
}

/** Variants/WithDescription — o parágrafo de apoio que o leitor de tela também lê. */
export function formComDescricaoSource(): string {
  return formSource('', {
    args: {
      label: 'Senha',
      type: 'password',
      placeholder: '',
      autocomplete: 'new-password',
      description: 'Use pelo menos 8 caracteres, com letras e números.',
    },
  });
}

/** States/Invalid — a mensagem de erro, anunciada e ligada ao controle. */
export function formInvalidoSource(): string {
  return formSource('', {
    args: {
      label: 'Senha',
      type: 'password',
      placeholder: '',
      value: '123',
      autocomplete: 'new-password',
      description: 'Use pelo menos 8 caracteres, com letras e números.',
      error: 'A senha precisa ter pelo menos 8 caracteres.',
    },
  });
}

/** States/Disabled — o controle bloqueado com rótulo e apoio ainda em pé. */
export function formDesabilitadoSource(): string {
  return formSource('', {
    args: {
      label: 'CPF',
      type: 'text',
      placeholder: '',
      value: '000.000.000-00',
      description: 'Preenchido pelo cadastro da empresa.',
      disabled: true,
    },
  });
}

/** States/DarkPalette — os três estados juntos, para comparar as cores da paleta. */
export function formPaletaEscuraSource(): string {
  return svelteSnippet(
    IMPORT_GRUPO,
    `<div class="nds-stack">
  <FormField label="Nome completo">
    <Input type="text" placeholder="ex: João da Silva" />
  </FormField>
  <FormField
    label="Email"
    description="Usaremos apenas para contato."
    error="Endereço de email incompleto."
  >
    <Input type="email" value="joao@" aria-invalid="true" />
  </FormField>
  <Fieldset legend="Endereço de entrega">
    <FormField label="Cidade">
      <Input type="text" value="São Paulo" disabled />
    </FormField>
  </Fieldset>
</div>`,
  );
}

/** Compositions/Fieldset — a legenda que dá contexto a rótulos ambíguos sozinhos. */
export function formFieldsetSource(): string {
  return svelteSnippet(
    IMPORT_GRUPO,
    `<Fieldset legend="Endereço de entrega">
  <FormField label="Rua">
    <Input type="text" placeholder="ex: Av. Paulista, 1000" />
  </FormField>
  <FormField label="Cidade">
    <Input type="text" placeholder="ex: São Paulo" />
  </FormField>
</Fieldset>`,
  );
}

/** Compositions/MultipleFields — o formulário inteiro, com três controles diferentes. */
export function formMultipleFieldsSource(): string {
  return svelteSnippet(
    `import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";`,
    // `nds-stack` é o que dá o respiro entre os campos: sem ele os três colam.
    `<form class="nds-stack">
  <FormField label="Nome completo" description="Como aparece em documentos oficiais.">
    <Input type="text" name="nome" placeholder="ex: João da Silva" />
  </FormField>
  <FormField label="Email">
    <Input type="email" name="email" placeholder="ex: joao@empresa.com" />
  </FormField>
  <FormField label="Biografia" description="Máximo 280 caracteres.">
    <Textarea name="bio" rows={3} />
  </FormField>
  <Button type="submit">Salvar</Button>
</form>`,
  );
}
