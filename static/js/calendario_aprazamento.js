// Arquivo: calendario_aprazamento.js
// Responsável pelas funcionalidades relacionadas à visualização do calendário de aprazamento

// Variáveis globais
let calendarioOptions = {
    diasSemana: true,
    horaInicio: 8,
    horaFim: 20,
    intervalo: 60, // em minutos
    mostrarHistorico: true
};

// Função para inicializar o calendário de aprazamento
function inicializarCalendarioAprazamento() {
    // Configurar opções padrão
    configurarOpcoesCalendario();
    
    // Renderizar o calendário inicialmente
    renderizarCalendarioAprazamento();
    
    // Configurar eventos
    configurarEventosCalendario();
}

// Configurar opções do calendário
function configurarOpcoesCalendario() {
    // Recuperar opções salvas no localStorage, se existirem
    const opcoesStorage = localStorage.getItem('calendarioAprazamentoOptions');
    if (opcoesStorage) {
        try {
            const opcoesSalvas = JSON.parse(opcoesStorage);
            calendarioOptions = { ...calendarioOptions, ...opcoesSalvas };
        } catch (e) {
            console.error('Erro ao recuperar opções do calendário:', e);
        }
    }
    
    // Aplicar opções à interface
    $('#calendario-hora-inicio').val(calendarioOptions.horaInicio);
    $('#calendario-hora-fim').val(calendarioOptions.horaFim);
    $('#calendario-intervalo').val(calendarioOptions.intervalo);
    $('#calendario-mostrar-historico').prop('checked', calendarioOptions.mostrarHistorico);
}

// Salvar opções do calendário
function salvarOpcoesCalendario() {
    // Atualizar objeto de opções
    calendarioOptions.horaInicio = parseInt($('#calendario-hora-inicio').val(), 10);
    calendarioOptions.horaFim = parseInt($('#calendario-hora-fim').val(), 10);
    calendarioOptions.intervalo = parseInt($('#calendario-intervalo').val(), 10);
    calendarioOptions.mostrarHistorico = $('#calendario-mostrar-historico').is(':checked');
    
    // Validar opções
    if (calendarioOptions.horaInicio >= calendarioOptions.horaFim) {
        alert('A hora de início deve ser menor que a hora de fim.');
        return false;
    }
    
    if (calendarioOptions.intervalo < 5 || calendarioOptions.intervalo > 360) {
        alert('O intervalo deve estar entre 5 e 360 minutos.');
        return false;
    }
    
    // Salvar no localStorage
    localStorage.setItem('calendarioAprazamentoOptions', JSON.stringify(calendarioOptions));
    
    // Atualizar visualização
    renderizarCalendarioAprazamento();
    
    return true;
}

