// Arquivo: main.js
// Responsável pelas funções de inicialização e configuração principal

// Variáveis globais
let internacaoId;
let quill;

// Função de inicialização da página
function inicializarPagina() {
    console.log('Inicializando página de evolução do paciente...');
    
    // Obter ID da internação da URL
    const urlParams = new URLSearchParams(window.location.search);
    window.internacaoId = parseInt(urlParams.get('id'), 10);
    
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ou não informado na URL');
        mostrarAlertaGlobal('danger', 'ID de internação inválido ou não informado');
        return;
    }
    
    console.log('ID de internação:', window.internacaoId);
    
    // Inicializar editor Quill se disponível
    inicializarEditor();
    
    // Carregar dados iniciais
    carregarDadosPaciente();
    
    // Configurar tabs
    inicializarTabs();
    
    // Configurar eventos globais
    configurarEventosGlobais();
}

// Função para carregar dados do paciente
function carregarDadosPaciente() {
    if (!window.internacaoId) return;
    
    $.ajax({
        url: `/api/internacoes/${window.internacaoId}/paciente`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.paciente) {
                const paciente = response.paciente;
                
                // Preencher informações do paciente
                $('#paciente-nome').text(paciente.nome || 'Nome não informado');
                $('#paciente-idade').text(paciente.idade ? `${paciente.idade} anos` : 'Idade não informada');
                $('#paciente-prontuario').text(paciente.prontuario || 'Não informado');
                $('#paciente-leito').text(paciente.leito || 'Não informado');
                $('#paciente-data-internacao').text(formatarData(paciente.data_internacao) || 'Não informada');
                
                // Atualizar título da página
                document.title = `Evolução - ${paciente.nome || 'Paciente'}`;
                
                // Atualizar outros campos relacionados
                $('#evolucao_paciente_id').val(paciente.id);
                $('#sae_paciente_id').val(paciente.id);
                $('#prescricao_enfermagem_internacao_id').val(window.internacaoId);
            } else {
                mostrarAlertaGlobal('warning', 'Não foi possível carregar os dados do paciente');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar dados do paciente:', xhr.responseText);
            mostrarAlertaGlobal('danger', 'Erro ao carregar dados do paciente');
        }
    });
}

// Inicializar editor Quill
function inicializarEditor() {
    try {
        if (!document.getElementById('editor-container')) return;
        
        quill = new Quill('#editor-container', {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite a evolução...',
            theme: 'snow'
        });
        
        // Configurar fonte menor por padrão
        quill.root.style.fontSize = '14px';
        quill.root.style.lineHeight = '1.5';
        
        window.quill = quill; // Disponibilizar globalmente
    } catch (error) {
        console.error('Erro ao inicializar o editor Quill:', error);
        criarEditorFallback();
    }
}

// Criar editor de fallback caso o Quill falhe
function criarEditorFallback() {
    $('#editor-container').hide();
    if ($('#fallback-editor').length === 0) {
        $('<textarea class="form-control" rows="6" id="fallback-editor"></textarea>')
            .insertAfter('#editor-container');
    }
}

// Inicializar abas (tabs)
function inicializarTabs() {
    $('.nav-tabs a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
        
        // Salvar a aba atual no sessionStorage
        const tabId = $(this).attr('href').substring(1);
        sessionStorage.setItem('activeTab', tabId);
    });
    
    // Restaurar a última aba ativa
    const activeTab = sessionStorage.getItem('activeTab');
    if (activeTab) {
        $(`.nav-tabs a[href="#${activeTab}"]`).tab('show');
    }
}

// Configurar eventos globais
function configurarEventosGlobais() {
    // Atualizar periodicamente as prescrições e evoluções
    setInterval(() => {
        if (document.hidden) return; // Não atualizar quando a página não estiver visível
        
        if ($('#tab-prescricoes').hasClass('active')) {
            if (typeof carregarPrescricoes === 'function') {
                carregarPrescricoes(window.internacaoId, true);
            }
        }
        
        if ($('#tab-evolucoes').hasClass('active')) {
            if (typeof carregarEvolucoes === 'function') {
                carregarEvolucoes();
            }
        }
    }, 60000); // Atualizar a cada 1 minuto
    
    // Botão de atualização manual
    $('.btn-refresh').on('click', function() {
        const tabId = $(this).data('tab');
        
        if (tabId === 'prescricoes' && typeof carregarPrescricoes === 'function') {
            carregarPrescricoes(window.internacaoId);
        } else if (tabId === 'evolucoes' && typeof carregarEvolucoes === 'function') {
            carregarEvolucoes();
        } else if (tabId === 'evolucoes-enfermagem' && typeof carregarEvolucoesEnfermagem === 'function') {
            carregarEvolucoesEnfermagem();
        } else if (tabId === 'prescricoes-enfermagem' && typeof carregarPrescricoesEnfermagem === 'function') {
            carregarPrescricoesEnfermagem();
        } else if (tabId === 'sae' && typeof carregarSAE === 'function') {
            carregarSAE();
        }
    });
}

// Função para mostrar alerta global
function mostrarAlertaGlobal(tipo, mensagem) {
    const alertaEl = $('#alerta-global');
    
    alertaEl.removeClass('alert-primary alert-success alert-danger alert-warning')
        .addClass(`alert-${tipo}`)
        .html(mensagem)
        .show();
    
    // Esconder após 5 segundos
    setTimeout(() => {
        alertaEl.fadeOut();
    }, 5000);
}

// Inicializar quando o documento estiver pronto
$(document).ready(function() {
    console.log('Documento pronto, inicializando aplicação...');
    inicializarPagina();
}); 