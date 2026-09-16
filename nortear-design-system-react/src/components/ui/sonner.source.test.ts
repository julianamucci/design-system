import { describe, expect, it } from 'vitest';
import {
  sonnerSource,
  sonnerNeutralSource,
  sonnerSuccessSource,
  sonnerErrorSource,
  sonnerWarningSource,
  sonnerInfoSource,
  sonnerLoadingSource,
  sonnerDurationSource,
  sonnerPauseSource,
  sonnerStackedSource,
  sonnerCenteredFooterSource,
  sonnerNoRegionSource,
  sonnerDarkThemeSource,
  sonnerWithDescriptionSource,
  sonnerWithActionSource,
  sonnerPromiseSource,
  sonnerPersistentSource,
} from './sonner.source';

/**
 * Todas as transforms do componente, sem exceção.
 *
 * A lista é explícita de propósito: a varredura genérica de
 * `source-snippets.test.ts` filtra exports por nome, e quem cai fora do filtro
 * sai da medição em silêncio. Aqui cada função entra à mão, e o caso de
 * cobertura abaixo reprova se uma delas for esquecida.
 */
const ALL = [
  sonnerSource,
  sonnerNeutralSource,
  sonnerSuccessSource,
  sonnerErrorSource,
  sonnerWarningSource,
  sonnerInfoSource,
  sonnerLoadingSource,
  sonnerDurationSource,
  sonnerPauseSource,
  sonnerStackedSource,
  sonnerCenteredFooterSource,
  sonnerNoRegionSource,
  sonnerDarkThemeSource,
  sonnerWithDescriptionSource,
  sonnerWithActionSource,
  sonnerPromiseSource,
  sonnerPersistentSource,
];

describe('sonnerSource — a transform do meta', () => {
  // Sem args nada difere do padrão do componente, então a região sai nua — é a
  // forma mínima que quem consome escreve na raiz da aplicação.
  it('sem args, entrega o gatilho, a chamada e a região', () => {
    expect(sonnerSource()).toBe(
      `import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

// A região que desenha a fila. Vai UMA VEZ, na raiz da aplicação.
<Toaster />

// E a notificação nasce no evento que termina a operação.
<Button variant="outline" onClick={() => toast.success("Alterações salvas.")}>
  Disparar notificação
</Button>`,
    );
  });

  it('o tipo é o método da fila, e a neutra é a função direta', () => {
    expect(sonnerSource('', { args: { type: 'warning' } })).toContain('toast.warning(');
    const neutral = sonnerSource('', { args: { type: 'default' } });
    expect(neutral).toContain('toast("Alterações salvas.")');
    // Não existe `type: "default"` na API: o tipo neutro é a ausência de método.
    expect(neutral).not.toContain('default');
  });

  it('descrição e ação só entram quando o control traz texto', () => {
    const bare = sonnerSource();
    expect(bare).not.toContain('description:');
    expect(bare).not.toContain('action:');

    const full = sonnerSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(full).toContain('description: "Detalhe da mudança.",');
    expect(full).toContain('action: { label: "Desfazer", onClick: () => toast.success("Feito.") },');
  });

  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    // `top-right` é o padrão do projeto, declarado no wrapper, e 4000ms é o
    // prazo da região: quem consome recebe os dois sem escrever nada.
    const exit = sonnerSource('', {
      args: { position: 'top-right', richColors: false, closeButton: false, duration: 4000 },
    });
    expect(exit).toContain('<Toaster />');
    expect(exit).not.toContain('position=');
    expect(exit).not.toContain('richColors');
    expect(exit).not.toContain('closeButton');
    expect(exit).not.toContain('duration');
  });

  it('escreve o que difere do padrão na região', () => {
    const exit = sonnerSource('', {
      args: { position: 'bottom-center', richColors: true, closeButton: true, duration: 8000 },
    });
    expect(exit).toContain(
      '<Toaster position="bottom-center" richColors closeButton duration={8000} />',
    );
  });

  it('recusa canto que não está na união em vez de inventar atributo', () => {
    // Control adulterado não vira prop: `position` fora da lista some, e a
    // região volta ao padrão do projeto.
    const exit = sonnerSource('', { args: { position: 'middle-left' as never } });
    expect(exit).toContain('<Toaster />');
    expect(exit).not.toContain('middle-left');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const exit = sonnerSource('', {
      args: {
        title: (() => {}) as never,
        description: (() => {}) as never,
        actionLabel: (() => {}) as never,
        type: (() => {}) as never,
      },
    });
    expect(exit).not.toContain('=> {}');
    expect(exit).not.toContain('description:');
    expect(exit).not.toContain('action:');
    // Cai no padrão em vez de interpolar o espião.
    expect(exit).toContain('toast.success("Alterações salvas.")');
  });
});

