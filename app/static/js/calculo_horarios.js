/**
 * Arquivo para cálculo e visualização de horários de aprazamento
 * Integra com botão de calcular horários
 */

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se estamos na página que contém o botão de calcular horários para múltiplos dias
    const btnCalcularMultiplosDias = document.getElementById('btn_calcular_multiplos_dias');
    
    if (btnCalcularMultiplosDias) {
        console.log('Inicializando funcionalidade de cálculo de horários para múltiplos dias');
        
        // Configurar listener para o botão
        btnCalcularMultiplosDias.addEventListener('click', calcularHorariosMultiplosDias);
        
        // Configurar listener para alteração no select de intervalo
        const selectIntervalo = document.getElementById('aprazamento_multiplos_intervalo');
        if (selectIntervalo) {
            selectIntervalo.addEventListener('change', function() {
                const divCustom = document.getElementById('multiplos_intervalo_custom');
                if (this.value === 'custom') {
                    divCustom.style.display = 'block';
                } else {
                    divCustom.style.display = 'none';
                }
            });
        }
        
        // Inicializar data de início com a data atual
        const campoDataInicio = document.getElementById('aprazamento_data_inicio');
        if (campoDataInicio) {
            const hoje = new Date();
            const dataFormatada = hoje.toISOString().split('T')[0];
            campoDataInicio.value = dataFormatada;
            
            // Se existir um campo de data fim, definir como data atual + 7 dias
            const campoDataFim = document.getElementById('aprazamento_data_fim');
            if (campoDataFim) {
                const dataFim = new Date();
                dataFim.setDate(hoje.getDate() + 7);
                campoDataFim.value = dataFim.toISOString().split('T')[0];
            }
        }
    }
});

/**
 * Calcula os horários de aprazamento com base nos parâmetros selecionados
 */
