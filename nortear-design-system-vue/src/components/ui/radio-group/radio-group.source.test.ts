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
    const output = radioGroupSource('', {
      args: { defaultValue: 'pix', disabled: true, orientation: 'horizontal', name: 'payment' },
    });
    expect(output).toContain('default-value="pix"');
    expect(output).toContain('orientation="horizontal"');
    expect(output).toContain('name="payment"');
    expect(output).toContain('disabled');
  });

  it('não escreve os padrões do componente — repetir padrão ensina ruído', () => {
    const output = radioGroupSource('', {
      args: { defaultValue: '', disabled: false, orientation: 'vertical' },
    });
    expect(output).not.toContain('orientation=');
    expect(output).not.toContain('default-value=');
    expect(output).not.toContain('disabled');
  });

  // O `:key="String(args.defaultValue)"` do render existe só para remontar o
  // componente quando o control muda: é andaime do Storybook, não do exemplo.
  it('não leva o truque de remontagem da story', () => {
    expect(radioGroupSource('', { args: { defaultValue: 'pix' } })).not.toContain(':key=');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = radioGroupSource('', {
      args: { name: (() => {}) as never, defaultValue: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('name=');
    expect(output).not.toContain('default-value=');
  });

  it('cada rótulo aponta para o id do seu item — é dele que sai o nome acessível', () => {
    const output = radioGroupSource();
    const items = [...output.matchAll(/<RadioGroupItem value="[^"]+" id="([^"]+)"/g)].map((m) => m[1]);
    const rotulos = [...output.matchAll(/<Label for="([^"]+)">/g)].map((m) => m[1]);
    expect(items).toEqual(rotulos);
    expect(new Set(items).size).toBe(items.length);
  });
});

describe('transforms das stories de variante', () => {
  it('a vertical é a canônica, sem atributo de eixo', () => {
    expect(radioGroupVerticalSource()).not.toContain('orientation=');
  });

  it('a horizontal troca o eixo e o conjunto de opções', () => {
    const output = radioGroupHorizontalSource();
    expect(output).toContain('<RadioGroup orientation="horizontal" aria-label="Forma de entrega">');
    expect(output).toContain('Retirar na loja');
    expect(output).not.toContain('Boleto bancário');
  });

  it('a descrição fica fora do rótulo e chega ao item por aria-describedby', () => {
    const output = radioGroupWithDescriptionSource();
    expect(output).toContain('aria-describedby="pagamento-pix-desc"');
    expect(output).toContain('<p id="pagamento-pix-desc" class="nds-text-caption nds-text-muted-foreground">');
    // Dentro do <Label> a descrição entraria no nome acessível do rádio.
    expect(output).not.toMatch(/<Label[^>]*>[^<]*Pagamento instantâneo/);
  });
});

describe('transforms das stories de estado', () => {
  it('o padrão não marca nada', () => {
    const output = radioGroupDefaultSource();
    expect(output).not.toContain('default-value');
    expect(output).not.toContain('Boleto bancário');
  });

  it('o marcado sai de um valor inicial que casa com o value de um item', () => {
    const output = radioGroupCheckedSource();
    expect(output).toContain('<RadioGroup default-value="pix" aria-label="Forma de pagamento">');
    expect(output).toContain('<RadioGroupItem value="pix"');
    // Não há atributo de "marcado" no item: quem marca é a raiz.
    expect(output).not.toContain('checked');
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
    const output = radioGroupInvalidoSource();
    expect(output).toContain('aria-describedby="pagamento-erro"');
    expect(output).toContain('<p id="pagamento-erro" class="nds-text-body nds-text-destructive">');
    expect([...output.matchAll(/aria-invalid="true"/g)]).toHaveLength(3);
    // A cor sozinha não é o aviso: o texto do erro é.
    expect(output).toContain('Selecione uma forma de pagamento para continuar.');
  });
});

describe('transforms das stories de composição', () => {
  it('o padrão de pagamento é o grupo canônico completo', () => {
    expect(radioGroupPagamentoSource()).toBe(radioGroupVerticalSource());
  });

  it('o fieldset traz o título visível e o grupo continua se nomeando', () => {
    const output = radioGroupFieldsetSource();
    expect(output).toContain('<legend class="nds-text-body nds-font-semibold nds-px-1">Forma de entrega</legend>');
    // O grupo de rádios é elemento separado do fieldset: sem nome próprio ele
    // seria anunciado sem assunto.
    expect(output).toContain('aria-label="Forma de entrega"');
  });

  it('no formulário o grupo é obrigatório e o envio é interceptado', () => {
    const output = formRadioGroupSource();
    expect(output).toContain('@submit.prevent');
    expect(output).toContain('required');
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
    expect(output).toContain('<Button type="submit" class="nds-w-full">Finalizar pedido</Button>');
  });

  it('no cartão o rótulo envolve o item, e não há Label ao lado', () => {
    const output = radioGroupCartoesSource();
    expect(output).toContain('<label for="plano-pro" class="nds-radio-card nds-cluster"');
    expect(output).not.toContain('<Label');
    expect(output).not.toContain(`from '@/components/ui/label'`);
    // O destaque do escolhido sai do estado do rádio de dentro (`:has`), nunca
    // de uma classe trocada à mão.
    expect(output).not.toContain('nds-radio-card-selected');
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
    for (const output of all) expect(output).not.toContain('style=');
  });
});
