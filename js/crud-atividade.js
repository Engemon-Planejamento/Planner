// ========================================================== */
// CRUD - ATIVIDADES                                          */
// ========================================================== */

// ========================================================== */
// 1. ELEMENTOS DO DOM                                        */
// ========================================================== */

const form = document.getElementById('form-atividade');
const inputData = document.getElementById('inData');
const inputEmpresa = document.getElementById('inEmpresa');
const inputDescricao = document.getElementById('inDescricao');
const inputPeriodicidade = document.getElementById('inPeriodicidade');
const inputCategoria = document.getElementById('inCategoria');
const inputGrupo = document.getElementById('inGrupo');
const inputEditId = document.getElementById('edit-id');
const cardsContainer = document.getElementById('cards-container');
const btnCancelar = document.getElementById('btn-cancelar');
const tituloForm = document.getElementById('form-title');

// ========================================================== */
// 2. VARIÁVEIS DE ESTADO                                     */
// ========================================================== */

let atividades = [];
let modoEdicao = false;

// ========================================================== */
// 3. CARREGAR DADOS PARA OS SELECTS                          */
// ========================================================== */

async function carregarSelects() {
    try {
        // Carregar empresas
        const snapshotEmpresas = await db.collection('empresas')
            .orderBy('nome')
            .get();
        
        inputEmpresa.innerHTML = '<option value="">Selecione uma empresa</option>';
        snapshotEmpresas.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.nome;
            option.textContent = data.nome;
            inputEmpresa.appendChild(option);
        });

        // Carregar periodicidades
        const snapshotPeriodicidades = await db.collection('periodicidade')
            .orderBy('nome')
            .get();
        
        inputPeriodicidade.innerHTML = '<option value="">Selecione a periodicidade</option>';
        snapshotPeriodicidades.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.nome;
            option.textContent = data.nome;
            inputPeriodicidade.appendChild(option);
        });

        // Carregar categorias
        const snapshotCategorias = await db.collection('categorias')
            .orderBy('nome')
            .get();
        
        inputCategoria.innerHTML = '<option value="">Selecione a categoria</option>';
        snapshotCategorias.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.nome;
            option.textContent = data.nome;
            inputCategoria.appendChild(option);
        });

        console.log('✅ Selects carregados!');

    } catch (error) {
        console.error('❌ Erro ao carregar selects:', error);
    }
}

// ========================================================== */
// 4. BUSCAR ATIVIDADES                                       */
// ========================================================== */

