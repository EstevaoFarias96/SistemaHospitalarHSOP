/**
 * Fix para o Modal de Adicionar RN
 * Garante que o modal não feche durante a transição entre abas
 */

// Variável global para controlar o estado do modal
window.modalRNState = {
    isTransitioning: false,
    originalHandlers: null
};

console.log('🔧 Modal RN Fix carregado!');

// Aguardar carregamento completo do DOM
$(document).ready(function() {
    console.log('🔧 Inicializando fix do modal RN...');
    
    // Aguardar Bootstrap e outros scripts carregarem
    setTimeout(function() {
        aplicarFixModalRN();
    }, 1500);
});

function aplicarFixModalRN() {
    console.log('🔧 Aplicando fix do modal RN...');
    
    // Interceptar evento de envio do formulário dos dados do RN
    $(document).off('submit', '#dadosRNForm');
    $(document).on('submit', '#dadosRNForm', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('🔧 MODAL RN FIX: Submit interceptado!');
        
        // Processar dados do RN
        const resultado = processarDadosRN();
        if (resultado === false) {
            return false;
        }
        
        return false;
    });
    
    // Interceptar clique no botão de submit como backup
    $(document).off('click', '#dadosRNForm button[type="submit"]');
    $(document).on('click', '#dadosRNForm button[type="submit"]', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        console.log('🔧 MODAL RN FIX: Clique no botão interceptado!');
        
        // Processar dados do RN
        const resultado = processarDadosRN();
        if (resultado === false) {
            return false;
        }
        
        return false;
    });
    
    // Interceptar eventos de fechamento do modal durante transição
    $(document).off('hide.bs.modal', '#modalAdicionarRN');
    $(document).on('hide.bs.modal', '#modalAdicionarRN', function(e) {
        if (window.modalRNState.isTransitioning) {
            console.log('🔧 MODAL RN FIX: Fechamento bloqueado durante transição');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    });
    
    console.log('🔧 Modal RN Fix aplicado com sucesso!');
}

// Função principal para processar os dados do RN
function processarDadosRN() {
    console.log('=== INICIANDO PROCESSAMENTO RN ===');
    
    // Marcar que estamos em transição
    window.modalRNState.isTransitioning = true;
    
    const nomeRN = $('#nomeRN').val().trim();
    const sexoRN = $('#sexoRN').val();
    const dataNascimentoRN = $('#dataNascimentoRN').val();
    const corRN = $('#corRN').val();
    const pesoRN = $('#pesoRN').val();
    const alturaRN = $('#alturaRN').val();
    
    // Remover validações anteriores
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').remove();
    
    let hasError = false;
    
    // Validações básicas
    if (!nomeRN) {
        $('#nomeRN').addClass('is-invalid');
        $('#nomeRN').after('<div class="invalid-feedback">Nome é obrigatório</div>');
        hasError = true;
    }
    
    if (!sexoRN) {
        $('#sexoRN').addClass('is-invalid');
        $('#sexoRN').after('<div class="invalid-feedback">Sexo é obrigatório</div>');
        hasError = true;
    }
    
    if (!dataNascimentoRN) {
        $('#dataNascimentoRN').addClass('is-invalid');
        $('#dataNascimentoRN').after('<div class="invalid-feedback">Data de nascimento é obrigatória</div>');
        hasError = true;
    }
    
    if (!corRN) {
        $('#corRN').addClass('is-invalid');
        $('#corRN').after('<div class="invalid-feedback">Raça/Cor é obrigatória</div>');
        hasError = true;
    }
    
    // Validar data de nascimento (não pode ser futura)
    if (dataNascimentoRN) {
        const dataHoje = new Date();
        const dataNasc = new Date(dataNascimentoRN);
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        
        if (dataNasc > dataHoje) {
            $('#dataNascimentoRN').addClass('is-invalid');
            $('#dataNascimentoRN').after('<div class="invalid-feedback">A data de nascimento não pode ser no futuro</div>');
            hasError = true;
        } else if (dataNasc < umMesAtras) {
            $('#dataNascimentoRN').addClass('is-invalid');
            $('#dataNascimentoRN').after('<div class="invalid-feedback">Data muito antiga para um RN (máximo 1 mês)</div>');
            hasError = true;
        }
    }
    
    // Validar peso se preenchido
    if (pesoRN && (parseInt(pesoRN) < 500 || parseInt(pesoRN) > 8000)) {
        $('#pesoRN').addClass('is-invalid');
        $('#pesoRN').after('<div class="invalid-feedback">Peso deve estar entre 500g e 8000g</div>');
        hasError = true;
    }
    
    // Validar altura se preenchida
    if (alturaRN && (parseFloat(alturaRN) < 30 || parseFloat(alturaRN) > 70)) {
        $('#alturaRN').addClass('is-invalid');
        $('#alturaRN').after('<div class="invalid-feedback">Altura deve estar entre 30cm e 70cm</div>');
        hasError = true;
    }
    
    if (hasError) {
        // Focar no primeiro campo com erro
        $('.is-invalid').first().focus();
        // Marcar que não estamos mais em transição
        window.modalRNState.isTransitioning = false;
        return false;
    }
    
    // Armazenar dados temporariamente
    const dadosRN = {
        nome: nomeRN,
        sexo: sexoRN,
        data_nascimento: dataNascimentoRN,
        hora_nascimento: $('#horaNascimentoRN').val(),
        peso: pesoRN,
        altura: alturaRN,
        cor: corRN,
        apgar: $('#apgarRN').val(),
        tipo_parto: $('#tipoPartoRN').val(),
        idade_gestacional: $('#idadeGestacionalRN').val(),
        filiacao: $('#filiacaoRN').val(),
        telefone: $('#telefoneRN').val(),
        endereco: $('#enderecoRN').val(),
        bairro: $('#bairroRN').val(),
        municipio: $('#municipioRN').val(),
        observacoes: $('#observacoesRN').val()
    };
    
    sessionStorage.setItem('dadosRN', JSON.stringify(dadosRN));
    console.log('🔧 MODAL RN FIX: Dados salvos:', dadosRN);
    
    // Executar transição de abas
    executarTransicaoAbas();
    
    return true;
}

