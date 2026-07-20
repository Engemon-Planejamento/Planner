// ========================================================== */
// CRUD - EMPRESAS (FIREBASE REAL)                            */
// ========================================================== */

// ========================================================== */
// 1. ELEMENTOS DO DOM                                        */
// ========================================================== */

const form = document.getElementById('form-empresa');
const inputNome = document.getElementById('inEmpresa');
const inputEditId = document.getElementById('edit-id');
const radioTambore = document.getElementById('radio-tambore');
const radioCuritiba = document.getElementById('radio-curitiba');
const cardsContainer = document.getElementById('cards-container');
const btnCancelar = document.getElementById('btn-cancelar');
const tituloForm = document.getElementById('form-title');

// ========================================================== */
// 2. VARIÁVEIS DE ESTADO                                     */
// ========================================================== */

let empresas = [];
let modoEdicao = false;
let empresaParaExcluir = null;

// ========================================================== */
// 3. BUSCAR EMPRESAS DO FIRESTORE                            */
// ========================================================== */

async function buscarEmpresas() {
    try {
        if (cardsContainer) {
            cardsContainer.innerHTML = '<p class="loading-data">⏳ Carregando empresas...</p>';
        }
        
        // Busca no Firestore
        const snapshot = await db.collection('empresas')
            .orderBy('nome')
            .get();
        
        empresas = [];
        snapshot.forEach(doc => {
            empresas.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Carregadas ${empresas.length} empresas do Firebase`);
        renderizarCards(empresas);
        
    } catch (error) {
        console.error('❌ Erro ao buscar empresas:', error);
        if (cardsContainer) {
            cardsContainer.innerHTML = '<p class="no-data">❌ Erro ao carregar empresas</p>';
        }
    }
}

// ========================================================== */
// 4. RENDERIZAR CARDS                                        */
// ========================================================== */

function renderizarCards(lista) {
    if (!cardsContainer) return;
    
    if (lista.length === 0) {
        cardsContainer.innerHTML = '<p class="no-data">📭 Nenhuma empresa cadastrada</p>';
        return;
    }
    
    cardsContainer.innerHTML = '';
    
    lista.forEach(empresa => {
        const card = document.createElement('div');
        card.className = 'card-item';
        
        const unidades = empresa.unidade || 'Não definida';
        
        card.innerHTML = `
            <div class="card-info">
                <div class="card-title">${empresa.nome}</div>
                <div class="card-subtitle">📍 ${unidades}</div>
            </div>
            <div class="acoes">
                <button class="btn-editar" data-id="${empresa.id}">✏️ Editar</button>
                <button class="btn-excluir" data-id="${empresa.id}">🗑️ Excluir</button>
            </div>
        `;
        
        card.querySelector('.btn-editar').addEventListener('click', () => {
            editarEmpresa(empresa.id);
        });
        
        card.querySelector('.btn-excluir').addEventListener('click', () => {
            confirmarExclusao(empresa.id, empresa.nome);
        });
        
        cardsContainer.appendChild(card);
    });
}

// ========================================================== */
// 5. SALVAR EMPRESA (CREATE / UPDATE)                        */
// ========================================================== */

async function salvarEmpresa(e) {
    if (e) e.preventDefault();
    
    if (!inputNome) return;
    
    const nome = inputNome.value.trim();
    const unidade = document.querySelector('input[name="unidade"]:checked');
    
    if (!nome) {
        alert('⚠️ Digite o nome da empresa');
        if (inputNome) inputNome.focus();
        return;
    }
    
    if (!unidade) {
        alert('⚠️ Selecione uma unidade');
        return;
    }
    
    const dados = {
        nome: nome,
        unidade: unidade.value
    };
    
    try {
        if (modoEdicao) {
            // ===== UPDATE =====
            const id = inputEditId.value;
            await db.collection('empresas').doc(id).update(dados);
            console.log(`✅ Empresa atualizada: ${nome}`);
        } else {
            // ===== CREATE =====
            await db.collection('empresas').add({
                ...dados,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Empresa criada: ${nome}`);
        }
        
        limparFormulario();
        await buscarEmpresas();
        
    } catch (error) {
        console.error('❌ Erro ao salvar empresa:', error);
        alert('❌ Erro ao salvar empresa. Tente novamente.');
    }
}

