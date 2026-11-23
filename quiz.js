/* O lide · lógica do site (sorteio, rascunho, envio e cópia). Sem dependências. */
(function () {
  "use strict";
  var CHAVE = "olide.v1";
  var LETRAS = "abcdefghij";
  var ORDEM_EIXOS = ["pauta", "apuracao", "texto", "edicao"];
  var app = document.getElementById("app");
  var S = carregar();
  var enviando = false;
  var timerSalvar = null;

  /* ---------- estado ---------- */
  function carregar() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { s = null; }
    if (!s || typeof s !== "object") s = {};
    if (!s.vistos || typeof s.vistos !== "object") s.vistos = {};
    if (!Array.isArray(s.envios)) s.envios = [];
    if (!s.contador) s.contador = 0;
    if (!s.aluno) s.aluno = null;
    if (!s.rodada) s.rodada = null;
    return s;
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { /* navegador sem armazenamento: segue em memória */ } }
  function salvarDepois() { clearTimeout(timerSalvar); timerSalvar = setTimeout(salvar, 400); }

  /* ---------- utilidades ---------- */
  function agora() { return new Date().toISOString(); }
  function z(n) { return (n < 10 ? "0" : "") + n; }
  function dataBR(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) return "";
    return z(d.getDate()) + "/" + z(d.getMonth() + 1) + "/" + d.getFullYear() + " às " + z(d.getHours()) + "h" + z(d.getMinutes());
  }
  function prazoEncerrado() { return Date.now() > new Date(CONFIG.fimEnvio).getTime(); }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }
  function palavras(t) { var m = String(t || "").trim().match(/\S+/g); return m ? m.length : 0; }
  function porId(id) { for (var i = 0; i < BANCO.length; i++) if (BANCO[i].id === id) return BANCO[i]; return null; }
  function novoId() { return "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function embaralha(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function $(id) { return document.getElementById(id); }
  function totalVistas() { var n = 0; for (var k in S.vistos) if (Array.isArray(S.vistos[k])) n += S.vistos[k].length; return n; }
  function temTexto(r) { if (!r || !r.respostas) return false; for (var k in r.respostas) if (String(r.respostas[k] || "").trim()) return true; return false; }

  /* ---------- sorteio: uma pergunta de cada eixo, sem repetir caso na rodada, primeiro as nunca vistas ---------- */
  function sorteia() {
    var escolhidas = [], casos = {};
    ORDEM_EIXOS.forEach(function (eixo) {
      var doEixo = BANCO.filter(function (q) { return q.eixo === eixo; });
      if (!doEixo.length) return;
      var vistos = S.vistos[eixo] || [];
      var livres = doEixo.filter(function (q) { return vistos.indexOf(q.id) < 0 && !casos[q.casoId]; });
      if (!livres.length) { S.vistos[eixo] = []; livres = doEixo.filter(function (q) { return !casos[q.casoId]; }); }
      if (!livres.length) livres = doEixo;
      var q = livres[Math.floor(Math.random() * livres.length)];
      escolhidas.push(q.id); casos[q.casoId] = true;
      (S.vistos[eixo] = S.vistos[eixo] || []).push(q.id);
    });
    embaralha(escolhidas);
    S.contador += 1;
    S.rodada = { id: novoId(), numero: S.contador, criada: agora(), ids: escolhidas.slice(0, CONFIG.perguntasPorRodada || 4), respostas: {}, enviada: false };
    salvar();
  }

  /* ---------- barra ---------- */
  function desenhaBarra() {
    $("kicker").textContent = CONFIG.turma;
    $("linhaProva").textContent = "Prova: " + CONFIG.dataProva + " · vale " + CONFIG.valorProva;
    $("chipPrazo").textContent = prazoEncerrado() ? "Envio encerrado" : "Envio até " + CONFIG.fimTexto.replace(/,? às /, ", ");
    var tem = !!S.aluno;
    $("chipAluno").classList.toggle("oculto", !tem);
    $("btMinhas").classList.toggle("oculto", !tem);
    $("btSair").classList.toggle("oculto", !tem);
    if (tem) $("chipAluno").textContent = S.aluno.nome.split(/\s+/)[0];
  }

  function avisoHTML() {
    var n = CONFIG.perguntasPorRodada || 4;
    var fim = prazoEncerrado()
      ? "<p><b>O envio fechou</b> em " + esc(CONFIG.fimTexto) + ". Você ainda pode treinar, mas as respostas não vão mais para o professor.</p>"
      : "<p>Responda às " + n + " perguntas e envie: o professor lê e devolve um comentário por e-mail. Quando você reabrir o site, virão perguntas novas. Pode fazer quantas rodadas quiser até " + esc(CONFIG.fimTexto) + ".</p>";
    return "<div class=\"aviso\">" +
      "<p><b>Não vale nota.</b> É preparação para a prova escrita individual de " + esc(CONFIG.dataProva) + ", que vale " + esc(CONFIG.valorProva) + " pontos.</p>" +
      "<p>A cada rodada, o site sorteia " + n + " perguntas dissertativas, uma de cada eixo da prova: pauta e ângulo; apuração e contraditório; texto, com lide e estrutura; e edição, página, foto e infografia. Elas saem de um banco de " + BANCO.length + " perguntas, todas feitas a partir de casos reais publicados nos jornais.</p>" +
      fim + "</div>";
  }

  /* ---------- telas ---------- */
  function telaEntrada() {
    desenhaBarra();
    app.innerHTML = avisoHTML() +
      "<section class=\"box\">" +
      "<h2 class=\"sans\" style=\"margin-top:0\">Antes de começar</h2>" +
      "<label class=\"l\" for=\"nome\">Seu nome completo</label>" +
      "<input id=\"nome\" class=\"campo\" autocomplete=\"name\" maxlength=\"120\">" +
      "<label class=\"l\" for=\"email\">Seu e-mail (de preferência o da PUC)</label>" +
      "<input id=\"email\" class=\"campo\" type=\"email\" autocomplete=\"email\" maxlength=\"160\">" +
      "<p class=\"nota\">O nome e o e-mail ficam guardados só neste navegador e seguem com as respostas para o professor, que devolve o comentário nesse e-mail.</p>" +
      "<div class=\"erro\" id=\"erro\"></div>" +
      "<div class=\"acoes\"><button type=\"button\" class=\"btn\" id=\"comecar\">Sortear as minhas perguntas</button></div>" +
      "</section>";
    if (S.ultimoAluno) { $("nome").value = S.ultimoAluno.nome || ""; $("email").value = S.ultimoAluno.email || ""; }
    $("comecar").onclick = function () {
      var nome = $("nome").value.trim().replace(/\s+/g, " ");
      var email = $("email").value.trim().toLowerCase();
      if (nome.split(" ").length < 2 || nome.length < 5) { $("erro").textContent = "Escreva o nome completo, com sobrenome."; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $("erro").textContent = "Confira o e-mail: é nele que chega o comentário do professor."; return; }
      S.aluno = { nome: nome, email: email }; S.ultimoAluno = S.aluno;
      sorteia(); telaRodada();
    };
  }

  function telaRetomar() {
    desenhaBarra();
    var r = S.rodada;
    app.innerHTML = avisoHTML() +
      "<section class=\"box\">" +
      "<h2 class=\"sans\" style=\"margin-top:0\">Você tem uma rodada começada</h2>" +
      "<p>A rodada " + r.numero + ", sorteada em " + esc(dataBR(r.criada)) + ", ainda não foi enviada e tem texto escrito.</p>" +
      "<div class=\"acoes\"><button type=\"button\" class=\"btn\" id=\"continuar\">Continuar esta rodada</button>" +
      "<button type=\"button\" class=\"btn sec\" id=\"nova\">Descartar e sortear novas perguntas</button></div>" +
      "</section>";
    $("continuar").onclick = telaRodada;
    $("nova").onclick = function () {
      if (!window.confirm("As respostas desta rodada serão apagadas. Sortear novas perguntas?")) return;
      sorteia(); telaRodada();
    };
  }

  function questaoHTML(q, i, texto, total) {
    var h = "<article class=\"questao\" id=\"q-" + q.id + "\">" +
      "<div class=\"q-topo\"><span class=\"num\">Pergunta " + (i + 1) + " de " + total + "</span><span>" + esc(EIXOS[q.eixo]) + "</span></div>" +
      "<h2>" + esc(q.caso) + "</h2>" +
      "<p class=\"fonte\">Caso real · " + esc(q.fonte) + "</p>" +
      "<div class=\"contexto\">" + q.contexto.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
    if (q.fatos && q.fatos.length) {
      h += "<div class=\"fatos\"><h3>Os fatos</h3><ul>" + q.fatos.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul></div>";
    }
    h += "<div class=\"pede\"><h3>Responda</h3><ol>" + q.pergunta.map(function (p, j) {
      return "<li><b class=\"letra\">" + LETRAS[j] + ")</b>" + esc(p) + "</li>";
    }).join("") + "</ol></div>" +
      "<p class=\"base\"><b>Para revisar:</b> " + esc(q.base) + "</p>" +
      "<label class=\"l\" for=\"r-" + q.id + "\">Sua resposta (responda a cada item, começando por a), b), c)...)</label>" +
      "<textarea class=\"resp\" id=\"r-" + q.id + "\" data-id=\"" + q.id + "\" maxlength=\"" + (CONFIG.maxCaracteres || 10000) + "\" spellcheck=\"true\">" + esc(texto) + "</textarea>" +
      "<div class=\"cont\" id=\"c-" + q.id + "\"></div>" +
      "</article>";
    return h;
  }

  function telaRodada() {
    desenhaBarra();
    var r = S.rodada;
    if (!r || r.enviada) { sorteia(); r = S.rodada; }
    var total = r.ids.length;
    var h = avisoHTML() +
      "<p class=\"nota\" style=\"margin:-8px 0 18px\">Rodada " + r.numero + " · sorteada em " + esc(dataBR(r.criada)) + " · perguntas que você já viu: " + Math.min(totalVistas(), BANCO.length) + " de " + BANCO.length + "</p>";
    r.ids.forEach(function (id, i) { var q = porId(id); if (q) h += questaoHTML(q, i, r.respostas[id] || "", total); });
    h += "<section class=\"envio\" id=\"envio\">" +
      "<div id=\"faltam\"></div>" +
      "<div class=\"acoes\"><button type=\"button\" class=\"btn verm\" id=\"enviar\">Enviar as " + total + " respostas ao professor</button>" +
      "<button type=\"button\" class=\"btn sec\" id=\"trocar\">Descartar e sortear outras perguntas</button></div>" +
      "<p class=\"nota\">O rascunho fica salvo neste navegador enquanto você escreve.</p>" +
      "</section>";
    app.innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll("textarea.resp"), function (ta) {
      ta.addEventListener("input", function () {
        S.rodada.respostas[ta.getAttribute("data-id")] = ta.value;
        salvarDepois(); atualizaContadores();
      });
    });
    $("enviar").onclick = enviar;
    $("trocar").onclick = function () {
      if (temTexto(S.rodada) && !window.confirm("As respostas desta rodada serão apagadas. Sortear outras perguntas?")) return;
      sorteia(); telaRodada(); window.scrollTo(0, 0);
    };
    atualizaContadores();
  }

  function atualizaContadores() {
    var r = S.rodada; if (!r) return;
    var min = CONFIG.minPalavras || 60, faltam = [];
    r.ids.forEach(function (id, i) {
      var n = palavras(r.respostas[id]);
      var c = $("c-" + id);
      if (c) {
        c.className = "cont" + (n >= min ? " ok" : "");
        c.innerHTML = "<span>" + n + (n === 1 ? " palavra" : " palavras") + "</span><span>" + (n >= min ? "ok" : "mínimo de " + min) + "</span>";
      }
      if (n < min) faltam.push("pergunta " + (i + 1) + (n ? " (" + n + " de " + min + " palavras)" : " (em branco)"));
    });
    var bt = $("enviar"), info = $("faltam");
    if (!bt || !info) return;
    if (prazoEncerrado()) {
      bt.disabled = true;
      info.innerHTML = "<b>O envio fechou</b> em " + esc(CONFIG.fimTexto) + ". Você pode continuar escrevendo para treinar.";
    } else if (faltam.length) {
      bt.disabled = true;
      info.innerHTML = "Para enviar, faltam: " + esc(faltam.join("; ")) + ".";
    } else {
      bt.disabled = false;
      info.innerHTML = "<b>Pronto para enviar.</b> Releia antes: depois do envio, esta rodada fecha.";
    }
  }

  function enviar() {
    var r = S.rodada; if (!r || r.enviada || prazoEncerrado()) return;
    var min = CONFIG.minPalavras || 60;
    for (var i = 0; i < r.ids.length; i++) if (palavras(r.respostas[r.ids[i]]) < min) { atualizaContadores(); return; }
    if (!window.confirm("Enviar as " + r.ids.length + " respostas ao professor? Depois do envio, esta rodada fecha.")) return;
    var env = {
      envioId: r.id, rodada: r.numero, sorteadaEm: r.criada, enviadoEm: agora(),
      nome: S.aluno.nome, email: S.aluno.email, versao: CONFIG.versao,
      status: "pendente", tentativas: 0,
      itens: r.ids.map(function (id) {
        var q = porId(id);
        return { id: id, eixo: EIXOS[q.eixo], caso: q.caso, fonte: q.fonte, pergunta: q.pergunta, resposta: String(r.respostas[id] || "").trim() };
      })
    };
    S.envios.push(env); r.enviada = true; salvar();
    telaEnviada(env); window.scrollTo(0, 0);
    processaFila();
  }

  function telaEnviada(env) {
    desenhaBarra();
    app.innerHTML = "<section class=\"box\">" +
      "<h2 class=\"sans\" style=\"margin-top:0\">Rodada " + env.rodada + " enviada</h2>" +
      "<p>O professor recebe as suas respostas e devolve um comentário no e-mail <b>" + esc(env.email) + "</b>.</p>" +
      "<p class=\"status\" id=\"statusEnvio\" data-id=\"" + esc(env.envioId) + "\"></p>" +
      "<div class=\"acoes\"><button type=\"button\" class=\"btn\" id=\"outra\">Fazer outra rodada</button>" +
      "<button type=\"button\" class=\"btn sec\" id=\"baixar\">Baixar cópia das respostas</button></div>" +
      "<p class=\"nota\">A cópia traz as perguntas e as suas respostas, para estudar para a prova.</p>" +
      "</section>";
    $("outra").onclick = function () { sorteia(); telaRodada(); window.scrollTo(0, 0); };
    $("baixar").onclick = function () { baixarEnvio(env); };
    atualizaStatus();
  }

  function telaMinhas() {
    desenhaBarra();
    var lista = S.envios.slice().reverse();
    var h = "<section class=\"box\"><h2 class=\"sans\" style=\"margin-top:0\">Minhas rodadas enviadas</h2>";
    if (!lista.length) h += "<p>Você ainda não enviou nenhuma rodada neste navegador.</p>";
    else {
      h += "<ul class=\"lista\">" + lista.map(function (e) {
        var st = textoStatus(e);
        return "<li><span>Rodada " + e.rodada + " · enviada em " + esc(dataBR(e.enviadoEm)) + "<br><span class=\"st " + st.classe + "\">" + esc(st.texto) + "</span></span>" +
          "<button type=\"button\" class=\"btn sec\" data-baixar=\"" + esc(e.envioId) + "\">Baixar cópia</button></li>";
      }).join("") + "</ul>";
    }
    h += "<div class=\"acoes\"><button type=\"button\" class=\"btn\" id=\"voltar\">Voltar às perguntas</button></div></section>";
    app.innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll("[data-baixar]"), function (b) {
      b.onclick = function () {
        var id = b.getAttribute("data-baixar");
        for (var i = 0; i < S.envios.length; i++) if (S.envios[i].envioId === id) baixarEnvio(S.envios[i]);
      };
    });
    $("voltar").onclick = function () { if (S.rodada && !S.rodada.enviada) telaRodada(); else { sorteia(); telaRodada(); } };
  }

  /* ---------- envio: fila no navegador, POST ao Apps Script e confirmação por JSONP ---------- */
  function pendentes() { return S.envios.filter(function (e) { return e.status !== "confirmado"; }); }
  function paraServidor(env) {
    return {
      envioId: env.envioId, rodada: env.rodada, sorteadaEm: env.sorteadaEm, enviadoEm: env.enviadoEm,
      nome: env.nome, email: env.email, versao: env.versao, hp: "",
      itens: env.itens.map(function (it) { return { id: it.id, eixo: it.eixo, caso: it.caso, fonte: it.fonte, pergunta: it.pergunta, resposta: it.resposta }; })
    };
  }
  function jsonp(params, ok, falha) {
    var u = CONFIG.appsScript; if (!u) { if (falha) falha(); return; }
    var cb = "__olide" + Math.random().toString(36).slice(2);
    var s = document.createElement("script");
    function limpa() { try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
    window[cb] = function (d) { limpa(); ok(d); };
    s.onerror = function () { limpa(); if (falha) falha(); };
    s.src = u + (u.indexOf("?") >= 0 ? "&" : "?") + params + "&callback=" + cb + "&t=" + Date.now();
    document.head.appendChild(s);
  }
  function confere(env, depois) {
    var feito = false;
    var t = setTimeout(function () { if (!feito) { feito = true; depois(); } }, 20000);
    jsonp("conferir=" + encodeURIComponent(env.envioId), function (d) {
      if (feito) return; feito = true; clearTimeout(t);
      if (d && d.recebido) { env.status = "confirmado"; env.confirmadoEm = agora(); salvar(); }
      depois();
    }, function () { if (feito) return; feito = true; clearTimeout(t); depois(); });
  }
  function processaFila() {
    if (enviando) return;
    if (!CONFIG.appsScript) { atualizaStatus(); return; }
    var fila = pendentes(); if (!fila.length) { atualizaStatus(); return; }
    enviando = true; atualizaStatus();
    var i = 0;
    (function proximo() {
      if (i >= fila.length) { enviando = false; salvar(); atualizaStatus(); return; }
      var env = fila[i++];
      env.tentativas = (env.tentativas || 0) + 1; env.ultimaTentativa = agora(); salvar();
      fetch(CONFIG.appsScript, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(paraServidor(env))
      }).then(function () {
        if (env.status !== "confirmado") env.status = "enviado";
        salvar(); confere(env, proximo);
      }).catch(function () { salvar(); proximo(); });
    })();
  }
  window.addEventListener("online", processaFila);
  setInterval(function () { if (pendentes().length) processaFila(); }, 60000);

  function textoStatus(e) {
    if (e.status === "confirmado") return { classe: "ok", texto: "Recebida pelo professor em " + dataBR(e.confirmadoEm || e.enviadoEm) + "." };
    if (!CONFIG.appsScript) return { classe: "fila", texto: "Guardada na fila deste navegador: segue sozinha quando o envio for ligado." };
    if (enviando) return { classe: "fila", texto: "Enviando..." };
    if (e.status === "enviado") return { classe: "fila", texto: "Enviada, aguardando a confirmação de recebimento. O site confere de novo a cada minuto." };
    return { classe: "fila", texto: "Na fila: o envio é tentado de novo a cada minuto. Se fechar o site, ele continua quando você voltar." };
  }
  function atualizaStatus() {
    var el = $("statusEnvio"); if (!el) return;
    var id = el.getAttribute("data-id"), env = null;
    for (var i = 0; i < S.envios.length; i++) if (S.envios[i].envioId === id) env = S.envios[i];
    if (!env) return;
    var st = textoStatus(env);
    el.className = "status " + st.classe; el.textContent = st.texto;
  }

  /* ---------- cópia em texto ---------- */
  function textoEnvio(env) {
    var l = ["O LIDE · rodada " + env.rodada, CONFIG.turma, "Nome: " + env.nome, "E-mail: " + env.email, "Enviada em: " + dataBR(env.enviadoEm), ""];
    env.itens.forEach(function (it, i) {
      var q = porId(it.id) || {};
      l.push("==== PERGUNTA " + (i + 1) + " · " + it.eixo);
      l.push(it.caso); l.push("Caso real: " + it.fonte); l.push("");
      (q.contexto || []).forEach(function (p) { l.push(p); l.push(""); });
      if (q.fatos && q.fatos.length) { l.push("Os fatos:"); q.fatos.forEach(function (f) { l.push("* " + f); }); l.push(""); }
      l.push("Responda:"); it.pergunta.forEach(function (p, j) { l.push(LETRAS[j] + ") " + p); }); l.push("");
      if (q.base) { l.push("Para revisar: " + q.base); l.push(""); }
      l.push("SUA RESPOSTA:"); l.push(it.resposta); l.push("");
    });
    return l.join("\n");
  }
  function baixarEnvio(env) {
    var nome = "o-lide-rodada-" + env.rodada + "-" + String(env.enviadoEm).slice(0, 10) + ".txt";
    var b = new Blob([textoEnvio(env)], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
  }

  /* ---------- início ---------- */
  $("btMinhas").onclick = telaMinhas;
  $("btSair").onclick = function () {
    if (!window.confirm("Trocar de aluno neste navegador? A rodada em andamento será descartada.")) return;
    S.aluno = null; S.rodada = null; salvar(); telaEntrada();
  };
  function inicio() {
    if (typeof BANCO === "undefined" || !BANCO.length) { app.innerHTML = "<p class=\"aviso\">Não foi possível carregar as perguntas. Recarregue a página.</p>"; return; }
    if (!S.aluno) { telaEntrada(); return; }
    var r = S.rodada;
    if (r && !r.enviada && temTexto(r)) { telaRetomar(); return; }
    sorteia(); telaRodada();
  }
  inicio();
  processaFila();
})();
