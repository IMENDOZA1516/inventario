from app import app, db
from models import Usuario  # Asegúrate que tengas este modelo

with app.app_context():
    if not Usuario.query.filter_by(email='admin@gmail.com').first():
        admin = Usuario(
            nombre="Admin",
            email="admin@gmail.com",
            rol="admin"
        )
        admin.set_password("admin123")  # Usa tu método para hashear
        db.session.add(admin)
        db.session.commit()
        print("✅ Usuario admin creado.")
    else:
        print("⚠️ El usuario ya existe.")
