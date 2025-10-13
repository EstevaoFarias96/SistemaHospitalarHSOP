/**
 * Módulo completo para funcionalidades de enfermagem
 * Inclui: Evolução, SAE e Prescrição
 */

// Variável global para armazenar o ID da internação
let internacaoId = null;

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    console.log('Inicializando módulo de enfermagem completo');
    
    // O internacaoId será atribuído no template principal
    // Obter outros IDs alternativos se internacaoId não estiver definido
    if (!internacaoId) {
        internacaoId = $('#internacao_id').val() || $('#internacao_id_evolucao').val() || $('#internacao_id_prescricao').val();
    }
    
    const atendimentoId = $('#sae_paciente_id').val(); // Agora contém o atendimento_id
    
    console.log('ID da internação:', internacaoId);
    console.log('ID do atendimento para SAE:', atendimentoId);
    
    if (internacaoId) {
        // Carregar todas as informações
        carregarEvolucoesEnfermagem();
        carregarPrescricoesEnfermagem();
        
        // Iniciar atualizações automáticas (opcional - pode ser desabilitado se causar problemas)
        // iniciarAtualizacaoAutomatica();
    }
    
    if (atendimentoId) {
        carregarSAE(atendimentoId);
    }
    
    // Configurar eventos
    configurarEventosEvolucao();
    configurarEventosPrescricao();
    configurarEventosSAE();
});

// ========== EVOLUÇÃO DE ENFERMAGEM ==========

function carregarEvolucoesEnfermagem(silencioso = false) {
    if (!internacaoId) {
        console.error('ID da internação não definido');
        return;
    }
    
    console.log('Carregando evoluções de enfermagem para internação:', internacaoId);
    
    // Mostrar loading apenas se não for um carregamento silencioso
    if (!silencioso) {
        mostrarLoadingEvolucoes();
    }
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Evoluções recebidas:', response);
            
            // Separar evoluções de hoje e anteriores
            const hoje = new Date().toLocaleDateString('pt-BR');
            const evolucoesDoDia = [];
            const evolucoesAntigas = [];
            
            if (Array.isArray(response)) {
                response.forEach(ev => {
                    const dataEv = new Date(ev.data_evolucao);
                    const dataFormatada = dataEv.toLocaleDateString('pt-BR');
                    
                    if (dataFormatada === hoje) {
                        evolucoesDoDia.push(ev);
                    } else {
                        evolucoesAntigas.push(ev);
                    }
                });
            }
            
            // Atualizar contador
            $('#contador-evolucoes-antigas').text(evolucoesAntigas.length);
            
            // Renderizar evoluções do dia
            renderizarEvolucoesDia(evolucoesDoDia);
            
            // Renderizar evoluções antigas
            renderizarEvolucoesAntigas(evolucoesAntigas);
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções:', error);
            $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
            $('#listaEvolucoesAntigas').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
}

function renderizarEvolucoesDia(evolucoes) {
    const tbody = $('#tabela-evolucoes-hoje');
    tbody.empty();
    
    if (evolucoes.length === 0) {
        tbody.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução registrada hoje.</td></tr>');
        return;
    }
    
    evolucoes.forEach(ev => {
        const dataObj = new Date(ev.data_evolucao);
        const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        tbody.append(`
            <tr>
                <td>${hora}</td>
                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                <td>
                    <div class="texto-evolucao">
                        ${ev.texto || ''}
                    </div>
                </td>
            </tr>
        `);
    });
}

function renderizarEvolucoesAntigas(evolucoes) {
    const tbody = $('#tabela-evolucoes-antigas');
    tbody.empty();
    
    if (evolucoes.length === 0) {
        tbody.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução anterior encontrada.</td></tr>');
        return;
    }
    
    evolucoes.forEach(ev => {
        const dataObj = new Date(ev.data_evolucao);
        const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const hora = dataObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dataHora = `${dataFormatada} ${hora}`;
        
        tbody.append(`
            <tr>
                <td>${dataHora}</td>
                <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                <td>
                    <div class="texto-evolucao">
                        ${ev.texto || ''}
                    </div>
                </td>
            </tr>
        `);
    });
}

function configurarEventosEvolucao() {
    // Toggle evoluções antigas
    $('#toggle-evolucoes-antigas').on('click', function() {
        const container = $('#antigas-container');
        const isVisible = container.is(':visible');
        
        if (isVisible) {
            container.hide();
            $(this).find('span').text('Mostrar Antigas');
            $(this).find('i').removeClass('fa-eye-slash').addClass('fa-eye');
        } else {
            container.show();
            $(this).find('span').text('Ocultar Antigas');
            $(this).find('i').removeClass('fa-eye').addClass('fa-eye-slash');
        }
    });
    
    // Filtro de data
    $('#btn-filtrar-data').on('click', function() {
        const dataFiltro = $('#filtro-data').val();
        if (dataFiltro) {
            filtrarEvolucoesPorData(dataFiltro);
        }
    });
    
    $('#btn-limpar-filtro').on('click', function() {
        $('#filtro-data').val('');
        carregarEvolucoesEnfermagem();
    });
    
    // Formulário de nova evolução
    $('#formEvolucaoEnfermagem').on('submit', function(e) {
        e.preventDefault();
        salvarEvolucaoEnfermagem();
    });
}

