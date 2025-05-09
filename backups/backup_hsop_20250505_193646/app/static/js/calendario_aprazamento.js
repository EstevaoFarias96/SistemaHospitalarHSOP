/**
 * Adiciona estilos CSS para o calendário de aprazamento
 */

// Definir dias da semana para uso em múltiplas funções
const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function adicionarEstilosCalendarioAprazamento() {
    // Verificar se os estilos já foram adicionados
    if (document.getElementById('estilos-calendario-aprazamento')) return;
    
    // Criar o elemento de estilo
    const estilos = document.createElement('style');
    estilos.id = 'estilos-calendario-aprazamento';
    estilos.innerHTML = `
        .calendario-container {
            padding: 10px 0;
            border-radius: 8px;
            background-color: #f8f9fa;
        }
        
        .dia-aprazamento {
            padding: 10px 15px;
            border-left: 4px solid #0d6efd;
            margin-bottom: 12px !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border-radius: 0 8px 8px 0;
            background-color: white;
            transition: all 0.2s ease;
        }
        
        .dia-aprazamento:hover {
            transform: translateX(2px);
            border-left-width: 6px;
        }
        
        .data-aprazamento {
            color: #0d6efd;
            font-size: 1.1rem;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
        }
        
        .data-aprazamento::before {
            content: "\\f133";
            font-family: "Bootstrap-icons";
            margin-right: 8px;
            font-size: 0.9rem;
        }
        
        .horarios-aprazamento {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .horario {
            background-color: #e7f1ff;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            color: #0d6efd;
            display: inline-flex;
            align-items: center;
        }
        
        .horario::before {
            content: "\\f550";
            font-family: "Bootstrap-icons";
            margin-right: 5px;
            font-size: 0.8rem;
        }
        
        .erro-aprazamento {
            padding: 15px;
            border-radius: 8px;
            background-color: #fff0f0;
            border-left: 4px solid #dc3545;
        }
        
        .texto-aprazamento {
            font-style: italic;
            color: #495057;
        }
    `;
    
    // Adicionar ao head
    document.head.appendChild(estilos);
}

/**
 * Visualiza o calendário de aprazamento em um container especificado
 * @param {string|Element} input - Texto de aprazamento ou elemento input
 * @param {string} containerId - ID do container onde o calendário será exibido
 */
function visualizarCalendarioAprazamento(input, containerId) {
    try {
        console.log("Visualizando calendário compacto...");
        
        // Verificar se o containerId é válido
        const container = document.getElementById(containerId);
        if (!container) {
            console.error("Container não encontrado:", containerId);
            return;
        }
        
        // Obter o texto de aprazamento
        let textoAprazamento = '';
        
        if (typeof input === 'string') {
            textoAprazamento = input.trim();
        } else if (input instanceof Element) {
            textoAprazamento = input.value.trim();
        } else if (typeof input === 'object' && input.jquery) {
            textoAprazamento = input.val().trim();
        } else {
            console.error("Tipo de input inválido:", typeof input);
            container.innerHTML = '<div class="alert alert-danger p-1 small">Formato inválido</div>';
            return;
        }
        
        // Verificar se o texto de aprazamento é válido
        if (!textoAprazamento) {
            console.warn("Texto de aprazamento vazio");
            container.innerHTML = '<div class="alert alert-warning p-1 small">Insira texto válido</div>';
            return;
        }
        
        // Limpar o container
        container.innerHTML = '';
        
        // Adicionar estilos do calendário - versão mais compacta
        const compactStyleId = 'calendario-aprazamento-compact-style';
        if (!document.getElementById(compactStyleId)) {
            const styleEl = document.createElement('style');
            styleEl.id = compactStyleId;
            styleEl.textContent = `
                .cal-aprazamento-compact {
                    font-size: 0.8rem;
                }
                .cal-aprazamento-compact .cal-data-header {
                    font-size: 0.85rem;
                    padding: 3px;
                    background-color: #f8f9fa;
                    border-radius: 3px;
                }
                .cal-aprazamento-compact .cal-horarios {
                    padding: 3px;
                    margin-bottom: 5px;
                }
                .cal-aprazamento-compact .cal-horario {
                    display: inline-block;
                    background-color: #e9ecef;
                    color: #212529;
                    border-radius: 3px;
                    padding: 2px 5px;
                    margin: 1px 2px;
                    font-size: 0.75rem;
                }
                .cal-aprazamento-compact .cal-resumo {
                    font-size: 0.75rem;
                    margin-top: 5px;
                    padding: 3px;
                    color: #6c757d;
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // Formatar o texto de aprazamento para garantir consistência
        const textoFormatado = textoAprazamento
            .replace(/\s*;\s*/g, '; ')
            .replace(/\s*:\s*/g, ':')
            .replace(/(\d{2})\s*:\s*(\d{2})/g, '$1:$2');
        
        // Gerar o calendário HTML diretamente sem cabeçalho - versão compacta
        const calendarioHTML = gerarCalendarioHTMLCompacto(textoFormatado);
        
        // Exibir o calendário sem cabeçalho ou botões adicionais
        container.innerHTML = calendarioHTML;
        
    } catch (error) {
        console.error("Erro ao visualizar calendário:", error);
        
        // Exibir mensagem de erro no container
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="alert alert-danger p-1 small">
                Erro: ${error.message || ''}
            </div>`;
        }
    }
}

