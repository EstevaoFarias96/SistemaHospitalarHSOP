// Arquivo: evolucoes_enfermagem.js
// Responsável pelas funcionalidades relacionadas a evoluções de enfermagem

// Função para carregar evoluções de enfermagem
function carregarEvolucoesEnfermagem() {
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ao carregar evoluções de enfermagem:', window.internacaoId);
        $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }

    $.ajax({
        url: `/api/enfermagem/evolucao/${window.internacaoId}`,
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
                renderizarEvolucoesDoDia(evolucoesDoDia);
                
                // Renderizar evoluções antigas
                renderizarEvolucoesAntigas(evolucoesAntigas);
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

// Função para renderizar evoluções do dia atual
function renderizarEvolucoesDoDia(evolucoes) {
    if (evolucoes.length > 0) {
        let htmlDoDia = '';
        evolucoes.forEach(ev => {
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
}

// Função para renderizar evoluções antigas
function renderizarEvolucoesAntigas(evolucoes) {
    if (evolucoes.length > 0) {
        let htmlAntigas = '';
        evolucoes.forEach(ev => {
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
}

// Filtrar evoluções por data
function filtrarEvolucoesPorData(data) {
    if (!data) {
        // Se não houver data, recarregar todas as evoluções
        carregarEvolucoesEnfermagem();
        return;
    }
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${window.internacaoId}?data=${data}`,
        method: 'GET',
        success: function(response) {
            if (Array.isArray(response) && response.length > 0) {
                $('#titulo-evolucoes-hoje').text(`Evoluções de ${new Date(data).toLocaleDateString('pt-BR')}`);
                renderizarEvolucoesDoDia(response);
                $('#antigas-container').hide();
            } else {
                $('#listaEvolucoesDoDia').html(`<tr><td colspan="3" class="text-center">Nenhuma evolução encontrada para ${new Date(data).toLocaleDateString('pt-BR')}.</td></tr>`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao filtrar evoluções por data:', xhr.responseText);
            $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao filtrar evoluções.</td></tr>');
        }
    });
}

// Salvar admissão de enfermagem
function salvarAdmissaoEnfermagem() {
    const admissaoTexto = $('#admissao_enfermagem').val().trim();
    
    if (!admissaoTexto) {
        alert('Por favor, preencha a admissão de enfermagem.');
        return;
    }
    
    // Mostrar carregamento
    $('#btn-salvar-admissao').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
    
    $.ajax({
        url: '/api/enfermagem/admissao',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            atendimentos_clinica_id: window.internacaoId,
            funcionario_id: parseInt(window.session.user_id),
            texto: admissaoTexto
        }),
        success: function(response) {
            // Restaurar o botão
            $('#btn-salvar-admissao').prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
            
            // Atualizar a visualização do texto diretamente
            $('.texto-admissao').html(admissaoTexto);
            
            // Esconder o formulário e mostrar o texto
            $('#admissao-form-container').hide();
            $('#admissao-texto-container').show();
            
            // Mostrar mensagem de sucesso
            alert('Admissão de enfermagem registrada com sucesso!');
        },
        error: function(xhr, status, error) {
            // Restaurar o botão
            $('#btn-salvar-admissao').prop('disabled', false).html('<i class="fas fa-save"></i> Salvar Admissão');
            
            console.error('Erro ao salvar admissão de enfermagem:', xhr.responseText);
            alert('Erro de comunicação ao tentar salvar admissão: ' + (xhr.responseJSON?.erro || error));
        }
    });
}

// Inicialização e configuração dos eventos
$(document).ready(function() {
    // Handler para submissão de nova evolução de enfermagem
    $('#formEvolucaoEnfermagem').submit(function(e) {
        e.preventDefault();
        
        // Usar apenas o textarea simples
        const evolucaoTexto = $('#texto_evolucao_enfermagem').val().trim();
        if (!evolucaoTexto) {
            alert('Por favor, preencha o texto da evolução.');
            return;
        }
        
        // Mostrar carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Enviando...');
        btnSubmit.prop('disabled', true);
        
        $.ajax({
            url: '/api/enfermagem/evolucao',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                atendimentos_clinica_id: window.internacaoId,
                funcionario_id: parseInt(window.session.user_id),
                texto: evolucaoTexto
            }),
            success: function(response) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                alert('Evolução de enfermagem registrada com sucesso!');
                $('#modalEnfermagemEvolucao').modal('hide');
                // Limpar o textarea
                $('#texto_evolucao_enfermagem').val('');
                // Recarregar evoluções
                carregarEvolucoesEnfermagem();
            },
            error: function(xhr, status, error) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                console.error('Erro ao registrar evolução:', xhr.responseText);
                alert('Erro ao registrar evolução: ' + error);
            }
        });
    });
    
    // Configurar filtro por data
    $('#btn-filtrar-data').click(function() {
        const data = $('#filtro-data').val();
        if (data) {
            filtrarEvolucoesPorData(data);
        } else {
            alert('Por favor, selecione uma data para filtrar.');
        }
    });
    
    // Limpar filtro
    $('#btn-limpar-filtro').click(function() {
        $('#filtro-data').val('');
        $('#titulo-evolucoes-hoje').text('Evoluções de Hoje');
        carregarEvolucoesEnfermagem();
        // Mostrar container de antigas novamente
        $('#antigas-container').show();
    });
}); 