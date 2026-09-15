/**
 * Transforms do painel Code do Alert.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O caso mais grave aqui era o dismissible: a story monta um wrapper que
 * remonta o alert ao fechar, só para o canvas não ficar vazio depois da play.
 * Isso é andaime de teste — quem copiava levava a remontagem junto e ficava com
 * um alerta que nunca some.
 */
import {
  attrsMultilinha,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type AlertArgs = {
  variant: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  role: 'alert' | 'status' | 'note';
  dismissible: boolean;
};

const VARIANTS = ['default', 'destructive', 'success', 'warning', 'info'] as const;
const ROLES = ['alert', 'status', 'note'] as const;

const IMPORT = 'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";';
const IMPORT_WITH_ACTION =
  'import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";';
const IMPORT_BUTTON = 'import { Button } from "@/components/ui/button";';

/** Import do design system somado ao do ícone, nesta ordem em todos os snippets. */
function header(icons: string[], extra?: string): string {
  const lines = [extra ?? IMPORT];
  if (icons.length) lines.push(`import { ${icons.join(', ')} } from "lucide-react";`);
  return lines.join('\n');
}

/**
 * O corpo canônico: ícone decorativo, título e texto corrido.
 *
 * O ícone leva `aria-hidden` porque quem nomeia o alerta é o texto — e o
 * dimensionamento e o posicionamento são do `.nds-alert`, que trata o SVG filho
 * direto: nenhuma classe no ícone. Título e descrição ficam no `--foreground`:
 * em contêiner colorido, o texto corrido não pode depender da variante para
 * alcançar 4.5:1.
 */
function body(icon: string | null, title: string, description: string, indent = '  '): string {
  const lines: string[] = [];
  if (icon) lines.push(`${indent}<${icon} aria-hidden="true" />`);
  if (title) lines.push(`${indent}<AlertTitle>${title}</AlertTitle>`);
  lines.push(`${indent}<AlertDescription>${description}</AlertDescription>`);
  return lines.join('\n');
}

function alertBlock(attrs: string, inner: string): string {
  return `<Alert${attrs}>\n${inner}\n</Alert>`;
}

/** Recuo de um bloco inteiro, para aninhá-lo num contêiner. */
function indented(block: string, indent = '  '): string {
  return block
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');
}

/** Uma variante inteira: raiz, ícone próprio e o par título/descrição. */
function variant(
  name: (typeof VARIANTS)[number],
  icon: string,
  title: string,
  description: string,
): string {
  const attrs = name === 'default' ? '' : ` variant="${name}"`;
  return jsxSnippet(header([icon]), alertBlock(attrs, body(icon, title, description)));
}

/**
 * Transform do `meta` — vale para todas as stories dos quatro arquivos. Lê os
 * controls do Playground; nos arquivos que desligam os controls cai no padrão do
 * componente, que é o uso canônico.
 *
 * `role` merece atenção: o padrão `alert` é live region ASSERTIVA e interrompe o
 * leitor de tela. Ele só aparece no snippet quando o control escolhe outro
 * valor, porque escrever `role="alert"` sugeriria que a escolha é opcional
 * quando na verdade é ela que define se o conteúdo interrompe ou não.
 */
export const alertSource: SourceTransform<AlertArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  const attrs = attrsMultilinha([
    propOption('variant', args.variant, VARIANTS, 'default'),
    propOption('role', args.role, ROLES, 'alert'),
    propBool('dismissible', args.dismissible),
  ]);
  return jsxSnippet(
    header(['Info']),
    alertBlock(
      attrs,
      body('Info', 'Atenção', 'Suas alterações serão aplicadas na próxima sessão.'),
    ),
  );
};

/**
 * Cada variante diz a sua: o arquivo desliga os controls, então o `meta` não tem
 * args de onde ler e mostraria sempre a default. O ícone muda junto com a
 * variante — cor sozinha não comunica, e o par ícone + palavra é o que sustenta
 * o significado sem depender de enxergar a cor.
 */
export function alertDestructiveSource(): string {
  return variant(
    'destructive',
    'AlertCircle',
    'Erro ao salvar',
    'Não foi possível salvar. Verifique sua conexão e tente novamente.',
  );
}

export function alertSuccessSource(): string {
  return variant(
    'success',
    'CheckCircle2',
    'Perfil atualizado',
    'Suas informações foram salvas com sucesso.',
  );
}

export function alertWarningSource(): string {
  return variant(
    'warning',
    'TriangleAlert',
    'Assinatura expirando',
    'Sua assinatura expira em 3 dias. Renove para evitar interrupções.',
  );
}

