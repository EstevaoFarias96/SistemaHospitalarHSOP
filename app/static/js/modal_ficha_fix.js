// Fix JavaScript para resolver problemas com o botão "Salvar Ficha de Referência"

(function() {
    'use strict';
    
    console.log('🔧 Carregando fix para modais de fichas de referência...');
    
    // Aguardar carregamento completo do DOM
    function initializeFix() {
        console.log('🔧 Inicializando fix para botão salvar ficha...');
        
        // Remover todos os event listeners duplicados
        const btnSalvar = document.getElementById('btn_salvar_ficha_referencia');
        if (btnSalvar) {
            console.log('✅ Botão salvar encontrado, aplicando fix...');
            
            // Clonar o botão para remover todos os event listeners
            const newBtn = btnSalvar.cloneNode(true);
            btnSalvar.parentNode.replaceChild(newBtn, btnSalvar);
            
            // Garantir que o botão seja clicável
            newBtn.style.position = 'relative';
            newBtn.style.zIndex = '1070';
            newBtn.style.pointerEvents = 'auto';
            newBtn.style.cursor = 'pointer';
            
            // Adicionar um único event listener limpo
            newBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log('🎯 Clique no botão salvar detectado pelo fix!');
                
                // Verificar se a função existe
                if (typeof salvarFichaReferencia === 'function') {
                    console.log('✅ Função salvarFichaReferencia encontrada, executando...');
                    salvarFichaReferencia();
                } else {
                    console.error('❌ Função salvarFichaReferencia não encontrada!');
                    
                    // Implementação de fallback
                    console.log('🔄 Tentando implementação de fallback...');
                    const dados = {
                        atendimento_id: document.getElementById('atendimento_id')?.value,
                        texto_referencia: document.getElementById('texto_referencia')?.value,
                        procedimento: document.getElementById('procedimento')?.value,
                        unidade_referencia: document.getElementById('unidade_referencia')?.value,
                        encaminhamento_atendimento: getEncaminhamentoSelecionado()
                    };
                    
                    if (!dados.atendimento_id) {
                        alert('Erro: ID de atendimento não encontrado');
                        return;
                    }
                    
                    if (!dados.texto_referencia && !dados.procedimento && !dados.unidade_referencia && !dados.encaminhamento_atendimento) {
                        alert('Por favor, preencha pelo menos um campo da ficha de referência.');
                        return;
                    }
                    
                    // Mostrar indicador de carregamento
                    newBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
                    newBtn.disabled = true;
                    
                    // Enviar requisição
                    fetch('/api/fichas-referencia', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(dados)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Ficha de referência criada com sucesso!');
                            
                            // Limpar formulário
                            const form = document.getElementById('formFichaReferencia');
                            if (form) form.reset();
                            
                            // Fechar modal
                            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovaFichaReferencia'));
                            if (modal) modal.hide();
                            
                            // Recarregar lista se a função existir
                            if (typeof carregarFichasReferencia === 'function') {
                                setTimeout(carregarFichasReferencia, 500);
                            }
                        } else {
                            alert('Erro ao criar ficha: ' + (data.message || 'Erro desconhecido'));
                        }
                    })
                    .catch(error => {
                        console.error('Erro:', error);
                        alert('Erro ao salvar ficha de referência: ' + error.message);
                    })
                    .finally(() => {
                        // Restaurar botão
                        newBtn.innerHTML = '<i class="fas fa-save me-2"></i>Salvar Ficha de Referência';
                        newBtn.disabled = false;
                    });
                }
            });
            
            console.log('✅ Fix aplicado com sucesso ao botão salvar ficha!');
        } else {
            console.warn('⚠️ Botão salvar ficha não encontrado, tentando novamente em 1 segundo...');
            setTimeout(initializeFix, 1000);
        }
    }
    
    // Função auxiliar para obter encaminhamento selecionado
    function getEncaminhamentoSelecionado() {
        const checkboxes = [];
        if (document.getElementById('encaminhamento_ambulatorial')?.checked) {
            checkboxes.push('Ambulatorial');
        }
        if (document.getElementById('encaminhamento_hospitalar')?.checked) {
            checkboxes.push('Hospitalar');
        }
        if (document.getElementById('encaminhamento_auxilio_diagnostico')?.checked) {
            checkboxes.push('Auxilio Diagnostico');
        }
        return checkboxes.join(', ');
    }
    
    // Fix para z-index de modais
    function fixModalZIndex() {
        const modal = document.getElementById('modalNovaFichaReferencia');
        if (modal) {
            modal.style.zIndex = '1055';
            
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.zIndex = '1056';
            }
            
            const modalFooter = modal.querySelector('.modal-footer');
            if (modalFooter) {
                modalFooter.style.zIndex = '1060';
                modalFooter.style.pointerEvents = 'auto';
            }
            
            console.log('✅ Z-index dos modais corrigido');
        }
    }
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                initializeFix();
                fixModalZIndex();
            }, 500);
        });
    } else {
        setTimeout(() => {
            initializeFix();
            fixModalZIndex();
        }, 500);
    }
    
    // Fix adicional para quando o modal for aberto
    document.addEventListener('shown.bs.modal', function(e) {
        if (e.target.id === 'modalNovaFichaReferencia') {
            console.log('🔧 Modal de ficha aberto, aplicando fix adicional...');
            setTimeout(initializeFix, 100);
        }
    });
    
    console.log('✅ Fix para modais de fichas de referência carregado');
})();
