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
    document.getElementById('altaRelatorioAlta').textContent = 'Carregando informações...';
    document.getElementById('altaHistoricoInternacao').textContent = 'Carregando informações...';
    document.getElementById('altaCondutaFinal').textContent = 'Carregando informações...';
    document.getElementById('altaMedicacaoAlta').textContent = 'Carregando informações...';
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
                document.getElementById('altaNomePaciente').textContent = data.nome_paciente;
                document.getElementById('altaCpfPaciente').textContent = data.cpf_paciente;
                document.getElementById('altaDataAlta').textContent = data.data_alta;
                
                // Preencher informações de alta
                document.getElementById('altaDiagnosticoAlta').textContent = data.diagnostico_alta;
                document.getElementById('altaRelatorioAlta').textContent = data.relatorio_alta;
                document.getElementById('altaHistoricoInternacao').textContent = data.historico_internacao;
                document.getElementById('altaCondutaFinal').textContent = data.conduta_final;
                document.getElementById('altaMedicacaoAlta').textContent = data.medicacao_alta;
                document.getElementById('altaCuidadosGerais').textContent = data.cuidados_gerais;
            } else {
                // Mostrar erro
                alert('Erro ao carregar informações de alta: ' + (data.message || 'Erro desconhecido'));
                modal.hide();
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            alert('Erro ao carregar informações de alta: ' + error.message);
            modal.hide();
        });
}

function imprimirInformacoesAlta() {
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    
    // Obter dados do modal
    const nomePaciente = document.getElementById('altaNomePaciente').textContent;
    const cpfPaciente = document.getElementById('altaCpfPaciente').textContent;
    const dataAlta = document.getElementById('altaDataAlta').textContent;
    const diagnosticoAlta = document.getElementById('altaDiagnosticoAlta').textContent;
    const relatorioAlta = document.getElementById('altaRelatorioAlta').textContent;
    const historicoInternacao = document.getElementById('altaHistoricoInternacao').textContent;
    const condutaFinal = document.getElementById('altaCondutaFinal').textContent;
    const medicacaoAlta = document.getElementById('altaMedicacaoAlta').textContent;
    const cuidadosGerais = document.getElementById('altaCuidadosGerais').textContent;
    
    // HTML para impressão
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Informações de Alta - ${nomePaciente}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px; }
                .patient-info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .section h3 { color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .section p { margin: 10px 0; text-align: justify; line-height: 1.5; }
                .date-alta { color: #28a745; font-weight: bold; font-size: 1.1em; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>INFORMAÇÕES DE ALTA HOSPITALAR</h1>
                <p>Relatório completo das informações de alta do paciente</p>
            </div>
            
            <div class="patient-info">
                <h2>Dados do Paciente</h2>
                <p><strong>Nome:</strong> ${nomePaciente}</p>
                <p><strong>CPF:</strong> ${cpfPaciente}</p>
                <p><strong>Data de Alta:</strong> <span class="date-alta">${dataAlta}</span></p>
            </div>
            
            <div class="section">
                <h3>Diagnóstico de Alta</h3>
                <p>${diagnosticoAlta}</p>
            </div>
            
            <div class="section">
                <h3>Relatório de Alta</h3>
                <p>${relatorioAlta}</p>
            </div>
            
            <div class="section">
                <h3>Histórico da Internação</h3>
                <p>${historicoInternacao}</p>
            </div>
            
            <div class="section">
                <h3>Conduta Final</h3>
                <p>${condutaFinal}</p>
            </div>
            
            <div class="section">
                <h3>Medicação de Alta</h3>
                <p>${medicacaoAlta}</p>
            </div>
            
            <div class="section">
                <h3>Cuidados Gerais</h3>
                <p>${cuidadosGerais}</p>
            </div>
            
            <div style="margin-top: 50px; text-align: center; font-size: 0.9em; color: #666;">
                <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
} 