export function alertInfoSource(): string {
  return variant(
    'info',
    'Info',
    'Dica',
    'Você pode fixar os filtros mais usados para acessá-los mais rápido.',
  );
}

/**
 * Dispensável por clique.
 *
 * O `render` monta um wrapper que remonta o alert ao fechar, para o canvas não
 * ficar vazio no Chromatic. Isso é andaime de teste, e é exatamente o que o
 * painel imprimia. Aqui fica só o contrato real: `dismissible` desenha o botão e
 * o componente se remove sozinho; `onDismiss` avisa depois, uma vez.
 */
export function alertDismissibleSource(): string {
  return jsxSnippet(
    `${header(['Info'])}

function handleDismiss() {
  // Dispara uma vez só, depois que o alerta já saiu da tela.
}`,
    alertBlock(
      ' dismissible onDismiss={handleDismiss}',
      body('Info', 'Preferências salvas', 'Você pode fechar este aviso quando quiser.'),
    ),
  );
}

/**
 * Dispensável por teclado: a marcação muda no rótulo do botão de fechar, que é
 * o que o leitor de tela anuncia no foco — por isso ele aparece no snippet.
 */
export function alertDismissibleByKeyboardSource(): string {
  return jsxSnippet(
    `${header(['CheckCircle2'])}

function handleDismiss() {
  // Dispara uma vez só, depois que o alerta já saiu da tela.
}`,
    alertBlock(
      attrsMultilinha([
        'variant="success"',
        'dismissible',
        'dismissLabel="Fechar confirmação"',
        'onDismiss={handleDismiss}',
      ]),
      body('CheckCircle2', 'Perfil atualizado', 'Suas informações foram salvas com sucesso.'),
    ),
  );
}

/**
 * As cinco variantes empilhadas: o assunto da story é a comparação de contraste
 * entre elas, e um alerta sozinho esconderia justamente isso. Sem ícone de
 * propósito — o que se mede aqui é texto sobre o fundo que a variante pinta.
 */
export function alertContrastSource(): string {
  const blocks = VARIANTS.map((name) => {
    const attrs = name === 'default' ? '' : ` variant="${name}"`;
    return [
      `  <Alert${attrs}>`,
      `    <AlertTitle>Título ${name}</AlertTitle>`,
      `    <AlertDescription>Texto corrido da variante ${name}.</AlertDescription>`,
      '  </Alert>',
    ].join('\n');
  }).join('\n');
  return jsxSnippet(
    IMPORT,
    `<div className="nds-stack" data-spacing="sm">\n${blocks}\n</div>`,
  );
}

/**
 * Sem título: a descrição vira o conteúdo inteiro. A ausência É o assunto, e o
 * snippet do `meta` mostraria o título de volta.
 */
export function alertNoTitleSource(): string {
  return jsxSnippet(
    header(['Info'], 'import { Alert, AlertDescription } from "@/components/ui/alert";'),
    alertBlock('', body('Info', '', 'Suas alterações serão aplicadas na próxima sessão.')),
  );
}

/**
 * Sem ícone: o layout vira coluna única sem nenhuma prop — o `.nds-alert` reage
 * à presença do SVG filho direto. Duas stories provam a mesma ausência com
 * textos diferentes, e cada painel ensina o texto que a sua story mostra.
 */
function noIcon(title: string, description: string): string {
  return jsxSnippet(IMPORT, alertBlock('', body(null, title, description)));
}

/** `WithoutIcon` de Estados. */
export function alertStateNoIconSource(): string {
  return noIcon('Atenção', 'Suas alterações serão aplicadas na próxima sessão.');
}

/** `WithoutIcon` de Composições. */
export function alertCompositionNoIconSource(): string {
  return noIcon('Sem ícone', 'Alert sem ícone mantém layout de coluna única.');
}

/**
 * Com ícone: o corpo canônico, com o texto que a story `WithIcon` renderiza —
 * o snippet do `meta` diria "Atenção" numa story que mostra "Informação".
 */
export function alertWithIconSource(): string {
  return jsxSnippet(
    header(['Info']),
    alertBlock('', body('Info', 'Informação', 'Ícone SVG posicionado automaticamente.')),
  );
}

/**
 * `role="note"` ao lado do padrão: os dois juntos são o assunto.
 *
 * `note` NÃO é live region — é o valor correto para conteúdo já presente no
 * carregamento, que não deve interromper a leitura. O padrão `alert` continua
 * assertivo e fica no snippet sem prop de papel, provando que a escolha do papel
 * é uma decisão de conteúdo, não de estilo.
 */
