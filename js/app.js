const API_URL = "https://script.google.com/macros/s/AKfycbxRAS7IsSYlyl9W9sa1yk2YWmKYZ5gSx8Af8gBEekPD_5uMOs2LpFZEmm5T8yPXZlio/exec";
const API_KEY = "appcadastro123";

function formatDateBR(val) {
  if (!val) return "";
  if (val instanceof Date) return val.toLocaleDateString("pt-BR");
  let str = String(val);
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.split("T")[0].split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return str;
}

function formatDateISO(val) {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().split("T")[0];
  let str = String(val);
  if (str.includes("T")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.split("T")[0];
  return str;
}

const COLSPAN = 10;

async function apiCall(params) {
  const fullParams = new URLSearchParams({ key: API_KEY, ...params });
  const res = await fetch(`${API_URL}?${fullParams}`);
  if (!res.ok) throw new Error("Erro na requisicao");
  return res.json();
}

async function submitDiploma(data) {
  return apiCall({ _action: "create", ...data });
}

async function updateDiploma(data) {
  return apiCall({ _action: "update", ...data });
}

async function deleteDiploma(numero) {
  return apiCall({ _action: "delete", numero });
}

async function fetchDiplomas(paramsObj = {}) {
  return apiCall(paramsObj);
}

const TURNOS = ["Manhã", "Tarde", "Noite"];
const MODALIDADES = ["Integrado", "Subsequente", "Ejatec"];

function createSelect(value, options) {
  const sel = document.createElement("select");
  options.forEach(opt => {
    const el = document.createElement("option");
    el.value = opt;
    el.textContent = opt;
    if (opt === value) el.selected = true;
    sel.appendChild(el);
  });
  return sel;
}

function renderDiplomas(data) {
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Nenhum diploma encontrado.</td></tr>`;
    return;
  }
  tableBody.innerHTML = data.map(d => `
    <tr data-numero="${escapeAttr(d.Número || "")}" data-nome="${escapeAttr(d["Nome do Aluno"] || "")}" data-turno="${escapeAttr(d.Turno || "")}" data-curso="${escapeAttr(d.Curso || "")}" data-modalidade="${escapeAttr(d.Modalidade || "")}" data-anoentrada="${escapeAttr(d["Ano de Entrada"] || "")}" data-anoconclusao="${escapeAttr(d["Ano de Conclusão"] || "")}" data-datarecebimento="${escapeAttr(d["Data de Recebimento"] || "")}" data-observacao="${escapeAttr(d.Observação || "")}">
      <td class="td-numero">${esc(d.Número || "")}</td>
      <td class="td-nome">${esc(d["Nome do Aluno"] || "")}</td>
      <td class="td-turno">${esc(d.Turno || "")}</td>
      <td class="td-curso">${esc(d.Curso || "")}</td>
      <td class="td-modalidade">${esc(d.Modalidade || "")}</td>
      <td class="td-anoEntrada">${esc(d["Ano de Entrada"] || "")}</td>
      <td class="td-anoConclusao">${esc(d["Ano de Conclusão"] || "")}</td>
      <td class="td-dataRecebimento">${esc(formatDateBR(d["Data de Recebimento"]))}</td>
      <td class="td-observacao">${esc(d.Observação || "")}</td>
      <td class="td-acoes">
        <button class="action-btn btn-edit" onclick="window.editRow(this)">Editar</button>
        <button class="action-btn btn-delete" onclick="window.deleteRow(this)">Excluir</button>
      </td>
    </tr>
  `).join("");
}

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function esc(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

window.editRow = function(btn) {
  const tr = btn.closest("tr");
  if (tr.classList.contains("editing")) return;

  const fields = ["nome", "turno", "curso", "modalidade", "anoEntrada", "anoConclusao", "dataRecebimento", "observacao"];

  fields.forEach(f => {
    const td = tr.querySelector(`.td-${f}`);
    const val = tr.dataset[f] || "";
    if (f === "turno") {
      td.innerHTML = "";
      td.appendChild(createSelect(val, TURNOS));
    } else if (f === "modalidade") {
      td.innerHTML = "";
      td.appendChild(createSelect(val, MODALIDADES));
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.value = f === "dataRecebimento" ? formatDateISO(val) : val;
      if (f === "anoEntrada" || f === "anoConclusao") input.placeholder = "AAAA";
      td.innerHTML = "";
      td.appendChild(input);
    }
  });

  const acoes = tr.querySelector(".td-acoes");
  acoes.innerHTML = `
    <button class="action-btn btn-save" onclick="window.saveRow(this)">Salvar</button>
    <button class="action-btn btn-cancel" onclick="window.cancelEdit(this)">Cancelar</button>
  `;
  tr.classList.add("editing");
};

window.saveRow = async function(btn) {
  const tr = btn.closest("tr");
  const numero = tr.dataset.numero;

  const data = { numero };
  const fields = ["nome", "turno", "curso", "modalidade", "anoEntrada", "anoConclusao", "dataRecebimento", "observacao"];

  fields.forEach(f => {
    const td = tr.querySelector(`.td-${f}`);
    const input = td.querySelector("input, select");
    if (input) data[f] = input.value.trim();
  });

  if (!data.nome || !data.curso) {
    showMessage("Campos obrigatórios: Nome e Curso.", "error");
    return;
  }

  try {
    const result = await updateDiploma(data);
    if (result.error) {
      showMessage(result.error, "error");
      return;
    }
    showMessage("Diploma atualizado com sucesso!", "success");
    loadDiplomas();
  } catch (err) {
    showMessage("Erro ao atualizar. Tente novamente.", "error");
  }
};

window.cancelEdit = function() {
  loadDiplomas();
};

window.deleteRow = async function(btn) {
  const tr = btn.closest("tr");
  const nome = tr.dataset.nome;
  const numero = tr.dataset.numero;

  if (!confirm(`Tem certeza que deseja excluir o diploma de "${nome}"?`)) return;

  try {
    const result = await deleteDiploma(numero);
    if (result.error) {
      showMessage(result.error, "error");
      return;
    }
    showMessage("Diploma excluído com sucesso!", "success");
    loadDiplomas();
  } catch (err) {
    showMessage("Erro ao excluir. Tente novamente.", "error");
  }
};

function showMessage(text, type) {
  const msg = document.getElementById("message");
  if (!msg) return;
  msg.className = `message ${type}`;
  msg.textContent = text;
  msg.style.display = "block";
  setTimeout(() => msg.style.display = "none", 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("diplomaForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("message");
      msg.style.display = "none";

      const data = {
        numero: document.getElementById("numero").value.trim(),
        nome: document.getElementById("nome").value.trim(),
        turno: document.getElementById("turno").value,
        curso: document.getElementById("curso").value.trim(),
        modalidade: document.getElementById("modalidade").value,
        anoEntrada: document.getElementById("anoEntrada").value,
        anoConclusao: document.getElementById("anoConclusao").value,
        dataRecebimento: document.getElementById("dataRecebimento").value,
        observacao: document.getElementById("observacao").value.trim()
      };

      if (!data.numero || !data.nome || !data.curso) {
        msg.className = "message error";
        msg.textContent = "Preencha os campos obrigatórios: Número, Nome e Curso.";
        msg.style.display = "block";
        return;
      }

      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Enviando...";

      try {
        const result = await submitDiploma(data);
        if (result.error) {
          msg.className = "message error";
          msg.textContent = result.error;
          msg.style.display = "block";
          return;
        }
        msg.className = "message success";
        msg.textContent = "Diploma cadastrado com sucesso!";
        msg.style.display = "block";
        form.reset();
      } catch (err) {
        msg.className = "message error";
        msg.textContent = "Erro ao cadastrar. Tente novamente.";
        msg.style.display = "block";
      } finally {
        btn.disabled = false;
        btn.textContent = "Cadastrar Diploma";
      }
    });
  }

  const btnSearch = document.getElementById("btnSearch");
  const btnAll = document.getElementById("btnAll");
  const searchType = document.getElementById("searchType");
  const searchNomeField = document.getElementById("searchNomeField");
  const searchCursoAnoField = document.getElementById("searchCursoAnoField");
  const searchNome = document.getElementById("searchNome");
  const searchCurso = document.getElementById("searchCurso");
  const searchAno = document.getElementById("searchAno");
  const tableBody = document.getElementById("tableBody");

  if (searchType) {
    searchType.addEventListener("change", () => {
      if (searchType.value === "nome") {
        searchNomeField.style.display = "flex";
        searchCursoAnoField.style.display = "none";
      } else {
        searchNomeField.style.display = "none";
        searchCursoAnoField.style.display = "flex";
      }
    });
  }

  function buildSearchParams() {
    if (searchType.value === "nome") {
      const nome = searchNome.value.trim();
      return nome ? { nome } : null;
    } else {
      const curso = searchCurso.value.trim();
      const ano = searchAno.value.trim();
      if (!curso && !ano) return null;
      const params = {};
      if (curso) params.curso = curso;
      if (ano) params.anoEntrada = ano;
      return params;
    }
  }

  async function loadDiplomas(paramsObj = null) {
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Carregando...</td></tr>`;
    try {
      const data = paramsObj ? await fetchDiplomas(paramsObj) : await fetchDiplomas();
      if (!tableBody) return;
      if (data.error) {
        tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Erro: ${data.error}</td></tr>`;
        return;
      }
      renderDiplomas(data);
    } catch (err) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Erro ao carregar dados.</td></tr>`;
    }
  }

  window.loadDiplomas = loadDiplomas;

  if (btnAll) btnAll.addEventListener("click", () => loadDiplomas());
  if (btnSearch) {
    btnSearch.addEventListener("click", () => {
      const params = buildSearchParams();
      loadDiplomas(params);
    });
  }
  [searchNome, searchCurso, searchAno].forEach(input => {
    if (input) {
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") btnSearch.click();
      });
    }
  });

  if (btnAll) loadDiplomas();
});
