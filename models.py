# models.py
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from datetime import datetime
from flask_login import UserMixin
class Computadora(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_inventario = db.Column(db.String(100), unique=True, nullable=False)
    estado = db.Column(db.String(20), default="Disponible")  # Disponible, Asignada
    empleado_id = db.Column(db.Integer, db.ForeignKey('empleado.id'), nullable=True)
    ubicacion_campus = db.Column(db.String(100), nullable=False)
    departamento = db.Column(db.String(100), nullable=False)
    
    # Componentes de la computadora
    monitor = db.Column(db.String(100), nullable=True)  # Puede quedar vacío si es obsoleto
    teclado = db.Column(db.String(100), nullable=True)  # Puede quedar vacío si es obsoleto
    monitor_obsoleto = db.Column(db.Boolean, default=False, nullable=False)  # Nuevo campo
    teclado_obsoleto = db.Column(db.Boolean, default=False, nullable=False)  # Nuevo campo
    
    tipo_propiedad = db.Column(db.String(10), default="Propia", nullable=False)  # 'Propia' o 'Alquilada'
    es_obsoleta = db.Column(db.Boolean, default=False, nullable=False)  # Para toda la computadora

   
class Empleado(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    puesto = db.Column(db.String(100), nullable=False)
    campus = db.Column(db.String(100), nullable=False)
    computadoras = db.relationship('Computadora', backref='empleado', lazy=True)


class Usuario(db.Model, UserMixin):  # 🔥 Heredamos de UserMixin
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    rol = db.Column(db.String(50), default='usuario')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # 🔥 Métodos necesarios para Flask-Login
    def get_id(self):
        return str(self.id)  # Retorna el ID del usuario como string

    @property
    def is_authenticated(self):
        return True  # Siempre es True si el usuario está autenticado

    @property
    def is_active(self):
        return True  # Podrías cambiar esto si quieres suspender cuentas

    @property
    def is_anonymous(self):
        return False  # Los usuarios registrados no son anónimos

class Migracion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    computadora_id = db.Column(db.Integer, db.ForeignKey('computadora.id'), nullable=False)
    emisor_id = db.Column(db.Integer, db.ForeignKey('empleado.id'), nullable=False)
    receptor_id = db.Column(db.Integer, db.ForeignKey('empleado.id'), nullable=False)
    fecha_migracion = db.Column(db.DateTime, default=datetime.utcnow)
    
    computadora = db.relationship('Computadora', backref='migraciones')
    emisor = db.relationship('Empleado', foreign_keys=[emisor_id])
    receptor = db.relationship('Empleado', foreign_keys=[receptor_id])

class Reasignacion(db.Model):
    __tablename__ = 'reasignaciones'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Información del equipo
    tipo_equipo = db.Column(db.String(100), nullable=False)
    nomenclatura = db.Column(db.String(100), nullable=False)
    service_tag = db.Column(db.String(100), nullable=False)
    serie = db.Column(db.String(100), nullable=False)
    marca = db.Column(db.String(100), nullable=False)
    modelo = db.Column(db.String(100), nullable=False)
    inventario = db.Column(db.String(100), nullable=False)
    fecha_traslado = db.Column(db.Date, nullable=False)
    propiedad = db.Column(db.String(50), nullable=False)
    accesorios = db.Column(db.Text, nullable=True)
    observaciones = db.Column(db.Text, nullable=True)

    # Información del usuario emisor
    unidad_emisor = db.Column(db.String(100), nullable=False)
    responsable_emisor = db.Column(db.String(100), nullable=False)
    correo_emisor = db.Column(db.String(100), nullable=False)
    empleado_emisor = db.Column(db.String(50), nullable=False)
    ubicacion_emisor = db.Column(db.String(100), nullable=False)

    # Información del usuario receptor
    unidad_receptor = db.Column(db.String(100), nullable=False)
    responsable_receptor = db.Column(db.String(100), nullable=False)
    correo_receptor = db.Column(db.String(100), nullable=False)
    empleado_receptor = db.Column(db.String(50), nullable=False)
    ubicacion_receptor = db.Column(db.String(100), nullable=False)  

class ComponenteDefectuoso(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo_componente = db.Column(db.String(50), nullable=False)  # 'Monitor' o 'Teclado'
    modelo = db.Column(db.String(100), nullable=False)
    inventario_componente = db.Column(db.String(100), nullable=False)  # El inventario del monitor/teclado
    motivo = db.Column(db.Text, nullable=False)  # Motivo por el cual se vuelve obsoleto
    fecha_marcado = db.Column(db.DateTime, default=datetime.utcnow)

    # Relación con la computadora original
    computadora_id = db.Column(db.Integer, db.ForeignKey('computadora.id'), nullable=False)
    computadora = db.relationship('Computadora', backref=db.backref('componentes_defectuosos', lazy=True))  

class ComputadoraEliminada(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    numero_inventario = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), nullable=False)
    ubicacion_campus = db.Column(db.String(100), nullable=False)
    departamento = db.Column(db.String(100), nullable=False)
    monitor = db.Column(db.String(100), nullable=True)
    teclado = db.Column(db.String(100), nullable=True)
    monitor_obsoleto = db.Column(db.Boolean, default=False, nullable=False)
    teclado_obsoleto = db.Column(db.Boolean, default=False, nullable=False)
    tipo_propiedad = db.Column(db.String(10), nullable=False)
    fecha_eliminacion = db.Column(db.DateTime, default=datetime.utcnow)
    empleado_nombre = db.Column(db.String(100), nullable=True)
    empleado_email = db.Column(db.String(100), nullable=True)