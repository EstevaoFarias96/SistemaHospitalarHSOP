/**
 * Script para gerenciar evoluções médicas
 */

/**
 * Carrega as evoluções da internação e exibe no DOM
 */
function carregarEvolucoes() {
    console.log('Carregando evoluções para internacaoId:', window.internacaoId);
    
    if (!window.internacaoId || isNaN(window.internacaoId)) {
        console.error('ID de internação inválido ao carregar evoluções:', window.internacaoId);
        $('#listaEvolucoes').html('<tr><td colspan="3" class="text-center text-danger">Erro: ID de internação inválido</td></tr>');
        return;
    }
    
    $.ajax({
        url: `/api/evolucoes/${window.internacaoId}`,
        method: 'GET',
        success: function(response) {
            console.log('Resposta da API de evoluções:', response);
            const tabela = $('#listaEvolucoes');
            tabela.empty();
            
            if (response.success && response.evolucoes && response.evolucoes.length > 0) {
                response.evolucoes.forEach(ev => {
                    const evolucaoHtml = ev.evolucao || '---';
                    
                    // Criar um container para a evolução com estilo seguro
                    tabela.append(`
                        <tr>
                            <td>${ev.data_evolucao || '---'}</td>
                            <td>${ev.nome_medico || '---'}</td>
                            <td>
                                <div class="texto-evolucao">
                                    ${evolucaoHtml}
                                </div>
                            </td>
                        </tr>
                    `);
                });
                
                // Calcular o número de linhas e aplicar o atributo data-lines
                setTimeout(() => {
                    $('.texto-evolucao').each(function() {
                        const texto = $(this).text();
                        const linhas = texto.split(/\r\n|\r|\n/).length;
                        const palavras = texto.split(/\s+/).length;
                        
                        // Estimar o número de linhas com base no tamanho do texto
                        let estimativaLinhas = Math.max(linhas, Math.ceil(palavras / 15));
                        
                        // Limitar a no máximo 22 para não criar muitas regras CSS
                        estimativaLinhas = Math.min(estimativaLinhas, 22);
                        
                        // Aplicar o atributo data-lines ao elemento
                        $(this).attr('data-lines', estimativaLinhas);
                        
                        console.log(`Evolução com ${linhas} linhas e ${palavras} palavras. Estimativa: ${estimativaLinhas}`);
                    });
                }, 100);
            } else {
                tabela.html('<tr><td colspan="3" class="text-center">Nenhuma evolução registrada até o momento.</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Erro ao carregar evoluções:', xhr.responseText, status, error);
            $('#listaEvolucoes').html('<tr><td colspan="3" class="text-center text-danger">Erro ao carregar evoluções.</td></tr>');
        }
    });
} 