// ========================================================== */
// 1. CONFIGURAÇÕES INICIAIS                                  */
// ========================================================== */

const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];


// ========================================================== */
// 2. ESTADO DO SISTEMA                                       */
// ========================================================== */

let data = new Date();
let currentYear = data.getFullYear();
let currentMonth = data.getMonth(); // Julho (0 = Janeiro)
let atividades = [];
let feriados = [];
let contratoAtivo = 'TAMBORE'; // ou 'CURITIBA'

let modalState = {
    data: '',
    todasAtividades: [],  // Todas as atividades do dia
    feriados: [],         // Feriados do dia
    nivel: 1              // 1, 2 ou 3
};

let nivelAtual = 1;
let dataAtual = '';
let atividadesDoDia = [];

// EXPORTA A VARIÁVEL PARA OUTROS MÓDULOS
window.contratoAtivo = contratoAtivo;


// ========================================================== */
// 2.5 PERMISSÕES DE ACESSO (NÍVEIS)                          */
// ========================================================== */

/**
 * Obtém o nível de acesso do usuário baseado no token da URL
 * @returns {number} 1 = Master, 2 = Visualizador, 3 = Empresa Específica, 0 = Sem acesso
 */
function getNivelAcesso() {
    // ==========================================================
    // MODO DE TESTE: Altere aqui para simular diferentes níveis
    // ==========================================================

    // Para teste, descomente a linha abaixo e comente as outras
    // return 1; // Master
    // return 2; // Visualizador
    // return 3; // Empresa Específica

    // ==========================================================
    // LÓGICA REAL (quando os links estiverem prontos)
    // ==========================================================

    // Busca o token na URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        // Se não tiver token, acesso padrão = Visualizador (NV2)
        return 2;
    }

    // TODO: Descriptografar o token e extrair o nível
    // Por enquanto, retorna 1 para teste
    // const dados = decryptToken(token);
    // return dados.nivel || 0;

    return 1; // Temporário - sempre retorna Master durante desenvolvimento
}

/**
 * Verifica se o usuário tem acesso Master (NV1)
 * @returns {boolean}
 */
function isMaster() {
    return getNivelAcesso() === 1;
}

/**
 * Verifica se o usuário tem acesso Visualizador (NV2)
 * @returns {boolean}
 */
function isVisualizador() {
    return getNivelAcesso() === 2;
}

/**
 * Verifica se o usuário tem acesso de Empresa Específica (NV3)
 * @returns {boolean}
 */
function isEmpresaEspecifica() {
    return getNivelAcesso() === 3;
}

/**
 * Verifica se o usuário pode editar/cadastrar (apenas NV1)
 * @returns {boolean}
 */
function podeEditar() {
    return isMaster();
}

/**
 * Verifica se o usuário pode visualizar (NV1 ou NV2)
 * @returns {boolean}
 */
function podeVisualizar() {
    return isMaster() || isVisualizador();
}


// ========================================================== */
// 3. ELEMENTOS DO DOM                                        */
// ========================================================== */

// Mobile/Tablet
const daysGrid = document.getElementById('days-grid');
const currentMonthYearHeader = document.getElementById('current-month-year');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

// Desktop
const currentMonthYearHeaderDesktop = document.getElementById('current-month-year-desktop');
const prevMonthBtnDesktop = document.getElementById('prev-month-desktop');
const nextMonthBtnDesktop = document.getElementById('next-month-desktop');

const closeModalBtn = document.getElementById('close-modal');
const modal = document.getElementById('activity-modal');


// ========================================================== */
// 4. FUNÇÃO PARA ATUALIZAR TÍTULO EM AMBOS OS CONTROLES     */
// ========================================================== */

function atualizarTituloMes(ano, mes) {
    const texto = `${MESES[mes]} ${ano}`;

    // Atualiza mobile/tablet
    if (currentMonthYearHeader) {
        currentMonthYearHeader.textContent = texto;
    }

    // Atualiza desktop
    if (currentMonthYearHeaderDesktop) {
        currentMonthYearHeaderDesktop.textContent = texto;
    }
}


// ========================================================== */
// 5. FUNÇÕES DE FILTRO                                       */
// ========================================================== */

function filtrarPorContrato(atividadesArray) {
    return atividadesArray.filter(a =>
        a.unidade === contratoAtivo ||
        a.unidade === 'AMBAS' ||
        !a.unidade // se não tiver unidade, mostra em ambos
    );
}





