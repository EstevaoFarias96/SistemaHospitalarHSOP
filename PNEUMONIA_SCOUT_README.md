# Pneumonia Patient Scout

This script searches the HSOP database for patients diagnosed with pneumonia based on CID-10 codes.

## Description

The script queries the `atendimentos_clinica` (Internacao) table to find patients with pneumonia diagnosis during a specific period.

### Search Criteria

- **Period**: 01/07/2025 to 31/11/2025
- **CID-10 Codes**: J18.9, J18, J189, J180
- **Search Fields**:
  - `cid_principal` - Primary diagnosis code
  - `cid_10_secundario` - Secondary diagnosis codes
  - `diagnostico` - Diagnosis text (searches for "pneumonia")
  - `diagnostico_inicial` - Initial diagnosis text (searches for "pneumonia")

## Usage

Run the script from the HSOP root directory:

### Using Production Database (default)
```bash
python3 pneumonia_scout.py
```

### Using Development Database (local PostgreSQL)
```bash
python3 pneumonia_scout.py --db dev
```

### Check Available Data First
Before running the scout, you can check what data is available:
```bash
python3 check_pneumonia_data.py
```

## Output

The script generates:

1. **Console Output**: Detailed patient information including:
   - Patient demographics (name, age, sex, ID)
   - Admission and discharge dates
   - CID codes and diagnoses
   - Attending physician
   - Bed assignment
   - Contact information

2. **CSV Export**: A timestamped CSV file containing all patient data:
   - Filename format: `pneumonia_patients_YYYYMMDD_HHMMSS.csv`
   - Encoding: UTF-8 with BOM (opens correctly in Excel)

3. **Comprehensive Patient Profile Study**:
   1. **Gender Distribution** - Male/Female breakdown with percentages
   2. **Age Distribution** - Average, min, max, and age groups (Pediatric, Young Adult, Adult, Elderly)
   3. **CID-10 Code Distribution** - Breakdown by specific pneumonia codes
   4. **Geographic Distribution** - Cases by municipality
   5. **Hospitalization Status** - Currently hospitalized vs. discharged
   6. **Length of Stay** - Average and distribution of hospital stay duration
   7. **Monthly Admission Distribution** - Temporal patterns
   8. **Bed/Ward Distribution** - Most used beds/wards
   9. **Top Attending Physicians** - Physicians treating most cases

## Customization

To modify the search parameters, edit the following variables in the script:

```python
# Date range
start_date = datetime(2025, 7, 1)
end_date = datetime(2025, 11, 30, 23, 59, 59)

# CID codes
cid_codes = ['J18.9', 'J18', 'J189', 'J180', 'j18.9', 'j18', 'j189', 'j180']
```

## Database Configuration

The script uses the database configuration from `app/config.py`:

- **Production**: Uses `DATABASE_URL` environment variable (PostgreSQL)
- **Development**: Uses local PostgreSQL connection
- **Fallback**: SQLite database if PostgreSQL is not available

## Requirements

- Python 3.7+
- SQLAlchemy
- Access to HSOP database

All dependencies are already included in the HSOP project requirements.

## Example Output

```
================================================================================
SCOUTING FOR PNEUMONIA PATIENTS
================================================================================
Period: 01/07/2025 to 30/11/2025
CID Codes: J18.9, J18, J189, J180
================================================================================

Total patients found: 5

✓ Data exported to: pneumonia_patients_20250110_143022.csv

================================================================================
PATIENT SUMMARY
================================================================================

[1] Patient: João da Silva
    ID: 123 | Internação: 45 | Atendimento: E0001234
    Age: 65 anos | Sex: Masculino
    Admission: 15/07/2025 08:30
    Discharge: 22/07/2025 14:00
    CID Principal: J18.9
    Diagnosis: Pneumonia bacteriana não especificada...
    Doctor: Dr. Maria Santos
    Bed: Enfermaria A - 03
--------------------------------------------------------------------------------

================================================================================
STATISTICS
================================================================================
Total patients: 5

Gender distribution:
  - Masculino: 3
  - Feminino: 2

CID Principal distribution:
  - J18.9: 3
  - J18: 2

Status:
  - Still hospitalized: 1
  - Discharged: 4

================================================================================
SCOUTING COMPLETED
================================================================================
```

## Notes

- The script searches for both exact CID code matches and text containing "pneumonia"
- Case-insensitive search for diagnosis text
- Includes both primary and secondary CID codes in the search
- Patients who are still hospitalized will show "Em internação" in the discharge date
