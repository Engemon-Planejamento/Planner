// ==========================================================
// SWITCH DE CONTRATOS - MÓDULO INDEPENDENTE
// ==========================================================

// O contratoAtivo vem do script principal (variável global)
// ou podemos criar uma função para comunicar entre os arquivos

(function() {
    'use strict';
    
    // Elementos do DOM
    const toggle = document.getElementById('contract-toggle');
    const labelTambore = document.getElementById('label-tambore');
    const labelCuritiba = document.getElementById('label-curitiba');
    
    // Função para atualizar as labels
    function atualizarLabels(contrato) {
        if (contrato === 'TAMBORE') {
            labelTambore?.classList.add('active');
            labelCuritiba?.classList.remove('active');
        } else {
            labelTambore?.classList.remove('active');
            labelCuritiba?.classList.add('active');
        }
    }
    
    // Função para alternar o contrato
    function alternarContrato(contrato) {
        // Atualiza a variável global
        window.contratoAtivo = contrato;
        
        // Atualiza labels
        atualizarLabels(contrato);
        
        // Atualiza o checkbox
        if (toggle) {
            toggle.checked = (contrato === 'CURITIBA');
        }
        
        console.log(`🔄 Contrato alterado para: ${contrato}`);
        
        // Dispara um evento personalizado para o script principal
        const evento = new CustomEvent('contratoAlterado', {
            detail: { contrato: contrato }
        });
        document.dispatchEvent(evento);
    }
    
    // Evento do switch
    if (toggle) {
        toggle.addEventListener('change', function() {
            const novoContrato = this.checked ? 'CURITIBA' : 'TAMBORE';
            alternarContrato(novoContrato);
        });
    }
    
    // Inicialização
    function initSwitch() {
        // Estado padrão: TAMBORE
        const contratoInicial = window.contratoAtivo || 'TAMBORE';
        alternarContrato(contratoInicial);
    }
    
    // Aguarda o DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSwitch);
    } else {
        initSwitch();
    }
    
    // EXPORTA FUNÇÕES PARA USO EXTERNO
    window.alternarContrato = alternarContrato;
    window.atualizarLabels = atualizarLabels;
    
})();