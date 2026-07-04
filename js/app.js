const API_URL = "https://script.google.com/macros/s/AKfycbyPvARO2oTejrIy3Jk3QnsiYlPtAh0M9DYsEAG2choXQQsIb5gQ7d019aOkWHS-y4Ac/exec";

let pendingAction = null;
let authData = null;

function loadAuth() {
  try {
    const stored = sessionStorage.getItem("authData");
    if (stored) authData = JSON.parse(stored);
  } catch { authData = null; }
}

function saveAuth(senha) {
  authData = { senha };
  sessionStorage.setItem("authData", JSON.stringify(authData));
  updateAuthUI();
}

function clearAuth() {
  authData = null;
  sessionStorage.removeItem("authData");
  updateAuthUI();
}

function isAuthenticated() {
  return authData !== null;
}

function getAuthParams() {
  return authData ? { _senha: authData.senha } : {};
}

function openLoginModal() {
  document.getElementById("loginModal")?.classList.add("show");
  setTimeout(() => document.getElementById("loginPass")?.focus(), 100);
}

function closeLoginModal() {
  document.getElementById("loginModal")?.classList.remove("show");
  const err = document.getElementById("loginError");
  if (err) err.style.display = "none";
  const pass = document.getElementById("loginPass");
  if (pass) pass.value = "";
  pendingAction = null;
}

async function handleLogin() {
  const senha = document.getElementById("loginPass").value;
  const errorEl = document.getElementById("loginError");

  if (!senha) {
    errorEl.textContent = "Digite a senha de administrador.";
    errorEl.style.display = "block";
    return;
  }

  try {
    const result = await apiCall({ _action: "auth", _senha: senha });
    if (result.success) {
      saveAuth(senha);
      closeLoginModal();
      if (pendingAction) {
        const action = pendingAction;
        pendingAction = null;
        action();
      }
    } else {
      errorEl.textContent = "Senha inválida.";
      errorEl.style.display = "block";
    }
  } catch {
    errorEl.textContent = "Erro ao conectar. Tente novamente.";
    errorEl.style.display = "block";
  }
}

function mostrarSenha(btn) {
  const wrapper = btn.closest(".password-wrapper");
  const input = wrapper.querySelector("input");
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  btn.textContent = isPassword ? "🙈" : "👁";
}

function updateAuthUI() {
  const existing = document.getElementById("logoutBtn");
  if (isAuthenticated()) {
    if (!existing) {
      const nav = document.querySelector("nav");
      if (nav) {
        const btn = document.createElement("a");
        btn.id = "logoutBtn";
        btn.href = "#";
        btn.textContent = "Sair";
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          clearAuth();
          const msg = document.getElementById("message");
          if (msg) {
            msg.className = "message success";
            msg.textContent = "Sessão encerrada.";
            msg.style.display = "block";
            setTimeout(() => msg.style.display = "none", 3000);
          }
        });
        nav.appendChild(btn);
      }
    }
  } else {
    if (existing) existing.remove();
  }
}

const COLSPAN = 6;
const STORAGE_KEY = "cursosPersonalizados";

const CURSOS_FIXOS = [
  "ADMINISTRAÇÃO",
  "ARTE DRAMÁTICA",
  "CIÊNCIAS DE DADOS",
  "COMÉRCIO",
  "CONTABILIDADE",
  "DESENVOLVIMENTO DE SISTEMAS",
  "EDUCAÇÃO ESPECIAL",
  "EVENTOS",
  "INFORMÁTICA",
  "LOGÍSTICA",
  "MARKETING",
  "RECURSOS HUMANOS",
  "REDES DE COMPUTADORES",
  "SECRETARIADO"
];

function getCursosPersonalizados() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function salvarCursosPersonalizados(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function getTodosCursos() {
  return [...CURSOS_FIXOS, ...getCursosPersonalizados()].sort();
}

function carregarSelectCursos(selectId, placeholder, incluirAdicionar) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const valorAtual = select.value;
  const cursos = getTodosCursos();

  select.innerHTML = "";

  if (placeholder !== null) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    select.appendChild(opt);
  }

  cursos.forEach(curso => {
    const opt = document.createElement("option");
    opt.value = curso;
    opt.textContent = curso;
    select.appendChild(opt);
  });

  if (incluirAdicionar) {
    const opt = document.createElement("option");
    opt.value = "ADICIONAR_CURSO";
    opt.textContent = "--- ADICIONAR CURSO ---";
    select.appendChild(opt);
  }

  if (valorAtual && cursos.includes(valorAtual)) {
    select.value = valorAtual;
  }
}

