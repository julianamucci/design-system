import { describe, expect, it } from 'vitest';
import {
  sonnerStackSnippet,
  sonnerPromiseSnippet,
  sonnerNoRegionSnippet,
  sonnerSnippet,
  sonnerSource,
  sonnerSourceWith,
} from './sonner.source';

describe('sonnerSnippet', () => {
  it('devolve as chamadas da API, e não o outerHTML da notificação', () => {
    const code = sonnerSnippet();
    expect(code).toContain(
      "import { createSonnerToaster, toast } from '@/components/ui/sonner';",
    );
    expect(code).toContain('createSonnerToaster(');
    expect(code).toContain('toast.success(');
    expect(code).not.toContain('data-sonner-toast');
    expect(code).not.toContain('nds-sonner-title');
  });

  it('monta a região uma vez e dispara a notificação depois', () => {
    const code = sonnerSnippet();
    expect(code.indexOf('createSonnerToaster')).toBeLessThan(code.indexOf('toast.success'));
    expect(code).toContain("document.querySelector('#app')?.append(regiao);");
  });

  it('omite o que já é padrão do design system', () => {
    const code = sonnerSnippet();
    expect(code).not.toContain('position');
    // `top-right` é o canto padrão desde 2026-09-13: escrevê-lo no snippet
    // ensinaria a repetir o default. Antes o omitido era `bottom-right`, e o
    // canto que toda story usa aparecia como se fosse escolha.
    expect(sonnerSnippet({ position: 'top-right' })).not.toContain('position');
    expect(code).not.toContain('richColors');
    expect(code).not.toContain('closeButton');
    // 4000ms é o prazo padrão: repeti-lo não ensina nada.
    expect(code).not.toContain('duration');
  });

  it('mostra as opções da região quando a story as escolhe', () => {
    const code = sonnerSnippet({ position: 'bottom-center', richColors: true, duration: 8000 });
    expect(code).toContain("position: 'bottom-center'");
    expect(code).toContain('richColors: true');
    expect(code).toContain('duration: 8000');
  });

  it('o tipo escolhe o método da fila; o neutro é a própria função', () => {
    expect(sonnerSnippet({ type: 'error' })).toContain('toast.error(');
    expect(sonnerSnippet({ type: 'warning' })).toContain('toast.warning(');
    const neutral = sonnerSnippet({ type: 'default', title: 'Código copiado.' });
    expect(neutral).toContain("toast('Código copiado.');");
    expect(neutral).not.toContain('toast.default(');
  });

  it('descrição e ação entram como opções da notificação', () => {
    const code = sonnerSnippet({
      type: 'default',
      title: 'Item excluído.',
      description: 'O item saiu da listagem.',
      actionLabel: 'Desfazer',
    });
    expect(code).toContain("description: 'O item saiu da listagem.'");
    expect(code).toContain("action: { label: 'Desfazer', onClick: () => desfazer() }");
  });

  it('o prazo infinito nunca vai sozinho — sempre com botão de fechar', () => {
    const code = sonnerSnippet({ type: 'error', persistente: true });
    expect(code).toContain('duration: Number.POSITIVE_INFINITY');
    expect(code).toContain('closeButton: true');
  });

  it('não vaza as fixtures nem os prazos de teste das stories', () => {
    const code = sonnerSnippet({ type: 'success' });
    expect(code).not.toContain('PERSISTENT');
    expect(code).not.toContain('mountToaster');
    expect(code).not.toContain('waitForToast');
    expect(code).not.toContain('400');
  });
});

