/**
 * Módulo para gerenciar as evoluções de enfermagem
 */

// Função para configurar evoluções de enfermagem
function configurarEvolucoesEnfermagem() {
    // Inicialmente esconder o botão de limpar filtro
    $('#btn-limpar-filtro').hide();
    
    // Botão para filtrar evoluções por data
    $('#btn-filtrar-data').click(function() {
        const dataFiltro = $('#filtro-data').val();
        if (dataFiltro) {
            carregarEvolucoesEnfermagem(dataFiltro);
            // Mostrar botão limpar e esconder toggle quando filtrando
            $('#btn-limpar-filtro').show();
            $('#toggle-evolucoes-antigas').hide();
        } else {
            alert('Selecione uma data para filtrar');
        }
    });
    
    // Botão para limpar filtro
    $('#btn-limpar-filtro').click(function() {
        $('#filtro-data').val('');
        carregarEvolucoesEnfermagem();
        // Restaurar a visualização normal
        $('#btn-limpar-filtro').hide();
        $('#toggle-evolucoes-antigas').show();
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
    
    // Preparar o modal quando for aberto
    $('#modalEnfermagemEvolucao').on('shown.bs.modal', function() {
        console.log('Modal aberto, focando no textarea');
        // Esconder o div do editor Quill que está causando problemas
        $('#editor-container-enfermagem').hide();
        // Mostrar o textarea e focar nele
        $('#texto_evolucao_enfermagem').show().css({
            'width': '100%',
            'min-height': '300px',
            'font-size': '14px'
        }).focus();
    });
    
    // Verificar se o formulário já tem um handler de submit
    // Se já tiver, não configurar outro para evitar submissões duplicadas
    if ($._data($('#formEvolucaoEnfermagem')[0], 'events') === undefined ||
        !$._data($('#formEvolucaoEnfermagem')[0], 'events').submit) {
        
        console.log('[evolucoes_enfermagem.js] Configurando handler de submit para #formEvolucaoEnfermagem');
        
        // Handler para submissão de nova evolução de enfermagem
        $('#formEvolucaoEnfermagem').submit(function(e) {
            e.preventDefault();
            
            // Usar apenas o textarea simples
            const evolucaoTexto = $('#texto_evolucao_enfermagem').val().trim();
            if (!evolucaoTexto) {
                alert('Por favor, preencha o texto da evolução.');
                return;
            }
            
            // Desabilitar o botão e mostrar carregamento
            const submitBtn = $(this).find('button[type="submit"]');
            submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
            
            // Obter ID da internação do campo hidden ou variável global
            const internacaoIdValor = $('#internacao_id_evolucao').val() || internacaoId;
            
            // Obter ID do usuário
            const usuarioIdValor = $('#usuario_id').val() || 0;
            
            console.log('Enviando nova evolução:', {
                atendimentos_clinica_id: internacaoIdValor,
                funcionario_id: usuarioIdValor
            });
            
            $.ajax({
                url: '/api/enfermagem/evolucao',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    atendimentos_clinica_id: parseInt(internacaoIdValor, 10),
                    funcionario_id: parseInt(usuarioIdValor, 10),
                    texto: evolucaoTexto
                }),
                success: function(response) {
                    // Restaurar o botão
                    submitBtn.prop('disabled', false).html('Registrar Evolução');
                    
                    alert('Evolução de enfermagem registrada com sucesso!');
                    $('#modalEnfermagemEvolucao').modal('hide');
                    
                    // Limpar o textarea
                    $('#texto_evolucao_enfermagem').val('');
                    
                    // Recarregar evoluções
                    carregarEvolucoesEnfermagem();
                },
                error: function(xhr, status, error) {
                    // Restaurar o botão
                    submitBtn.prop('disabled', false).html('Registrar Evolução');
                    
                    console.error('Erro ao registrar evolução:', xhr.responseText);
                    alert('Erro ao registrar evolução: ' + (xhr.responseJSON?.erro || error));
                }
            });
        });
    } else {
        console.log('[evolucoes_enfermagem.js] Handler de submit já configurado para #formEvolucaoEnfermagem. Não será configurado novamente.');
    }
}

