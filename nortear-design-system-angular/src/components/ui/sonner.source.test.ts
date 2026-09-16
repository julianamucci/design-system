import { describe, expect, it } from 'vitest';
import {
  sonnerWarningSource,
  sonnerLoadingSource,
  sonnerWithActionSource,
  sonnerWithDescriptionSource,
  sonnerErrorSource,
  sonnerInfoSource,
  sonnerNeutralSource,
  sonnerPersistentSource,
  sonnerStackSource,
  sonnerPlaygroundSource,
  sonnerPositionSource,
  sonnerPromiseSource,
  sonnerAutoDismissSource,
  sonnerPauseOnHoverSource,
  sonnerNoRegionSource,
  sonnerSuccessSource,
  sonnerDarkThemeSource,
} from './sonner.source';

const ALL = [
  sonnerPlaygroundSource,
  sonnerNeutralSource,
  sonnerSuccessSource,
  sonnerErrorSource,
  sonnerWarningSource,
  sonnerInfoSource,
  sonnerLoadingSource,
  sonnerAutoDismissSource,
  sonnerPauseOnHoverSource,
  sonnerStackSource,
  sonnerPositionSource,
  sonnerNoRegionSource,
  sonnerDarkThemeSource,
  sonnerWithDescriptionSource,
  sonnerWithActionSource,
  sonnerPromiseSource,
  sonnerPersistentSource,
];

describe('sonnerPlaygroundSource', () => {
  it('com os args da story, a região declara as cores do tema e o próprio nome', () => {
    const exit = sonnerPlaygroundSource();
    expect(exit).toContain(`import { NdsToaster, toast } from '@/components/ui/sonner';`);
    // O nome acessível é prop REAL da região desta story, e a `play` o afirma:
    // sem ele o painel publicava uma região que a story não tem.
    expect(exit).toContain(
      '<div ndsToaster [richColors]="true" label="Notificações da demonstração"></div>',
    );
    expect(exit).toContain(`toast.success('Alterações salvas.');`);
  });

  it('o control de prazo chega ao painel — mexer nele muda a região', () => {
    // O construtor não lia `args.duration`: mexer no control não movia uma
    // vírgula do painel Code, e o prazo é opção da REGIÃO.
    expect(sonnerPlaygroundSource('', { args: { duration: 8000 } })).toContain(
      '[duration]="8000"',
    );
    // E o padrão continua ausente: repetir 4000 ensinaria ruído.
    expect(sonnerPlaygroundSource('', { args: { duration: 4000 } })).not.toContain('[duration]');
  });

  // `top-right` é o padrão do `input()` desde 2026-09-13: escrevê-lo ensinaria a
  // repetir o default. Até 2026-09-14 este construtor o escrevia sempre, contra
  // o próprio comentário que dizia omitir o padrão.
  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const exit = sonnerPlaygroundSource('', {
      args: { position: 'top-right', richColors: false, closeButton: false, duration: 4000 },
    });
    expect(exit).toContain('<div ndsToaster label="Notificações da demonstração"></div>');
    expect(exit).not.toContain('position=');
    expect(exit).not.toContain('richColors');
    expect(exit).not.toContain('closeButton');
    expect(exit).not.toContain('duration');
  });

  it('escreve o que difere do padrão na região', () => {
    const exit = sonnerPlaygroundSource('', {
      args: { position: 'bottom-center', richColors: true, closeButton: true },
    });
    expect(exit).toContain(
      '<div ndsToaster position="bottom-center" [richColors]="true" [closeButton]="true"'
        + ' label="Notificações da demonstração"></div>',
    );
  });

  it('o tipo é o método da fila, e a neutra é a função direta', () => {
    expect(sonnerPlaygroundSource('', { args: { type: 'warning' } })).toContain('toast.warning(');
    const neutral = sonnerPlaygroundSource('', { args: { type: 'default' } });
    expect(neutral).toContain(`toast('Alterações salvas.');`);
    expect(neutral).not.toContain('toast.default');
  });

  it('a ação leva um manipulador que a classe declara', () => {
    const so = sonnerPlaygroundSource();
    expect(so).not.toContain('action:');
    expect(so).not.toContain('desfazer');

    const full = sonnerPlaygroundSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(full).toContain(`description: 'Detalhe da mudança.',`);
    expect(full).toContain(`action: { label: 'Desfazer', onClick: () => this.desfazer() },`);
    expect(full).toContain('desfazer(): void {');
  });

  it('escapa a aspa do literal em vez de encerrar a string', () => {
    const exit = sonnerPlaygroundSource('', { args: { title: "Não foi possível 'salvar'." } });
    expect(exit).toContain(`toast.success('Não foi possível \\'salvar\\'.');`);
  });
});

