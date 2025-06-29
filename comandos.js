import fs from 'fs';

const CAMINHO_ARQUIVO = './contas.json';

function carregarDados() {
  if (fs.existsSync(CAMINHO_ARQUIVO)) {
    return JSON.parse(fs.readFileSync(CAMINHO_ARQUIVO));
  }
  return { metaEconomia: 0, mesAtivo: null, meses: {} };
}

function salvarDados(dados) {
  fs.writeFileSync(CAMINHO_ARQUIVO, JSON.stringify(dados, null, 2));
}

function getSemana(dia) {
  if (dia >= 1 && dia <= 10) return '01 a 10';
  if (dia >= 11 && dia <= 16) return '11 a 16';
  if (dia >= 17 && dia <= 23) return '17 a 23';
  return '24 a 31';
}

export async function processarComando(sock, jid, texto, isGroup) {
  let textoLimpo = texto
    .replace(/\u200E/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log(`📩 Texto recebido normalizado: "${textoLimpo}"`);

  const prefixRegex = /^cmd[.\s]/i;
  if (!prefixRegex.test(textoLimpo)) {
    console.log(`⚠️ Ignorando mensagem sem prefixo cmd: "${textoLimpo}"`);
    return;
  }

  let textoSemPrefixo = textoLimpo
    .replace(/^cmd[.\s]+/i, '')
    .trim();

  if (!textoSemPrefixo) {
    await sock.sendMessage(jid, { text: `⚠️ Comando vazio após o prefixo. Use "cmd.ajuda" para ver os comandos disponíveis.` });
    return;
  }

  const [comandoParte, dadosParte = ''] = textoSemPrefixo.split(':').map(p => p.trim());
  const comando = comandoParte.toLowerCase();
  const args = dadosParte ? dadosParte.split(',').map(p => p.trim()) : [];

  console.log(`✅ Comando detectado: "${comando}"`);
  console.log(`✅ Args detectados:`, args);

  const dadosArquivo = carregarDados();

  // --------------------------
  if (comando === 'definir mês') {
    if (args.length < 1) {
      await sock.sendMessage(jid, { text: `⚠️ Formato inválido. Use:\ncmd.definir mês: YYYY-MM` });
      return;
    }
    const novoMes = args[0];
    dadosArquivo.mesAtivo = novoMes;
    if (!dadosArquivo.meses[novoMes]) {
      dadosArquivo.meses[novoMes] = { fixas: [], variaveis: [] };
    }
    salvarDados(dadosArquivo);
    await sock.sendMessage(jid, { text: `✅ Mês ativo definido para ${novoMes}` });
    return;
  }

  const mesAtivo = dadosArquivo.mesAtivo;
  if (!mesAtivo) {
    await sock.sendMessage(jid, { text: `⚠️ Nenhum mês ativo definido. Use:\ncmd.definir mês: YYYY-MM` });
    return;
  }

  if (!dadosArquivo.meses[mesAtivo]) {
    dadosArquivo.meses[mesAtivo] = { fixas: [], variaveis: [] };
    salvarDados(dadosArquivo);
  }

  // ===========================
  if (comando === 'adicionar conta fixa') {
    if (args.length < 3) {
      await sock.sendMessage(jid, { text: `⚠️ Formato inválido. Use:\ncmd.adicionar conta fixa: Nome, Valor, Dia` });
      return;
    }
    const [nome, valor, dia] = args;
    dadosArquivo.meses[mesAtivo].fixas.push({ nome, valor: Number(valor), dia: Number(dia) });
    salvarDados(dadosArquivo);
    await sock.sendMessage(jid, { text: `✅ Conta fixa adicionada em ${mesAtivo}:\n${nome} - R$ ${valor} (dia ${dia})` });
  }

  else if (comando === 'adicionar conta variável') {
    if (args.length < 3) {
      await sock.sendMessage(jid, { text: `⚠️ Formato inválido. Use:\ncmd.adicionar conta variável: Nome, Valor, Dia` });
      return;
    }
    const [nome, valor, dia] = args;
    dadosArquivo.meses[mesAtivo].variaveis.push({ nome, valor: Number(valor), dia: Number(dia) });
    salvarDados(dadosArquivo);
    await sock.sendMessage(jid, { text: `✅ Conta variável adicionada em ${mesAtivo}:\n${nome} - R$ ${valor} (dia ${dia})` });
  }

  else if (comando === 'ver planejamento') {
    let msg = `====================\n`;
    msg += `Mês ativo: ${mesAtivo}\n`;
    msg += `====================\n\n`;

    msg += `✅ Fixas:\n`;
    if (dadosArquivo.meses[mesAtivo].fixas.length === 0) msg += '- Nenhuma\n';
    else dadosArquivo.meses[mesAtivo].fixas.forEach(c => {
      msg += `- ${c.nome}: R$ ${c.valor} (dia ${c.dia})\n`;
    });

    msg += `\n====================\n`;
    msg += `💸 Variáveis:\n`;
    if (dadosArquivo.meses[mesAtivo].variaveis.length === 0) msg += '- Nenhuma\n';
    else dadosArquivo.meses[mesAtivo].variaveis.forEach(c => {
      msg += `- ${c.nome}: R$ ${c.valor} (dia ${c.dia})\n`;
    });

    const totalFixas = dadosArquivo.meses[mesAtivo].fixas.reduce((s, c) => s + c.valor, 0);
    const totalVariaveis = dadosArquivo.meses[mesAtivo].variaveis.reduce((s, c) => s + c.valor, 0);
    const totalGeral = totalFixas + totalVariaveis;

    msg += `\n====================\n`;
    msg += `📊 Total geral previsto: R$ ${totalGeral}\n`;
    msg += `🎯 Meta de economia: R$ ${dadosArquivo.metaEconomia}\n`;

    await sock.sendMessage(jid, { text: msg });
  }

  else if (comando === 'ver vencimentos') {
    let msg = `📅 Vencimentos do mês ${mesAtivo}\n`;
    const contas = [...dadosArquivo.meses[mesAtivo].fixas, ...dadosArquivo.meses[mesAtivo].variaveis];

    const porSemana = {};

    contas.forEach(c => {
      const semana = getSemana(c.dia);
      if (!porSemana[semana]) porSemana[semana] = [];
      porSemana[semana].push(`- ${c.nome} (dia ${c.dia}): R$ ${c.valor}`);
    });

    Object.keys(porSemana).sort().forEach(semana => {
      msg += `\nSemana ${semana}:\n`;
      porSemana[semana].forEach(item => {
        msg += item + '\n';
      });
    });

    await sock.sendMessage(jid, { text: msg });
  }

  else if (comando === 'atualizar conta') {
    if (args.length < 3) {
      await sock.sendMessage(jid, { text: `⚠️ Use:\ncmd.atualizar conta: Nome, NovoValor, NovoDia` });
      return;
    }
    const [nome, novoValor, novoDia] = args;
    let encontrada = false;

    ['fixas', 'variaveis'].forEach(tipo => {
      dadosArquivo.meses[mesAtivo][tipo] = dadosArquivo.meses[mesAtivo][tipo].map(c => {
        if (c.nome.toLowerCase() === nome.toLowerCase()) {
          encontrada = true;
          return { ...c, valor: Number(novoValor), dia: Number(novoDia) };
        }
        return c;
      });
    });

    if (encontrada) {
      salvarDados(dadosArquivo);
      await sock.sendMessage(jid, { text: `✅ Conta atualizada: ${nome} - R$ ${novoValor} (dia ${novoDia})` });
    } else {
      await sock.sendMessage(jid, { text: `⚠️ Conta não encontrada com nome: ${nome}` });
    }
  }

  else if (comando === 'remover conta') {
    if (args.length < 1) {
      await sock.sendMessage(jid, { text: `⚠️ Use:\ncmd.remover conta: Nome` });
      return;
    }
    const nome = args[0];
    let removida = false;

    ['fixas', 'variaveis'].forEach(tipo => {
      const antes = dadosArquivo.meses[mesAtivo][tipo].length;
      dadosArquivo.meses[mesAtivo][tipo] = dadosArquivo.meses[mesAtivo][tipo].filter(c => c.nome.toLowerCase() !== nome.toLowerCase());
      if (dadosArquivo.meses[mesAtivo][tipo].length < antes) removida = true;
    });

    if (removida) {
      salvarDados(dadosArquivo);
      await sock.sendMessage(jid, { text: `✅ Conta removida: ${nome}` });
    } else {
      await sock.sendMessage(jid, { text: `⚠️ Conta não encontrada com nome: ${nome}` });
    }
  }

  else if (comando === 'mostrar totais') {
    const totalFixas = dadosArquivo.meses[mesAtivo].fixas.reduce((s, c) => s + c.valor, 0);
    const totalVariaveis = dadosArquivo.meses[mesAtivo].variaveis.reduce((s, c) => s + c.valor, 0);
    const totalGeral = totalFixas + totalVariaveis;

    let msg = `📊 Totais do mês ${mesAtivo}\n`;
    msg += `✅ Fixas: R$ ${totalFixas}\n`;
    msg += `💸 Variáveis: R$ ${totalVariaveis}\n`;
    msg += `====================\n`;
    msg += `📈 Total geral: R$ ${totalGeral}\n`;
    msg += `🎯 Meta de economia: R$ ${dadosArquivo.metaEconomia}\n`;

    await sock.sendMessage(jid, { text: msg });
  }

  else if (comando === 'definir meta') {
    if (args.length < 1) {
      await sock.sendMessage(jid, { text: `⚠️ Use:\ncmd.definir meta: Valor` });
      return;
    }
    const valor = Number(args[0]);
    dadosArquivo.metaEconomia = valor;
    salvarDados(dadosArquivo);
    await sock.sendMessage(jid, { text: `✅ Meta de economia atualizada para R$ ${valor}` });
  }

  else if (comando === 'ajuda') {
    let ajudaMsg = `====================\n`;
    ajudaMsg += `🟢 *COMO USAR O BOT*\n`;
    ajudaMsg += `✅ Sempre comece com: cmd. ou cmd \n`;
    ajudaMsg += `Exemplo: cmd.adicionar conta fixa: Luz, 300, 15\n`;
    ajudaMsg += `====================\n\n`;

    ajudaMsg += `📌 *COMANDOS DISPONÍVEIS*\n\n`;
    ajudaMsg += `✅ Definir mês ativo:\ncmd.definir mês: YYYY-MM\n\n`;
    ajudaMsg += `✅ Adicionar conta fixa:\ncmd.adicionar conta fixa: Nome, Valor, Dia\n\n`;
    ajudaMsg += `💸 Adicionar conta variável:\ncmd.adicionar conta variável: Nome, Valor, Dia\n\n`;
    ajudaMsg += `🎯 Definir meta de economia:\ncmd.definir meta: Valor\n\n`;
    ajudaMsg += `📊 Ver planejamento do mês:\ncmd.ver planejamento\n\n`;
    ajudaMsg += `📅 Ver vencimentos por semana:\ncmd.ver vencimentos\n\n`;
    ajudaMsg += `✏️ Atualizar conta:\ncmd.atualizar conta: Nome, NovoValor, NovoDia\n\n`;
    ajudaMsg += `🗑️ Remover conta:\ncmd.remover conta: Nome\n\n`;
    ajudaMsg += `📈 Mostrar totais do mês:\ncmd.mostrar totais\n\n`;

    ajudaMsg += `====================\nℹ️ Use sempre o prefixo 'cmd.' ou 'cmd ' para evitar erros!\n`;

    await sock.sendMessage(jid, { text: ajudaMsg });
  }

  else {
    await sock.sendMessage(jid, { text: `❓ Desculpe, não entendi. Use "cmd.ajuda" para ver os comandos disponíveis.` });
  }

  console.log(`✅ Mensagem processada${isGroup ? ' no grupo' : ' no privado'}: ${jid}`);
}
