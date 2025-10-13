// Arquivo: prescricoes_enfermagem.js
// Responsável pelas funcionalidades relacionadas a prescrições de enfermagem

// Variáveis globais
let prescricoesEnfermagem = [];

// Função para carregar prescrições de enfermagem
function carregarPrescricoesEnfermagem() {
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ao carregar prescrições de enfermagem:', window.internacaoId);
        $('#listaPrescricoesEnfermagem').html('<tr><td colspan="4" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    // Mostrar indicador de carregamento
    $('#listaPrescricoesEnfermagem').html('<tr><td colspan="4" class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando prescrições...</td></tr>');
    
    $.ajax({
        url: `/api/enfermagem/prescricao/${window.internacaoId}`,
        method: 'GET',
        success: function(response) {
            const tabela = $('#listaPrescricoesEnfermagem');
            tabela.empty();

            // Suportar respostas nos formatos {success, prescricoes} ou lista direta
            let lista = [];
            if (Array.isArray(response)) {
                lista = response;
            } else if (response && response.success && Array.isArray(response.prescricoes)) {
                lista = response.prescricoes;
            }

            // Modo simples (3 colunas: Data/Hora, Enfermeiro, Prescrição)
            if ($('#listaPrescricoesEnfermagem').length > 0) {
                if (lista.length === 0) {
                    tabela.html('<tr><td colspan="3" class="text-center">Nenhuma prescrição de enfermagem registrada.</td></tr>');
                    return;
                }

                // Ordenar do mais recente para o mais antigo
                lista.sort((a, b) => new Date((b.data_prescricao || b.data_hora)) - new Date((a.data_prescricao || a.data_hora)));

                let html = '';
                lista.forEach(pe => {
                    const dataObj = new Date(pe.data_prescricao || pe.data_hora);
                    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const enfermeiro = pe.enfermeiro_nome || pe.enfermeiro || 'Não informado';
                    const texto = pe.texto || pe.prescricao || '---';

                    html += `
                        <tr>
                            <td>${dataFormatada} ${horaFormatada}</td>
                            <td>${enfermeiro}</td>
                            <td><div class="texto-evolucao">${texto}</div></td>
                        </tr>`;
                });

                tabela.html(html);
                return;
            }

            // Modo completo (com cuidados) - fallback quando usado em telas mais ricas
            if (lista.length > 0) {
                prescricoesEnfermagem = lista;

                prescricoesEnfermagem.sort((a, b) => new Date((b.data_hora || b.data_prescricao)) - new Date((a.data_hora || a.data_prescricao)));

                prescricoesEnfermagem.forEach(pe => {
                    const dataObj = new Date(pe.data_hora || pe.data_prescricao);
                    const dataFormatada = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    let statusClass = 'bg-primary';
                    if (pe.status && pe.status.toLowerCase() === 'concluída') {
                        statusClass = 'bg-success';
                    } else if (pe.status && pe.status.toLowerCase() === 'cancelada') {
                        statusClass = 'bg-danger';
                    }

                    tabela.append(`
                        <tr>
                            <td>${dataFormatada} ${horaFormatada}</td>
                            <td>${pe.enfermeiro || pe.enfermeiro_nome || 'Não informado'}</td>
                            <td>
                                <span class="badge ${statusClass}">${pe.status || 'Ativa'}</span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary toggle-cuidados" data-prescricao-id="${pe.id}">
                                    <i class="fas fa-chevron-down"></i> Ver cuidados
                                </button>
                                ${pe.status !== 'Concluída' && pe.status !== 'Cancelada' && window.session?.cargo === 'Enfermeiro' ? 
                                    `<button class="btn btn-sm btn-outline-success ms-1" onclick="concluirPrescricaoEnfermagem(${pe.id})">
                                        <i class="fas fa-check"></i> Concluir
                                    </button>` : ''}
                            </td>
                        </tr>
                        <tr class="cuidados-container" id="cuidados-${pe.id}" style="display: none;">
                            <td colspan="4">
                                <div class="p-3">
                                    <h6 class="mb-3">Cuidados de Enfermagem</h6>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Descrição</th>
                                                    <th>Frequência</th>
                                                    <th>Status</th>
                                                    ${pe.status !== 'Concluída' && pe.status !== 'Cancelada' && window.session?.cargo === 'Enfermeiro' ? '<th>Ações</th>' : ''}
                                                </tr>
                                            </thead>
                                            <tbody id="lista-cuidados-${pe.id}">
                                                ${renderizarCuidadosEnfermagem(pe.cuidados, pe.id, pe.status)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `);
                });

                $('.toggle-cuidados').on('click', function() {
                    const prescricaoId = $(this).data('prescricao-id');
                    const row = $(`#cuidados-${prescricaoId}`);
                    const icon = $(this).find('i');

                    if (row.is(':visible')) {
                        row.hide();
                        icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
                        $(this).html('<i class="fas fa-chevron-down"></i> Ver cuidados');
                    } else {
                        $('.cuidados-container').hide();
                        $('.toggle-cuidados i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                        $('.toggle-cuidados').html(function() { return '<i class="fas fa-chevron-down"></i> Ver cuidados'; });
                        row.show();
                        icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
                        $(this).html('<i class="fas fa-chevron-up"></i> Esconder cuidados');
                    }
                });
            } else {
                tabela.html('<tr><td colspan="4" class="text-center">Nenhuma prescrição de enfermagem registrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar prescrições de enfermagem:', xhr.responseText);
            $('#listaPrescricoesEnfermagem').html('<tr><td colspan="4" class="text-center text-danger">Erro ao carregar prescrições de enfermagem.</td></tr>');
        }
    });
}

// Função para renderizar lista de cuidados de enfermagem
function renderizarCuidadosEnfermagem(cuidados, prescricaoId, statusPrescricao) {
    if (!cuidados || cuidados.length === 0) {
        return '<tr><td colspan="4" class="text-center">Nenhum cuidado registrado nesta prescrição.</td></tr>';
    }
    
    let html = '';
    
    cuidados.forEach((cuidado, index) => {
        // Status visual do cuidado
        let statusClass = 'bg-primary';
        if (cuidado.status && cuidado.status.toLowerCase() === 'realizado') {
            statusClass = 'bg-success';
        } else if (cuidado.status && cuidado.status.toLowerCase() === 'cancelado') {
            statusClass = 'bg-danger';
        } else if (cuidado.status && cuidado.status.toLowerCase() === 'pendente') {
            statusClass = 'bg-warning text-dark';
        }
        
        html += `
            <tr>
                <td>${cuidado.descricao || 'Não informado'}</td>
                <td>${cuidado.frequencia || 'Não informada'}</td>
                <td>
                    <span class="badge ${statusClass}">${cuidado.status || 'Pendente'}</span>
                </td>`;
        
        // Adicionar coluna de ações se a prescrição não estiver concluída ou cancelada
        if (statusPrescricao !== 'Concluída' && statusPrescricao !== 'Cancelada' && window.session?.cargo === 'Enfermeiro') {
            html += `
                <td>
                    <button class="btn btn-sm btn-success" onclick="atualizarStatusCuidado(${prescricaoId}, ${index}, 'Realizado')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger ms-1" onclick="atualizarStatusCuidado(${prescricaoId}, ${index}, 'Cancelado')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>`;
        }
        
        html += '</tr>';
    });
    
    return html;
}

// Função para atualizar o status de um cuidado de enfermagem
function atualizarStatusCuidado(prescricaoId, cuidadoIndex, novoStatus) {
    if (!window.session || window.session.cargo !== 'Enfermeiro') {
        alert('Apenas enfermeiros podem atualizar o status dos cuidados.');
        return;
    }
    
    // Confirmar a ação
    if (!confirm(`Confirma a atualização do status do cuidado para "${novoStatus}"?`)) {
        return;
    }
    
    $.ajax({
        url: '/api/enfermagem/cuidados/status',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            prescricao_id: prescricaoId,
            cuidado_index: cuidadoIndex,
            novo_status: novoStatus,
            enfermeiro_id: parseInt(window.session.user_id),
            data_hora: new Date().toISOString()
        }),
        success: function(response) {
            if (response.success) {
                // Recarregar prescrições de enfermagem
                carregarPrescricoesEnfermagem();
                
                // Mostrar mensagem de sucesso
                alert('Status do cuidado atualizado com sucesso!');
            } else {
                alert('Erro ao atualizar status do cuidado: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao atualizar status do cuidado:', xhr.responseText);
            alert('Erro de comunicação ao tentar atualizar status do cuidado');
        }
    });
}

// Função para concluir uma prescrição de enfermagem
function concluirPrescricaoEnfermagem(prescricaoId) {
    if (!window.session || window.session.cargo !== 'Enfermeiro') {
        alert('Apenas enfermeiros podem concluir prescrições de enfermagem.');
        return;
    }
    
    // Confirmar a ação
    if (!confirm('Confirma a conclusão de todos os cuidados desta prescrição?')) {
        return;
    }
    
    $.ajax({
        url: '/api/enfermagem/prescricoes/concluir',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            prescricao_id: prescricaoId,
            enfermeiro_id: parseInt(window.session.user_id),
            data_hora: new Date().toISOString()
        }),
        success: function(response) {
            if (response.success) {
                // Recarregar prescrições de enfermagem
                carregarPrescricoesEnfermagem();
                
                // Mostrar mensagem de sucesso
                alert('Prescrição de enfermagem concluída com sucesso!');
            } else {
                alert('Erro ao concluir prescrição de enfermagem: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao concluir prescrição de enfermagem:', xhr.responseText);
            alert('Erro de comunicação ao tentar concluir prescrição de enfermagem');
        }
    });
}

// Função para enviar uma nova prescrição de enfermagem
function enviarPrescricaoEnfermagem(dados) {
    // Mostrar carregamento
    const btnSubmit = $('#formPrescricaoEnfermagem').find('button[type="submit"]');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Enviando...');
    btnSubmit.prop('disabled', true);
    
    // Enviar os dados para o servidor
    $.ajax({
        url: '/api/enfermagem/prescricoes/registrar',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            if (response.success) {
                // Fechar modal e limpar campos
                $('#modalPrescricaoEnfermagem').modal('hide');
                $('#formPrescricaoEnfermagem')[0].reset();
                
                // Limpar a lista de cuidados adicionados
                $('#listaCuidadosAdicionados').empty();
                window.cuidadosTemporarios = [];
                
                // Recarregar lista de prescrições
                carregarPrescricoesEnfermagem();
                
                // Mostrar mensagem de sucesso
                alert('Prescrição de enfermagem registrada com sucesso!');
            } else {
                alert('Erro ao registrar prescrição de enfermagem: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.error('Erro ao registrar prescrição de enfermagem:', xhr.responseText);
            alert('Erro de comunicação ao tentar registrar prescrição de enfermagem');
        }
    });
}

// Inicializar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Variável para armazenar os cuidados temporários
    window.cuidadosTemporarios = [];
    
    // Carregar prescrições de enfermagem quando a página carregar
    if ($('#listaPrescricoesEnfermagem').length > 0) {
        carregarPrescricoesEnfermagem();
    }
    
    // Configurar eventos do formulário de adição de cuidados
    $('#btn-adicionar-cuidado').on('click', function() {
        const descricao = $('#cuidado_descricao').val().trim();
        const frequencia = $('#cuidado_frequencia').val().trim();
        
        if (!descricao) {
            alert('Por favor, preencha a descrição do cuidado.');
            return;
        }
        
        // Adicionar cuidado à lista temporária
        window.cuidadosTemporarios.push({
            descricao: descricao,
            frequencia: frequencia || 'Conforme necessário',
            status: 'Pendente'
        });
        
        // Atualizar a lista de cuidados adicionados
        atualizarListaCuidadosAdicionados();
        
        // Limpar campos de entrada
        $('#cuidado_descricao').val('');
        $('#cuidado_frequencia').val('');
        
        // Focar no campo de descrição para adicionar outro cuidado
        $('#cuidado_descricao').focus();
    });
    
    // Configurar submissão do formulário de prescrição de enfermagem
    $('#formPrescricaoEnfermagem').on('submit', function(e) {
        e.preventDefault();
        
        if (window.cuidadosTemporarios.length === 0) {
            alert('Por favor, adicione pelo menos um cuidado de enfermagem antes de enviar.');
            return;
        }
        
        // Verificar se o usuário tem permissão para registro de prescrições de enfermagem
        if (!window.session || window.session.cargo !== 'Enfermeiro') {
            alert('Apenas enfermeiros podem registrar prescrições de enfermagem.');
            return;
        }
        
        // Preparar dados para envio
        const dados = {
            internacao_id: window.internacaoId,
            enfermeiro_id: parseInt(window.session.user_id),
            cuidados: window.cuidadosTemporarios
        };
        
        // Enviar prescrição de enfermagem
        enviarPrescricaoEnfermagem(dados);
    });
    
    // Configurar botão para adicionar modelos predefinidos
    $('.btn-modelo-cuidado').on('click', function() {
        const modeloId = $(this).data('modelo');
        
        // Modelos predefinidos de cuidados
        const modelos = {
            sinais_vitais: {
                descricao: 'Verificar sinais vitais (PA, FC, FR, Tax, Sat)',
                frequencia: '6/6h ou conforme necessidade'
            },
            glicemia: {
                descricao: 'Verificar glicemia capilar',
                frequencia: 'Antes das refeições e se sinais de hipo/hiperglicemia'
            },
            medicacao: {
                descricao: 'Administrar medicações conforme prescrição médica',
                frequencia: 'Conforme aprazamento'
            },
            banho: {
                descricao: 'Realizar banho no leito ou auxiliar no banho de aspersão',
                frequencia: '1x ao dia pela manhã'
            },
            higiene_oral: {
                descricao: 'Realizar ou auxiliar na higiene oral',
                frequencia: '3x ao dia'
            },
            mudanca_decubito: {
                descricao: 'Realizar mudança de decúbito',
                frequencia: '2/2h'
            },
            curativo: {
                descricao: 'Realizar curativo conforme protocolo institucional',
                frequencia: '1x ao dia ou conforme necessidade'
            },
            diurese: {
                descricao: 'Monitorar e anotar características e volume de diurese',
                frequencia: '6/6h'
            },
            evacuacao: {
                descricao: 'Monitorar e anotar características e frequência das evacuações',
                frequencia: 'A cada evacuação'
            },
            balanco_hidrico: {
                descricao: 'Realizar balanço hídrico',
                frequencia: '6/6h ou 24/24h'
            }
        };
        
        // Aplicar modelo selecionado aos campos
        if (modelos[modeloId]) {
            $('#cuidado_descricao').val(modelos[modeloId].descricao);
            $('#cuidado_frequencia').val(modelos[modeloId].frequencia);
        }
    });
});

// Função para atualizar a lista de cuidados adicionados
function atualizarListaCuidadosAdicionados() {
    const lista = $('#listaCuidadosAdicionados');
    lista.empty();
    
    if (window.cuidadosTemporarios.length === 0) {
        lista.html('<p class="text-muted">Nenhum cuidado adicionado.</p>');
        return;
    }
    
    window.cuidadosTemporarios.forEach((cuidado, index) => {
        lista.append(`
            <div class="card mb-2">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-0">${cuidado.descricao}</h6>
                            <small class="text-muted">Frequência: ${cuidado.frequencia}</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger btn-remover-cuidado" 
                            data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `);
    });
    
    // Configurar eventos de remoção
    $('.btn-remover-cuidado').on('click', function() {
        const index = $(this).data('index');
        
        // Remover o cuidado da lista temporária
        window.cuidadosTemporarios.splice(index, 1);
        
        // Atualizar a lista de cuidados adicionados
        atualizarListaCuidadosAdicionados();
    });
} 