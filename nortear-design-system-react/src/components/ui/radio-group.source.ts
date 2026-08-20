/**
 * Transforms do painel Code do RadioGroup.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta e NÃO entra no snippet: o `useState` que o
 * Playground usa só para o control de `disabled` continuar respondendo, o
 * repasse do espião `args.onValueChange`, o `{...args}` e as larguras mínimas
 * que existem para o quadro do Storybook não colapsar. Nada disso é composição
 * que alguém escreva.
 *
 * A decisão de composição: o par item + rótulo mora num contêiner próprio, e o
 * rótulo se liga ao item por `htmlFor`/`id`. É o `id` que dá NOME ACESSÍVEL ao
 * botão de rádio — sem ele o leitor de tela anuncia "opção" e nada mais, e a
 * área de clique fica reduzida ao círculo de 16px. Por isso todo snippet daqui
 * carrega o par de identificadores, mesmo nos exemplos mais curtos.
 *
 * O grupo é UNCONTROLLED por padrão: `defaultValue` cobre a maioria dos casos e
 * o par `value` + `onValueChange` só aparece onde a story ensina justamente
 * isso.
 */
import {
  attrs,
  indentar,
  jsxSnippet,
  propBool,
  propTexto,
  type SourceTransform,
} from '@/lib/story-source';

export type RadioGroupArgs = {
  disabled: boolean;
  name: string;
};

const IMPORT_ROTULO = 'import { Label } from "@/components/ui/label";';
const IMPORT_GRUPO =
  'import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";';
const IMPORTS = `${IMPORT_ROTULO}\n${IMPORT_GRUPO}`;

/**
 * Uma opção: item e rótulo lado a lado, ligados pelo `id`. O prefixo do `id`
 * muda por exemplo porque dois grupos na mesma página com os mesmos `id`
 * fariam o rótulo de um apontar para o item do outro.
 */
function opcao(prefixo: string, valor: string, rotulo: string, extra = ''): string {
  return `<div className="nds-cluster" data-spacing="sm">
  <RadioGroupItem value="${valor}" id="${prefixo}-${valor}"${extra} />
  <Label htmlFor="${prefixo}-${valor}">${rotulo}</Label>
</div>`;
}

/** As três formas de pagamento que atravessam quase todas as stories. */
function pagamentos(prefixo: string, extra = ''): string {
  return `${opcao(prefixo, 'cartao', 'Cartão de crédito', extra)}
${opcao(prefixo, 'pix', 'Pix', extra)}
${opcao(prefixo, 'boleto', 'Boleto bancário', extra)}`;
}

