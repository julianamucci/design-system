/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Nenhum trecho FIXO escreve `default-open`: quem copia quer o diálogo comandado
 * pelo gatilho, e não nascendo aberto sobre a página. O atributo nas stories é
 * andaime de captura e de `play`, não ensinamento. Só o Playground o escreve,
 * e só quando quem lê liga o control.
 */
import {
  attr,
  attrBool,
  attrs,
  asCode,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

export type AlertDialogArgs = {
  defaultOpen: boolean;
  unmountOnHide: boolean;
  tone: 'destructive' | 'default';
  showMedia: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

/**
 * Rótulos de exemplo: saem do MESMO `translations.json` que a docs page e as
 * stories leem (`demonstration.labels`), presos a pt-BR — o painel Code é
 * fixture, e o idioma de quem lê é resolvido pela docs page.
 */
const L = alertDialogTranslations['pt-BR'].demonstration.labels;

/**
 * A composição inteira, do jeito que o contrato do componente a exige: gatilho,
 * painel, cabeçalho com título (e descrição, quando houver) e rodapé com as
 * duas saídas.
 *
 * `Cancelar` vem ANTES da ação no documento: é a ordem que o rodapé empilha em
 * tela estreita e a que o teclado percorre primeiro.
 */
type Composition = {
  root?: Array<string | false>;
  trigger?: { label: string; variant?: string };
  panel?: string;
  midia?: { className?: string };
  /**
   * Props do título — hoje só o nível de cabeçalho (`as="h3"`).
   *
   * Fica vazio na maioria das composições: `h2` é o padrão do primitivo, e
   * valor padrão não se escreve num snippet que alguém copia.
   */
  titleProps?: string;
  title: string;
  description?: string;
  cancelar: { label: string; evento?: string };
  acao: { label: string; variant?: string; evento?: string };
};

/**
 * A confirmação destrutiva canônica, com o conjunto destrutivo de
 * `demonstration.labels`. É a base das stories de estado e da maioria das
 * variantes: o que cada uma ensina é o que ela ACRESCENTA a esta base.
 */
function destructive(extra: Partial<Composition> = {}): Composition {
  return {
    trigger: { label: L.triggerLabel, variant: 'destructive' },
    title: L.title,
    description: L.description,
    cancelar: { label: L.cancel },
    acao: { label: L.action, variant: 'destructive' },
    ...extra,
  };
}

/** Import do design system, com só os subcomponentes que a composição usa. */
function importDialog(c: Composition): string {
  const names = [
    'AlertDialog',
    'AlertDialogAction',
    'AlertDialogCancel',
    'AlertDialogContent',
    'AlertDialogFooter',
    'AlertDialogHeader',
    'AlertDialogTitle',
  ];
  if (c.description) names.push('AlertDialogDescription');
  if (c.midia) names.push('AlertDialogMedia');
  if (c.trigger) names.push('AlertDialogTrigger');
  names.sort();
  return `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/alert-dialog'`;
}

/** Texto de bloco quebra em linhas próprias; frase curta fica na mesma linha. */
function withText(tag: string, attrs: string, content: string, recuo: number): string {
  const p = ' '.repeat(recuo);
  if (!content.includes('\n')) {
    return `${p}<${tag}${attrs}>${content}</${tag}>`;
  }
  return `${p}<${tag}${attrs}>\n${indentar(content, recuo + 2)}\n${p}</${tag}>`;
}

function dialogo(c: Composition): string {
  const lines: string[] = [`<AlertDialog${attrs(...(c.root ?? []))}>`];

  if (c.trigger) {
    // `as-child` faz o gatilho VESTIR o botão em vez de embrulhá-lo: um botão
    // dentro de outro não é marcação válida, e o foco iria para o de fora.
    lines.push(
      '  <AlertDialogTrigger as-child>',
      `    <Button${attrs(attr('variant', c.trigger.variant, 'default'))}>${c.trigger.label}</Button>`,
      '  </AlertDialogTrigger>',
    );
  }

  lines.push(`  <AlertDialogContent${attrs(c.panel)}>`, '    <AlertDialogHeader>');

  if (c.midia) {
    // A mídia é o PRIMEIRO filho do cabeçalho: é a ordem de leitura ícone →
    // título → descrição. (O `:has()` da folha a acha em qualquer posição.)
    lines.push(
      `      <AlertDialogMedia${attrs(c.midia.className)}>`,
      '        <TriangleAlert aria-hidden="true" />',
      '      </AlertDialogMedia>',
    );
  }

  lines.push(withText('AlertDialogTitle', attrs(c.titleProps), c.title, 6));
  if (c.description) lines.push(withText('AlertDialogDescription', '', c.description, 6));

  lines.push(
    '    </AlertDialogHeader>',
    '    <AlertDialogFooter>',
    `      <AlertDialogCancel${attrs(c.cancelar.evento)}>${c.cancelar.label}</AlertDialogCancel>`,
    `      <AlertDialogAction${attrs(attr('variant', c.acao.variant, 'default'), c.acao.evento)}>${c.acao.label}</AlertDialogAction>`,
    '    </AlertDialogFooter>',
    '  </AlertDialogContent>',
    '</AlertDialog>',
  );

  return lines.join('\n');
}

/** Monta o SFC a partir da composição, somando os imports de fora do módulo. */
function snippet(c: Composition, extras: string[] = [], state = ''): string {
  const imports = [importDialog(c)];
  if (c.trigger) imports.push(`import { Button } from '@/components/ui/button'`);
  if (c.midia) imports.push(`import { TriangleAlert } from 'lucide-vue-next'`);
  imports.push(...extras);
  const script = state ? `${imports.join('\n')}\n\n${state}` : imports.join('\n');
  return vueSnippet(script, dialogo(c));
}

/**
 * Forma canônica: o gatilho abre, o painel confirma, e as duas saídas ficam no
 * rodapé. A severidade é uma escolha só — ela vale para o gatilho e para a ação,
 * porque é a mesma operação anunciada duas vezes.
 *
 * O clique fora não fecha, e não há prop para isso: a decisão é obrigatória por
 * definição do papel. Nada a escrever no snippet.
 */
export const alertDialogSource: SourceTransform<AlertDialogArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const tom = asCode(args.tone) ?? 'destructive';
  return snippet({
    root: [
      attrBool('default-open', args.defaultOpen, false),
      attrBool('unmount-on-hide', args.unmountOnHide, true),
    ],
    trigger: { label: asCode(args.triggerLabel) ?? L.triggerLabel, variant: tom },
    midia: args.showMedia === true ? {} : undefined,
    title: asCode(args.title) ?? L.title,
    description: asCode(args.description) ?? L.description,
    cancelar: { label: asCode(args.cancelLabel) ?? L.cancel },
    acao: { label: asCode(args.actionLabel) ?? L.action, variant: tom },
  });
};

/**
 * Estado fechado, que é o de partida: nenhum atributo de abertura na raiz. Só o
 * gatilho está na tela, e o painel só existe depois do clique.
 */
export function alertDialogClosedSource(): string {
  return snippet(destructive());
}

/**
 * Aberto: o estado que o gatilho produz. O foco inicial vai para Cancelar, não
 * para a ação destrutiva — é decisão do componente, e não há prop a escrever
 * para obtê-la.
 *
 * A story nasce aberta para a captura; o trecho não, pela regra do cabeçalho.
 */
export function alertDialogOpenSource(): string {
  return snippet(destructive());
}

/** Confirmação: o handler da ação roda, e o fechamento vem do componente. */
export function alertDialogConfirmadoSource(): string {
  return snippet(
    destructive({
      acao: { label: L.action, variant: 'destructive', evento: '@click="excluirConta"' },
    }),
    [],
    `function excluirConta() {
  // O painel se fecha sozinho e devolve o foco ao gatilho; aqui fica o efeito
  // da confirmação.
}`,
  );
}

/**
 * Cancelamento: a saída neutra também é um botão do rodapé, e fechar por ela
 * não aciona a ação. O handler é opcional — existe para quem precisa saber que
 * a pessoa desistiu.
 */
export function alertDialogCanceladoSource(): string {
  return snippet(
    destructive({
      cancelar: { label: L.cancel, evento: '@click="aoDesistir"' },
      acao: { label: L.action, variant: 'destructive', evento: '@click="excluirConta"' },
    }),
    [],
    `function aoDesistir() {
  // A ação não roda: o painel fecha, o foco volta ao gatilho e nada é executado.
}

function excluirConta() {
  // Só chega aqui pelo botão de confirmação.
}`,
  );
}

/**
 * Abertura controlada: o estado sai do componente e passa a ser de quem
 * consome. O par escrito aberto — `:open` mais o evento — mostra os dois lados
 * do vínculo, e é o mesmo que `v-model:open`.
 *
 * A ação não escreve fechamento: ela pede o fechamento pelo mesmo evento de
 * mudança que o Cancelar e o Escape, e o vínculo acima o aplica.
 */
export function alertDialogControlledSource(): string {
  const composition = destructive({
    root: [':open="aberto"', '@update:open="aberto = $event"'],
    trigger: undefined,
  });
  return vueSnippet(
    `${importDialog(composition)}
import { Button } from '@/components/ui/button'
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button variant="destructive" @click="aberto = true">${L.triggerLabel}</Button>
${indentar(dialogo(composition))}
</div>`,
  );
}

/**
 * Bloco de mídia no topo do cabeçalho. O ícone é decorativo: quem nomeia o
 * painel é o título, por `aria-labelledby`.
 */
export function alertDialogWithIconSource(): string {
  return snippet(destructive({ midia: {} }));
}

/**
 * Confirmação destrutiva: a severidade aparece no gatilho e na ação, e a saída
 * neutra fica no contorno. Duas ações em pé de igualdade tirariam o peso da
 * decisão.
 */
export function alertDialogDestructiveSource(): string {
  return snippet(destructive());
}

/**
 * Nível do título: o painel entra numa hierarquia que a página já tem.
 *
 * `h2` é o padrão do primitivo, e serve à página cujo painel abre a partir do
 * `h1`. Aberto de dentro de uma seção que já é `h2`, o painel precisa CONTINUAR
 * a hierarquia em vez de repeti-la — daí `h3`.
 *
 * A tag é a única coisa que muda: o `aria-labelledby` do painel continua
 * apontando para este mesmo elemento, e o nome acessível continua saindo dele.
 */
export function alertDialogHeadingH3Source(): string {
  return snippet(destructive({ titleProps: 'as="h3"' }));
}

/**
 * Confirmação neutra: nada é irreversível, então a ação fica na variante padrão.
 * Pintar de vermelho uma saída de conta ensinaria alarme onde não há.
 */
export function alertDialogNeutralSource(): string {
  return snippet({
    trigger: { label: L.neutralTriggerLabel, variant: 'outline' },
    title: L.neutralTitle,
    description: L.neutralDescription,
    cancelar: { label: L.cancel },
    acao: { label: L.neutralAction },
  });
}

/**
 * Descrição longa: o painel cresce em altura e ela continua sendo a descrição
 * acessível. Não há prop de tamanho a ajustar.
 */
export function alertDialogDescriptionLongaSource(): string {
  return snippet(
    destructive({
      description: `Todos os seus dados, arquivos enviados, integrações ativas e o histórico
completo de faturamento serão removidos permanentemente dos nossos
servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança
fica disponível depois da confirmação.`,
    }),
  );
}

/**
 * Sem descrição: o título sozinho já diz o que se perde.
 *
 * A ausência é o assunto, e ela não se declara — o subcomponente simplesmente
 * não é renderizado, e o painel deixa de anunciar descrição em vez de apontar
 * para um parágrafo que não existe.
 */
export function alertDialogNoDescriptionSource(): string {
  return snippet({
    trigger: { label: 'Descartar rascunho', variant: 'destructive' },
    title: 'Descartar rascunho',
    cancelar: { label: L.cancel },
    acao: { label: 'Descartar', variant: 'destructive' },
  });
}

/**
 * Extensibilidade por classe: painel e blocos aceitam classe de LAYOUT.
 *
 * Cor, largura máxima e espaçamento interno não são extensíveis por classe
 * utilitária — o CSS do componente é carregado depois e vence no empate de
 * especificidade. Por isso o exemplo se limita a recorte e a encolhimento.
 */
export function alertDialogClassNameExtraSource(): string {
  return snippet(
    destructive({
      panel: 'class="nds-overflow-hidden"',
      midia: { className: 'class="nds-shrink-0"' },
    }),
  );
}
