// Arquivo: prescricoes.js
// Responsável pelas funcionalidades relacionadas a prescrições médicas

// Variáveis globais
let prescricoesAtivas = [];
let ultimaAtualizacao = null;

// Função para carregar prescrições
function carregarPrescricoes(internacaoId, apenasNovas = false) {
    console.log('Iniciando carregarPrescricoes com ID:', internacaoId, 'lastUpdate:', apenasNovas);
    
    if (!internacaoId) {
        internacaoId = window.internacaoId;
    }
    
    if (!internacaoId || isNaN(internacaoId)) {
        console.error('ID de internação inválido ao carregar prescrições:', internacaoId);
        $('#listaPrescricoes').html('<tr><td colspan="6" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    // Parâmetro para verificar apenas novas prescrições
    let url = `/api/prescricoes/${internacaoId}`;
    if (apenasNovas && ultimaAtualizacao) {
        url += `?after=${ultimaAtualizacao.toISOString()}`;
    }
    
    $.ajax({
        url: url,
        method: 'GET',
        success: function(response) {
            console.log('Resposta recebida:', response);
            
            if (apenasNovas && (!response.prescricoes || response.prescricoes.length === 0)) {
                // Nenhuma nova prescrição, não precisamos atualizar a interface
                return;
            }
            
            if (response.success && response.prescricoes) {
                ultimaAtualizacao = new Date();
                
                if (response.prescricoes.length > 0) {
                    prescricoesAtivas = response.prescricoes;
                    console.log(`${prescricoesAtivas.length} prescrições encontradas`);
                    
                    // Renderizar prescrições
                    renderizarPrescricoes(prescricoesAtivas);
                } else {
                    $('#listaPrescricoes').html('<tr><td colspan="6" class="text-center">Nenhuma prescrição registrada até o momento.</td></tr>');
                }
            } else {
                $('#listaPrescricoes').html('<tr><td colspan="6" class="text-center text-warning">Nenhuma prescrição encontrada.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar prescrições:', xhr.responseText);
            $('#listaPrescricoes').html('<tr><td colspan="6" class="text-center text-danger">Erro ao carregar prescrições.</td></tr>');
        }
    });
}

// Função para renderizar lista de prescrições
function renderizarPrescricoes(prescricoes) {
    const tabela = $('#listaPrescricoes');
    tabela.empty();
    
    if (!prescricoes || prescricoes.length === 0) {
        tabela.html('<tr><td colspan="6" class="text-center">Nenhuma prescrição registrada.</td></tr>');
        return;
    }
    
    // Ordenar prescrições por data, mais recente primeiro
    prescricoes.sort((a, b) => new Date(b.data_prescricao) - new Date(a.data_prescricao));
    
    prescricoes.forEach(prescricao => {
        // Formatar data
        const dataObj = new Date(prescricao.data_prescricao);
        const dataFormatada = dataObj.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        
        // Criar linha de cabeçalho da prescrição
        const row = $(`
            <tr class="prescricao-header" data-prescricao-id="${prescricao.id}">
                <td>${dataFormatada}</td>
                <td>${prescricao.nome_medico || 'Não informado'}</td>
                <td>${prescricao.status || 'Ativo'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary toggle-medicamentos" 
                        data-prescricao-id="${prescricao.id}">
                        <i class="fas fa-chevron-down"></i> Ver medicamentos
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="imprimirPrescricao(${prescricao.id})">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                </td>
            </tr>
        `);
        
        tabela.append(row);
        
        // Criar linha expandível para medicamentos
        const medicamentosRow = $(`
            <tr class="medicamentos-container" id="medicamentos-${prescricao.id}" style="display: none;">
                <td colspan="6">
                    <div class="p-3">
                        <h6 class="mb-3">Medicamentos</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>Medicamento</th>
                                        <th>Dosagem</th>
                                        <th>Via</th>
                                        <th>Frequência</th>
                                        <th>Aprazamento</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="lista-medicamentos-${prescricao.id}">
                                    <!-- Medicamentos serão adicionados aqui -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </td>
            </tr>
        `);
        
        tabela.append(medicamentosRow);
        
        // Adicionar medicamentos à tabela interna
        const medicamentosLista = $(`#lista-medicamentos-${prescricao.id}`);
        
        if (prescricao.medicamentos && prescricao.medicamentos.length > 0) {
            prescricao.medicamentos.forEach((med, index) => {
                const aprazamentoFormatado = formatarAprazamentoLegivel(med.aprazamento);
                
                medicamentosLista.append(`
                    <tr>
                        <td>${med.medicamento || 'Não informado'}</td>
                        <td>${med.dosagem || '-'}</td>
                        <td>${med.via || '-'}</td>
                        <td>${med.frequencia || '-'}</td>
                        <td class="aprazamento-cell">
                            ${aprazamentoFormatado}
                        </td>
                        <td>
                            ${window.session && window.session.cargo === 'Enfermeiro' ? 
                                `<button class="btn btn-sm btn-primary btn-aprazar" 
                                  onclick="abrirModalAprazamento(${prescricao.id}, ${index}, '${med.medicamento.replace(/'/g, "\\'")}')">
                                  <i class="fas fa-clock"></i> Aprazar
                                </button>` : 
                                '-'
                            }
                        </td>
                    </tr>
                `);
            });
        } else {
            medicamentosLista.append(`
                <tr>
                    <td colspan="6" class="text-center">Nenhum medicamento registrado nesta prescrição.</td>
                </tr>
            `);
        }
    });
    
    // Configurar evento para expandir/colapsar medicamentos
    $('.toggle-medicamentos').on('click', function() {
        const prescricaoId = $(this).data('prescricao-id');
        const row = $(`#medicamentos-${prescricaoId}`);
        const icon = $(this).find('i');
        
        if (row.is(':visible')) {
            row.hide();
            icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $(this).html('<i class="fas fa-chevron-down"></i> Ver medicamentos');
        } else {
            // Esconder todas as outras linhas de medicamentos
            $('.medicamentos-container').hide();
            $('.toggle-medicamentos i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $('.toggle-medicamentos').html(function() {
                return '<i class="fas fa-chevron-down"></i> Ver medicamentos';
            });
            
            // Mostrar apenas esta linha
            row.show();
            icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            $(this).html('<i class="fas fa-chevron-up"></i> Esconder medicamentos');
        }
    });
}

// Função para imprimir uma prescrição
function imprimirPrescricao(prescricaoId) {
    if (!prescricaoId) return;
    
    window.open(`/prescricao/imprimir/${prescricaoId}`, '_blank');
}

// Inicialização e configuração dos eventos
$(document).ready(function() {
    // Aplicar formatação de texto às células de aprazamento
    setInterval(() => {
        $('.aprazamento-cell').each(function() {
            const texto = $(this).text().trim();
            if (texto !== 'Não aprazado' && !$(this).hasClass('formatted')) {
                $(this).addClass('formatted');
                
                // Substituir | por quebras de linha para melhor visualização
                const formatado = texto.replace(/\s*\|\s*/g, '<br>');
                $(this).html(formatado);
            }
        });
    }, 1000);
    
    // Carregar prescrições iniciais
    carregarPrescricoes(window.internacaoId);
}); 