// Manipuladores para visualização de aprazamentos
$(document).ready(function() {
    console.log("Carregando manipuladores para visualização de aprazamentos");

    // Handler para visualizar aprazamentos individuais quando clica no ícone do calendário
    $(document).on('click', '.btn-visualizar-aprazamento', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const aprazamentoTexto = $(this).data('aprazamento');
        const medicamentoNome = $(this).data('medicamento');
        
        console.log("Visualizando aprazamentos do medicamento:", medicamentoNome);
        
        $("#modalVisualizarAprazamentoLabel").text(`Aprazamentos: ${medicamentoNome}`);
        
        // Inicializar o modal de calendário de aprazamento
        if (typeof inicializarModalCalendarioAprazamento === 'function') {
            inicializarModalCalendarioAprazamento(aprazamentoTexto, `Aprazamentos: ${medicamentoNome}`);
        } else {
            $("#aprazamento-container-dinamico").html(`
                <div class="alert alert-info">
                    <h6 class="mb-2">Aprazamento do medicamento: ${medicamentoNome}</h6>
                    <pre class="mb-0">${aprazamentoTexto || 'Sem aprazamento definido'}</pre>
                </div>
            `);
            $("#modalVisualizarAprazamento").modal('show');
        }
    });
});