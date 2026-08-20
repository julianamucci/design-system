/**
 * Transforms do painel Code do Switch.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que as stories montam em volta é andaime e não entra no snippet: a `key`
 * de remontagem do Playground existe só porque `defaultChecked` é prop de
 * MONTAGEM e o control precisa remontar o componente para mexer nela; o
 * invólucro `onCheckedChange={(checked) => onCheckedChange?.(checked)}` existe
 * só para o espião da aba Actions não receber o evento nativo (serializá-lo
 * estoura SecurityError). Quem copia escreve `onCheckedChange={setAtivo}`.
 *
 * A decisão de composição é o PAR: o Switch nunca aparece sozinho no snippet.
 * Um interruptor sem rótulo associado não tem nome acessível e não alterna pelo
 * clique no texto — e é justamente o `htmlFor`/`id` que dá as duas coisas de
 * uma vez.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  propOpcao,
  propTexto,
  type SourceTransform,
} from '@/lib/story-source';

export type SwitchArgs = {
  defaultChecked: boolean;
  disabled: boolean;
  name: string;
  size: 'default' | 'sm';
};

const TAMANHOS = ['default', 'sm'] as const;

const IMPORTS = `import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";`;

/**
 * O par rótulo ↔ controle, que é a unidade mínima utilizável do componente.
 *
 * O `id` do Switch e o `htmlFor` do Label são a mesma string por contrato: é
 * essa ligação que nomeia o controle para o leitor de tela e que faz o clique
 * no texto alternar o interruptor.
 */
function parRotulado(id: string, rotulo: string, atributos = ''): string {
  return `<div className="nds-cluster" data-spacing="sm">
  <Switch id="${id}"${atributos} />
  <Label htmlFor="${id}">${rotulo}</Label>
</div>`;
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Lê os controls
 * do Playground e imprime só o que difere do padrão do componente.
 *
 * `checked` não entra: é prop CONTROLADA e não tem control neste arquivo
 * (dar valor a ela congelaria o Playground). Quem quer o estado inicial usa
 * `defaultChecked`, e quem quer o estado controlado está na story própria.
 *
 * `onCheckedChange` NÃO é interpolado: o Storybook o entrega como espião, e o
 * corpo do mock apareceria no painel como se fosse código do design system.
 */
export const switchSource: SourceTransform<SwitchArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const atributos = attrs(
    propBool('defaultChecked', args.defaultChecked),
    propBool('disabled', args.disabled),
    propTexto('name', args.name),
    propOpcao('size', args.size, TAMANHOS, 'default'),
  );
  return jsxSnippet(
    IMPORTS,
    parRotulado('notificacoes-email', 'Receber notificações por email', atributos),
  );
};

/**
 * Painel de configuração: texto à esquerda, controle à direita.
 *
 * A descrição fica FORA do `Label` de propósito — dentro dele entraria no nome
 * acessível, e quem usa leitor de tela ouviria a frase inteira toda vez que
 * passasse pelo controle. O nome é o rótulo; a frase é contexto para quem vê.
 */
export function switchComDescricaoSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<div
  className="nds-cluster nds-w-sm nds-rounded-lg nds-border-default nds-p-4"
  data-align="center"
  data-justify="between"
>
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="emails-marketing">Emails de marketing</Label>
    <p className="nds-text-body">Receba novidades e promoções da plataforma.</p>
  </div>
  <Switch id="emails-marketing" />
</div>`,
  );
}

/**
 * Degrau compacto. O que se escreve é só `size="sm"`: a medida do trilho e do
 * thumb vive no CSS compartilhado, atrás do `data-size`. O par com o padrão que
 * a story desenha ao lado é vitrine de comparação, não composição a copiar.
 */
export function switchCompactoSource(): string {
  return jsxSnippet(IMPORTS, parRotulado('modo-compacto', 'Modo compacto', ' size="sm"'));
}

/**
 * Ligado na montagem. `defaultChecked` é prop de MONTAGEM e não-controlada: o
 * componente segue dono do próprio estado depois disso. Trocar por `checked`
 * aqui congelaria o interruptor no valor escrito.
 */
export function switchLigadoSource(): string {
  return jsxSnippet(IMPORTS, parRotulado('modo-escuro', 'Modo escuro', ' defaultChecked'));
}

/**
 * Desabilitado — estado que só existe no `render` da story, sem control que o
 * descreva neste arquivo. O rótulo continua ali: desabilitar o controle não é
 * motivo para esconder o que ele significa.
 */
export function switchDesabilitadoSource(): string {
  return jsxSnippet(
    IMPORTS,
    parRotulado('notificacoes-bloqueadas', 'Receber notificações por email', ' disabled'),
  );
}

/**
 * Desabilitado E ligado. As duas props juntas são o assunto: quem lê a tela
 * precisa saber que a opção está ATIVA ainda que não possa mudá-la — desligado
 * e bloqueado são fatos diferentes, e o desenho sozinho não os separa.
 */
export function switchDesabilitadoLigadoSource(): string {
  return jsxSnippet(IMPORTS, parRotulado('modo-escuro-fixo', 'Modo escuro', ' disabled defaultChecked'));
}

/**
 * Inválido. `aria-invalid` sozinho pinta o anel de erro e não diz o que houve;
 * é o `aria-describedby` apontando para a mensagem que fecha o par. Os dois
 * andam juntos ou nenhum dos dois serve.
 */
export function switchInvalidoSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<div className="nds-stack" data-spacing="xs">
  <div className="nds-cluster" data-spacing="sm">
    <Switch
      id="aceite-politica"
      aria-invalid="true"
      aria-describedby="aceite-politica-erro"
    />
    <Label htmlFor="aceite-politica">Aceitar política de privacidade</Label>
  </div>
  <p id="aceite-politica-erro" className="nds-text-body nds-text-destructive">
    Você precisa aceitar a política para continuar.
  </p>
</div>`,
  );
}

