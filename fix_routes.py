#!/usr/bin/env python3

# Script para remover funções duplicadas do routes.py

print("Removendo funções duplicadas...")

with open('app/routes.py', 'r') as f:
    lines = f.readlines()

print(f"Total de linhas: {len(lines)}")

# Remover linhas das funções duplicadas (aproximadamente 5089-5592)
# As linhas Python são baseadas em 0, então 5088 corresponde à linha 5089
filtered_lines = lines[:5088] + lines[5593:]

with open('app/routes.py', 'w') as f:
    f.writelines(filtered_lines)

print(f"Arquivo corrigido! Agora tem {len(filtered_lines)} linhas")
print("Funções duplicadas removidas com sucesso") 