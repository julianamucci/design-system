/**
 * Transforms do painel Code do AlertDialog.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
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
 * A composição inteira, do jeito que o contrato do componente a exige: gatilho,
 * painel, cabeçalho com título (e descrição, quando houver) e rodapé com as
 * duas saídas.
 *
 * `Cancelar` vem ANTES da ação no documento: é a ordem que o rodapé empilha em
 * tela estreita e a que o teclado percorre primeiro.
 */
type Composition = {
  raiz?: Array<string | false>;
  gatilho?: { rotulo: string; variante?: string };
  painel?: string;
  midia?: { classe?: string };
  titulo: string;
  descricao?: string;
  cancelar: { rotulo: string; evento?: string };
  acao: { rotulo: string; variante?: string; evento?: string };
};

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
  if (c.descricao) names.push('AlertDialogDescription');
  if (c.midia) names.push('AlertDialogMedia');
  if (c.gatilho) names.push('AlertDialogTrigger');
  names.sort();
  return `import {\n${names.map((n) => `  ${n},`).join('\n')}\n} from '@/components/ui/alert-dialog'`;
}

/** Texto de bloco quebra em linhas próprias; frase curta fica na mesma linha. */
function withText(tag: string, atributos: string, conteudo: string, recuo: number): string {
  const p = ' '.repeat(recuo);
  if (!conteudo.includes('\n')) {
    return `${p}<${tag}${atributos}>${conteudo}</${tag}>`;
  }
  return `${p}<${tag}${atributos}>\n${indentar(conteudo, recuo + 2)}\n${p}</${tag}>`;
}

function dialogo(c: Composition): string {
  const linhas: string[] = [`<AlertDialog${attrs(...(c.raiz ?? []))}>`];

  if (c.gatilho) {
    // `as-child` faz o gatilho VESTIR o botão em vez de embrulhá-lo: um botão
    // dentro de outro não é marcação válida, e o foco iria para o de fora.
    linhas.push(
      '  <AlertDialogTrigger as-child>',
      `    <Button${attrs(attr('variant', c.gatilho.variante, 'default'))}>${c.gatilho.rotulo}</Button>`,
      '  </AlertDialogTrigger>',
    );
  }

  linhas.push(`  <AlertDialogContent${attrs(c.painel)}>`, '    <AlertDialogHeader>');

  if (c.midia) {
    // A mídia é o PRIMEIRO filho do cabeçalho: dessa ordem dependem tanto a
    // centralização do CSS quanto a leitura ícone → título → descrição.
    linhas.push(
      `      <AlertDialogMedia${attrs(c.midia.classe)}>`,
      '        <TriangleAlert aria-hidden="true" />',
      '      </AlertDialogMedia>',
    );
  }

  linhas.push(withText('AlertDialogTitle', '', c.titulo, 6));
  if (c.descricao) linhas.push(withText('AlertDialogDescription', '', c.descricao, 6));

  linhas.push(
    '    </AlertDialogHeader>',
    '    <AlertDialogFooter>',
    `      <AlertDialogCancel${attrs(c.cancelar.evento)}>${c.cancelar.rotulo}</AlertDialogCancel>`,
    `      <AlertDialogAction${attrs(attr('variant', c.acao.variante, 'default'), c.acao.evento)}>${c.acao.rotulo}</AlertDialogAction>`,
    '    </AlertDialogFooter>',
    '  </AlertDialogContent>',
    '</AlertDialog>',
  );

  return linhas.join('\n');
}

/** Monta o SFC a partir da composição, somando os imports de fora do módulo. */
function snippet(c: Composition, extras: string[] = [], estado = ''): string {
  const imports = [importDialog(c)];
  if (c.gatilho) imports.push(`import { Button } from '@/components/ui/button'`);
  if (c.midia) imports.push(`import { TriangleAlert } from 'lucide-vue-next'`);
  imports.push(...extras);
  const script = estado ? `${imports.join('\n')}\n\n${estado}` : imports.join('\n');
  return vueSnippet(script, dialogo(c));
}

const DESCRIPTION_DEFAULT =
  'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.';

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
    raiz: [
      attrBool('default-open', args.defaultOpen, false),
      attrBool('unmount-on-hide', args.unmountOnHide, true),
    ],
    gatilho: { rotulo: asCode(args.triggerLabel) ?? 'Excluir conta', variante: tom },
    midia: args.showMedia === true ? {} : undefined,
    titulo: asCode(args.title) ?? 'Excluir conta',
    descricao: asCode(args.description) ?? DESCRIPTION_DEFAULT,
    cancelar: { rotulo: asCode(args.cancelLabel) ?? 'Cancelar' },
    acao: { rotulo: asCode(args.actionLabel) ?? 'Excluir', variante: tom },
  });
};

/**
 * Estado fechado, que é o de partida: nenhum atributo de abertura na raiz. Só o
 * gatilho está na tela, e o painel só existe depois do clique.
 */
export function alertDialogClosedSource(): string {
  return snippet({
    gatilho: { rotulo: 'Excluir item', variante: 'destructive' },
    titulo: 'Confirmar exclusão',
    descricao: 'Esta ação não pode ser desfeita.',
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Excluir', variante: 'destructive' },
  });
}

/**
 * Aberto na montagem: `default-open` é o modo não controlado, e a partir daí o
 * estado é do próprio componente.
 *
 * O foco inicial vai para Cancelar, não para a ação destrutiva — é decisão do
 * componente, e não há prop a escrever para obtê-la.
 */
