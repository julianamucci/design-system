import { describe, expect, it } from 'vitest';
import {
  alertAdditionalClassSource,
  alertContrastSource,
  alertDestructiveSource,
  alertDismissibleByKeyboardSource,
  alertDismissibleSource,
  alertDynamicInsertionSource,
  alertInfoSource,
  alertLayoutWithoutIconSource,
  alertNoAnnouncementSource,
  alertNoIconSource,
  alertNoTitleSource,
  alertSource,
  alertSuccessSource,
  alertWarningSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
} from './alert.source';

const ALL = [
  alertSource,
  alertDestructiveSource,
  alertSuccessSource,
  alertWarningSource,
  alertInfoSource,
  alertDismissibleSource,
  alertDismissibleByKeyboardSource,
  alertContrastSource,
  alertNoTitleSource,
  alertNoIconSource,
  alertNoAnnouncementSource,
  alertDynamicInsertionSource,
  alertWithIconSource,
  alertLayoutWithoutIconSource,
  alertWithActionSource,
  alertWithActionAndDismissSource,
  alertAdditionalClassSource,
];

describe('regras que valem para todo snippet do alert', () => {
  it('o ícone do alerta não carrega .nds-icon — a folha dimensiona por `.nds-alert > svg`', () => {
    for (const build of ALL) expect(build()).not.toContain('nds-icon');
  });

  it('nenhum snippet embrulha o alerta numa região aria-live', () => {
    for (const build of ALL) expect(build()).not.toContain('aria-live');
  });

  it('nenhum snippet ensina console.log como callback', () => {
    for (const build of ALL) expect(build()).not.toContain('console.log');
    expect(alertSource('', { args: { dismissible: true } })).not.toContain('console.log');
  });
});

describe('o snippet ENSINA o nível do heading do título', () => {
  // O primitivo tem default `h5`, e snippet que omite o nível ensina a herdar o
  // default — que quase nunca é o nível certo na página de quem copia. Toda
  // story do Alert escreve `as="h4"`; o painel Code tem que escrever o mesmo.
  /** Só as aberturas de AlertTitle: `</AlertTitle>` não casa. */
  const titleTags = (output: string) => output.match(/<AlertTitle[^>]*>/g) ?? [];

  it('todo snippet com título escreve o nível, e nenhum publica título sem nível', () => {
    const withTitle = ALL.map((build) => build()).filter((out) => titleTags(out).length > 0);
    // Contagem declarada de propósito: só `alertNoTitleSource` fica de fora da
    // varredura. Se um snippet perder o título, o portão reprova em vez de
    // continuar verde medindo menos.
    expect(withTitle).toHaveLength(ALL.length - 1);
    expect(titleTags(alertNoTitleSource())).toEqual([]);

    for (const output of withTitle) {
      for (const tag of titleTags(output)) expect(tag).toContain('as="h4"');
    }
  });

  it('o snippet do Playground ensina o nível em qualquer configuração dos controls', () => {
    const configuracoes = [
      {},
      { dismissible: true },
      { variant: 'destructive' as const },
      { role: 'note' as const },
    ];
    for (const args of configuracoes) {
      const tags = titleTags(alertSource('', { args }));
      expect(tags).toHaveLength(1);
      expect(tags[0]).toContain('as="h4"');
    }
  });
});

