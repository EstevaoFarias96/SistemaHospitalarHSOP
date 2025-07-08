#!/usr/bin/env python3
"""
Script para popular o banco de dados com prescrições padrão de enfermagem
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import PrescricaoEnfermagemTemplate

def criar_prescricoes_padrao():
    """Cria prescrições padrão de enfermagem no banco de dados"""
    
    prescricoes_padrao = [
        {
            'titulo': 'Admissão do Paciente',
            'texto_prescricao': '''• Realizar entrevista de admissão
• Verificar sinais vitais a cada 6 horas
• Avaliar nível de consciência
• Verificar alergias e medicamentos em uso
• Orientar sobre rotinas da unidade
• Avaliar risco de quedas
• Implementar medidas de segurança conforme protocolo''',
            'nic': '7310',
            'nic_tipo': 'Admissão do paciente'
        },
        {
            'titulo': 'Controle de Sinais Vitais',
            'texto_prescricao': '''• Verificar sinais vitais (PA, FC, FR, T°, SatO2) conforme prescrição
• Registrar alterações significativas
• Comunicar alterações ao enfermeiro responsável
• Monitorar padrão respiratório
• Avaliar perfusão periférica''',
            'nic': '6680',
            'nic_tipo': 'Monitorização de sinais vitais'
        },
        {
            'titulo': 'Cuidados com Higiene',
            'texto_prescricao': '''• Realizar higiene corporal conforme necessidade
• Higiene oral 2x ao dia
• Trocar roupas de cama diariamente
• Manter ambiente limpo e organizado
• Cuidados com unhas e cabelos
• Aplicar hidratante corporal se necessário''',
            'nic': '1801',
            'nic_tipo': 'Assistência no autocuidado: banho/higiene'
        },
        {
            'titulo': 'Controle de Dor',
            'texto_prescricao': '''• Avaliar dor através de escala numérica
• Administrar analgésicos conforme prescrição médica
• Implementar medidas de conforto não farmacológicas
• Posicionar paciente adequadamente
• Orientar sobre técnicas de relaxamento
• Reavaliar eficácia das medidas implementadas''',
            'nic': '1400',
            'nic_tipo': 'Controle da dor'
        },
        {
            'titulo': 'Prevenção de Quedas',
            'texto_prescricao': '''• Manter grades do leito elevadas
• Orientar paciente sobre riscos de quedas
• Manter ambiente livre de obstáculos
• Auxiliar na deambulação se necessário
• Utilizar calçados antiderrapantes
• Manter campainha ao alcance do paciente
• Implementar protocolo de prevenção de quedas''',
            'nic': '6490',
            'nic_tipo': 'Prevenção de quedas'
        },
        {
            'titulo': 'Cuidados com Feridas',
            'texto_prescricao': '''• Avaliar ferida quanto a características, tamanho e evolução
• Realizar curativo conforme técnica asséptica
• Administrar medicamentos tópicos conforme prescrição
• Orientar sobre cuidados domiciliares
• Registrar evolução da ferida
• Comunicar alterações ao enfermeiro''',
            'nic': '3660',
            'nic_tipo': 'Cuidados com lesões'
        },
        {
            'titulo': 'Controle de Infecção',
            'texto_prescricao': '''• Realizar higienização das mãos antes e após procedimentos
• Utilizar equipamentos de proteção individual
• Manter técnica asséptica em procedimentos
• Isolar paciente conforme protocolo quando necessário
• Orientar familiares sobre medidas preventivas
• Descartar materiais perfurocortantes adequadamente''',
            'nic': '6540',
            'nic_tipo': 'Controle de infecção'
        },
        {
            'titulo': 'Alimentação e Hidratação',
            'texto_prescricao': '''• Auxiliar na alimentação conforme necessidade
• Oferecer dieta conforme prescrição médica
• Estimular ingesta hídrica adequada
• Monitorar aceitação alimentar
• Orientar sobre importância da dieta
• Registrar volume de líquidos ingeridos''',
            'nic': '1803',
            'nic_tipo': 'Assistência no autocuidado: alimentação'
        },
        {
            'titulo': 'Mobilização no Leito',
            'texto_prescricao': '''• Realizar mudança de decúbito a cada 2 horas
• Estimular movimentação ativa quando possível
• Realizar exercícios passivos conforme necessário
• Utilizar dispositivos de alívio de pressão
• Manter alinhamento corporal adequado
• Orientar sobre importância da mobilização''',
            'nic': '0840',
            'nic_tipo': 'Posicionamento'
        },
        {
            'titulo': 'Controle de Eliminações',
            'texto_prescricao': '''• Monitorar padrão de eliminação intestinal e urinária
• Auxiliar com higiene íntima após eliminações
• Registrar características das eliminações
• Orientar sobre hábitos intestinais saudáveis
• Comunicar alterações significativas
• Manter privacidade durante procedimentos''',
            'nic': '0430',
            'nic_tipo': 'Controle intestinal'
        },
        {
            'titulo': 'Preparo para Exames',
            'texto_prescricao': '''• Orientar paciente sobre procedimento a ser realizado
• Verificar preparo necessário conforme protocolo
• Administrar medicações pré-exame se prescritas
• Acompanhar paciente ao local do exame
• Registrar procedimentos realizados
• Monitorar paciente pós-exame''',
            'nic': '7680',
            'nic_tipo': 'Assistência em exames'
        },
        {
            'titulo': 'Orientação para Alta',
            'texto_prescricao': '''• Orientar sobre medicações de uso domiciliar
• Explicar cuidados necessários em casa
• Agendar retorno ambulatorial
• Entregar documentos de alta
• Orientar sobre sinais de alerta
• Fornecer contatos para dúvidas
• Verificar compreensão das orientações''',
            'nic': '7370',
            'nic_tipo': 'Planejamento da alta'
        },
        {
            'titulo': 'Controle de Glicemia',
            'texto_prescricao': '''• Verificar glicemia capilar conforme horários prescritos
• Registrar valores obtidos
• Comunicar alterações significativas
• Orientar sobre sinais de hipo/hiperglicemia
• Auxiliar na aplicação de insulina se necessário
• Monitorar locais de punção''',
            'nic': '2120',
            'nic_tipo': 'Controle da hiperglicemia'
        },
        {
            'titulo': 'Suporte Emocional',
            'texto_prescricao': '''• Oferecer apoio emocional ao paciente e família
• Escutar ativamente preocupações
• Estimular verbalização de sentimentos
• Orientar sobre recursos de apoio disponíveis
• Respeitar crenças e valores do paciente
• Promover ambiente acolhedor''',
            'nic': '5270',
            'nic_tipo': 'Suporte emocional'
        },
        {
            'titulo': 'Controle de Dispositivos',
            'texto_prescricao': '''• Verificar permeabilidade de cateteres e drenos
• Manter fixação adequada de dispositivos
• Registrar características de drenagens
• Realizar troca de equipos conforme protocolo
• Monitorar sinais de complicações
• Orientar paciente sobre cuidados com dispositivos''',
            'nic': '1870',
            'nic_tipo': 'Cuidados com drenos'
        }
    ]
    
    app = create_app()
    with app.app_context():
        print("Criando prescrições padrão de enfermagem...")
        
        # Verificar se já existem prescrições padrão
        count_existing = PrescricaoEnfermagemTemplate.query.filter_by(padrao=True).count()
        print(f"Prescrições padrão existentes: {count_existing}")
        
        created_count = 0
        updated_count = 0
        
        for prescricao_data in prescricoes_padrao:
            # Verificar se já existe uma prescrição com o mesmo título
            existing = PrescricaoEnfermagemTemplate.query.filter_by(
                titulo=prescricao_data['titulo'],
                padrao=True
            ).first()
            
            if existing:
                # Atualizar se já existe
                existing.texto_prescricao = prescricao_data['texto_prescricao']
                existing.nic = prescricao_data['nic']
                existing.nic_tipo = prescricao_data['nic_tipo']
                updated_count += 1
                print(f"Atualizada: {prescricao_data['titulo']}")
            else:
                # Criar nova prescrição
                nova_prescricao = PrescricaoEnfermagemTemplate(
                    padrao=True,
                    titulo=prescricao_data['titulo'],
                    texto_prescricao=prescricao_data['texto_prescricao'],
                    nic=prescricao_data['nic'],
                    nic_tipo=prescricao_data['nic_tipo']
                )
                db.session.add(nova_prescricao)
                created_count += 1
                print(f"Criada: {prescricao_data['titulo']}")
        
        try:
            db.session.commit()
            print(f"\n✅ Processo concluído!")
            print(f"📝 Prescrições criadas: {created_count}")
            print(f"🔄 Prescrições atualizadas: {updated_count}")
            print(f"📊 Total de prescrições padrão no banco: {PrescricaoEnfermagemTemplate.query.filter_by(padrao=True).count()}")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Erro ao salvar no banco de dados: {e}")
            return False
        
        return True

if __name__ == "__main__":
    print("🏥 Populando banco de dados com prescrições padrão de enfermagem...")
    print("=" * 60)
    
    if criar_prescricoes_padrao():
        print("\n🎉 Prescrições padrão criadas com sucesso!")
        print("\n📋 Agora você pode:")
        print("   • Acessar o modal de prescrição de enfermagem")
        print("   • Buscar prescrições padrão na lateral esquerda")
        print("   • Filtrar por categoria NIC")
        print("   • Adicionar templates ao texto da prescrição")
    else:
        print("\n❌ Falha ao criar prescrições padrão!")
        sys.exit(1)
