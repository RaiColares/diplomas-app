const API_URL = "https://script.google.com/macros/s/AKfycbzYpsmKn6UW0s47h-GPTpe4ug6m9VRd0v_-uudjur-KhJUhNBrHcnMQZAEl38AAtAdh/exec";
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

function renderDiplomas(data) {
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Nenhum diploma encontrado.</td></tr>`;
    return;
  }
  tableBody.innerHTML = data.map(d => `
    <tr data-numero="${escapeAttr(d.Número || "")}" data-nome="${escapeAttr(d["Nome do Aluno"] || "")}" data-turno="${escapeAttr(d.Turno || "")}" data-curso="${escapeAttr(d.Curso || "")}" data-modalidade="${escapeAttr(d.Modalidade || "")}" data-anoentrada="${escapeAttr(d["Ano de Entrada"] || "")}" data-anoconclusao="${escapeAttr(d["Ano de Conclusão"] || "")}" data-datarecebimento="${escapeAttr(d["Data de Recebimento"] || "")}" data-observacao="${escapeAttr(d["Observação"] || "")}">
      <td class="td-numero">${esc(d.Número || "")}</td>
      <td class="td-nome">${esc(d["Nome do Aluno"] || "")}</td>
      <td class="td-turno">${esc(d.Turno || "")}</td>
      <td class="td-curso">${esc(d.Curso || "")}</td>
      <td class="td-modalidade">${esc(d.Modalidade || "")}</td>
      <td class="td-anoEntrada">${esc(d["Ano de Entrada"] || "")}</td>
      <td class="td-anoConclusao">${esc(d["Ano de Conclusão"] || "")}</td>
      <td class="td-dataRecebimento">${esc(formatDateBR(d["Data de Recebimento"]))}</td>
      <td class="td-observacao">${esc(d["Observação"] || "")}</td>
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

function openModal() {
  document.getElementById("editModal").classList.add("show");
}

function closeModal() {
  document.getElementById("editModal").classList.remove("show");
}

window.editRow = function(btn) {
  const tr = btn.closest("tr");
  const d = tr.dataset;

  document.getElementById("editNumero").value = d.numero;
  document.getElementById("editNome").value = d.nome;
  document.getElementById("editTurno").value = d.turno;
  document.getElementById("editCurso").value = d.curso;
  document.getElementById("editModalidade").value = d.modalidade;
  document.getElementById("editAnoEntrada").value = d.anoentrada;
  document.getElementById("editAnoConclusao").value = d.anoconclusao;
  document.getElementById("editDataRecebimento").value = formatDateISO(d.datarecebimento);
  document.getElementById("editObservacao").value = tr.getAttribute("data-observacao") || "";

  openModal();
};

window.saveEdit = async function() {
  const data = {
    numero: document.getElementById("editNumero").value.trim(),
    nome: document.getElementById("editNome").value.trim(),
    turno: document.getElementById("editTurno").value,
    curso: document.getElementById("editCurso").value.trim(),
    modalidade: document.getElementById("editModalidade").value,
    anoEntrada: document.getElementById("editAnoEntrada").value.trim(),
    anoConclusao: document.getElementById("editAnoConclusao").value.trim(),
    dataRecebimento: document.getElementById("editDataRecebimento").value,
    observacao: document.getElementById("editObservacao").value.trim()
  };

  if (!validateForm(data)) return;

  const btn = document.getElementById("btnSaveEdit");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const result = await updateDiploma(data);
    if (result.error) {
      showMessage(result.error, "error");
      return;
    }
    showMessage("Diploma atualizado com sucesso!", "success");
    closeModal();
    loadDiplomas();
  } catch (err) {
    showMessage("Erro ao atualizar. Tente novamente.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar Alterações";
  }
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

function validateForm(data) {
  const fields = [
    { key: "numero", label: "Número do Diploma" },
    { key: "nome", label: "Nome do Aluno" },
    { key: "turno", label: "Turno" },
    { key: "curso", label: "Curso" },
    { key: "modalidade", label: "Modalidade" },
    { key: "anoEntrada", label: "Ano de Entrada" },
    { key: "anoConclusao", label: "Ano de Conclusão" }
  ];

  for (const f of fields) {
    if (!data[f.key]) {
      showMessage(`Campo obrigatório: ${f.label}`, "error");
      return false;
    }
  }

  if (!/^\d+$/.test(data.numero)) {
    showMessage("Número do diploma deve conter apenas dígitos.", "error");
    return false;
  }

  return true;
}

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

      if (!validateForm(data)) return;

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

  // Modal event listeners
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();
      window.saveEdit();
    });
  }

  document.getElementById("btnCancelEdit")?.addEventListener("click", closeModal);

  document.querySelector(".modal-close")?.addEventListener("click", closeModal);

  document.getElementById("editModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("editModal")) closeModal();
  });
});
