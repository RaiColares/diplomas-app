const SHEET_NAME = "Diplomas";
const API_KEY = "appcadastro123";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (e.parameter.key !== API_KEY) {
    return respond({ error: "Chave invalida" });
  }

  if (e.parameter._action === "create") {
    const { numero, nome, turno, curso, modalidade, anoEntrada, anoConclusao, dataRecebimento, observacao } = e.parameter;
    if (!numero || !nome || !curso) {
      return respond({ error: "Campos obrigatorios: numero, nome, curso" });
    }
    sheet.appendRow([numero, nome, turno || "", curso, modalidade || "", anoEntrada || "", anoConclusao || "", dataRecebimento || "", observacao || ""]);
    return respond({ success: true, message: "Diploma cadastrado!" });
  }

  if (e.parameter._action === "update") {
    const { numero, nome, turno, curso, modalidade, anoEntrada, anoConclusao, dataRecebimento, observacao } = e.parameter;
    if (!numero || !nome || !curso) {
      return respond({ error: "Campos obrigatorios: numero, nome, curso" });
    }
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(numero)) {
        const row = i + 1;
        sheet.getRange(row, 1, 1, 9).setValues([[numero, nome, turno || "", curso, modalidade || "", anoEntrada || "", anoConclusao || "", dataRecebimento || "", observacao || ""]]);
        return respond({ success: true, message: "Diploma atualizado!" });
      }
    }
    return respond({ error: "Diploma nao encontrado" });
  }

  if (e.parameter._action === "delete") {
    const numero = e.parameter.numero;
    if (!numero) return respond({ error: "Numero obrigatorio" });
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(numero)) {
        sheet.deleteRow(i + 1);
        return respond({ success: true, message: "Diploma excluido!" });
      }
    }
    return respond({ error: "Diploma nao encontrado" });
  }

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  if (e.parameter.nome) {
    const termo = e.parameter.nome.toLowerCase();
    const filtered = data.filter(row => String(row[1]).toLowerCase().includes(termo));
    return respond(filtered.map(row => mapRow(headers, row)));
  }

  if (e.parameter.curso) {
    const termoCurso = e.parameter.curso.toLowerCase();
    const termoAno = e.parameter.anoEntrada || "";
    const filtered = data.filter(row => {
      const matchCurso = String(row[3]).toLowerCase().includes(termoCurso);
      const matchAno = !termoAno || String(row[5]) === termoAno;
      return matchCurso && matchAno;
    });
    return respond(filtered.map(row => mapRow(headers, row)));
  }

  return respond(data.map(row => mapRow(headers, row)));
}

function doPost(e) {
  const params = {};
  for (const key in e.parameter) {
    params[key] = e.parameter[key];
  }
  params._action = params._action || "create";
  return doGet({ parameter: params });
}

function mapRow(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    const val = row[i];
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, "0");
      const d = String(val.getDate()).padStart(2, "0");
      obj[h] = `${y}-${m}-${d}`;
    } else {
      obj[h] = val;
    }
  });
  return obj;
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
