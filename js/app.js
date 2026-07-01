const API_URL = "https://script.google.com/macros/s/AKfycbzWfPle_9c2tou9kPPva4E7BodCXxZwY7i6JP8ptglQEsk6IcavLuZ8dkiaEJXRT78g/exec";
const API_KEY = "appcadastro123";

const COLSPAN = 6;

async function apiCall(params) {
  const fullParams = new URLSearchParams({ key: API_KEY, ...params });
  const res = await fetch(`${API_URL}?${fullParams}`);
  if (!res.ok) throw new Error("Erro na requisicao");
  return res.json();
}

async function submitAluno(data) {
  return apiCall({ _action: "create", ...data });
}

async function updateAluno(data) {
  return apiCall({ _action: "update", ...data });
}

async function deleteAluno(numero) {
  return apiCall({ _action: "delete", numero });
}

async function fetchAlunos(paramsObj = {}) {
  return apiCall(paramsObj);
}

function renderAlunos(data) {
  const tableBody = document.getElementById("tableBody");
  if (!tableBody) return;
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Nenhum aluno encontrado.</td></tr>`;
    return;
  }
  tableBody.innerHTML = data.map(d => `
    <tr data-numero="${escapeAttr(d.Número || "")}" data-nome="${escapeAttr(d["Nome do Aluno"] || "")}" data-turno="${escapeAttr(d.Turno || "")}" data-curso="${escapeAttr(d.Curso || "")}" data-anoinicio="${escapeAttr(d["Ano de Início"] || "")}">
      <td class="td-numero">${esc(d.Número || "")}</td>
      <td class="td-nome">${esc(d["Nome do Aluno"] || "")}</td>
      <td class="td-turno">${esc(d.Turno || "")}</td>
      <td class="td-curso">${esc(d.Curso || "")}</td>
      <td class="td-anoinicio">${esc(d["Ano de Início"] || "")}</td>
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
  document.getElementById("editAnoInicio").value = d.anoinicio;

  openModal();
};

window.saveEdit = async function() {
  const data = {
    numero: document.getElementById("editNumero").value.trim(),
    nome: document.getElementById("editNome").value.trim(),
    turno: document.getElementById("editTurno").value,
    curso: document.getElementById("editCurso").value.trim(),
    anoInicio: document.getElementById("editAnoInicio").value.trim()
  };

  const btn = document.getElementById("btnSaveEdit");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const result = await updateAluno(data);
    if (result.error) {
      showMessage(result.error, "error");
      return;
    }
    showMessage("Aluno atualizado com sucesso!", "success");
    closeModal();
    loadAlunos();
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

  if (!confirm(`Tem certeza que deseja excluir o aluno de "${nome}"?`)) return;

  try {
    const result = await deleteAluno(numero);
    if (result.error) {
      showMessage(result.error, "error");
      return;
    }
    showMessage("Aluno excluído com sucesso!", "success");
    loadAlunos();
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
  const form = document.getElementById("alunoForm");
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
        anoInicio: document.getElementById("anoInicio").value.trim()
      };

      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Enviando...";

      try {
        const result = await submitAluno(data);
        if (result.error) {
          msg.className = "message error";
          msg.textContent = result.error;
          msg.style.display = "block";
          return;
        }
        msg.className = "message success";
        msg.textContent = "Aluno cadastrado com sucesso!";
        msg.style.display = "block";
        form.reset();
      } catch (err) {
        msg.className = "message error";
        msg.textContent = "Erro ao cadastrar. Tente novamente.";
        msg.style.display = "block";
      } finally {
        btn.disabled = false;
        btn.textContent = "Cadastrar Aluno";
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
      if (ano) params.anoInicio = ano;
      return params;
    }
  }

  async function loadAlunos(paramsObj = null) {
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Carregando...</td></tr>`;
    try {
      const data = paramsObj ? await fetchAlunos(paramsObj) : await fetchAlunos();
      if (!tableBody) return;
      if (data.error) {
        tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Erro: ${data.error}</td></tr>`;
        return;
      }
      renderAlunos(data);
    } catch (err) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="${COLSPAN}">Erro ao carregar dados.</td></tr>`;
    }
  }

  window.loadAlunos = loadAlunos;

  if (btnAll) btnAll.addEventListener("click", () => loadAlunos());
  if (btnSearch) {
    btnSearch.addEventListener("click", () => {
      const params = buildSearchParams();
      loadAlunos(params);
    });
  }
  [searchNome, searchCurso, searchAno].forEach(input => {
    if (input) {
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") btnSearch.click();
      });
    }
  });

  if (btnAll) loadAlunos();

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