// Renderizar o calendário de aprazamento
function renderizarCalendarioAprazamento() {
    if (!window.internacaoId) {
        $('#calendario-container').html('<div class="alert alert-warning">ID de internação não informado.</div>');
        return;
    }
    
    // Mostrar indicador de carregamento
    $('#calendario-container').html('<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Carregando calendário...</div>');
    
    // Buscar dados de aprazamento da nova tabela
    $.ajax({
        url: `/api/aprazamentos/prescricao/${window.internacaoId}`,
        method: 'GET',
        success: function(response) {
            if (response.success) {
                // Processar aprazamentos para o formato do calendário
                const aprazamentosProcessados = processarAprazamentosParaCalendario(response.aprazamentos);
                renderizarGradeHoraria(aprazamentosProcessados.aprazamentos, aprazamentosProcessados.dias);
            } else {
                $('#calendario-container').html(`<div class="alert alert-warning">${response.message || 'Erro ao carregar dados do calendário.'}</div>`);
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar dados do calendário:', xhr.responseText);
            $('#calendario-container').html('<div class="alert alert-danger">Erro ao carregar dados do calendário.</div>');
        }
    });
}

// Processar aprazamentos para o formato do calendário
function processarAprazamentosParaCalendario(aprazamentos) {
    const aprazamentosPorHorario = {};
    const dias = new Set();
    
    aprazamentos.forEach(apz => {
        const [data, hora] = apz.data_hora_aprazamento.split(' ');
        dias.add(data);
        
        const chave = `${data}-${hora}`;
        if (!aprazamentosPorHorario[chave]) {
            aprazamentosPorHorario[chave] = [];
        }
        
        aprazamentosPorHorario[chave].push({
            medicamento: apz.nome_medicamento,
            dosagem: apz.descricao_uso,
            status: apz.realizado ? 'Administrado' : 'Pendente'
        });
    });
    
    return {
        aprazamentos: aprazamentosPorHorario,
        dias: Array.from(dias).sort()
    };
}

// Renderizar a grade horária do calendário
function renderizarGradeHoraria(aprazamentos, dias) {
    if (!aprazamentos || !dias || dias.length === 0) {
        $('#calendario-container').html('<div class="alert alert-info">Nenhum dado de aprazamento disponível para o período.</div>');
        return;
    }
    
    // Calcular horários baseados nas opções
    const horarios = [];
    const minutosTotais = (calendarioOptions.horaFim - calendarioOptions.horaInicio) * 60;
    const numIntervalos = Math.ceil(minutosTotais / calendarioOptions.intervalo);
    
    for (let i = 0; i <= numIntervalos; i++) {
        const minutos = i * calendarioOptions.intervalo;
        const horaTotal = calendarioOptions.horaInicio + Math.floor(minutos / 60);
        const minutoTotal = minutos % 60;
        
        const hora = String(horaTotal).padStart(2, '0');
        const minuto = String(minutoTotal).padStart(2, '0');
        
        horarios.push(`${hora}:${minuto}`);
    }
    
    // Construir HTML da tabela
    let html = `
        <div class="table-responsive">
            <table class="table table-bordered table-sm calendario-aprazamento">
                <thead>
                    <tr>
                        <th class="text-center">Horário</th>
    `;
    
    // Adicionar cabeçalhos dos dias
    dias.forEach(dia => {
        const dataParts = dia.split('-');
        const dataFormatada = `${dataParts[2]}/${dataParts[1]}`;
        html += `<th class="text-center">${dataFormatada}</th>`;
    });
    
    html += `
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Adicionar linhas de horários
    horarios.forEach(horario => {
        html += `
            <tr>
                <td class="text-center bg-light">${horario}</td>
        `;
        
        // Adicionar células para cada dia
        dias.forEach(dia => {
            const celKey = `${dia}-${horario}`;
            const medicamentos = aprazamentos[celKey] || [];
            
            if (medicamentos.length > 0) {
                html += `<td class="celula-medicamento" data-medicamentos="${medicamentos.length}">`;
                
                medicamentos.forEach(med => {
                    const statusClass = getStatusClass(med.status);
                    
                    html += `
                        <div class="medicamento-badge ${statusClass}" 
                            data-bs-toggle="tooltip" 
                            title="${med.medicamento} ${med.dosagem || ''} - ${med.status || 'Pendente'}">
                            ${med.medicamento.substring(0, 15)}${med.medicamento.length > 15 ? '...' : ''}
                        </div>
                    `;
                });
                
                html += '</td>';
            } else {
                html += '<td></td>';
            }
        });
        
        html += '</tr>';
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="mt-3 small">
            <strong>Legenda:</strong>
            <span class="badge bg-primary me-2">Pendente</span>
            <span class="badge bg-success me-2">Administrado</span>
            <span class="badge bg-danger me-2">Não administrado</span>
            <span class="badge bg-warning text-dark me-2">Suspenso</span>
        </div>
    `;
    
    // Renderizar HTML
    $('#calendario-container').html(html);
    
    // Inicializar tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Aplicar cores baseadas na quantidade de medicamentos
    $('.celula-medicamento').each(function() {
        const qtd = parseInt($(this).data('medicamentos'), 10);
        if (qtd >= 4) {
            $(this).addClass('bg-danger bg-opacity-10');
        } else if (qtd >= 2) {
            $(this).addClass('bg-warning bg-opacity-10');
        }
    });
}

// Obter classe CSS baseada no status do medicamento
function getStatusClass(status) {
    switch (status?.toLowerCase()) {
        case 'administrado':
            return 'bg-success';
        case 'não administrado':
        case 'nao administrado':
            return 'bg-danger';
        case 'suspenso':
            return 'bg-warning text-dark';
        default:
            return 'bg-primary';
    }
}

// Configurar eventos do calendário
function configurarEventosCalendario() {
    // Botão de atualizar calendário
    $('#btn-atualizar-calendario').on('click', function() {
        renderizarCalendarioAprazamento();
    });
    
    // Botão de salvar opções
    $('#btn-salvar-opcoes-calendario').on('click', function() {
        if (salvarOpcoesCalendario()) {
            $('#modalOpcoesCalendario').modal('hide');
        }
    });
    
    // Botão de resetar opções padrão
    $('#btn-reset-opcoes-calendario').on('click', function() {
        calendarioOptions = {
            diasSemana: true,
            horaInicio: 8,
            horaFim: 20,
            intervalo: 60,
            mostrarHistorico: true
        };
        
        configurarOpcoesCalendario();
    });
}

// Função para exportar calendário como PDF
function exportarCalendarioPDF() {
    const element = document.getElementById('calendario-container');
    if (!element) return;
    
    // Configurar opções do html2pdf
    const opt = {
        margin: 10,
        filename: `calendario_aprazamento_${window.internacaoId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    // Gerar PDF
    html2pdf().set(opt).from(element).save();
}

// Inicialização quando o documento estiver pronto
$(document).ready(function() {
    // Inicializar o calendário se estivermos na página correta
    if ($('#calendario-container').length > 0) {
        inicializarCalendarioAprazamento();
    }
}); 