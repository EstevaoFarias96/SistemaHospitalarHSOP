#!/usr/bin/env python3
"""
Script para verificar as datas dos atendimentos disponíveis
"""

import os
import sys
from datetime import datetime
from collections import Counter

# Adiciona o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import Atendimento

def verificar_datas():
    """Verifica as datas disponíveis nos atendimentos"""
    print("=" * 50)
    print("VERIFICAÇÃO DE DATAS DOS ATENDIMENTOS")
    print("=" * 50)
    
    atendimentos = Atendimento.query.all()
    
    if not atendimentos:
        print("Nenhum atendimento encontrado.")
        return
    
    print(f"Total de atendimentos: {len(atendimentos)}")
    print()
    
    anos = []
    meses_anos = []
    
    for atendimento in atendimentos:
        if atendimento.data_atendimento:
            ano = atendimento.data_atendimento.year
            mes = atendimento.data_atendimento.month
            anos.append(ano)
            meses_anos.append(f"{mes:02d}/{ano}")
    
    if anos:
        contador_anos = Counter(anos)
        contador_meses = Counter(meses_anos)
        
        print("DISTRIBUIÇÃO POR ANO:")
        for ano in sorted(contador_anos.keys()):
            print(f"  {ano}: {contador_anos[ano]} atendimentos")
        
        print("\nDISTRIBUIÇÃO POR MÊS/ANO:")
        for mes_ano in sorted(contador_meses.keys()):
            print(f"  {mes_ano}: {contador_meses[mes_ano]} atendimentos")
        
        # Verificar setembro especificamente
        setembro_2024 = contador_meses.get("09/2024", 0)
        setembro_2025 = contador_meses.get("09/2025", 0)
        
        print(f"\nSETEMBRO 2024: {setembro_2024} atendimentos")
        print(f"SETEMBRO 2025: {setembro_2025} atendimentos")
        
        # Mostrar os primeiros 5 atendimentos para debug
        print("\nPRIMEIROS 5 ATENDIMENTOS (para debug):")
        for i, atendimento in enumerate(atendimentos[:5]):
            print(f"  {i+1}. ID: {atendimento.id}, Data: {atendimento.data_atendimento}, Hora: {atendimento.hora_atendimento}")

def main():
    app = create_app()
    with app.app_context():
        verificar_datas()

if __name__ == "__main__":
    main()