describe('o que vale para todas as transforms do componente', () => {
  it('nenhuma traz o quadro de andaime das stories', () => {
    for (const fn of ALL) {
      const exit = fn();
      // O quadro existe para prender uma região `position: fixed` dentro do
      // canvas do Storybook — quem consome monta a região na raiz.
      expect(exit).not.toContain('style=');
      expect(exit).not.toContain('contain: layout');
      expect(exit).not.toContain('nds-min-h-');
    }
  });

  it('nenhuma importa texto nem apoio do módulo de fixtures', () => {
    for (const fn of ALL) {
      const exit = fn();
      expect(exit).not.toContain('TEXTS');
      expect(exit).not.toContain('PERSISTENT');
      expect(exit).not.toContain('waitForToast');
      expect(exit).not.toContain('clearToasts');
      expect(exit).not.toContain('sonner.fixtures');
    }
  });

  it('a fila vem do pacote sonner e a região vem do design system', () => {
    for (const fn of ALL) {
      const exit = fn();
      expect(exit).toContain('import { toast } from "sonner";');
      // O arquivo da casa exporta a REGIÃO e nunca reexportou a fila: ensinar
      // `import { toast } from "@/components/ui/sonner"` daria erro ao colar.
      expect(exit).not.toContain('import { toast } from "@/components/ui/sonner"');
      if (exit.includes('<Toaster')) {
        expect(exit).toContain('import { Toaster } from "@/components/ui/sonner";');
      }
    }
  });

  it('a região vem sempre com o comentário de que é montada uma vez só', () => {
    for (const fn of ALL) {
      const exit = fn();
      if (!exit.includes('<Toaster')) continue;
      // É a única parte do uso que não se escreve onde a notificação nasce, e
      // duas regiões na mesma tela disputariam o canto com nomes repetidos.
      expect(exit).toContain('// A região que desenha a fila. Vai UMA VEZ, na raiz da aplicação.');
    }
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo é o próprio método, com o texto que descreve o estado', () => {
    expect(sonnerNeutralSource()).toContain('toast("Código copiado.");');
    expect(sonnerSuccessSource()).toContain('toast.success("Alterações salvas.");');
    expect(sonnerErrorSource()).toContain(
      'toast.error("Não foi possível salvar. Tente novamente.");',
    );
    expect(sonnerWarningSource()).toContain('toast.warning("Sua sessão expira em 5 minutos.");');
    expect(sonnerInfoSource()).toContain('toast.info("Nova versão disponível.");');
  });

  it('o carregamento não recebe prazo — quem o encerra é a operação', () => {
    const exit = sonnerLoadingSource();
    expect(exit).toContain('toast.loading("Enviando arquivo...");');
    expect(exit).not.toContain('duration');
  });

  it('as seis declaram o mesmo canto e as mesmas cores: o tipo é o que muda', () => {
    const types = [
      sonnerNeutralSource,
      sonnerSuccessSource,
      sonnerErrorSource,
      sonnerWarningSource,
      sonnerInfoSource,
      sonnerLoadingSource,
    ];
    for (const fn of types) {
      expect(fn()).toContain('<Toaster position="top-right" richColors />');
    }
  });
});

