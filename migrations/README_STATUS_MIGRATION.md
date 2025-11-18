# Migration: Add Status Column to prescricoes_emergencia

## Overview
This migration adds status tracking columns to the `prescricoes_emergencia` table to properly track when emergency prescriptions are dispensed.

## What Changed

### Database Schema
Added 4 new columns to `prescricoes_emergencia` table:
1. **status** - VARCHAR(50), default 'Pendente' - Tracks prescription status
2. **farmaceutico_id** - INTEGER, FK to funcionarios - Who dispensed it
3. **data_dispensacao** - TIMESTAMP WITH TIME ZONE - When it was dispensed
4. **observacoes** - TEXT - Pharmacy comments

### Code Changes
1. **Model updated** in `app/models.py` - PrescricaoEmergencia class now has the 4 new fields
2. **API endpoints updated**:
   - `/api/dispensacoes/emergencia-pendentes` - Now filters by `status='Pendente'`
   - `/api/dispensacoes/emergencia-processar` - Sets status to 'Aprovado' after processing
   - `/api/dispensacoes/aprovar-todas-emergencia` - Updates status instead of deleting records
3. **Frontend updated** in `app/templates/farmacia_disp.html` - Status changed from "Dispensado" to "Aprovado"

## How to Apply This Migration

### Option 1: Using PostgreSQL Command Line (Recommended)
```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration file
\i /home/estevaofilho/HSOP/HSOP/migrations/add_status_prescricao_emergencia.sql

# Verify the changes
\d prescricoes_emergencia
```

### Option 2: Using psql with file redirect
```bash
psql -U your_username -d your_database_name -f /home/estevaofilho/HSOP/HSOP/migrations/add_status_prescricao_emergencia.sql
```

### Option 3: Copy and paste SQL commands
Open your PostgreSQL client (pgAdmin, DBeaver, etc.) and run the SQL commands from `add_status_prescricao_emergencia.sql`

## After Migration

### Test Checklist
1. ✅ Restart your Flask application
2. ✅ Go to Farmácia Dispensação page
3. ✅ Verify emergency prescriptions appear in the pending list
4. ✅ Select a sector (Farmácia Central, Farmácia Satélite 1, etc.)
5. ✅ Open an emergency prescription modal
6. ✅ Search and add medications from stock
7. ✅ Click "Confirmar Dispensação"
8. ✅ Verify the prescription disappears from the pending list
9. ✅ Check database that status changed to 'Aprovado'
10. ✅ Verify farmaceutico_id and data_dispensacao were recorded

### Database Verification Queries
```sql
-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'prescricoes_emergencia'
AND column_name IN ('status', 'farmaceutico_id', 'data_dispensacao', 'observacoes');

-- Check all pending emergency prescriptions
SELECT id, atendimento_id, status, data_dispensacao, farmaceutico_id
FROM prescricoes_emergencia
WHERE status = 'Pendente'
ORDER BY horario_prescricao DESC;

-- Check recently approved prescriptions
SELECT pe.id, pe.atendimento_id, pe.status, pe.data_dispensacao, f.nome as farmaceutico
FROM prescricoes_emergencia pe
LEFT JOIN funcionarios f ON pe.farmaceutico_id = f.id
WHERE pe.status = 'Aprovado'
ORDER BY pe.data_dispensacao DESC
LIMIT 10;
```

## Rollback (if needed)
If you need to rollback this migration:

```sql
BEGIN;

-- Drop index
DROP INDEX IF EXISTS idx_prescricoes_emergencia_status;

-- Remove columns
ALTER TABLE prescricoes_emergencia DROP COLUMN IF EXISTS observacoes;
ALTER TABLE prescricoes_emergencia DROP COLUMN IF EXISTS data_dispensacao;
ALTER TABLE prescricoes_emergencia DROP COLUMN IF EXISTS farmaceutico_id;
ALTER TABLE prescricoes_emergencia DROP COLUMN IF EXISTS status;

COMMIT;
```

## Status Values
- **Pendente** - New prescription, waiting to be dispensed
- **Aprovado** - Successfully dispensed with stock deduction
- **Cancelado** - Prescription cancelled (future use)

## Notes
- All existing prescriptions will be set to 'Pendente' status
- The frontend now uses "Aprovado" instead of "Dispensado" for consistency
- FluxoDisp prescriptions also accept "Aprovado" status now
- Emergency mass approval now updates status instead of deleting records