// ========================================================== */
// 7. FUNÇÃO PARA ORDENAR GRUPOS                              */
// ========================================================== */

function getOrdem(empresa) {
    if (empresa === 'ENGEMON') return 2;
    if (empresa === 'HEATINGCOOLING') return 1;
    return 0;
}


// ========================================================== */
// 8. FUNÇÃO PARA CARREGAR DADOS DO FIRESTORE                 */
// ========================================================== */

async function carregarDados() {
    try {
        // ==========================================================
        // 1. CARREGAR ESCALA (PRIMEIRO!)
        // ==========================================================
        if (typeof carregarEscala === 'function') {
            await carregarEscala();
        } else {
            console.warn('⚠️ carregarEscala não disponível');
        }

        // ==========================================================
        // 2. CARREGAR ATIVIDADES
        // ==========================================================
        const snapshotAtividades = await db.collection('atividades').get();
        atividades = [];
        snapshotAtividades.forEach(doc => {
            atividades.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // ==========================================================
        // 3. CARREGAR FERIADOS
        // ==========================================================
        const snapshotFeriados = await db.collection('feriados').get();
        feriados = [];
        snapshotFeriados.forEach(doc => {
            feriados.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // ==========================================================
        // 4. CARREGAR PLANTÃO DO FIRESTORE (se houver)
        // ==========================================================
        try {
            const snapshotPlantao = await db.collection('plantao').get();
            const plantaoData = [];
            snapshotPlantao.forEach(doc => {
                plantaoData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            // Atualiza o plantão no módulo equipes
            if (typeof atualizarPlantao === 'function') {
                atualizarPlantao(plantaoData);
            }
            console.log(`✅ Carregados ${plantaoData.length} dias de plantão do Firebase`);
        } catch (e) {
            // Se não tiver coleção plantao, ignora
            if (typeof atualizarPlantao === 'function') {
                atualizarPlantao([]);
            }
            console.log('ℹ️ Nenhum plantão encontrado no Firebase, usando escala');
        }

        console.log(`✅ Carregadas ${atividades.length} atividades do Firebase`);
        console.log(`✅ Carregados ${feriados.length} feriados do Firebase`);

        renderizarCalendario(currentYear, currentMonth);

    } catch (error) {
        console.error('❌ Erro ao carregar dados do Firebase:', error);
        // Se der erro, tenta carregar do JSON como fallback
        await carregarDadosFallback();
    }
}

// ========================================================== */
// 8.5 FALLBACK - CARREGAR DO JSON (CASO FIREBASE FALHE)     */
// ========================================================== */

async function carregarDadosFallback() {
    try {
        console.log('⚠️ Tentando carregar dados do JSON (fallback)...');
        const response = await fetch('data/dados-teste.json');
        const dados = await response.json();

        atividades = dados.atividades || [];
        feriados = dados.feriados || [];

        console.log(`✅ Carregadas ${atividades.length} atividades do JSON (fallback)`);
        console.log(`✅ Carregados ${feriados.length} feriados do JSON (fallback)`);

        renderizarCalendario(currentYear, currentMonth);

    } catch (error) {
        console.error('❌ Erro ao carregar dados do JSON:', error);
        // Se tudo falhar, renderiza vazio
        atividades = [];
        feriados = [];
        renderizarCalendario(currentYear, currentMonth);
    }
}


// ========================================================== */
// 9. FUNÇÃO PARA RENDERIZAR O CALENDÁRIO                     */
// ========================================================== */

function renderizarCalendario(ano, mes) {
    console.log(`📅 Renderizando: ${MESES[mes]} ${ano} - Contrato: ${contratoAtivo}`);

    // 1. Atualiza título (ambos os controles)
    atualizarTituloMes(ano, mes);

    // 2. Limpa o grid
    daysGrid.innerHTML = '';

    // 3. Primeiro dia do mês (0 = Domingo)
    const primeiroDia = new Date(ano, mes, 1).getDay();

    // 4. Quantos dias tem o mês
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    // 5. Preenche dias vazios antes do primeiro dia
    for (let i = 0; i < primeiroDia; i++) {
        const div = document.createElement('div');
        div.className = 'day empty';
        daysGrid.appendChild(div);
    }

    // 6. Preenche os dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        // Formata a data: YYYY-MM-DD
        const dataString = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

        // Cria o elemento do dia
        const div = document.createElement('div');
        div.className = 'day';
        div.dataset.data = dataString;

        // Número do dia
        const numero = document.createElement('span');
        numero.className = 'day-number';
        numero.textContent = dia;
        div.appendChild(numero);

        // ==========================================================
        // VERIFICA ATIVIDADES E FERIADOS
        // ==========================================================

        // Busca atividades do dia
        const atividadesDoDia = atividades.filter(a => a.data === dataString);
        const atividadesFiltradas = filtrarPorContrato(atividadesDoDia);

        // Busca feriados do dia
        const feriadosDoDia = feriados.filter(f => f.data === dataString);
        const feriadosFiltrados = feriadosDoDia.filter(f =>
            f.unidade === contratoAtivo ||
            f.unidade === 'AMBAS' ||
            !f.unidade
        );

        // ==========================================================
        // INDICADOR DE ATIVIDADES
        // ==========================================================

        if (atividadesFiltradas.length > 0) {
            div.classList.add('has-activity');
            const indicador = document.createElement('span');
            indicador.className = 'activity-indicator';
            indicador.textContent = atividadesFiltradas.length;
            div.appendChild(indicador);
        }

        // ==========================================================
        // FERIADO
        // ==========================================================

        if (feriadosFiltrados.length > 0) {
            div.classList.add('holiday');
            div.title = feriadosFiltrados.map(f => f.descricao).join(', ');
        }

        // ==========================================================
        // EVENTO DE CLIQUE
        // ==========================================================

        div.addEventListener('click', () => {
            console.log(`🖱️ Dia clicado: ${dataString}`);

            // Busca atividades e feriados do dia
            const atividadesDoDia = atividades.filter(a => a.data === dataString);
            const atividadesFiltradas = filtrarPorContrato(atividadesDoDia);

            const feriadosDoDia = feriados.filter(f => f.data === dataString);
            const feriadosFiltrados = feriadosDoDia.filter(f =>
                f.unidade === contratoAtivo ||
                f.unidade === 'AMBAS' ||
                !f.unidade
            );

            // Abre o modal com os dados
            abrirModal(dataString, atividadesFiltradas, feriadosFiltrados);
        });

        daysGrid.appendChild(div);
    }
}


// ========================================================== */
// 10. NAVEGAÇÃO ENTRE MESES                                   */
// ========================================================== */

function navegarMes(direcao) {
    if (direcao === 'prev') {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
    } else {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
    renderizarCalendario(currentYear, currentMonth);
}

// Eventos mobile/tablet
if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => navegarMes('prev'));
if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => navegarMes('next'));

// Eventos desktop
if (prevMonthBtnDesktop) prevMonthBtnDesktop.addEventListener('click', () => navegarMes('prev'));
if (nextMonthBtnDesktop) nextMonthBtnDesktop.addEventListener('click', () => navegarMes('next'));


// ========================================================== */
// 11. EVENTO DO SWITCH                                       */
// ========================================================== */

document.addEventListener('contratoAlterado', function (e) {
    const contrato = e.detail.contrato;
    console.log(`📅 Re-renderizando calendário para: ${contrato}`);

    // ATUALIZA A VARIÁVEL LOCAL
    contratoAtivo = contrato;

    // Re-renderiza com o novo contrato
    renderizarCalendario(currentYear, currentMonth);
});


// ========================================================== */
// 12. MODAL - NÍVEL 1: GRUPOS DO DIA                         */
// ========================================================== */

function abrirModal(dataString, atividadesDoDia, feriadosDoDia) {
    const modal = document.getElementById('activity-modal');
    const modalDateDisplay = document.getElementById('modal-date-display');
    const modalTeamInfo = document.getElementById('modal-team-info');
    const activitiesList = document.getElementById('activities-list');

    // Guarda o estado
    modalState.data = dataString;
    modalState.todasAtividades = atividadesDoDia;
    modalState.feriados = feriadosDoDia;
    modalState.nivel = 1;

    const dataFormatada = dataString.split('-').reverse().join('/');
    modalDateDisplay.textContent = dataFormatada;

    // ========================================================== */
    // MOSTRAR/ESCONDER BOTÃO PDF                                 */
    // ========================================================== */

    const exportPdfBtn = document.getElementById('export-pdf');
    if (atividadesDoDia.length > 0) {
        exportPdfBtn.style.display = 'block';
        exportPdfBtn.onclick = exportarPDF;
    } else {
        exportPdfBtn.style.display = 'none';
    }

    // ==========================================================
    // EXIBIR PLANTÃO DO DIA
    // ==========================================================

    const plantaoDoDia = buscarPlantaoDoDia(dataString);
    const plantaoAtual = getPlantaoAtual();

    modalTeamInfo.innerHTML = '';

    if (plantaoDoDia) {
        let html = '<div class="on-call-container">';

        // Plantão Diurno
        const isDiaAtual = (plantaoAtual && plantaoAtual.data === dataString && plantaoAtual.turno === 'dia');
        html += `
            <div class="on-call-modal ${isDiaAtual ? 'on-call-active' : ''}">
                ☀️ <strong>Plantão Dia: </strong> ${plantaoDoDia.dia}
                ${isDiaAtual ? '<span class="on-call-badge"></span>' : ''}
            </div>
        `;

        // Plantão Noturno
        const isNoiteAtual = (plantaoAtual && plantaoAtual.data === dataString && plantaoAtual.turno === 'noite');
        html += `
            <div class="on-call-modal ${isNoiteAtual ? 'on-call-active' : ''}">
                🌙 <strong>Plantão Noite: </strong> ${plantaoDoDia.noite}
                ${isNoiteAtual ? '<span class="on-call-badge"></span>' : ''}
            </div>
        `;

        html += '</div>';
        modalTeamInfo.innerHTML = html;
    } else {
        modalTeamInfo.innerHTML = '<p class="no-activity" style="padding: 10px 0;">Nenhum plantão cadastrado para este dia.</p>';
    }

    // ==========================================================
    // FERIADOS E GRUPOS
    // ==========================================================

    activitiesList.innerHTML = '';

    // Feriados
    if (feriadosDoDia.length > 0) {
        const feriadoDiv = document.createElement('div');
        feriadoDiv.className = 'activity-item holiday-item';
        feriadoDiv.innerHTML = `
            <h4>📅 Feriado</h4>
            <p>${feriadosDoDia.map(f => f.descricao).join(', ')}</p>
        `;
        activitiesList.appendChild(feriadoDiv);
    }

    // Atividades
    if (atividadesDoDia.length === 0 && feriadosDoDia.length === 0) {
        activitiesList.innerHTML = '<p class="no-activity">Nenhuma atividade agendada neste dia.</p>';
        modal.style.display = 'block';
        return;
    }

    // Agrupa por empresa
    const grupos = {};
    atividadesDoDia.forEach(activity => {
        const empresa = activity.empresa;
        if (!grupos[empresa]) {
            grupos[empresa] = [];
        }
        grupos[empresa].push(activity);
    });

    // Ordena grupos
    const empresasOrdenadas = Object.keys(grupos).sort((a, b) => {
        return getOrdem(b) - getOrdem(a);
    });

    // Renderiza grupos
    empresasOrdenadas.forEach(empresa => {
        const atividadesGrupo = grupos[empresa];

        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'activity-item group-item';
        grupoDiv.style.cursor = 'pointer';
        grupoDiv.innerHTML = `
            <h4>🏢 ${empresa} <span class="badge">${atividadesGrupo.length}</span></h4>
            <p style="color: #888; font-size: 0.85rem;">Clique para ver as atividades</p>
        `;

        grupoDiv.addEventListener('click', () => {
            abrirNivel2(empresa, atividadesGrupo);
        });

        activitiesList.appendChild(grupoDiv);
    });

    modal.style.display = 'block';
}


// ========================================================== */
// 13. MODAL - NÍVEL 2: ATIVIDADES DO GRUPO                   */
// ========================================================== */

function abrirNivel2(empresa, atividades) {
    const activitiesList = document.getElementById('activities-list');
    const modalDateDisplay = document.getElementById('modal-date-display');

    modalState.nivel = 2;

    const dataFormatada = modalState.data.split('-').reverse().join('/');
    modalDateDisplay.textContent = `${dataFormatada} - ${empresa}`;

    activitiesList.innerHTML = '';

    // ==========================================================
    // BOTÃO VOLTAR (USA O ESTADO COMPLETO)
    // ==========================================================

    const btnVoltar = document.createElement('button');
    btnVoltar.className = 'btn-back';
    btnVoltar.textContent = '← Voltar para grupos';
    btnVoltar.addEventListener('click', () => {
        // VOLTA PARA O NÍVEL 1 COM TODAS AS ATIVIDADES
        abrirModal(
            modalState.data,
            modalState.todasAtividades,
            modalState.feriados
        );
    });
    activitiesList.appendChild(btnVoltar);

    // ==========================================================
    // TÍTULO DO GRUPO
    // ==========================================================

    const titulo = document.createElement('h4');
    titulo.style.cssText = 'margin: 15px 0 10px 0; color: #007bff; font-size: 1.1rem;';
    titulo.textContent = `📋 ${empresa} (${atividades.length} atividades)`;
    activitiesList.appendChild(titulo);

    // ==========================================================
    // LISTAR ATIVIDADES (COM TAGS FLUTUANTES NO TOPO)
    // ==========================================================

    atividades.forEach(activity => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.style.cursor = 'pointer';

        // ==========================================================
        // TAGS FLUTUANTES: Periodicidade + Categoria (no topo)
        // ==========================================================

        const periodicidade = activity.periodicidade || '';
        const categoria = activity.categoria || '';

        let tagsHtml = '<div class="tags-container">';

        if (periodicidade) {
            tagsHtml += `<span class="tag tag-periodicidade">${periodicidade}</span>`;
        }

        if (categoria) {
            tagsHtml += `<span class="tag tag-categoria">${categoria}</span>`;
        }

        tagsHtml += '</div>';

        // ==========================================================
        // ESTRUTURA DO ITEM: TAGS NO TOPO, DESCRIÇÃO EMBAIXO
        // ==========================================================

        div.innerHTML = `
        ${tagsHtml}
        <h4 class="activity-description">${activity.descricao}</h4>
    `;

        div.addEventListener('click', () => {
            abrirNivel3(activity);
        });

        activitiesList.appendChild(div);
    });
}


// ========================================================== */
// 14. MODAL - NÍVEL 3: DETALHES DA ATIVIDADE                 */
// ========================================================== */

async function abrirNivel3(activity) {
    const activitiesList = document.getElementById('activities-list');
    const modalDateDisplay = document.getElementById('modal-date-display');

    modalState.nivel = 3;

    modalDateDisplay.textContent = `Detalhes - ${activity.empresa}`;

    activitiesList.innerHTML = '';

    // ========================================================== */
    // BOTÃO VOLTAR (VOLTA PARA O NÍVEL 2)                        */
    // ========================================================== */

    const btnVoltar = document.createElement('button');
    btnVoltar.className = 'btn-back';
    btnVoltar.textContent = '← Voltar para atividades';
    btnVoltar.addEventListener('click', () => {
        const empresa = activity.empresa;
        const atividadesGrupo = modalState.todasAtividades.filter(a => a.empresa === empresa);
        abrirNivel2(empresa, atividadesGrupo);
    });
    activitiesList.appendChild(btnVoltar);

    // ========================================================== */
    // DETALHES DA ATIVIDADE (APENAS DESCRIÇÃO)                   */
    // ========================================================== */

    const detailDiv = document.createElement('div');
    detailDiv.className = 'activity-item detail-item';

    const descricao = activity.descricao || 'Sem descrição';
    detailDiv.innerHTML = `
        <h4>${activity.empresa}</h4>
        <p><strong>Descrição:</strong> ${descricao}</p>
    `;
    activitiesList.appendChild(detailDiv);

    // ========================================================== */
    // OBSERVAÇÕES                                                 */
    // ========================================================== */

    const obsTitle = document.createElement('h5');
    obsTitle.textContent = '📝 Observações:';
    obsTitle.style.cssText = 'margin-top: 20px; margin-bottom: 10px; color: #555;';
    activitiesList.appendChild(obsTitle);

    // Container para observações
    const obsContainer = document.createElement('div');
    obsContainer.id = 'obs-container';
    obsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
    activitiesList.appendChild(obsContainer);

    // ========================================================== */
    // CARREGAR OBSERVAÇÕES DO FIRESTORE                          */
    // ========================================================== */

    try {
        const snapshot = await db.collection('observacoes')
            .where('atividadeId', '==', activity.id)
            .orderBy('dataEnvio', 'desc')
            .get();

        if (snapshot.empty) {
            const noObs = document.createElement('p');
            noObs.textContent = 'Nenhuma observação para esta atividade.';
            noObs.style.cssText = 'color: #888; font-style: italic;';
            obsContainer.appendChild(noObs);
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const obsDiv = document.createElement('div');
                obsDiv.style.cssText = `
                background: #f9f9f9;
                border-left: 3px solid #28a745;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 4px;
            `;

                let dataEnvio = '';
                if (data.dataEnvio) {
                    const dataObj = data.dataEnvio.toDate ? data.dataEnvio.toDate() : new Date(data.dataEnvio);
                    dataEnvio = dataObj.toLocaleString('pt-BR');
                }

                obsDiv.innerHTML = `
                <p style="margin: 0 0 5px 0; font-weight: 600;">📋 Descrição:</p>
                <p style="margin: 0 0 10px 0; font-size: 0.9rem;">${data.descricao || 'N/A'}</p>
                <p style="margin: 0 0 5px 0; font-weight: 600;">🔧 Equipamentos:</p>
                <p style="margin: 0 0 8px 0; font-size: 0.9rem; white-space: pre-line;">${data.equipamentos || 'N/A'}</p>
                ${data.chg ? `<p style="margin: 0 0 8px 0; font-size: 0.85rem; color: #666;">📌 CHG: ${data.chg}</p>` : ''}
                ${data.mopArquivo ? `
                    <p style="margin: 0 0 5px 0; font-weight: 600;">📎 MOP:</p>
                    <p style="margin: 0 0 8px 0;">
                        <a href="/archives/${data.mopArquivo}" target="_blank" 
                           style="color: #007bff; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
                            📄 ${data.mopArquivo}
                        </a>
                    </p>
                ` : ''}
                ${dataEnvio ? `<small style="color: #888;">📅 ${dataEnvio}</small>` : ''}
            `;
                obsContainer.appendChild(obsDiv);
            });
        }
    } catch (error) {
        console.error('❌ Erro ao carregar observações:', error);
        const noObs = document.createElement('p');
        noObs.textContent = 'Erro ao carregar observações.';
        noObs.style.cssText = 'color: #888; font-style: italic;';
        obsContainer.appendChild(noObs);
    }

    // ========================================================== */
    // BOTÃO ADICIONAR OBSERVAÇÃO (APENAS PARA NV1 - MASTER)     */
    // ========================================================== */

   /* if (isMaster() || podeEditar()) {
        const btnAddObs = document.createElement('button');
        btnAddObs.className = 'btn-add-obs';
        btnAddObs.textContent = '+ Adicionar Observação';
        btnAddObs.addEventListener('click', () => {
            const atividadeId = activity.id;
            const empresa = activity.empresa;
            const descricao = activity.descricao;

            const url = `pages/add-observation.html?atividadeId=${atividadeId}&empresa=${encodeURIComponent(empresa)}&descricao=${encodeURIComponent(descricao)}`;
            window.open(url, '_blank');
        });
        activitiesList.appendChild(btnAddObs);
    }*/
    // ========================================================== */
    // BOTÃO ADICIONAR OBSERVAÇÃO (SEM RESTRIÇÃO)                 */
    // ========================================================== */

    const btnAddObs = document.createElement('button');
    btnAddObs.className = 'btn-add-obs';
    btnAddObs.textContent = '+ Adicionar Observação';
    btnAddObs.addEventListener('click', () => {
        const atividadeId = activity.id;
        const empresa = activity.empresa;
        const descricao = activity.descricao;

        const url = `pages/add-observation.html?atividadeId=${atividadeId}&empresa=${encodeURIComponent(empresa)}&descricao=${encodeURIComponent(descricao)}`;
        window.open(url, '_blank');
    });
    activitiesList.appendChild(btnAddObs);
}


// ========================================================== */
// 14. FECHAR MODAL                                           */
// ========================================================== */

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// ========================================================== */
// 15. EXPORTAR PDF DO DIA                                    */
// ========================================================== */

async function exportarPDF() {
    const { jsPDF } = window.jspdf;

    const dataString = modalState.data;
    const atividades = modalState.todasAtividades;
    const feriados = modalState.feriados;

    if (!dataString || atividades.length === 0) {
        alert('⚠️ Nenhuma atividade para exportar neste dia.');
        return;
    }

    const plantaoDoDia = buscarPlantaoDoDia(dataString);

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin + 10;
    const lineHeight = 7;

    // ========================================================== */
    // 1. TÍTULO (sem emoji)
    // ========================================================== */
    doc.setFontSize(16);
    doc.setTextColor(0, 123, 255);
    doc.setFont('helvetica', 'bold');
    const dataFormatada = dataString.split('-').reverse().join('/');
    doc.text(`RELATORIO DE ATIVIDADES - ${dataFormatada}`, margin, y);
    y += lineHeight + 5;

    // ========================================================== */
    // 2. PLANTÃO (sem emoji)
    // ========================================================== */
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    if (plantaoDoDia) {
        doc.text(`Plantao Dia: ${plantaoDoDia.dia}`, margin, y);
        y += lineHeight;
        doc.text(`Plantao Noite: ${plantaoDoDia.noite}`, margin, y);
        y += lineHeight + 3;
    }

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight;

    // ========================================================== */
    // 3. ATIVIDADES POR EMPRESA
    // ========================================================== */
    const grupos = {};
    atividades.forEach(activity => {
        const empresa = activity.empresa;
        if (!grupos[empresa]) grupos[empresa] = [];
        grupos[empresa].push(activity);
    });

    const empresasOrdenadas = Object.keys(grupos).sort();
    let totalAtividades = 0;

    empresasOrdenadas.forEach(empresa => {
        const atividadesEmpresa = grupos[empresa];
        totalAtividades += atividadesEmpresa.length;

        if (y > 260) {
            doc.addPage();
            y = margin + 10;
        }

        // Nome da empresa (sem emoji)
        doc.setFontSize(13);
        doc.setTextColor(0, 123, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(`>> ${empresa}`, margin, y);
        y += lineHeight - 1;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');

        atividadesEmpresa.forEach(activity => {
            if (y > 275) {
                doc.addPage();
                y = margin + 10;
            }

            const periodicidade = activity.periodicidade || '';
            const descricao = activity.descricao || 'Sem descrição';
            const texto = `   - ${descricao}${periodicidade ? ` (${periodicidade})` : ''}`;

            const linhas = doc.splitTextToSize(texto, pageWidth - margin - 20);
            doc.text(linhas, margin + 5, y);
            y += (linhas.length * lineHeight) + 1;
        });

        y += 2;
    });

    // ========================================================== */
    // 4. FERIADOS (se houver)
    // ========================================================== */
    if (feriados && feriados.length > 0) {
        if (y > 260) {
            doc.addPage();
            y = margin + 10;
        }

        doc.setFontSize(12);
        doc.setTextColor(200, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text('Feriados:', margin, y);
        y += lineHeight;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        feriados.forEach(feriado => {
            doc.text(`   - ${feriado.descricao}`, margin + 5, y);
            y += lineHeight;
        });
        y += 3;
    }

    // ========================================================== */
    // 5. RODAPÉ
    // ========================================================== */
    if (y > 270) {
        doc.addPage();
        y = margin + 10;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += lineHeight - 2;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de atividades: ${totalAtividades}`, margin, y);
    y += lineHeight;

    const agora = new Date();
    const dataGeracao = agora.toLocaleDateString('pt-BR');
    const horaGeracao = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${dataGeracao} ${horaGeracao}`, margin, y);

    const nomeArquivo = `atividades_${dataString}.pdf`;
    doc.save(nomeArquivo);
}

// ========================================================== */
// 16. EXPORTA FUNÇÕES PARA OUTROS MÓDULOS                    */
// ========================================================== */

window.renderizarCalendario = renderizarCalendario;
window.currentYear = currentYear;
window.currentMonth = currentMonth;

// ========================================================== */
// 17. INICIALIZAÇÃO                                          */
// ========================================================== */

document.addEventListener('DOMContentLoaded', function () {
    if (typeof db !== 'undefined') {
        carregarDados();
    } else {
        console.warn('⚠️ Firebase não disponível, usando fallback JSON');
        carregarDadosFallback();
    }
});


// ========================================================== */
// 16. EXPORTA FUNÇÕES PARA OUTROS MÓDULOS                    */
// ========================================================== */

window.renderizarCalendario = renderizarCalendario;
window.currentYear = currentYear;
window.currentMonth = currentMonth;


// ========================================================== */
// 17. INICIALIZAÇÃO                                          */
// ========================================================== */

// Aguarda o Firebase carregar antes de buscar os dados
document.addEventListener('DOMContentLoaded', function () {
    // Verifica se o Firebase está disponível
    if (typeof db !== 'undefined') {
        carregarDados();
    } else {
        console.warn('⚠️ Firebase não disponível, usando fallback JSON');
        carregarDadosFallback();
    }
});