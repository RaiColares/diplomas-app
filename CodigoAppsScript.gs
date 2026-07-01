/**
 * Sistema de Cadastro de Diplomas
 * Google Apps Script - Web App
 *
 * Instruções:
 * 1. Abra a planilha no Google Sheets
 * 2. Extensões > Apps Script
 * 3. Cole este código
 * 4. Altere a API_KEY para uma chave secreta de sua escolha
 * 5. Implantar > Nova implantação > Web App
 *    - Executar como: "eu"
 *    - Quem tem acesso: "Qualquer pessoa"
 * 6. Copie a URL gerada e cole em js/app.js (const API_URL)
 */

const SHEET_NAME = "Diplomas";
const API_KEY = "appcadastro123";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  if (e.parameter.key !== API_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Chave invalida" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter.nome) {
    const termo = e.parameter.nome.toLowerCase();
    const filtered = data.filter(row => String(row[1]).toLowerCase().includes(termo));
    const result = filtered.map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (e.parameter.curso) {
    const termoCurso = e.parameter.curso.toLowerCase();
    const termoAno = e.parameter.anoEntrada || "";
    const filtered = data.filter(row => {
      const matchCurso = String(row[3]).toLowerCase().includes(termoCurso);
      const matchAno = !termoAno || String(row[5]) === termoAno;
      return matchCurso && matchAno;
    });
    const result = filtered.map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const result = data.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (e.parameter.key !== API_KEY) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Chave invalida" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const { numero, nome, turno, curso, modalidade, anoEntrada, anoConclusao, dataRecebimento, observacao } = e.parameter;

  if (!numero || !nome || !curso) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: "Campos obrigatorios: numero, nome, curso" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    numero, nome, turno, curso, modalidade,
    anoEntrada, anoConclusao, dataRecebimento, observacao || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Diploma cadastrado!" }))
    .setMimeType(ContentService.MimeType.JSON);
}
