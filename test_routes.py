#!/usr/bin/env python3

from app import create_app

app = create_app()

print("=== ROTAS REGISTRADAS ===")
with app.app_context():
    for rule in app.url_map.iter_rules():
        methods = ','.join(rule.methods)
        print(f"{rule.rule:50} -> {rule.endpoint:30} [{methods}]")

print("\n=== ROTAS DE RECEPCIONISTA ===")
with app.app_context():
    for rule in app.url_map.iter_rules():
        if 'recepcionista' in rule.rule.lower():
            methods = ','.join(rule.methods)
            print(f"{rule.rule:50} -> {rule.endpoint:30} [{methods}]")
