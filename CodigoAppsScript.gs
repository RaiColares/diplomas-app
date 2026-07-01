const SHEET_NAME = "Diplomas";
const API_KEY = "appcadastro123";

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (e.parameter.key !== API_KEY) {
    return respond({ error: "Chave invalida" });
  }

  if (e.parameter._action === "create") {
    const { numero, nome, turno, curso, anoInicio } = e.parameter;
    sheet.appendRow([numero || "", nome || "", turno || "", curso || "", anoInicio || ""]);
    return respond({ success: true, message: "Diploma cadastrado!" });
  }

  if (e.parameter._action === "update") {
    const { numero, nome, turno, curso, anoInicio } = e.parameter;
    if (!numero) return respond({ error: "Numero obrigatorio" });
    const data = sheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === String(numero)) {
        const row = i + 1;
        sheet.getRange(row, 1, 1, 5).setValues([[numero, nome || "", turno || "", curso || "", anoInicio || ""]]);
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
  data.shift();

  if (e.parameter.nome) {
    const termo = e.parameter.nome.toLowerCase();
    const filtered = data.filter(row => String(row[1]).toLowerCase().includes(termo));
    return respond(filtered.map(row => mapRow(row)));
  }

  if (e.parameter.curso) {
    const termoCurso = e.parameter.curso.toLowerCase();
    const termoAno = e.parameter.anoInicio || "";
    const filtered = data.filter(row => {
      const matchCurso = String(row[3]).toLowerCase().includes(termoCurso);
      const matchAno = !termoAno || String(row[4]) === termoAno;
      return matchCurso && matchAno;
    });
    return respond(filtered.map(row => mapRow(row)));
  }

  return respond(data.map(row => mapRow(row)));
}

function doPost(e) {
  const params = {};
  for (const key in e.parameter) {
    params[key] = e.parameter[key];
  }
  params._action = params._action || "create";
  return doGet({ parameter: params });
}

function mapRow(row) {
  return {
    "Número": row[0] || "",
    "Nome do Aluno": row[1] || "",
    "Turno": row[2] || "",
    "Curso": row[3] || "",
    "Ano de Início": row[4] || ""
  };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
