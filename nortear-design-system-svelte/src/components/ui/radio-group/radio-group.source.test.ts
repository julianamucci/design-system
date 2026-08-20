import { describe, expect, it } from 'vitest';
import {
  radioGroupComDescricaoSource,
  radioGroupDesabilitadoSource,
  radioGroupEntregaComDescricaoSource,
  radioGroupEntregaHorizontalSource,
  radioGroupFocoSource,
  radioGroupHorizontalSource,
  radioGroupInvalidoSource,
  radioGroupItemDesabilitadoSource,
  radioGroupPadraoSource,
  radioGroupSelecionadoSource,
  radioGroupSource,
  radioGroupVerticalSource,
} from './radio-group.source';

describe('radioGroupSource', () => {
  it('sem args, entrega o grupo empilhado com um rótulo por opção', () => {
    expect(radioGroupSource()).toBe(
      `<script lang="ts">
  import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
  import { Label } from "@/components/ui/label";

  let forma = $state("");
</script>

<RadioGroup bind:value={forma} aria-label="Forma de pagamento">
  <div class="nds-cluster" data-spacing="sm">
    <RadioGroupItem value="cartao" id="cartao" />
    <Label for="cartao">Cartão de crédito</Label>
  </div>
  <div class="nds-cluster" data-spacing="sm">
    <RadioGroupItem value="pix" id="pix" />
    <Label for="pix">Pix</Label>
  </div>
  <div class="nds-cluster" data-spacing="sm">
    <RadioGroupItem value="boleto" id="boleto" />
    <Label for="boleto">Boleto bancário</Label>
  </div>
</RadioGroup>`,
    );
  });

  it('o valor escolhido entra como estado inicial do bind', () => {
    expect(radioGroupSource('', { args: { value: 'pix' } })).toContain('let forma = $state("pix");');
  });

  it('só escreve name quando o grupo participa de um formulário', () => {
    expect(radioGroupSource()).not.toContain('name=');
    expect(radioGroupSource('', { args: { name: 'payment' } })).toContain('name="payment"');
  });

  it('o grupo desabilitado bloqueia todas as opções de uma vez', () => {
    expect(radioGroupSource('', { args: { disabled: true } })).toContain('disabled');
  });

  it('a orientação horizontal escreve a prop e o atributo ARIA', () => {
    // A prop governa as setas e o layout; o atributo anuncia a direção, que num
    // radiogroup o leitor supõe empilhada.
    const saida = radioGroupSource('', { args: { orientation: 'horizontal' } });
    expect(saida).toContain('orientation="horizontal"');
    expect(saida).toContain('aria-orientation="horizontal"');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a variante vertical não escreve orientação nenhuma — é o padrão', () => {
    const saida = radioGroupVerticalSource();
    expect(saida).not.toContain('orientation');
    expect(saida.match(/<RadioGroupItem /g)).toHaveLength(3);
  });

  it('a variante horizontal põe as três opções curtas na mesma linha', () => {
    const saida = radioGroupHorizontalSource();
    expect(saida).toContain('aria-orientation="horizontal"');
    expect(saida).toContain('<Label for="pickup">Retirar</Label>');
  });

  it('a variante com descrição liga cada texto auxiliar ao seu item', () => {
    const saida = radioGroupComDescricaoSource();
    expect(saida).toContain('aria-describedby="cartao-desc"');
    expect(saida).toContain('<p id="cartao-desc" class="nds-text-caption nds-text-muted-foreground">');
    // Alinha o rádio com a primeira linha do rótulo, não com o bloco inteiro.
    expect(saida).toContain('class="nds-mt-1"');
  });

  it('o estado padrão nasce sem escolha, e o foco não muda a marcação', () => {
    expect(radioGroupPadraoSource()).toContain('let forma = $state("");');
    expect(radioGroupFocoSource()).toBe(radioGroupPadraoSource());
  });

  it('o estado escolhido parte da opção marcada', () => {
    expect(radioGroupSelecionadoSource()).toContain('let forma = $state("pix");');
  });

  it('o grupo desabilitado leva a prop na raiz, não em cada item', () => {
    const saida = radioGroupDesabilitadoSource();
    expect(saida).toContain('<RadioGroup bind:value={forma} disabled aria-label=');
    expect(saida).not.toContain('<RadioGroupItem value="pix" id="pix" disabled />');
  });

  it('o item indisponível carrega a prop sozinho', () => {
    const saida = radioGroupItemDesabilitadoSource();
    expect(saida).toContain('<RadioGroupItem value="pix" id="pix" disabled />');
    expect(saida).toContain('Pix (indisponível)');
  });

  it('o estado inválido marca o grupo, e é dele que sai a borda de cada item', () => {
    expect(radioGroupInvalidoSource()).toContain('aria-invalid="true"');
  });

  it('a composição de entrega horizontal traz o prazo no próprio rótulo', () => {
    const saida = radioGroupEntregaHorizontalSource();
    expect(saida).toContain('aria-orientation="horizontal"');
    expect(saida).toContain('Expressa (1 dia)');
  });

  it('a composição de entrega com descrição move o prazo para o texto auxiliar', () => {
    const saida = radioGroupEntregaComDescricaoSource();
    expect(saida).toContain('aria-describedby="standard-desc"');
    expect(saida).toContain('Entrega em até 5 dias úteis.');
  });
});
