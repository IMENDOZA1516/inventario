from app import app, db
from sqlalchemy import inspect

with app.app_context():
    inspector = inspect(db.engine)
    tablas = inspector.get_table_names()
    print("📋 Tablas en la base de datos:")
    for tabla in tablas:
        print(f" - {tabla}")