// ========================================================== */
// 6. EDITAR EMPRESA                                          */
// ========================================================== */

function editarEmpresa(id) {
    const empresa = empresas.find(e => e.id === id);
    
    if (!empresa) {
        alert('❌ Empresa não encontrada');
        return;
    }
    
    if (inputNome) {
        inputNome.value = empresa.nome;
        inputEditId.value = empresa.id;
        
        if (empresa.unidade === 'TAMBORE') {
            if (radioTambore) radioTambore.checked = true;
        } else if (empresa.unidade === 'CURITIBA') {
            if (radioCuritiba) radioCuritiba.checked = true;
        }
        
        modoEdicao = true;
        if (tituloForm) tituloForm.textContent = '✏️ Editar Empresa';
        if (btnCancelar) btnCancelar.style.display = 'block';
        
        const formSection = document.querySelector('.form-section');
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        window.location.href = `register-company.html?id=${id}`;
    }
}

// ========================================================== */
// 7. CANCELAR EDIÇÃO                                         */
// ========================================================== */

function limparFormulario() {
    if (inputNome) inputNome.value = '';
    if (inputEditId) inputEditId.value = '';
    if (radioTambore) radioTambore.checked = true;
    modoEdicao = false;
    if (tituloForm) tituloForm.textContent = 'Nova Empresa';
    if (btnCancelar) btnCancelar.style.display = 'none';
}

function cancelarEdicao() {
    limparFormulario();
}

// ========================================================== */
// 8. EXCLUIR EMPRESA                                         */
// ========================================================== */

function confirmarExclusao(id, nome) {
    empresaParaExcluir = { id, nome };
    const confirmNome = document.getElementById('confirm-nome');
    const confirmModal = document.getElementById('confirm-modal');
    
    if (confirmNome) confirmNome.textContent = nome;
    if (confirmModal) confirmModal.style.display = 'block';
}

async function excluirEmpresa() {
    if (!empresaParaExcluir) return;
    
    const { id, nome } = empresaParaExcluir;
    
    try {
        await db.collection('empresas').doc(id).delete();
        console.log(`✅ Empresa removida: ${nome}`);
        
        const confirmModal = document.getElementById('confirm-modal');
        if (confirmModal) confirmModal.style.display = 'none';
        empresaParaExcluir = null;
        
        await buscarEmpresas();
        
    } catch (error) {
        console.error('❌ Erro ao excluir empresa:', error);
        alert('❌ Erro ao excluir empresa. Tente novamente.');
    }
}

// ========================================================== */
// 9. EVENTOS                                                 */
// ========================================================== */

if (form) {
    form.addEventListener('submit', salvarEmpresa);
}

if (btnCancelar) {
    btnCancelar.addEventListener('click', cancelarEdicao);
}

const confirmYes = document.getElementById('confirm-yes');
if (confirmYes) {
    confirmYes.addEventListener('click', excluirEmpresa);
}

const confirmNo = document.getElementById('confirm-no');
if (confirmNo) {
    confirmNo.addEventListener('click', () => {
        const modal = document.getElementById('confirm-modal');
        if (modal) modal.style.display = 'none';
        empresaParaExcluir = null;
    });
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('confirm-modal');
    if (modal && e.target === modal) {
        modal.style.display = 'none';
        empresaParaExcluir = null;
    }
});

// ========================================================== */
// 10. INICIALIZAÇÃO                                          */
// ========================================================== */

buscarEmpresas();
console.log('✅ CRUD Empresas carregado (Firebase Real)!');