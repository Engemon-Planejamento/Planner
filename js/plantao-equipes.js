// ========================================================== */
// EQUIPES - LÓGICA DE PLANTÃO E ESCALA                       */
// ========================================================== */

// ========================================================== */
// 1. VARIÁVEIS DE ESTADO                                     */
// ========================================================== */

let escala = [];
let plantao = [];

// ========================================================== */
// 2. FUNÇÃO PARA CARREGAR ESCALA TAMBORÉ                     */
// ========================================================== */

async function carregarEscala() {
    try {
        const response = await fetch('data/escala-tambore.json');
        const dados = await response.json();
        escala = dados.escalas || [];
        console.log(`✅ Carregada escala TAMBORÉ: ${escala.length} semanas`);
        return escala;
    } catch (error) {
        console.error('❌ Erro ao carregar escala:', error);
        escala = [];
        return [];
    }
}

// ========================================================== */
// 3. FUNÇÃO PARA BUSCAR PLANTÃO DO DIA                       */
// ========================================================== */

function buscarPlantaoDoDia(dataString) {
    console.log('🔍 Buscando plantão para:', dataString);
    
    // 1. Tenta buscar no banco de dados (plantao)
    if (typeof plantao !== 'undefined' && plantao.length > 0) {
        const plantaoDoDia = plantao.find(p => p.data === dataString);
        if (plantaoDoDia) {
            console.log('✅ Encontrado no plantao:', plantaoDoDia);
            return {
                dia: plantaoDoDia.onCallDia || 'Não informado',
                noite: plantaoDoDia.onCallNoite || 'Não informado'
            };
        }
    }

    // 2. Calcula pela escala
    const data = new Date(dataString + 'T00:00:00');
    const diaSemana = data.getDay();
    const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const nomeDia = dias[diaSemana];

    const semanaDoAno = getSemanaDoAno(data);
    const semanaEscala = (semanaDoAno % 2 === 0) ? 0 : 1;

    console.log('📅 Dia:', nomeDia, 'Semana:', semanaDoAno, 'Índice:', semanaEscala);

    if (escala.length > semanaEscala) {
        const escalaSemana = escala[semanaEscala];
        if (escalaSemana.dias && escalaSemana.dias[nomeDia]) {
            const plantaoEscala = escalaSemana.dias[nomeDia];
            console.log('✅ Encontrado na escala:', plantaoEscala);
            return {
                dia: plantaoEscala.dia || 'Não informado',
                noite: plantaoEscala.noite || 'Não informado'
            };
        }
    }

    console.log('❌ Nenhum plantão encontrado');
    return null;
}

// ========================================================== */
// 4. FUNÇÃO AUXILIAR: FORMATAR DATA                          */
// ========================================================== */

function formatarData(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

// ========================================================== */
// 5. FUNÇÃO PARA CALCULAR SEMANA DO ANO                      */
// ========================================================== */

// ========================================================== */
// 5. FUNÇÃO PARA CALCULAR SEMANA DO ANO (CORRIGIDA)          */
// ========================================================== */

function getSemanaDoAno(data) {
    // Obtém o primeiro dia do ano
    const inicioAno = new Date(data.getFullYear(), 0, 1);
    
    // Calcula o número de dias desde o início do ano
    const diff = (data - inicioAno) / (24 * 60 * 60 * 1000);
    
    // Ajusta para considerar que a semana começa na segunda-feira
    // e a primeira semana do ano é a que contém 4 de janeiro
    const diaSemanaInicio = inicioAno.getDay(); // 0 = Domingo, 1 = Segunda...
    
    // Ajuste: considera segunda-feira como início da semana
    const ajuste = (diaSemanaInicio === 0) ? 6 : diaSemanaInicio - 1;
    
    // Calcula a semana
    const semana = Math.ceil((diff + ajuste + 1) / 7);
    
    return semana;
}

// ========================================================== */
// 6. FUNÇÃO PARA IDENTIFICAR PLANTÃO ATUAL                   */
// ========================================================== */

function getPlantaoAtual() {
    const agora = new Date();
    const hora = agora.getHours();
    
    let dataReferencia;
    let turno;
    
    if (hora >= 0 && hora < 6) {
        const diaAnterior = new Date(agora);
        diaAnterior.setDate(diaAnterior.getDate() - 1);
        dataReferencia = formatarData(diaAnterior);
        turno = 'noite';
    } else if (hora >= 6 && hora < 18) {
        dataReferencia = formatarData(agora);
        turno = 'dia';
    } else {
        dataReferencia = formatarData(agora);
        turno = 'noite';
    }
    
    const plantao = buscarPlantaoDoDia(dataReferencia);
    
    if (plantao) {
        return {
            data: dataReferencia,
            turno: turno,
            equipe: turno === 'dia' ? plantao.dia : plantao.noite,
            dia: plantao.dia,
            noite: plantao.noite
        };
    }
    
    return null;
}

// ========================================================== */
// 7. FUNÇÃO PARA ATUALIZAR OS DADOS DE PLANTÃO              */
// ========================================================== */

function atualizarPlantao(novoPlantao) {
    plantao = novoPlantao || [];
}

// ========================================================== */
// 8. EXPORTA FUNÇÕES                                         */
// ========================================================== */

window.carregarEscala = carregarEscala;
window.buscarPlantaoDoDia = buscarPlantaoDoDia;
window.getPlantaoAtual = getPlantaoAtual;
window.formatarData = formatarData;
window.getSemanaDoAno = getSemanaDoAno;
window.atualizarPlantao = atualizarPlantao;

console.log('✅ Módulo de Equipes carregado!');