// Funções para Informações de Alta
function verInformacoesAlta(atendimentoId) {
    // Mostrar loading
    const modal = new bootstrap.Modal(document.getElementById('modalInformacoesAlta'));
    modal.show();
    
    // Limpar dados anteriores e mostrar loading
    document.getElementById('altaNomePaciente').textContent = 'Carregando...';
    document.getElementById('altaCpfPaciente').textContent = '';
    document.getElementById('altaDataAlta').textContent = '';
    document.getElementById('altaDiagnosticoAlta').textContent = 'Carregando informações...';
    document.getElementById('altaHistoricoInternacao').textContent = 'Carregando informações...';
    document.getElementById('altaCuidadosGerais').textContent = 'Carregando informações...';
    
    // Buscar dados de alta
    fetch(`/api/internacao/${atendimentoId}/alta`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Preencher dados do paciente
                document.getElementById('altaNomePaciente').textContent = data.nome_paciente || 'Não informado';
                document.getElementById('altaCpfPaciente').textContent = data.cpf_paciente || 'Não informado';
                document.getElementById('altaDataAlta').textContent = data.data_alta || 'Não informado';
                
                // Preencher informações de alta (apenas os 3 campos simplificados)
                document.getElementById('altaDiagnosticoAlta').textContent = data.diagnostico || 'Não informado';
                document.getElementById('altaHistoricoInternacao').textContent = data.historico_internacao || 'Não informado';
                document.getElementById('altaCuidadosGerais').textContent = data.cuidados_gerais || 'Não informado';
            } else {
                // Mostrar erro
                alert('Erro ao carregar informações de alta: ' + (data.message || 'Erro desconhecido'));
                modal.hide();
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            alert('Erro ao carregar informações de alta. Verifique se o paciente possui dados de alta registrados.');
            modal.hide();
        });
}

