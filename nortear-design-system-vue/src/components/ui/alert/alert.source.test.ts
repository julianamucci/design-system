import { describe, expect, it } from 'vitest';
import {
  alertAdditionalClassSource,
  alertCompleteSource,
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertLayoutNoIconSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
  type AlertVariant,
} from './alert.source';

const ALL = [
  alertAdditionalClassSource,
  alertCompleteSource,
  alertContrastSource,
  alertDefaultSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertLayoutNoIconSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  () => alertSource(),
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
];

describe('regras que valem em todo snippet', () => {
  it('o ícone do alerta não leva `.nds-icon` — a folha o dimensiona por `.nds-alert > svg`', () => {
    for (const build of ALL) expect(build()).not.toContain('nds-icon');
  });

  it('nenhum snippet envolve o alerta em região aria-live', () => {
    for (const build of ALL) expect(build()).not.toContain('aria-live');
  });

  // O painel Code é onde se aprende a compor o alerta, e o nível do título é
  // decisão de hierarquia da página — não detalhe de implementação. Snippet que
  // publica `<AlertTitle>` cru ensina a aceitar o default, e foi assim que as
  // duas pontas (story e snippet) ficaram mostrando `h5` sem ninguém escolher.
  it('todo título publicado escreve o nível, e nenhum sai sem ele', () => {
    // Casa `<AlertTitle` que NÃO traga `as="h1..h6"` antes de fechar a tag.
    const titleWithoutLevel = /<AlertTitle(?![^>]*\bas="h[1-6]")/;
    for (const build of ALL) {
      const output = build();
      expect(
        titleWithoutLevel.test(output),
        `${build.name || 'alertSource'} publica <AlertTitle> sem o nível:\n${output}`,
      ).toBe(false);
    }
  });

  // Guarda de vacuidade: o caso acima passa sozinho se um dia nenhum snippet
  // escrever título. Só o sem-título pode ficar de fora, e ele se declara aqui.
  it('só o snippet sem título fica fora da cobertura de nível', () => {
    const buildersWithTitle = ALL.filter((build) => build().includes('<AlertTitle'));
    expect(buildersWithTitle).toHaveLength(ALL.length - 1);
    expect(alertNoTitleSource()).not.toContain('<AlertTitle');
  });
});

