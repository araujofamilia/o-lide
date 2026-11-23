# O lide

Treino para a prova escrita de **Jornalismo Impresso Diário** (turma matutina T0103, PUC-Campinas, 2026/2). Endereço: https://araujofamilia.github.io/o-lide/

**Não vale nota.** Prepara para a prova escrita individual de segunda-feira, 7 de dezembro (4,0 pontos).

## Como funciona

- O aluno entra com nome completo e e-mail (ficam guardados só no navegador dele).
- Cada rodada sorteia **4 perguntas dissertativas**, uma de cada eixo da prova: pauta e ângulo; apuração e contraditório; texto (lide e estrutura); edição, página, foto e infografia. A ordem das quatro é embaralhada.
- O banco tem **44 perguntas** (11 por eixo), todas a partir de casos reais publicados entre 17 e 22/11/2026 (Folha de S.Paulo, O Estado de S. Paulo e Correio da Manhã, edição Campinas), com o caso contado por inteiro, porque a turma não precisa ter lido o jornal.
- Primeiro saem as perguntas que o aluno ainda não viu; numa mesma rodada não se repete o mesmo caso. Com 11 rodadas, ele passa pelas 44.
- Cada vez que o aluno reabre o site, vêm perguntas novas. Se ele tiver deixado uma rodada com texto escrito e não enviada, o site oferece continuar ou descartar.
- Para enviar, as quatro respostas precisam ter pelo menos 60 palavras cada. O rascunho fica salvo no navegador.
- Prazo de envio: **sábado, 5 de dezembro, às 23h59**. Depois disso o site continua aberto para treino, mas não envia.

## Para onde vão as respostas

Cada rodada entra numa fila no navegador e segue para o app da Web do Apps Script (endereço em `config.js`, campo `appsScript`), que grava uma linha numa planilha da conta araujofamilia@gmail.com e confirma o recebimento ao site. Rodada repetida não entra duas vezes.

Toda madrugada, entre 3h e 4h (horário de Brasília), o Apps Script manda um resumo por e-mail com as rodadas novas, agrupadas por aluno, com as perguntas, as respostas e um botão para responder ao aluno. Dia sem rodada nova não gera e-mail.

O código do Apps Script **não fica neste repositório**, porque traz as anotações de correção de cada pergunta (o que observar nas respostas). Ele está no Drive do professor, na pasta do Impresso.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Página e estilo |
| `config.js` | Datas, mínimo de palavras e o endereço do Apps Script |
| `banco.js` | As 44 perguntas |
| `quiz.js` | Sorteio, rascunho, envio e cópia das respostas |

Ao trocar arquivos, suba o parâmetro `?v=` dos scripts no `index.html` para os navegadores não usarem cópia velha.

Site feito com apoio de IA, sob supervisão do professor Artur Araujo.
