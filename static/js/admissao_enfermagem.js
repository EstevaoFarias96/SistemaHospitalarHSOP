// Arquivo: admissao_enfermagem.js
// Responsável por gerenciar a admissão de enfermagem

// Função para carregar admissão de enfermagem
function carregarAdmissaoEnfermagem(internacaoId) {
    if (!internacaoId) {
        console.error('ID da internação não fornecido');
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/admissao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.admissao) {
                // Atualizar texto da admissão
                $('.texto-admissao').html(response.admissao.texto || '');
                
                // Atualizar campo de edição
                $('#admissao_enfermagem').val(response.admissao.texto || '');
                
                // Atualizar informações adicionais
                if (response.admissao.enfermeiro_nome) {
                    $('.texto-admissao').append(`
                        <div class="mt-2 text-muted small">
                            <i class="fas fa-user-nurse me-1"></i> ${response.admissao.enfermeiro_nome}
                            <span class="mx-2">|</span>
                            <i class="fas fa-clock me-1"></i> ${new Date(response.admissao.data_registro).toLocaleString('pt-BR')}
                        </div>
                    `);
                }
            } else {
                $('.texto-admissao').html('<div class="text-muted">Nenhuma admissão de enfermagem registrada para este paciente.</div>');
                $('#admissao_enfermagem').val('');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar admissão:', error);
            $('.texto-admissao').html('<div class="text-danger">Erro ao carregar admissão de enfermagem.</div>');
        }
    });
}

// Função para salvar admissão de enfermagem
function salvarAdmissaoEnfermagem(dados) {
    if (!dados || !dados.texto) {
        console.error('Dados da admissão não fornecidos');
        return;
    }
    
    // Mostrar indicador de carregamento
    $('#btn-salvar-admissao').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
    
    $.ajax({
        url: '/api/enfermagem/admissao',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            if (response.success) {
                // Atualizar a visualização do texto
                $('.texto-admissao').html(dados.texto);
                
                // Adicionar informações do enfermeiro e data
                if (response.enfermeiro_nome) {
                    $('.texto-admissao').append(`
                        <div class="mt-2 text-muted small">
                            <i class="fas fa-user-nurse me-1"></i> ${response.enfermeiro_nome}
                            <span class="mx-2">|</span>
                            <i class="fas fa-clock me-1"></i> ${new Date().toLocaleString('pt-BR')}
                        </div>
                    `);
                }
                
                // Esconder formulário e mostrar texto
                $('#admissao-form-container').hide();
                $('#admissao-texto-container').show();
                
                // Mostrar mensagem de sucesso
                alert('Admissão de enfermagem registrada com sucesso!');
            } else {
                alert('Erro ao registrar admissão: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao salvar admissão:', error);
            alert('Erro ao salvar admissão: ' + error);
        },
        complete: function() {
            // Restaurar botão
            $('#btn-salvar-admissao').prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
        }
    });
}

// Configurar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Carregar admissão inicial se houver ID da internação
    const internacaoId = $('#internacao_id').val();
    if (internacaoId) {
        carregarAdmissaoEnfermagem(internacaoId);
    }
    
    // Handler para botão de editar admissão
    $('#btn-editar-admissao').click(function() {
        // Esconder texto e mostrar formulário
        $('#admissao-texto-container').hide();
        $('#admissao-form-container').show();
        
        // Focar no textarea
        $('#admissao_enfermagem').focus();
    });
    
    // Handler para botão de cancelar edição
    $('#btn-cancelar-admissao').click(function() {
        // Restaurar texto original
        $('#admissao_enfermagem').val($('.texto-admissao').html());
        
        // Esconder formulário e mostrar texto
        $('#admissao-form-container').hide();
        $('#admissao-texto-container').show();
    });
    
    // Handler para botão de salvar admissão
    $('#btn-salvar-admissao').click(function() {
        const texto = $('#admissao_enfermagem').val().trim();
        if (!texto) {
            alert('Por favor, preencha a admissão de enfermagem.');
            return;
        }
        
        const dados = {
            internacao_id: $('#internacao_id').val(),
            enfermeiro_id: window.session.user_id,
            texto: texto
        };
        
        salvarAdmissaoEnfermagem(dados);
    });
}); 