describe('transforms das stories de estado', () => {
  it('o prazo é escrito por extenso na região, porque ele é o assunto', () => {
    // Aqui repetir o padrão não é ruído: a story existe para mostrar de onde
    // sai o prazo, e a chamada de propósito não o repete.
    const exit = sonnerDurationSource();
    expect(exit).toContain('<Toaster position="top-right" richColors duration={4000} />');
    expect(exit).not.toContain('duration:');
  });

  it('a pausa não tem prop: o snippet é a região com prazo', () => {
    const exit = sonnerPauseSource();
    expect(exit).toContain('<Toaster position="top-right" richColors duration={4000} />');
    expect(exit).toContain('toast.info("Nova versão disponível.");');
  });

  it('a pilha aberta precisa de expand na região e de mais de uma chamada', () => {
    const exit = sonnerStackedSource();
    expect(exit).toContain('<Toaster position="top-right" richColors expand />');
    expect((exit.match(/^toast\./gm) ?? []).length).toBe(3);
  });

  it('o canto muda só na região', () => {
    expect(sonnerCenteredFooterSource()).toContain(
      '<Toaster position="bottom-center" richColors />',
    );
  });

  it('sem região montada, o snippet não monta região nenhuma', () => {
    const exit = sonnerNoRegionSource();
    // O ELEMENTO e o import, não a palavra: o snippet explica num comentário que
    // "sem o Toaster montado" nada é desenhado, e `not.toContain('Toaster')`
    // reprovava a prosa. Mesma forma nas cinco stacks.
    expect(exit).not.toMatch(/<Toaster\b/);
    expect(exit).not.toMatch(/import\s*\{[^}]*\bToaster\b/);
    // A fila continua existindo: é essa a lição da story.
    expect(exit).toContain('toast.success("Alterações salvas.");');
  });

  it('o tema escuro é declarado na região, e os CINCO tipos entram na tela', () => {
    const exit = sonnerDarkThemeSource();
    expect(exit).toContain('theme="dark"');
    // Cinco, e não três: a story existe para mostrar os cinco tipos recoloridos
    // ao mesmo tempo, e a `play` dispara os cinco. `^toast[.(]` conta também a
    // neutra, que é a função nua — a contagem por `^toast\.` a perdia.
    expect((exit.match(/^toast[.(]/gm) ?? []).length).toBe(5);
  });
});

describe('transforms das stories de composição', () => {
  it('a descrição acompanha o título na mesma chamada', () => {
    const exit = sonnerWithDescriptionSource();
    expect(exit).toContain('toast.success("Preferências atualizadas.", {');
    // O MESMO texto que a `play` passa em `description`: a fixture é a fonte, e
    // um snippet com a frase encurtada publicava outra notificação.
    expect(exit).toContain(
      '  description: "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",',
    );
  });

  it('a ação leva um manipulador, e o gatilho é a operação real', () => {
    const exit = sonnerWithActionSource();
    expect(exit).toContain('label: "Desfazer",');
    expect(exit).toContain('onClick: () => toast.success("Exclusão desfeita."),');
    // O rótulo do gatilho é a ação real, não "Disparar notificação".
    expect(exit).toContain('Excluir item');
    expect(exit).not.toContain('Disparar notificação');
  });

  it('a promessa é UMA chamada para os três estados', () => {
    const exit = sonnerPromiseSource();
    expect(exit).toContain('toast.promise(enviarArquivo(dados), {');
    expect(exit).toContain('    loading: "Enviando arquivo...",');
    expect(exit).toContain('    success: "Arquivo enviado com sucesso.",');
    expect(exit).toContain('    error: "Erro ao enviar. Tente novamente.",');
    // Nada de encadear três chamadas: o nó no DOM é o mesmo do começo ao fim.
    expect((exit.match(/toast\./g) ?? []).length).toBe(1);
  });

  it('a persistente combina prazo infinito na chamada com fechar na região', () => {
    const exit = sonnerPersistentSource();
    expect(exit).toContain('duration: Number.POSITIVE_INFINITY,');
    // Os dois andam juntos: sem `closeButton` a notificação que não sai sozinha
    // deixa de ser aviso e vira obstáculo.
    expect(exit).toContain('<Toaster position="top-right" richColors closeButton />');
  });
});

// ─── Story × snippet, os dezoito pares ────────────────────────────────────────
//
// O defeito desta família não é o snippet estar errado sozinho: é ele descrever
// OUTRA story. A tabela escreve, por story, a REGIÃO que ela monta e as
// CHAMADAS que a `play` dispara, na ordem — e é isso que o painel tem de
// publicar. Andaime fica fora de propósito: o quadro `contain: layout`, os
// prazos de suíte (1200 e 300) e o `PERSISTENT` das stories fotografadas.

/** O que NÃO pode aparecer no exemplo da story que não monta região. */
const MARCA_DE_REGIAO = /<Toaster\b/;

/** Os args que o `meta` entrega ao Playground — é com eles que ele é lido. */
const ARGS_DO_PLAYGROUND = {
  type: 'success' as const,
  title: 'Alterações salvas.',
  description: '',
  actionLabel: '',
  position: 'top-right' as const,
  richColors: true,
  closeButton: false,
  duration: 4000,
};

const REGIAO_PADRAO = '<Toaster position="top-right" richColors />';

const PROMESSA = [
  'toast.promise(enviarArquivo(dados), {',
  'loading: "Enviando arquivo...",',
  'success: "Arquivo enviado com sucesso.",',
  'error: "Erro ao enviar. Tente novamente.",',
];

type CasoDeStory = {
  story: string;
  snippet: () => string;
  /** Trechos da região que a story monta; `null` quando ela não monta nenhuma. */
  region: string[] | null;
  /** Chamadas da fila, na ORDEM em que a `play` as dispara. */
  calls: string[];
  /** O que mais o exemplo precisa trazer para se sustentar sozinho. */
  extras?: string[];
};

const CASOS: CasoDeStory[] = [
  {
    story: 'Sonner/Playground',
    snippet: () => sonnerSource('', { args: ARGS_DO_PLAYGROUND }),
    region: ['<Toaster richColors />'],
    calls: ['toast.success("Alterações salvas.")'],
    // O rótulo do botão é o que a story mostra na tela.
    extras: ['Disparar notificação'],
  },
  {
    story: 'Types/Default',
    snippet: sonnerNeutralSource,
    region: [REGIAO_PADRAO],
    calls: ['toast("Código copiado.");'],
  },
  {
    story: 'Types/Success',
    snippet: sonnerSuccessSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.success("Alterações salvas.");'],
  },
  {
    story: 'Types/Error',
    snippet: sonnerErrorSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.error("Não foi possível salvar. Tente novamente.");'],
  },
  {
    story: 'Types/Warning',
    snippet: sonnerWarningSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.warning("Sua sessão expira em 5 minutos.");'],
  },
  {
    story: 'Types/Info',
    snippet: sonnerInfoSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.info("Nova versão disponível.");'],
  },
  {
    story: 'Types/Loading',
    snippet: sonnerLoadingSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.loading("Enviando arquivo...");'],
  },
  {
    story: 'States/AutoDismiss',
    snippet: sonnerDurationSource,
    region: ['<Toaster position="top-right" richColors duration={4000} />'],
    calls: ['toast.error("Não foi possível salvar. Tente novamente.");'],
  },
  {
    story: 'States/PauseOnHover',
    snippet: sonnerPauseSource,
    region: ['<Toaster position="top-right" richColors duration={4000} />'],
    calls: ['toast.info("Nova versão disponível.");'],
  },
  {
    story: 'States/Stacked',
    snippet: sonnerStackedSource,
    region: ['<Toaster position="top-right" richColors expand />'],
    calls: [
      'toast.success("Alterações salvas.");',
      'toast.warning("Sua sessão expira em 5 minutos.");',
      'toast.info("Nova versão disponível.");',
    ],
  },
  {
    story: 'States/PositionBottomCenter',
    snippet: sonnerCenteredFooterSource,
    region: ['<Toaster position="bottom-center" richColors />'],
    calls: ['toast.success("Alterações salvas.");'],
  },
  {
    story: 'States/WithoutToaster',
    snippet: sonnerNoRegionSource,
    region: null,
    calls: ['toast.success("Alterações salvas.");'],
  },
  {
    story: 'States/DarkTheme',
    snippet: sonnerDarkThemeSource,
    region: ['<Toaster position="top-right" richColors expand theme="dark" />'],
    calls: [
      'toast("Código copiado.");',
      'toast.success("Alterações salvas.");',
      'toast.error("Não foi possível salvar. Tente novamente.");',
      'toast.warning("Sua sessão expira em 5 minutos.");',
      'toast.info("Nova versão disponível.");',
    ],
  },
  {
    story: 'Compositions/WithDescription',
    snippet: sonnerWithDescriptionSource,
    region: [REGIAO_PADRAO],
    calls: [
      'toast.success("Preferências atualizadas.", {',
      'description: "Suas configurações foram salvas e entrarão em vigor na próxima sessão.",',
    ],
  },
  {
    story: 'Compositions/WithAction',
    snippet: sonnerWithActionSource,
    region: [REGIAO_PADRAO],
    calls: [
      'toast("Item excluído.", {',
      'label: "Desfazer",',
      'onClick: () => toast.success("Exclusão desfeita."),',
    ],
    extras: ['Excluir item'],
  },
  {
    story: 'Compositions/PromiseResolved',
    snippet: sonnerPromiseSource,
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['async function enviarArquivo(dados: FormData) {'],
  },
  {
    story: 'Compositions/PromiseRejected',
    snippet: sonnerPromiseSource,
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['async function enviarArquivo(dados: FormData) {'],
  },
  {
    story: 'Compositions/Persistent',
    snippet: sonnerPersistentSource,
    region: ['<Toaster position="top-right" richColors closeButton />'],
    calls: [
      'toast.error("Falha crítica no servidor.", {',
      'duration: Number.POSITIVE_INFINITY,',
    ],
  },
];

describe('cada story publica a região que monta e as chamadas que dispara', () => {
  for (const caso of CASOS) {
    it(caso.story, () => {
      const exit = caso.snippet();

      if (caso.region === null) expect(exit).not.toMatch(MARCA_DE_REGIAO);
      else for (const trecho of caso.region) expect(exit).toContain(trecho);

      let cursor = -1;
      for (const call of caso.calls) {
        const at = exit.indexOf(call, cursor + 1);
        expect(at, `falta \`${call}\` na ordem em que a play dispara`).toBeGreaterThan(cursor);
        cursor = at;
      }

      for (const trecho of caso.extras ?? []) expect(exit).toContain(trecho);
    });
  }

  it('cobre as dezoito stories do componente', () => {
    // Contagem declarada: tabela que encolhe sem reprovar mede menos e continua
    // verde, que é como 28 exports saíram de uma varredura em silêncio.
    expect(CASOS).toHaveLength(18);
  });
});

// ─── Nenhum snippet cita função que não declara ───────────────────────────────
//
// O exemplo do painel é para ser COLADO. Citar `desfazer` ou `enviarArquivo`
// sem declará-los entrega um trecho que não se reproduz. A varredura é genérica
// de propósito: lista de nomes envelhece, e quem sai da lista sai da medição.

/** Nomes que o AMBIENTE dá. Só palavra minúscula entra na varredura. */
const DO_AMBIENTE = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'await', 'new',
  'function', 'fetch', 'setTimeout', 'toast',
]);