function salvarEvolucaoEnfermagem() {
    const texto = $('#texto_evolucao_enfermagem').val().trim();
    const funcionarioId = $('#usuario_id').val();
    
    if (!texto) {
        alert('Por favor, preencha o texto da evolução.');
        return;
    }
    
    if (!internacaoId) {
        alert('Erro: ID da internação não encontrado.');
        return;
    }
    
    // Mostrar indicador de carregamento
    const btnSubmit = $('#formEvolucaoEnfermagem').find('button[type="submit"]');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Enviando...');
    btnSubmit.prop('disabled', true);
    
    $.ajax({
        url: '/api/enfermagem/evolucao',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            atendimentos_clinica_id: internacaoId,
            funcionario_id: funcionarioId,
            texto: texto
        }),
        success: function(response) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.log('Resposta da API:', response);
            
            // Verificar diferentes formatos de resposta da API
            const sucesso = response?.success === true || 
                           response?.status === 'success' || 
                           response?.message?.includes('sucesso') ||
                           (response && typeof response === 'object' && !response.error && !response.erro);
            
            if (sucesso) {
                // Mostrar notificação de sucesso mais suave
                mostrarNotificacaoSucesso('Evolução registrada com sucesso!');
                
                // Fechar modal com animação suave
                $('#modalEnfermagemEvolucao').modal('hide');
                $('#texto_evolucao_enfermagem').val('');
                
                // Recarregar evoluções para garantir que apareça corretamente
                carregarEvolucoesEnfermagem();
                
                console.log('Evolução de enfermagem registrada com sucesso!');
            } else {
                // Se chegou aqui mas não tem indicação clara de sucesso, 
                // vamos verificar se a evolução foi realmente salva
                console.warn('Resposta ambígua da API, verificando se foi salva...');
                verificarEvolucaoSalva(texto);
            }
        },
        error: function(xhr, status, error) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.error('Erro na requisição:', xhr, status, error);
            
            // Se for erro 200 ou 201 (sucesso), tratar como sucesso
            if (xhr.status === 200 || xhr.status === 201) {
                console.log('Status 200/201 detectado, tratando como sucesso');
                mostrarNotificacaoSucesso('Evolução registrada com sucesso!');
                
                $('#modalEnfermagemEvolucao').modal('hide');
                $('#texto_evolucao_enfermagem').val('');
                
                // Recarregar evoluções para garantir que apareça
                carregarEvolucoesEnfermagem();
                return;
            }
            
            // Para erros reais
            const mensagemErro = xhr.responseJSON?.erro || 
                               xhr.responseJSON?.message || 
                               xhr.responseText || 
                               'Erro de comunicação com o servidor';
            
            mostrarNotificacaoErro('Erro ao registrar evolução: ' + mensagemErro);
        }
    });
}

// Função para verificar se a evolução foi realmente salva
function verificarEvolucaoSalva(textoEvolucao) {
    console.log('Verificando se a evolução foi salva...');
    
    // Fazer uma consulta rápida para verificar se a evolução foi salva
    $.ajax({
        url: `/api/enfermagem/evolucao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Verificação de evolução salva:', response);
            
            if (Array.isArray(response)) {
                // Verificar se existe uma evolução recente com o mesmo texto
                const agora = new Date();
                const ultimosMinutos = new Date(agora.getTime() - 2 * 60 * 1000); // últimos 2 minutos
                
                const evolucaoRecente = response.find(ev => {
                    const dataEv = new Date(ev.data_evolucao);
                    return dataEv >= ultimosMinutos && 
                           ev.texto && 
                           ev.texto.trim() === textoEvolucao.trim();
                });
                
                if (evolucaoRecente) {
                    console.log('Evolução encontrada! Foi salva com sucesso.');
                    mostrarNotificacaoSucesso('Evolução registrada com sucesso!');
                    
                    $('#modalEnfermagemEvolucao').modal('hide');
                    $('#texto_evolucao_enfermagem').val('');
                    
                    // Recarregar evoluções para garantir que apareça
                    carregarEvolucoesEnfermagem();
                } else {
                    console.warn('Evolução não encontrada na verificação');
                    mostrarNotificacaoErro('Erro ao registrar evolução - texto não encontrado no servidor');
                }
            } else {
                console.warn('Resposta inesperada na verificação');
                mostrarNotificacaoErro('Erro ao verificar se a evolução foi salva');
            }
        },
        error: function(xhr) {
            console.error('Erro na verificação:', xhr);
            mostrarNotificacaoErro('Erro ao verificar se a evolução foi salva');
        }
    });
}

// ========== SAE ==========

function carregarSAE(atendimentoId) {
    if (!atendimentoId) {
        console.error('ID do atendimento não definido');
        return;
    }

    console.log('Carregando SAE para atendimento:', atendimentoId);

    // Buscar o paciente_id real via internação
    $.ajax({
        url: `/api/internacao/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            if (!response.success || !response.internacao) {
                console.error('Resposta inválida da API de internação:', response);
                $('#listaSAE').html('<div class="alert alert-danger">Erro ao buscar dados da internação.</div>');
                return;
            }
            const pacienteId = response.internacao.paciente_id;
            if (!pacienteId) {
                $('#listaSAE').html('<div class="alert alert-danger">Paciente não encontrado na internação.</div>');
                return;
            }
            // Buscar o histórico de SAEs do paciente
            $.ajax({
                url: `/api/enfermagem/sae/historico/${pacienteId}`,
                method: 'GET',
                success: function(resp) {
                    if (resp.success && Array.isArray(resp.sae) && resp.sae.length > 0) {
                        // Sempre exibe a mais recente
                        renderizarSAE(resp.sae[0]);
                    } else {
                        $('#listaSAE').html(`
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i> Nenhuma SAE registrada para este paciente.
                            </div>
                        `);
                    }
                },
                error: function(xhr) {
                    console.error('Erro ao carregar histórico de SAE:', xhr);
                    $('#listaSAE').html(`
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle"></i> Erro ao carregar SAE.
                        </div>
                    `);
                }
            });
        },
        error: function(xhr) {
            console.error('Erro ao buscar dados da internação:', xhr);
            $('#listaSAE').html('<div class="alert alert-danger">Erro ao buscar dados da internação.</div>');
        }
    });
}

