/**
 * Módulo para gerenciar a admissão de enfermagem
 */

// Função para configurar os eventos de admissão de enfermagem
function configurarAdmissaoEnfermagem() {
    console.log('Configurando eventos de admissão de enfermagem');
    
    // Botão para editar admissão
    $('#btn-editar-admissao').on('click', function() {
        // Esconder o texto e mostrar o formulário
        $('#admissao-texto-container').hide();
        $('#admissao-form-container').show();
        
        // Focar no textarea
        $('#admissao_enfermagem').focus();
    });
    
    // Botão para cancelar edição de admissão
    $('#btn-cancelar-admissao').on('click', function() {
        // Restaurar o texto original e esconder o formulário
        const textoOriginal = $('#admissao-texto-container').data('original-texto') || '';
        $('#admissao_enfermagem').val(textoOriginal);
        $('#admissao-form-container').hide();
        $('#admissao-texto-container').show();
    });
    
    // Botão para salvar admissão
    $('#btn-salvar-admissao').on('click', function() {
        console.log('Salvando admissão de enfermagem');
        
        const admissaoText = $('#admissao_enfermagem').val().trim();
        const internacaoId = $('#internacao_id').val();
        
        console.log('Texto:', admissaoText);
        console.log('ID Internação:', internacaoId);
        
        if (!admissaoText) {
            alert('Por favor, preencha o campo de admissão de enfermagem');
            return;
        }
        
        // Desabilitar o botão e mostrar carregamento
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
        
        // Buscar o ID do funcionário atual (enfermeiro logado)
        const funcionarioId = $('#usuario_id').val();
        
        $.ajax({
            url: '/api/enfermagem/admissao',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                atendimentos_clinica_id: internacaoId,
                funcionario_id: funcionarioId,
                texto: admissaoText
            }),
            success: function(response) {
                console.log('Resposta do servidor:', response);
                
                // Restaurar o botão
                $('#btn-salvar-admissao').prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
                
                // Atualizar a visualização do texto
                $('.texto-admissao').html(admissaoText);
                
                // Esconder o formulário e mostrar o texto
                $('#admissao-form-container').hide();
                $('#admissao-texto-container').show();
                
                // Mostrar mensagem de sucesso
                alert('Admissão de enfermagem registrada com sucesso!');
                
                // Recarregar a página para garantir que todos os dados estejam atualizados
                setTimeout(function() {
                    location.reload();
                }, 1000);
            },
            error: function(xhr, status, error) {
                console.error('Erro ao salvar admissão:', xhr.responseText);
                
                // Restaurar o botão
                $('#btn-salvar-admissao').prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
                
                alert('Erro ao salvar admissão: ' + (xhr.responseJSON?.erro || error));
            }
        });
    });
}

// Inicialização quando a página carregar
$(document).ready(function() {
    console.log('Inicializando módulo de admissão de enfermagem');
    configurarAdmissaoEnfermagem();
    
    // Armazenar o texto original para eventual cancelamento
    const textoAdmissao = $('.texto-admissao').html();
    $('#admissao-texto-container').data('original-texto', textoAdmissao);
}); 