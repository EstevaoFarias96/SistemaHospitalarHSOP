"""
Script to scout for pneumonia patients with DETAILED PROFILE ANALYSIS
Period: 01/07/2025 to 31/11/2025
CID codes: J18.9, J18, J189, J180
"""

import os
import sys
import csv
from datetime import datetime
from sqlalchemy import create_engine, or_, and_, func
from sqlalchemy.orm import sessionmaker
from collections import Counter
import re

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import Paciente, Internacao, Atendimento, Funcionario

# PRODUCTION DATABASE CONNECTION
DATABASE_URL = "postgresql://hsop_db_user:KuCEMigzHdk8JW1Ku0shmR0pRZH1t44x@dpg-d11q0pruibrs73eg3o60-a.virginia-postgres.render.com/hsop_db?sslmode=require"

print("🔌 Connecting to PRODUCTION database...")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Date range - ADJUSTED TO 2025 (real data from database)
start_date = datetime(2025, 7, 1)
end_date = datetime(2025, 11, 30, 23, 59, 59)

# CID codes for pneumonia - including all variants found in database
cid_codes = ['J18.9', 'J18', 'J189', 'J180', 'J18.1', 'J18,9', 'J18.9 ',
             'j18.9', 'j18', 'j189', 'j180', 'j18.1', 'j18,9']

def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return None
    today = datetime.now().date()
    age = today.year - birth_date.year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    return age

def extract_neighborhood(endereco):
    """Extract neighborhood/bairro from address"""
    if not endereco or endereco == "N/A":
        return "Não informado"
    # Try to extract bairro pattern
    return endereco[:50]  # First 50 chars as summary

def categorize_age(age):
    """Categorize age into groups"""
    if age is None:
        return "Não informado"
    if age < 1:
        return "Neonato (< 1 ano)"
    elif age < 5:
        return "Criança pequena (1-4 anos)"
    elif age < 12:
        return "Criança (5-11 anos)"
    elif age < 18:
        return "Adolescente (12-17 anos)"
    elif age < 40:
        return "Adulto jovem (18-39 anos)"
    elif age < 60:
        return "Adulto (40-59 anos)"
    elif age < 80:
        return "Idoso (60-79 anos)"
    else:
        return "Muito idoso (80+ anos)"

print("=" * 80)
print("DETAILED PNEUMONIA PATIENT PROFILE STUDY - PRODUCTION DATABASE")
print("=" * 80)
print(f"Period: {start_date.strftime('%d/%m/%Y')} to {end_date.strftime('%d/%m/%Y')}")
print(f"CID Codes: {', '.join(cid_codes[:4])}")
print("=" * 80)
print()

