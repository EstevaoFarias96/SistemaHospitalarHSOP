// ===== FUNÇÕES PARA EVOLUÇÕES DE FISIOTERAPIA =====

/**
 * Carrega as evoluções de fisioterapia do paciente
 */
function carregarEvolucoesFisioterapia() {
    const atendimentoId = $('#atendimento_id').val();
    
    if (!atendimentoId) {
        console.error('ID do atendimento não encontrado');
        $('#listaEvolucoesFisioterapiaDoDia').html('<tr><td colspan="3" class="text-center text-danger">ID do atendimento não encontrado</td></tr>');
        $('#listaEvolucoesFisioterapiaAntigas').html('<tr><td colspan="3" class="text-center text-danger">ID do atendimento não encontrado</td></tr>');
        return;
    }

    console.log('Carregando evoluções de fisioterapia para atendimento:', atendimentoId);

    // Fazer requisição para buscar as evoluções
    $.ajax({
        url: `/evolucoes_fisioterapia/atendimento/${atendimentoId}`,
        method: 'GET',
        success: function(evolucoes) {
            console.log('Evoluções de fisioterapia carregadas:', evolucoes);
            
            const hoje = new Date();
            const hojeStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const evolucoesHoje = [];
            const evolucoesAntigas = [];
            
            // Separar evoluções por data
            evolucoes.forEach(function(evolucao) {
                const dataEvolucao = new Date(evolucao.data_evolucao);
                const dataEvolucaoStr = dataEvolucao.toISOString().split('T')[0];
                
                if (dataEvolucaoStr === hojeStr) {
                    evolucoesHoje.push(evolucao);
                } else {
                    evolucoesAntigas.push(evolucao);
                }
            });
            
            // Renderizar evoluções de hoje
            renderizarEvolucoesFisioterapiaHoje(evolucoesHoje);
            
            // Renderizar evoluções antigas
            renderizarEvolucoesFisioterapiaAntigas(evolucoesAntigas);
            
            // Atualizar contador
            $('#contador-evolucoes-fisio-antigas').text(evolucoesAntigas.length);
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de fisioterapia:', error);
            console.error('Status HTTP:', xhr.status);
            console.error('Resposta do servidor:', xhr.responseText);
            
            let mensagemErro = 'Erro ao carregar evoluções de fisioterapia.';
            
            if (xhr.status === 404) {
                mensagemErro = 'Nenhuma evolução de fisioterapia encontrada.';
            } else if (xhr.status === 403) {
                mensagemErro = 'Acesso negado para visualizar evoluções de fisioterapia.';
            } else if (xhr.status === 500) {
                mensagemErro = 'Erro interno do servidor ao carregar evoluções.';
            }
                
            $('#listaEvolucoesFisioterapiaDoDia').html(`<tr><td colspan="3" class="text-center text-muted">${mensagemErro}</td></tr>`);
            $('#listaEvolucoesFisioterapiaAntigas').html(`<tr><td colspan="3" class="text-center text-muted">${mensagemErro}</td></tr>`);
        }
    });
}

/**
 * Renderiza as evoluções de fisioterapia de hoje
 */