describe('alertSource', () => {
  it('sem args, entrega a forma canônica sem nenhum atributo padrão repetido', () => {
    expect(alertSource()).toBe(
      `<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import Info from "@lucide/svelte/icons/info";
</script>

<Alert>
  <Info aria-hidden="true" />
  <AlertTitle as="h4">Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`,
    );
  });

  it('só escreve variant quando o valor difere do padrão', () => {
    expect(alertSource('', { args: { variant: 'default' } })).not.toContain('variant');
    expect(alertSource('', { args: { variant: 'destructive' } })).toContain('variant="destructive"');
  });

  it('só escreve role quando o valor difere do padrão', () => {
    expect(alertSource('', { args: { role: 'alert' } })).not.toContain('role=');
    expect(alertSource('', { args: { role: 'note' } })).toContain('role="note"');
  });

  // O mapa vive nas DUAS pontas — aqui e no render do Playground
  // (`variantIcon`, em `alert.stories.ts`). Com ele só de um lado, o painel
  // prometia um ícone e a tela mostrava o informativo em toda variante que não
  // fosse `destructive`.
  it('o ícone do snippet acompanha a variante escolhida no control', () => {
    const expected = {
      default: ['Info', 'icons/info'],
      destructive: ['AlertCircle', 'icons/circle-alert'],
      success: ['CheckCircle2', 'icons/circle-check-big'],
      warning: ['TriangleAlert', 'icons/triangle-alert'],
      info: ['Info', 'icons/info'],
    } as const;

    for (const [variant, [component, importPath]] of Object.entries(expected)) {
      const output = alertSource('', { args: { variant: variant as keyof typeof expected } });
      expect(output, variant).toContain(`<${component} aria-hidden="true" />`);
      expect(output, variant).toContain(importPath);
      // E só UM ícone: o import errado sobrando é a forma que o defeito tinha.
      expect(output.match(/^\s*<[A-Z]\w* aria-hidden="true" \/>$/gm), variant).toHaveLength(1);
    }
  });

  it('os controls de título e descrição chegam ao snippet', () => {
    const output = alertSource('', {
      args: { title: 'Sessão expirada', description: 'Entre de novo para continuar.' },
    });
    expect(output).toContain('<AlertTitle as="h4">Sessão expirada</AlertTitle>');
    expect(output).toContain('<AlertDescription>Entre de novo para continuar.</AlertDescription>');
    expect(output).not.toContain('Atenção');
  });

  it('título vazio publica a composição sem AlertTitle', () => {
    const output = alertSource('', { args: { title: '' } });
    expect(output).not.toContain('<AlertTitle');
    expect(output).toContain('<AlertDescription>');
  });

  it('o control de fechar traz a prop e o callback declarado juntos', () => {
    expect(alertSource('', { args: { dismissible: false } })).not.toContain('dismissible');
    const output = alertSource('', { args: { dismissible: true } });
    expect(output).toContain('dismissible');
    expect(output).toContain('onDismiss={handleDismiss}');
    expect(output).toContain('function handleDismiss()');
  });
});

describe('transforms das stories de variante', () => {
  it('cada variante escreve a própria prop e importa o próprio ícone', () => {
    expect(alertDestructiveSource()).toContain('variant="destructive"');
    expect(alertDestructiveSource()).toContain('icons/circle-alert');
    expect(alertSuccessSource()).toContain('variant="success"');
    expect(alertSuccessSource()).toContain('icons/circle-check-big');
    expect(alertWarningSource()).toContain('variant="warning"');
    expect(alertWarningSource()).toContain('icons/triangle-alert');
    expect(alertInfoSource()).toContain('variant="info"');
    expect(alertInfoSource()).toContain('Você pode fixar os filtros mais usados');
  });

  it('o alert dispensável do clique mostra a prop e o callback, com o texto da story', () => {
    const output = alertDismissibleSource();
    expect(output).toContain('<Alert dismissible onDismiss={handleDismiss}>');
    expect(output).toContain('Preferências salvas');
  });

  it('o alert dispensável do teclado é success e nomeia o que o X fecha', () => {
    const output = alertDismissibleByKeyboardSource();
    expect(output).toContain('variant="success"');
    expect(output).toContain('dismissLabel="Fechar confirmação"');
  });

  it('a medição de contraste mostra as cinco variantes na mesma tela', () => {
    const output = alertContrastSource();
    expect(output).toContain('const variants: AlertVariant[]');
    expect(output).toContain('<Alert {variant}>');
    for (const variant of ['default', 'destructive', 'success', 'warning', 'info']) {
      expect(output).toContain(`"${variant}"`);
    }
  });
});