export function alertNoAnnouncementSource(): string {
  const noteBlock = [
    '  <Alert role="note">',
    body(
      'Info',
      'Nota de implementação',
      'Conteúdo estático: o leitor de tela lê na ordem do documento, sem interromper.',
      '    ',
    ),
    '  </Alert>',
  ].join('\n');
  const defaultBlock = [
    '  <Alert variant="destructive">',
    body(
      'AlertCircle',
      'Falha no envio',
      'Mensagem urgente surgida em tempo de execução: anúncio imediato.',
      '    ',
    ),
    '  </Alert>',
  ].join('\n');
  return jsxSnippet(
    header(['AlertCircle', 'Info']),
    `<div className="nds-stack" data-spacing="md">\n${noteBlock}\n${defaultBlock}\n</div>`,
  );
}

/**
 * Inserção dinâmica: o alerta nasce DEPOIS do carregamento, por mudança de
 * estado, e é o `role="alert"` da própria raiz que o anuncia.
 *
 * Nenhum contêiner `aria-live` em volta: a raiz já é região viva, e envolvê-la
 * em outra aninharia duas — o leitor de tela anuncia em dobro ou descarta um dos
 * anúncios, conforme o par navegador × leitor.
 */
export function alertDynamicInsertionSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${IMPORT}
${IMPORT_BUTTON}
import { CheckCircle2 } from "lucide-react";

const [generated, setGenerated] = useState(false);`,
    `<div className="nds-stack" data-spacing="sm">
  <div>
    <Button size="sm" variant="default" onClick={() => setGenerated(true)}>
      Gerar relatório
    </Button>
  </div>
  {generated && (
${indented(
  alertBlock('', body('CheckCircle2', 'Operação concluída', 'O relatório foi gerado com sucesso.')),
  '    ',
)}
  )}
</div>`,
  );
}

/**
 * Com ação: o `AlertAction` é o quarto subcomponente e o `meta` não o importa.
 *
 * O alerta em si não é focável — o Tab chega direto ao botão interno, que é o
 * único ponto de interação da composição.
 */
export function alertWithActionSource(): string {
  return jsxSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_BUTTON}
import { Info } from "lucide-react";`,
    alertBlock(
      '',
      [
        body('Info', 'Atualização disponível', 'Uma nova versão está pronta para instalação.'),
        '  <AlertAction>',
        '    <Button size="sm" variant="default">',
        '      Atualizar',
        '    </Button>',
        '  </AlertAction>',
      ].join('\n'),
    ),
  );
}

/**
 * Ação e botão de fechar no mesmo alerta. Nenhuma prop a mais: a ação é a
 * terceira coluna do grid, e o X fica à direita dela.
 */
export function alertWithActionAndDismissSource(): string {
  return jsxSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_BUTTON}
import { Info } from "lucide-react";

function handleDismiss() {
  // Dispara uma vez só, depois que o alerta já saiu da tela.
}`,
    alertBlock(
      ' dismissible onDismiss={handleDismiss}',
      [
        body('Info', 'Sessão expira em 5 minutos', 'Salve seu trabalho para não perder as alterações.'),
        '  <AlertAction>',
        '    <Button size="sm" variant="default">',
        '      Salvar agora',
        '    </Button>',
        '  </AlertAction>',
      ].join('\n'),
    ),
  );
}

/**
 * Classe do consumidor: ela SOMA às do design system, não substitui — em todos
 * os subcomponentes. O que a story prova é a composição de classes, e por isso o
 * snippet precisa mostrar o `className` em cada peça, e não só na raiz.
 */
export function alertAdditionalClassSource(): string {
  return jsxSnippet(
    `${IMPORT_WITH_ACTION}
${IMPORT_BUTTON}
import { Info } from "lucide-react";`,
    alertBlock(
      ' className="nds-w-full"',
      [
        '  <Info aria-hidden="true" />',
        '  <AlertTitle className="nds-w-full">Classe adicional</AlertTitle>',
        '  <AlertDescription className="nds-w-full">',
        '    A classe do consumidor convive com as do design system.',
        '  </AlertDescription>',
        '  <AlertAction className="nds-w-auto">',
        '    <Button size="sm" variant="default">',
        '      Ação',
        '    </Button>',
        '  </AlertAction>',
      ].join('\n'),
    ),
  );
}