function imprimirInformacoesAlta() {
    // Verificar se há dados carregados
    const nomePaciente = document.getElementById('altaNomePaciente').textContent;
    if (!nomePaciente || nomePaciente === 'Carregando...') {
        alert('Aguarde o carregamento completo das informações antes de imprimir.');
        return;
    }

    // Obter dados do modal (apenas os 3 campos simplificados)
    const cpfPaciente = document.getElementById('altaCpfPaciente').textContent;
    const dataAlta = document.getElementById('altaDataAlta').textContent;
    const diagnosticoAlta = document.getElementById('altaDiagnosticoAlta').textContent;
    const historicoInternacao = document.getElementById('altaHistoricoInternacao').textContent;
    const cuidadosGerais = document.getElementById('altaCuidadosGerais').textContent;
    
    // Função para tratar conteúdo vazio
    const tratarConteudo = (texto) => {
        return texto && texto.trim() !== '' && texto !== 'Não informado' ? texto : 'Não informado';
    };

    // Criar nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // HTML otimizado para impressão A4 - layout simplificado para 3 campos
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Alta - ${nomePaciente}</title>
            
            <!-- Font Awesome para ícones -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            
            <style>
                /* Reset e configurações básicas */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                /* Configuração para impressão A4 vertical - margens reduzidas */
                @page {
                    size: A4;
                    margin: 0.8cm 1.2cm;
                }

                body {
                    font-family: Arial, sans-serif;
                    font-size: 10pt;
                    line-height: 1.3;
                    color: #333;
                    background: white;
                }

                /* Cabeçalho - compacto */
                .header {
                    text-align: center;
                    border-bottom: 2px solid #4a90e2;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }

                .hospital-name {
                    font-size: 16pt;
                    font-weight: bold;
                    color: #4a90e2;
                    margin-bottom: 3px;
                }

                .relatorio-title {
                    font-size: 13pt;
                    font-weight: bold;
                    color: #333;
                    margin-top: 3px;
                }

                /* Dados do paciente */
                .patient-info {
                    background: #f0f6ff;
                    border: 1px solid #b8d4f0;
                    border-radius: 5px;
                    padding: 10px;
                    margin-bottom: 20px;
                }

                .patient-info h3 {
                    color: #4a90e2;
                    font-size: 11pt;
                    margin-bottom: 6px;
                    border-bottom: 1px solid #b8d4f0;
                    padding-bottom: 3px;
                }

                .patient-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    font-size: 9pt;
                }

                .patient-field {
                    display: flex;
                    align-items: center;
                }

                .patient-label {
                    font-weight: bold;
                    color: #4a90e2;
                    min-width: 80px;
                    margin-right: 6px;
                    font-size: 8pt;
                }

                .patient-value {
                    color: #333;
                    flex: 1;
                    font-size: 9pt;
                }

                .data-alta-destaque {
                    color: #4a90e2;
                    font-weight: bold;
                    font-size: 10pt;
                }

                /* Seções de informações - layout simplificado para 3 campos */
                .sections-container {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .info-section {
                    border: 1px solid #b8d4f0;
                    border-radius: 5px;
                    overflow: hidden;
                    page-break-inside: avoid;
                    background: white;
                }

                .section-header {
                    background: #e6f1ff;
                    color: #4a90e2;
                    padding: 8px 12px;
                    font-weight: bold;
                    font-size: 11pt;
                    border-bottom: 1px solid #b8d4f0;
                    display: flex;
                    align-items: center;
                }

                .section-header i {
                    margin-right: 6px;
                    font-size: 10pt;
                }

                .section-content {
                    padding: 12px 15px;
                    background: white;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    font-size: 9pt;
                    line-height: 1.4;
                    min-height: 60px;
                }

                .section-content.large {
                    min-height: 120px;
                }

                /* Assinatura médica */
                .assinatura-area {
                    margin-top: 25px;
                    text-align: center;
                    font-size: 10pt;
                    page-break-inside: avoid;
                }

                .linha-assinatura {
                    width: 300px;
                    border-top: 1px solid #4a90e2;
                    margin: 15px auto 6px auto;
                }

                .texto-assinatura {
                    font-weight: bold;
                    color: #4a90e2;
                }

                /* Footer */
                .footer {
                    margin-top: 15px;
                    text-align: center;
                    font-size: 8pt;
                    color: #666;
                    border-top: 1px solid #b8d4f0;
                    padding-top: 6px;
                    page-break-inside: avoid;
                }

                /* Impressão */
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .info-section {
                        page-break-inside: avoid;
                    }
                }

                /* Botão de impressão */
                .print-button {
                    position: fixed;
                    top: 15px;
                    right: 15px;
                    background: #4a90e2;
                    color: white;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 11pt;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    z-index: 1000;
                }

                .print-button:hover {
                    background: #357abd;
                }
            </style>
        </head>
        <body>
            <!-- Botão de impressão -->
            <button class="print-button no-print" onclick="window.print()">
                <i class="fas fa-print"></i> Imprimir
            </button>

            <!-- Cabeçalho -->
            <div class="header">
                <div class="hospital-name">HOSPITAL SENADOR OZIRES PONTES</div>
                <div class="relatorio-title">RELATÓRIO DE ALTA HOSPITALAR</div>
            </div>

            <!-- Dados do Paciente -->
            <div class="patient-info">
                <h3><i class="fas fa-user"></i> Informações do Paciente</h3>
                <div class="patient-grid">
                    <div class="patient-field">
                        <span class="patient-label">Nome:</span>
                        <span class="patient-value">${nomePaciente}</span>
                    </div>
                    <div class="patient-field">
                        <span class="patient-label">CPF:</span>
                        <span class="patient-value">${cpfPaciente}</span>
                    </div>
                    <div class="patient-field">
                        <span class="patient-label">Data de Alta:</span>
                        <span class="patient-value data-alta-destaque">${dataAlta}</span>
                    </div>
                </div>
            </div>

            <!-- Container das seções -->
            <div class="sections-container">
                <!-- Diagnóstico Final -->
                <div class="info-section">
                    <div class="section-header">
                        <i class="fas fa-stethoscope"></i>
                        DIAGNÓSTICO FINAL
                    </div>
                    <div class="section-content">${tratarConteudo(diagnosticoAlta)}</div>
                </div>

                <!-- Histórico da Internação -->
                <div class="info-section">
                    <div class="section-header">
                        <i class="fas fa-history"></i>
                        HISTÓRICO DA INTERNAÇÃO
                    </div>
                    <div class="section-content large">${tratarConteudo(historicoInternacao)}</div>
                </div>

                <!-- Cuidados Gerais -->
                <div class="info-section">
                    <div class="section-header">
                        <i class="fas fa-heart"></i>
                        CUIDADOS GERAIS
                    </div>
                    <div class="section-content">${tratarConteudo(cuidadosGerais)}</div>
                </div>
            </div>

            <!-- Área de Assinatura -->
            <div class="assinatura-area">
                <div class="linha-assinatura"></div>
                <div class="texto-assinatura">Assinatura do Médico Responsável</div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>Documento gerado em:</strong> ${new Date().toLocaleString('pt-BR')} | <strong>HSOP - Sistema Hospitalar</strong></p>
                <p>RUA CRUZEIRO, S/N - COHAB, Massapê - CE, 62140-000</p>
            </div>

            <script>
                // Auto-impressão e fechamento
                window.onload = function() {
                    // Auto-focus para facilitar impressão via Ctrl+P
                    document.body.focus();
                    
                    // Auto-imprimir após um pequeno delay
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
                
                // Fechar janela após impressão
                window.onafterprint = function() {
                    window.close();
                };
            </script>
        </body>
        </html>
    `;
    
    // Escrever conteúdo na janela de impressão
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Focar na janela de impressão
    printWindow.focus();
} 