/** O grupo inteiro: raiz com os atributos que diferem do padrão e as opções. */
function grupo(raiz: string, opcoes: string): string {
  return `<RadioGroup${raiz}>\n${indentar(opcoes)}\n</RadioGroup>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls do
 * Playground; nas stories sem args imprime o grupo simples, que é a forma
 * canônica: três opções, nome acessível no grupo e nenhuma pré-selecionada.
 *
 * `disabled` desce para o grupo E para cada item. Anunciar o bloqueio só na
 * raiz deixaria o estado do item dependendo de a lib propagar a prop, e o que a
 * pessoa ouve tem que valer opção por opção.
 *
 * `onValueChange` NÃO é interpolado: o Storybook o entrega como espião, e o
 * corpo do mock apareceria no painel como se fosse código do design system.
 */
export const radioGroupSource: SourceTransform<RadioGroupArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const raiz = attrs(
    propTexto('name', args.name),
    propBool('disabled', args.disabled),
    'aria-label="Forma de pagamento"',
  );
  const extra = args.disabled === true ? ' disabled' : '';

  return jsxSnippet(IMPORTS, grupo(raiz, pagamentos('pagamento', extra)));
};

/**
 * Em linha. A direção sai de `aria-orientation`, e não de uma classe de layout:
 * o mesmo atributo que dispõe as opções lado a lado é o que anuncia para qual
 * eixo as setas do teclado apontam. Separar as duas coisas deixaria o desenho
 * contradizendo o que o leitor de tela diz.
 */
export function radioGroupHorizontalSource(): string {
  return jsxSnippet(
    IMPORTS,
    grupo(
      ' aria-orientation="horizontal" aria-label="Forma de entrega"',
      `${opcao('entrega', 'padrao', 'Padrão')}
${opcao('entrega', 'expressa', 'Expressa')}
${opcao('entrega', 'retirar', 'Retirar')}`,
    ),
  );
}

/**
 * Opção com texto auxiliar. O alinhamento vai para `start` e o item ganha um
 * respiro no topo: centralizado, o círculo desceria para o meio do bloco de
 * duas linhas e deixaria de encostar na linha do rótulo, que é onde a pessoa
 * espera encontrá-lo.
 */
export function radioGroupComDescricaoSource(): string {
  const item = (valor: string, titulo: string, descricao: string) =>
    `<div className="nds-cluster" data-align="start" data-spacing="sm">
  <RadioGroupItem value="${valor}" id="descricao-${valor}" className="nds-mt-0-5" />
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="descricao-${valor}">${titulo}</Label>
    <p className="nds-text-body">${descricao}</p>
  </div>
</div>`;

  return jsxSnippet(
    IMPORTS,
    grupo(
      ' aria-label="Forma de entrega" className="nds-max-w-md"',
      `${item('padrao', 'Padrão', 'Entrega em até 5 dias úteis. Frete grátis acima de R$ 99.')}
${item('expressa', 'Expressa', 'Entrega em 1 dia útil. Custo adicional de R$ 19,90.')}
${item('retirar', 'Retirar na loja', 'Disponível em 2 horas após confirmação do pagamento.')}`,
    ),
  );
}

/**
 * Opção já escolhida ao abrir a tela. `defaultValue` na RAIZ, e não um
 * `defaultChecked` no item: é o grupo que conhece a exclusão mútua, e marcar
 * dois itens de dentro deixaria o estado inicial ambíguo.
 */
export function radioGroupMarcadoSource(): string {
  return jsxSnippet(
    IMPORTS,
    grupo(
      ' defaultValue="pix" aria-label="Forma de pagamento"',
      `${opcao('marcado', 'cartao', 'Cartão de crédito')}
${opcao('marcado', 'pix', 'Pix')}`,
    ),
  );
}

/**
 * Grupo inteiro bloqueado. `disabled` aparece na raiz e em cada item porque o
 * que a pessoa ouve tem que valer opção por opção — a raiz sozinha descreve o
 * conjunto, não o botão em que o foco parou.
 */
export function radioGroupDesabilitadoSource(): string {
  return jsxSnippet(
    IMPORTS,
    grupo(
      ' disabled aria-label="Forma de pagamento"',
      `${opcao('bloqueado', 'cartao', 'Cartão de crédito', ' disabled')}
${opcao('bloqueado', 'pix', 'Pix', ' disabled')}`,
    ),
  );
}

/**
 * Só uma opção fora do ar. O rótulo DIZ que ela está indisponível: opacidade a
 * 50% é a única pista de quem enxerga, e não chega a quem ouve nem a quem não
 * distingue o contraste.
 */
export function radioGroupItemDesabilitadoSource(): string {
  return jsxSnippet(
    IMPORTS,
    grupo(
      ' aria-label="Forma de pagamento"',
      `${opcao('indisponivel', 'cartao', 'Cartão de crédito')}
${opcao('indisponivel', 'pix', 'Pix')}
${opcao('indisponivel', 'boleto', 'Boleto bancário (indisponível)', ' disabled')}`,
    ),
  );
}

/**
 * Erro de validação. A mensagem vem JUNTO do `aria-invalid` — a borda vermelha
 * sozinha diz que algo está errado sem dizer o quê, e some para quem não
 * distingue a cor.
 */
export function radioGroupInvalidoSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<div className="nds-stack" data-spacing="sm">
${indentar(
  grupo(
    ' aria-invalid="true" aria-label="Forma de pagamento"',
    `${opcao('invalido', 'cartao', 'Cartão de crédito', ' aria-invalid="true"')}
${opcao('invalido', 'pix', 'Pix', ' aria-invalid="true"')}`,
  ),
)}
  <p className="nds-text-body nds-text-destructive">
    Selecione uma forma de pagamento para continuar.
  </p>
</div>`,
  );
}