describe('transforms das stories de estado', () => {
  it('sem título, nem o subcomponente nem o import sobram', () => {
    const output = alertNoTitleSource();
    expect(output).not.toContain('AlertTitle');
    expect(output).toContain('<AlertDescription>');
  });

  it('sem ícone, o snippet não importa ícone nenhum e escreve o texto do estado', () => {
    const output = alertNoIconSource();
    expect(output).not.toContain('@lucide/svelte');
    expect(output).toContain('<AlertTitle as="h4">Atenção</AlertTitle>');
    expect(output).toContain('Suas alterações serão aplicadas na próxima sessão.');
    expect(output).not.toContain('Sem ícone');
  });

  it('o par estático × urgente contrasta role="note" com a omissão da prop', () => {
    const output = alertNoAnnouncementSource();
    expect(output).toContain('<Alert role="note">');
    // O segundo alert NÃO declara role: é o padrão `alert` que se quer mostrar.
    expect(output).toContain('<Alert variant="destructive">');
    expect(output).toContain('Falha no envio');
  });

  it('a inserção dinâmica monta o alerta depois da ação, com o role padrão na raiz', () => {
    const output = alertDynamicInsertionSource();
    expect(output).toContain('let generated = $state(false);');
    expect(output).toContain('{#if generated}');
    expect(output).toContain('<Alert>');
    expect(output).not.toContain('role=');
    expect(output).toContain('Operação concluída');
    expect(output).toContain('<Button variant="default" size="sm"');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição com ícone escreve o texto da própria story, não o do meta', () => {
    const output = alertWithIconSource();
    expect(output).toContain('<Info aria-hidden="true" />');
    expect(output).toContain('<AlertTitle as="h4">Informação</AlertTitle>');
    expect(output).toContain('Ícone SVG posicionado automaticamente.');
    expect(output).not.toContain('Atenção');
  });

  it('a composição sem ícone escreve só o texto da própria story', () => {
    const output = alertLayoutWithoutIconSource();
    expect(output).not.toContain('@lucide/svelte');
    expect(output).toContain('<AlertTitle as="h4">Sem ícone</AlertTitle>');
    expect(output).toContain('Alert sem ícone mantém layout de coluna única.');
    expect(output).not.toContain('Atenção');
  });

  it('a composição com ação aninha o Button dentro do AlertAction', () => {
    const output = alertWithActionSource();
    expect(output).toContain('from "@/components/ui/button"');
    expect(output).toContain('<AlertAction>');
    expect(output).toContain('<Button size="sm" variant="default">Atualizar</Button>');
  });

  it('ação e fechar convivem no mesmo alerta', () => {
    const output = alertWithActionAndDismissSource();
    expect(output).toContain('<Alert dismissible>');
    expect(output).toContain('<AlertAction>');
    expect(output).toContain('<Button size="sm" variant="default">Salvar agora</Button>');
    expect(output).toContain('Sessão expira em 5 minutos');
  });

  it('a classe adicional aparece na raiz e em cada subcomponente', () => {
    const output = alertAdditionalClassSource();
    expect(output).toContain('<Alert class="nds-w-full">');
    expect(output).toContain('<AlertTitle as="h4" class="nds-w-full">');
    expect(output).toContain('<AlertDescription class="nds-w-full">');
    expect(output).toContain('<AlertAction class="nds-w-auto">');
  });
});

// ─── O snippet descreve a story INTEIRA ──────────────────────────────────────
//
// Medido em 2026-09-16: a `DynamicInsertion` publicava Button e `{#if}` SOLTOS,
// sem o `nds-stack` nem a linha do botão que o componente de story monta. O par
// é medido junto porque a saída do painel não chega ao DOM durante a `play` —
// nenhuma suíte de navegador vê esta diferença.

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

  /** Os componentes de story: nesta stack o render mora num `.svelte`. */
  const storyComponents = import.meta.glob<string>('./Alert*Story.svelte', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  it('os quatro arquivos de story foram lidos', () => {
    expect(Object.keys(stories)).toHaveLength(4);
  });

  it('DynamicInsertion: contêiner e linha do botão, como no componente de story', () => {
    const output = alertDynamicInsertionSource();
    expect(output).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(output).toContain(
      '<Button variant="default" size="sm" onclick={() => (generated = true)}>Gerar relatório</Button>',
    );
    expect(output).toContain('{#if generated}');

    // O par tem de bater com o componente que a story renderiza de verdade.
    const componente = storyComponents['./AlertDynamicInsertionStory.svelte'] ?? '';
    expect(componente, 'o componente da story não foi lido').not.toBe('');
    expect(componente).toContain('data-spacing="sm"');
    expect(componente).toContain('Gerar relatório');
  });

  it('Contrast: as cinco variantes e o contêiner que as empilha', () => {
    const output = alertContrastSource();
    expect(output).toContain('<div class="nds-stack" data-spacing="sm">');
    expect(output).toContain('{#each variants as variant (variant)}');
    for (const name of ['default', 'destructive', 'success', 'warning', 'info']) {
      expect(output).toContain(`"${name}"`);
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
