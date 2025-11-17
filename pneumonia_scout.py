"""
Script to scout for pneumonia patients in the database
Period: 01/07/2025 to 31/11/2025
CID codes: J18.9, J18, J189, J180
"""

import os
import sys
import csv
from datetime import datetime
from sqlalchemy import create_engine, or_, and_
from sqlalchemy.orm import sessionmaker
from collections import Counter

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import Paciente, Internacao, Atendimento, Funcionario
from app.config import Config

# Allow command line argument to specify database
import argparse
parser = argparse.ArgumentParser(description='Scout for pneumonia patients')
parser.add_argument('--db', choices=['dev', 'prod'], default='prod',
                    help='Database to use: dev (local PostgreSQL) or prod (DATABASE_URL env var)')
args = parser.parse_args()

# Database connection
if args.db == 'dev':
    # Force development database
    db_uri = 'postgresql://hsop:Estv,123@localhost:5432/hospital_db'
    print(f"⚙️  Using DEVELOPMENT database (localhost)")
else:
    db_uri = Config.SQLALCHEMY_DATABASE_URI
    print(f"⚙️  Using database from Config")

engine = create_engine(db_uri)
Session = sessionmaker(bind=engine)
session = Session()

# Date range
start_date = datetime(2025, 7, 1)
end_date = datetime(2025, 11, 30, 23, 59, 59)

# CID codes for pneumonia
cid_codes = ['J18.9', 'J18', 'J189', 'J180', 'j18.9', 'j18', 'j189', 'j180']

def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return "N/A"
    today = datetime.now().date()
    age = today.year - birth_date.year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    return f"{age} anos"

print("=" * 80)
print("SCOUTING FOR PNEUMONIA PATIENTS")
print("=" * 80)
print(f"Period: {start_date.strftime('%d/%m/%Y')} to {end_date.strftime('%d/%m/%Y')}")
print(f"CID Codes: {', '.join(cid_codes[:4])}")
print("=" * 80)
print()

