let listaMedicamentos = [];

// Atualiza a tabela de medicamentos no modal
function atualizarTabelaMedicamentos() {
    const tbody = $('#tabelaMedicamentosAdicionados tbody');
    tbody.empty();

    if (listaMedicamentos.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="4" class="text-center">Nenhum medicamento adicionado</td>
            </tr>
        `);
        return;
    }

    listaMedicamentos.forEach((medicamento, index) => {
        tbody.append(`
            <tr>
                <td>${medicamento.nome}</td>
                <td>${medicamento.descricao}</td>
                <td>
                    <button type="button" 
                        class="btn btn-outline-primary btn-sm btn-aprazamento"
                        data-prescricao-id="${$('#prescricao_id').val()}"
                        data-medicamento-index="${index}"
                        data-medicamento-nome="${medicamento.nome}">
                        <i class="fas fa-clock"></i> Aprazar
                    </button>
                </td>
                <td>
                    <button type="button" class="btn btn-danger btn-sm btn-remover-medicamento" data-index="${index}">
                        <i class="fas fa-trash-alt"></i> Remover
                    </button>
                </td>
            </tr>
        `);
    });
}

// Adiciona medicamento na lista
$('#btnAdicionarMedicamento').click(function () {
    const nome = $('#nome_medicamento').val().trim();
    const descricao = $('#descricao_uso').val().trim();

    if (!nome) {
        alert('Informe o nome do medicamento.');
        return;
    }

    listaMedicamentos.push({
        nome: nome,
        descricao: descricao
    });

    atualizarTabelaMedicamentos();

    // Limpa os campos
    $('#nome_medicamento').val('');
    $('#descricao_uso').val('');
});

// Remove medicamento da lista
$(document).on('click', '.btn-remover-medicamento', function () {
    const index = $(this).data('index');
    listaMedicamentos.splice(index, 1);
    atualizarTabelaMedicamentos();
});

// Salva a prescrição completa
$('#formPrescricao').submit(function (e) {
    e.preventDefault();

    const prescricaoId = $('#prescricao_id').val();
    const dieta = $('#texto_dieta').val().trim();
    const procedimentosMedico = $('#texto_procedimento_medico').val().trim();
    const procedimentosMulti = $('#texto_procedimento_multi').val().trim();

    if (!dieta && listaMedicamentos.length === 0 && !procedimentosMedico && !procedimentosMulti) {
        alert('A prescrição não pode estar vazia.');
        return;
    }

    // Preparar os medicamentos para o envio no formato esperado pela API
    const medicamentosFormatados = listaMedicamentos.map(med => {
        return {
            nome_medicamento: med.nome,
            descricao_uso: med.descricao,
            aprazamento: med.aprazamento || null
        };
    });

    const dados = {
        id: prescricaoId || null,
        atendimentos_clinica_id: parseInt($('#internacao_id').val()) || parseInt($('#atendimento_id').val()),
        medico_id: parseInt($('#medico_id').val()) || parseInt($('#usuario_id').val()),
        texto_dieta: dieta || null,
        medicamentos_json: medicamentosFormatados,
        texto_procedimento_medico: procedimentosMedico || null,
        texto_procedimento_multi: procedimentosMulti || null
    };

    // Determinar URL e método com base em se é edição ou criação
    const url = prescricaoId ? `/api/prescricoes/${prescricaoId}` : '/api/prescricoes';
    const method = prescricaoId ? 'PUT' : 'POST';

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function (response) {
            if (response.success) {
                alert('Prescrição salva com sucesso!');
                $('#modalPrescricao').modal('hide');
                listaMedicamentos = [];
                atualizarTabelaMedicamentos();

                // Atualizar a lista de prescrições
                if (typeof carregarPrescricoes === 'function') {
                    carregarPrescricoes();
                }
            } else {
                alert('Erro ao salvar prescrição: ' + (response.message || 'Erro desconhecido.'));
            }
        },
        error: function (xhr) {
            console.error('Erro ao salvar prescrição:', xhr.responseText);
            alert('Erro ao salvar a prescrição.');
        }
    });
});

// Ao clicar em "Aprazar"
$(document).on('click', '.btn-aprazamento', function () {
    const prescricaoId = $(this).data('prescricao-id');
    const medicamentoIndex = $(this).data('medicamento-index');
    const medicamentoNome = $(this).data('medicamento-nome');

    // Preencher os campos ocultos do modal
    $('#aprazamento_prescricao_id').val(prescricaoId);
    $('#aprazamento_medicamento_index').val(medicamentoIndex);
    $('#aprazamento_medicamento_nome').text(medicamentoNome);

    // Definir data atual para os campos de data
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    const diaAtual = String(hoje.getDate()).padStart(2, '0');
    
    // Data de fim padrão (7 dias após a data atual)
    const dataFim = new Date(hoje);
    dataFim.setDate(dataFim.getDate() + 6);
    const anoFim = dataFim.getFullYear();
    const mesFim = String(dataFim.getMonth() + 1).padStart(2, '0');
    const diaFim = String(dataFim.getDate()).padStart(2, '0');
    
    // Definir datas de início e fim para aprazamento
    $('#aprazamento_data_inicio').val(`${anoAtual}-${mesAtual}-${diaAtual}`);
    $('#aprazamento_data_fim').val(`${anoFim}-${mesFim}-${diaFim}`);
    
    // Definir a hora inicial padrão (hora atual)
    const horaAtual = String(hoje.getHours()).padStart(2, '0');
    const minutoAtual = String(Math.floor(hoje.getMinutes() / 5) * 5).padStart(2, '0'); // Arredondar para múltiplo de 5
    $('#aprazamento_hora_inicial_multiplos').val(`${horaAtual}:${minutoAtual}`);

    // Abrir o modal
    const modal = new bootstrap.Modal(document.getElementById('modalAprazamento'));
    modal.show();
});

// Processamento dos horários selecionados para aprazamento
function processarHorariosSelecionados() {
    const horariosSelecionados = [];
    $('.horario-check:checked').each(function() {
        const dataHora = $(this).val().split(':');
        if (dataHora && dataHora.length === 2) {
            const data = dataHora[0];
            const hora = dataHora[1];
            horariosSelecionados.push({
                data: data,
                hora: hora
            });
        }
    });
    
    if (horariosSelecionados.length === 0) {
        return null;
    }
    
    // Organizar horários por data para o formato esperado
    const horariosPorDia = {};
    horariosSelecionados.forEach(item => {
        if (!horariosPorDia[item.data]) {
            horariosPorDia[item.data] = [];
        }
        horariosPorDia[item.data].push(item.hora);
    });
    
    // Formatar como texto: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
    const linhasAprazamento = [];
    Object.keys(horariosPorDia).forEach(data => {
        const horariosOrdenados = horariosPorDia[data].sort();
        linhasAprazamento.push(`${data}: ${horariosOrdenados.join(', ')}`);
    });
    
    return linhasAprazamento.join('; ');
}

// Clique em "Ver Aprazamentos"
$(document).on('click', '.btn-ver-aprazamento', function () {
    const prescricaoId = $(this).data('prescricao-id');
    const medicamentoNome = $(this).data('medicamento-nome');

    // Fazer requisição para o novo endpoint de aprazamentos
    $.ajax({
        url: `/api/prescricoes/aprazamento/${prescricaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                // Filtrar aprazamentos pelo nome do medicamento
                const aprazamentosDoMedicamento = response.aprazamentos.filter(
                    apr => apr.nome_medicamento === medicamentoNome
                );
                
                if (aprazamentosDoMedicamento.length === 0) {
                    alert('Não há aprazamentos registrados para este medicamento.');
                    return;
                }
                
                // Converter para o formato de texto esperado pelo calendário
                const textoAprazamento = converterAprazamentosParaTexto(aprazamentosDoMedicamento);
                
                // Exibir no modal
                inicializarModalCalendarioAprazamento(textoAprazamento, `Aprazamentos para ${medicamentoNome}`);
            } else {
                alert('Erro ao buscar aprazamentos: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr) {
            console.error('Erro ao buscar aprazamentos:', xhr.responseText);
            alert('Erro ao buscar aprazamentos.');
        }
    });
});

// Função para converter aprazamentos do novo formato para texto
function converterAprazamentosParaTexto(aprazamentos) {
    // Agrupar por data
    const porData = {};
    
    aprazamentos.forEach(apr => {
        const [data, hora] = apr.data_hora_aprazamento.split(' ');
        
        if (!porData[data]) {
            porData[data] = [];
        }
        
        porData[data].push(hora);
    });
    
    // Montar texto no formato esperado
    const partes = [];
    
    Object.keys(porData).sort().forEach(data => {
        const horarios = porData[data].sort();
        partes.push(`${data}: ${horarios.join(', ')}`);
    });
    
    return partes.join('; ');
}

// Função para converter lista de aprazamentos para texto (mantida por compatibilidade)
function converterListaAprazamentosParaTexto(listaAprazamentos) {
    return converterAprazamentosParaTexto(listaAprazamentos);
}
