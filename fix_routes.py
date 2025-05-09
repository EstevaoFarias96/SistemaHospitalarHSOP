#!/usr/bin/env python
# Script para corrigir o arquivo routes.py, removendo imports duplicados de 're'

import re

# Ler o conteúdo do arquivo
with open('app/routes.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Remover qualquer import duplicado de re dentro de função ou em outros locais
corrected_content = re.sub(r'(\s+)import\s+re', '', content)

# Garantir que há o import correto no topo
if 'import re' not in corrected_content:
    # Adicionar após import traceback
    corrected_content = corrected_content.replace(
        'import traceback', 
        'import traceback\nimport re'
    )

# Escrever o arquivo corrigido
with open('app/routes.py', 'w', encoding='utf-8') as f:
    f.write(corrected_content)

print("Arquivo routes.py corrigido!") 