try:
    # Query for internacoes with pneumonia diagnosis
    query = session.query(
        Internacao,
        Paciente,
        Atendimento
    ).join(
        Paciente, Internacao.paciente_id == Paciente.id
    ).join(
        Atendimento, Internacao.atendimento_id == Atendimento.id
    ).filter(
        and_(
            Internacao.data_internacao >= start_date,
            Internacao.data_internacao <= end_date,
            Internacao.cid_principal.in_(cid_codes)
        )
    ).order_by(Internacao.data_internacao.desc())

    results = query.all()

    print(f"✅ Total pneumonia patients found: {len(results)}\n")

    if len(results) == 0:
        print("No patients with pneumonia found in the specified period.")
    else:
        # Prepare detailed data
        patient_data = []
        detailed_profiles = []

        for internacao, paciente, atendimento in results:
            # Get doctor info
            medico = session.query(Funcionario).filter_by(id=internacao.medico_id).first()
            medico_nome = medico.nome if medico else "N/A"

            # Calculate age
            age = calculate_age(paciente.data_nascimento)
            age_str = f"{age} anos" if age is not None else "N/A"
            age_category = categorize_age(age)

            # Extract neighborhood
            bairro_info = paciente.bairro if paciente.bairro else "Não informado"

            # Normalize gender
            sexo_normalized = paciente.sexo.upper() if paciente.sexo else "N/A"
            if sexo_normalized in ['M', 'MASCULINO']:
                sexo_normalized = 'Masculino'
            elif sexo_normalized in ['F', 'FEMININO']:
                sexo_normalized = 'Feminino'

            # Calculate stay duration
            stay_duration = None
            if internacao.data_alta and internacao.data_internacao:
                stay_duration = (internacao.data_alta - internacao.data_internacao).days

            patient_info = {
                'ID Internação': internacao.id,
                'ID Atendimento': atendimento.id,
                'ID Paciente': paciente.id,
                'Nome Paciente': paciente.nome or "Não identificado",
                'Data Nascimento': paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else "N/A",
                'Idade': age_str,
                'Idade (anos)': age if age is not None else "N/A",
                'Categoria Etária': age_category,
                'Sexo': sexo_normalized,
                'CPF': paciente.cpf or "N/A",
                'Cartão SUS': paciente.cartao_sus or "N/A",
                'Telefone': paciente.telefone or "N/A",
                'Endereço Completo': paciente.endereco or "N/A",
                'Bairro': bairro_info,
                'Município': paciente.municipio or "N/A",
                'Cor/Raça': paciente.cor or "Não informada",
                'Data Internação': internacao.data_internacao.strftime('%d/%m/%Y %H:%M') if internacao.data_internacao else "N/A",
                'Data Alta': internacao.data_alta.strftime('%d/%m/%Y %H:%M') if internacao.data_alta else "Em internação",
                'Tempo Internação (dias)': stay_duration if stay_duration is not None else "N/A",
                'CID Principal': internacao.cid_principal or "N/A",
                'CID Secundário': internacao.cid_10_secundario or "N/A",
                'Diagnóstico': internacao.diagnostico or "N/A",
                'Diagnóstico Inicial': internacao.diagnostico_inicial or "N/A",
                'Médico': medico_nome,
                'Leito': internacao.leito or "N/A",
            }
            patient_data.append(patient_info)

            # Detailed profile for analysis
            detailed_profiles.append({
                'age': age,
                'age_category': age_category,
                'gender': sexo_normalized,
                'neighborhood': bairro_info,
                'municipality': paciente.municipio or "N/A",
                'race': paciente.cor or "Não informada",
                'stay_duration': stay_duration,
                'has_phone': bool(paciente.telefone),
                'has_cpf': bool(paciente.cpf),
                'has_sus_card': bool(paciente.cartao_sus),
                'cid': internacao.cid_principal,
                'month': internacao.data_internacao.strftime('%Y-%m') if internacao.data_internacao else None
            })

        # Save detailed CSV
        output_file = f'pneumonia_patients_detailed_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        with open(output_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
            fieldnames = patient_data[0].keys()
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(patient_data)
        print(f"✓ Detailed data exported to: {output_file}\n")

        # ===== DETAILED PROFILE ANALYSIS =====
        print("\n" + "=" * 80)
        print("DETAILED PATIENT PROFILE STUDY - PNEUMONIA (CID J18.x)")
        print("=" * 80)

        print(f"\n📊 TOTAL PATIENTS ANALYZED: {len(results)}")

        # 1. DETAILED AGE ANALYSIS
        print(f"\n{'='*80}")
        print("1. DETAILED AGE ANALYSIS")
        print('='*80)

        ages = [p['age'] for p in detailed_profiles if p['age'] is not None]
        if ages:
            print(f"\n📈 Age Statistics:")
            print(f"   • Average age: {sum(ages)/len(ages):.1f} years")
            print(f"   • Median age: {sorted(ages)[len(ages)//2]:.1f} years")
            print(f"   • Min age: {min(ages)} years")
            print(f"   • Max age: {max(ages)} years")
            print(f"   • Standard deviation: {(sum((x - sum(ages)/len(ages))**2 for x in ages) / len(ages))**0.5:.1f} years")

            # Detailed age categories
            print(f"\n📊 Detailed Age Categories:")
            age_cats = Counter([p['age_category'] for p in detailed_profiles])
            for cat, count in sorted(age_cats.items(), key=lambda x: -x[1]):
                percentage = (count / len(detailed_profiles)) * 100
                print(f"   • {cat:30s}: {count:3d} ({percentage:5.1f}%)")

            # Age distribution by decade
            print(f"\n📊 Age Distribution by Decade:")
            decades = {}
            for age in ages:
                decade = (age // 10) * 10
                decade_label = f"{decade}-{decade+9} years"
                decades[decade_label] = decades.get(decade_label, 0) + 1

            for decade in sorted(decades.keys(), key=lambda x: int(x.split('-')[0])):
                count = decades[decade]
                percentage = (count / len(ages)) * 100
                bar = '█' * int(percentage / 2)
                print(f"   {decade:15s}: {count:3d} ({percentage:5.1f}%) {bar}")

        # 2. DETAILED GENDER ANALYSIS
        print(f"\n{'='*80}")
        print("2. DETAILED GENDER ANALYSIS")
        print('='*80)

        genders = [p['gender'] for p in detailed_profiles if p['gender'] != 'N/A']
        gender_counts = Counter(genders)
        print(f"\n📊 Gender Distribution:")
        for gender, count in gender_counts.items():
            percentage = (count / len(genders)) * 100
            print(f"   • {gender:15s}: {count:3d} ({percentage:5.1f}%)")

        # Gender by age category
        print(f"\n📊 Gender Distribution by Age Category:")
        for age_cat in sorted(set(p['age_category'] for p in detailed_profiles)):
            profiles_in_cat = [p for p in detailed_profiles if p['age_category'] == age_cat]
            if profiles_in_cat:
                male_count = sum(1 for p in profiles_in_cat if p['gender'] == 'Masculino')
                female_count = sum(1 for p in profiles_in_cat if p['gender'] == 'Feminino')
                total = male_count + female_count
                if total > 0:
                    print(f"\n   {age_cat}:")
                    print(f"      - Masculino: {male_count:2d} ({male_count/total*100:5.1f}%)")
                    print(f"      - Feminino:  {female_count:2d} ({female_count/total*100:5.1f}%)")

        # 3. GEOGRAPHIC ANALYSIS
        print(f"\n{'='*80}")
        print("3. DETAILED GEOGRAPHIC ANALYSIS")
        print('='*80)

        municipalities = [p['municipality'] for p in detailed_profiles if p['municipality'] != 'N/A']
        print(f"\n📍 Distribution by Municipality:")
        muni_counts = Counter(municipalities)
        for muni, count in muni_counts.most_common():
            percentage = (count / len(municipalities)) * 100
            print(f"   • {muni:30s}: {count:3d} ({percentage:5.1f}%)")

        neighborhoods = [p['neighborhood'] for p in detailed_profiles if p['neighborhood'] != 'Não informado']
        if neighborhoods:
            print(f"\n📍 Most Common Neighborhoods (Top 15):")
            neigh_counts = Counter(neighborhoods)
            for neigh, count in neigh_counts.most_common(15):
                percentage = (count / len(detailed_profiles)) * 100
                print(f"   • {neigh:40s}: {count:3d} ({percentage:5.1f}%)")

        # 4. RACE/COLOR ANALYSIS
        print(f"\n{'='*80}")
        print("4. RACE/COLOR ANALYSIS")
        print('='*80)

        races = [p['race'] for p in detailed_profiles]
        print(f"\n🎨 Distribution by Race/Color:")
        race_counts = Counter(races)
        for race, count in sorted(race_counts.items(), key=lambda x: -x[1]):
            percentage = (count / len(races)) * 100
            print(f"   • {race:30s}: {count:3d} ({percentage:5.1f}%)")

        # 5. DATA COMPLETENESS ANALYSIS
        print(f"\n{'='*80}")
        print("5. DATA COMPLETENESS ANALYSIS")
        print('='*80)

        total = len(detailed_profiles)
        has_phone = sum(1 for p in detailed_profiles if p['has_phone'])
        has_cpf = sum(1 for p in detailed_profiles if p['has_cpf'])
        has_sus = sum(1 for p in detailed_profiles if p['has_sus_card'])

        print(f"\n📋 Patient Registration Data Completeness:")
        print(f"   • Phone number:       {has_phone:3d}/{total} ({has_phone/total*100:5.1f}%)")
        print(f"   • CPF:                {has_cpf:3d}/{total} ({has_cpf/total*100:5.1f}%)")
        print(f"   • SUS Card:           {has_sus:3d}/{total} ({has_sus/total*100:5.1f}%)")

        # 6. LENGTH OF STAY DETAILED ANALYSIS
        print(f"\n{'='*80}")
        print("6. DETAILED LENGTH OF STAY ANALYSIS")
        print('='*80)

        stays = [p['stay_duration'] for p in detailed_profiles if p['stay_duration'] is not None]
        if stays:
            print(f"\n⏱️  Stay Duration Statistics:")
            print(f"   • Average stay:       {sum(stays)/len(stays):.1f} days")
            print(f"   • Median stay:        {sorted(stays)[len(stays)//2]} days")
            print(f"   • Min stay:           {min(stays)} days")
            print(f"   • Max stay:           {max(stays)} days")
            print(f"   • Total hospital days: {sum(stays)} days")

            # Stay by age category
            print(f"\n⏱️  Average Stay Duration by Age Category:")
            for age_cat in sorted(set(p['age_category'] for p in detailed_profiles)):
                cat_stays = [p['stay_duration'] for p in detailed_profiles
                           if p['age_category'] == age_cat and p['stay_duration'] is not None]
                if cat_stays:
                    avg_stay = sum(cat_stays) / len(cat_stays)
                    print(f"   • {age_cat:30s}: {avg_stay:5.1f} days (n={len(cat_stays)})")

            # Stay by gender
            print(f"\n⏱️  Average Stay Duration by Gender:")
            for gender in ['Masculino', 'Feminino']:
                gender_stays = [p['stay_duration'] for p in detailed_profiles
                              if p['gender'] == gender and p['stay_duration'] is not None]
                if gender_stays:
                    avg_stay = sum(gender_stays) / len(gender_stays)
                    print(f"   • {gender:15s}: {avg_stay:5.1f} days (n={len(gender_stays)})")

        # 7. CID CODE DISTRIBUTION
        print(f"\n{'='*80}")
        print("7. CID-10 CODE DETAILED DISTRIBUTION")
        print('='*80)

        cids = [p['cid'] for p in detailed_profiles]
        print(f"\n🏥 Distribution by CID Code:")
        cid_counts = Counter(cids)
        for cid, count in sorted(cid_counts.items(), key=lambda x: -x[1]):
            percentage = (count / len(cids)) * 100
            bar = '█' * int(percentage / 2)
            print(f"   • {cid:10s}: {count:3d} ({percentage:5.1f}%) {bar}")

        # 8. TEMPORAL PATTERNS
        print(f"\n{'='*80}")
        print("8. TEMPORAL PATTERNS")
        print('='*80)

        months = [p['month'] for p in detailed_profiles if p['month']]
        print(f"\n📅 Monthly Admission Trends:")
        month_counts = Counter(months)
        month_names = {
            '07': 'July', '08': 'August', '09': 'September',
            '10': 'October', '11': 'November'
        }
        for month in sorted(month_counts.keys()):
            count = month_counts[month]
            percentage = (count / len(months)) * 100
            month_name = month_names.get(month[-2:], month[-2:])
            bar = '█' * int(percentage / 2)
            print(f"   • {month_name:10s} {month}: {count:3d} ({percentage:5.1f}%) {bar}")

        # 9. RISK PROFILE SUMMARY
        print(f"\n{'='*80}")
        print("9. RISK PROFILE SUMMARY")
        print('='*80)

        elderly = sum(1 for p in detailed_profiles if p['age'] and p['age'] >= 60)
        pediatric = sum(1 for p in detailed_profiles if p['age'] and p['age'] < 18)
        neonates = sum(1 for p in detailed_profiles if p['age'] and p['age'] < 1)
        long_stay = sum(1 for p in detailed_profiles if p['stay_duration'] and p['stay_duration'] > 10)

        print(f"\n⚠️  High-Risk Groups:")
        print(f"   • Elderly (60+):           {elderly:3d} ({elderly/len(detailed_profiles)*100:5.1f}%)")
        print(f"   • Pediatric (<18):         {pediatric:3d} ({pediatric/len(detailed_profiles)*100:5.1f}%)")
        print(f"   • Neonates (<1 year):      {neonates:3d} ({neonates/len(detailed_profiles)*100:5.1f}%)")
        print(f"   • Prolonged stay (>10d):   {long_stay:3d} ({long_stay/len(detailed_profiles)*100:5.1f}%)")

except Exception as e:
    print(f"❌ Error occurred: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    session.close()

print("\n" + "=" * 80)
print("DETAILED ANALYSIS COMPLETED")
print("=" * 80)