function carregarTodosSelectsCursos() {
  carregarSelectCursos("curso", "Selecione...", true);
  carregarSelectCursos("editCurso", "Selecione...", true);
  carregarSelectCursos("searchCurso", "Todos os cursos", false);
}

function adicionarCursoPersonalizado(nome) {
  nome = nome.toUpperCase().trim();
  if (!nome) return false;

  const personalizados = getCursosPersonalizados();
  const todos = getTodosCursos();

  if (todos.includes(nome)) {
    showMessage("Este curso já existe na lista.", "error");
    return false;
  }

  personalizados.push(nome);
  salvarCursosPersonalizados(personalizados);
  carregarTodosSelectsCursos();

  const msg = document.getElementById("message");
  if (msg) {
    msg.className = "message success";
    msg.textContent = `Curso "${nome}" adicionado com sucesso!`;
    msg.style.display = "block";
    setTimeout(() => msg.style.display = "none", 3000);
  }

  return true;
}

function configurarCursoSelect(selectId, customInputId) {
  const select = document.getElementById(selectId);
  const custom = document.getElementById(customInputId);
  if (!select || !custom) return;

  select.addEventListener("change", () => {
    if (select.value === "ADICIONAR_CURSO") {
      custom.style.display = "block";
      custom.focus();
    } else {
      custom.style.display = "none";
      custom.value = "";
    }
  });

  custom.addEventListener("input", () => {
    custom.value = custom.value.toUpperCase();
  });

  custom.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nome = custom.value.trim();
      if (nome && adicionarCursoPersonalizado(nome)) {
        select.value = nome;
        custom.style.display = "none";
        custom.value = "";
      }
    }
  });

  custom.addEventListener("blur", () => {
    const nome = custom.value.trim();
    if (nome && select.value === "ADICIONAR_CURSO") {
      if (adicionarCursoPersonalizado(nome)) {
        select.value = nome;
        custom.style.display = "none";
        custom.value = "";
      }
    }
  });
}

async function apiCall(params) {
  const fullParams = new URLSearchParams(params);
  const res = await fetch(`${API_URL}?${fullParams}`);
  if (!res.ok) throw new Error("Erro na requisicao");
  return res.json();
}

async function submitAluno(data) {
  return apiCall({ _action: "create", ...data, ...getAuthParams() });
}

async function updateAluno(data) {
  return apiCall({ _action: "update", ...data, ...getAuthParams() });
}

async function deleteAluno(numero) {
  return apiCall({ _action: "delete", numero, ...getAuthParams() });
}

async function fetchAlunos(paramsObj = {}) {
  return apiCall(paramsObj);
}

let allData = [];
let currentPage = 1;
let pageSize = 10;

