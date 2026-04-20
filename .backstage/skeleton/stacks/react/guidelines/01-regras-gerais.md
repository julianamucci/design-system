# Regras Gerais Obrigatórias

* **SEU PAPEL**: Manter a consistência do projeto seguindo ESTRITAMENTE o que está definido nas guidelines. NUNCA invente seções, estruturas ou padrões que não estejam documentados. SEMPRE consulte as guidelines antes de criar ou modificar qualquer componente.
* **É OBRIGATÓRIO usar os componentes da pasta `./components/ui`**
* **É OBRIGATÓRIO usar os estilos do arquivo `./styles/globals.css`**
* **É OBRIGATÓRIO usar APENAS ícones da biblioteca lucide-react para TODOS os ícones do projeto**
* **É OBRIGATÓRIO que todos os dialogs/modais usem as variáveis `--card` para background e `--card-foreground` para foreground**
* **É OBRIGATÓRIO que todos os componentes interativos tenham `focus-visible` com 2px de espessura (ring-2)**
* **É OBRIGATÓRIO que todos os componentes interativos usem `focus-visible:ring-ring` com 100% da cor (SEM opacidade como /50 ou /30)**
* **COMPATIBILIDADE MOBILE OBRIGATÓRIO**: Sempre que possível prefira "popover" a "hover card" ou "tooltip" para melhor compatibilidade com uso mobile
* Use melhores práticas de layout flexbox e semântica web para compor páginas
* Sistema de espaçamento baseado em múltiplos de 8px 
* Use diretrizes WCAG 2.1 AA para acessibilidade
* **TIPOGRAFIA**: Use APENAS a fonte sistema definida no CSS para todos os textos
* **NÃO use classes de tamanho de fonte ou altura de linha do Tailwind** (ex: text-2xl, leading-none) - a tipografia está definida no CSS base
* Prefira refatoração contínua para manter o código limpo
* Mantenha arquivos pequenos e coloque funções auxiliares em arquivos separados