describe('sonnerNoRegionSnippet', () => {
  it('dispara sem região montada — a fila cria a dela sob demanda', () => {
    const code = sonnerNoRegionSnippet({ type: 'success' });
    expect(code).toContain("import { toast } from '@/components/ui/sonner';");
    // A CHAMADA que monta a região, não o nome dela — mesma forma nas cinco
    // stacks, depois que a asserção por palavra reprovou prosa no react.
    expect(code).not.toMatch(/createSonnerToaster\s*\(/);
    expect(code).toContain('toast.success(');
  });
});

describe('sonnerStackSnippet', () => {
  it('uma chamada por notificação, na ordem em que entram na pilha', () => {
    const code = sonnerStackSnippet(
      [
        { type: 'success', title: 'Alterações salvas.' },
        { type: 'warning', title: 'Sua sessão expira em 5 minutos.' },
        { type: 'info', title: 'Nova versão disponível.' },
      ],
      // Canto DIFERENTE do padrão: é o que prova que a opção escolhida pela
      // story chega ao snippet.
      { position: 'bottom-right', richColors: true },
    );
    expect(code.match(/toast\./g)).toHaveLength(3);
    expect(code.indexOf('toast.success')).toBeLessThan(code.indexOf('toast.warning'));
    expect(code).toContain("position: 'bottom-right'");
  });
});

describe('sonnerPromiseSnippet', () => {
  it('uma notificação para a operação inteira, com as três mensagens', () => {
    const code = sonnerPromiseSnippet();
    expect(code).toContain('toast.promise(');
    expect(code).toContain("loading: 'Enviando arquivo...'");
    expect(code).toContain("success: 'Arquivo enviado com sucesso.'");
    expect(code).toContain("error: 'Erro ao enviar. Tente novamente.'");
    expect(code).not.toContain('toast.loading(');
  });
});

describe('sonnerSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const defaults = sonnerSource('<div data-sonner-toast>', {});
    const other = sonnerSource('<div data-sonner-toast>', {
      args: { type: 'error', title: 'Não foi possível salvar.', richColors: true },
    });
    expect(defaults).not.toBe(other);
    expect(other).toContain('toast.error(');
    expect(other).toContain('richColors: true');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    // O `aria-live` mora na REGIÃO desde 2026-09-13, e é dela que o renderer
    // parte — a notificação sai sem papel e sem anúncio. O que se prova aqui é
    // que nada disso vaza para o painel: o leitor copia a chamada da API, não o
    // markup que a fila desenhou.
    const gerado = '<div data-sonner-toaster aria-live="polite"><div data-sonner-toast>';
    expect(sonnerSource(gerado, {})).not.toContain('aria-live');
    expect(sonnerSource(gerado, {})).not.toContain('data-sonner-toaster');
  });
});

describe('sonnerSourceWith', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = sonnerSourceWith({ type: 'warning' })('', { args: { type: 'success' } });
    expect(code).toContain('toast.warning(');
    expect(code).not.toContain('toast.success(');
  });

  it('o nome acessível da região entra como opção citada da fábrica', () => {
    // A região da demonstração se nomeia porque a página tem outras, e a `play`
    // afirma esse nome: é prop REAL, e o painel a publicava sem ela.
    const code = sonnerSourceWith({ ariaLabel: 'Notificações da demonstração' })('', {});
    expect(code).toContain("'aria-label': 'Notificações da demonstração'");
  });
});

// ─── Story × snippet, os dezoito pares ────────────────────────────────────────
//
// O defeito desta família não é o snippet estar errado sozinho: é ele descrever
// OUTRA story, ou uma região que a story não monta. A tabela escreve, por story,
// a REGIÃO que ela monta — com as MESMAS opções do `render` — e as CHAMADAS que
// a `play` dispara, na ordem. Andaime fica fora de propósito: o quadro
// `contain: layout` e os prazos de suíte (1200 e 300).

