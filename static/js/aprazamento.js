// Arquivo: aprazamento.js
// Responsável pelas funcionalidades relacionadas ao aprazamento de medicamentos

// Função para abrir o modal de aprazamento
function abrirModalAprazamento(prescricaoId, medicamentoIndex, medicamentoNome) {
    // Limpar formulário
    $('#formAprazamento')[0].reset();
    $('#horarios_multiplos_dias').empty();
    
    // Configurar dados do formulário
    $('#formAprazamento').data('enfermeiro-id', window.session.user_id);
    $('#aprazamento_prescricao_id').val(prescricaoId);
    $('#aprazamento_medicamento_index').val(medicamentoIndex);
    $('#aprazamento_medicamento_nome').text(medicamentoNome);
    
    // Configurar datas padrão
    const hoje = new Date();
    const amanha = new Date();
    amanha.setDate(hoje.getDate() + 1);
    
    $('#aprazamento_data_inicio').val(hoje.toISOString().split('T')[0]);
    $('#aprazamento_data_fim').val(amanha.toISOString().split('T')[0]);
    
    // Carregar aprazamentos existentes
    carregarAprazamentosExistentes(prescricaoId, medicamentoNome);
    
    // Configurar o handler do formulário
    configurarFormularioAprazamento();
    
    // Exibir modal
    $('#modalAprazamento').modal('show');
}