describe('o que vale para todas as transforms do componente', () => {
  it('nenhuma traz o andaime da story', () => {
    for (const fn of ALL) {
      const exit = fn();
      // O quadro existe para prender a região `position: fixed` no canvas.
      expect(exit).not.toContain('style=');
      expect(exit).not.toContain('contain: layout');
      // O botão existe só para haver o que clicar na demonstração.
      expect(exit).not.toContain('Disparar notificação');
      expect(exit).not.toContain('ndsButton');
    }
  });

  it('nenhuma vaza fixture nem o relógio encurtado da suíte', () => {
    for (const fn of ALL) {
      const exit = fn();
      expect(exit).not.toContain('TEXTS');
      expect(exit).not.toContain('PERSISTENT');
      expect(exit).not.toContain('waitForToast');
      expect(exit).not.toContain('clearToasts');
      // 1200 e 300 são os prazos que as stories usam para não depender do
      // relógio real — nenhum deles é valor do design system.
      expect(exit).not.toContain('[duration]');
    }
  });

  it('a região entra no máximo uma vez, e só quando há região', () => {
    for (const fn of ALL) {
      const exit = fn();
      // Conta o ELEMENTO no template, e não a palavra: a nota do snippet fala
      // do Toaster em prosa, e casar texto solto mediria o comentário.
      const regions = exit.match(/<div ndsToaster\b/g) ?? [];
      if (exit.includes('imports: [NdsToaster]')) {
        expect(regions.length).toBe(1);
      } else {
        expect(regions.length).toBe(0);
      }
    }
  });
});

describe('transforms das stories de tipo', () => {
  it('cada tipo é o próprio método, com o texto que descreve o estado', () => {
    expect(sonnerNeutralSource()).toContain(`toast('Código copiado.');`);
    expect(sonnerSuccessSource()).toContain(`toast.success('Alterações salvas.');`);
    expect(sonnerErrorSource()).toContain(
      `toast.error('Não foi possível salvar. Tente novamente.');`,
    );
    expect(sonnerWarningSource()).toContain(`toast.warning('Sua sessão expira em 5 minutos.');`);
    expect(sonnerInfoSource()).toContain(`toast.info('Nova versão disponível.');`);
  });

  it('o carregamento não recebe prazo — quem o encerra é a operação', () => {
    const exit = sonnerLoadingSource();
    expect(exit).toContain(`toast.loading('Enviando arquivo...');`);
    expect(exit).not.toContain('duration:');
  });
});