function renderizarSAE(sae) {
    const html = `
        <div class="card">
            <div class="card-header bg-light">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-clipboard-check me-2"></i>
                        SAE - ${new Date(sae.data_registro).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })} ${new Date(sae.data_registro).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </h6>
                    ${sae.eh_hoje ? '<span class="badge bg-success">Hoje</span>' : ''}
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <!-- Sinais Vitais -->
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Sinais Vitais</h6>
                        <table class="table table-sm">
                            <tr><td><strong>PA:</strong></td><td>${sae.pa || '-'}</td></tr>
                            <tr><td><strong>FC:</strong></td><td>${sae.fc || '-'}</td></tr>
                            <tr><td><strong>SAT:</strong></td><td>${sae.sat || '-'}</td></tr>
                            <tr><td><strong>T:</strong></td><td>${sae.t || '-'}</td></tr>
                            <tr><td><strong>R:</strong></td><td>${sae.r || '-'}</td></tr>
                            <tr><td><strong>DX:</strong></td><td>${sae.dx || '-'} mg/dL</td></tr>
                        </table>
                    </div>
                    
                    <!-- Estados -->
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Estado Geral</h6>
                        <p><strong>Estado:</strong> ${sae.estado_geral || '-'}</p>
                        <p><strong>Sistema Neurológico:</strong> ${sae.sistema_neurologico || '-'}</p>
                        <p><strong>Ventilação:</strong> ${sae.ventilacao || '-'}</p>
                        <p><strong>Pele:</strong> ${sae.pele || '-'}</p>
                    </div>
                </div>
                
                <hr>
                
                <div class="row">
                    <!-- Sistemas -->
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Sistemas</h6>
                        <p><strong>Gastrointestinal:</strong> ${sae.sistema_gastrointerstinal || '-'}</p>
                        <p><strong>Vascular:</strong> ${sae.regulacao_vascular || '-'}</p>
                        <p><strong>Abdominal:</strong> ${sae.regulacao_abdominal || '-'}</p>
                        <p><strong>Urinário:</strong> ${sae.sistema_urinario || '-'}</p>
                    </div>
                    
                    <!-- Informações Adicionais -->
                    <div class="col-md-6">
                        <h6 class="text-primary mb-3">Informações Adicionais</h6>
                        <p><strong>Medicação:</strong> ${sae.medicacao || '-'}</p>
                        <p><strong>Alergias:</strong> ${sae.alergias || '-'}</p>
                        <p><strong>Acesso Venoso:</strong> ${sae.acesso_venoso || '-'}</p>
                    </div>
                </div>
                
                ${sae.diagnostico_de_enfermagem ? `
                <hr>
                <div class="row">
                    <div class="col-12">
                        <h6 class="text-primary mb-3">Diagnóstico de Enfermagem</h6>
                        <p>${sae.diagnostico_de_enfermagem}</p>
                    </div>
                </div>
                ` : ''}
                
                ${sae.observacao ? `
                <hr>
                <div class="row">
                    <div class="col-12">
                        <h6 class="text-primary mb-3">Observações</h6>
                        <p>${sae.observacao}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    $('#listaSAE').html(html);
}

function configurarEventosSAE() {
    // Formulário SAE
    $('#formSAE').on('submit', function(e) {
        e.preventDefault();
        salvarSAE();
    });
    
    // Checkboxes e radios do SAE
    configurarCamposSAE();
}