try:
    # Query for internacoes with pneumonia diagnosis in CID_PRINCIPAL only
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
            # Search ONLY in CID principal field
            Internacao.cid_principal.in_(cid_codes)
        )
    ).order_by(Internacao.data_internacao.desc())

    results = query.all()

    print(f"Total patients found: {len(results)}\n")

    if len(results) == 0:
        print("No patients with pneumonia found in the specified period.")
    else:
        # Prepare data for display
        patient_data = []

        for internacao, paciente, atendimento in results:
            # Get doctor info if available
            medico = session.query(Funcionario).filter_by(id=internacao.medico_id).first()
            medico_nome = medico.nome if medico else "N/A"

            # Calculate age
            idade = "N/A"
            if paciente.data_nascimento:
                today = datetime.now().date()
                age = today.year - paciente.data_nascimento.year
                if today.month < paciente.data_nascimento.month or (today.month == paciente.data_nascimento.month and today.day < paciente.data_nascimento.day):
                    age -= 1
                idade = f"{age} anos"

            patient_info = {
                'ID Internação': internacao.id,
                'ID Atendimento': atendimento.id,
                'ID Paciente': paciente.id,
                'Nome Paciente': paciente.nome or "Não identificado",
                'Data Nascimento': paciente.data_nascimento.strftime('%d/%m/%Y') if paciente.data_nascimento else "N/A",
                'Idade': idade,
                'Sexo': paciente.sexo or "N/A",
                'Cartão SUS': paciente.cartao_sus or "N/A",
                'CPF': paciente.cpf or "N/A",
                'Data Internação': internacao.data_internacao.strftime('%d/%m/%Y %H:%M') if internacao.data_internacao else "N/A",
                'Data Alta': internacao.data_alta.strftime('%d/%m/%Y %H:%M') if internacao.data_alta else "Em internação",
                'CID Principal': internacao.cid_principal or "N/A",
                'CID Secundário': internacao.cid_10_secundario or "N/A",
                'Diagnóstico': (internacao.diagnostico[:100] + "...") if internacao.diagnostico and len(internacao.diagnostico) > 100 else (internacao.diagnostico or "N/A"),
                'Diagnóstico Inicial': (internacao.diagnostico_inicial[:100] + "...") if internacao.diagnostico_inicial and len(internacao.diagnostico_inicial) > 100 else (internacao.diagnostico_inicial or "N/A"),
                'Médico': medico_nome,
                'Leito': internacao.leito or "N/A",
                'Município': paciente.municipio or "N/A",
                'Telefone': paciente.telefone or "N/A"
            }
            patient_data.append(patient_info)

        # Save to CSV
        output_file = f'pneumonia_patients_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        if patient_data:
            with open(output_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
                fieldnames = patient_data[0].keys()
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(patient_data)
            print(f"✓ Data exported to: {output_file}\n")

        # Display summary
        print("=" * 80)
        print("PATIENT SUMMARY")
        print("=" * 80)

        for i, patient in enumerate(patient_data, 1):
            print(f"\n[{i}] Patient: {patient['Nome Paciente']}")
            print(f"    ID: {patient['ID Paciente']} | Internação: {patient['ID Internação']} | Atendimento: {patient['ID Atendimento']}")
            print(f"    Age: {patient['Idade']} | Sex: {patient['Sexo']}")
            print(f"    Admission: {patient['Data Internação']}")
            print(f"    Discharge: {patient['Data Alta']}")
            print(f"    CID Principal: {patient['CID Principal']}")
            print(f"    Diagnosis: {patient['Diagnóstico'][:150]}")
            print(f"    Doctor: {patient['Médico']}")
            print(f"    Bed: {patient['Leito']}")
            print("-" * 80)

        # ===== PATIENT PROFILE STUDY =====
        print("\n" + "=" * 80)
        print("PATIENT PROFILE STUDY - PNEUMONIA (CID J18.x)")
        print("=" * 80)

        print(f"\n📊 TOTAL PATIENTS: {len(results)}")

        # 1. Gender distribution
        print(f"\n{'='*60}")
        print("1. GENDER DISTRIBUTION")
        print('='*60)
        genders = [p['Sexo'] for p in patient_data]
        gender_counts = Counter(genders)
        for gender, count in gender_counts.items():
            percentage = (count / len(patient_data)) * 100
            print(f"   {gender}: {count} ({percentage:.1f}%)")

        # 2. Age distribution
        print(f"\n{'='*60}")
        print("2. AGE DISTRIBUTION")
        print('='*60)
        ages = []
        for p in patient_data:
            if p['Idade'] != "N/A":
                age_str = p['Idade'].replace(' anos', '')
                try:
                    ages.append(int(age_str))
                except:
                    pass

        if ages:
            print(f"   Average age: {sum(ages)/len(ages):.1f} years")
            print(f"   Min age: {min(ages)} years")
            print(f"   Max age: {max(ages)} years")

            # Age groups
            age_groups = {
                '0-17 (Pediatric)': 0,
                '18-39 (Young Adult)': 0,
                '40-59 (Adult)': 0,
                '60+ (Elderly)': 0
            }
            for age in ages:
                if age < 18:
                    age_groups['0-17 (Pediatric)'] += 1
                elif age < 40:
                    age_groups['18-39 (Young Adult)'] += 1
                elif age < 60:
                    age_groups['40-59 (Adult)'] += 1
                else:
                    age_groups['60+ (Elderly)'] += 1

            print(f"\n   Age Group Distribution:")
            for group, count in age_groups.items():
                if count > 0:
                    percentage = (count / len(ages)) * 100
                    print(f"   - {group}: {count} ({percentage:.1f}%)")

        # 3. CID distribution
        print(f"\n{'='*60}")
        print("3. CID-10 CODE DISTRIBUTION")
        print('='*60)
        cids = [p['CID Principal'] for p in patient_data]
        cid_counts = Counter(cids)
        for cid, count in cid_counts.items():
            percentage = (count / len(patient_data)) * 100
            print(f"   {cid}: {count} cases ({percentage:.1f}%)")

        # 4. Geographic distribution
        print(f"\n{'='*60}")
        print("4. GEOGRAPHIC DISTRIBUTION (by Municipality)")
        print('='*60)
        municipios = [p['Município'] for p in patient_data if p['Município'] != 'N/A']
        if municipios:
            municipio_counts = Counter(municipios)
            for municipio, count in municipio_counts.most_common():
                percentage = (count / len(patient_data)) * 100
                print(f"   {municipio}: {count} ({percentage:.1f}%)")
        else:
            print("   No municipality data available")

        # 5. Hospitalization status
        print(f"\n{'='*60}")
        print("5. HOSPITALIZATION STATUS")
        print('='*60)
        still_hospitalized = sum(1 for p in patient_data if p['Data Alta'] == 'Em internação')
        discharged = len(patient_data) - still_hospitalized
        print(f"   Still hospitalized: {still_hospitalized} ({(still_hospitalized/len(patient_data)*100):.1f}%)")
        print(f"   Discharged: {discharged} ({(discharged/len(patient_data)*100):.1f}%)")

        # 6. Length of stay (for discharged patients)
        print(f"\n{'='*60}")
        print("6. LENGTH OF STAY (Discharged Patients)")
        print('='*60)
        stay_durations = []
        for internacao, paciente, atendimento in results:
            if internacao.data_alta and internacao.data_internacao:
                duration = (internacao.data_alta - internacao.data_internacao).days
                stay_durations.append(duration)

        if stay_durations:
            print(f"   Average stay: {sum(stay_durations)/len(stay_durations):.1f} days")
            print(f"   Min stay: {min(stay_durations)} days")
            print(f"   Max stay: {max(stay_durations)} days")

            # Stay duration groups
            stay_groups = {
                '1-3 days': 0,
                '4-7 days': 0,
                '8-14 days': 0,
                '15+ days': 0
            }
            for duration in stay_durations:
                if duration <= 3:
                    stay_groups['1-3 days'] += 1
                elif duration <= 7:
                    stay_groups['4-7 days'] += 1
                elif duration <= 14:
                    stay_groups['8-14 days'] += 1
                else:
                    stay_groups['15+ days'] += 1

            print(f"\n   Stay Duration Distribution:")
            for group, count in stay_groups.items():
                percentage = (count / len(stay_durations)) * 100
                print(f"   - {group}: {count} ({percentage:.1f}%)")
        else:
            print("   No data available (no discharged patients)")

        # 7. Monthly distribution
        print(f"\n{'='*60}")
        print("7. MONTHLY ADMISSION DISTRIBUTION")
        print('='*60)
        months = {}
        for internacao, paciente, atendimento in results:
            if internacao.data_internacao:
                month_key = internacao.data_internacao.strftime('%Y-%m')
                month_name = internacao.data_internacao.strftime('%B/%Y')
                if month_key not in months:
                    months[month_key] = {'name': month_name, 'count': 0}
                months[month_key]['count'] += 1

        for month_key in sorted(months.keys()):
            count = months[month_key]['count']
            percentage = (count / len(results)) * 100
            print(f"   {months[month_key]['name']}: {count} admissions ({percentage:.1f}%)")

        # 8. Bed/Ward distribution
        print(f"\n{'='*60}")
        print("8. BED/WARD DISTRIBUTION")
        print('='*60)
        leitos = [p['Leito'] for p in patient_data if p['Leito'] != 'N/A']
        if leitos:
            leito_counts = Counter(leitos)
            for leito, count in leito_counts.most_common(10):  # Top 10
                percentage = (count / len(patient_data)) * 100
                print(f"   {leito}: {count} ({percentage:.1f}%)")
        else:
            print("   No bed assignment data available")

        # 9. Top attending physicians
        print(f"\n{'='*60}")
        print("9. TOP ATTENDING PHYSICIANS")
        print('='*60)
        medicos = [p['Médico'] for p in patient_data if p['Médico'] != 'N/A']
        if medicos:
            medico_counts = Counter(medicos)
            for medico, count in medico_counts.most_common(10):  # Top 10
                percentage = (count / len(patient_data)) * 100
                print(f"   {medico}: {count} cases ({percentage:.1f}%)")
        else:
            print("   No physician data available")

except Exception as e:
    print(f"Error occurred: {str(e)}")
    import traceback
    traceback.print_exc()
finally:
    session.close()

print("\n" + "=" * 80)
print("SCOUTING COMPLETED")
print("=" * 80)
