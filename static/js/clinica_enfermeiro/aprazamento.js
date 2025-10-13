// Arquivo: aprazamento.js
// Responsável pelas funcionalidades relacionadas ao aprazamento de medicamentos

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

// Função para calcular horários de aprazamento baseados em frequência
function calcularHorariosAprazamento() {
    // Obter valores dos campos
    const dataInicio = $('#aprazamento_data_inicio').val();
    const dataFim = $('#aprazamento_data_fim').val();
    const intervalo = $('#aprazamento_intervalo').val();
    const horaInicial = $('#aprazamento_hora_inicial_multiplos').val();
    
    // Validar campos
    if (!dataInicio || !dataFim || !intervalo || !horaInicial) {
        $('#horarios_multiplos_dias').html('<div class="alert alert-warning">Preencha todos os campos para calcular os horários.</div>');
        return;
    }
    
    // Validar intervalo
    const intervaloHoras = parseInt(intervalo);
    if (isNaN(intervaloHoras) || intervaloHoras < 1 || intervaloHoras > 24) {
        $('#horarios_multiplos_dias').html('<div class="alert alert-warning">O intervalo deve ser um número entre 1 e 24 horas.</div>');
        return;
    }
    
    // Criar objetos de data
    const dataInicioObj = new Date(`${dataInicio}T${horaInicial}`);
    const dataFimObj = new Date(`${dataFim}T23:59:59`);
    
    // Validar datas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
        $('#horarios_multiplos_dias').html('<div class="alert alert-warning">Datas ou hora inválidas.</div>');
        return;
    }
    
    if (dataInicioObj > dataFimObj) {
        $('#horarios_multiplos_dias').html('<div class="alert alert-warning">A data de início deve ser anterior à data de fim.</div>');
        return;
    }
    
    // Calcular horários
    const horarios = {};
    let dataAtual = new Date(dataInicioObj);
    
    while (dataAtual <= dataFimObj) {
        // Formatar a data como DD/MM/YYYY
        const dia = String(dataAtual.getDate()).padStart(2, '0');
        const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
        const ano = dataAtual.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;
        
        // Formatar a hora como HH:MM
        const hora = String(dataAtual.getHours()).padStart(2, '0');
        const minuto = String(dataAtual.getMinutes()).padStart(2, '0');
        const horaFormatada = `${hora}:${minuto}`;
        
        // Adicionar à estrutura de horários
        if (!horarios[dataFormatada]) {
            horarios[dataFormatada] = [];
        }
        
        horarios[dataFormatada].push(horaFormatada);
        
        // Avançar para o próximo horário
        dataAtual.setHours(dataAtual.getHours() + intervaloHoras);
    }
    
    // Criar HTML para exibir os horários
    let html = '';
    
    Object.keys(horarios).forEach(data => {
        html += `<div class="data-aprazamento mb-2">
            <div class="data-label">${data}</div>
            <div class="horarios-container">`;
        
        horarios[data].forEach(hora => {
            html += `<span class="badge bg-primary horario-badge">${hora}</span>`;
        });
        
        html += `</div>
        </div>`;
    });
    
    // Gerar formato para o campo de aprazamento
    let formatoAprazamento = '';
    Object.keys(horarios).forEach(data => {
        formatoAprazamento += `${data}: ${horarios[data].join(', ')};`;
    });
    
    // Atualizar campo oculto com o valor formatado
    $('#aprazamento_formatado').val(formatoAprazamento);
    
    // Atualizar visualização
    $('#horarios_multiplos_dias').html(html);
}

// Função para enviar um aprazamento
function enviarAprazamento() {
    const prescricaoId = $('#aprazamento_prescricao_id').val();
    const medicamentoIndex = $('#aprazamento_medicamento_index').val();
    const aprazamentoFormatado = $('#aprazamento_formatado').val();
    
    if (!prescricaoId || !medicamentoIndex) {
        alert('Dados da prescrição incompletos. Tente novamente.');
        return;
    }
    
    if (!aprazamentoFormatado) {
        alert('Por favor, calcule os horários de aprazamento primeiro.');
        return;
    }
    
    // Verificar se o usuário tem permissão para aprazamento
    if (!window.session || window.session.cargo !== 'Enfermeiro') {
        alert('Apenas enfermeiros podem realizar aprazamento de medicamentos.');
        return;
    }
    
    // Mostrar carregamento
    const btnSubmit = $('#btn-confirmar-aprazamento');
    const textoOriginal = btnSubmit.html();
    btnSubmit.html('<i class="fas fa-spinner fa-spin"></i> Enviando...');
    btnSubmit.prop('disabled', true);
    
    // Preparar dados para envio
    const dados = {
        prescricao_id: parseInt(prescricaoId),
        medicamento_index: parseInt(medicamentoIndex),
        enfermeiro_id: parseInt(window.session.user_id),
        aprazamento: aprazamentoFormatado
    };
    
    // Enviar dados para o servidor
    $.ajax({
        url: '/api/prescricoes/aprazamento',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(dados),
        success: function(response) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            if (response.success) {
                // Fechar modal
                $('#modalAprazamento').modal('hide');
                
                // Recarregar prescrições
                if (typeof carregarPrescricoes === 'function') {
                    carregarPrescricoes(window.internacaoId);
                }
                
                // Mostrar mensagem de sucesso
                alert('Aprazamento registrado com sucesso!');
            } else {
                alert('Erro ao registrar aprazamento: ' + (response.message || 'Erro desconhecido'));
            }
        },
        error: function(xhr, status, error) {
            // Restaurar botão
            btnSubmit.html(textoOriginal);
            btnSubmit.prop('disabled', false);
            
            console.error('Erro ao registrar aprazamento:', xhr.responseText);
            alert('Erro de comunicação ao tentar registrar aprazamento');
        }
    });
}

// Função para alternar a visualização do campo de intervalo personalizado
function toggleIntervaloPersonalizado() {
    const intervalo = $('#aprazamento_intervalo').val();
    
    if (intervalo === 'custom') {
        $('#multiplos_intervalo_custom').show();
    } else {
        $('#multiplos_intervalo_custom').hide();
    }
}

// Inicializar eventos quando o documento estiver pronto
$(document).ready(function() {
    // Configurar cálculo automático ao alterar os campos
    $('#aprazamento_data_inicio, #aprazamento_data_fim, #aprazamento_intervalo, #aprazamento_hora_inicial_multiplos, #aprazamento_intervalo_custom').on('change', function() {
        // Se for o campo de intervalo, verificar se precisa mostrar campo personalizado
        if ($(this).attr('id') === 'aprazamento_intervalo') {
            toggleIntervaloPersonalizado();
            
            // Se escolher um valor personalizado, não calcular ainda
            if ($(this).val() === 'custom') {
                return;
            }
        }
        
        // Calcular horários automaticamente
        calcularHorariosAprazamento();
    });
    
    // Configurar botão de calcular horários
    $('#btn-calcular-horarios').on('click', function() {
        calcularHorariosAprazamento();
    });
    
    // Configurar botão de confirmar aprazamento
    $('#btn-confirmar-aprazamento').on('click', function() {
        enviarAprazamento();
    });
    
    // Configurar uso de intervalo personalizado
    $('#aprazamento_intervalo_custom').on('input', function() {
        // Atualizar o valor do intervalo padrão com o valor personalizado
        const valorCustom = $(this).val();
        if (valorCustom && !isNaN(valorCustom) && valorCustom > 0) {
            $('#aprazamento_intervalo').val(valorCustom);
            calcularHorariosAprazamento();
        }
    });
}); 