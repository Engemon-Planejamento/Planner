// ========================================================== */
// ADICIONAR OBSERVAÇÃO                                       */
// ========================================================== */

const urlParams = new URLSearchParams(window.location.search);
const atividadeId = urlParams.get('atividadeId');
const empresa = urlParams.get('empresa');
const descricao = urlParams.get('descricao');

document.getElementById('atividade-id').value = atividadeId || '';
document.getElementById('info-empresa').textContent = empresa || 'N/A';
document.getElementById('info-descricao').textContent = descricao || 'N/A';

// ========================================================== */
// SALVAR OBSERVAÇÃO                                          */
// ========================================================== */

const form = document.getElementById('form-observacao');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const descricaoAtividade = document.getElementById('inDescricao').value.trim();
    const equipamentos = document.getElementById('inEquipamentos').value.trim();
    const chg = document.getElementById('inChg').value.trim();
    const mopArquivo = document.getElementById('inMopArquivo').value.trim();

    if (!descricaoAtividade) {
        alert('⚠️ Digite a descrição da atividade');
        document.getElementById('inDescricao').focus();
        return;
    }

    if (!equipamentos) {
        alert('⚠️ Digite os equipamentos');
        document.getElementById('inEquipamentos').focus();
        return;
    }

    if (!atividadeId) {
        alert('❌ Atividade não identificada');
        return;
    }

    // ========================================================== */
    // MONTA OS DADOS                                             */
    // ========================================================== */

    const dados = {
        atividadeId: atividadeId,
        descricao: descricaoAtividade,
        equipamentos: equipamentos,
        dataEnvio: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (chg) dados.chg = chg;
    if (mopArquivo) dados.mopArquivo = mopArquivo;

    // ========================================================== */
    // SALVA NO FIRESTORE                                         */
    // ========================================================== */

    try {
        await db.collection('observacoes').add(dados);
        alert('✅ Observação adicionada com sucesso!');
        setTimeout(() => window.close(), 1000);
    } catch (error) {
        console.error('❌ Erro ao salvar observação:', error);
        alert('❌ Erro ao salvar observação. Tente novamente.');
    }
});