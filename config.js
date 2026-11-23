/* =====================================================================
   O lide · configuração.

   appsScript: endereço do app da Web do Apps Script (termina em /exec).
   É a única linha que precisa ser preenchida depois de ligar o Apps
   Script. Sem ela, as rodadas ficam guardadas na fila do navegador e
   seguem sozinhas quando o endereço for preenchido.

   fimEnvio: depois desse momento o site continua aberto para treino,
   mas não envia mais respostas ao professor.
   ===================================================================== */
var CONFIG = {
  titulo: "O lide",
  turma: "Jornalismo Impresso Diário · turma matutina T0103 · PUC-Campinas · 2026/2",
  dataProva: "segunda-feira, 7 de dezembro",
  valorProva: "4,0",
  fimEnvio: "2026-12-05T23:59:59-03:00",
  fimTexto: "sábado, 5 de dezembro, às 23h59",
  perguntasPorRodada: 4,
  minPalavras: 60,
  maxCaracteres: 10000,
  appsScript: "",
  versao: "2026-11-23a"
};
