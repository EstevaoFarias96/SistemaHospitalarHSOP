// Arquivo: prescricoes_enfermagem.js
// Responsável pelas funcionalidades relacionadas a prescrições de enfermagem

// Variáveis globais
let quillPrescricaoEnfermagem;

// Função para carregar prescrições de enfermagem
function carregarPrescricoesEnfermagem() {
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ao carregar prescrições de enfermagem:', window.internacaoId);
        $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }

    $.ajax({
        url: `/api/enfermagem/prescricao/${window.internacaoId}`,
        method: 'GET',
        success: function(response) {
            // Separar prescrições de hoje e anteriores
            const hoje = new Date().toISOString().split('T')[0];
            const prescricoesDoDia = [];
            const prescricoesAntigas = [];
            
            if (Array.isArray(response)) {
                response.forEach(presc => {
                    const dataPrescricao = new Date(presc.data_prescricao).toISOString().split('T')[0];
                    if (dataPrescricao === hoje) {
                        prescricoesDoDia.push(presc);
                    } else {
                        prescricoesAntigas.push(presc);
                    }
                });
                
                // Atualizar contador
                $('#contador-prescricoes-antigas').text(prescricoesAntigas.length);
                
                // Renderizar prescrições do dia
                renderizarPrescricoesDoDia(prescricoesDoDia);
                
                // Renderizar prescrições antigas
                renderizarPrescricoesAntigas(prescricoesAntigas);
            } else {
                $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição registrada hoje.</td></tr>');
                $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição anterior registrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar prescrições de enfermagem:', xhr.responseText);
            $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>');
            $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>');
        }
    });
}

// Função para renderizar prescrições do dia atual
function renderizarPrescricoesDoDia(prescricoes) {
    if (prescricoes.length > 0) {
        let htmlDoDia = '';
        prescricoes.forEach(presc => {
            const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            htmlDoDia += `
                <tr>
                    <td>${hora}</td>
                    <td>${presc.enfermeiro_nome || 'Não informado'}</td>
                    <td>
                        <div class="texto-evolucao">
                            ${presc.prescricao || '---'}
                        </div>
                    </td>
                </tr>
            `;
        });
        $('#listaPrescricoesDoDia').html(htmlDoDia);
    } else {
        $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição registrada hoje.</td></tr>');
    }
}

