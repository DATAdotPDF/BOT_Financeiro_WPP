# 🤖 BaileysMod - BOT Financeiro no WhatsApp

**Assistente pessoal para controle de gastos mensais via WhatsApp, construído usando a biblioteca Baileys para Node.js.**

---

## 📋 Descrição do Projeto

O **BaileysMod BOT Financeiro** é um robô para WhatsApp, desenvolvido com Node.js e a biblioteca [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys), com objetivo de ajudar usuários a organizar e planejar seus gastos mensais de forma simples e prática, direto no WhatsApp.

Ele permite cadastrar contas fixas e variáveis, definir metas de economia, consultar planejamento do mês e muito mais, usando comandos no estilo chat.

---

## 💂️ Estrutura de Pastas

```
📎 /bot_financas
├── auth_info_baileys/
├── BAILEY BOT_BANNER.png
├── comandos.js
├── contas.json
├── index.js
├── node_modules/
├── package.json
└── package-lock.json
```

---

## 🧬 Funcionalidades do Bot

- 📌 Definir mês ativo para planejamento
- ✅ Adicionar conta fixa ou variável com nome, valor e data de vencimento
- ✏️ Atualizar valor ou data de contas existentes
- 🗑️ Remover contas cadastradas
- 🗕️ Ver vencimentos por semana do mês
- 📊 Mostrar totais do mês por categoria (fixas e variáveis)
- 🎯 Definir meta de economia mensal
- 📋 Visualizar planejamento do mês atual
- ⚠️ Bloqueio de loops automáticos em grupos
- 💬 Comandos com prefixo seguro (cmd. ou cmd )

---

## 💂️ Comandos Suportados

**✅ Definir mês ativo**

```
cmd.definir mês: 2025-07
```

**✅ Adicionar conta fixa**

```
cmd.adicionar conta fixa: Nome, Valor, Dia
```

*Exemplo:*

```
cmd.adicionar conta fixa: Luz, 300, 15
```

**💸 Adicionar conta variável**

```
cmd.adicionar conta variável: Nome, Valor, Dia
```

*Exemplo:*

```
cmd.adicionar conta variável: Uber, 120, 10
```

**🎯 Definir meta de economia**

```
cmd.definir meta: Valor
```

*Exemplo:*

```
cmd.definir meta: 300
```

**📊 Ver planejamento do mês**

```
cmd.ver planejamento
```

**🗕️ Ver vencimentos por semana**

```
cmd.ver vencimentos
```

**✏️ Atualizar conta (valor ou data)**

```
cmd.atualizar conta: Nome, NovoValor, NovoDia
```

*Exemplo:*

```
cmd.atualizar conta: Luz, 280, 12
```

**🗑️ Remover conta**

```
cmd.remover conta: Nome
```

*Exemplo:*

```
cmd.remover conta: Uber
```

**📈 Mostrar totais por categoria**

```
cmd.totais por categoria
```

**❓ Ajuda com comandos**

```
cmd.ajuda
```

---

## ⚙️ Tecnologias Utilizadas

- Node.js
- @whiskeysockets/baileys (API não oficial do WhatsApp)
- qrcode-terminal
- date-fns

---

## 🚀 Como Executar Localmente

1. Clone este repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Execute o bot:
   ```
   npm start
   ```
4. Escaneie o QR Code no terminal com o WhatsApp

---

## 📚 Links Úteis

- [Documentação Baileys](https://github.com/WhiskeySockets/Baileys)
- [Node.js](https://nodejs.org)
- [GitHub](https://github.com)

---

## 💡 Observações

- ⚠️ Este bot não é oficial nem suportado pelo WhatsApp Inc.
- ✔️ Desenvolvido para fins educacionais e pessoais.
- 👥 Suporte apenas a conversas privadas (evita spam em grupos).

