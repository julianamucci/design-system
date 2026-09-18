import { describe, expect, it } from 'vitest';
import {
  tooltipOpenSource,
  tooltipButtonIconSource,
  tooltipHelpInFormFieldSource,
  tooltipMetricDescriptionSource,
  tooltipWithShortcutSource,
  tooltipWithWaitSource,
  tooltipControlledSource,
  tooltipClosedSource,
  tooltipPersistenteSource,
  tooltipQuatroLadosSource,
  tooltipSource,
  tooltipTextCurtoSource,
  tooltipTextLongSource,
  tooltipCollisionSource,
  tooltipGroupWaitSource,
} from './tooltip.source';

describe('tooltipSource', () => {
  it('sem args, entrega a forma canônica: Provider, gatilho nomeado e balão', () => {
    expect(tooltipSource()).toBe(
      `<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Save } from 'lucide-vue-next'
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="outline" size="icon" aria-label="Salvar">
          <Save aria-hidden="true" class="nds-size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>`,
    );
  });

  it('não escreve os valores padrão de posicionamento nem de abertura', () => {
    const output = tooltipSource('', { args: { side: 'top', align: 'center', defaultOpen: false } });
    expect(output).not.toContain('side=');
    expect(output).not.toContain('align=');
    expect(output).not.toContain('default-open');
    // A espera padrão já vem do design system: declará-la ensinaria que a prop
    // é obrigatória.
    expect(output).toContain('<TooltipProvider>');
  });

  it('os controls que diferem do padrão chegam ao balão e à raiz', () => {
    const output = tooltipSource('', { args: { side: 'right', align: 'start', defaultOpen: true } });
    expect(output).toContain('<Tooltip default-open>');
    expect(output).toContain('<TooltipContent side="right" align="start">');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = tooltipSource('', {
      args: { side: (() => {}) as never, align: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('side=');
    expect(output).not.toContain('align=');
  });

  it('o nome acessível é do BOTÃO, e o ícone sai da árvore de acessibilidade', () => {
    const output = tooltipSource();
    expect(output).toContain('<Button variant="outline" size="icon" aria-label="Salvar">');
    expect(output).toContain('<Save aria-hidden="true" class="nds-size-4" />');
    // `as-child` é o que faz o gatilho reaproveitar o botão em vez de embrulhá-lo
    // num segundo elemento focável.
    expect(output).toContain('<TooltipTrigger as-child>');
  });
});

describe('transforms das stories de variante', () => {
  it('o texto curto cabe em linha, dentro do próprio balão', () => {
    const output = tooltipTextCurtoSource();
    expect(output).toContain('<TooltipContent>Salvar</TooltipContent>');
    // Sem `side`: o balão nasce no `top` padrão, como nas outras stacks. Cravar
    // `bottom` aqui publicava um lado que a story não pede mais.
    expect(output).not.toContain('side=');
  });

  it('o atalho vai em Kbd, e o balão vira bloco para caber a estrutura', () => {
    const output = tooltipWithShortcutSource();
    expect(output).toContain(`import { Kbd } from '@/components/ui/kbd'`);
    expect(output).toContain(`        <span>Salvar</span>
        <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd>`);
    // Solto no texto o atalho perderia a tecla que a folha compartilhada
    // reconhece pelo componente.
    expect(output).not.toContain('Salvar (Ctrl+S)');
    expect(output).not.toContain('side=');
  });

  it('o texto longo troca o gatilho por um botão com rótulo visível', () => {
    const output = tooltipTextLongSource();
    expect(output).toContain('<Button variant="outline">Compartilhar</Button>');
    // Sem ícone não há o que importar da biblioteca de ícones.
    expect(output).not.toContain('lucide-vue-next');
    expect(output).not.toContain('aria-hidden');
    expect(output).toContain('qualquer pessoa com o link vê o conteúdo');
  });
});

describe('transforms das stories de estado', () => {
  it('o estado de partida não pede abertura nem lado', () => {
    const output = tooltipClosedSource();
    expect(output).not.toContain('default-open');
    expect(output).not.toContain('side=');
    expect(output).toContain('<TooltipContent>Salvar</TooltipContent>');
  });

  it('a abertura de saída é uma prop da raiz', () => {
    const output = tooltipOpenSource();
    expect(output).toContain('<Tooltip default-open>');
    expect(output).not.toContain('side=');
  });

  it('a espera mora no Provider, não na raiz do balão', () => {
    const output = tooltipWithWaitSource();
    expect(output).toContain('<TooltipProvider :delay-duration="600">');
    // Com espera declarada, abrir de saída apagaria justamente o que a story
    // mede: o intervalo entre chegar e abrir.
    expect(output).not.toContain('default-open');
  });

  it('a persistência não tem prop a ligar — a tolerância já vem no componente', () => {
    const output = tooltipPersistenteSource();
    expect(output).toContain('<Button variant="outline">Compartilhar</Button>');
    expect(output).not.toContain('hoverable');
    expect(output).not.toContain('default-open');
  });

  it('o modo controlado leva o estado ao script e devolve a mudança à raiz', () => {
    const output = tooltipControlledSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('const aberto = ref(false)');
    expect(output).toContain('<Tooltip :open="aberto" @update:open="(valor) => (aberto = valor)">');
    // Dois botões, e não um que alterna: o clique fora já dispensa o balão antes
    // do `click`, e um alternador reabriria o que acabou de fechar.
    expect(output).toContain('@click="aberto = true"');
    expect(output).toContain('@click="aberto = false"');
    expect(output).not.toContain('default-open');
  });
});

describe('transforms das stories de composição', () => {
  it('a composição de referência é a mesma do texto curto', () => {
    expect(tooltipButtonIconSource()).toBe(tooltipTextCurtoSource());
  });

  it('a ajuda do campo mantém o rótulo ligado ao input, e o balão à direita', () => {
    const output = tooltipHelpInFormFieldSource();
    // O `for`/`id` é o que nomeia o campo; o balão é complementar.
    expect(output).toContain(
      '<label for="api-token-input" class="nds-text-body nds-font-medium">Token de API</label>',
    );
    expect(output).toContain(
      '<input id="api-token-input" type="text" class="nds-input" placeholder="ndsk_..." />',
    );
    // O glifo "?" é desenho feito de letra: quem nomeia o botão é o aria-label.
    expect(output).toContain(
      '<Button variant="ghost" size="icon-sm" aria-label="Onde encontrar o Token de API">?</Button>',
    );
    expect(output).toContain(
      '<TooltipContent side="right">Gere em Configurações › Acesso › Tokens.</TooltipContent>',
    );
  });

  it('a métrica publica a sigla visível e a expansão no balão', () => {
    const output = tooltipMetricDescriptionSource();
    expect(output).toContain('>LCP</p>');
    expect(output).toContain('<Button variant="ghost" size="icon-sm" aria-label="O que é LCP">i</Button>');
    expect(output).toContain('<TooltipContent>LCP — Largest Contentful Paint</TooltipContent>');
    // `top` é o padrão: declarar o lado ensinaria a escrever o que já vem.
    expect(output).not.toContain('side=');
  });

  it('os quatro lados aparecem juntos, cada um declarando o seu', () => {
    const output = tooltipQuatroLadosSource();
    expect(output.match(/<Tooltip default-open>/g)).toHaveLength(4);
    // `top` inclusive: a story escreve os quatro, e o painel Code publica o que
    // ela renderiza. Omitir o padrão ensinava uma composição que não existe.
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(output).toContain(`<TooltipContent side="${side}">Tooltip ${side}</TooltipContent>`);
      // A tag INTEIRA: asserção por pedaço já aprovou markup errado nesta casa.
      expect(output).toContain(
        `<Button variant="outline" size="sm" aria-label="${side}">${side}</Button>`,
      );
    }
    // `nds-w-full` entra: sem largura declarada a grade encolhe para o
    // conteúdo, as colunas colapsam e o exemplo deixa de mostrar os quatro
    // lados lado a lado.
    //
    // Por expressão, e não por texto literal: com o `nds-w-full` a fila de
    // atributos passou dos 60 caracteres e o construtor quebra a tag em uma
    // linha por atributo. O `\s+` aceita as duas formas sem afrouxar o que se
    // cobra — a tag INTEIRA, com os três atributos na ordem e o `>` que fecha.
    // Asserção por pedaço já aprovou markup errado nesta casa.
    expect(output).toMatch(
      /<div\s+class="nds-grid nds-w-full nds-p-8"\s+data-spacing="xl"\s+data-cols="2"\s*>/,
    );
  });

  it('a colisão publica a barra presa ao topo — é ela que encosta o gatilho na borda', () => {
    const output = tooltipCollisionSource();
    // O andaime de canvas fica de fora dos snippets desta casa; este NÃO é
    // andaime: sem a barra na borda não há colisão, e o exemplo viraria um
    // tooltip comum que nunca vira.
    expect(output).toContain('position: fixed; inset-block-start: 0; inset-inline: 0');
    // O PEDIDO continua sendo `top`. O snippet ensina o que se escreve, e a
    // virada é o que o posicionador faz com isso — publicar `bottom` ensinaria
    // a pedir o resultado, que não é o que ninguém escreve.
    expect(output).toContain(
      '<TooltipContent side="top">Cria um link público de leitura</TooltipContent>',
    );
    expect(output).toContain('<Button variant="outline">Compartilhar</Button>');
  });

  it('a janela do grupo publica os dois valores no mesmo Provider', () => {
    const output = tooltipGroupWaitSource();
    expect(output).toContain('<TooltipProvider :delay-duration="3000" :skip-delay-duration="5000">');
    // Dois gatilhos e um Provider só: a janela é do GRUPO, e um gatilho sozinho
    // não teria vizinho para abrir sem esperar.
    expect(output.match(/<Tooltip>/g)).toHaveLength(2);
    expect(output.match(/<TooltipProvider/g)).toHaveLength(1);
    expect(output).toContain(`import { Kbd } from '@/components/ui/kbd'`);
    expect(output).toContain('<Kbd>C</Kbd>');
    expect(output).toContain('<Kbd>V</Kbd>');
  });
});