// Função para executar a transição de abas
function executarTransicaoAbas() {
    console.log('🔧 MODAL RN FIX: Executando transição de abas...');
    
    try {
        // Método 1: Tentar usar Bootstrap 5 Tab API
        const tabInternacao = document.querySelector('#internacao-rn-tab');
        if (tabInternacao && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            // Remover classe disabled da próxima aba
            tabInternacao.classList.remove('disabled');
            tabInternacao.removeAttribute('disabled');
            
            // Usar API do Bootstrap 5
            const tab = new bootstrap.Tab(tabInternacao);
            tab.show();
            
            console.log('🔧 MODAL RN FIX: Transição via Bootstrap 5 Tab API concluída');
            
            // Marcar que a transição foi concluída
            setTimeout(() => {
                window.modalRNState.isTransitioning = false;
                mostrarMensagemSucesso();
            }, 100);
            
            return;
        }
    } catch (error) {
        console.warn('🔧 MODAL RN FIX: Erro na API do Bootstrap, usando método manual:', error);
    }
    
    // Método 2: Transição manual
    console.log('🔧 MODAL RN FIX: Usando método manual para transição');
    
    setTimeout(() => {
        // Remover classe disabled da próxima aba
        $('#internacao-rn-tab').removeClass('disabled').removeAttr('disabled');
        
        // Esconder aba atual
        $('#dados-rn').removeClass('show active');
        $('#dados-rn-tab').removeClass('active').attr('aria-selected', 'false');
        
        // Mostrar próxima aba
        $('#internacao-rn').addClass('show active');
        $('#internacao-rn-tab').addClass('active').attr('aria-selected', 'true');
        
        console.log('🔧 MODAL RN FIX: Transição manual concluída');
        
        // Marcar que a transição foi concluída
        window.modalRNState.isTransitioning = false;
        
        mostrarMensagemSucesso();
    }, 200);
}

// Função para mostrar mensagem de sucesso
function mostrarMensagemSucesso() {
    setTimeout(function() {
        alert('✅ Dados do RN salvos com sucesso!\n\nAgora preencha os dados da internação.');
    }, 300);
}
} 