import type { Meta, StoryObj } from '@storybook/vue3';
import { Button } from './index';

/**
 * Botão principal do design system, utilizado para ações do usuário.
 * Construído sobre o Primitive da Reka UI para máxima acessibilidade.
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Botão principal do design system, utilizado para disparar ações do usuário e navegação.

**Categoria**: Interaction  
**Complexidade**: Simples

---

## 1. Visão Geral

### 1.1 Anatomia
1. **Label**: Texto claro que indica a ação.
2. **Ícone (Opcional)**: Auxilia na identificação visual rápida.

### 1.2 Quando e Como Usar
- **Use quando**: A ação principal da página precisa de destaque (default), em formulários, ou para disparar modais.
- **Não use quando**: A ação for puramente navegacional (use Link) ou houver muitas ações primárias concorrendo na mesma tela.

### 1.3 UX Writing
- **Label**: Use verbo no infinitivo com no máximo 3 palavras (ex: *Salvar Alterações*).
- **Evitar**: Palavras genéricas como *Clique aqui*, *Ok* ou *Sim*.

## 2. Do & Don't
- ✅ **Faça:** Diferencie claramente a ação principal das secundárias usando variantes.
- ❌ **Não faça:** Evite colocar vários botões primários lado a lado.

## 3. Qualidade & Testes

### 3.1 Acessibilidade
- Navegação completa via \`Tab\` garantida.
- Foco visível (\`focus-visible\`) com alto contraste integrado ao Tailwind.
- Suporte a \`aria-label\` (obrigatório para botões apenas com ícone).

### 3.2 Critérios de Teste
- O evento \`@click\` **não** pode ser emitido se o botão possuir a prop \`disabled\`.
- O visual do componente não deve quebrar ao alternar para o *Dark Mode*.
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Define o estilo visual do botão, alterando cores e bordas.',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Define as dimensões espaciais e o preenchimento do botão.',
    },
    as: {
      control: 'text',
      description: 'Determina qual tag HTML ou componente será renderizado como raiz.',
    },
    asChild: {
      control: 'boolean',
      description: 'Se verdadeiro, o botão delegará a renderização ao seu único filho direto (Radix Slot).',
    },
    default: {
      control: 'text',
      description: 'Conteúdo principal do botão (texto ou outros componentes).',
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    default: 'Button',
    asChild: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: '<Button v-bind="args">{{ args.default }}</Button>',
  }),
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    default: 'Destructive Action',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    default: 'Outline Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    default: 'Secondary Action',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    default: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    default: 'Link Style',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    default: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    default: 'Large',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    default: '🔥',
  },
};