// Função para renderizar prescrições antigas
function renderizarPrescricoesAntigas(prescricoes) {
    if (prescricoes.length > 0) {
        let htmlAntigas = '';
        prescricoes.forEach(presc => {
            const dataFormatada = new Date(presc.data_prescricao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const hora = new Date(presc.data_prescricao).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            htmlAntigas += `
                <tr>
                    <td>${dataFormatada} ${hora}</td>
                    <td>${presc.enfermeiro_nome || 'Não informado'}</td>
                    <td>
                        <div class="texto-evolucao">
                            ${presc.prescricao || '---'}
                        </div>
                    </td>
                </tr>
            `;
        });
        $('#listaPrescricoesAntigas').html(htmlAntigas);
    } else {
        $('#listaPrescricoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma prescrição anterior registrada.</td></tr>');
    }
}

// Filtrar prescrições por data
function filtrarPrescricoesPorData(data) {
    if (!data) {
        // Se não houver data, recarregar todas as prescrições
        carregarPrescricoesEnfermagem();
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/prescricao/${window.internacaoId}?data=${data}`,
        method: 'GET',
        success: function(response) {
            if (Array.isArray(response) && response.length > 0) {
                $('#titulo-prescricoes-hoje').text(`Prescrições de ${new Date(data).toLocaleDateString('pt-BR')}`);
                renderizarPrescricoesDoDia(response);
                $('#antigas-container-prescricao').hide();
            } else {
                $('#listaPrescricoesDoDia').html(`<tr><td colspan="3" class="text-center">Nenhuma prescrição encontrada para ${new Date(data).toLocaleDateString('pt-BR')}.</td></tr>`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao filtrar prescrições por data:', xhr.responseText);
            $('#listaPrescricoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao filtrar prescrições.</td></tr>');
        }
    });
}

// Inicializar editor Quill para prescrição de enfermagem
function inicializarEditorPrescricaoEnfermagem() {
    try {
        if (!document.getElementById('prescricao_enfermagem_editor')) return;
        
        quillPrescricaoEnfermagem = new Quill('#prescricao_enfermagem_editor', {
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['clean']
                ]
            },
            placeholder: 'Digite a prescrição de enfermagem...',
            theme: 'snow'
        });
        
        // Configurar fonte menor por padrão
        quillPrescricaoEnfermagem.root.style.fontSize = '14px';
        quillPrescricaoEnfermagem.root.style.lineHeight = '1.5';
        
        window.quillPrescricaoEnfermagem = quillPrescricaoEnfermagem; // Disponibilizar globalmente
    } catch (error) {
        console.error('Erro ao inicializar o editor Quill para prescrição:', error);
        criarEditorFallbackPrescricao();
    }
}

// Criar editor de fallback caso o Quill falhe
function criarEditorFallbackPrescricao() {
    $('#prescricao_enfermagem_editor').hide();
    if ($('#fallback-editor-prescricao').length === 0) {
        $('<textarea class="form-control" rows="6" id="fallback-editor-prescricao"></textarea>')
            .insertAfter('#prescricao_enfermagem_editor');
    }
}

// Inicialização e configuração dos eventos
$(document).ready(function() {
    // Inicializar editor de prescrição de enfermagem
    inicializarEditorPrescricaoEnfermagem();
    
    // Carregar prescrições de enfermagem
    carregarPrescricoesEnfermagem();
    
    // Handler para salvar prescrição de enfermagem
    $('#btn-salvar-prescricao-enfermagem').click(function() {
        let prescricaoTexto = '';
        
        // Obter o conteúdo do editor Quill se estiver disponível
        if (window.quillPrescricaoEnfermagem) {
            prescricaoTexto = window.quillPrescricaoEnfermagem.root.innerHTML;
            // Salvar no textarea oculto também
            $('#prescricao_enfermagem_texto').val(prescricaoTexto);
        } else if ($('#fallback-editor-prescricao').length > 0) {
            prescricaoTexto = $('#fallback-editor-prescricao').val().trim();
        } else {
            prescricaoTexto = $('#prescricao_enfermagem_texto').val().trim();
        }
        
        if (!prescricaoTexto) {
            alert('Por favor, preencha o texto da prescrição de enfermagem.');
            return;
        }
        
        // Mostrar carregamento
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
        
        // Preparar dados para envio
        const dados = {
            atendimentos_clinica_id: $('#prescricao_enfermagem_internacao_id').val(),
            funcionario_id: parseInt(window.session.user_id),
            prescricao: prescricaoTexto
        };
        
        // Enviar para a API
        $.ajax({
            url: '/api/enfermagem/prescricao',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                // Restaurar botão
                $('#btn-salvar-prescricao-enfermagem').prop('disabled', false).html('Salvar Prescrição');
                
                if (response.success) {
                    // Fechar modal e limpar campos
                    $('#modalPrescricaoEnfermagem').modal('hide');
                    
                    // Limpar o editor
                    if (window.quillPrescricaoEnfermagem) {
                        window.quillPrescricaoEnfermagem.setText('');
                    } else if ($('#fallback-editor-prescricao').length > 0) {
                        $('#fallback-editor-prescricao').val('');
                    }
                    
                    // Recarregar lista de prescrições
                    carregarPrescricoesEnfermagem();
                    
                    // Mostrar mensagem de sucesso
                    alert('Prescrição de enfermagem registrada com sucesso!');
                } else {
                    alert('Erro ao registrar prescrição: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                // Restaurar botão
                $('#btn-salvar-prescricao-enfermagem').prop('disabled', false).html('Salvar Prescrição');
                
                console.error('Erro ao registrar prescrição:', xhr.responseText);
                alert('Erro de comunicação ao tentar registrar prescrição: ' + (xhr.responseJSON?.error || error));
            }
        });
    });
    
    // Configurar filtro por data
    $('#btn-filtrar-data-prescricao').click(function() {
        const data = $('#filtro-data-prescricao').val();
        if (data) {
            filtrarPrescricoesPorData(data);
        } else {
            alert('Por favor, selecione uma data para filtrar.');
        }
    });
    
    // Limpar filtro
    $('#btn-limpar-filtro-prescricao').click(function() {
        $('#filtro-data-prescricao').val('');
        $('#titulo-prescricoes-hoje').text('Prescrições de Hoje');
        carregarPrescricoesEnfermagem();
        // Mostrar container de antigas novamente
        $('#antigas-container-prescricao').show();
    });
}); 