function calcularHorariosAprazamento() {
    console.log('Calculando horários de aprazamento');
    
    // Obter o container onde os horários serão exibidos
    const containerHorarios = document.getElementById('horarios_calculados');
    
    // Verificar qual aba está ativa
    const tabMesmoDia = document.querySelector('#mesmo-dia.active');
    const tabMultiplosDias = document.querySelector('#multiplos-dias.active');
    
    try {
        let textoAprazamento = '';
        
        if (tabMesmoDia && tabMesmoDia.classList.contains('active')) {
            // Calcular horários para o mesmo dia
            textoAprazamento = calcularHorariosMesmoDia();
        } else if (tabMultiplosDias && tabMultiplosDias.classList.contains('active')) {
            // Calcular horários para múltiplos dias
            textoAprazamento = calcularHorariosMultiplosDias();
        } else {
            // Verificar se existe elemento com ID "nav-mesmo-dia-tab" (Bootstrap 5)
            const tabNavMesmoDia = document.getElementById('nav-mesmo-dia-tab');
            const tabContentMesmoDia = document.getElementById('nav-mesmo-dia');
            
            if (tabNavMesmoDia && tabNavMesmoDia.classList.contains('active')) {
                // Calcular horários para o mesmo dia
                textoAprazamento = calcularHorariosMesmoDia();
            } else {
                // Por padrão, calcular horários para o mesmo dia
                textoAprazamento = calcularHorariosMesmoDia();
            }
        }
        
        if (textoAprazamento) {
            // Exibir os horários de forma organizada
            exibirHorariosAprazamento(textoAprazamento, 'horarios_calculados');
            
            // Adicionar botão para limpar os horários
            const botoesContainer = document.createElement('div');
            botoesContainer.className = 'mt-3 d-flex justify-content-end';
            botoesContainer.innerHTML = `
                <button type="button" class="btn btn-sm btn-outline-secondary" id="btn-limpar-horarios">
                    <i class="bi bi-trash me-1"></i> Limpar Horários
                </button>
            `;
            containerHorarios.appendChild(botoesContainer);
            
            // Adicionar event listener para o botão de limpar
            document.getElementById('btn-limpar-horarios').addEventListener('click', function() {
                limparHorariosCalculados();
            });
        } else {
            containerHorarios.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i> Não foi possível calcular os horários. Verifique os parâmetros.
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao calcular horários:', error);
        containerHorarios.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i> Erro ao calcular horários: ${error.message}
            </div>
        `;
    }
}

/**
 * Limpa os horários calculados e remove o container
 */
function limparHorariosCalculados() {
    const containerHorarios = document.getElementById('horarios_calculados');
    if (containerHorarios) {
        containerHorarios.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i> Preencha os campos acima e clique em "Calcular Horários".
            </div>
        `;
    }
}

/**
 * Calcula horários para o mesmo dia
 * @returns {string} - Texto de aprazamento no formato DD/MM/YYYY: HH:MM, HH:MM
 */
function calcularHorariosMesmoDia() {
    // Obter os parâmetros
    const dataInicio = document.getElementById('aprazamento_data_inicio')?.value;
    const horaInicio = document.getElementById('aprazamento_hora_inicio')?.value || '08:00';
    const selectIntervalo = document.getElementById('aprazamento_intervalo');
    
    // Verificar se os campos obrigatórios estão preenchidos
    if (!dataInicio) {
        throw new Error('Data de início não definida');
    }
    
    // Obter o intervalo (em horas)
    let intervaloHoras;
    if (selectIntervalo.value === 'custom') {
        intervaloHoras = parseFloat(document.getElementById('aprazamento_intervalo_custom')?.value || '0');
        if (intervaloHoras <= 0) {
            throw new Error('Intervalo personalizado deve ser maior que zero');
        }
    } else {
        intervaloHoras = parseFloat(selectIntervalo.value);
    }
    
    // Número de doses por dia (24h / intervalo, arredondado para baixo)
    const dosesPorDia = Math.floor(24 / intervaloHoras);
    
    // Data no formato JavaScript
    const [ano, mes, dia] = dataInicio.split('-');
    const [hora, minuto] = horaInicio.split(':');
    
    // Criar objeto Date
    const dataObj = new Date(ano, mes - 1, dia, hora, minuto);
    
    // Gerar os horários
    const horarios = [];
    for (let i = 0; i < dosesPorDia; i++) {
        // Adicionar horário atual
        const horaAtual = String(dataObj.getHours()).padStart(2, '0');
        const minutoAtual = String(dataObj.getMinutes()).padStart(2, '0');
        horarios.push(`${horaAtual}:${minutoAtual}`);
        
        // Avançar para o próximo horário
        dataObj.setTime(dataObj.getTime() + intervaloHoras * 60 * 60 * 1000);
    }
    
    // Data formatada no padrão DD/MM/YYYY
    const dataFormatada = `${dia}/${mes}/${ano}`;
    
    // Retornar texto de aprazamento
    return `${dataFormatada}: ${horarios.join(', ')}`;
}

/**
 * Calcula horários para múltiplos dias
 * Adaptado para funcionar com o novo layout simplificado
 */
function calcularHorariosMultiplosDias() {
    console.log('Calculando horários para múltiplos dias');
    
    try {
        // Obter os parâmetros
        const dataInicio = document.getElementById('aprazamento_data_inicio')?.value;
        const dataFim = document.getElementById('aprazamento_data_fim')?.value;
        const horaInicial = document.getElementById('aprazamento_hora_inicial_multiplos')?.value;
        const selectIntervalo = document.getElementById('aprazamento_multiplos_intervalo');
        
        // Verificar se os campos obrigatórios estão preenchidos
        if (!dataInicio || !dataFim) {
            throw new Error('Data de início ou fim não definida');
        }
        
        // Converter para objetos Date
        const dataInicioObj = new Date(dataInicio);
        const dataFimObj = new Date(dataFim);
        
        // Verificar se a data fim é maior que a data início
        if (dataFimObj < dataInicioObj) {
            throw new Error('A data final deve ser maior ou igual à data inicial');
        }
        
        // Obter o intervalo (em horas)
        let intervaloHoras;
        if (selectIntervalo.value === 'custom') {
            intervaloHoras = parseFloat(document.getElementById('aprazamento_multiplos_intervalo_custom')?.value || '0');
            if (intervaloHoras <= 0) {
                throw new Error('Intervalo personalizado deve ser maior que zero');
            }
        } else {
            intervaloHoras = parseFloat(selectIntervalo.value);
        }
        
        // Calcular horários usando a função existente
        const horariosPorDia = calcularHorariosIntervaloFixo(dataInicio, dataFim, intervaloHoras, horaInicial);
        
        if (Object.keys(horariosPorDia).length === 0) {
            document.getElementById('horarios_multiplos_dias').innerHTML = `
                <div class="card-body text-center py-4">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i> 
                        Não foi possível calcular os horários com os parâmetros informados.
                    </div>
                </div>
            `;
            return;
        }
        
        // Formatar HTML com dias e horários
        const html = gerarHTMLHorariosPorDia(horariosPorDia);
        document.getElementById('horarios_multiplos_dias').innerHTML = html;
        
        // Adicionar manipuladores de eventos para selecionar/desmarcar todos
        if (document.getElementById('selecionar_todos')) {
            document.getElementById('selecionar_todos').addEventListener('click', function() {
                document.querySelectorAll('.horario-check').forEach(el => {
                    el.checked = true;
                });
            });
        }
        
        if (document.getElementById('desmarcar_todos')) {
            document.getElementById('desmarcar_todos').addEventListener('click', function() {
                document.querySelectorAll('.horario-check').forEach(el => {
                    el.checked = false;
                });
            });
        }
    } catch (error) {
        console.error('Erro ao calcular horários para múltiplos dias:', error);
        document.getElementById('horarios_multiplos_dias').innerHTML = `
            <div class="card-body text-center py-4">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i> 
                    Erro ao calcular horários: ${error.message}
                </div>
            </div>
        `;
    }
}

// Função para formatação de data no padrão brasileiro
function formatarDataBR(dataISO) {
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para processar horários selecionados e formatar para armazenamento
function processarHorariosSelecionados() {
    const horariosSelecionados = [];
    $('.horario-check:checked').each(function() {
        horariosSelecionados.push($(this).val());
    });
    
    if (horariosSelecionados.length === 0) {
        return null;
    }
    
    console.log('Horários selecionados:', horariosSelecionados);
    
    // Ordenar os horários por data e hora
    horariosSelecionados.sort();
    
    // Organizar horários por data
    const horariosPorDia = {};
    horariosSelecionados.forEach(dataHora => {
        // O valor do checkbox é no formato: "DD/MM/YYYY:HH:MM"
        const partes = dataHora.split(':');
        if (partes.length < 2) return; // Pular entradas inválidas
        
        const data = partes[0]; // "DD/MM/YYYY"
        // O resto é o horário (pode ter mais de um ':' como em HH:MM:SS)
        const hora = partes.slice(1).join(':');
        
        if (!data || !hora) return; // Pular se data ou hora for vazia
        
        // Verificar se a data está no formato correto
        if (!data.match(/^\d{2}\/\d{2}\/\d{4}$/)) return; // Pular se formato inválido
        
        if (!horariosPorDia[data]) {
            horariosPorDia[data] = [];
        }
        
        horariosPorDia[data].push(hora);
    });
    
    console.log('Horários organizados por dia:', horariosPorDia);
    
    // Formatar como texto: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
    const linhasAprazamento = [];
    Object.keys(horariosPorDia).forEach(data => {
        // Ordenar horários cronologicamente
        const horariosOrdenados = horariosPorDia[data].sort((a, b) => {
            const [horaA, minA] = a.split(':').map(Number);
            const [horaB, minB] = b.split(':').map(Number);
            return (horaA * 60 + minA) - (horaB * 60 + minB);
        });
        
        linhasAprazamento.push(`${data}: ${horariosOrdenados.join(', ')}`);
    });
    
    const resultado = linhasAprazamento.join('; ');
    console.log('Resultado final do processamento:', resultado);
    
    return resultado;
}

// Função para calcular horários em múltiplos dias
function calcularHorariosMultiplosDias(dataInicio, dataFim, horaInicio, horaFim, intervaloHoras) {
    // Converter strings para objetos Date
    const inicio = new Date(`${dataInicio}T${horaInicio || '00:00'}`);
    
    // Se dataFim não foi fornecido, usar 7 dias depois de dataInicio
    let fim;
    if (dataFim) {
        fim = new Date(`${dataFim}T${horaFim || '23:59:59'}`);
    } else {
        fim = new Date(inicio);
        fim.setDate(fim.getDate() + 7);
        fim.setHours(23, 59, 59);
    }
    
    // Verificar se fim é depois de início
    if (fim <= inicio) {
        throw new Error('A data/hora final deve ser posterior à data/hora inicial');
    }
    
    // Converter intervalo para milissegundos
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;
    
    const horariosPorDia = {};
    let currentTime = new Date(inicio);
    
    // Iterar de início até fim, incrementando pelo intervalo
    while (currentTime <= fim) {
        // Formatar a data (YYYY-MM-DD)
        const ano = currentTime.getFullYear();
        const mes = String(currentTime.getMonth() + 1).padStart(2, '0');
        const dia = String(currentTime.getDate()).padStart(2, '0');
        const dataAtual = `${ano}-${mes}-${dia}`;
        
        // Formatar a hora (HH:MM)
        const hora = String(currentTime.getHours()).padStart(2, '0');
        const minuto = String(currentTime.getMinutes()).padStart(2, '0');
        const horaAtual = `${hora}:${minuto}`;
        
        // Adicionar ao array de horários deste dia
        if (!horariosPorDia[dataAtual]) {
            horariosPorDia[dataAtual] = [];
        }
        
        horariosPorDia[dataAtual].push(horaAtual);
        
        // Avançar para o próximo horário
        currentTime = new Date(currentTime.getTime() + intervaloMs);
    }
    
    return horariosPorDia;
}

/**
 * Gera o HTML para exibir os horários por dia
 * Versão atualizada com design mais moderno
 */
function gerarHTMLHorariosPorDia(horariosPorDia) {
    console.group('gerarHTMLHorariosPorDia');
    console.log('Horários por dia (entrada):', horariosPorDia);
    
    let html = `
        <div class="card-body p-2">
            <div class="row g-2">
    `;
    
    // Ordenar as datas
    const datas = Object.keys(horariosPorDia).sort();
    console.log('Datas ordenadas:', datas);
    
    datas.forEach(data => {
        const horarios = horariosPorDia[data];
        
        // Converter formato YYYY-MM-DD para DD/MM/YYYY para exibição e valor
        let dataExibicao = data;
        let dataValor = data;
        
        if (data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            dataExibicao = `${dia}/${mes}/${ano}`;
            dataValor = dataExibicao;
        }
        
        // Verificar formato da data - garantir que seja DD/MM/YYYY
        if (!dataValor.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            console.warn('Formato de data inválido, pulando:', dataValor);
            return;
        }
        
        console.log(`Processando data: ${data} => exibição: ${dataExibicao}, valor: ${dataValor}`);
        
        html += `
            <div class="col-12">
                <div class="card shadow-sm">
                    <div class="card-header bg-light py-1 px-2">
                        <strong class="small">${dataExibicao}</strong>
                    </div>
                    <div class="card-body p-1">
                        <div class="row g-1 mx-0">
        `;
        
        horarios.forEach((horario, index) => {
            // Validar formato da hora (deve ser HH:MM)
            let horaFormatada = horario;
            if (!horaFormatada.match(/^\d{2}:\d{2}$/)) {
                const match = horario.match(/(\d{2}):(\d{2})/);
                if (match) {
                    horaFormatada = `${match[1]}:${match[2]}`;
                } else {
                    console.warn('Formato de hora inválido, pulando:', horario);
                    return;
                }
            }
            
            // Formatar valor para o aprazamento: "DD/MM/YYYY:HH:MM"
            const valorCheckbox = `${dataValor}:${horaFormatada}`;
            console.log(`Horário ${index}: ${horario} => valor checkbox: ${valorCheckbox}`);
            
            html += `
                <div class="col-4">
                    <div class="form-check m-0" style="min-height: 1.2rem;">
                        <input class="form-check-input mt-0" type="checkbox" value="${valorCheckbox}" 
                            id="horario_${data.replace(/[\/-]/g, '')}_${index}" 
                            style="margin-right: 4px; transform: scale(0.85);" checked>
                        <label class="form-check-label small fw-normal lh-1" 
                            style="font-size: 0.75rem; padding-top: 1px;" 
                            for="horario_${data.replace(/[\/-]/g, '')}_${index}">
                            ${horaFormatada}
                        </label>
                    </div>
                </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    console.groupEnd();
    return html;
}

// Função para calcular horários entre dois horários com intervalo específico para mesmo dia
function calcularHorariosEntreIntervalo(horaInicio, horaFim, intervaloHoras) {
    // Converter horas para minutos para facilitar o cálculo
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFimH, horaFimM] = horaFim.split(':').map(Number);
    
    const inicioMinutos = horaInicioH * 60 + horaInicioM;
    const fimMinutos = horaFimH * 60 + horaFimM;
    
    // Converter intervalo de horas para minutos
    const intervaloMinutos = Math.round(intervaloHoras * 60);
    
    const horarios = [];
    let minutoAtual = inicioMinutos;
    
    // Adicionar o horário inicial
    horarios.push(formatarHoraMinutos(minutoAtual));
    
    // Calcular horários subsequentes
    while (minutoAtual + intervaloMinutos <= fimMinutos) {
        minutoAtual += intervaloMinutos;
        horarios.push(formatarHoraMinutos(minutoAtual));
    }
    
    return horarios;
}

// Formatar minutos para formato de hora HH:MM
function formatarHoraMinutos(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Função para calcular horários com intervalo fixo em vários dias
function calcularHorariosIntervaloFixo(dataInicio, dataFim, intervaloHoras, horaInicio) {
    const inicio = new Date(`${dataInicio}T${horaInicio || '00:00:00'}`);
    const fim = new Date(`${dataFim}T23:59:59`);
    
    // Verificar se o fim é depois do início
    if (fim <= inicio) {
        return {};
    }
    
    // Converter intervalo para milissegundos
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;
    
    const horariosPorDia = {};
    let currentTime = new Date(inicio);
    
    // Usar a hora inicial fornecida se disponível
    if (horaInicio) {
        const [horas, minutos] = horaInicio.split(':').map(Number);
        currentTime.setHours(horas, minutos, 0, 0);
    } else {
        // Definir primeira medicação para a hora atual se hora inicial não for fornecida
        const agora = new Date();
        currentTime.setHours(agora.getHours(), agora.getMinutes(), 0, 0);
    }
    
    // Iterar de início até fim, incrementando pelo intervalo
    while (currentTime <= fim) {
        // Formatar a data no formato brasileiro (DD/MM/YYYY)
        const ano = currentTime.getFullYear();
        const mes = String(currentTime.getMonth() + 1).padStart(2, '0');
        const dia = String(currentTime.getDate()).padStart(2, '0');
        const dataAtual = `${dia}/${mes}/${ano}`;
        
        // Formatar a hora (HH:MM)
        const hora = String(currentTime.getHours()).padStart(2, '0');
        const minuto = String(currentTime.getMinutes()).padStart(2, '0');
        const horaAtual = `${hora}:${minuto}`;
        
        // Adicionar ao array de horários deste dia
        if (!horariosPorDia[dataAtual]) {
            horariosPorDia[dataAtual] = [];
        }
        
        horariosPorDia[dataAtual].push(horaAtual);
        
        // Avançar para o próximo horário
        currentTime = new Date(currentTime.getTime() + intervaloMs);
    }
    
    return horariosPorDia;
} 