import { describe, expect, it } from 'vitest';
import {
  radioGroupCartoesSource,
  radioGroupWithDescriptionSource,
  radioGroupDisabledSource,
  formRadioGroupSource,
  radioGroupFieldsetSource,
  radioGroupHorizontalSource,
  radioGroupInvalidoSource,
  radioGroupItemDisabledSource,
  radioGroupCheckedSource,
  radioGroupDefaultSource,
  radioGroupPagamentoSource,
  radioGroupSource,
  radioGroupVerticalSource,
} from './radio-group.source';

describe('radioGroupSource', () => {
  it('sem args, entrega a forma canônica do grupo nomeado', () => {
    expect(radioGroupSource()).toBe(
      `<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
</script>

<template>
  <RadioGroup aria-label="Forma de pagamento">
    <div class="nds-cluster" data-spacing="sm">
      <RadioGroupItem value="cartao" id="pagamento-cartao" />
      <Label for="pagamento-cartao">Cartão de crédito</Label>
    </div>
    <div class="nds-cluster" data-spacing="sm">
      <RadioGroupItem value="pix" id="pagamento-pix" />
      <Label for="pagamento-pix">Pix</Label>
    </div>
    <div class="nds-cluster" data-spacing="sm">
      <RadioGroupItem value="boleto" id="pagamento-boleto" />
      <Label for="pagamento-boleto">Boleto bancário</Label>
    </div>
  </RadioGroup>
</template>`,
    );
  });

  it('os controls que descrevem a raiz viram atributos da raiz', () => {
    const saida = radioGroupSource('', {
      args: { defaultValue: 'pix', disabled: true, orientation: 'horizontal', name: 'payment' },
    });
    expect(saida).toContain('default-value="pix"');
    expect(saida).toContain('orientation="horizontal"');
    expect(saida).toContain('name="payment"');
    expect(saida).toContain('disabled');
  });

  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const saida = radioGroupSource('', {
      args: { defaultValue: '', disabled: false, orientation: 'vertical' },
    });
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('default-value=');
    expect(saida).not.toContain('disabled');
  });

  // O `:key="String(args.defaultValue)"` do render existe só para remontar o
  // componente quando o control muda: é andaime do Storybook, não do exemplo.
  it('não leva o truque de remontagem da story', () => {
    expect(radioGroupSource('', { args: { defaultValue: 'pix' } })).not.toContain(':key=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = radioGroupSource('', {
      args: { name: (() => {}) as never, defaultValue: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('name=');
    expect(saida).not.toContain('default-value=');
  });

  it('cada rótulo aponta para o id do seu item — é dele que sai o nome acessível', () => {
    const saida = radioGroupSource();
    const items = [...saida.matchAll(/<RadioGroupItem value="[^"]+" id="([^"]+)"/g)].map((m) => m[1]);
    const rotulos = [...saida.matchAll(/<Label for="([^"]+)">/g)].map((m) => m[1]);
    expect(items).toEqual(rotulos);
    expect(new Set(items).size).toBe(items.length);
  });
});

describe('transforms das stories de variante', () => {
  it('a vertical é a canônica, sem atributo de eixo', () => {
    expect(radioGroupVerticalSource()).not.toContain('orientation=');
  });

  it('a horizontal troca o eixo e o conjunto de opções', () => {
    const saida = radioGroupHorizontalSource();
    expect(saida).toContain('<RadioGroup orientation="horizontal" aria-label="Forma de entrega">');
    expect(saida).toContain('Retirar na loja');
    expect(saida).not.toContain('Boleto bancário');
  });

  it('a descrição fica fora do rótulo e chega ao item por aria-describedby', () => {
    const saida = radioGroupWithDescriptionSource();
    expect(saida).toContain('aria-describedby="pagamento-pix-desc"');
    expect(saida).toContain('<p id="pagamento-pix-desc" class="nds-text-caption nds-text-muted-foreground">');
    // Dentro do <Label> a descrição entraria no nome acessível do rádio.
    expect(saida).not.toMatch(/<Label[^>]*>[^<]*Pagamento instantâneo/);
  });
});

describe('transforms das stories de estado', () => {
  it('o padrão não marca nada', () => {
    const saida = radioGroupDefaultSource();
    expect(saida).not.toContain('default-value');
    expect(saida).not.toContain('Boleto bancário');
  });

  it('o marcado sai de um valor inicial que casa com o value de um item', () => {
    const saida = radioGroupCheckedSource();
    expect(saida).toContain('<RadioGroup default-value="pix" aria-label="Forma de pagamento">');
    expect(saida).toContain('<RadioGroupItem value="pix"');
    // Não há atributo de "marcado" no item: quem marca é a raiz.
    expect(saida).not.toContain('checked');
  });

  it('o bloqueio do grupo mora na raiz e o do item mora no item', () => {
    expect(radioGroupDisabledSource()).toContain(
      '<RadioGroup disabled aria-label="Forma de pagamento">',
    );
    const item = radioGroupItemDisabledSource();
    expect(item).not.toContain('<RadioGroup disabled');
    expect(item).toContain('<RadioGroupItem value="pix" id="pagamento-pix" disabled />');
    // A opção apagada precisa dizer por que está apagada.
    expect(item).toContain('Pix (indisponível)');
  });

  it('o inválido marca raiz e itens e amarra a mensagem por id', () => {
    const saida = radioGroupInvalidoSource();
    expect(saida).toContain('aria-describedby="pagamento-erro"');
    expect(saida).toContain('<p id="pagamento-erro" class="nds-text-body nds-text-destructive">');
    expect([...saida.matchAll(/aria-invalid="true"/g)]).toHaveLength(3);
    // A cor sozinha não é o aviso: o texto do erro é.
    expect(saida).toContain('Selecione uma forma de pagamento para continuar.');
  });
});

describe('transforms das stories de composição', () => {
  it('o padrão de pagamento é o grupo canônico completo', () => {
    expect(radioGroupPagamentoSource()).toBe(radioGroupVerticalSource());
  });

  it('o fieldset traz o título visível e o grupo continua se nomeando', () => {
    const saida = radioGroupFieldsetSource();
    expect(saida).toContain('<legend class="nds-text-body nds-font-semibold nds-px-1">Forma de entrega</legend>');
    // O grupo de rádios é elemento separado do fieldset: sem nome próprio ele
    // seria anunciado sem assunto.
    expect(saida).toContain('aria-label="Forma de entrega"');
  });

  it('no formulário o grupo é obrigatório e o envio é interceptado', () => {
    const saida = formRadioGroupSource();
    expect(saida).toContain('@submit.prevent');
    expect(saida).toContain('required');
    expect(saida).toContain(`import { Button } from '@/components/ui/button'`);
    expect(saida).toContain('<Button type="submit" class="nds-w-full">Finalizar pedido</Button>');
  });

  it('no cartão o rótulo envolve o item, e não há Label ao lado', () => {
    const saida = radioGroupCartoesSource();
    expect(saida).toContain('<label for="plano-pro" class="nds-radio-card nds-cluster"');
    expect(saida).not.toContain('<Label');
    expect(saida).not.toContain(`from '@/components/ui/label'`);
    // O destaque do escolhido sai do estado do rádio de dentro (`:has`), nunca
    // de uma classe trocada à mão.
    expect(saida).not.toContain('nds-radio-card-selected');
  });
});

describe('largura de canvas não entra no snippet', () => {
  it('nenhuma transform leva style inline com valor de design', () => {
    const all = [
      radioGroupSource(),
      radioGroupVerticalSource(),
      radioGroupHorizontalSource(),
      radioGroupWithDescriptionSource(),
      radioGroupDefaultSource(),
      radioGroupCheckedSource(),
      radioGroupDisabledSource(),
      radioGroupItemDisabledSource(),
      radioGroupInvalidoSource(),
      radioGroupPagamentoSource(),
      radioGroupFieldsetSource(),
      formRadioGroupSource(),
      radioGroupCartoesSource(),
    ];
    for (const saida of all) expect(saida).not.toContain('style=');
  });
});
