const API_URL = "https://script.google.com/macros/s/AKfycbyLgwVO1NRRPckD72T0GV5UYf0unnGze3oAh5PrYUqZh2Acbu2Zv393wmIyDcgrzhLc/exec";
const API_KEY = "appcadastro123";

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR");
}

async function submitDiploma(data) {
  const params = new URLSearchParams({ key: API_KEY, ...data });
  const res = await fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  if (res.type === "opaque") return { success: true };
  return res.json();
}

async function fetchDiplomas(paramsObj = {}) {
  const params = new URLSearchParams({ key: API_KEY, ...paramsObj });
  const res = await fetch(`${API_URL}?${params}`);
  return res.json();
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

  searchType.addEventListener("change", () => {
    if (searchType.value === "nome") {
      searchNomeField.style.display = "flex";
      searchCursoAnoField.style.display = "none";
    } else {
      searchNomeField.style.display = "none";
      searchCursoAnoField.style.display = "flex";
    }
  });

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
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="9">Carregando...</td></tr>';
    try {
      const data = paramsObj ? await fetchDiplomas(paramsObj) : await fetchDiplomas();
      if (!tableBody) return;
      if (data.error) {
        tableBody.innerHTML = `<tr><td colspan="9">Erro: ${data.error}</td></tr>`;
        return;
      }
      if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9">Nenhum diploma encontrado.</td></tr>';
        return;
      }
      tableBody.innerHTML = data.map(d => `
        <tr>
          <td>${d.Número || ""}</td>
          <td>${d["Nome do Aluno"] || ""}</td>
          <td>${d.Turno || ""}</td>
          <td>${d.Curso || ""}</td>
          <td>${d.Modalidade || ""}</td>
          <td>${d["Ano de Entrada"] || ""}</td>
          <td>${d["Ano de Conclusão"] || ""}</td>
          <td>${formatDateBR(d["Data de Recebimento"])}</td>
          <td>${d.Observação || ""}</td>
        </tr>
      `).join("");
    } catch (err) {
      if (tableBody) tableBody.innerHTML = '<tr><td colspan="9">Erro ao carregar dados.</td></tr>';
    }
  }

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