/** Prosa e literal de texto não são referência a função. */
function semTextoNemComentario(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

/** O que o exemplo declara: função nomeada, método tipado, const ou import. */
function declaradas(code: string): Set<string> {
  const limpo = semTextoNemComentario(code);
  const names = new Set<string>();
  for (const m of limpo.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of limpo.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*:\s*[\w<>[\]|]+\s*\{/gm)) {
    names.add(m[1]);
  }
  for (const m of limpo.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  for (const m of limpo.matchAll(/import\s*\{([^}]*)\}/g)) {
    for (const name of m[1].split(',')) names.add(name.trim());
  }
  return names;
}

/** Função chamada ou passada como manipulador que ninguém declarou. */
function pendentes(code: string): string[] {
  const limpo = semTextoNemComentario(code);
  const decl = declaradas(code);
  const citadas = new Set<string>();
  for (const m of limpo.matchAll(/(?:^|[^.\w$])([a-z][\w$]*)\s*\(/g)) citadas.add(m[1]);
  for (const m of limpo.matchAll(/\bthis\.([a-z][\w$]*)\s*\(/g)) citadas.add(m[1]);
  // Manipulador passado por REFERÊNCIA sai do código CRU: em `@click="x"` o nome
  // mora dentro de um literal, e a limpeza acima o apagaria.
  for (const m of code.matchAll(/onClick:\s*([a-z][\w$]*)/g)) citadas.add(m[1]);
  for (const m of code.matchAll(/onclick=\{([a-z][\w$]*)\}/g)) citadas.add(m[1]);
  for (const m of code.matchAll(/@click="([a-z][\w$]*)"/g)) citadas.add(m[1]);
  return [...citadas].filter((name) => !DO_AMBIENTE.has(name) && !decl.has(name));
}

describe('nenhum snippet cita função que não declara', () => {
  it('toda referência a função tem declaração no próprio exemplo', () => {
    for (const caso of CASOS) {
      expect(pendentes(caso.snippet()), caso.story).toEqual([]);
    }
  });

  it('o caminho com ação e descrição também se sustenta sozinho', () => {
    // É por aqui que o defeito entra: `onClick: desfazer` vindo de um control,
    // com o manipulador em stack nenhuma.
    const exit = sonnerSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(pendentes(exit)).toEqual([]);
  });
});