function salvarSAE() {
    const atendimentoId = $('#sae_paciente_id').val(); // Agora contém atendimento_id
    const enfermeiroId = $('#usuario_id').val();
    
    // Validações básicas
    if (!atendimentoId) {
        alert('Erro: ID do atendimento não encontrado');
        return;
    }
    
    if (!enfermeiroId) {
        alert('Erro: ID do enfermeiro não encontrado');
        return;
    }
    
    // Mostrar indicador de carregamento
    const btnSubmit = $('#formSAE').find('button[type="submit"]');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
    btnSubmit.prop('disabled', true);
    
    // Primeiro, buscar o paciente_id real via internação
    $.ajax({
        url: `/api/internacao/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            // Verificar se a resposta contém os dados necessários
            if (!response.success || !response.internacao) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                console.error('Resposta inválida da API de internação:', response);
                alert('Erro: Dados da internação não encontrados');
                return;
            }
            
            const internacaoData = response.internacao;
            const pacienteIdReal = internacaoData.paciente_id;
            
            // Verificar se o paciente_id é válido
            if (!pacienteIdReal) {
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                console.error('Paciente ID não encontrado na internação:', internacaoData);
                alert('Erro: ID do paciente não encontrado na internação');
                return;
            }
            
            console.log('Salvando SAE para paciente ID:', pacienteIdReal, 'Atendimento ID:', atendimentoId);
            
            // Coletar dados do formulário
            const dados = {
                paciente_id: pacienteIdReal, // Usar o ID real do paciente
                enfermeiro_id: enfermeiroId,
                hipotese_diagnostica: $('#sae_hipotese_diagnostica').val() || '',
                pa: $('#sae_pa').val(),
                fc: $('#sae_fc').val(),
                sat: $('#sae_sat').val(),
                dx: $('#sae_dx').val(),
                r: $('#sae_r').val(),
                t: $('#sae_t').val(),
                pulso: $('#sae_pulso').val(),
                medicacao: $('#sae_medicacao').val(),
                alergias: $('#sae_alergias').val(),
                antecedentes_pessoais: $('#sae_antecedentes_pessoais').val(),
                acesso_venoso: $('#sae_acesso_venoso').val(),
                observacao: $('#sae_observacao').val(),
                sistema_neurologico: coletarCheckboxes('sae_neuro_'),
                estado_geral: $('input[name="sae_estado_geral"]:checked').val() || '',
                ventilacao: coletarCheckboxes('sae_ventilacao_') + ' ' + $('#sae_ventilacao_o2').val(),
                pele: coletarCheckboxes('sae_pele_'),
                sistema_gastrointerstinal: coletarSistemaGI(),
                regulacao_vascular: coletarCheckboxes('sae_vascular_'),
                pulso: coletarCheckboxes('sae_pulso_'),
                regulacao_abdominal: coletarCheckboxes('sae_abdominal_'),
                rha: $('input[name="sae_rha"]:checked').val() || '',
                sistema_urinario: coletarCheckboxes('sae_urinario_'),
                diagnostico_de_enfermagem: coletarDiagnosticoEnfermagem()
            };
            
            console.log('Dados do SAE a serem enviados:', dados);
            
            // Salvar a SAE
            $.ajax({
                url: '/api/enfermagem/sae',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(dados),
                success: function(response) {
                    // Restaurar botão
                    btnSubmit.html(textoOriginal);
                    btnSubmit.prop('disabled', false);
                    
                    if (response.success) {
                        $('#modalSAE').modal('hide');
                        $('#formSAE')[0].reset();
                        carregarSAE(atendimentoId); // Recarregar usando atendimento_id
                        alert('SAE registrada com sucesso!');
                    } else {
                        alert('Erro ao registrar SAE: ' + (response.message || 'Erro desconhecido'));
                    }
                },
                error: function(xhr) {
                    // Restaurar botão
                    btnSubmit.html(textoOriginal);
                    btnSubmit.prop('disabled', false);
                    
                    // Se for erro 200 ou 201 (sucesso), tratar como sucesso
                    if (xhr.status === 200 || xhr.status === 201) {
                        $('#modalSAE').modal('hide');
                        $('#formSAE')[0].reset();
                        carregarSAE(atendimentoId); // Recarregar usando atendimento_id
                        alert('SAE registrada com sucesso!');
                        return;
                    }
                    
                    console.error('Erro ao registrar SAE:', xhr);
                    const errorMessage = xhr.responseJSON?.message || xhr.responseJSON?.error || 'Erro desconhecido';
                    alert('Erro ao registrar SAE: ' + errorMessage);
                }
            });
        },
        error: function(xhr) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.error('Erro ao buscar dados da internação:', xhr);
            const errorMessage = xhr.responseJSON?.message || 'Erro de comunicação';
            alert('Erro ao buscar dados da internação: ' + errorMessage);
        }
    });
}

function coletarCheckboxes(prefixo) {
    const valores = [];
    $(`input[id^="${prefixo}"]:checked`).each(function() {
        valores.push($(this).next('label').text());
    });
    return valores.join(', ');
}

function coletarSistemaGI() {
    const partes = [];
    
    if ($('#sae_gi_gavagem').is(':checked')) partes.push('Gavagem');
    if ($('#sae_gi_aberta').is(':checked')) partes.push('Aberta');
    if ($('#sae_gi_emese').is(':checked')) partes.push('Emese');
    
    if ($('#sae_gi_evac_presente').is(':checked')) {
        partes.push('Evacuações presentes');
    } else if ($('#sae_gi_evac_ausente').is(':checked')) {
        const dias = $('#sae_gi_evac_dias').val();
        partes.push(`Evacuações ausentes há ${dias} dias`);
    }
    
    return partes.join(', ');
}

function coletarDiagnosticoEnfermagem() {
    const diagnosticos = [];
    
    $('input[id^="sae_dx_"]:checked').each(function() {
        diagnosticos.push($(this).next('label').text());
    });
    
    const outros = $('#sae_dx_outros').val();
    if (outros) {
        diagnosticos.push(outros);
    }
    
    return diagnosticos.join('; ');
}

function configurarCamposSAE() {
    // Configurar evacuações
    $('#sae_gi_evac_ausente').on('change', function() {
        if ($(this).is(':checked')) {
            $('#sae_gi_evac_presente').prop('checked', false);
            $('#sae_gi_evac_dias').prop('disabled', false);
        } else {
            $('#sae_gi_evac_dias').prop('disabled', true).val('');
        }
    });
    
    $('#sae_gi_evac_presente').on('change', function() {
        if ($(this).is(':checked')) {
            $('#sae_gi_evac_ausente').prop('checked', false);
            $('#sae_gi_evac_dias').prop('disabled', true).val('');
        }
    });
}

// ========== PRESCRIÇÃO DE ENFERMAGEM ==========

function carregarPrescricoesEnfermagem() {
    if (!internacaoId) {
        console.error('ID da internação não definido');
        return;
    }
    
    console.log('Carregando prescrições de enfermagem para internação:', internacaoId);
    
    $.ajax({
        url: `/api/enfermagem/prescricao/${internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Prescrições recebidas:', response);
            
            if (response.success) {
                renderizarPrescricoes(response.prescricoes || []);
            } else {
                console.error('Erro na resposta da API:', response.message);
                $('#listaPrescricoesEnfermagem').html(`
                    <tr>
                        <td colspan="3" class="text-center text-muted">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Erro ao carregar prescrições: ${response.message}
                        </td>
                    </tr>
                `);
            }
        },
        error: function(xhr) {
            console.error('Erro ao carregar prescrições:', xhr);
            $('#listaPrescricoesEnfermagem').html(`
                <tr>
                    <td colspan="3" class="text-center text-muted">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erro ao carregar prescrições de enfermagem
                    </td>
                </tr>
            `);
        }
    });
}

