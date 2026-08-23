/**
 * Transforms do painel Code do Checkbox.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * A unidade mínima deste componente NÃO é a caixa sozinha: é o par caixa+rótulo
 * ligado por `htmlFor`/`id`. Um `<Checkbox />` avulso no painel ensinaria um
 * controle sem nome acessível — exatamente o defeito que as plays deste slug
 * medem, e o que a raiz virar `<button>` nativo veio consertar.
 */
import {
  jsxSnippet,
  propBool,
  propText,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type CheckboxArgs = {
  defaultChecked: boolean;
  disabled: boolean;
  required: boolean;
  readOnly: boolean;
  indeterminate: boolean;
  name: string;
  value: string;
};

const IMPORT = 'import { Checkbox } from "@/components/ui/checkbox";';

/** Padrão documentado de `value`: repetir o padrão ensina ruído a quem copia. */
const VALUE_DEFAULT = 'on';

/**
 * `<Checkbox … />` em uma linha enquanto a fila couber, e um atributo por linha
 * quando não couber — atributo longo demais some na barra de rolagem do painel.
 * `indent` é a indentação da própria tag, para o fechamento voltar a ela.
 */
function tagCheckbox(partes: Array<string | false | undefined>, indent = '  '): string {
  const list = partes.filter((parte): parte is string => Boolean(parte));
  if (!list.length) return '<Checkbox />';
  const inLine = list.join(' ');
  if (inLine.length <= 56) return `<Checkbox ${inLine} />`;
  return `<Checkbox\n${list.map((parte) => `${indent}  ${parte}`).join('\n')}\n${indent}/>`;
}

/**
 * O par completo. `htmlFor` aponta para o `id` da caixa: é daí que sai o nome
 * acessível, e é o que faz o clique no texto mover o foco e alternar o estado.
 */
function pairLabelled(
  id: string,
  label: string,
  partes: Array<string | false | undefined> = [],
  atributosDoGrupo = '',
): string {
  return `<div className="nds-cluster" data-spacing="sm"${atributosDoGrupo}>
  ${tagCheckbox([`id="${id}"`, ...partes])}
  <label htmlFor="${id}" className="nds-label">
    ${label}
  </label>
</div>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args cai no padrão do componente, que é o uso
 * canônico: caixa desmarcada com rótulo associado. Toda prop só entra quando
 * difere do padrão.
 */
export const checkboxSource: SourceTransform<CheckboxArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const value = text(args.value);
  return jsxSnippet(
    IMPORT,
    pairLabelled('termos', 'Aceito os termos e condições', [
      propText('name', args.name),
      value && value !== VALUE_DEFAULT ? `value="${value}"` : undefined,
      propBool('defaultChecked', args.defaultChecked),
      propBool('indeterminate', args.indeterminate),
      propBool('disabled', args.disabled),
      propBool('required', args.required),
      propBool('readOnly', args.readOnly),
    ]),
  );
};

/** Marcada de saída sem controle externo: `defaultChecked` é ponto de partida. */
export function checkboxCheckedSource(): string {
  return jsxSnippet(IMPORT, pairLabelled('sessao', 'Manter sessão ativa', ['defaultChecked']));
}

/**
 * Estado misto: propriedade dedicada, não um terceiro valor de `checked`. É ela
 * que troca a marca de seleção pelo traço e leva o `aria-checked` a `mixed`.
 */
export function checkboxIndeterminadoSource(): string {
  return jsxSnippet(
    IMPORT,
    pairLabelled('itens', 'Selecionar todos os itens', ['indeterminate']),
  );
}

/**
 * Desabilitada: o esmaecimento é do grupo (`data-disabled`), não uma cor na
 * caixa — o rótulo precisa apagar junto para o par ler como um bloco só.
 */
export function checkboxDisabledSource(): string {
  return jsxSnippet(
    IMPORT,
    pairLabelled('notificacoes', 'Receber notificações push', ['disabled'], ' data-disabled="true"'),
  );
}

/** Desabilitada E marcada: mostrar a seleção sem permitir alterá-la. */
export function checkboxDisabledCheckedSource(): string {
  return jsxSnippet(
    IMPORT,
    pairLabelled(
      'itens-bloqueados',
      'Selecionar todos os itens',
      ['disabled', 'defaultChecked'],
      ' data-disabled="true"',
    ),
  );
}

/**
 * Erro: quem sinaliza é `aria-invalid`, e o CSS pinta borda e anel a partir
 * dele. A mensagem é um irmão do par, fora do rótulo, para não entrar no nome
 * acessível da caixa.
 */
export function checkboxErrorSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-stack" data-spacing="xs">
  <div className="nds-cluster" data-spacing="sm">
    <Checkbox id="aceite" aria-invalid="true" />
    <label htmlFor="aceite" className="nds-label">
      Aceito os termos e condições
    </label>
  </div>
  <p className="nds-text-body nds-text-destructive nds-pl-6">
    Você precisa aceitar os termos para continuar.
  </p>
</div>`,
  );
}

/**
 * Texto auxiliar: o alinhamento vai para `data-align="start"` e a caixa desce
 * meia linha, senão ela centraliza contra um bloco de duas alturas.
 */
