// === CONFIGURACAO INICIAL PARA EVOLUCOES DE ENFERMAGEM ===
(function() {
    'use strict';
    
    console.log('Módulo enfermagem_evolucao_fix.js iniciando...');
    
    // Configurar variaveis globais
    window.ATENDIMENTO_ID = window.ATENDIMENTO_ID || window.location.pathname.split('/').pop();
    
    // Extrair internacaoId diretamente do HTML se não estiver disponível
    function obterInternacaoId() {
        // Primeiro, tentar usar window.internacaoId se já estiver definido
        if (window.internacaoId && !isNaN(window.internacaoId)) {
            return window.internacaoId;
        }
        
        // Tentar extrair do campo hidden no HTML
        var internacaoInput = document.getElementById('internacao_id');
        if (internacaoInput && internacaoInput.value) {
            var id = parseInt(internacaoInput.value, 10);
            if (!isNaN(id)) {
                window.internacaoId = id;
                return id;
            }
        }
        
        // Tentar extrair do campo de evolução
        var internacaoEvolucaoInput = document.getElementById('internacao_id_evolucao');
        if (internacaoEvolucaoInput && internacaoEvolucaoInput.value) {
            var id = parseInt(internacaoEvolucaoInput.value, 10);
            if (!isNaN(id)) {
                window.internacaoId = id;
                return id;
            }
        }
        
        // Tentar extrair do campo de prescrição
        var internacaoPrescricaoInput = document.getElementById('internacao_id_prescricao');
        if (internacaoPrescricaoInput && internacaoPrescricaoInput.value) {
            var id = parseInt(internacaoPrescricaoInput.value, 10);
            if (!isNaN(id)) {
                window.internacaoId = id;
                return id;
            }
        }
        
        // Tentar buscar em qualquer elemento que contenha o valor
        var elements = document.querySelectorAll('input[type="hidden"]');
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            if ((el.id && el.id.includes('internacao')) || (el.name && el.name.includes('internacao'))) {
                var value = parseInt(el.value, 10);
                if (!isNaN(value) && value > 0) {
                    window.internacaoId = value;
                    console.log('internacaoId encontrado em:', el.id || el.name, '=', value);
                    return value;
                }
            }
        }
        
        // Como último recurso, tentar extrair da URL se for um padrão conhecido
        var pathParts = window.location.pathname.split('/');
        var lastPart = pathParts[pathParts.length - 1];
        if (lastPart && !isNaN(parseInt(lastPart, 10))) {
            var id = parseInt(lastPart, 10);
            window.internacaoId = id;
            console.log('internacaoId extraído da URL:', id);
            return id;
        }
        
        console.error('Não foi possível encontrar internacaoId');
        return null;
    }
    
    // Funcao para carregar evolucoes de enfermagem
    function carregarEvolucoesEnfermagem() {
        console.log('Iniciando carregamento de evolucoes de enfermagem...');
        
        const idInternacao = obterInternacaoId();
        
        console.log('ID da internacao encontrado:', idInternacao);
        
        if (!idInternacao || isNaN(idInternacao)) {
            console.error('ID da internacao nao encontrado ou invalido');
            var errorHtml = '<tr><td colspan="3" class="text-center py-4">';
            errorHtml += '<div class="text-danger">';
            errorHtml += '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>';
            errorHtml += '<p class="mb-0">Erro: ID da internacao nao encontrado.</p>';
            errorHtml += '</div></td></tr>';
            
            if ($('#tabela-evolucoes-hoje').length > 0) {
                $('#tabela-evolucoes-hoje').html(errorHtml);
            }
            return;
        }
        
        console.log('Fazendo requisicao para: /api/enfermagem/evolucao/' + idInternacao);
        
        // Mostrar loading
        var loadingHtml = '<tr><td colspan="3" class="text-center py-4">';
        loadingHtml += '<div class="spinner-border text-success" role="status">';
        loadingHtml += '<span class="visually-hidden">Carregando...</span>';
        loadingHtml += '</div>';
        loadingHtml += '<p class="text-muted mt-2 mb-0">Carregando evolucoes de hoje...</p>';
        loadingHtml += '</td></tr>';
        
        if ($('#tabela-evolucoes-hoje').length > 0) {
            $('#tabela-evolucoes-hoje').html(loadingHtml);
        }
        
        $.ajax({
            url: '/api/enfermagem/evolucao/' + idInternacao,
            method: 'GET',
            timeout: 15000,
            success: function(response) {
                console.log('Resposta recebida da API:', response);
                
                // Separar evolucoes de hoje e anteriores
                var hoje = new Date().toISOString().split('T')[0];
                var evolucoesDoDia = [];
                var evolucoesAntigas = [];
                
                if (Array.isArray(response)) {
                    response.forEach(function(ev) {
                        try {
                            var dataEvolucao = new Date(ev.data_evolucao).toISOString().split('T')[0];
                            if (dataEvolucao === hoje) {
                                evolucoesDoDia.push(ev);
                            } else {
                                evolucoesAntigas.push(ev);
                            }
                        } catch (e) {
                            console.warn('Erro ao processar evolucao:', e, ev);
                        }
                    });
                    
                    // Atualizar contadores do resumo
                    if ($('#contador-evolucoes-hoje-resumo').length > 0) {
                        $('#contador-evolucoes-hoje-resumo').text(evolucoesDoDia.length);
                    }
                    if ($('#contador-evolucoes-antigas').length > 0) {
                        $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
                    }
                    
                    // Renderizar evolucoes do dia
                    renderizarEvolucoesDoDia(evolucoesDoDia);
                    
                    // Renderizar evolucoes antigas
                    renderizarEvolucoesAntigas(evolucoesAntigas);
                    
                } else {
                    // Atualizar contadores para zero
                    if ($('#contador-evolucoes-hoje-resumo').length > 0) {
                        $('#contador-evolucoes-hoje-resumo').text('0');
                    }
                    if ($('#contador-evolucoes-antigas').length > 0) {
                        $('#contador-evolucoes-antigas').text('0');
                    }
                    
                    var naoEncontradaHtml = '<tr><td colspan="3" class="text-center py-4">';
                    naoEncontradaHtml += '<div class="text-muted">';
                    naoEncontradaHtml += '<i class="fas fa-info-circle fa-2x mb-2 text-info opacity-50"></i>';
                    naoEncontradaHtml += '<p class="mb-0">Nenhuma evolucao registrada.</p>';
                    naoEncontradaHtml += '</div></td></tr>';
                    
                    if ($('#tabela-evolucoes-hoje').length > 0) {
                        $('#tabela-evolucoes-hoje').html(naoEncontradaHtml);
                    }
                    if ($('#tabela-evolucoes-antigas').length > 0) {
                        $('#tabela-evolucoes-antigas').html(naoEncontradaHtml);
                    }
                }
                
                console.log('Evolucoes de enfermagem carregadas com sucesso');
            },
            error: function(xhr, status, error) {
                console.error('Erro ao carregar evolucoes de enfermagem:', xhr.responseText);
                
                if ($('#contador-evolucoes-hoje-resumo').length > 0) {
                    $('#contador-evolucoes-hoje-resumo').text('0');
                }
                if ($('#contador-evolucoes-antigas').length > 0) {
                    $('#contador-evolucoes-antigas').text('0');
                }
                
                var errorMessage = 'Erro ao carregar evolucoes.';
                if (xhr.status === 404) {
                    errorMessage = 'Nenhuma evolucao encontrada.';
                } else if (xhr.status === 500) {
                    errorMessage = 'Erro interno do servidor.';
                } else if (xhr.status === 0) {
                    errorMessage = 'Erro de conexao com o servidor.';
                }
                
                var errorHtml = '<tr><td colspan="3" class="text-center py-4">';
                errorHtml += '<div class="text-danger">';
                errorHtml += '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>';
                errorHtml += '<p class="mb-0">' + errorMessage + '</p>';
                errorHtml += '</div></td></tr>';
                
                if ($('#tabela-evolucoes-hoje').length > 0) {
                    $('#tabela-evolucoes-hoje').html(errorHtml);
                }
                if ($('#tabela-evolucoes-antigas').length > 0) {
                    $('#tabela-evolucoes-antigas').html(errorHtml);
                }
            }
        });
    }
    
    // Funcao para renderizar evolucoes do dia
    function renderizarEvolucoesDoDia(evolucoesDoDia) {
        if (evolucoesDoDia.length > 0) {
            var htmlDoDia = '';
            evolucoesDoDia.forEach(function(ev) {
                try {
                    var hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    htmlDoDia += '<tr class="evolucao-row">';
                    htmlDoDia += '<td class="align-middle">';
                    htmlDoDia += '<span class="badge bg-success bg-opacity-25 text-success">' + hora + '</span>';
                    htmlDoDia += '</td>';
                    htmlDoDia += '<td class="align-middle">';
                    htmlDoDia += '<div class="d-flex align-items-center">';
                    htmlDoDia += '<i class="fas fa-user-nurse text-success me-2"></i>';
                    htmlDoDia += '<span class="fw-medium">' + (ev.enfermeiro_nome || 'Nao informado') + '</span>';
                    htmlDoDia += '</div>';
                    htmlDoDia += '</td>';
                    htmlDoDia += '<td class="align-middle">';
                    htmlDoDia += '<div class="texto-evolucao p-2 bg-light rounded border-start border-success border-3">';
                    htmlDoDia += (ev.texto || '---');
                    htmlDoDia += '</div>';
                    htmlDoDia += '</td>';
                    htmlDoDia += '</tr>';
                } catch (e) {
                    console.warn('Erro ao renderizar evolucao do dia:', e, ev);
                }
            });
            
            if ($('#tabela-evolucoes-hoje').length > 0) {
                $('#tabela-evolucoes-hoje').html(htmlDoDia);
            }
        } else {
            var semEvolucaoHtml = '<tr><td colspan="3" class="text-center py-4">';
            semEvolucaoHtml += '<div class="text-muted">';
            semEvolucaoHtml += '<i class="fas fa-calendar-check fa-2x mb-2 text-success opacity-50"></i>';
            semEvolucaoHtml += '<p class="mb-0">Nenhuma evolucao registrada hoje.</p>';
            semEvolucaoHtml += '</div></td></tr>';
            
            if ($('#tabela-evolucoes-hoje').length > 0) {
                $('#tabela-evolucoes-hoje').html(semEvolucaoHtml);
            }
        }
    }
    
    // Funcao para renderizar evolucoes antigas
    function renderizarEvolucoesAntigas(evolucoesAntigas) {
        if (evolucoesAntigas.length > 0) {
            var htmlAntigas = '';
            evolucoesAntigas.forEach(function(ev) {
                try {
                    var dataFormatada = new Date(ev.data_evolucao).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    var hora = new Date(ev.data_evolucao).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    htmlAntigas += '<tr class="evolucao-row">';
                    htmlAntigas += '<td class="align-middle">';
                    htmlAntigas += '<span class="badge bg-secondary bg-opacity-25 text-secondary">' + dataFormatada + ' ' + hora + '</span>';
                    htmlAntigas += '</td>';
                    htmlAntigas += '<td class="align-middle">';
                    htmlAntigas += '<div class="d-flex align-items-center">';
                    htmlAntigas += '<i class="fas fa-user-nurse text-secondary me-2"></i>';
                    htmlAntigas += '<span class="fw-medium">' + (ev.enfermeiro_nome || 'Nao informado') + '</span>';
                    htmlAntigas += '</div>';
                    htmlAntigas += '</td>';
                    htmlAntigas += '<td class="align-middle">';
                    htmlAntigas += '<div class="texto-evolucao p-2 bg-light rounded border-start border-secondary border-3">';
                    htmlAntigas += (ev.texto || '---');
                    htmlAntigas += '</div>';
                    htmlAntigas += '</td>';
                    htmlAntigas += '</tr>';
                } catch (e) {
                    console.warn('Erro ao renderizar evolucao antiga:', e, ev);
                }
            });
            
            if ($('#tabela-evolucoes-antigas').length > 0) {
                $('#tabela-evolucoes-antigas').html(htmlAntigas);
            }
        } else {
            var semAntigasHtml = '<tr><td colspan="3" class="text-center py-4">';
            semAntigasHtml += '<div class="text-muted">';
            semAntigasHtml += '<i class="fas fa-history fa-2x mb-2 text-secondary opacity-50"></i>';
            semAntigasHtml += '<p class="mb-0">Nenhuma evolucao anterior registrada.</p>';
            semAntigasHtml += '</div></td></tr>';
            
            if ($('#tabela-evolucoes-antigas').length > 0) {
                $('#tabela-evolucoes-antigas').html(semAntigasHtml);
            }
        }
    }
    
    // Funcao para visualizar evolucao de enfermagem especifica
    window.visualizarEvolucaoEnfermagem = function(evolucaoId) {
        console.log('Visualizando evolucao de enfermagem:', evolucaoId);
        alert('Visualizacao detalhada da evolucao em desenvolvimento.');
    };
    
    // Disponibilizar funcao globalmente
    window.carregarEvolucoesEnfermagem = carregarEvolucoesEnfermagem;
    
    // Funcao de verificacao e carregamento automatico
    function verificarECarregarEvolucoes() {
        console.log('Verificando se precisamos carregar evolucoes...');
        
        // Verificar se os elementos existem
        if ($('#tabela-evolucoes-hoje').length === 0) {
            console.log('Tabela de evolucoes ainda nao encontrada, tentando novamente em 1s...');
            setTimeout(verificarECarregarEvolucoes, 1000);
            return;
        }
        
        // Tentar obter internacaoId
        var internacaoId = obterInternacaoId();
        if (!internacaoId || isNaN(internacaoId)) {
            console.log('internacaoId ainda nao disponivel, tentando novamente em 1s...');
            setTimeout(verificarECarregarEvolucoes, 1000);
            return;
        }
        
        console.log('internacaoId encontrado:', internacaoId);
        
        // Verificar se ja tem conteudo carregado
        const conteudoAtual = $('#tabela-evolucoes-hoje').html();
        if (conteudoAtual.includes('Carregando evolucoes') || 
            conteudoAtual.includes('spinner-border') ||
            conteudoAtual.trim() === '' ||
            conteudoAtual.includes('Carregando...')) {
            
            console.log('Conteudo de loading detectado, iniciando carregamento...');
            carregarEvolucoesEnfermagem();
        } else {
            console.log('Evolucoes ja parecem estar carregadas');
        }
    }
    
    // Auto-inicializar quando o documento estiver pronto
    $(document).ready(function() {
        console.log('Modulo de evolucoes de enfermagem carregado');
        
        // Tentar encontrar internacaoId imediatamente
        var internacaoId = obterInternacaoId();
        console.log('internacaoId inicial:', internacaoId);
        
        // Aguardar um pouco para garantir que a pagina foi renderizada completamente
        setTimeout(verificarECarregarEvolucoes, 500);
        
        // Configurar toggle para evolucoes antigas
        $('#toggle-evolucoes-antigas').off('click.evolucaoFix').on('click.evolucaoFix', function() {
            const container = $('#antigas-container');
            const isVisible = container.is(':visible');
            
            if (isVisible) {
                container.hide();
                $('#toggle-evolucoes-text').text('Ver Antigas');
                $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
            } else {
                container.show();
                $('#toggle-evolucoes-text').text('Ocultar Antigas');
                $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
            }
        });
        
        // Configurar filtros
        $('#btn-limpar-filtro').off('click.evolucaoFix').on('click.evolucaoFix', function() {
            $('#filtro-data').val('');
            console.log('Filtro limpo - recarregando evolucoes');
            carregarEvolucoesEnfermagem();
        });
    });
    
    console.log('Modulo enfermagem_evolucao_fix.js carregado com sucesso');
    
})(); 