// Função para carregar evoluções de enfermagem com suporte a filtro de data
function carregarEvolucoesEnfermagem(dataFiltro = null) {
    // Garantir que temos um valor válido para internacaoId
    let idInternacao;
    
    // Tentar obter o ID da internação de diferentes fontes
    if (typeof internacaoId !== 'undefined' && internacaoId) {
        idInternacao = internacaoId;
        console.log('carregarEvolucoesEnfermagem: usando ID de internação da variável global =', idInternacao);
    } else {
        // Tentar obter do campo hidden no formulário
        idInternacao = $('#internacao_id_evolucao').val() || $('#internacao_id').val();
        console.log('carregarEvolucoesEnfermagem: usando ID de internação do campo hidden =', idInternacao);
    }
    
    if (!idInternacao) {
        console.error('Erro: ID de internação não encontrado para carregar evoluções');
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação não disponível</td></tr>');
        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação não disponível</td></tr>');
        return;
    }
    
    // Converter para número se for uma string
    idInternacao = parseInt(idInternacao, 10);
    if (isNaN(idInternacao)) {
        console.error('Erro: ID de internação inválido:', idInternacao);
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    console.log('Carregando evoluções de enfermagem com ID:', idInternacao);
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${idInternacao}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API de evoluções recebida:', { 
                tipo: Array.isArray(response) ? 'array' : typeof response,
                tamanho: Array.isArray(response) ? response.length : 'N/A',
                amostra: Array.isArray(response) && response.length > 0 ? response[0] : response
            });
            
            // Definir hoje ou a data filtrada
            const hoje = dataFiltro ? dataFiltro : new Date().toISOString().split('T')[0];
            const evolucoesDoDia = [];
            const evolucoesAntigas = [];
            const tabelaHoje = $('#listaEvolucoesDoDia');
            const tabelaAntigas = $('#listaEvolucoesAntigas');
            
            if (Array.isArray(response)) {
                // Ordenar todas as evoluções por data (mais recentes primeiro)
                response.sort((a, b) => {
                    return new Date(b.data_evolucao) - new Date(a.data_evolucao);
                });
                
                response.forEach(ev => {
                    // Garantir que a data esteja no formato correto
                    if (ev.data_evolucao) {
                        try {
                            // Corrigir o timezone se necessário (evitar problemas com UTC vs local)
                            const dataObj = new Date(ev.data_evolucao);
                            // Extrair a data no formato ISO (YYYY-MM-DD)
                            const dataEvolucao = dataObj.toISOString().split('T')[0];
                            
                            if (dataEvolucao === hoje) {
                                evolucoesDoDia.push({
                                    ...ev,
                                    dataObj: dataObj // Guardar o objeto Date para uso posterior
                                });
                            } else {
                                // Se temos filtro de data, não mostrar evoluções antigas
                                if (!dataFiltro) {
                                    evolucoesAntigas.push({
                                        ...ev,
                                        dataObj: dataObj // Guardar o objeto Date para uso posterior
                                    });
                                }
                            }
                        } catch (e) {
                            console.error('Erro ao processar data da evolução:', e, ev);
                        }
                    }
                });
                
                // Atualizar contador
                $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
                
                // Atualizar título com a data filtrada se necessário
                if (dataFiltro) {
                    const dataFormatada = new Date(dataFiltro + 'T00:00:00').toLocaleDateString('pt-BR');
                    $('#titulo-evolucoes-hoje').text(`Evoluções de ${dataFormatada}`);
                    // Esconder seção de evoluções antigas quando filtrado
                    $('#antigas-container').hide();
                } else {
                    $('#titulo-evolucoes-hoje').text('Evoluções de Hoje');
                }
                
                // Renderizar evoluções do dia
                if (evolucoesDoDia.length > 0) {
                    let htmlDoDia = '';
                    evolucoesDoDia.forEach(ev => {
                        // Formatar hora garantindo formato consistente
                        const hora = ev.dataObj.toLocaleTimeString('pt-BR', {
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
                    tabelaHoje.html(htmlDoDia);
                } else {
                    tabelaHoje.html(`<tr><td colspan="3" class="text-center">
                        Nenhuma evolução registrada ${dataFiltro ? 'nesta data' : 'hoje'}.
                    </td></tr>`);
                }
                
                // Renderizar evoluções antigas (apenas quando não tiver filtro)
                if (!dataFiltro) {
                    if (evolucoesAntigas.length > 0) {
                        let htmlAntigas = '';
                        evolucoesAntigas.forEach(ev => {
                            // Formatar data e hora garantindo formato consistente
                            const dataFormatada = ev.dataObj.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            });
                            const hora = ev.dataObj.toLocaleTimeString('pt-BR', {
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
                        tabelaAntigas.html(htmlAntigas);
                    } else {
                        tabelaAntigas.html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                    }
                }
                
                // Calcular o número de linhas e aplicar o atributo data-lines
                setTimeout(() => {
                    $('.texto-evolucao').each(function() {
                        const texto = $(this).text();
                        const linhas = texto.split(/\r\n|\r|\n/).length;
                        const palavras = texto.split(/\s+/).length;
                        
                        // Estimar o número de linhas com base no tamanho do texto
                        let estimativaLinhas = Math.max(linhas, Math.ceil(palavras / 15));
                        
                        // Limitar a no máximo 22 para não criar muitas regras CSS
                        estimativaLinhas = Math.min(estimativaLinhas, 22);
                        
                        // Aplicar o atributo data-lines ao elemento
                        $(this).attr('data-lines', estimativaLinhas);
                    });
                }, 100);
                
                // Ocultar evoluções antigas por padrão se houver evoluções de hoje e não tiver filtro
                if (evolucoesDoDia.length > 0 && !dataFiltro) {
                    $('#antigas-container').hide();
                    $('#toggle-evolucoes-text').text('Mostrar Antigas');
                    $('#toggle-evolucoes-antigas').find('i').removeClass('fa-eye-slash').addClass('fa-eye');
                }
            } else {
                console.log('Nenhuma evolução de enfermagem encontrada');
                tabelaHoje.html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada.</td></tr>');
                tabelaAntigas.html('<tr><td colspan="3" class="text-center">Nenhuma evolução anterior registrada.</td></tr>');
                $('#contador-evolucoes-antigas').text('0');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de enfermagem:', {
                status: status,
                errorMessage: error,
                responseText: xhr.responseText,
                statusCode: xhr.status,
                url: `/api/enfermagem/evolucao/${idInternacao}`
            });
            
            $('#listaEvolucoesDoDia').html(`<tr><td colspan="3" class="text-center text-danger">
                Erro ao carregar evoluções de enfermagem: ${error}<br>
                Status: ${status}<br>
                Código: ${xhr.status}
            </td></tr>`);
            
            $('#listaEvolucoesAntigas').html(`<tr><td colspan="3" class="text-center text-danger">
                Erro ao carregar evoluções de enfermagem: ${error}
            </td></tr>`);
            
            // Tentar novamente automaticamente apenas uma vez se for erro 404 ou 500
            if (xhr.status === 404 || xhr.status === 500) {
                console.log("Tentando carregar evoluções de enfermagem novamente após erro " + xhr.status);
                setTimeout(function() {
                    console.log("Recarregando após o erro...");
                    // Vamos esperar um tempo maior para garantir que a variável internacaoId esteja disponível
                    if (typeof window.internacaoId !== 'undefined' && window.internacaoId) {
                        carregarEvolucoesEnfermagem();
                    }
                }, 3000);
            }
        }
    });
}

// Inicialização quando a página carregar
$(document).ready(function() {
    console.log('Inicializando módulo de evoluções de enfermagem');
    configurarEvolucoesEnfermagem();
}); 