/**
 * Escolha controlada de fora. O par `value` + `onValueChange` é o que permite
 * validar, persistir ou reagir à seleção antes de ela virar tela — e é a única
 * forma de o valor sobreviver a uma remontagem do grupo.
 */
export function radioGroupControladoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORTS}

const [forma, setForma] = useState("");`,
    `<div className="nds-stack nds-w-xs" data-spacing="md">
${indentar(
  grupo(
    ' value={forma} onValueChange={setForma} aria-label="Forma de pagamento"',
    pagamentos('controlado'),
  ),
)}
  <p className="nds-text-body">
    Selecionado: <span className="nds-font-mono">{forma || "—"}</span>
  </p>
</div>`,
  );
}

/**
 * Dentro de um formulário. `name` é o que faz a escolha entrar no `FormData` no
 * envio; sem ele o grupo funciona na tela e chega vazio ao servidor. O botão
 * espera uma escolha porque um rádio não tem estado "nenhum" depois do primeiro
 * clique — deixá-lo enviar vazio seria a única forma de errar aqui.
 */
export function radioGroupEmFormularioSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
import { Button } from "@/components/ui/button";
${IMPORTS}

const [forma, setForma] = useState("");`,
    `<form
  className="nds-stack nds-w-xs"
  data-spacing="md"
  onSubmit={(evento) => {
    evento.preventDefault();
  }}
>
  <RadioGroup
    name="payment"
    value={forma}
    onValueChange={setForma}
    aria-label="Forma de pagamento"
  >
${indentar(
  `${opcao('formulario', 'cartao', 'Cartão de crédito')}
${opcao('formulario', 'pix', 'Pix')}`,
  '    ',
)}
  </RadioGroup>
  <Button type="submit" disabled={!forma}>
    Continuar
  </Button>
</form>`,
  );
}

/**
 * Cartão selecionável. O `Label` ENVOLVE o cartão inteiro, então a área de
 * clique é o cartão e não o círculo — e o destaque do escolhido sai de
 * `.nds-radio-card`, que lê o `aria-checked` do item de dentro por `:has()`.
 * Marcar o cartão por classe condicional duplicaria o estado em dois lugares.
 */
export function radioGroupCartoesSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORTS}

const [entrega, setEntrega] = useState("");

const ENTREGAS = [
  { valor: "padrao", titulo: "Padrão", descricao: "5 dias úteis · Frete grátis" },
  { valor: "expressa", titulo: "Expressa", descricao: "1 dia útil · R$ 19,90" },
  { valor: "retirar", titulo: "Retirar", descricao: "2 horas · Sem custo" },
];`,
    `<RadioGroup
  value={entrega}
  onValueChange={setEntrega}
  aria-label="Forma de entrega"
  className="nds-grid nds-sm-grid-3"
  data-spacing="sm"
>
  {ENTREGAS.map((entregaOpcao) => (
    <Label
      key={entregaOpcao.valor}
      htmlFor={\`cartao-\${entregaOpcao.valor}\`}
      className="nds-radio-card nds-stack"
      data-align="start"
      data-spacing="xs"
    >
      <div className="nds-cluster nds-w-full" data-align="center" data-justify="between">
        <span className="nds-text-body nds-font-medium">{entregaOpcao.titulo}</span>
        <RadioGroupItem
          value={entregaOpcao.valor}
          id={\`cartao-\${entregaOpcao.valor}\`}
        />
      </div>
      <p className="nds-text-caption nds-text-muted-foreground nds-font-normal">
        {entregaOpcao.descricao}
      </p>
    </Label>
  ))}
</RadioGroup>`,
  );
}