describe('alertSource', () => {
  it('sem args, entrega a forma canônica na variante padrão', () => {
    expect(alertSource()).toBe(
      `<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-vue-next'
</script>

<template>
  <Alert>
    <Info aria-hidden="true" />
    <AlertTitle as="h4">Atenção</AlertTitle>
    <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
  </Alert>
</template>`,
    );
  });

  it('não escreve os padrões do componente', () => {
    const output = alertSource('', {
      args: { variant: 'default', role: 'alert', dismissible: false },
    });
    expect(output).not.toContain('variant=');
    // `alert` já é live region assertiva; repetir o papel sugeriria que a
    // semântica precisa ser pedida.
    expect(output).not.toContain('role=');
    expect(output).not.toContain('dismissible');
  });

  it('o que difere do padrão entra na raiz', () => {
    const output = alertSource('', {
      args: { variant: 'destructive', role: 'note', dismissible: true },
    });
    expect(output).toContain('<Alert variant="destructive" role="note" dismissible>');
  });

  // O painel e o render do Playground escolhem o ícone pela MESMA regra de
  // propósito. Com o mapa só de um lado, o painel prometia `CheckCircle2`
  // enquanto a tela mostrava o informativo em toda variante que não fosse
  // `destructive` — e `accessibility.item4`, que a story declara cobrir, diz
  // justamente que ícone e texto se correspondem.
  it('o ícone acompanha a variante, no import e na marcação', () => {
    const cases: Array<[AlertVariant, string]> = [
      ['default', 'Info'],
      ['destructive', 'AlertCircle'],
      ['success', 'CheckCircle2'],
      ['warning', 'TriangleAlert'],
      ['info', 'Info'],
    ];
    for (const [variant, iconName] of cases) {
      const output = alertSource('', { args: { variant } });
      expect(output, `variante ${variant}`).toContain(
        `import { ${iconName} } from 'lucide-vue-next'`,
      );
      expect(output, `variante ${variant}`).toContain(`<${iconName} aria-hidden="true" />`);
    }
  });

  it('título e descrição saem dos controls', () => {
    const output = alertSource('', {
      args: { title: 'Sessão expira em 5 minutos', description: 'Salve seu trabalho.' },
    });
    expect(output).toContain('<AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>');
    expect(output).toContain('<AlertDescription>Salve seu trabalho.</AlertDescription>');
  });

  it('título vazio tira o subcomponente da marcação e do import', () => {
    const output = alertSource('', { args: { title: '' } });
    expect(output).not.toContain('AlertTitle');
    expect(output).toContain(`import { Alert, AlertDescription } from '@/components/ui/alert'`);
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = alertSource('', {
      args: { variant: (() => {}) as never, role: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).toBe(alertSource());
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante semântica leva o ícone e a mensagem do próprio caso', () => {
    expect(alertDefaultSource()).not.toContain('variant=');
    expect(alertDestructiveSource()).toContain('<Alert variant="destructive">');
    expect(alertDestructiveSource()).toContain(`import { AlertCircle } from 'lucide-vue-next'`);
    expect(alertSuccessSource()).toContain('<Alert variant="success">');
    expect(alertSuccessSource()).toContain(`import { CheckCircle2 } from 'lucide-vue-next'`);
    expect(alertWarningSource()).toContain('<Alert variant="warning">');
    expect(alertWarningSource()).toContain(`import { TriangleAlert } from 'lucide-vue-next'`);
    expect(alertInfoSource()).toContain('<Alert variant="info">');
    expect(alertInfoSource()).toContain('Você pode fixar os filtros mais usados');
  });

  it('o ícone é decorativo em toda variante — quem nomeia é o título', () => {
    for (const build of [alertDestructiveSource, alertSuccessSource, alertWarningSource]) {
      expect(build()).toMatch(/<\w+ aria-hidden="true" \/>/);
      expect(build()).not.toContain('aria-label');
    }
  });

  it('o fechável mostra a prop e o evento, e omite o rótulo padrão', () => {
    const output = alertDismissibleSource();
    expect(output).toContain('dismissible');
    expect(output).toContain('@dismiss="noticeVisible = false"');
    expect(output).toContain('<AlertTitle as="h4">Preferências salvas</AlertTitle>');
    expect(output).not.toContain('dismiss-label');
    // A remontagem por `:key` existe para a story não deixar o canvas vazio;
    // quem consome não escreve isso.
    expect(output).not.toContain(':key=');
  });

  it('fechar pelo teclado não tem nada a configurar, só o rótulo do que se fecha', () => {
    const output = alertDismissibleByKeyboardSource();
    expect(output).toContain(
      '<Alert variant="success" dismissible dismiss-label="Fechar confirmação">',
    );
    // O controle já é botão de verdade: um handler de tecla aqui ensinaria um
    // remendo que o componente não precisa.
    expect(output).not.toContain('@keydown');
    expect(output).not.toContain('tabindex');
  });

  it('o contraste empilha as cinco variantes sem ícone e sem cor no texto', () => {
    const output = alertContrastSource();
    expect(output.match(/<Alert[ >]/g)).toHaveLength(5);
    expect(output).toContain('<Alert>');
    expect(output).toContain('<Alert variant="info">');
    // Ícone competiria com a medição; e o texto corrido de contêiner colorido
    // nunca leva cor semântica.
    expect(output).not.toContain('nds-text-destructive');
    expect(output).not.toContain(`from 'lucide-vue-next'`);
  });
});

describe('transforms das stories de estado', () => {
  it('sem título, o subcomponente some do import junto com a marcação', () => {
    const output = alertNoTitleSource();
    expect(output).not.toContain('AlertTitle');
    expect(output).toContain(
      `import { Alert, AlertDescription } from '@/components/ui/alert'`,
    );
  });

  it('sem ícone, o import do ícone some junto', () => {
    const output = alertNoIconSource();
    expect(output).not.toContain('lucide-vue-next');
    expect(output).toContain('<AlertTitle as="h4">Atenção</AlertTitle>');
  });

  it('o completo traz os três: ícone, título e descrição', () => {
    const output = alertCompleteSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    expect(output).toContain('<AlertTitle as="h4">');
    expect(output).toContain('<AlertDescription>');
  });

  it('o papel de nota contrasta com o padrão no mesmo exemplo', () => {
    const output = alertNoAnnouncementSource();
    expect(output).toContain('<Alert role="note">');
    // O segundo alerta fica SEM papel escrito: é ele que mostra o padrão.
    expect(output).toContain('<Alert variant="destructive">');
    expect(output).toContain('Falha no envio');
    expect(output).not.toContain('role="alert"');
    // `data-testid` é gancho de teste, não parte do design system.
    expect(output).not.toContain('data-testid');
  });

  it('a inserção dinâmica monta o alerta depois da ação, sem região viva em volta', () => {
    const output = alertDynamicInsertionSource();
    expect(output).toContain('<Button size="sm" @click="reportReady = true">Gerar relatório</Button>');
    expect(output).toContain('<Alert v-if="reportReady">');
    expect(output).toContain('const reportReady = ref(false)');
    expect(output).not.toContain('aria-live');
  });
});

describe('transforms das stories de composição', () => {
  it('a ação mora no subcomponente próprio, com botão secundário', () => {
    const output = alertWithActionSource();
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
    expect(output).toContain(
      `    <AlertAction>
      <Button size="sm" variant="default">Atualizar</Button>
    </AlertAction>`,
    );
  });

  it('ação e fechar juntos: a prop na raiz e a ação no slot, sem prop de layout', () => {
    const output = alertWithActionAndDismissSource();
    expect(output).toContain('<Alert dismissible>');
    expect(output).toContain('<AlertTitle as="h4">Sessão expira em 5 minutos</AlertTitle>');
    expect(output).toContain(
      `    <AlertAction>
      <Button size="sm" variant="default">Salvar agora</Button>
    </AlertAction>`,
    );
  });

  it('a classe adicional aparece em cada subcomponente', () => {
    const output = alertAdditionalClassSource();
    expect(output).toContain('<Alert class="nds-w-full">');
    expect(output).toContain('<AlertTitle as="h4" class="nds-w-full">');
    expect(output).toContain('<AlertDescription class="nds-w-full">');
    expect(output).toContain('<AlertAction class="nds-w-auto">');
  });

  it('o ícone da composição é filho comum, sem prop que o posicione', () => {
    const output = alertWithIconSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    expect(output).not.toContain('icon=');
  });

  it('a coluna única é a ausência do ícone, não uma prop de layout', () => {
    const output = alertLayoutNoIconSource();
    expect(output).not.toContain('lucide-vue-next');
    expect(output).toContain('<AlertTitle as="h4">Sem ícone</AlertTitle>');
  });
});

// ─── O snippet descreve a story INTEIRA ──────────────────────────────────────
//
// Medido em 2026-09-16: a `DynamicInsertion` publicava Button e Alert SOLTOS,
// sem o `nds-stack` nem a linha do botão, e o render desta stack usava
// `data-spacing="md"` onde as outras quatro usam `sm`. As duas pontas são
// medidas juntas de propósito — a saída do painel não chega ao DOM durante a
// `play`, então nenhuma suíte de navegador vê a diferença.

describe('o painel publica a composição que a story renderiza', () => {
  const stories = import.meta.glob<string>(
    [
      './alert.stories.ts',
      './alert-variants.stories.ts',
      './alert-states.stories.ts',
      './alert-compositions.stories.ts',
    ],
    { query: '?raw', import: 'default', eager: true },
  );

  /** O bloco de uma story, do `export const Nome` até o próximo export. */
  const storyBlock = (file: string, name: string): string => {
    const text = stories[`./${file}.stories.ts`] ?? '';
    return (
      new RegExp(`export const ${name}: Story = \\{([\\s\\S]*?)(?=\\nexport |$)`).exec(text)?.[1] ??
      ''
    );
  };

  it('os quatro arquivos de story foram lidos', () => {
    expect(Object.keys(stories)).toHaveLength(4);
  });

  it('DynamicInsertion: contêiner, linha do botão e o MESMO espaçamento da story', () => {
    const output = alertDynamicInsertionSource();
    expect(output).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(output).toContain(
      '<Button size="sm" @click="reportReady = true">Gerar relatório</Button>',
    );
    expect(output).toContain('<Alert v-if="reportReady">');

    // O render usava `md` onde as outras quatro stacks usam `sm`: divergência de
    // TELA, não de snippet, e é por isso que o par é medido junto.
    const block = storyBlock('alert-states', 'DynamicInsertion');
    expect(block, 'a story DynamicInsertion não foi encontrada').not.toBe('');
    expect(block).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(block).not.toContain('data-spacing="md"');
  });

  it('Contrast: as cinco variantes e o contêiner que as empilha', () => {
    const output = alertContrastSource();
    expect(output.match(/<Alert[ >]/g)).toHaveLength(5);
    expect(output).toContain('<div class="nds-stack" data-spacing="sm">');
    for (const name of ['default', 'destructive', 'success', 'warning', 'info']) {
      expect(output).toContain(`Título ${name}`);
    }
  });

  it('WithoutAnnouncement: os DOIS alertas, no contêiner', () => {
    const output = alertNoAnnouncementSource();
    expect(output.match(/<Alert[ >]/g)).toHaveLength(2);
    expect(output).toContain('<div class="nds-stack" data-spacing="md">');
  });

  it('AdditionalClass: a classe na raiz e em cada peça', () => {
    const output = alertAdditionalClassSource();
    expect(output.match(/nds-w-full/g)).toHaveLength(3);
    expect(output).toContain('<AlertAction class="nds-w-auto">');
  });

  it('nenhuma story do alerta herda o snippet do meta', () => {
    // Herança acerta por COINCIDÊNCIA, e a coincidência não sobrevive à próxima
    // edição do render.
    for (const [file, text] of Object.entries(stories)) {
      const declaracoes = [...text.matchAll(/^export const ([A-Z]\w*): Story = \{/gm)];
      expect(declaracoes.length, `${file}: nenhuma story encontrada`).toBeGreaterThan(0);
      declaracoes.forEach((m, i) => {
        const fim = i + 1 < declaracoes.length ? declaracoes[i + 1].index : text.length;
        expect(
          text.slice(m.index, fim),
          `${file} › ${m[1]} herda o snippet do meta`,
        ).toContain('transform:');
      });
    }
  });
});