// Função para carregar aprazamentos existentes de um medicamento
function carregarAprazamentosExistentes(prescricaoId, medicamentoNome) {
    $.ajax({
        url: `/api/aprazamentos/${prescricaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.aprazamentos) {
                // Filtrar aprazamentos do medicamento específico
                const aprazamentosMedicamento = response.aprazamentos.filter(a => 
                    a.nome_medicamento === medicamentoNome
                );
                
                if (aprazamentosMedicamento.length > 0) {
                    let html = '<div class="mb-3"><h6 class="text-primary">Aprazamentos Existentes:</h6>';
                    html += '<div class="table-responsive"><table class="table table-sm">';
                    html += '<thead><tr><th>Data</th><th>Hora</th><th>Status</th></tr></thead><tbody>';
                    
                    aprazamentosMedicamento.forEach(apz => {
                        const [data, hora] = apz.data_hora_aprazamento.split(' ');
                        const status = apz.realizado ? 
                            '<span class="badge bg-success">Realizado</span>' : 
                            '<span class="badge bg-warning">Pendente</span>';
                        
                        html += `<tr>
                            <td>${data}</td>
                            <td>${hora}</td>
                            <td>${status}</td>
                        </tr>`;
                    });
                    
                    html += '</tbody></table></div></div>';
                    $('#aprazamentos_existentes').html(html);
                } else {
                    $('#aprazamentos_existentes').html('<p class="text-muted">Nenhum aprazamento registrado para este medicamento.</p>');
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar aprazamentos:', error);
            $('#aprazamentos_existentes').html('<p class="text-danger">Erro ao carregar aprazamentos existentes.</p>');
        }
    });
}

// Função para carregar e exibir os aprazamentos do modelo Aprazamento
function carregarAprazamentosNovos(prescricaoId, elementoDestino, medicamento = null) {
    if (!prescricaoId) {
        console.error('ID da prescrição não fornecido');
        return;
    }
    
    // Mostrar indicador de carregamento
    $(elementoDestino).html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando aprazamentos...</div>');
    
    $.ajax({
        url: `/api/aprazamentos/${prescricaoId}`,
        method: 'GET',
        success: function(response) {
            if (!response.success || !response.aprazamentos || response.aprazamentos.length === 0) {
                $(elementoDestino).html('<div class="text-center text-muted">Nenhum aprazamento encontrado</div>');
                return;
            }
            
            let html = '';
            
            // Filtrar aprazamentos para o medicamento específico, se fornecido
            let aprazamentosFiltrados = response.aprazamentos;
            if (medicamento) {
                aprazamentosFiltrados = response.aprazamentos.filter(a => 
                    a.nome_medicamento.toLowerCase() === medicamento.toLowerCase()
                );
                
                if (aprazamentosFiltrados.length === 0) {
                    $(elementoDestino).html('<div class="text-center text-muted">Nenhum aprazamento encontrado para este medicamento</div>');
                    return;
                }
            }
            
            // Agrupar aprazamentos por data
            const aprazamentosPorData = {};
            aprazamentosFiltrados.forEach(apz => {
                const dataHora = apz.data_hora_aprazamento.split(' ');
                const data = dataHora[0];
                const hora = dataHora[1];
                
                if (!aprazamentosPorData[data]) {
                    aprazamentosPorData[data] = [];
                }
                
                aprazamentosPorData[data].push({
                    id: apz.id,
                    hora: hora,
                    realizado: apz.realizado,
                    enfermeiro: apz.enfermeiro_responsavel,
                    data_realizacao: apz.data_realizacao
                });
            });
            
            // Gerar HTML para cada data
            Object.keys(aprazamentosPorData).sort().forEach(data => {
                html += `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="mb-0 fw-bold">${data}</h6>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light">
                                    <tr>
                                        <th>Horário</th>
                                        <th>Status</th>
                                        <th>Responsável</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                // Ordenar horários
                aprazamentosPorData[data].sort((a, b) => {
                    return a.hora.localeCompare(b.hora);
                }).forEach(apz => {
                    const status = apz.realizado 
                        ? `<span class="badge bg-success">Realizado</span>` 
                        : `<span class="badge bg-warning">Pendente</span>`;
                    
                    const enfermeiro = apz.realizado && apz.enfermeiro 
                        ? apz.enfermeiro 
                        : '-';
                    
                    const botoes = apz.realizado
                        ? `<span class="text-muted">Concluído em ${apz.data_realizacao || '-'}</span>`
                        : `<button class="btn btn-sm btn-success btn-realizar-aprazamento" data-id="${apz.id}">
                              <i class="fas fa-check"></i> Realizar
                           </button>
                           <button class="btn btn-sm btn-danger btn-excluir-aprazamento" data-id="${apz.id}">
                              <i class="fas fa-times"></i>
                           </button>`;
                    
                    html += `
                        <tr>
                            <td>${apz.hora}</td>
                            <td>${status}</td>
                            <td>${enfermeiro}</td>
                            <td>${botoes}</td>
                        </tr>
                    `;
                });
                
                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            
            $(elementoDestino).html(html);
            
            // Adicionar event listeners para os botões
            $('.btn-realizar-aprazamento').click(function() {
                const aprazamentoId = $(this).data('id');
                realizarAprazamento(aprazamentoId, function() {
                    carregarAprazamentosNovos(prescricaoId, elementoDestino, medicamento);
                });
            });
            
            $('.btn-excluir-aprazamento').click(function() {
                const aprazamentoId = $(this).data('id');
                excluirAprazamento(aprazamentoId, function() {
                    carregarAprazamentosNovos(prescricaoId, elementoDestino, medicamento);
                });
            });
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar aprazamentos:', error);
            $(elementoDestino).html('<div class="text-center text-danger">Erro ao carregar aprazamentos</div>');
        }
    });
}

