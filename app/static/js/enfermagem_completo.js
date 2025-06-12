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

function carregarEvolucoesEnfermagem() {
    if (!internacaoId) {
        console.error('ID da internação não definido');
        return;
    }
    
    console.log('Carregando evoluções de enfermagem para internação:', internacaoId);
    
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
    const tbody = $('#listaEvolucoesDoDia');
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
    const tbody = $('#listaEvolucoesAntigas');
    tbody.empty();
    
    if (evolucoes.length === 0) {
        tbody.html('<tr><td colspan="3" class="text-center text-muted">Nenhuma evolução anterior encontrada.</td></tr>');
        return;
    }
    
    evolucoes.forEach(ev => {
        const dataObj = new Date(ev.data_evolucao);
        const dataHora = dataObj.toLocaleString('pt-BR');
        
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
            $('#modalEnfermagemEvolucao').modal('hide');
            $('#texto_evolucao_enfermagem').val('');
            carregarEvolucoesEnfermagem();
            alert('Evolução registrada com sucesso!');
        },
        error: function(xhr) {
            alert('Erro ao registrar evolução: ' + (xhr.responseJSON?.erro || 'Erro desconhecido'));
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
                        SAE - ${new Date(sae.data_registro).toLocaleString('pt-BR')}
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
    
    // Primeiro, buscar o paciente_id real via internação
    $.ajax({
        url: `/api/internacao/${atendimentoId}`,
        method: 'GET',
        success: function(response) {
            // Verificar se a resposta contém os dados necessários
            if (!response.success || !response.internacao) {
                console.error('Resposta inválida da API de internação:', response);
                alert('Erro: Dados da internação não encontrados');
                return;
            }
            
            const internacaoData = response.internacao;
            const pacienteIdReal = internacaoData.paciente_id;
            
            // Verificar se o paciente_id é válido
            if (!pacienteIdReal) {
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
                    console.error('Erro ao registrar SAE:', xhr);
                    const errorMessage = xhr.responseJSON?.message || xhr.responseJSON?.error || 'Erro desconhecido';
                    alert('Erro ao registrar SAE: ' + errorMessage);
                }
            });
        },
        error: function(xhr) {
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
            renderizarPrescricoes(response);
        },
        error: function(xhr) {
            console.error('Erro ao carregar prescrições:', xhr);
            $('#listaPrescricoesEnfermagem').html(
                '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>'
            );
        }
    });
}

function renderizarPrescricoes(prescricoes) {
    const tbody = $('#listaPrescricoesEnfermagem');
    tbody.empty();
    
    if (!prescricoes || prescricoes.length === 0) {
        tbody.html('<tr><td colspan="4" class="text-center text-muted">Nenhuma prescrição registrada.</td></tr>');
        return;
    }
    
    prescricoes.forEach(presc => {
        const dataObj = new Date(presc.data_prescricao);
        const dataFormatada = dataObj.toLocaleString('pt-BR');
        
        const cargoUsuario = $('#cargo_usuario').val() || 'enfermeiro';
        const botaoEditar = cargoUsuario.toLowerCase() === 'enfermeiro' ? `
            <button class="btn btn-sm btn-outline-primary btn-editar-prescricao-enfermagem" 
                    data-id="${presc.id}" 
                    data-texto="${(presc.texto || '').replace(/"/g, '&quot;')}">
                <i class="fas fa-edit"></i>
            </button>
        ` : '';
        
        tbody.append(`
            <tr>
                <td>${dataFormatada}</td>
                <td>${presc.enfermeiro_nome || 'Não informado'}</td>
                <td>
                    <div class="texto-evolucao">
                        ${presc.texto || ''}
                    </div>
                </td>
                <td>${botaoEditar}</td>
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
    
    // Botão de editar prescrição
    $(document).on('click', '.btn-editar-prescricao-enfermagem', function() {
        const id = $(this).data('id');
        const texto = $(this).data('texto');
        
        $('#prescricao_enfermagem_id').val(id);
        $('#texto_prescricao_enfermagem').val(texto);
        $('#modalPrescricaoEnfermagemLabel').text('Editar Prescrição de Enfermagem');
        $('#modalPrescricaoEnfermagem').modal('show');
    });
    
    // Reset do modal ao abrir para nova prescrição
    $('#modalPrescricaoEnfermagem').on('show.bs.modal', function(e) {
        if (!$(e.relatedTarget).hasClass('btn-editar-prescricao-enfermagem')) {
            $('#prescricao_enfermagem_id').val('');
            $('#texto_prescricao_enfermagem').val('');
            $('#modalPrescricaoEnfermagemLabel').text('Nova Prescrição de Enfermagem');
        }
    });
}

function salvarPrescricaoEnfermagem() {
    const prescricaoId = $('#prescricao_enfermagem_id').val();
    const texto = $('#texto_prescricao_enfermagem').val().trim();
    const funcionarioId = $('#enfermeiro_id').val() || $('#usuario_id').val();
    
    if (!texto) {
        alert('Por favor, preencha o texto da prescrição.');
        return;
    }
    
    const dados = { texto: texto };
    
    if (prescricaoId) {
        // Atualização
        $.ajax({
            url: `/api/enfermagem/prescricao/${prescricaoId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function() {
                $('#modalPrescricaoEnfermagem').modal('hide');
                $('#formPrescricaoEnfermagem')[0].reset();
                carregarPrescricoesEnfermagem();
                alert('Prescrição atualizada com sucesso!');
            },
            error: function(xhr) {
                alert('Erro ao atualizar prescrição: ' + (xhr.responseJSON?.erro || 'Erro desconhecido'));
            }
        });
    } else {
        // Nova prescrição
        dados.atendimentos_clinica_id = parseInt(internacaoId);
        dados.funcionario_id = parseInt(funcionarioId);
        
        $.ajax({
            url: '/api/enfermagem/prescricao',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function() {
                $('#modalPrescricaoEnfermagem').modal('hide');
                $('#formPrescricaoEnfermagem')[0].reset();
                carregarPrescricoesEnfermagem();
                alert('Prescrição registrada com sucesso!');
            },
            error: function(xhr) {
                alert('Erro ao registrar prescrição: ' + (xhr.responseJSON?.erro || 'Erro desconhecido'));
            }
        });
    }
}

// ========== FUNÇÕES AUXILIARES ==========

function filtrarEvolucoesPorData(data) {
    // Implementar filtro por data se necessário
    console.log('Filtrar evoluções por data:', data);
    // Por enquanto, apenas recarrega
    carregarEvolucoesEnfermagem();
}

// Exportar funções globalmente se necessário
window.carregarEvolucoesEnfermagem = carregarEvolucoesEnfermagem;
window.carregarSAE = carregarSAE;
window.carregarPrescricoesEnfermagem = carregarPrescricoesEnfermagem; 