function renderizarPrescricoes(prescricoes) {
    const tbody = $('#listaPrescricoesEnfermagem');
    tbody.empty();
    
    if (!prescricoes || prescricoes.length === 0) {
        tbody.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma prescrição registrada.</td></tr>');
        return;
    }
    
    prescricoes.forEach(presc => {
        const dataObj = new Date(presc.data_prescricao);
        const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const hora = dataObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dataHora = `${dataFormatada} ${hora}`;
        
        tbody.append(`
            <tr>
                <td>${dataHora}</td>
                <td>${presc.enfermeiro_nome || 'Não informado'}</td>
                <td>
                    <div class="texto-evolucao">
                        ${presc.texto || ''}
                    </div>
                </td>
            </tr>
        `);
    });
}

function configurarEventosPrescricao() {
    // Formulário de prescrição
    $('#formPrescricaoEnfermagem').on('submit', function(e) {
        e.preventDefault();
        salvarPrescricaoEnfermagem();
    });
    
    // Reset do modal ao abrir para nova prescrição
    $('#modalPrescricaoEnfermagem').on('show.bs.modal', function(e) {
        $('#prescricao_enfermagem_id').val('');
        $('#texto_prescricao_enfermagem').val('');
        $('#modalPrescricaoEnfermagemLabel').text('Nova Prescrição de Enfermagem');
        
        // Limpar campo de busca
        $('#busca_prescricao_template').val('');
        $('#resultados_busca_prescricao').hide();
        
        // Carregar prescrições padrão
        carregarPrescricoesPadrao();
    });
    
    // Configurar busca de prescrições padrão
    $('#busca_prescricao_template').on('input', function() {
        const termo = $(this).val().trim();
        if (termo.length >= 2) {
            buscarPrescricoesPadrao(termo);
        } else if (termo.length === 0) {
            carregarPrescricoesPadrao();
        }
    });
    
    // Configurar seleção de título
    $('#titulo_prescricao').on('change', function() {
        const titulo = $(this).val();
        const termo = $('#busca_prescricao_template').val().trim();
        buscarPrescricoesPadrao(termo, titulo);
    });
}

