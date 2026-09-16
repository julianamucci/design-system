import { describe, expect, it } from 'vitest';
import {
  sonnerWarningSource,
  sonnerLoadingSource,
  sonnerWithActionSource,
  sonnerWithDescriptionSource,
  sonnerStackedSource,
  sonnerErrorSource,
  sonnerInfoSource,
  sonnerDefaultSource,
  sonnerPersistentSource,
  sonnerPositionSource,
  sonnerDurationSource,
  sonnerPauseSource,
  sonnerPromiseSource,
  sonnerNoRegionSource,
  sonnerSource,
  sonnerSuccessSource,
  sonnerDarkThemeSource,
} from './sonner.source';

describe('sonnerSource', () => {
  it('sem args, entrega o par completo: o gatilho e a região montada uma vez', () => {
    expect(sonnerSource()).toBe(
      `<script lang="ts">
  import { toast } from "svelte-sonner";
  import { Toaster } from "@/components/ui/sonner";
  import { Button } from "@/components/ui/button";
</script>

<Button variant="outline" onclick={() => toast.success("Alterações salvas.")}>
  Disparar notificação
</Button>

<!-- Uma vez, na raiz da aplicação -->
<Toaster position="top-right" richColors />`,
    );
  });

  it('acompanha o control de tipo — o neutro é a função nua, sem sufixo', () => {
    expect(sonnerSource('', { args: { type: 'default' } })).toContain('toast("Alterações salvas.")');
    expect(sonnerSource('', { args: { type: 'error' } })).toContain('toast.error(');
    expect(sonnerSource('', { args: { type: 'loading' } })).toContain('toast.loading(');
  });

  it('acompanha o control de título', () => {
    expect(sonnerSource('', { args: { title: 'Item excluído.' } })).toContain('"Item excluído."');
  });

  it('descrição e ação viram objeto de opções numa função nomeada', () => {
    const withBoth = sonnerSource('', {
      args: { description: 'Detalhes.', actionLabel: 'Desfazer' },
    });
    expect(withBoth).toContain('function avisar()');
    expect(withBoth).toContain('description: "Detalhes.",');
    expect(withBoth).toContain('action: { label: "Desfazer", onClick: desfazer },');
    // Sem opções não há função: o gatilho é a própria chamada, em linha.
    expect(sonnerSource()).not.toContain('function avisar()');
  });

  it('a posição é sempre explícita, e closeButton só quando difere do padrão', () => {
    expect(sonnerSource('', { args: { position: 'bottom-center' } })).toContain(
      'position="bottom-center"',
    );
    expect(sonnerSource()).not.toContain('closeButton');
    expect(sonnerSource('', { args: { closeButton: true } })).toContain('closeButton');
  });

  it('richColors e duration só aparecem quando diferem do padrão', () => {
    expect(sonnerSource('', { args: { richColors: false } })).not.toContain('richColors');
    expect(sonnerSource('', { args: { duration: 4000 } })).not.toContain('duration');
    expect(sonnerSource('', { args: { duration: 8000 } })).toContain('duration={8000}');
  });
});

describe('transforms dos tipos', () => {
  it('o tipo neutro chama a função nua', () => {
    expect(sonnerDefaultSource()).toContain('toast("Código copiado.")');
  });

  it('cada tipo semântico chama o seu próprio método', () => {
    expect(sonnerSuccessSource()).toContain('toast.success("Alterações salvas.")');
    expect(sonnerErrorSource()).toContain('toast.error(');
    expect(sonnerWarningSource()).toContain('toast.warning(');
    expect(sonnerInfoSource()).toContain('toast.info(');
    expect(sonnerLoadingSource()).toContain('toast.loading(');
  });

  it('o aviso não se disfarça de falha', () => {
    expect(sonnerWarningSource()).not.toContain('toast.error(');
  });
});

describe('transforms dos estados', () => {
  it('o prazo é escrito na REGIÃO, e não na chamada', () => {
    const exit = sonnerDurationSource();
    expect(exit).toContain('<Toaster position="top-right" richColors duration={4000} />');
    expect(exit).not.toContain('duration:');
  });

  it('a pilha aberta pede expand, com três chamadas na mesma função', () => {
    const exit = sonnerStackedSource();
    expect(exit).toContain('expand');
    expect(exit.match(/ {2}toast/g)).toHaveLength(3);
  });

  it('a posição escolhida chega à região', () => {
    expect(sonnerPositionSource()).toContain('position="bottom-center"');
  });

  it('o caso sem região não monta Toaster nenhum', () => {
    const exit = sonnerNoRegionSource();
    // O ELEMENTO e o import, não a palavra — a mesma forma nas cinco stacks.
    // Esta já media a tag (`<Toaster`), e por isso sobreviveu ao comentário do
    // snippet ("Nenhum Toaster montado"); faltava o import, que é a outra porta
    // por onde a região entraria.
    expect(exit).not.toMatch(/<Toaster\b/);
    expect(exit).not.toMatch(/import\s*\{[^}]*\bToaster\b/);
    expect(exit).toContain('toast.success(');
  });

  it('o tema escuro põe os cinco tipos na tela, com a pilha aberta', () => {
    const exit = sonnerDarkThemeSource();
    expect(exit).toContain('theme="dark"');
    expect(exit).toContain('expand');
    expect(exit.match(/ {2}toast/g)).toHaveLength(5);
  });
});

