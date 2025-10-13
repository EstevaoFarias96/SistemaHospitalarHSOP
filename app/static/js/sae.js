// Função auxiliar para coletar valores de checkboxes com prefixo no id
function getCheckboxValues(prefix) {
    return $(`input[id^="${prefix}"]:checked`).map(function() {
        return $(this).next('label').text();
    }).get().join(', ');
}

// Função auxiliar para coletar valor de radios
function getRadioValue(name) {
    return $(`input[name="${name}"]:checked`).val() || '';
}