/**
 * Formata a data no formato DD/MM/YYYY para um formato mais legível
 * @param {string} data - Data no formato DD/MM/YYYY
 * @returns {string} Data formatada
 */
function formatarData(data) {
    if (!data || typeof data !== 'string' || !data.includes('/')) {
        return data;
    }
    
    const [dia, mes, ano] = data.split('/');
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const nomeMes = meses[parseInt(mes, 10) - 1] || mes;
    const diaSemana = obterDiaSemana(new Date(ano, mes - 1, dia));
    
    return `${dia} de ${nomeMes} (${diaSemana})`;
}

/**
 * Retorna o nome do dia da semana para uma data
 * @param {Date} data - Objeto Date
 * @returns {string} Nome do dia da semana
 */
function obterDiaSemana(data) {
    return diasSemana[data.getDay()];
}

/**
 * Exporta o calendário como uma imagem PNG
 * @param {string} containerId - ID do container do calendário
 */
function exportarCalendarioComoImagem(containerId = 'calendario-aprazamento-container') {
    try {
        const containerCalendario = document.getElementById(containerId);
        
        if (!containerCalendario) {
            console.error('Container do calendário não encontrado:', containerId);
            alertaErro('Não foi possível exportar o calendário. Container não encontrado.');
            return;
        }
        
        // Verificar se o calendário está vazio
        if (!containerCalendario.innerHTML.trim()) {
            alertaErro('Não há conteúdo no calendário para exportar. Verifique se o calendário foi gerado corretamente.');
            return;
        }
        
        // Usar html2canvas para gerar a imagem (verifica se a biblioteca está disponível)
        if (typeof html2canvas === 'undefined') {
            // Carregar dinamicamente a biblioteca html2canvas se não estiver disponível
            console.log('html2canvas não encontrado, carregando biblioteca...');
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = function() {
                console.log('html2canvas carregado com sucesso');
                // Quando a biblioteca for carregada, continuar com a exportação
                gerarImagemCalendario(containerCalendario);
            };
            script.onerror = function(err) {
                console.error('Erro ao carregar html2canvas:', err);
                alertaErro('Não foi possível carregar a biblioteca necessária para exportação.');
            };
            document.head.appendChild(script);
        } else {
            // A biblioteca já está disponível, continuar com a exportação
            console.log('html2canvas já está disponível, gerando imagem...');
            gerarImagemCalendario(containerCalendario);
        }
    } catch (error) {
        console.error('Erro ao exportar calendário como imagem:', error);
        alertaErro('Ocorreu um erro ao exportar o calendário: ' + error.message);
    }
}

/**
 * Gera a imagem do calendário usando html2canvas
 * @param {HTMLElement} container - Container do calendário
 */