/** O que NÃO pode aparecer no exemplo da story que não monta região. */
const MARCA_DE_REGIAO = /createSonnerToaster\s*\(/;

const SUCESSO = 'Alterações salvas.';
const PADRAO = 'Código copiado.';
const FALHA = 'Não foi possível salvar. Tente novamente.';
const AVISO = 'Sua sessão expira em 5 minutos.';
const INFO = 'Nova versão disponível.';
const DETALHE = 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.';

/** A região que as stories montam por `mountToaster()`. */
const REGION = { position: 'top-right', richColors: true } as const;

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

const REGIAO_PADRAO = "const regiao = createSonnerToaster({ richColors: true });";

const PROMESSA = [
  'toast.promise(enviarArquivo(), {',
  "loading: 'Enviando arquivo...',",
  "success: 'Arquivo enviado com sucesso.',",
  "error: 'Erro ao enviar. Tente novamente.',",
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
    snippet: () =>
      sonnerSourceWith({ ariaLabel: 'Notificações da demonstração' })('', {
        args: ARGS_DO_PLAYGROUND,
      }),
    region: ['richColors: true,', "'aria-label': 'Notificações da demonstração',"],
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'Types/Default',
    snippet: () => sonnerSnippet({ ...REGION, type: 'default', title: PADRAO }),
    region: [REGIAO_PADRAO],
    calls: [`toast('${PADRAO}');`],
  },
  {
    story: 'Types/Success',
    snippet: () => sonnerSnippet({ ...REGION, type: 'success', title: SUCESSO }),
    region: [REGIAO_PADRAO],
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'Types/Error',
    snippet: () => sonnerSnippet({ ...REGION, type: 'error', title: FALHA }),
    region: [REGIAO_PADRAO],
    calls: [`toast.error('${FALHA}');`],
  },
  {
    story: 'Types/Warning',
    snippet: () => sonnerSnippet({ ...REGION, type: 'warning', title: AVISO }),
    region: [REGIAO_PADRAO],
    calls: [`toast.warning('${AVISO}');`],
  },
  {
    story: 'Types/Info',
    snippet: () => sonnerSnippet({ ...REGION, type: 'info', title: INFO }),
    region: [REGIAO_PADRAO],
    calls: [`toast.info('${INFO}');`],
  },
  {
    story: 'Types/Loading',
    snippet: () => sonnerSnippet({ ...REGION, type: 'loading', title: 'Enviando arquivo...' }),
    region: [REGIAO_PADRAO],
    calls: [`toast.loading('Enviando arquivo...');`],
  },
  {
    story: 'States/AutoDismiss',
    snippet: () => sonnerSnippet({ ...REGION, type: 'error', title: FALHA }),
    region: [REGIAO_PADRAO],
    calls: [`toast.error('${FALHA}');`],
  },
  {
    story: 'States/PauseOnHover',
    snippet: () => sonnerSnippet({ ...REGION, type: 'info', title: INFO }),
    region: [REGIAO_PADRAO],
    calls: [`toast.info('${INFO}');`],
  },
  {
    story: 'States/Stacked',
    snippet: () =>
      sonnerStackSnippet(
        [
          { type: 'success', title: SUCESSO },
          { type: 'warning', title: AVISO },
          { type: 'info', title: INFO },
        ],
        REGION,
      ),
    region: [REGIAO_PADRAO],
    calls: [`toast.success('${SUCESSO}');`, `toast.warning('${AVISO}');`, `toast.info('${INFO}');`],
  },
  {
    story: 'States/PositionBottomCenter',
    snippet: () =>
      sonnerSnippet({ position: 'bottom-center', richColors: true, type: 'success', title: SUCESSO }),
    region: ["position: 'bottom-center'", 'richColors: true'],
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'States/WithoutToaster',
    snippet: () => sonnerNoRegionSnippet({ type: 'success', title: SUCESSO }),
    region: null,
    calls: [`toast.success('${SUCESSO}');`],
  },
  {
    story: 'States/DarkTheme',
    snippet: () =>
      sonnerStackSnippet(
        [
          { type: 'default', title: PADRAO },
          { type: 'success', title: SUCESSO },
          { type: 'error', title: FALHA },
          { type: 'warning', title: AVISO },
          { type: 'info', title: INFO },
        ],
        REGION,
      ),
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
    snippet: () =>
      sonnerSnippet({
        ...REGION,
        type: 'success',
        title: 'Preferências atualizadas.',
        description: DETALHE,
      }),
    region: [REGIAO_PADRAO],
    calls: [`toast.success('Preferências atualizadas.', {`, `description: '${DETALHE}',`],
  },
  {
    story: 'Compositions/WithAction',
    snippet: () =>
      sonnerSnippet({
        ...REGION,
        type: 'default',
        title: 'Item excluído.',
        actionLabel: 'Desfazer',
      }),
    region: [REGIAO_PADRAO],
    calls: [
      `toast('Item excluído.', {`,
      `action: { label: 'Desfazer', onClick: () => desfazer() },`,
    ],
    extras: ['function desfazer() {'],
  },
  {
    story: 'Compositions/PromiseResolved',
    snippet: () => sonnerPromiseSnippet(REGION),
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['function enviarArquivo(): Promise<void> {'],
  },
  {
    story: 'Compositions/PromiseRejected',
    snippet: () => sonnerPromiseSnippet(REGION),
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['function enviarArquivo(): Promise<void> {'],
  },
  {
    story: 'Compositions/Persistent',
    snippet: () =>
      sonnerSnippet({
        ...REGION,
        type: 'error',
        title: 'Falha crítica no servidor.',
        persistente: true,
      }),
    // O fechar vem da OPÇÃO da chamada, como na `play`: ligá-lo na região daria
    // botão de fechar em toda notificação da aplicação.
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

  it('nenhum exemplo publica o prazo encurtado da suíte', () => {
    for (const caso of CASOS) {
      expect(caso.snippet(), caso.story).not.toContain('duration: 1200');
      expect(caso.snippet(), caso.story).not.toContain('duration: 300');
    }
  });

  it('cobre as dezoito stories do componente', () => {
    // Contagem declarada: tabela que encolhe sem reprovar mede menos e continua
    // verde, que é como 28 exports saíram de uma varredura em silêncio.
    expect(CASOS).toHaveLength(18);
  });
});

// ─── Nenhum snippet cita função que não declara ───────────────────────────────
//
// O exemplo do painel é para ser COLADO. `onClick: () => desfazer()` e
// `enviarArquivo()` sem declaração entregavam um trecho que não se reproduz. A
// varredura é genérica de propósito: lista de nomes envelhece, e quem sai dela
// sai da medição em silêncio.

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
  // Manipulador passado por REFERÊNCIA sai do código CRU: o nome pode morar
  // dentro de um literal, que a limpeza acima apagaria.
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

  it('o caminho com ação também se sustenta sozinho, venha ele de control', () => {
    const code = sonnerSource('', {
      args: { type: 'default', title: 'Item excluído.', actionLabel: 'Desfazer' },
    });
    expect(code).toContain('function desfazer() {');
    expect(pendentes(code)).toEqual([]);
  });
});