// Função para marcar um aprazamento como realizado
function realizarAprazamento(aprazamentoId, callback) {
    if (!aprazamentoId) {
        console.error('ID do aprazamento não fornecido');
        return;
    }
    
    $.ajax({
        url: `/api/aprazamentos/${aprazamentoId}/realizar`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({
            realizado: true
        }),
        success: function(response) {
            if (response.success) {
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                alert(`Erro ao realizar aprazamento: ${response.message || 'Erro desconhecido'}`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao realizar aprazamento:', error);
            alert(`Erro ao realizar aprazamento: ${xhr.responseJSON?.message || error}`);
        }
    });
}

// Função para excluir um aprazamento
function excluirAprazamento(aprazamentoId, callback) {
    if (!aprazamentoId) {
        console.error('ID do aprazamento não fornecido');
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir este aprazamento?')) {
        return;
    }
    
    $.ajax({
        url: `/api/aprazamentos/${aprazamentoId}`,
        method: 'DELETE',
        success: function(response) {
            if (response.success) {
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                alert(`Erro ao excluir aprazamento: ${response.message || 'Erro desconhecido'}`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao excluir aprazamento:', error);
            alert(`Erro ao excluir aprazamento: ${xhr.responseJSON?.message || error}`);
        }
    });
}

// Processar horários selecionados para formar o texto de aprazamento
function processarHorariosSelecionados() {
    console.log('Iniciando processamento de horários selecionados');
    
    // Obter todos os horários marcados
    const horariosSelecionados = [];
    
    $('#horarios_multiplos_dias .horario-check:checked').each(function() {
        const data = $(this).data('date');  // Formato: DD/MM/YYYY
        const hora = $(this).val();         // Formato: HH:MM
        
        console.log('Processando horário:', { data, hora });
        
        if (data && hora) {
            horariosSelecionados.push({
                data_hora_aprazamento: `${data} ${hora}`
            });
        }
    });
    
    console.log('Horários processados:', horariosSelecionados);
    
    if (horariosSelecionados.length === 0) {
        console.log('Nenhum horário selecionado');
        return null;
    }
    
    return horariosSelecionados;
}

// Calcular horários para múltiplos dias com intervalo fixo
function calcularHorariosIntervaloFixo(dataInicio, dataFim, intervaloHoras, horaInicial) {
    // Converter strings para objetos Date
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    // Verificar se as datas são válidas
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        console.error('Datas inválidas');
        return {};
    }
    
    // Se a data fim for anterior à data início, retornar objeto vazio
    if (fim < inicio) {
        console.error('Data fim é anterior à data início');
        return {};
    }
    
    // Obter hora inicial
    let [hora, minuto] = [0, 0];
    if (horaInicial) {
        [hora, minuto] = horaInicial.split(':').map(Number);
    } else {
        // Se não houver hora inicial, usar a hora atual
        const agora = new Date();
        hora = agora.getHours();
        minuto = agora.getMinutes();
    }
    
    // Converter intervalo para milissegundos
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;
    
    // Inicializar o resultado: um objeto onde as chaves são as datas formatadas (DD/MM/YYYY)
    // e os valores são arrays de horários (HH:MM)
    const horariosPorDia = {};
    
    // Inicializar o timestamp inicial (início do dia + hora inicial)
    let dataAtual = new Date(inicio);
    dataAtual.setHours(hora, minuto, 0, 0);
    
    // Inicializar o timestamp final (final do dia)
    const timestampFim = new Date(fim);
    timestampFim.setHours(23, 59, 59, 999);
    
    // Calcular horários até o fim do período
    while (dataAtual <= timestampFim) {
        // Formatar a data (DD/MM/YYYY)
        const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Formatar o horário (HH:MM)
        const horarioFormatado = dataAtual.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        // Verificar os dias selecionados
        const diaSemana = dataAtual.getDay(); // 0=dom, 1=seg, ... 6=sáb
        const diaCheckboxes = {
            0: $('#dia_dom').is(':checked'),
            1: $('#dia_seg').is(':checked'),
            2: $('#dia_ter').is(':checked'),
            3: $('#dia_qua').is(':checked'),
            4: $('#dia_qui').is(':checked'),
            5: $('#dia_sex').is(':checked'),
            6: $('#dia_sab').is(':checked')
        };
        
        // Só adicionar o horário se o dia da semana estiver selecionado
        if (diaCheckboxes[diaSemana]) {
            // Inicializar o array de horários para esta data se ainda não existir
            if (!horariosPorDia[dataFormatada]) {
                horariosPorDia[dataFormatada] = [];
            }
            
            // Adicionar o horário ao array
            horariosPorDia[dataFormatada].push(horarioFormatado);
        }
        
        // Avançar para o próximo intervalo
        dataAtual = new Date(dataAtual.getTime() + intervaloMs);
    }
    
    return horariosPorDia;
}

// Gerar HTML para exibir os horários calculados por dia
function gerarHTMLHorariosPorDia(horariosPorDia) {
    let html = '';
    
    if (Object.keys(horariosPorDia).length === 0) {
        html = '<p class="text-muted small text-center mb-0">Nenhum horário calculado para o período especificado</p>';
        return html;
    }
    
    // Para cada data
    Object.keys(horariosPorDia).sort().forEach(data => {
        // Garantir que a data está no formato DD/MM/YYYY
        const dataFormatada = data.includes('-') ? 
            data.split('-').reverse().join('/') : 
            data;
            
        html += `
            <div class="mb-2">
                <div class="fw-bold mb-1 small">${dataFormatada}</div>
                <div class="row g-1">
        `;
        
        // Para cada horário na data
        horariosPorDia[data].sort().forEach((horario, index) => {
            html += `
                <div class="col-auto">
                    <div class="form-check">
                        <input class="form-check-input horario-check" type="checkbox" value="${horario}" 
                            id="horario_${dataFormatada.replace(/[^0-9]/g, '')}_${index}" 
                            data-date="${dataFormatada}" checked>
                        <label class="form-check-label small" for="horario_${dataFormatada.replace(/[^0-9]/g, '')}_${index}">
                            ${horario}
                        </label>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    return html;
}

// Função para formatar aprazamento de forma legível 
function formatarAprazamentoLegivel(texto) {
    if (!texto) return "Não aprazado";
    
    // Dividir por datas
    const secoes = texto.split(';');
    const datasDias = [];
    
    secoes.forEach(secao => {
        secao = secao.trim();
        if (!secao) return;
        
        const [data, horariosTexto] = secao.split(':');
        if (!data || !horariosTexto) return;
        
        const dataTrimmed = data.trim();
        const horarios = horariosTexto.split(',').map(h => h.trim()).join(', ');
        
        datasDias.push(`${dataTrimmed}: ${horarios}`);
    });
    
    return datasDias.join(" | ");
}

// Função para configurar o handler do formulário de aprazamento
function configurarFormularioAprazamento() {
    console.log('Configurando handler do formulário de aprazamento');
    
    // Remover handlers anteriores e adicionar o novo
    $('#formAprazamento').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        console.log('Iniciando submissão do formulário de aprazamento:', new Date().toISOString());
        
        const prescricaoId = $('#aprazamento_prescricao_id').val();
        const medicamentoIndex = parseInt($('#aprazamento_medicamento_index').val(), 10);
        const medicamentoNome = $('#aprazamento_medicamento_nome').text().trim();
        
        console.log('Dados do formulário:', { prescricaoId, medicamentoIndex, medicamentoNome });
        
        if (!prescricaoId || isNaN(medicamentoIndex)) {
            alert('Erro na identificação da prescrição ou medicamento');
            return;
        }
        
        // Mostrar indicador de carregamento
        const btnSubmit = $(this).find('button[type="submit"]');
        const textoOriginal = btnSubmit.html();
        btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Processando...');
        btnSubmit.prop('disabled', true);
        
        // Verificar se existem horários para o aprazamento
        if ($('#horarios_multiplos_dias .horario-check').length === 0) {
            alert('Por favor, calcule os horários primeiro clicando no botão "Calcular Horários".');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            return;
        }
        
        // Processar os horários selecionados
        const horariosSelecionados = processarHorariosSelecionados();
        
        if (!horariosSelecionados) {
            alert('Selecione pelo menos um horário de administração.');
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            return;
        }
        
        // Extrair a descrição de uso se disponível
        let descricaoUso = '';
        try {
            if (window.medicamentosUltimaPrescricao && 
                window.medicamentosUltimaPrescricao[medicamentoIndex]) {
                descricaoUso = window.medicamentosUltimaPrescricao[medicamentoIndex].descricao_uso || '';
            }
        } catch (e) {
            console.warn('Não foi possível obter a descrição de uso do medicamento:', e);
        }
        
        // Adicionar nome do medicamento e descrição de uso a cada aprazamento
        horariosSelecionados.forEach(aprazamento => {
            aprazamento.nome_medicamento = medicamentoNome;
            aprazamento.descricao_uso = descricaoUso;
        });
        
        const dados = {
            prescricao_id: prescricaoId,
            enfermeiro_id: $(this).data('enfermeiro-id') || window.session.user_id,
            aprazamentos: horariosSelecionados
        };
        
        console.log('Dados do aprazamento a serem enviados:', dados);
        
        // Enviar requisição para registrar os aprazamentos
        $.ajax({
            url: '/api/prescricoes/aprazamento',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(dados),
            success: function(response) {
                console.log('Resposta do servidor:', response);
                
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                if (response.success) {
                    // Fechar modal
                    $('#modalAprazamento').modal('hide');
                    
                    // Recarregar lista de prescrições
                    if (typeof carregarPrescricoes === 'function') {
                        carregarPrescricoes();
                    } else {
                        // Alternativamente, recarregar os aprazamentos na seção atual
                        const containerAprazamentos = $('.container-aprazamentos[data-prescricao-id="' + prescricaoId + '"]');
                        if (containerAprazamentos.length) {
                            carregarAprazamentosNovos(prescricaoId, containerAprazamentos);
                        }
                    }
                    
                    // Mostrar mensagem de sucesso
                    alert('Aprazamento registrado com sucesso!');
                } else {
                    alert('Erro ao registrar aprazamento: ' + (response.message || 'Erro desconhecido'));
                }
            },
            error: function(xhr, status, error) {
                console.error('Erro na requisição:', { xhr, status, error });
                console.error('Resposta do servidor:', xhr.responseText);
                
                // Restaurar botão
                btnSubmit.html(textoOriginal);
                btnSubmit.prop('disabled', false);
                
                alert('Erro de comunicação ao tentar registrar aprazamento: ' + (xhr.responseJSON?.error || error));
            }
        });
    });
}

// Inicialização e configuração dos eventos
$(document).ready(function() {
    // Configurar evento para limpar handlers quando o modal for fechado
    $('#modalAprazamento').on('hidden.bs.modal', function() {
        $('#formAprazamento').off('submit');
        $('#horarios_multiplos_dias').empty();
    });

    // Mostrar campo de intervalo personalizado para múltiplos dias
    $('#aprazamento_multiplos_intervalo').change(function() {
        if ($(this).val() === 'custom') {
            $('#multiplos_intervalo_custom').show();
        } else {
            $('#multiplos_intervalo_custom').hide();
        }
    });
    
    // Calcular horários para múltiplos dias
    $('#btn_calcular_multiplos_dias').click(function() {
        const dataInicio = $('#aprazamento_data_inicio').val();
        const dataFim = $('#aprazamento_data_fim').val();
        const horaInicial = $('#aprazamento_hora_inicial_multiplos').val();
        
        if (!dataInicio || !dataFim) {
            alert('Por favor, defina as datas de início e fim.');
            return;
        }
        
        // Verificar se data de início é menor que data de fim
        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        
        if (inicio > fim) {
            alert('A data de início deve ser menor ou igual à data de fim.');
            return;
        }
        
        // Obter o intervalo
        let intervaloHoras;
        if ($('#aprazamento_multiplos_intervalo').val() === 'custom') {
            intervaloHoras = parseFloat($('#aprazamento_multiplos_intervalo_custom').val());
            if (!intervaloHoras || intervaloHoras <= 0 || intervaloHoras > 24) {
                alert('Por favor, defina um intervalo válido entre 0.5 e 24 horas.');
                return;
            }
        } else {
            intervaloHoras = parseFloat($('#aprazamento_multiplos_intervalo').val());
        }
        
        try {
            // Calcular os horários
            const horariosPorDia = calcularHorariosIntervaloFixo(dataInicio, dataFim, intervaloHoras, horaInicial);
            
            if (Object.keys(horariosPorDia).length === 0) {
                $('#horarios_multiplos_dias').html('<p class="text-danger">Não foi possível calcular horários com os parâmetros informados. Verifique se o intervalo não é muito grande para o período definido.</p>');
                return;
            }
            
            // Formatar HTML com dias e horários
            const html = gerarHTMLHorariosPorDia(horariosPorDia);
            $('#horarios_multiplos_dias').html(html);
        } catch (error) {
            console.error('Erro ao calcular horários:', error);
            $('#horarios_multiplos_dias').html(`<p class="text-danger">Erro ao calcular horários: ${error.message}</p>`);
        }
    });
    
    // Selecionar todos os horários
    $('#btn_selecionar_todos').click(function() {
        $('#horarios_multiplos_dias .horario-check').prop('checked', true);
    });
    
    // Desmarcar todos os horários
    $('#btn_desmarcar_todos').click(function() {
        $('#horarios_multiplos_dias .horario-check').prop('checked', false);
    });
}); 