export function alertDialogOpenSource(): string {
  return snippet({
    raiz: ['default-open'],
    gatilho: { rotulo: 'Excluir item', variante: 'destructive' },
    titulo: 'Excluir item permanentemente?',
    descricao: 'O item será removido de forma definitiva e não poderá ser recuperado.',
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Excluir', variante: 'destructive' },
  });
}

/** Confirmação: o handler da ação roda, e o fechamento vem do componente. */
export function alertDialogConfirmadoSource(): string {
  return snippet(
    {
      raiz: ['default-open'],
      gatilho: { rotulo: 'Excluir item', variante: 'destructive' },
      titulo: 'Confirmar exclusão',
      descricao: 'Esta ação é permanente.',
      cancelar: { rotulo: 'Cancelar' },
      acao: { rotulo: 'Excluir', variante: 'destructive', evento: '@click="excluirItem"' },
    },
    [],
    `function excluirItem() {
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
    {
      raiz: ['default-open'],
      titulo: 'Confirmar exclusão',
      descricao: 'Esta ação é permanente.',
      cancelar: { rotulo: 'Cancelar', evento: '@click="aoDesistir"' },
      acao: { rotulo: 'Excluir', variante: 'destructive', evento: '@click="excluirItem"' },
    },
    [],
    `function aoDesistir() {
  // A ação não roda: o painel fecha e nada é executado.
}

function excluirItem() {
  // Só chega aqui pelo botão de confirmação.
}`,
  );
}

/**
 * Abertura controlada: o estado sai do componente e passa a ser de quem
 * consome. O par escrito aberto — `:open` mais o evento — mostra os dois lados
 * do vínculo, e é o mesmo que `v-model:open`.
 */
export function alertDialogControlledSource(): string {
  const composition: Composition = {
    raiz: [':open="aberto"', '@update:open="aberto = $event"'],
    titulo: 'Controlado pelo pai',
    descricao: 'Este diálogo é comandado por estado externo.',
    cancelar: { rotulo: 'Fechar' },
    acao: { rotulo: 'Confirmar', variante: 'destructive', evento: '@click="aberto = false"' },
  };
  return vueSnippet(
    `${importDialog(composition)}
import { Button } from '@/components/ui/button'
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button variant="destructive" @click="aberto = true">Abrir via estado externo</Button>
${indentar(dialogo(composition))}
</div>`,
  );
}

/**
 * Bloco de mídia no topo do cabeçalho. O ícone é decorativo: quem nomeia o
 * painel é o título, por `aria-labelledby`.
 */
export function alertDialogWithIconSource(): string {
  return snippet({
    raiz: ['default-open'],
    gatilho: { rotulo: 'Excluir conta', variante: 'destructive' },
    midia: {},
    titulo: 'Excluir conta',
    descricao: DESCRIPTION_DEFAULT,
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Excluir', variante: 'destructive' },
  });
}

/**
 * Confirmação destrutiva: a severidade aparece no gatilho e na ação, e a saída
 * neutra fica no contorno. Duas ações em pé de igualdade tirariam o peso da
 * decisão.
 */
export function alertDialogDestructiveSource(): string {
  return snippet({
    raiz: ['default-open'],
    gatilho: { rotulo: 'Excluir conta', variante: 'destructive' },
    titulo: 'Excluir conta',
    descricao: DESCRIPTION_DEFAULT,
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Excluir', variante: 'destructive' },
  });
}

/**
 * Confirmação neutra: nada é irreversível, então a ação fica na variante padrão.
 * Pintar de vermelho uma saída de conta ensinaria alarme onde não há.
 */
export function alertDialogNeutralSource(): string {
  return snippet({
    raiz: ['default-open'],
    gatilho: { rotulo: 'Sair da conta', variante: 'outline' },
    titulo: 'Sair da conta',
    descricao: 'Você precisará entrar novamente para acessar seus dados.',
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Sair' },
  });
}

/**
 * Descrição longa: o painel cresce em altura e ela continua sendo a descrição
 * acessível. Não há prop de tamanho a ajustar.
 */
export function alertDialogDescriptionLongaSource(): string {
  return snippet({
    raiz: ['default-open'],
    gatilho: { rotulo: 'Excluir conta', variante: 'destructive' },
    titulo: 'Excluir conta',
    descricao: `Todos os seus dados, arquivos enviados, integrações ativas e o histórico
completo de faturamento serão removidos permanentemente dos nossos
servidores. Esta ação não pode ser desfeita e nenhuma cópia de segurança
fica disponível depois da confirmação.`,
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Excluir', variante: 'destructive' },
  });
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
    raiz: ['default-open'],
    gatilho: { rotulo: 'Descartar rascunho', variante: 'destructive' },
    titulo: 'Descartar rascunho',
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Descartar', variante: 'destructive' },
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
  return snippet({
    raiz: ['default-open'],
    gatilho: { rotulo: 'Excluir conta', variante: 'destructive' },
    painel: 'class="nds-overflow-hidden"',
    midia: { classe: 'class="nds-shrink-0"' },
    titulo: 'Excluir conta',
    descricao: DESCRIPTION_DEFAULT,
    cancelar: { rotulo: 'Cancelar' },
    acao: { rotulo: 'Excluir', variante: 'destructive' },
  });
}