describe('transforms das composições', () => {
  it('a descrição entra como opção da chamada', () => {
    expect(sonnerWithDescriptionSource()).toContain('description:');
  });

  it('a ação embutida carrega rótulo e callback', () => {
    expect(sonnerWithActionSource()).toContain('action: { label: "Desfazer", onClick: desfazer },');
  });

  it('a promessa declara os três desfechos numa chamada só', () => {
    const exit = sonnerPromiseSource();
    expect(exit).toContain('toast.promise(');
    expect(exit).toContain('loading:');
    expect(exit).toContain('success:');
    expect(exit).toContain('error:');
  });

  it('a persistente junta prazo infinito e botão de fechar', () => {
    const exit = sonnerPersistentSource();
    expect(exit).toContain('duration: Number.POSITIVE_INFINITY,');
    expect(exit).toContain('closeButton');
  });
});

// ─── Story × snippet, os dezoito pares ────────────────────────────────────────
//
// O defeito desta família não é o snippet estar errado sozinho: é ele descrever
// OUTRA story. A PauseOnHover herdava o `sonnerSource` do `meta`, que lê os ARGS
// dela: publicava `toast.success(…)` com `duration={1200}` — a chamada de outra
// notificação e o relógio da suíte — enquanto a `play` dispara `toast.info(…)`.
// A tabela escreve, por story, a REGIÃO que ela monta e as CHAMADAS que a `play`
// dispara, na ordem. Andaime fica fora: o quadro do canvas e os prazos de teste.

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
  'toast.promise(enviarArquivo(), {',
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
    region: [REGIAO_PADRAO],
    calls: ['toast.success("Alterações salvas.")'],
    extras: ['Disparar notificação'],
  },
  {
    story: 'Types/Default',
    snippet: sonnerDefaultSource,
    region: [REGIAO_PADRAO],
    calls: ['toast("Código copiado.")'],
  },
  {
    story: 'Types/Success',
    snippet: sonnerSuccessSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.success("Alterações salvas.")'],
  },
  {
    story: 'Types/Error',
    snippet: sonnerErrorSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.error("Não foi possível salvar. Tente novamente.")'],
  },
  {
    story: 'Types/Warning',
    snippet: sonnerWarningSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.warning("Sua sessão expira em 5 minutos.")'],
  },
  {
    story: 'Types/Info',
    snippet: sonnerInfoSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.info("Nova versão disponível.")'],
  },
  {
    story: 'Types/Loading',
    snippet: sonnerLoadingSource,
    region: [REGIAO_PADRAO],
    calls: ['toast.loading("Enviando arquivo...")'],
  },
  {
    story: 'States/AutoDismiss',
    snippet: sonnerDurationSource,
    region: ['<Toaster position="top-right" richColors duration={4000} />'],
    calls: ['toast.error("Não foi possível salvar. Tente novamente.")'],
  },
  {
    story: 'States/PauseOnHover',
    snippet: sonnerPauseSource,
    region: [REGIAO_PADRAO],
    // A `play` desta story dispara a INFORMATIVA, e o prazo do exemplo é o do
    // design system — nunca o `duration={1200}` que a suíte usa.
    calls: ['toast.info("Nova versão disponível.")'],
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
    snippet: sonnerPositionSource,
    region: ['<Toaster position="bottom-center" richColors />'],
    calls: ['toast.success("Alterações salvas.")'],
  },
  {
    story: 'States/WithoutToaster',
    snippet: sonnerNoRegionSource,
    region: null,
    calls: ['toast.success("Alterações salvas.")'],
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
      '"Suas configurações foram salvas e entrarão em vigor na próxima sessão.",',
    ],
  },
  {
    story: 'Compositions/WithAction',
    snippet: sonnerWithActionSource,
    region: [REGIAO_PADRAO],
    calls: [
      'toast("Item excluído.", {',
      'action: { label: "Desfazer", onClick: desfazer },',
    ],
    extras: ['function desfazer() {', 'Excluir item'],
  },
  {
    story: 'Compositions/PromiseResolved',
    snippet: sonnerPromiseSource,
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['function enviarArquivo(): Promise<void> {'],
  },
  {
    story: 'Compositions/PromiseRejected',
    snippet: sonnerPromiseSource,
    region: [REGIAO_PADRAO],
    calls: PROMESSA,
    extras: ['function enviarArquivo(): Promise<void> {'],
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

  it('nenhum exemplo publica o prazo encurtado da suíte', () => {
    // 1200 e 300 são relógio de teste. Eles chegavam ao painel pela PauseOnHover,
    // que lia os args da story — o caminho que o construtor próprio fechou.
    for (const caso of CASOS) {
      expect(caso.snippet(), caso.story).not.toContain('duration={1200}');
      expect(caso.snippet(), caso.story).not.toContain('duration={300}');
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
// O exemplo do painel é para ser COLADO. `onClick: desfazer` e `enviarArquivo()`
// sem declaração entregavam um trecho que não se reproduz. A varredura é
// genérica de propósito: lista de nomes envelhece, e quem sai dela sai da
// medição em silêncio.

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
  // Manipulador passado por REFERÊNCIA sai do código CRU: em `onclick={x}` e em
  // `@click="x"` o nome mora onde a limpeza acima passaria por cima.
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
    // É por aqui que o defeito entrava: `onClick: desfazer` vindo de um control,
    // com o manipulador em lugar nenhum do exemplo.
    const exit = sonnerSource('', {
      args: { description: 'Detalhe da mudança.', actionLabel: 'Desfazer' },
    });
    expect(exit).toContain('function desfazer() {');
    expect(pendentes(exit)).toEqual([]);
  });
});
