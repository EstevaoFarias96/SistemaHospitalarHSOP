"""
Quick script to check available pneumonia data in database
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models import Internacao
from app.config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

print("="*80)
print("CHECKING PNEUMONIA DATA IN DATABASE")
print("="*80)

try:
    # Count total internacoes
    total_internacoes = session.query(Internacao).count()
    print(f"\nTotal internacoes in database: {total_internacoes}")

    # Check for any CID starting with J18
    cid_codes = ['J18.9', 'J18', 'J189', 'J180', 'j18.9', 'j18', 'j189', 'j180']
    pneumonia_count = session.query(Internacao).filter(
        Internacao.cid_principal.in_(cid_codes)
    ).count()
    print(f"Total pneumonia cases (CID J18.x): {pneumonia_count}")

    # Get date range of all internacoes
    date_range = session.query(
        func.min(Internacao.data_internacao),
        func.max(Internacao.data_internacao)
    ).first()

    if date_range[0] and date_range[1]:
        print(f"\nDate range in database:")
        print(f"  Earliest admission: {date_range[0].strftime('%d/%m/%Y')}")
        print(f"  Latest admission: {date_range[1].strftime('%d/%m/%Y')}")

    # Get all unique CID codes in database
    print(f"\n{'='*80}")
    print("Sample of CID codes in database (first 20):")
    print('='*80)
    unique_cids = session.query(Internacao.cid_principal).distinct().limit(20).all()
    for i, (cid,) in enumerate(unique_cids, 1):
        if cid:
            print(f"  {i}. {cid}")

    # Check if there are any J18 related codes with different formatting
    print(f"\n{'='*80}")
    print("Searching for any CID containing 'J18' or 'j18':")
    print('='*80)
    j18_variants = session.query(Internacao.cid_principal).filter(
        Internacao.cid_principal.ilike('%j18%')
    ).distinct().all()

    if j18_variants:
        print(f"Found {len(j18_variants)} variants:")
        for (cid,) in j18_variants:
            count = session.query(Internacao).filter(Internacao.cid_principal == cid).count()
            print(f"  - {cid}: {count} cases")
    else:
        print("No J18 variants found")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    session.close()

print("\n" + "="*80)
print("CHECK COMPLETED")
print("="*80)