// Função para salvar prescrição de enfermagem (nova ou edição)
function salvarPrescricaoEnfermagem() {
    // Obter dados do formulário
    const prescricaoId = $('#prescricao_enfermagem_id').val();
    const internacaoId = $('#internacao_id_prescricao').val(); // Corrigido: usar o ID correto do campo
    const textoHtml = $('#texto_prescricao_enfermagem').val();
    
    // Validação simples
    if (!textoHtml || textoHtml.trim() === '') {
        alert('Por favor, digite a prescrição de enfermagem.');
        return;
    }
    
    // Validação do ID da internação
    if (!internacaoId || internacaoId.trim() === '') {
        alert('Erro: ID da internação não encontrado. Por favor, recarregue a página.');
        return;
    }
    
    // Obter ID do funcionário da sessão
    let funcionarioId = null;
    
    // Primeiro, tentar obter do elemento hidden no formulário
    if ($('#enfermeiro_id').length) {
        funcionarioId = $('#enfermeiro_id').val();
    } 
    // Se não encontrou, tentar da variável global session
    else if (typeof session !== 'undefined' && session.user_id) {
        funcionarioId = session.user_id;
    }
    // Se ainda não encontrou, tentar da variável window.enfermeiroId
    else if (typeof window.enfermeiroId !== 'undefined') {
        funcionarioId = window.enfermeiroId;
    }
    // Último recurso: tentar da variável global window.session
    else if (typeof window.session !== 'undefined' && window.session.user_id) {
        funcionarioId = window.session.user_id;
    }
    
    // Verificar se conseguimos um ID de funcionário
    if (!funcionarioId) {
        alert('Erro: ID do enfermeiro não encontrado. Por favor, faça login novamente.');
        return;
    }
    
    // Preparar dados para envio
    const dados = {
        atendimentos_clinica_id: parseInt(internacaoId), // Garantir que seja número
        funcionario_id: parseInt(funcionarioId),
        texto: textoHtml
    };
    
    console.log('Enviando dados da prescrição:', dados);
    
    // Configuração da requisição
    const config = {
        method: prescricaoId ? 'PUT' : 'POST',
        url: prescricaoId 
            ? `/api/enfermagem/prescricao/${prescricaoId}` 
            : '/api/enfermagem/prescricao',
        contentType: 'application/json',
        data: JSON.stringify(dados)
    };
    
    // Mostrar loading
    const $submitBtn = $('#formPrescricaoEnfermagem button[type="submit"]');
    const originalText = $submitBtn.html();
    $submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Salvando...');
    
    // Enviar a requisição
    $.ajax(config)
        .done(function(data) {
            if (data.erro) {
                throw new Error(data.erro);
            }
            
            // Fechar o modal
            $('#modalPrescricaoEnfermagem').modal('hide');
            
            // Recarregar as prescrições de enfermagem
            carregarPrescricoesEnfermagem();
            
            // Exibir mensagem de sucesso
            alert(prescricaoId ? 'Prescrição atualizada com sucesso!' : 'Prescrição registrada com sucesso!');
            
            // Limpar formulário
            $('#prescricao_enfermagem_id').val('');
            $('#texto_prescricao_enfermagem').val('');
        })
        .fail(function(xhr, status, error) {
            console.error('Erro ao salvar prescrição:', xhr.responseText);
            let errorMessage = 'Erro ao salvar prescrição';
            
            if (xhr.responseJSON && xhr.responseJSON.erro) {
                errorMessage = xhr.responseJSON.erro;
            } else if (xhr.responseText) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.erro || errorMessage;
                } catch (e) {
                    errorMessage = `Erro ${xhr.status}: ${xhr.statusText}`;
                }
            }
            
            alert(`Erro ao salvar prescrição: ${errorMessage}`);
        })
        .always(function() {
            // Restaurar botão
            $submitBtn.prop('disabled', false).html(originalText);
        });
}