describe('transforms das stories de estado', () => {
  it('o fechamento automático usa o prazo padrão da região, sem escrevê-lo', () => {
    const exit = sonnerAutoDismissSource();
    expect(exit).toContain('<div ndsToaster [richColors]="true"></div>');
    expect(exit).toContain(`toast.error(`);
  });

  it('a pausa não se configura — o snippet não inventa opção para ela', () => {
    const exit = sonnerPauseOnHoverSource();
    expect(exit).toContain('<div ndsToaster [richColors]="true"></div>');
    expect(exit).not.toContain('pause');
  });

  it('a pilha é uma chamada por notificação', () => {
    expect((sonnerStackSource().match(/toast\./g) ?? []).length).toBe(3);
  });

  it('o canto muda só na região', () => {
    expect(sonnerPositionSource()).toContain(
      '<div ndsToaster position="bottom-center" [richColors]="true"></div>',
    );
  });

  it('sem região montada, o snippet não monta região nenhuma', () => {
    const exit = sonnerNoRegionSource();
    // O que se afirma é o CÓDIGO que montaria a região — o elemento no template
    // e o import da diretiva —, e não a palavra: a nota do snippet diz "Sem
    // Toaster montado", e uma asserção sobre texto solto reprovaria a prosa.
    expect(exit).not.toMatch(/<div ndsToaster\b/);
    expect(exit).not.toMatch(/import \{[^}]*\bNdsToaster\b/);
    expect(exit).not.toContain('@Component');
    expect(exit).toContain(`import { toast } from '@/components/ui/sonner';`);
    expect(exit).toContain(`toast.success('Alterações salvas.');`);
  });

  it('o tema escuro não tem prop — os cinco tipos na mesma região', () => {
    const exit = sonnerDarkThemeSource();
    expect(exit).not.toContain('theme');
    // Uma chamada por linha dentro do método, qualquer que seja a indentação.
    expect((exit.match(/^\s+toast(?:\.\w+)?\(/gm) ?? []).length).toBe(5);
  });
});

describe('transforms das stories de composição', () => {
  it('a descrição acompanha o título na mesma chamada', () => {
    const exit = sonnerWithDescriptionSource();
    expect(exit).toContain(`toast.success('Preferências atualizadas.', {`);
    expect(exit).toContain(
      `description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',`,
    );
  });

  it('a ação leva um manipulador que existe fora da notificação', () => {
    const exit = sonnerWithActionSource();
    expect(exit).toContain(`action: { label: 'Desfazer', onClick: () => this.desfazer() },`);
    expect(exit).toContain('desfazer(): void {');
  });

  it('a promessa é UMA chamada para os três estados', () => {
    const exit = sonnerPromiseSource();
    expect(exit).toContain('toast.promise(this.enviarArquivo(), {');
    expect(exit).toContain(`loading: 'Enviando arquivo...',`);
    expect(exit).toContain(`success: 'Arquivo enviado com sucesso.',`);
    expect(exit).toContain(`error: 'Erro ao enviar. Tente novamente.',`);
    expect((exit.match(/toast\./g) ?? []).length).toBe(1);
    expect(exit).toContain('enviarArquivo(): Promise<void> {');
  });

  it('a persistente põe prazo infinito E fechar na MESMA chamada', () => {
    const exit = sonnerPersistentSource();
    expect(exit).toContain('duration: Number.POSITIVE_INFINITY,');
    expect(exit).toContain('closeButton: true,');
    // A região da story NÃO liga o fechar: ligá-lo nos dois lugares ensinava
    // botão de fechar em toda notificação da aplicação para conseguir um em UMA.
    expect(exit).toContain('<div ndsToaster [richColors]="true"></div>');
    expect(exit).not.toContain('[closeButton]');
  });
});

// ─── Story × snippet, os dezoito pares ────────────────────────────────────────
//
// O defeito desta família não é o snippet estar errado sozinho: é ele descrever
// uma região que a story não monta. A tabela escreve, por story, a REGIÃO que
// ela monta e as CHAMADAS que a `play` dispara, na ordem. Andaime fica fora de
// propósito: o botão da demonstração e os prazos de suíte (1200 e 300).

/** O que NÃO pode aparecer no exemplo da story que não monta região. */
const MARCA_DE_REGIAO = /<div ndsToaster\b/;

const SUCESSO = 'Alterações salvas.';
const PADRAO = 'Código copiado.';
const FALHA = 'Não foi possível salvar. Tente novamente.';
const AVISO = 'Sua sessão expira em 5 minutos.';
const INFO = 'Nova versão disponível.';
const DETALHE = 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.';

/** Os args que o `meta` entrega ao Playground — é com eles que ele é lido. */
const ARGS_DO_PLAYGROUND = {
  type: 'success' as const,
  title: SUCESSO,
  description: '',
  actionLabel: '',
  position: 'top-right' as const,
  richColors: true,
  closeButton: false,
  duration: 4000,
};

const REGIAO_PADRAO = '<div ndsToaster [richColors]="true"></div>';

const PROMESSA = [
  'toast.promise(this.enviarArquivo(), {',
  `loading: 'Enviando arquivo...',`,
  `success: 'Arquivo enviado com sucesso.',`,
  `error: 'Erro ao enviar. Tente novamente.',`,
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
    snippet: () => sonnerPlaygroundSource('', { args: ARGS_DO_PLAYGROUND }),
    region: ['<div ndsToaster [richColors]="true" label="Notificações da demonstração"></div>'],
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'Types/Default',
    snippet: sonnerNeutralSource,
    region: [REGIAO_PADRAO],
    calls: [`toast('${PADRAO}');`],
  },
  {
    story: 'Types/Success',
    snippet: sonnerSuccessSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'Types/Error',
    snippet: sonnerErrorSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.error('${FALHA}');`],
  },
  {
    story: 'Types/Warning',
    snippet: sonnerWarningSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.warning('${AVISO}');`],
  },
  {
    story: 'Types/Info',
    snippet: sonnerInfoSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.info('${INFO}');`],
  },
  {
    story: 'Types/Loading',
    snippet: sonnerLoadingSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.loading('Enviando arquivo...');`],
  },
  {
    story: 'States/AutoDismiss',
    snippet: sonnerAutoDismissSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.error('${FALHA}');`],
  },
  {
    story: 'States/PauseOnHover',
    snippet: sonnerPauseOnHoverSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.info('${INFO}');`],
  },
  {
    story: 'States/Stacked',
    snippet: sonnerStackSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.success('${SUCESSO}');`, `toast.warning('${AVISO}');`, `toast.info('${INFO}');`],
  },
  {
    story: 'States/PositionBottomCenter',
    snippet: sonnerPositionSource,
    region: ['<div ndsToaster position="bottom-center" [richColors]="true"></div>'],
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'States/WithoutToaster',
    snippet: sonnerNoRegionSource,
    region: null,
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'States/DarkTheme',
    snippet: sonnerDarkThemeSource,
    region: [REGIAO_PADRAO],
    calls: [
      `toast('${PADRAO}');`,
      `toast.success('${SUCESSO}');`,
      `toast.error('${FALHA}');`,
      `toast.warning('${AVISO}');`,
      `toast.info('${INFO}');`,
    ],
  },
  {
    story: 'Compositions/WithDescription',
    snippet: sonnerWithDescriptionSource,
    region: [REGIAO_PADRAO],
    calls: [`toast.success('Preferências atualizadas.', {`, `description: '${DETALHE}',`],
  },
  {
    story: 'Compositions/WithAction',
    snippet: sonnerWithActionSource,
    region: [REGIAO_PADRAO],
    calls: [
      `toast('Item excluído.', {`,
      `action: { label: 'Desfazer', onClick: () => this.desfazer() },`,
    ],
    extras: ['desfazer(): void {'],
  },
  {
    story: 'Compositions/PromiseResolved',
    snippet: sonnerPromiseSource,
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['enviarArquivo(): Promise<void> {'],
  },
  {
    story: 'Compositions/PromiseRejected',
    snippet: sonnerPromiseSource,
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['enviarArquivo(): Promise<void> {'],
  },
  {
    story: 'Compositions/Persistent',
    snippet: sonnerPersistentSource,
    region: [REGIAO_PADRAO],
    calls: [
      `toast.error('Falha crítica no servidor.', {`,
      'duration: Number.POSITIVE_INFINITY,',
      'closeButton: true,',
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
// O exemplo do painel é para ser COLADO. Citar `this.desfazer()` ou
// `this.enviarArquivo()` sem o método na classe entregaria um trecho que não
// compila. A varredura é genérica de propósito: lista de nomes envelhece, e quem
// sai dela sai da medição em silêncio.

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
  // `this.x()` é o jeito desta stack citar o método, e o ponto o esconderia da
  // varredura acima.
  for (const m of limpo.matchAll(/\bthis\.([a-z][\w$]*)\s*\(/g)) citadas.add(m[1]);
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
    const exit = sonnerPlaygroundSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(exit).toContain('desfazer(): void {');
    expect(pendentes(exit)).toEqual([]);
  });
});