async function renderCoursePanel() {
  const panel = document.getElementById("coursePanel");
  if (!panel) return;
  panel.innerHTML = `<div class="course-panel-empty">Carregando...</div>`;
  try {
    const data = await fetchAlunos();
    if (data.error || !Array.isArray(data)) {
      panel.innerHTML = `<div class="course-panel-empty">Nenhum curso cadastrado.</div>`;
      return;
    }
    const counts = {};
    data.forEach(d => {
      const curso = (d.Curso || "").trim().toUpperCase();
      if (curso) counts[curso] = (counts[curso] || 0) + 1;
    });
    const cursos = Object.keys(counts).sort();
    if (cursos.length === 0) {
      panel.innerHTML = `<div class="course-panel-empty">Nenhum curso cadastrado.</div>`;
      return;
    }
    const total = data.length;
    const rows = cursos.map(c => `
      <div class="course-row">
        <span class="course-name">${esc(c)}</span>
        <span class="course-count">${counts[c]} aluno${counts[c] !== 1 ? 's' : ''}</span>
      </div>
    `).join("");
    panel.innerHTML = `
      <h2>Cursos Cadastrados</h2>
      <div class="course-grid">${rows}</div>
      <div class="course-panel-footer">
        <span>Total de Alunos</span>
        <span>${total}</span>
      </div>
    `;
  } catch {
    panel.innerHTML = `<div class="course-panel-empty">Erro ao carregar dados.</div>`;
  }
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

function renderPaginated() {
  const totalPages = Math.ceil(allData.length / pageSize) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  renderAlunos(allData.slice(start, end));
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;
  if (totalPages <= 1) {
    pagination.innerHTML = "";
    return;
  }
  const blockSize = 10;
  const currentBlock = Math.ceil(currentPage / blockSize);
  const blockStart = (currentBlock - 1) * blockSize + 1;
  const blockEnd = Math.min(blockStart + blockSize - 1, totalPages);

  let html = "";
  html += `<button onclick="window.changePage(1)" ${currentPage <= 1 ? 'disabled' : ''}>Início</button>`;
  html += `<button onclick="window.changePage(${blockStart - 1})" ${blockStart <= 1 ? 'disabled' : ''}>Anterior</button>`;
  for (let i = blockStart; i <= blockEnd; i++) {
    html += `<button onclick="window.changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
  }
  html += `<button onclick="window.changePage(${blockEnd + 1})" ${blockEnd >= totalPages ? 'disabled' : ''}>Próximo</button>`;
  html += `<button onclick="window.changePage(${totalPages})" ${currentPage >= totalPages ? 'disabled' : ''}>Último</button>`;
  pagination.innerHTML = html;
}

window.changePage = function(page) {
  currentPage = page;
  renderPaginated();
};

window.changePageSize = function(size) {
  pageSize = parseInt(size);
  currentPage = 1;
  renderPaginated();
};

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
  if (!isAuthenticated()) {
    pendingAction = () => window.editRow(btn);
    openLoginModal();
    return;
  }
  const tr = btn.closest("tr");
  const d = tr.dataset;

  document.getElementById("editNumero").value = d.numero;
  document.getElementById("editNome").value = d.nome;
  document.getElementById("editTurno").value = d.turno;

  const editCurso = document.getElementById("editCurso");
  const editCursoCustom = document.getElementById("editCursoCustom");
  const todos = getTodosCursos();
  if (todos.includes(d.curso)) {
    editCurso.value = d.curso;
    editCursoCustom.style.display = "none";
    editCursoCustom.value = "";
  } else if (d.curso) {
    editCurso.value = "ADICIONAR_CURSO";
    editCursoCustom.value = d.curso;
    editCursoCustom.style.display = "block";
  } else {
    editCurso.value = "";
    editCursoCustom.style.display = "none";
    editCursoCustom.value = "";
  }

  document.getElementById("editAnoInicio").value = d.anoinicio;

  openModal();
};

window.saveEdit = async function() {
  const editCurso = document.getElementById("editCurso");
  const editCursoCustom = document.getElementById("editCursoCustom");
  let curso = editCurso.value;
  if (curso === "ADICIONAR_CURSO") {
    curso = editCursoCustom.value.trim().toUpperCase();
  }

  const data = {
    numero: document.getElementById("editNumero").value.trim(),
    nome: document.getElementById("editNome").value.trim(),
    turno: document.getElementById("editTurno").value,
    curso: curso,
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
  if (!isAuthenticated()) {
    pendingAction = () => window.deleteRow(btn);
    openLoginModal();
    return;
  }
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
  carregarTodosSelectsCursos();
  configurarCursoSelect("curso", "cursoCustom");
  configurarCursoSelect("editCurso", "editCursoCustom");

  document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase();
    });
  });

  const form = document.getElementById("alunoForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!isAuthenticated()) {
        pendingAction = () => form.dispatchEvent(new Event("submit"));
        openLoginModal();
        return;
      }

      const msg = document.getElementById("message");
      msg.style.display = "none";

      const cursoSelect = document.getElementById("curso");
      const cursoCustom = document.getElementById("cursoCustom");
      let curso = cursoSelect.value;
      if (curso === "ADICIONAR_CURSO") {
        curso = cursoCustom.value.trim().toUpperCase();
      }

      const data = {
        numero: document.getElementById("numero").value.trim(),
        nome: document.getElementById("nome").value.trim(),
        turno: document.getElementById("turno").value,
        curso: curso,
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
        document.getElementById("cursoCustom").style.display = "none";
        renderCoursePanel();
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
      const curso = searchCurso.value;
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
      allData = data;
      allData.sort((a, b) => parseInt(a.Número) - parseInt(b.Número));
      currentPage = 1;
      renderPaginated();
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
  [searchNome, searchAno].forEach(input => {
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

  renderCoursePanel();

  const pageSizeSelect = document.getElementById("pageSize");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      window.changePageSize(pageSizeSelect.value);
    });
  }

  loadAuth();
  updateAuthUI();

  document.getElementById("loginModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("loginModal")) closeLoginModal();
  });

  document.getElementById("loginPass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin();
    }
  });
});
