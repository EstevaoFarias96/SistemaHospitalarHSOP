// Arquivo: evolucoes_enfermagem.js
// Responsável por gerenciar as evoluções de enfermagem

// Função para carregar evoluções de enfermagem
function carregarEvolucoesEnfermagem() {
    const internacaoId = window.internacaoId;
    if (!internacaoId) {
        console.error('ID da internação não fornecido');
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            // Separar evoluções de hoje e anteriores
            const hoje = new Date().toISOString().split('T')[0];
            const evolucoesDoDia = [];
            const evolucoesAntigas = [];
            
            if (Array.isArray(response)) {
                response.forEach(ev => {
                    const dataEvolucao = new Date(ev.data_evolucao).toISOString().split('T')[0];
                    if (dataEvolucao === hoje) {
                        evolucoesDoDia.push(ev);
                    } else {
                        evolucoesAntigas.push(ev);
                    }
                });
                
                // Atualizar contador
                $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
                
                // Renderizar evoluções do dia
                if (evolucoesDoDia.length > 0) {
                    let htmlDoDia = '';
                    evolucoesDoDia.forEach(ev => {
                        const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        htmlDoDia += `
                            <tr>
                                <td>${hora}</td>
                                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                                <td>
                                    <div class="texto-evolucao">
                                        ${ev.texto || '---'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $('#listaEvolucoesDoDia').html(htmlDoDia);
                } else {
                    $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada hoje.</td></tr>');
                }
                
                // Renderizar evoluções antigas
                if (evolucoesAntigas.length > 0) {
                    let htmlAntigas = '';
                    evolucoesAntigas.forEach(ev => {
                        const dataFormatada = new Date(ev.data_evolucao).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                        const hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        htmlAntigas += `
                            <tr>
                                <td>${dataFormatada} ${hora}</td>
                                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                                <td>
                                    <div class="texto-evolucao">
                                        ${ev.texto || '---'}
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $('#listaEvolucoesAntigas').html(htmlAntigas);
                } else {
                    $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                }
            } else {
                $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada hoje.</td></tr>');
                $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de enfermagem:', xhr.responseText);
            $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
            $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
}

// Função para registrar nova evolução de enfermagem
function registrarEvolucaoEnfermagem(dados) {
    if (!dados) {
        console.error('Dados da evolução não fornecidos');
        return;
    }
    
    $.ajax({
        url: '/api/enfermagem/evolucao',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            if (response.success) {
                // Fechar modal
                $('#modalEnfermagemEvolucao').modal('hide');
                
                // Limpar formulário
                $('#formEvolucaoEnfermagem')[0].reset();
                
                // Recarregar evoluções
                carregarEvolucoesEnfermagem();
                
                // Mostrar mensagem de sucesso
                alert('Evolução registrada com sucesso!');
            } else {
                alert('Erro ao registrar evolução: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao registrar evolução:', error);
            alert('Erro ao registrar evolução: ' + error);
        }
    });
}

// Configurar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Carregar evoluções iniciais
    carregarEvolucoesEnfermagem();
    
    // Handler para submissão do formulário de evolução
    $('#formEvolucaoEnfermagem').on('submit', function(e) {
        e.preventDefault();
        
        const texto = $('#texto_evolucao_enfermagem').val().trim();
        if (!texto) {
            alert('Por favor, preencha o texto da evolução.');
            return;
        }
        
        const dados = {
            internacao_id: $('#internacao_id_evolucao').val(),
            enfermeiro_id: $('#usuario_id').val(),
            texto: texto
        };
        
        registrarEvolucaoEnfermagem(dados);
    });
    
    // Toggle para mostrar/ocultar evoluções antigas
    $('#toggle-evolucoes-antigas').click(function() {
        const container = $('#antigas-container');
        if (container.is(':visible')) {
            container.hide();
            $('#toggle-evolucoes-text').text('Mostrar Antigas');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            container.show();
            $('#toggle-evolucoes-text').text('Ocultar Antigas');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });
}); 