// Função para carregar prescrições padrão
function carregarPrescricoesPadrao() {
    console.log('Carregando prescrições padrão...');
    
    $.ajax({
        url: '/api/listar_prescricoes_enf',
        method: 'GET',
        data: { apenas_padrao: 'true' },
        success: function(response) {
            if (response.success) {
                renderizarPrescricoesPadrao(response.prescricoes);
                
                // Extrair títulos únicos para o select
                const titulos = [...new Set(response.prescricoes
                    .map(p => p.titulo)
                    .filter(titulo => titulo && titulo.trim() !== '')
                )].sort();
                
                // Atualizar select de títulos
                const selectTitulos = $('#titulo_prescricao');
                selectTitulos.empty();
                selectTitulos.append('<option value="">Todos os títulos</option>');
                
                titulos.forEach(titulo => {
                    selectTitulos.append(`<option value="${titulo}">${titulo}</option>`);
                });
                
                // Mostrar resultados
                $('#resultados_busca_prescricao').show();
            } else {
                console.error('Erro ao carregar prescrições padrão:', response.error);
                $('#lista_prescricoes_padrao').html('<div class="alert alert-danger">Erro ao carregar prescrições padrão.</div>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro na requisição de prescrições padrão:', error);
            $('#lista_prescricoes_padrao').html('<div class="alert alert-danger">Erro ao carregar prescrições padrão.</div>');
        }
    });
}

// Função para buscar prescrições padrão com filtros
function buscarPrescricoesPadrao(termo = '', titulo = '') {
    console.log('Buscando prescrições padrão:', { termo, titulo });
    
    const params = new URLSearchParams();
    params.append('apenas_padrao', 'true');
    if (termo) params.append('termo', termo);
    if (titulo) params.append('titulo', titulo);
    
    $.ajax({
        url: `/api/listar_prescricoes_enf?${params.toString()}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                renderizarPrescricoesPadrao(response.prescricoes);
                $('#resultados_busca_prescricao').show();
            } else {
                console.error('Erro na busca de prescrições:', response.error);
                $('#lista_prescricoes_padrao').html('<div class="alert alert-danger">Erro na busca de prescrições.</div>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro na busca de prescrições:', error);
            $('#lista_prescricoes_padrao').html('<div class="alert alert-danger">Erro na busca de prescrições.</div>');
        }
    });
}

// Função para renderizar prescrições padrão
function renderizarPrescricoesPadrao(prescricoes) {
    const container = $('#lista_prescricoes_padrao');
    container.empty();
    
    if (prescricoes.length === 0) {
        container.html('<div class="alert alert-info">Nenhuma prescrição encontrada.</div>');
        return;
    }
    
    prescricoes.forEach(prescricao => {
        const card = $(`
            <div class="card mb-2 prescricao-padrao-card" data-id="${prescricao.id}">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1">${prescricao.titulo}</h6>
                            ${prescricao.nic_tipo ? `<small class="text-muted"><i class="fas fa-tag"></i> ${prescricao.nic_tipo}</small>` : ''}
                            ${prescricao.nic ? `<small class="text-muted ms-2"><i class="fas fa-code"></i> NIC: ${prescricao.nic}</small>` : ''}
                        </div>
                        <button class="btn btn-sm btn-outline-primary btn-usar-template" data-id="${prescricao.id}">
                            <i class="fas fa-plus"></i> Usar
                        </button>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted prescricao-preview">
                            ${prescricao.texto_prescricao.substring(0, 100)}${prescricao.texto_prescricao.length > 100 ? '...' : ''}
                        </small>
                    </div>
                </div>
            </div>
        `);
        
        container.append(card);
    });
    
    // Configurar eventos dos botões "Usar"
    $('.btn-usar-template').on('click', function() {
        const templateId = $(this).data('id');
        usarTemplatePrescricao(templateId);
    });
    
    // Configurar hover para mostrar texto completo
    $('.prescricao-padrao-card').on('mouseenter', function() {
        const templateId = $(this).data('id');
        const prescricao = prescricoes.find(p => p.id == templateId);
        
        if (prescricao) {
            $(this).find('.prescricao-preview').attr('title', prescricao.texto_prescricao);
        }
    });
}

// Função para usar template de prescrição
function usarTemplatePrescricao(templateId) {
    console.log('Usando template de prescrição:', templateId);
    
    $.ajax({
        url: `/api/listar_prescricoes_enf?id=${templateId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                const template = response.template;
                
                // Obter texto atual do editor
                const textoAtual = $('#texto_prescricao_enfermagem').val();
                
                // Adicionar texto do template
                let novoTexto = textoAtual;
                if (textoAtual.trim() !== '') {
                    novoTexto += '\n\n';
                }
                
                // Adicionar título se disponível
                if (template.titulo) {
                    novoTexto += `• ${template.titulo}:\n`;
                }
                
                novoTexto += template.texto_prescricao;
                
                // Atualizar o editor
                $('#texto_prescricao_enfermagem').val(novoTexto);
                
                // Mostrar notificação
                mostrarNotificacaoSucesso(`Template "${template.titulo}" adicionado com sucesso!`);
                
                // Focar no final do texto
                const textarea = $('#texto_prescricao_enfermagem')[0];
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
                
            } else {
                console.error('Erro ao obter template:', response.error);
                mostrarNotificacaoErro('Erro ao carregar template de prescrição');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao obter template:', error);
            mostrarNotificacaoErro('Erro ao carregar template de prescrição');
        }
    });
}

// ========== FUNÇÕES AUXILIARES ==========

function filtrarEvolucoesPorData(dataFiltro) {
    mostrarLoadingEvolucoes();
    
    $.ajax({
        url: `/api/enfermagem/evolucao/${internacaoId}`,
        method: 'GET',
        data: { data_filtro: dataFiltro },
        success: function(response) {
            console.log('Evoluções filtradas recebidas:', response);
            
            const evolucoesFiltradas = Array.isArray(response) ? response : [];
            
            // Renderizar evoluções filtradas
            const tbody = $('#listaEvolucoesDoDia');
            tbody.empty();
            
            if (evolucoesFiltradas.length === 0) {
                tbody.html(`<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução encontrada para ${new Date(dataFiltro).toLocaleDateString('pt-BR')}.</td></tr>`);
                return;
            }
            
            evolucoesFiltradas.forEach(ev => {
                const dataObj = new Date(ev.data_evolucao);
                const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                tbody.append(`
                    <tr>
                        <td>${hora}</td>
                        <td>${ev.enfermeiro_nome || 'Não informado'}</td>
                        <td>
                            <div class="texto-evolucao">
                                ${ev.texto || ''}
                            </div>
                        </td>
                    </tr>
                `);
            });
            
            // Mostrar notificação
            mostrarNotificacaoSucesso(`${evolucoesFiltradas.length} evolução(ões) encontrada(s) para ${new Date(dataFiltro).toLocaleDateString('pt-BR')}`);
        },
        error: function(xhr, status, error) {
            console.error('Erro ao filtrar evoluções:', error);
            $('#listaEvolucoesDoDia').html('<tr><td colspan="3" class="text-center text-danger">Erro ao filtrar evoluções.</td></tr>');
            mostrarNotificacaoErro('Erro ao filtrar evoluções por data');
        }
    });
}

// Função para mostrar notificação de sucesso mais suave
function mostrarNotificacaoSucesso(mensagem) {
    // Remover notificações anteriores
    $('.toast-notification').remove();
    
    const toast = $(`
        <div class="toast-notification position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </div>
    `);
    
    $('body').append(toast);
    
    // Auto-remover após 4 segundos
    setTimeout(() => {
        toast.fadeOut(500, function() {
            $(this).remove();
        });
    }, 4000);
}

// Função para mostrar notificação de erro
function mostrarNotificacaoErro(mensagem) {
    // Remover notificações anteriores
    $('.toast-notification').remove();
    
    const toast = $(`
        <div class="toast-notification position-fixed" style="top: 20px; right: 20px; z-index: 9999;">
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </div>
    `);
    
    $('body').append(toast);
    
    // Auto-remover após 6 segundos (erro fica mais tempo)
    setTimeout(() => {
        toast.fadeOut(500, function() {
            $(this).remove();
        });
    }, 6000);
}

// Função para adicionar nova evolução diretamente na lista
function adicionarNovaEvolucaoNaLista(evolucao) {
    const tbody = $('#listaEvolucoesDoDia');
    
    // Se a tabela está vazia, limpar a mensagem
    if (tbody.find('td[colspan]').length > 0) {
        tbody.empty();
    }
    
    const dataObj = new Date(evolucao.data_evolucao);
    const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Obter nome do usuário do campo hidden ou usar padrão
    const nomeUsuario = evolucao.enfermeiro_nome || $('#nome_usuario').val() || 'Usuário Atual';
    
    const novaLinha = $(`
        <tr class="nova-evolucao" style="background-color: #d4edda; opacity: 0;">
            <td>${hora}</td>
            <td>${nomeUsuario}</td>
            <td>
                <div class="texto-evolucao">
                    ${evolucao.texto}
                </div>
            </td>
        </tr>
    `);
    
    // Adicionar no topo da lista
    tbody.prepend(novaLinha);
    
    // Animação de entrada
    novaLinha.animate({
        opacity: 1
    }, 500, function() {
        // Após 2 segundos, remover o destaque
        setTimeout(() => {
            novaLinha.animate({
                backgroundColor: 'transparent'
            }, 1000, function() {
                novaLinha.removeClass('nova-evolucao').removeAttr('style');
            });
        }, 2000);
    });
    
    // Atualizar contador se necessário
    atualizarContadores();
}

// Função para atualizar contadores
function atualizarContadores() {
    const totalEvolucoesDia = $('#listaEvolucoesDoDia tr').filter(':not(:has(td[colspan]))').length;
    
    // Atualizar badge ou contador se existir
    if ($('#contador-evolucoes-dia').length) {
        $('#contador-evolucoes-dia').text(totalEvolucoesDia);
    }
}

// Função para mostrar loading suave
function mostrarLoadingEvolucoes() {
    const tbody = $('#listaEvolucoesDoDia');
    tbody.html(`
        <tr>
            <td colspan="3" class="text-center">
                <div class="d-flex align-items-center justify-content-center">
                    <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <span class="text-muted">Carregando evoluções...</span>
                </div>
            </td>
        </tr>
    `);
}

// Função para atualização automática das evoluções (opcional)
function iniciarAtualizacaoAutomatica() {
    // Verificar por novas evoluções a cada 30 segundos
    setInterval(function() {
        if (internacaoId && !$('#modalEnfermagemEvolucao').hasClass('show')) {
            // Só atualizar se o modal não estiver aberto
            carregarEvolucoesEnfermagem(true); // silencioso = true
        }
    }, 30000); // 30 segundos
}

// Função para parar atualizações automáticas quando necessário
function pararAtualizacaoAutomatica() {
    // Esta função pode ser chamada quando o usuário sair da página
    // Por agora, apenas log
    console.log('Parando atualizações automáticas de evoluções');
}

// Exportar funções globalmente se necessário
window.carregarEvolucoesEnfermagem = carregarEvolucoesEnfermagem;
window.carregarSAE = carregarSAE;
window.carregarPrescricoesEnfermagem = carregarPrescricoesEnfermagem;