/**
 * Utilitários de Timezone para Frontend
 * =====================================
 * 
 * Funções para converter horários UTC recebidos da API para horário brasileiro
 */

/**
 * Converte uma string de datetime UTC para horário de Brasília
 * @param {string} utcDateString - Data em formato UTC (ex: "2024-01-15 14:30:00")
 * @returns {string} Data formatada em horário brasileiro
 */
function converterParaBrasilia(utcDateString) {
    if (!utcDateString) return '-';
    
    try {
        // Criar objeto Date a partir da string UTC
        // Se não tem 'Z' no final, adiciona para indicar UTC
        const utcString = utcDateString.includes('Z') ? utcDateString : utcDateString + 'Z';
        const utcDate = new Date(utcString);
        
        // Verificar se a data é válida
        if (isNaN(utcDate.getTime())) return '-';
        
        // Converter para horário de São Paulo
        const brasiliaDate = utcDate.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        return brasiliaDate;
    } catch (error) {
        console.error('Erro ao converter timezone:', error);
        return utcDateString; // Retorna original em caso de erro
    }
}

/**
 * Converte datetime UTC para formato brasileiro sem segundos
 * @param {string} utcDateString - Data em formato UTC
 * @returns {string} Data formatada como DD/MM/YYYY HH:MM
 */
function converterParaBrasiliaSemSegundos(utcDateString) {
    if (!utcDateString) return '-';
    
    try {
        const utcString = utcDateString.includes('Z') ? utcDateString : utcDateString + 'Z';
        const utcDate = new Date(utcString);
        
        if (isNaN(utcDate.getTime())) return '-';
        
        const brasiliaDate = utcDate.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return brasiliaDate;
    } catch (error) {
        console.error('Erro ao converter timezone:', error);
        return utcDateString;
    }
}

/**
 * Converte datetime UTC para apenas a data no formato brasileiro
 * @param {string} utcDateString - Data em formato UTC
 * @returns {string} Data formatada como DD/MM/YYYY
 */
function converterDataParaBrasil(utcDateString) {
    if (!utcDateString) return '-';
    
    try {
        const utcString = utcDateString.includes('Z') ? utcDateString : utcDateString + 'Z';
        const utcDate = new Date(utcString);
        
        if (isNaN(utcDate.getTime())) return '-';
        
        const brasiliaDate = utcDate.toLocaleDateString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
        });
        
        return brasiliaDate;
    } catch (error) {
        console.error('Erro ao converter timezone:', error);
        return utcDateString;
    }
}

/**
 * Converte datetime UTC para apenas a hora no formato brasileiro
 * @param {string} utcDateString - Data em formato UTC
 * @returns {string} Hora formatada como HH:MM
 */
function converterHoraParaBrasil(utcDateString) {
    if (!utcDateString) return '-';
    
    try {
        const utcString = utcDateString.includes('Z') ? utcDateString : utcDateString + 'Z';
        const utcDate = new Date(utcString);
        
        if (isNaN(utcDate.getTime())) return '-';
        
        const brasiliaHora = utcDate.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return brasiliaHora;
    } catch (error) {
        console.error('Erro ao converter timezone:', error);
        return utcDateString;
    }
}

/**
 * Converte todos os campos de datetime em um objeto para horário brasileiro
 * @param {Object} obj - Objeto com campos de data/hora
 * @param {Array} camposData - Array com nomes dos campos que contêm datas
 * @returns {Object} Objeto com datas convertidas
 */
function converterObjetoParaBrasilia(obj, camposData = []) {
    if (!obj) return obj;
    
    const objConvertido = { ...obj };
    
    camposData.forEach(campo => {
        if (objConvertido[campo]) {
            objConvertido[campo] = converterParaBrasilia(objConvertido[campo]);
        }
    });
    
    return objConvertido;
}

/**
 * Utilitário para converter respostas de API automaticamente
 * @param {Object} response - Resposta da API
 * @param {Array} camposData - Campos que contêm datas para converter
 * @returns {Object} Resposta com datas convertidas
 */
function processarRespostaAPI(response, camposData = []) {
    if (!response) return response;
    
    // Se é um array de objetos
    if (Array.isArray(response)) {
        return response.map(item => converterObjetoParaBrasilia(item, camposData));
    }
    
    // Se é um objeto único
    return converterObjetoParaBrasilia(response, camposData);
}

// Campos comuns que geralmente contêm datas/horários
const CAMPOS_DATA_COMUNS = [
    'data_receita',
    'data_atestado', 
    'data_hora_aprazamento',
    'data_realizacao',
    'data_internacao',
    'data_alta',
    'data_registro',
    'data_evolucao',
    'data_prescricao',
    'horario_prescricao',
    'horario_triagem',
    'horario_consulta_medica',
    'horario_observacao',
    'horario_internacao',
    'horario_alta',
    'horario_medicacao'
];

/**
 * Exemplo de uso com jQuery AJAX
 */
function exemploDeUso() {
    // Exemplo 1: Converter resposta de receituários
    $.get('/api/receituarios/12345', function(response) {
        if (response.success) {
            const receituariosConvertidos = processarRespostaAPI(
                response.receituarios, 
                ['data_receita']
            );
            
            // Agora todos os receituários têm data_receita em horário brasileiro
            console.log(receituariosConvertidos);
        }
    });
    
    // Exemplo 2: Converter resposta de aprazamentos
    $.get('/api/aprazamentos/123', function(response) {
        if (response.success) {
            const aprazamentosConvertidos = processarRespostaAPI(
                response.aprazamentos,
                ['data_hora_aprazamento', 'data_realizacao']
            );
            
            console.log(aprazamentosConvertidos);
        }
    });
    
    // Exemplo 3: Conversão manual de uma data específica
    const dataUTC = "2024-01-15 14:30:00";
    const dataBR = converterParaBrasilia(dataUTC);
    console.log(`UTC: ${dataUTC} -> Brasil: ${dataBR}`);
}

// Exportar funções para uso global
window.TimezoneUtils = {
    converterParaBrasilia,
    converterParaBrasiliaSemSegundos,
    converterDataParaBrasil,
    converterHoraParaBrasil,
    converterObjetoParaBrasilia,
    processarRespostaAPI,
    CAMPOS_DATA_COMUNS
}; 