function renderizarEvolucoesFisioterapiaHoje(evolucoes) {
    const container = $('#listaEvolucoesFisioterapiaDoDia');
    
    if (!evolucoes || evolucoes.length === 0) {
        container.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução de fisioterapia registrada hoje.</td></tr>');
        return;
    }
    
    let html = '';
    
    // Ordenar por data mais recente primeiro (ordem decrescente)
    evolucoes.sort((a, b) => new Date(b.data_evolucao) - new Date(a.data_evolucao));
    
    evolucoes.forEach(function(evolucao) {
        const dataEvolucao = new Date(evolucao.data_evolucao);
        const horaFormatada = dataEvolucao.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Buscar nome do fisioterapeuta (se disponível nos dados)
        const nomeFisioterapeuta = evolucao.fisioterapeuta_nome || 'Fisioterapeuta não identificado';
        const registroFisioterapeuta = evolucao.fisioterapeuta_registro || '';
        
        // Montar display do profissional
        let profissionalDisplay = `<strong>${nomeFisioterapeuta}</strong>`;
        if (registroFisioterapeuta) {
            profissionalDisplay += `<br><small class="text-muted">CREFITO: ${registroFisioterapeuta}</small>`;
        }
        
        html += `
            <tr>
                <td>
                    <span class="badge bg-success">${horaFormatada}</span>
                </td>
                <td>
                    <small class="text-muted">Fisioterapeuta:</small><br>
                    ${profissionalDisplay}
                </td>
                <td>
                    <div class="texto-evolucao" style="white-space: pre-wrap; word-wrap: break-word;">
                        ${evolucao.evolucao_fisio || 'Sem registro de evolução.'}
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="imprimirEvolucaoFisioIndividual(${evolucao.id})">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.html(html);
}

/**
 * Renderiza as evoluções de fisioterapia antigas
 */
function renderizarEvolucoesFisioterapiaAntigas(evolucoes) {
    const container = $('#listaEvolucoesFisioterapiaAntigas');
    
    if (!evolucoes || evolucoes.length === 0) {
        container.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução anterior encontrada.</td></tr>');
        return;
    }
    
    let html = '';
    
    // Ordenar por data mais recente primeiro (ordem decrescente)
    evolucoes.sort((a, b) => new Date(b.data_evolucao) - new Date(a.data_evolucao));
    
    evolucoes.forEach(function(evolucao) {
        const dataEvolucao = new Date(evolucao.data_evolucao);
        const dataFormatada = dataEvolucao.toLocaleDateString('pt-BR');
        const horaFormatada = dataEvolucao.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Buscar nome do fisioterapeuta (se disponível nos dados)
        const nomeFisioterapeuta = evolucao.fisioterapeuta_nome || 'Fisioterapeuta não identificado';
        const registroFisioterapeuta = evolucao.fisioterapeuta_registro || '';
        
        // Montar display do profissional
        let profissionalDisplay = `<strong>${nomeFisioterapeuta}</strong>`;
        if (registroFisioterapeuta) {
            profissionalDisplay += `<br><small class="text-muted">CREFITO: ${registroFisioterapeuta}</small>`;
        }
        
        html += `
            <tr>
                <td>
                    <div class="text-nowrap">
                        <div class="fw-bold">${dataFormatada}</div>
                        <small class="text-muted">${horaFormatada}</small>
                    </div>
                </td>
                <td>
                    <small class="text-muted">Fisioterapeuta:</small><br>
                    ${profissionalDisplay}
                </td>
                <td>
                    <div class="texto-evolucao" style="white-space: pre-wrap; word-wrap: break-word;">
                        ${evolucao.evolucao_fisio || 'Sem registro de evolução.'}
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="imprimirEvolucaoFisioIndividual(${evolucao.id})">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.html(html);
}

/**
 * Abre o modal para nova evolução de fisioterapia
 */
function abrirModalNovaEvolucaoFisioterapia() {
    // Definir data e hora atuais nos campos hidden
    const agora = new Date();
    const dataAtual = agora.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaAtual = agora.toTimeString().slice(0, 5); // HH:MM
    
    $('#dataEvolucaoFisio').val(dataAtual);
    $('#horaEvolucaoFisio').val(horaAtual);
    $('#textoEvolucaoFisio').val('');
    
    // Definir o profissional atual no campo hidden
    if (session && session.user_id) {
        $('#fisioterapeutaHidden').val(session.user_id);
    }
    
    // Abrir modal
    $('#modalNovaEvolucaoFisioterapia').modal('show');
}

/**
 * Salva uma nova evolução de fisioterapia
 */
function salvarNovaEvolucaoFisioterapia() {
    const atendimentoId = $('#atendimento_id').val();
    // Usar o campo hidden para o profissional
    const funcionarioId = $('#fisioterapeutaHidden').val() || session.user_id;
    const dataEvolucao = $('#dataEvolucaoFisio').val();
    const horaEvolucao = $('#horaEvolucaoFisio').val();
    const textoEvolucao = $('#textoEvolucaoFisio').val().trim();
    
    // Validações
    if (!funcionarioId) {
        alert('Erro: Profissional não identificado.');
        return;
    }
    
    if (!dataEvolucao || !horaEvolucao) {
        alert('Por favor, preencha a data e hora da evolução.');
        return;
    }
    
    if (!textoEvolucao) {
        alert('Por favor, descreva a evolução do paciente.');
        return;
    }
    
    // Combinar data e hora
    const dataHoraEvolucao = `${dataEvolucao} ${horaEvolucao}:00`;
    
    // Dados para envio
    const dados = {
        funcionario_id: parseInt(funcionarioId),
        data_evolucao: dataHoraEvolucao,
        evolucao_fisio: textoEvolucao
    };
    
    console.log('Salvando evolução de fisioterapia:', dados);
    
    // Desabilitar botão de salvar
    const btnSalvar = $('#modalNovaEvolucaoFisioterapia .btn-success');
    const textoOriginal = btnSalvar.html();
    btnSalvar.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Salvando...');
    
    // Enviar dados
    $.ajax({
        url: `/evolucoes_fisioterapia/atendimento/${atendimentoId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            console.log('Evolução de fisioterapia salva com sucesso:', response);
            
            // Fechar modal
            $('#modalNovaEvolucaoFisioterapia').modal('hide');
            
            // Recarregar evoluções
            carregarEvolucoesFisioterapia();
            
            // Mostrar mensagem de sucesso
            alert('Evolução de fisioterapia salva com sucesso!');
        },
        error: function(xhr, status, error) {
            console.error('Erro ao salvar evolução de fisioterapia:', error);
            
            let mensagemErro = 'Erro ao salvar evolução de fisioterapia.';
            
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.message) {
                    mensagemErro = response.message;
                }
            } catch (e) {
                // Usar mensagem padrão
            }
            
            alert(mensagemErro);
        },
        complete: function() {
            // Reabilitar botão
            btnSalvar.prop('disabled', false).html(textoOriginal);
        }
    });
}

/**
 * Limpa o formulário de nova evolução
 */
function limparFormularioEvolucaoFisioterapia() {
    // Limpar apenas o campo de texto
    $('#textoEvolucaoFisio').val('');
    
    // Limpar campos hidden
    $('#fisioterapeutaHidden').val('');
    $('#dataEvolucaoFisio').val('');
    $('#horaEvolucaoFisio').val('');
}

// Inicializar carregamento das evoluções quando a página estiver pronta
$(document).ready(function() {
    // Verificar se estamos na página correta
    if ($('#fisioterapiaSection').length > 0) {
        console.log('Seção de fisioterapia encontrada, carregando evoluções...');
        
        // Carregar evoluções ao inicializar
        carregarEvolucoesFisioterapia();
        
        // Carregar evoluções quando a aba de fisioterapia for clicada
        $('[data-mp-target="fisioterapiaSection"]').on('click', function() {
            console.log('Aba de fisioterapia clicada, recarregando evoluções...');
            setTimeout(carregarEvolucoesFisioterapia, 300); // Aguardar um pouco para a aba ser ativada
        });
        
        // Carregar evoluções quando a área multiprofissional for ativada
        $('a[href="#areaMultiprofissionalSection"]').on('click', function() {
            console.log('Área multiprofissional ativada...');
            setTimeout(function() {
                if ($('#fisioterapiaSection').hasClass('active')) {
                    carregarEvolucoesFisioterapia();
                }
            }, 300);
        });
    }
    
    // Verificar se estamos na seção de nutrição
    if ($('#nutricaoSection').length > 0) {
        console.log('Seção de nutrição encontrada, carregando evoluções...');
        
        // Carregar evoluções ao inicializar
        carregarEvolucoesNutricao();
        
        // Carregar evoluções quando a aba de nutrição for clicada
        $('[data-mp-target="nutricaoSection"]').on('click', function() {
            console.log('Aba de nutrição clicada, recarregando evoluções...');
            setTimeout(carregarEvolucoesNutricao, 300); // Aguardar um pouco para a aba ser ativada
        });
        
        // Carregar evoluções quando a área multiprofissional for ativada
        $('a[href="#areaMultiprofissionalSection"]').on('click', function() {
            console.log('Área multiprofissional ativada...');
            setTimeout(function() {
                if ($('#nutricaoSection').hasClass('active')) {
                    carregarEvolucoesNutricao();
                }
            }, 300);
        });
    }

    // Verificar se estamos na seção de assistência social
    if ($('#assistenciaSocialSection').length > 0) {
        console.log('Seção de assistência social encontrada, carregando evoluções...');
        
        // Carregar evoluções ao inicializar
        carregarEvolucoesAssistenteSocial();
        
        // Carregar evoluções quando a aba de assistência social for clicada
        $('[data-mp-target="assistenciaSocialSection"]').on('click', function() {
            console.log('Aba de assistência social clicada, recarregando evoluções...');
            setTimeout(carregarEvolucoesAssistenteSocial, 300); // Aguardar um pouco para a aba ser ativada
        });
        
        // Carregar evoluções quando a área multiprofissional for ativada
        $('a[href="#areaMultiprofissionalSection"]').on('click', function() {
            console.log('Área multiprofissional ativada...');
            setTimeout(function() {
                if ($('#assistenciaSocialSection').hasClass('active')) {
                    carregarEvolucoesAssistenteSocial();
                }
            }, 300);
        });
    }
});

/**
 * Abre a página de impressão de uma evolução individual de fisioterapia
 */
function imprimirEvolucaoFisioIndividual(evolucaoId) {
    if (!evolucaoId) {
        alert('Erro: ID da evolução não encontrado.');
        return;
    }
    
    // Abrir página de impressão em nova aba
    const url = `/impressao_fisio_evolucao/${evolucaoId}`;
    window.open(url, '_blank');
}

// Limpar formulário quando modal de evolução de fisioterapia for fechado
$('#modalNovaEvolucaoFisioterapia').on('hidden.bs.modal', function() {
    limparFormularioEvolucaoFisioterapia();
});

// ===== FUNÇÕES PARA EVOLUÇÕES DE NUTRIÇÃO =====

/**
 * Carrega as evoluções de nutrição do paciente
 */
function carregarEvolucoesNutricao() {
    const atendimentoId = $('#atendimento_id').val();
    
    if (!atendimentoId) {
        console.error('ID do atendimento não encontrado');
        $('#listaEvolucoesNutricaoDoDia').html('<tr><td colspan="3" class="text-center text-danger">ID do atendimento não encontrado</td></tr>');
        $('#listaEvolucoesNutricaoAntigas').html('<tr><td colspan="3" class="text-center text-danger">ID do atendimento não encontrado</td></tr>');
        return;
    }

    console.log('Carregando evoluções de nutrição para atendimento:', atendimentoId);

    // Fazer requisição para buscar as evoluções
    $.ajax({
        url: `/evolucoes_nutricao/atendimento/${atendimentoId}`,
        method: 'GET',
        success: function(evolucoes) {
            console.log('Evoluções de nutrição carregadas:', evolucoes);
            
            const hoje = new Date();
            const hojeStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const evolucoesHoje = [];
            const evolucoesAntigas = [];
            
            // Separar evoluções por data
            evolucoes.forEach(function(evolucao) {
                const dataEvolucao = new Date(evolucao.data_evolucao);
                const dataEvolucaoStr = dataEvolucao.toISOString().split('T')[0];
                
                if (dataEvolucaoStr === hojeStr) {
                    evolucoesHoje.push(evolucao);
                } else {
                    evolucoesAntigas.push(evolucao);
                }
            });
            
            // Renderizar evoluções de hoje
            renderizarEvolucoesNutricaoHoje(evolucoesHoje);
            
            // Renderizar evoluções antigas
            renderizarEvolucoesNutricaoAntigas(evolucoesAntigas);
            
            // Atualizar contador
            $('#contador-evolucoes-nutricao-antigas').text(evolucoesAntigas.length);
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de nutrição:', error);
            console.error('Status HTTP:', xhr.status);
            console.error('Resposta do servidor:', xhr.responseText);
            
            let mensagemErro = 'Erro ao carregar evoluções de nutrição.';
            
            if (xhr.status === 404) {
                mensagemErro = 'Nenhuma evolução nutricional encontrada.';
            } else if (xhr.status === 403) {
                mensagemErro = 'Acesso negado para visualizar evoluções de nutrição.';
            } else if (xhr.status === 500) {
                mensagemErro = 'Erro interno do servidor ao carregar evoluções.';
            }
                
            $('#listaEvolucoesNutricaoDoDia').html(`<tr><td colspan="3" class="text-center text-muted">${mensagemErro}</td></tr>`);
            $('#listaEvolucoesNutricaoAntigas').html(`<tr><td colspan="3" class="text-center text-muted">${mensagemErro}</td></tr>`);
        }
    });
}

/**
 * Renderiza as evoluções de nutrição de hoje
 */
function renderizarEvolucoesNutricaoHoje(evolucoes) {
    const container = $('#listaEvolucoesNutricaoDoDia');
    
    if (!evolucoes || evolucoes.length === 0) {
        container.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução nutricional registrada hoje.</td></tr>');
        return;
    }
    
    let html = '';
    
    // Ordenar por data mais recente primeiro (ordem decrescente)
    evolucoes.sort((a, b) => new Date(b.data_evolucao) - new Date(a.data_evolucao));
    
    evolucoes.forEach(function(evolucao) {
        const dataEvolucao = new Date(evolucao.data_evolucao);
        const horaFormatada = dataEvolucao.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Buscar nome do profissional ou usar informação disponível
        let profissionalDisplay = 'Nutricionista';
        if (evolucao.nutricionista_nome) {
            profissionalDisplay = evolucao.nutricionista_nome;
        } else if (evolucao.funcionario_id) {
            profissionalDisplay = `Nutricionista (ID: ${evolucao.funcionario_id})`;
        }
        
        html += `
            <tr>
                <td>
                    <div class="fw-bold">${horaFormatada}</div>
                </td>
                <td>
                    <small class="text-muted">Nutricionista:</small><br>
                    ${profissionalDisplay}
                </td>
                <td>
                    <div class="texto-evolucao" style="white-space: pre-wrap; word-wrap: break-word;">
                        ${evolucao.evolucao_nutricao || 'Sem registro de evolução.'}
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="imprimirEvolucaoNutricaoIndividual(${evolucao.id})">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.html(html);
}

/**
 * Renderiza as evoluções de nutrição antigas
 */
function renderizarEvolucoesNutricaoAntigas(evolucoes) {
    const container = $('#listaEvolucoesNutricaoAntigas');
    
    if (!evolucoes || evolucoes.length === 0) {
        container.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução nutricional anterior encontrada.</td></tr>');
        return;
    }
    
    let html = '';
    
    // Ordenar por data mais recente primeiro (ordem decrescente)
    evolucoes.sort((a, b) => new Date(b.data_evolucao) - new Date(a.data_evolucao));
    
    evolucoes.forEach(function(evolucao) {
        const dataEvolucao = new Date(evolucao.data_evolucao);
        const dataFormatada = dataEvolucao.toLocaleDateString('pt-BR');
        const horaFormatada = dataEvolucao.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Buscar nome do profissional ou usar informação disponível
        let profissionalDisplay = 'Nutricionista';
        if (evolucao.nutricionista_nome) {
            profissionalDisplay = evolucao.nutricionista_nome;
        } else if (evolucao.funcionario_id) {
            profissionalDisplay = `Nutricionista (ID: ${evolucao.funcionario_id})`;
        }
        
        html += `
            <tr>
                <td>
                    <div class="text-nowrap">
                        <div class="fw-bold">${dataFormatada}</div>
                        <small class="text-muted">${horaFormatada}</small>
                    </div>
                </td>
                <td>
                    <small class="text-muted">Nutricionista:</small><br>
                    ${profissionalDisplay}
                </td>
                <td>
                    <div class="texto-evolucao" style="white-space: pre-wrap; word-wrap: break-word;">
                        ${evolucao.evolucao_nutricao || 'Sem registro de evolução.'}
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="imprimirEvolucaoNutricaoIndividual(${evolucao.id})">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.html(html);
}

/**
 * Abre o modal para nova evolução de nutrição
 */
function abrirModalNovaEvolucaoNutricao() {
    try {
        // Definir data e hora atuais nos campos hidden
        const agora = new Date();
        const dataAtual = agora.toISOString().split('T')[0]; // YYYY-MM-DD
        const horaAtual = agora.toTimeString().slice(0, 5); // HH:MM
        
        $('#dataEvolucaoNutricao').val(dataAtual);
        $('#horaEvolucaoNutricao').val(horaAtual);
        $('#textoEvolucaoNutricao').val('');
        
        // Definir o profissional atual no campo hidden
        if (session && session.user_id) {
            $('#nutricionistaHidden').val(session.user_id);
        }
        
        // Obter elemento do modal
        const modalElement = document.getElementById('modalNovaEvolucaoNutricao');
        if (!modalElement) {
            console.error('Modal de Nutrição não encontrado');
            return false;
        }
        
        // Tentar abrir com Bootstrap 5
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            // Remover instância existente se houver
            const existingInstance = bootstrap.Modal.getInstance(modalElement);
            if (existingInstance) {
                existingInstance.dispose();
            }
            
            // Criar nova instância
            const modal = new bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: true,
                focus: true
            });
            
            modal.show();
            
        } else {
            // Fallback para jQuery
            $('#modalNovaEvolucaoNutricao').modal('show');
        }
        
    } catch (error) {
        console.error('Erro ao abrir modal de Nutrição:', error);
        // Último recurso - tentar mostrar modal com jQuery
        try {
            $('#modalNovaEvolucaoNutricao').modal('show');
        } catch (jqueryError) {
            console.error('Erro no fallback jQuery:', jqueryError);
            alert('Erro ao abrir modal. Recarregue a página e tente novamente.');
        }
    }
}

/**
 * Salva uma nova evolução de nutrição
 */
function salvarNovaEvolucaoNutricao() {
    const atendimentoId = $('#atendimento_id').val();
    // Usar o campo hidden para o profissional
    const funcionarioId = $('#nutricionistaHidden').val() || session.user_id;
    const dataEvolucao = $('#dataEvolucaoNutricao').val();
    const horaEvolucao = $('#horaEvolucaoNutricao').val();
    const textoEvolucao = $('#textoEvolucaoNutricao').val().trim();
    
    // Validações
    if (!funcionarioId) {
        alert('Erro: Profissional não identificado.');
        return;
    }
    
    if (!dataEvolucao || !horaEvolucao) {
        alert('Por favor, preencha a data e hora da evolução.');
        return;
    }
    
    if (!textoEvolucao) {
        alert('Por favor, descreva a evolução nutricional do paciente.');
        return;
    }
    
    // Combinar data e hora
    const dataHoraEvolucao = `${dataEvolucao} ${horaEvolucao}:00`;
    
    // Dados para envio
    const dados = {
        funcionario_id: parseInt(funcionarioId),
        data_evolucao: dataHoraEvolucao,
        evolucao_nutricao: textoEvolucao
    };
    
    console.log('Salvando evolução de nutrição:', dados);
    
    // Desabilitar botão de salvar
    const btnSalvar = $('#modalNovaEvolucaoNutricao .btn-success');
    const textoOriginal = btnSalvar.html();
    btnSalvar.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Salvando...');
    
    // Enviar dados
    $.ajax({
        url: `/evolucoes_nutricao/atendimento/${atendimentoId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            console.log('Evolução de nutrição salva com sucesso:', response);
            
            // Fechar modal
            $('#modalNovaEvolucaoNutricao').modal('hide');
            
            // Recarregar evoluções
            carregarEvolucoesNutricao();
            
            // Mostrar mensagem de sucesso
            alert('Evolução nutricional salva com sucesso!');
        },
        error: function(xhr, status, error) {
            console.error('Erro ao salvar evolução de nutrição:', error);
            console.error('Status HTTP:', xhr.status);
            console.error('Resposta do servidor:', xhr.responseText);
            
            let mensagemErro = 'Erro ao salvar evolução nutricional.';
            
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.mensagem) {
                    mensagemErro = response.mensagem;
                }
            } catch (e) {
                if (xhr.status === 403) {
                    mensagemErro = 'Acesso negado para registrar evoluções de nutrição.';
                } else if (xhr.status === 500) {
                    mensagemErro = 'Erro interno do servidor ao salvar evolução.';
                }
            }
            
            alert(mensagemErro);
        },
        complete: function() {
            // Restaurar botão
            btnSalvar.prop('disabled', false).html(textoOriginal);
        }
    });
}

/**
 * Limpa o formulário de nova evolução de nutrição
 */
function limparFormularioEvolucaoNutricao() {
    // Limpar apenas o campo de texto
    $('#textoEvolucaoNutricao').val('');
    
    // Limpar campos hidden
    $('#nutricionistaHidden').val('');
    $('#dataEvolucaoNutricao').val('');
    $('#horaEvolucaoNutricao').val('');
}

/**
 * Abre a página de impressão de uma evolução individual de nutrição
 */
function imprimirEvolucaoNutricaoIndividual(evolucaoId) {
    if (!evolucaoId) {
        alert('Erro: ID da evolução não encontrado.');
        return;
    }
    
    // Abrir página de impressão em nova aba
    const url = `/impressao_nutricao_evolucao/${evolucaoId}`;
    window.open(url, '_blank');
}

// Limpar formulário quando modal de evolução de nutrição for fechado
$('#modalNovaEvolucaoNutricao').on('hidden.bs.modal', function() {
    limparFormularioEvolucaoNutricao();
});

// ==================== ASSISTÊNCIA SOCIAL EVOLUTION FUNCTIONS ====================

/**
 * Carrega as evoluções de assistência social do atendimento atual
 */
function carregarEvolucoesAssistenteSocial() {
    const atendimentoId = $('#atendimento_id').val();
    
    if (!atendimentoId) {
        console.error('ID do atendimento não encontrado');
        $('#listaEvolucoesAssistenteSocialDoDia').html('<tr><td colspan="3" class="text-center text-danger">ID do atendimento não encontrado</td></tr>');
        $('#listaEvolucoesAssistenteSocialAntigas').html('<tr><td colspan="3" class="text-center text-danger">ID do atendimento não encontrado</td></tr>');
        return;
    }

    console.log('Carregando evoluções de assistência social para atendimento:', atendimentoId);

    // Fazer requisição para buscar as evoluções
    $.ajax({
        url: `/evolucoes_assistentesocial/atendimento/${atendimentoId}`,
        method: 'GET',
        success: function(evolucoes) {
            console.log('Evoluções de assistência social carregadas:', evolucoes);
            
            const hoje = new Date();
            const hojeStr = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
            
            const evolucoesHoje = [];
            const evolucoesAntigas = [];
            
            // Separar evoluções por data
            evolucoes.forEach(function(evolucao) {
                const dataEvolucao = new Date(evolucao.data_evolucao);
                const dataEvolucaoStr = dataEvolucao.toISOString().split('T')[0];
                
                if (dataEvolucaoStr === hojeStr) {
                    evolucoesHoje.push(evolucao);
                } else {
                    evolucoesAntigas.push(evolucao);
                }
            });
            
            // Renderizar evoluções de hoje
            renderizarEvolucoesAssistenteSocialHoje(evolucoesHoje);
            
            // Renderizar evoluções antigas
            renderizarEvolucoesAssistenteSocialAntigas(evolucoesAntigas);
            
            // Atualizar contador
            $('#contador-evolucoes-assistente-social-antigas').text(evolucoesAntigas.length);
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções de assistência social:', error);
            console.error('Status HTTP:', xhr.status);
            console.error('Resposta do servidor:', xhr.responseText);
            
            let mensagemErro = 'Erro ao carregar evoluções de assistência social.';
            
            if (xhr.status === 404) {
                mensagemErro = 'Nenhuma evolução de assistência social encontrada.';
            } else if (xhr.status === 403) {
                mensagemErro = 'Acesso negado para visualizar evoluções de assistência social.';
            } else if (xhr.status === 500) {
                mensagemErro = 'Erro interno do servidor ao carregar evoluções.';
            }
                
            $('#listaEvolucoesAssistenteSocialDoDia').html(`<tr><td colspan="3" class="text-center text-muted">${mensagemErro}</td></tr>`);
            $('#listaEvolucoesAssistenteSocialAntigas').html(`<tr><td colspan="3" class="text-center text-muted">${mensagemErro}</td></tr>`);
        }
    });
}

/**
 * Renderiza as evoluções de assistência social de hoje
 */
function renderizarEvolucoesAssistenteSocialHoje(evolucoes) {
    const container = $('#listaEvolucoesAssistenteSocialDoDia');
    
    if (!evolucoes || evolucoes.length === 0) {
        container.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução de assistência social registrada hoje.</td></tr>');
        return;
    }
    
    let html = '';
    
    // Ordenar por data mais recente primeiro (ordem decrescente)
    evolucoes.sort((a, b) => new Date(b.data_evolucao) - new Date(a.data_evolucao));
    
    evolucoes.forEach(function(evolucao) {
        const dataEvolucao = new Date(evolucao.data_evolucao);
        const horaFormatada = dataEvolucao.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Buscar nome do profissional ou usar informação disponível
        let profissionalDisplay = 'Assistente Social';
        if (evolucao.assistente_social_nome) {
            profissionalDisplay = evolucao.assistente_social_nome;
        } else if (evolucao.funcionario_id) {
            profissionalDisplay = `Assistente Social (ID: ${evolucao.funcionario_id})`;
        }
        
        html += `
            <tr>
                <td>
                    <div class="fw-bold">${horaFormatada}</div>
                </td>
                <td>
                    <small class="text-muted">Assistente Social:</small><br>
                    ${profissionalDisplay}
                </td>
                <td>
                    <div class="texto-evolucao" style="white-space: pre-wrap; word-wrap: break-word;">
                        ${evolucao.evolucao_assistente_social || 'Sem registro de evolução.'}
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="imprimirEvolucaoAssistenteSocialIndividual(${evolucao.id})">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.html(html);
}

/**
 * Renderiza as evoluções de assistência social antigas
 */
function renderizarEvolucoesAssistenteSocialAntigas(evolucoes) {
    const container = $('#listaEvolucoesAssistenteSocialAntigas');
    
    if (!evolucoes || evolucoes.length === 0) {
        container.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução de assistência social anterior encontrada.</td></tr>');
        return;
    }
    
    let html = '';
    
    // Ordenar por data mais recente primeiro (ordem decrescente)
    evolucoes.sort((a, b) => new Date(b.data_evolucao) - new Date(a.data_evolucao));
    
    evolucoes.forEach(function(evolucao) {
        const dataEvolucao = new Date(evolucao.data_evolucao);
        const dataFormatada = dataEvolucao.toLocaleDateString('pt-BR');
        const horaFormatada = dataEvolucao.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Buscar nome do profissional ou usar informação disponível
        let profissionalDisplay = 'Assistente Social';
        if (evolucao.assistente_social_nome) {
            profissionalDisplay = evolucao.assistente_social_nome;
        } else if (evolucao.funcionario_id) {
            profissionalDisplay = `Assistente Social (ID: ${evolucao.funcionario_id})`;
        }
        
        html += `
            <tr>
                <td>
                    <div class="text-nowrap">
                        <div class="fw-bold">${dataFormatada}</div>
                        <small class="text-muted">${horaFormatada}</small>
                    </div>
                </td>
                <td>
                    <small class="text-muted">Assistente Social:</small><br>
                    ${profissionalDisplay}
                </td>
                <td>
                    <div class="texto-evolucao" style="white-space: pre-wrap; word-wrap: break-word;">
                        ${evolucao.evolucao_assistente_social || 'Sem registro de evolução.'}
                    </div>
                    <div class="mt-2">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="imprimirEvolucaoAssistenteSocialIndividual(${evolucao.id})">
                            <i class="fas fa-print me-1"></i>Imprimir
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.html(html);
}

/**
 * Abre o modal para nova evolução de assistência social
 */
function abrirModalNovaEvolucaoAssistenteSocial() {
    try {
        // Verificar se o modal existe no DOM
        const modalElement = document.getElementById('modalNovaEvolucaoAssistenteSocial');
        
        if (!modalElement) {
            console.error('ERRO: Modal não encontrado no DOM!');
            alert('Erro: Modal de assistência social não foi encontrado na página!');
            return;
        }
        
        // Preparar campos do formulário
        const agora = new Date();
        const dataAtual = agora.toISOString().split('T')[0];
        const horaAtual = agora.toTimeString().slice(0, 5);
        
        $('#dataEvolucaoAssistenteSocial').val(dataAtual);
        $('#horaEvolucaoAssistenteSocial').val(horaAtual);
        $('#textoEvolucaoAssistenteSocial').val('');
        
        if (typeof session !== 'undefined' && session && session.user_id) {
            $('#assistenteSocialHidden').val(session.user_id);
        }
        
        // Tentar abrir o modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            $('#modalNovaEvolucaoAssistenteSocial').modal('show');
        }
        
    } catch (error) {
        console.error('ERRO ao abrir modal:', error);
        alert('Erro ao abrir modal: ' + error.message);
    }
}

/**
 * Salva uma nova evolução de assistência social
 */
function salvarNovaEvolucaoAssistenteSocial() {
    const atendimentoId = $('#atendimento_id').val();
    // Usar o campo hidden para o profissional
    const funcionarioId = $('#assistenteSocialHidden').val() || session.user_id;
    const dataEvolucao = $('#dataEvolucaoAssistenteSocial').val();
    const horaEvolucao = $('#horaEvolucaoAssistenteSocial').val();
    const textoEvolucao = $('#textoEvolucaoAssistenteSocial').val().trim();
    
    // Validações
    if (!funcionarioId) {
        alert('Erro: Profissional não identificado.');
        return;
    }
    
    if (!dataEvolucao || !horaEvolucao) {
        alert('Por favor, preencha a data e hora da evolução.');
        return;
    }
    
    if (!textoEvolucao) {
        alert('Por favor, descreva a evolução de assistência social do paciente.');
        return;
    }
    
    // Combinar data e hora
    const dataHoraEvolucao = `${dataEvolucao} ${horaEvolucao}:00`;
    
    // Dados para envio
    const dados = {
        funcionario_id: parseInt(funcionarioId),
        data_evolucao: dataHoraEvolucao,
        evolucao_assistente_social: textoEvolucao
    };
    
    console.log('Salvando evolução de assistência social:', dados);
    
    // Desabilitar botão de salvar
    const btnSalvar = $('#modalNovaEvolucaoAssistenteSocial .btn-warning');
    const textoOriginal = btnSalvar.html();
    btnSalvar.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-1"></i>Salvando...');
    
    // Enviar dados
    $.ajax({
        url: `/evolucoes_assistentesocial/atendimento/${atendimentoId}`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            console.log('Evolução de assistência social salva com sucesso:', response);
            
            // Fechar modal
            $('#modalNovaEvolucaoAssistenteSocial').modal('hide');
            
            // Recarregar evoluções
            carregarEvolucoesAssistenteSocial();
            
            // Mostrar mensagem de sucesso
            alert('Evolução de assistência social salva com sucesso!');
        },
        error: function(xhr, status, error) {
            console.error('Erro ao salvar evolução de assistência social:', error);
            console.error('Status HTTP:', xhr.status);
            console.error('Resposta do servidor:', xhr.responseText);
            
            let mensagemErro = 'Erro ao salvar evolução de assistência social.';
            
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.mensagem) {
                    mensagemErro = response.mensagem;
                }
            } catch (e) {
                if (xhr.status === 403) {
                    mensagemErro = 'Acesso negado para registrar evoluções de assistência social.';
                } else if (xhr.status === 500) {
                    mensagemErro = 'Erro interno do servidor ao salvar evolução.';
                }
            }
            
            alert(mensagemErro);
        },
        complete: function() {
            // Restaurar botão
            btnSalvar.prop('disabled', false).html(textoOriginal);
        }
    });
}

/**
 * Limpa o formulário de nova evolução de assistência social
 */
function limparFormularioEvolucaoAssistenteSocial() {
    // Limpar apenas o campo de texto
    $('#textoEvolucaoAssistenteSocial').val('');
    
    // Limpar campos hidden
    $('#assistenteSocialHidden').val('');
    $('#dataEvolucaoAssistenteSocial').val('');
    $('#horaEvolucaoAssistenteSocial').val('');
}

/**
 * Abre a página de impressão de uma evolução individual de assistência social
 */
function imprimirEvolucaoAssistenteSocialIndividual(evolucaoId) {
    if (!evolucaoId) {
        alert('Erro: ID da evolução não encontrado.');
        return;
    }
    
    // Abrir página de impressão em nova aba
    const url = `/impressao_assistente_social_evolucao/${evolucaoId}`;
    window.open(url, '_blank');
}

// Limpar formulário quando modal de evolução de assistência social for fechado
$('#modalNovaEvolucaoAssistenteSocial').on('hidden.bs.modal', function() {
    limparFormularioEvolucaoAssistenteSocial();
});