function gerarImagemCalendario(container) {
    // Configurações para captura com melhor qualidade
    const options = {
        scale: 2, // Aumenta a escala para melhor qualidade
        backgroundColor: '#ffffff', // Fundo branco
        logging: false, // Desativa logs
        useCORS: true // Permite imagens de outros domínios
    };
    
    // Mostrar indicador de carregamento
    const loadingEl = document.createElement('div');
    loadingEl.className = 'alert alert-info text-center';
    loadingEl.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Gerando imagem do calendário...';
    container.parentNode.insertBefore(loadingEl, container.nextSibling);
    
    // Converter o elemento para canvas
    html2canvas(container, options).then(canvas => {
        // Converter canvas para URL de dados
        const imgData = canvas.toDataURL('image/png');
        
        // Criar link para download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'calendario_aprazamento.png';
        link.click();
        
        // Remover indicador de carregamento
        loadingEl.remove();
        
        // Mostrar alerta de sucesso
        const alertaSuccesso = document.createElement('div');
        alertaSuccesso.className = 'alert alert-success alert-dismissible fade show mt-3';
        alertaSuccesso.innerHTML = `
            <i class="bi bi-check-circle me-2"></i> Calendário exportado com sucesso!
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        container.parentNode.insertBefore(alertaSuccesso, container.nextSibling);
        
        // Remover alerta após 3 segundos
        setTimeout(() => {
            if (alertaSuccesso.parentNode) {
                alertaSuccesso.remove();
            }
        }, 3000);
    }).catch(error => {
        // Remover indicador de carregamento
        loadingEl.remove();
        
        console.error('Erro ao gerar imagem do calendário:', error);
        alertaErro('Não foi possível gerar a imagem do calendário: ' + error.message);
    });
}

/**
 * Mostra um alerta de erro
 * @param {string} mensagem - Mensagem de erro
 */
function alertaErro(mensagem) {
    const alertaEl = document.createElement('div');
    alertaEl.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertaEl.innerHTML = `
        <i class="bi bi-exclamation-circle me-2"></i> ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Adicionar ao body ou a um container específico
    const container = document.getElementById('calendario-aprazamento-container') || document.body;
    container.parentNode.insertBefore(alertaEl, container.nextSibling);
    
    // Remover alerta após 5 segundos
    setTimeout(() => {
        if (alertaEl.parentNode) {
            alertaEl.remove();
        }
    }, 5000);
}

/**
 * Corrige formatos inválidos de aprazamento, especialmente o problema de 'undefined/undefined/'
 * @param {string} textoAprazamento - Texto original do aprazamento que pode conter erros
 * @returns {string} - Texto corrigido
 */
function corrigirAprazamentoInvalido(textoAprazamento) {
    // Verificar se o texto é válido
    if (!textoAprazamento) return '';
    
    // Converter para string se não for
    let texto = String(textoAprazamento).trim();
    
    console.log('Corrigindo aprazamento:', texto);
    
    // Remover 'undefined/undefined/' que pode aparecer no início das datas
    texto = texto.replace(/undefined\/undefined\//g, '');
    
    // Remover qualquer outro 'undefined' restante
    texto = texto.replace(/undefined/g, '');
    
    // Normalizar separadores
    texto = texto
        .replace(/(?:\r\n|\r|\n)/g, '; ') // Quebras de linha para ponto-e-vírgula
        .replace(/\s*;\s*/g, '; ')        // Normaliza espaços em torno de ponto-e-vírgula
        .replace(/\s*:\s*/g, ':')         // Remove espaços em torno de dois-pontos
        .replace(/;+/g, ';')              // Remove ponto-e-vírgula duplicados
        .replace(/:+/g, ':')              // Remove dois-pontos duplicados
        .replace(/\s+/g, ' ')             // Normaliza múltiplos espaços
        .trim();
    
    // Processar cada seção para garantir o formato correto
    const secoes = texto.split(';').filter(s => s.trim());
    const secoesCorrigidas = [];
    
    secoes.forEach(secao => {
        const parts = secao.trim().split(':');
        if (parts.length >= 2) {
            const data = parts[0].trim();
            const horarios = parts.slice(1).join(':').trim();
            
            // Verificar se a data está no formato DD/MM/YYYY
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(data)) {
                // Garantir que a data está no formato correto (com zeros à esquerda)
                const [dia, mes, ano] = data.split('/');
                const dataFormatada = `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
                
                secoesCorrigidas.push(`${dataFormatada}:${horarios}`);
            } else {
                // Tentar usar a data atual se a data estiver inválida
                const hoje = new Date();
                const dataHoje = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
                
                secoesCorrigidas.push(`${dataHoje}:${horarios}`);
            }
        }
    });
    
    const resultado = secoesCorrigidas.join('; ');
    console.log('Aprazamento corrigido:', resultado);
    return resultado;
}

/**
 * Inicializa o modal de calendário de aprazamento
 * Configura os elementos e listeners para o modal
 * @param {string} aprazamentoTexto - Texto de aprazamento a ser visualizado
 * @param {string} tituloModal - Título do modal (opcional)
 */
function inicializarModalCalendarioAprazamento(aprazamentoTexto, tituloModal = 'Calendário de Aprazamento') {
    try {
        // Verificar e corrigir formato inválido de aprazamento
        aprazamentoTexto = corrigirAprazamentoInvalido(aprazamentoTexto);
        
        // Adicionar estilos do calendário se ainda não existirem
        adicionarEstilosCalendarioAprazamento();
        
        // Verificar se o modal já existe
        if (!document.getElementById('modal-calendario-aprazamento')) {
            // Criar o modal no DOM
            const modalHTML = `
                <div class="modal fade" id="modal-calendario-aprazamento" tabindex="-1" role="dialog" aria-labelledby="modal-calendario-aprazamento-label" aria-hidden="true">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="modal-calendario-aprazamento-label">${tituloModal}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-12">
                                        <div id="calendario-aprazamento-container" class="calendario-container">
                                            <div class="alert alert-info">
                                                <i class="bi bi-info-circle-fill me-2"></i> Carregando calendário...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                                <button type="button" class="btn btn-success" id="btn-exportar-calendario">
                                    <i class="bi bi-download me-1"></i> Exportar Imagem
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Adicionar modal ao body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Configurar eventos
            document.getElementById('btn-exportar-calendario').addEventListener('click', function() {
                exportarCalendarioComoImagem('calendario-aprazamento-container');
            });
        } else {
            // Se o modal já existe, apenas atualizar o título
            document.getElementById('modal-calendario-aprazamento-label').textContent = tituloModal;
        }
        
        // Gerar e exibir o calendário
        const calendarioHTML = gerarCalendarioHTML(aprazamentoTexto);
        document.getElementById('calendario-aprazamento-container').innerHTML = calendarioHTML;
        
        // Abrir o modal usando Bootstrap
        try {
            const modalElement = document.getElementById('modal-calendario-aprazamento');
            
            // Verificar se estamos usando Bootstrap 5 ou 4
            if (typeof bootstrap !== 'undefined') {
                // Bootstrap 5
                const modalBS = new bootstrap.Modal(modalElement);
                modalBS.show();
            } else if (typeof $ !== 'undefined' && $.fn && $.fn.modal) {
                // Bootstrap 4 com jQuery
                $(modalElement).modal('show');
            } else {
                console.error('Não foi possível determinar a versão do Bootstrap. O modal pode não ser exibido corretamente.');
                // Tentativa de fallback
                modalElement.classList.add('show');
                modalElement.style.display = 'block';
            }
        } catch (e) {
            console.error('Erro ao abrir modal:', e);
            alert('Ocorreu um erro ao abrir o calendário de aprazamento.');
        }
    } catch (error) {
        console.error('Erro ao inicializar modal:', error);
        alert(`Erro ao inicializar o calendário de aprazamento.`);
    }
}

/**
 * Função interna para visualizar o calendário
 * @param {string} textoAprazamento - Texto de aprazamento a ser visualizado
 */
function visualizarCalendario(textoAprazamento) {
    try {
        // Verificar e corrigir formato inválido de aprazamento
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Gerar e exibir o calendário
        const calendarioHTML = gerarCalendarioHTML(textoAprazamento);
        document.getElementById('calendario-aprazamento-container').innerHTML = calendarioHTML;
    } catch (error) {
        console.error('Erro ao visualizar calendário:', error);
        document.getElementById('calendario-aprazamento-container').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle-fill me-2"></i> Erro ao visualizar calendário
            </div>
        `;
    }
}

// Exportar para o objeto window para estar disponível globalmente
window.inicializarModalCalendarioAprazamento = inicializarModalCalendarioAprazamento;

// Exportação para uso em outros módulos
// Usado quando o sistema é construído com webpack ou similar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        visualizarCalendarioAprazamento,
        adicionarEstilosCalendarioAprazamento,
        exportarCalendarioComoImagem,
        inicializarModalCalendarioAprazamento
    };
}

/**
 * Exibe os horários de aprazamento de forma organizada e prática
 * @param {string} textoAprazamento - Texto com horários de aprazamento
 * @param {string} idContainerDestino - ID do elemento onde os horários serão exibidos
 */
function exibirHorariosAprazamento(textoAprazamento, idContainerDestino) {
    // Verificar se o container existe
    const container = document.getElementById(idContainerDestino);
    if (!container) {
        console.error(`Container com ID ${idContainerDestino} não encontrado`);
        return;
    }
    
    // Adicionar estilos CSS
    adicionarEstilosCalendarioAprazamento();
    
    // Verificar se o texto está vazio
    if (!textoAprazamento || textoAprazamento.trim() === '') {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i> Nenhum horário de aprazamento definido.
            </div>
        `;
        return;
    }
    
    try {
        // Processar o texto de aprazamento
        // Formato esperado: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM"
        const secoes = textoAprazamento.split(';').filter(s => s.trim());
        
        // Se não houver seções válidas
        if (secoes.length === 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i> Formato de aprazamento inválido.
                </div>
            `;
            return;
        }
        
        // Construir a tabela de horários
        let html = `
            <div class="table-responsive">
                <table class="table table-sm table-bordered table-hover">
                    <thead class="table-light">
                        <tr>
                            <th class="text-center" style="width: 30%">Data</th>
                            <th class="text-center">Horários</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Processar cada seção (dia)
        secoes.forEach(secao => {
            secao = secao.trim();
            
            // Verificar se a seção contém o separador de data e horários
            if (secao.includes(':')) {
                const [data, horariosTexto] = secao.split(':').map(s => s.trim());
                
                // Criar badges para os horários
                const horarios = horariosTexto.split(',').map(h => h.trim());
                const badgesHorarios = horarios.map(h => 
                    `<span class="badge bg-primary me-1 mb-1">${h}</span>`
                ).join('');
                
                html += `
                    <tr>
                        <td class="text-center align-middle fw-bold">${formatarDataSimples(data)}</td>
                        <td class="p-2">${badgesHorarios}</td>
                    </tr>
                `;
            }
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <button type="button" class="btn btn-sm btn-outline-primary" id="btn-copiar-aprazamento">
                    <i class="bi bi-clipboard me-1"></i> Copiar
                </button>
                <small class="text-muted">Total: ${contarDosesTextoAprazamento(textoAprazamento)} doses</small>
            </div>
        `;
        
        // Atualizar o conteúdo do container
        container.innerHTML = html;
        
        // Adicionar event listener para o botão de copiar
        const btnCopiar = document.getElementById('btn-copiar-aprazamento');
        if (btnCopiar) {
            btnCopiar.addEventListener('click', function() {
                navigator.clipboard.writeText(textoAprazamento)
                    .then(() => {
                        // Feedback visual temporário
                        const btnOriginal = btnCopiar.innerHTML;
                        btnCopiar.innerHTML = '<i class="bi bi-check me-1"></i> Copiado!';
                        btnCopiar.classList.replace('btn-outline-primary', 'btn-success');
                        
                        setTimeout(() => {
                            btnCopiar.innerHTML = btnOriginal;
                            btnCopiar.classList.replace('btn-success', 'btn-outline-primary');
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Erro ao copiar texto:', err);
                        alert('Não foi possível copiar o texto. Por favor, tente novamente.');
                    });
            });
        }
        
    } catch (error) {
        console.error('Erro ao exibir horários de aprazamento:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle me-2"></i> Erro ao processar horários de aprazamento: ${error.message}
            </div>
        `;
    }
}

/**
 * Formata uma data no formato DD/MM/YYYY para exibição simples
 * @param {string} data - Data no formato DD/MM/YYYY
 * @returns {string} - Data formatada
 */
function formatarDataSimples(data) {
    if (!data) return '';
    
    // Verificar se a data já está no formato DD/MM/YYYY
    const partes = data.split('/');
    if (partes.length === 3) {
        const [dia, mes, ano] = partes;
        
        // Converter mês para nome abreviado
        const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mesAbreviado = nomesMeses[parseInt(mes) - 1] || mes;
        
        return `${dia} ${mesAbreviado} ${ano}`;
    }
    
    return data;
}

/**
 * Conta o número total de doses em um texto de aprazamento
 * @param {string} textoAprazamento - Texto de aprazamento no formato DD/MM/YYYY HH:MM, HH:MM, HH:MM; DD/MM/YYYY HH:MM, ...
 * @returns {number} Número total de doses
 */
function contarDosesTextoAprazamento(textoAprazamento) {
    if (!textoAprazamento) return 0;
    
    try {
        let totalDoses = 0;
        
        // Dividir o texto por ponto e vírgula para ter os grupos de aprazamento
        const gruposAprazamento = textoAprazamento.split(';');
        
        // Para cada grupo, contar os horários separados por vírgula
        gruposAprazamento.forEach(grupo => {
            const grupo_trim = grupo.trim();
            if (!grupo_trim) return;
            
            // Remover a parte da data (se existir) para contar apenas os horários
            const partesGrupo = grupo_trim.split(' ');
            
            // Se a primeira parte for uma data (DD/MM/YYYY), o horário começa a partir do segundo elemento
            let inicio = 0;
            if (partesGrupo[0].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                inicio = 1;
            }
            
            // Juntar as partes restantes, que devem conter os horários
            const horariosTexto = partesGrupo.slice(inicio).join(' ');
            
            // Contar os horários separados por vírgula
            const horarios = horariosTexto.split(',').filter(h => h.trim());
            totalDoses += horarios.length;
        });
        
        return totalDoses;
    } catch (error) {
        console.error("Erro ao contar doses:", error);
        return 0;
    }
}

/**
 * Gera o HTML do calendário a partir do texto de aprazamento
 * @param {string} textoAprazamento - Texto formatado de aprazamento
 * @returns {string} HTML do calendário
 */
function gerarCalendarioHTML(textoAprazamento) {
    console.log("Gerando calendário para texto: ", textoAprazamento);
    
    try {
        // Validar se a entrada é uma string
        if (!textoAprazamento || typeof textoAprazamento !== 'string') {
            console.error("Erro: Formato de aprazamento inválido (não é uma string)");
            return `<div class="alert alert-danger">
                      <i class="fas fa-exclamation-triangle"></i> Formato de aprazamento inválido
                    </div>`;
        }
        
        // Corrigir o formato do aprazamento para evitar problemas com undefined
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Pré-processamento: normalizar formato para remover espaços entre horas e minutos
        textoAprazamento = textoAprazamento.replace(/(\d{2})\s*:\s*(\d{2})/g, '$1:$2');
        
        // Validar formato básico (deve conter pelo menos '/' e ':')
        if (!textoAprazamento.includes('/') || !textoAprazamento.includes(':')) {
            console.error("Erro: Formato de aprazamento inválido (não contém '/' ou ':')");
            return `<div class="alert alert-danger">
                      <i class="fas fa-exclamation-triangle"></i> Formato de aprazamento inválido
                    </div>`;
        }

        // Dividir o texto por dias (separados por ';')
        const diasAprazamentos = textoAprazamento.split(';').map(item => item.trim());
        let html = '<div class="calendario-aprazamento">';
        
        // Processar cada dia separadamente
        for (const diaAprazamento of diasAprazamentos) {
            if (!diaAprazamento) continue;
            
            // Verificar se contém o separador ':' entre data e horários
            if (!diaAprazamento.includes(':')) {
                console.warn(`Aviso: Item de aprazamento sem formato válido: ${diaAprazamento}`);
                continue;
            }
            
            // Dividir entre data e horários
            // Considerar apenas o primeiro ':' como separador entre data e horários
            const primeiraParticao = diaAprazamento.indexOf(':');
            const dataStr = diaAprazamento.substring(0, primeiraParticao).trim();
            const horariosStr = diaAprazamento.substring(primeiraParticao + 1).trim();
            
            // Verificar se há 'undefined' na string da data e tentar corrigir
            let diaFormatado, mesFormatado, anoFormatado, dataValida = false;
            let dataObj, diaDaSemana;
            
            if (dataStr.includes('undefined')) {
                console.warn(`Aviso: Encontrado 'undefined' na data: ${dataStr}`);
                // Tentar corrigir a data removendo "undefined/"
                const dataCorrigida = dataStr.replace(/undefined\/?/g, '');
                console.log(`Tentando corrigir para: ${dataCorrigida}`);
                
                // Verificar se está no formato correto após correção
                const matchCorrigido = dataCorrigida.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (matchCorrigido) {
                    // Extrair componentes
                    [, diaFormatado, mesFormatado, anoFormatado] = matchCorrigido;
                    
                    // Validar componentes
                    const diaNum = parseInt(diaFormatado, 10);
                    const mesNum = parseInt(mesFormatado, 10);
                    const anoNum = parseInt(anoFormatado, 10);
                    
                    if (diaNum >= 1 && diaNum <= 31 && mesNum >= 1 && mesNum <= 12 && anoNum >= 2000 && anoNum <= 2100) {
                        // Criar objeto Date para validar
                        dataObj = new Date(anoNum, mesNum - 1, diaNum);
                        if (!isNaN(dataObj.getTime())) {
                            // Data válida!
                            dataValida = true;
                            diaDaSemana = diasSemana[dataObj.getDay()];
                        }
                    }
                }
                
                if (!dataValida) {
                    console.warn(`Aviso: Não foi possível corrigir a data com undefined: ${dataStr}`);
                    continue;
                }
            } else {
                // Processamento normal para datas sem 'undefined'
                const dataMatch = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (!dataMatch) {
                    console.warn(`Aviso: Formato de data inválido: ${dataStr}`);
                    continue;
                }
                
                // Extrair componentes da data
                [, diaFormatado, mesFormatado, anoFormatado] = dataMatch;
                
                // Validar componentes de data
                const diaNum = parseInt(diaFormatado, 10);
                const mesNum = parseInt(mesFormatado, 10);
                const anoNum = parseInt(anoFormatado, 10);
                
                if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 2000 || anoNum > 2100) {
                    console.warn(`Aviso: Data inválida: ${dataStr}`);
                    continue;
                }
                
                // Criar objeto Date para obter o nome do dia da semana
                dataObj = new Date(anoNum, mesNum - 1, diaNum);
                if (isNaN(dataObj.getTime())) {
                    console.warn(`Aviso: Data inválida: ${dataStr}`);
                    continue;
                }
                
                // Data é válida
                dataValida = true;
                diaDaSemana = diasSemana[dataObj.getDay()];
            }
            
            // Se chegamos aqui, temos uma data válida (seja corrigida ou não)
            // Extrair e processar horários (formato HH:MM)
            // Usar regex para extrair todos os formatos de hora válidos, mesmo com espaços indevidos
            const horariosMatches = horariosStr.match(/(\d{1,2})\s*:\s*(\d{1,2})/g);
            
            if (!horariosMatches || horariosMatches.length === 0) {
                console.warn(`Aviso: Nenhum horário válido encontrado para a data ${diaFormatado}/${mesFormatado}/${anoFormatado}`);
                continue;
            }
            
            // Normalizar os horários para o formato padrão HH:MM
            const horariosNormalizados = horariosMatches.map(horario => {
                // Extrair horas e minutos ignorando espaços
                const partes = horario.replace(/\s+/g, '').split(':');
                const horas = partes[0].padStart(2, '0');
                const minutos = partes[1].padStart(2, '0');
                return `${horas}:${minutos}`;
            });
            
            // Filtrar horários válidos
            const horariosValidos = horariosNormalizados.filter(horario => {
                const [horas, minutos] = horario.split(':').map(Number);
                return horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59;
            });
            
            if (horariosValidos.length === 0) {
                console.warn(`Aviso: Nenhum horário válido após normalização para a data ${diaFormatado}/${mesFormatado}/${anoFormatado}`);
                continue;
            }
            
            // Gerar HTML para este dia
            html += `
                <div class="card mb-2">
                    <div class="card-header bg-primary text-white">
                        <strong>${diaFormatado}/${mesFormatado}/${anoFormatado}</strong> - ${diaDaSemana}
                    </div>
                    <div class="card-body">
                        <div class="row">`;
            
            // Adicionar cada horário como um badge
            for (const horario of horariosValidos) {
                html += `
                    <div class="col-auto mb-2">
                        <span class="badge bg-info text-dark p-2">
                            <i class="far fa-clock"></i> ${horario}
                        </span>
                    </div>`;
            }
            
            html += `
                        </div>
                    </div>
                </div>`;
        }
        
        html += '</div>';
        
        // Verificar se algum dia foi processado
        if (html === '<div class="calendario-aprazamento"></div>') {
            console.error("Erro: Nenhum dia válido encontrado no aprazamento");
            return `<div class="alert alert-warning">
                      <i class="fas fa-exclamation-triangle"></i> Nenhum horário válido encontrado
                    </div>`;
        }
        
        return html;
    } catch (e) {
        console.error("Erro ao gerar calendário:", e);
        return `<div class="alert alert-danger">
                  <i class="fas fa-exclamation-triangle"></i> Erro ao processar o calendário: ${e.message}
                </div>`;
    }
}

/**
 * Gera HTML para o calendário em formato compacto
 * @param {string} textoAprazamento - Texto de aprazamento no formato padrão
 * @returns {string} HTML do calendário compacto
 */
function gerarCalendarioHTMLCompacto(textoAprazamento) {
    if (!textoAprazamento || typeof textoAprazamento !== 'string') {
        return '<div class="alert alert-warning p-1 small">Formato inválido</div>';
    }
    
    try {
        // Corrigir o formato do aprazamento para evitar problemas com undefined
        textoAprazamento = corrigirAprazamentoInvalido(textoAprazamento);
        
        // Separar o texto por datas (formato: "DD/MM/YYYY: HH:MM, HH:MM; DD/MM/YYYY: HH:MM, HH:MM")
        const secoes = textoAprazamento.split(';').map(s => s.trim()).filter(s => s);
        
        // Iniciar HTML do calendário
        let html = '<div class="cal-aprazamento-compact">';
        
        // Contador de doses
        let totalDoses = 0;
        
        // Processar cada data
        secoes.forEach(secao => {
            // Formato esperado: "DD/MM/YYYY: HH:MM, HH:MM"
            const partes = secao.split(':');
            
            if (partes.length < 2) return;
            
            const data = partes[0].trim();
            const horariosTexto = partes.slice(1).join(':').trim();
            
            // Extrair horários
            const horarios = horariosTexto.split(',').map(h => h.trim()).filter(h => h);
            
            // Incrementar contador de doses
            totalDoses += horarios.length;
            
            // Adicionar cabeçalho da data
            html += `<div class="cal-data-header">${formatarDataSimples(data)}</div>`;
            
            // Adicionar horários
            html += '<div class="cal-horarios">';
            horarios.forEach(horario => {
                html += `<span class="cal-horario">${horario}</span>`;
            });
            html += '</div>';
        });
        
        // Adicionar resumo
        html += `<div class="cal-resumo">Total: ${totalDoses} ${totalDoses === 1 ? 'dose' : 'doses'}</div>`;
        
        // Finalizar HTML
        html += '</div>';
        
        return html;
    } catch (error) {
        console.error("Erro ao gerar calendário HTML compacto:", error);
        return `<div class="alert alert-danger p-1 small">Erro ao processar: ${error.message}</div>`;
    }
} 