async function buscarAtividades() {
    try {
        if (cardsContainer) {
            cardsContainer.innerHTML = '<p class="loading-data">⏳ Carregando atividades...</p>';
        }

        const snapshot = await db.collection('atividades')
            .orderBy('data', 'desc')
            .limit(10)
            .get();

        atividades = [];
        snapshot.forEach(doc => {
            atividades.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`✅ Carregadas ${atividades.length} atividades`);
        renderizarCards(atividades);

    } catch (error) {
        console.error('❌ Erro ao buscar atividades:', error);
        if (cardsContainer) {
            cardsContainer.innerHTML = '<p class="no-data">❌ Erro ao carregar atividades</p>';
        }
    }
}

// ========================================================== */
// 5. RENDERIZAR CARDS                                        */
// ========================================================== */

function renderizarCards(lista) {
    if (!cardsContainer) return;

    if (lista.length === 0) {
        cardsContainer.innerHTML = '<p class="no-data">📭 Nenhuma atividade cadastrada</p>';
        return;
    }

    cardsContainer.innerHTML = '';

    lista.forEach(atividade => {
        const card = document.createElement('div');
        card.className = 'card-item';

        card.innerHTML = `
            <div class="card-info">
                <div class="card-title">${atividade.descricao}</div>
                <div class="card-subtitle">
                    📅 ${atividade.data} | 🏢 ${atividade.empresa}
                </div>
                <div class="card-detail">
                    🔄 ${atividade.periodicidade || 'N/A'} | 📂 ${atividade.categoria || 'N/A'}
                </div>
            </div>
            <div class="acoes">
                <button class="btn-editar" data-id="${atividade.id}">✏️ Editar</button>
                <button class="btn-excluir" data-id="${atividade.id}">🗑️ Excluir</button>
            </div>
        `;

        card.querySelector('.btn-editar').addEventListener('click', () => {
            editarAtividade(atividade.id);
        });

        card.querySelector('.btn-excluir').addEventListener('click', () => {
            confirmarExclusao(atividade.id, atividade.descricao);
        });

        cardsContainer.appendChild(card);
    });
}

// ========================================================== */
// 6. SALVAR ATIVIDADE                                        */
// ========================================================== */

async function salvarAtividade(e) {
    e.preventDefault();

    const data = inputData.value;
    const empresa = inputEmpresa.value;
    const descricao = inputDescricao.value.trim();
    const periodicidade = inputPeriodicidade.value;
    const categoria = inputCategoria.value;
    const unidade = document.querySelector('input[name="unidade"]:checked');
    const grupo = inputGrupo.value.trim() || empresa.toUpperCase().replace(/ /g, '_');

    // Validações
    if (!data) {
        alert('⚠️ Selecione uma data');
        inputData.focus();
        return;
    }

    if (!empresa) {
        alert('⚠️ Selecione uma empresa');
        inputEmpresa.focus();
        return;
    }

    if (!descricao) {
        alert('⚠️ Digite a descrição da atividade');
        inputDescricao.focus();
        return;
    }

    if (!periodicidade) {
        alert('⚠️ Selecione a periodicidade');
        inputPeriodicidade.focus();
        return;
    }

    if (!categoria) {
        alert('⚠️ Selecione a categoria');
        inputCategoria.focus();
        return;
    }

    if (!unidade) {
        alert('⚠️ Selecione uma unidade');
        return;
    }

    const dados = {
        data: data,
        empresa: empresa,
        descricao: descricao,
        periodicidade: periodicidade,
        categoria: categoria,
        unidade: unidade.value,
        grupo: grupo
    };

    try {
        if (modoEdicao) {
            const id = inputEditId.value;
            await db.collection('atividades').doc(id).update(dados);
            console.log(`✅ Atividade atualizada: ${descricao}`);
        } else {
            await db.collection('atividades').add({
                ...dados,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Atividade criada: ${descricao}`);
        }

        limparFormulario();
        await buscarAtividades();
        alert('✅ Atividade salva com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao salvar atividade:', error);
        alert('❌ Erro ao salvar atividade. Tente novamente.');
    }
}

// ========================================================== */
// 7. EDITAR ATIVIDADE                                        */
// ========================================================== */

function editarAtividade(id) {
    const atividade = atividades.find(a => a.id === id);

    if (!atividade) {
        alert('❌ Atividade não encontrada');
        return;
    }

    inputData.value = atividade.data;
    inputEmpresa.value = atividade.empresa;
    inputDescricao.value = atividade.descricao;
    inputPeriodicidade.value = atividade.periodicidade || '';
    inputCategoria.value = atividade.categoria || '';
    inputGrupo.value = atividade.grupo || '';

    if (atividade.unidade === 'TAMBORE') {
        document.querySelector('input[name="unidade"][value="TAMBORE"]').checked = true;
    } else if (atividade.unidade === 'CURITIBA') {
        document.querySelector('input[name="unidade"][value="CURITIBA"]').checked = true;
    }

    inputEditId.value = atividade.id;
    modoEdicao = true;
    tituloForm.textContent = '✏️ Editar Atividade';
    btnCancelar.style.display = 'block';

    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// ========================================================== */
// 8. CANCELAR EDIÇÃO                                         */
// ========================================================== */

function limparFormulario() {
    inputData.value = '';
    inputEmpresa.value = '';
    inputDescricao.value = '';
    inputPeriodicidade.value = '';
    inputCategoria.value = '';
    inputGrupo.value = '';
    inputEditId.value = '';
    document.querySelector('input[name="unidade"][value="TAMBORE"]').checked = true;
    modoEdicao = false;
    tituloForm.textContent = 'Nova Atividade';
    btnCancelar.style.display = 'none';
}

function cancelarEdicao() {
    limparFormulario();
}

// ========================================================== */
// 9. EXCLUIR ATIVIDADE                                       */
// ========================================================== */

let atividadeParaExcluir = null;

function confirmarExclusao(id, descricao) {
    atividadeParaExcluir = { id, descricao };
    document.getElementById('confirm-nome').textContent = descricao;
    document.getElementById('confirm-modal').style.display = 'block';
}

async function excluirAtividade() {
    if (!atividadeParaExcluir) return;

    const { id, descricao } = atividadeParaExcluir;

    try {
        await db.collection('atividades').doc(id).delete();
        console.log(`✅ Atividade removida: ${descricao}`);

        document.getElementById('confirm-modal').style.display = 'none';
        atividadeParaExcluir = null;
        await buscarAtividades();

    } catch (error) {
        console.error('❌ Erro ao excluir atividade:', error);
        alert('❌ Erro ao excluir atividade. Tente novamente.');
    }
}

// ========================================================== */
// 10. EVENTOS                                                */
// ========================================================== */

form.addEventListener('submit', salvarAtividade);
btnCancelar.addEventListener('click', cancelarEdicao);

document.getElementById('confirm-yes').addEventListener('click', excluirAtividade);
document.getElementById('confirm-no').addEventListener('click', () => {
    document.getElementById('confirm-modal').style.display = 'none';
    atividadeParaExcluir = null;
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('confirm-modal');
    if (modal && e.target === modal) {
        modal.style.display = 'none';
        atividadeParaExcluir = null;
    }
});

// ========================================================== */
// 11. INICIALIZAÇÃO                                          */
// ========================================================== */

carregarSelects();
buscarAtividades();
console.log('✅ CRUD Atividades carregado!');