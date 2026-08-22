/**
 * Transforms do painel Code do Form.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que este componente entrega NÃO é o que se vê: é a costura de
 * acessibilidade em volta do campo, e ela só existe em atributo — `for` ↔ `id`,
 * `aria-describedby` apontando para a descrição e para a mensagem,
 * `aria-live="polite"` na mensagem, `data-error` no rótulo. Por isso nenhum
 * snippet escreve `id` ou `for`: quem os escreve é o campo, e mostrá-los aqui
 * ensinaria a fazer à mão o que o componente já faz.
 *
 * O ESTADO DE FORMULÁRIO NÃO MORA NESTE COMPONENTE. Valor, `touched`, `dirty` e
 * validação são da lib que a aplicação escolher; o que ele expõe é `label`,
 * `description` e `error` — e é só isso que os snippets podem ensinar sem
 * inventar API.
 */
import {
  attrs,
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propText,
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

const IMPORT_FIELD = `import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";`;

/**
 * Transform do `meta` — cascateia para todas as stories do arquivo.
 *
 * Lê os controls do Playground. `description` e `error` são opcionais no
 * componente: control vazio significa peça ausente, e peça ausente não vira
 * atributo com string vazia — um `aria-describedby=""` faz o leitor de tela
 * anunciar uma pausa sem conteúdo.
 */
export const formSource: SourceTransform<FormArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const temErro = typeof args.error === 'string' && args.error.trim() !== '';

  const campo = attrsMultilinha([
    propText('label', args.label) ?? 'label="Email"',
    propText('description', args.description),
    propText('error', args.error),
  ]);

  const controle = attrs(
    'type="email"',
    propText('placeholder', args.placeholder) ?? 'placeholder="ex: joao@empresa.com"',
    propBool('disabled', args.disabled),
    // `aria-invalid` acompanha a mensagem: cor no rótulo sozinha não alcança
    // quem não enxerga cor, e é o atributo que o leitor de tela anuncia.
    args.ariaInvalid === true || temErro ? 'aria-invalid' : undefined,
  );

  return jsxSnippet(
    IMPORT_FIELD,
    `<FormField${campo}>
  <Input${controle} />
</FormField>`,
  );
};

/**
 * Combinação mínima: rótulo e controle, nada abaixo. A AUSÊNCIA da descrição é
 * o assunto — sem ela o controle não pode ganhar um `aria-describedby` vazio,
 * o atributo tem que sumir.
 */
export function formLabelEControleSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `<FormField label="Nome completo">
  <Input type="text" placeholder="ex: João da Silva" />
</FormField>`,
  );
}

/**
 * Com texto de apoio. A descrição vem DEPOIS do controle — a instrução aparece
 * onde o campo termina, em vez de empurrar o campo para baixo da dobra — e o
 * campo a liga ao controle por `aria-describedby`, então ela é LIDA junto, não
 * só exibida.
 */
export function formWithDescriptionSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `<FormField
  label="Senha"
  description="Use pelo menos 8 caracteres, com letras e números."
>
  <Input type="password" autoComplete="new-password" />
</FormField>`,
  );
}

/**
 * Campo inválido. A mensagem nasce com `aria-live="polite"` (não `role="alert"`:
 * em validação a cada tecla, interromper a digitação a cada caractere é pior
 * que esperar a pausa) e pinta o rótulo por `data-error`. O `aria-invalid` no
 * controle é o par obrigatório: cor sozinha não é sinal acessível.
 */
export function formInvalidoSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `<FormField
  label="Senha"
  description="Use pelo menos 8 caracteres, com letras e números."
  error="A senha precisa ter pelo menos 8 caracteres."
>
  <Input type="password" aria-invalid autoComplete="new-password" />
</FormField>`,
  );
}

/**
 * Campo desabilitado. O `disabled` é do CONTROLE, não do campo: o rótulo
 * continua visível e associado, e a descrição continua sendo lida — esconder o
 * rótulo é o padrão que faz a pessoa perder a referência do que aquele valor
 * significa.
 */
export function formDisabledSource(): string {
  return jsxSnippet(
    IMPORT_FIELD,
    `<FormField label="CPF" description="Preenchido pelo cadastro da empresa.">
  <Input type="text" defaultValue="000.000.000-00" disabled />
</FormField>`,
  );
}

/**
 * Três campos em paletas diferentes. O que muda entre claro e escuro são os
 * tokens; o markup é o mesmo, e é isso que o snippet mostra — a mensagem de
 * erro e o texto de apoio precisam continuar distinguíveis um do outro em
 * qualquer paleta, o que só se sustenta se cada um usar o seu token.
 */
export function formEmDuasPaletasSource(): string {
  return jsxSnippet(
    `import { Fieldset, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";`,
    `<div className="nds-stack">
  <FormField label="Nome completo">
    <Input type="text" placeholder="ex: João da Silva" />
  </FormField>

  <FormField
    label="Email"
    description="Usaremos apenas para contato."
    error="Endereço de email incompleto."
  >
    <Input type="email" defaultValue="joao@" aria-invalid />
  </FormField>

  <Fieldset legend="Endereço de entrega">
    <FormField label="Cidade">
      <Input type="text" defaultValue="São Paulo" disabled />
    </FormField>
  </Fieldset>
</div>`,
  );
}

/**
 * Agrupamento semântico. O par nativo `<fieldset>`/`<legend>` é o que faz o
 * leitor de tela anunciar o grupo antes de cada campo, dando contexto a rótulos
 * que sozinhos seriam ambíguos ("Rua" de quê?). Um `<div>` com um título por
 * cima parece igual e não anuncia nada — e a legenda precisa ser o PRIMEIRO
 * filho, o que o componente garante.
 */
export function formWithFieldsetSource(): string {
  return jsxSnippet(
    `import { Fieldset, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";`,
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

/**
 * Formulário inteiro. Três controles diferentes passam pelo MESMO campo — a
 * busca do controle não é específica de `<input>` —, cada um descreve o próprio
 * texto de apoio (ids gerados sem colisão entre campos irmãos) e a ordem de
 * tabulação é a ordem do DOM, sem `tabIndex` em lugar nenhum.
 */
export function formWithMultipleFieldsSource(): string {
  return jsxSnippet(
    `import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";`,
    `<form className="nds-stack" onSubmit={(evento) => evento.preventDefault()}>
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
