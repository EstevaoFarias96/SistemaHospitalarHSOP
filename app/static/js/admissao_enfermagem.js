/**
 * Módulo para gerenciar a admissão de enfermagem
 */

// Função para configurar os eventos de admissão de enfermagem
function configurarAdmissaoEnfermagem() {
    console.log('Configurando eventos de admissão de enfermagem');

    // Carregar admissão existente ao inicializar
    const internacaoId = $('#internacao_id').val();
    if (internacaoId) {
        carregarAdmissaoEnfermagem(internacaoId);
    }

    // Botão: Editar admissão
    $('#btn-editar-admissao').on('click', function () {
        $('#admissao-texto-container').hide();
        $('#admissao-form-container').show();
        $('#admissao_enfermagem').focus();
    });

    // Botão: Cancelar edição
    $('#btn-cancelar-admissao').on('click', function () {
        const textoOriginal = $('#admissao-texto-container').data('original-texto') || '';
        $('#admissao_enfermagem').val(textoOriginal);
        $('#admissao-form-container').hide();
        $('#admissao-texto-container').show();
    });

    // Botão: Salvar admissão
    $('#btn-salvar-admissao').on('click', function () {
        console.log('Salvando admissão de enfermagem');

        const $btn = $(this);
        const admissaoTexto = $('#admissao_enfermagem').val().trim();
        const internacaoId = $('#internacao_id').val();
        const funcionarioId = $('#usuario_id').val(); // enfermeiro logado

        if (!admissaoTexto) {
            alert('Por favor, preencha o campo de admissão de enfermagem.');
            return;
        }

        if (!internacaoId) {
            alert('Erro ao identificar internação. Recarregue a página.');
            return;
        }

        $btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');

        $.ajax({
            url: '/api/enfermagem/admissao',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                internacao_id: internacaoId,
                admissao_texto: admissaoTexto
            }),
            success: function (response) {
                $btn.prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
        
                if (response.success) {
                    $('.texto-admissao').html(admissaoTexto);
                    $('#admissao-form-container').hide();
                    $('#admissao-texto-container').show();
                    alert('Admissão de enfermagem registrada com sucesso!');
            
                    setTimeout(function () {
                        location.reload();
                    }, 1000);
                } else {
                    alert('Erro: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function (xhr, status, error) {
                console.error('Erro ao salvar admissão:', xhr.responseText);
                $btn.prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
                
                let errorMessage = 'Erro ao salvar admissão';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                } else if (xhr.responseJSON && xhr.responseJSON.erro) {
                    errorMessage = xhr.responseJSON.erro;
                }
                
                alert(errorMessage);
            }
        });
    });
}

// Função para carregar admissão de enfermagem existente
function carregarAdmissaoEnfermagem(internacaoId) {
    if (!internacaoId) {
        console.error('ID da internação não fornecido');
        return;
    }
    
    console.log('Carregando admissão de enfermagem para internação:', internacaoId);
    
    $.ajax({
        url: `/api/enfermagem/admissao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API:', response);
            
            if (response.success && response.admissao) {
                const admissao = response.admissao;
                
                // Atualizar texto da admissão no container
                const textoCompleto = `
                    <div class="admissao-content">
                        ${admissao.admissao_texto}
                    </div>
                    <div class="admissao-info mt-2 text-muted small">
                        <i class="fas fa-user-nurse me-1"></i> ${admissao.enfermeiro_nome}
                        <span class="mx-2">|</span>
                        <i class="fas fa-clock me-1"></i> ${admissao.data_hora}
                    </div>
                `;
                
                $('.texto-admissao').html(textoCompleto);
                
                // Atualizar campo de edição
                $('#admissao_enfermagem').val(admissao.admissao_texto);
                
                // Armazenar texto original
                $('#admissao-texto-container').data('original-texto', admissao.admissao_texto);
            } else {
                $('.texto-admissao').html('<div class="text-muted">Nenhuma admissão de enfermagem registrada para este paciente.</div>');
                $('#admissao_enfermagem').val('');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar admissão:', error);
            
            // Se não encontrou admissão (404), não é erro - apenas não existe ainda
            if (xhr.status === 404) {
                $('.texto-admissao').html('<div class="text-muted">Nenhuma admissão de enfermagem registrada para este paciente.</div>');
                $('#admissao_enfermagem').val('');
            } else {
                $('.texto-admissao').html('<div class="text-danger">Erro ao carregar admissão de enfermagem.</div>');
            }
        }
    });
}

// Executa ao carregar a página
$(document).ready(function () {
    console.log('Inicializando módulo de admissão de enfermagem');
    configurarAdmissaoEnfermagem();
});