export function checkboxWithDescriptionSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-cluster" data-spacing="sm" data-align="start">
  <Checkbox id="novidades" className="nds-mt-0-5" />
  <div className="nds-stack" data-spacing="xs">
    <label htmlFor="novidades" className="nds-label nds-cursor-pointer">
      Receber novidades por email
    </label>
    <p className="nds-text-body">
      Enviaremos no máximo 2 emails por semana.
    </p>
  </div>
</div>`,
  );
}

/**
 * Grupo: `fieldset` + `legend` são o que diz que as três caixas pertencem ao
 * mesmo conjunto (WCAG 1.3.1). Sem eles, cada rótulo chega isolado a quem lê a
 * tela e a pergunta do grupo some.
 */
export function checkboxGroupSource(): string {
  return jsxSnippet(
    `${IMPORT}

const CONTATOS = [
  { id: "contato-email", label: "Email" },
  { id: "contato-sms", label: "SMS" },
  { id: "contato-push", label: "Notificações push" },
];`,
    `<fieldset className="nds-stack nds-border-default nds-rounded-lg nds-p-4" data-spacing="sm">
  <legend className="nds-text-body nds-font-semibold nds-px-1">
    Preferências de contato
  </legend>
  {CONTATOS.map(({ id, label }) => (
    <div key={id} className="nds-cluster" data-spacing="sm">
      <Checkbox id={id} />
      <label htmlFor={id} className="nds-label">
        {label}
      </label>
    </div>
  ))}
</fieldset>`,
  );
}

/**
 * Seleção em massa. A caixa do topo é CONTROLADA de propósito: o estado misto
 * não é um valor que ela guarde sozinha, é uma conta sobre os filhos — nenhum,
 * alguns, todos. Marcação estática mostraria o desenho e esconderia a única
 * coisa que o padrão tem de particular.
 */
export function checkboxSelectAllSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT}

const ITENS = [
  { id: "item-1", label: "Relatório mensal" },
  { id: "item-2", label: "Relatório trimestral" },
  { id: "item-3", label: "Relatório anual" },
];`,
    `function SelecaoEmMassa() {
  const [marcados, setMarcados] = useState<string[]>([]);
  const todos = marcados.length === ITENS.length;
  const alguns = marcados.length > 0 && !todos;

  return (
    <div className="nds-stack" data-spacing="sm">
      <div className="nds-cluster nds-border-b nds-pb-2" data-align="center" data-spacing="sm">
        <Checkbox
          id="selecionar-todos"
          checked={todos}
          indeterminate={alguns}
          onCheckedChange={(marcado) => setMarcados(marcado ? ITENS.map((item) => item.id) : [])}
        />
        <label htmlFor="selecionar-todos" className="nds-label nds-font-semibold nds-cursor-pointer">
          Selecionar todos os itens
        </label>
      </div>
      {ITENS.map(({ id, label }) => (
        <div key={id} className="nds-cluster nds-pl-4" data-align="center" data-spacing="sm">
          <Checkbox
            id={id}
            checked={marcados.includes(id)}
            onCheckedChange={(marcado) =>
              setMarcados((atuais) =>
                marcado ? [...atuais, id] : atuais.filter((atual) => atual !== id),
              )
            }
          />
          <label htmlFor={id} className="nds-label">
            {label}
          </label>
        </div>
      ))}
    </div>
  );
}`,
  );
}

/**
 * Em card de seleção: o card é só a moldura — quem recebe o clique e o foco
 * continua sendo o par caixa+rótulo, sem `onClick` na moldura competindo com
 * ele.
 */
export function checkboxEmCardSource(): string {
  return jsxSnippet(
    IMPORT,
    `<div className="nds-rounded-lg nds-border-default nds-p-4 nds-shadow-sm nds-max-w-sm">
  <div className="nds-cluster" data-align="start" data-spacing="sm">
    <Checkbox id="plano-pro" className="nds-mt-0-5" />
    <div className="nds-stack" data-spacing="xs">
      <label htmlFor="plano-pro" className="nds-label nds-cursor-pointer">
        Plano Pro
      </label>
      <p className="nds-text-body">
        Acesso ilimitado a todos os recursos premium.
      </p>
    </div>
  </div>
</div>`,
  );
}

/**
 * Em formulário: `name` e `value` viajam no submit por um campo oculto ao lado
 * da caixa, então o estado que vale é o do `FormData` — ler estado de React aqui
 * duplicaria a fonte da verdade.
 */
export function formCheckboxSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT}
import { Button } from "@/components/ui/button";`,
    `function FormularioDeAceite() {
  const [aceitou, setAceitou] = useState(false);

  return (
    <form
      className="nds-stack nds-max-w-sm"
      data-spacing="md"
      onSubmit={(evento) => {
        evento.preventDefault();
        const dados = new FormData(evento.currentTarget);
        setAceitou(dados.get("termos") === "aceito");
      }}
    >
      <div className="nds-cluster" data-spacing="sm">
        <Checkbox id="form-termos" name="termos" value="aceito" />
        <label htmlFor="form-termos" className="nds-label">
          Aceito os termos e condições
        </label>
      </div>
      <Button type="submit">Enviar</Button>
      {aceitou && <p className="nds-text-body">Termos aceitos.</p>}
    </form>
  );
}`,
  );
}