/**
 * Painel de configurações com o controle já ligado. Mesma anatomia do painel
 * com descrição, e a diferença é deliberada: aqui a preferência nasce ativa,
 * que é o caso comum de uma opção que o produto já entrega ligada.
 */
export function switchPainelSource(): string {
  return jsxSnippet(
    IMPORTS,
    `<div
  className="nds-cluster nds-w-md nds-rounded-lg nds-border-default nds-p-4"
  data-align="center"
  data-justify="between"
>
  <div className="nds-stack" data-spacing="xs">
    <Label htmlFor="painel-marketing">Emails de marketing</Label>
    <p className="nds-text-body">Receba novidades e promoções da plataforma.</p>
  </div>
  <Switch id="painel-marketing" defaultChecked />
</div>`,
  );
}

/**
 * Grupo de preferências. O `fieldset` + `legend` é o que diz que os três
 * controles pertencem ao mesmo assunto (WCAG 1.3.1) — sem ele o leitor de tela
 * anuncia três interruptores soltos, e "Receber emails" perde o "Notificações"
 * que o qualifica.
 *
 * A lista é escrita por extenso, e não mapeada de um array: no snippet o que
 * importa é a FORMA de cada linha, e um `map` esconderia justamente ela.
 */
export function switchPreferenciasSource(): string {
  const linha = (id: string, rotulo: string, descricao: string) => `    <div className="nds-cluster" data-align="center" data-justify="between">
      <div className="nds-stack nds-pr-4" data-spacing="xs">
        <Label htmlFor="${id}">${rotulo}</Label>
        <p className="nds-text-caption nds-text-muted-foreground">${descricao}</p>
      </div>
      <Switch id="${id}" />
    </div>`;

  return jsxSnippet(
    IMPORTS,
    `<fieldset className="nds-border-none nds-p-0 nds-m-0 nds-w-sm">
  <legend className="nds-text-body nds-font-semibold nds-mb-2">Notificações</legend>
  <div className="nds-stack" data-spacing="sm">
${linha('pref-email', 'Receber emails', 'Resumos diários por email.')}
${linha('pref-push', 'Notificações push', 'Alertas no navegador em tempo real.')}
${linha('pref-sms', 'SMS de segurança', 'Códigos de verificação por SMS.')}
  </div>
</fieldset>`,
  );
}

/**
 * Controlado por estado externo. O par é sempre este: `checked` recebe o valor
 * e o callback de mudança o devolve. Passar só `checked` deixa o interruptor
 * inerte — ele deixa de ser dono do próprio estado e ninguém assume o lugar.
 */
export function switchControladoSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORTS}

const [ativo, setAtivo] = useState(false);`,
    `<div className="nds-stack nds-w-sm" data-align="start" data-spacing="sm">
  <div className="nds-cluster" data-spacing="sm">
    <Switch id="tema-escuro" checked={ativo} onCheckedChange={setAtivo} />
    <Label htmlFor="tema-escuro">Modo escuro</Label>
  </div>
  <p className="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code className="nds-font-mono">{String(ativo)}</code>
  </p>
</div>`,
  );
}

/**
 * Lista densa no degrau compacto — barra de configurações rápidas. O rótulo
 * vem PRIMEIRO e o controle encosta na direita: numa lista de várias linhas é a
 * coluna de interruptores alinhada que deixa o estado de todas legível de uma
 * olhada só.
 */
export function switchListaCompactaSource(): string {
  const linha = (id: string, rotulo: string) => `  <div className="nds-cluster" data-align="center" data-justify="between">
    <Label htmlFor="${id}" className="nds-text-body">${rotulo}</Label>
    <Switch id="${id}" size="sm" />
  </div>`;

  return jsxSnippet(
    IMPORTS,
    `<div className="nds-stack nds-w-xs" data-spacing="sm">
${linha('rede-wifi', 'Wi-Fi')}
${linha('rede-bluetooth', 'Bluetooth')}
${linha('modo-aviao', 'Modo avião')}
</div>`,
  );
}
