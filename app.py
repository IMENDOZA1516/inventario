from flask import Flask, request, jsonify, url_for, session, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from extensions import db
from flask_jwt_extended import JWTManager, create_access_token
from models import Computadora, Empleado, Usuario
from flask_migrate import Migrate  # Importar Flask-Migrate
from flask import Flask, render_template
from flask import session, redirect, url_for, render_template
from flask import Response
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import send_file
from models import db, Reasignacion  # Importamos la base de datos y el modelo
from flask import Flask, render_template, request, redirect, url_for, flash
from datetime import datetime
import os
from docx import Document
from docx.shared import Pt
from io import BytesIO
from docx.shared import Pt
from docx.oxml import OxmlElement
from docx.shared import RGBColor
from models import db, Computadora, ComponenteDefectuoso
from flask_login import login_required, current_user
from docx.oxml.ns import qn
from flask_login import LoginManager
from models import ComputadoraEliminada
from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

from models import Migracion  # Si los modelos están en un archivo llamado models.py
app = Flask(__name__)


# Configuración de JWT
app.config['JWT_SECRET_KEY'] = 'Mendoza0101@'  # Cambia esto por una clave segura
jwt = JWTManager(app)

app.secret_key = 'Mendoza0101'  # Usa una clave única y segura

# Leer directamente de la variable de entorno sin poner un valor por defecto
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
db.init_app(app)

# Configurar Flask-Migrate
migrate = Migrate(app, db)
# 🔥 INICIALIZAR FLASK-LOGIN 🔥
login_manager = LoginManager()
login_manager.init_app(app)  # Asociar Flask-Login con la app
login_manager.login_view = "login"  # Si no está autenticado, redirigir al login

# 🔥 FUNCIÓN PARA CARGAR USUARIOS 🔥
@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))  # Busca usuarios por ID en la base de datos

@app.route('/')
def index():
    return redirect(url_for('login'))

# ---------- Ruta para agregar computadora y crear empleado + usuario ----------
# ---------- Ruta para agregar computadora asignada a un empleado existente ----------
@app.route('/computadoras', methods=['POST'])
def agregar_computadora():
    data = request.get_json()

    empleado_id = data.get('empleado_id')
    if not empleado_id:
        return jsonify({'mensaje': 'Error: Debes seleccionar un empleado'}), 400

    nueva_computadora = Computadora(
        numero_inventario=data.get('numero_inventario'),
        ubicacion_campus=data.get('ubicacion_campus'),
        departamento=data.get('departamento'),
        monitor=data.get('monitor'),
        teclado=data.get('teclado'),
        estado=data.get('estado'),
        tipo_propiedad=data.get('tipo_propiedad'),
        empleado_id=empleado_id,
        monitor_obsoleto=False,
        teclado_obsoleto=False
    )
    db.session.add(nueva_computadora)
    db.session.commit()

    return jsonify({'mensaje': 'Computadora agregada correctamente'}), 201

#---- ruta para agregar empleado + usuario----
@app.route('/empleados', methods=['POST'])
def agregar_empleado():
    data = request.get_json()

    empleado_existente = Empleado.query.filter_by(email=data.get('email')).first()
    usuario_existente = Usuario.query.filter_by(email=data.get('email')).first()
    if empleado_existente or usuario_existente:
        return jsonify({'mensaje': 'Error: El correo ya está registrado'}), 400

    nuevo_empleado = Empleado(
        nombre=data.get('nombre'),
        email=data.get('email'),
        puesto=data.get('puesto'),
        campus=data.get('campus')
    )
    db.session.add(nuevo_empleado)
    db.session.commit()

    nuevo_usuario = Usuario(
        nombre=data.get('nombre'),
        email=data.get('email'),
        rol="usuario"
    )
    nuevo_usuario.set_password(data.get('password'))
    db.session.add(nuevo_usuario)
    db.session.commit()

    return jsonify({'mensaje': 'Empleado y usuario creados correctamente'}), 201

# ---------- Ruta para obtener empleados ----------
@app.route('/empleados', methods=['GET'])
def obtener_empleados():
    empleados = Empleado.query.all()
    empleados_json = [{
        'id': emp.id,
        'nombre': emp.nombre,
        'email': emp.email,
        'puesto': emp.puesto,
        'campus': emp.campus
    } for emp in empleados]
    return jsonify(empleados_json)

# ---------- Buscar computadoras ----------
@app.route('/buscar_computadoras')
def buscar_computadoras():
    query = request.args.get('q', '').strip().lower()
    tipo_propiedad = request.args.get('tipo', '').strip().capitalize()  # Normalizamos "propia" y "alquilada"

    computadoras_query = Computadora.query.filter(Computadora.es_obsoleta.is_(False))  # 🔹 Evita filter_by

    if query:
        computadoras_query = computadoras_query.filter(
            (Computadora.numero_inventario.ilike(f"%{query}%")) |
            (Computadora.empleado.has(Empleado.nombre.ilike(f"%{query}%")))
        )

    if tipo_propiedad in ["Propia", "Alquilada"]:  # 🔹 Ahora "Alquilada" es correcto
        computadoras_query = computadoras_query.filter(Computadora.tipo_propiedad.ilike(tipo_propiedad))

    computadoras = computadoras_query.all()
    computadoras_filtradas = [{
        'id': comp.id,
        'numero_inventario': comp.numero_inventario,
        'estado': comp.estado,
        'departamento': comp.departamento,
        'ubicacion_campus': comp.ubicacion_campus,
        'monitor': comp.monitor,
        'teclado': comp.teclado,
        'tipo_propiedad': comp.tipo_propiedad,
        'empleado': {
            'nombre': comp.empleado.nombre,
            'email': comp.empleado.email,
            'puesto': comp.empleado.puesto
        } if comp.empleado else None
    } for comp in computadoras]

    return jsonify(computadoras_filtradas)



# ---------- Obtener computadoras filtradas por rol ----------
@app.route('/computadoras', methods=['GET'])
@login_required
def obtener_computadoras():
    rol_usuario = current_user.rol
    if rol_usuario == "usuario":
        empleado = Empleado.query.filter_by(email=current_user.email).first()
        if not empleado:
            return jsonify([])

        computadoras = Computadora.query.filter_by(empleado_id=empleado.id, es_obsoleta=False).all()
    else:
        computadoras = Computadora.query.filter(Computadora.es_obsoleta.is_(False)).all()

    lista_computadoras = []
    for comp in computadoras:
        computadora_info = {
            'id': comp.id,
            'numero_inventario': comp.numero_inventario,
            'estado': comp.estado,
            'departamento': comp.departamento,
            'ubicacion_campus': comp.ubicacion_campus,
            'monitor': comp.monitor,
            'teclado': comp.teclado,
            'tipo_propiedad': comp.tipo_propiedad,
            'empleado_id': comp.empleado_id
        }
        if comp.empleado:
            computadora_info['empleado'] = {
                'id': comp.empleado.id,
                'nombre': comp.empleado.nombre,
                'email': comp.empleado.email,
                'puesto': comp.empleado.puesto
            }
        else:
            computadora_info['empleado'] = None

        lista_computadoras.append(computadora_info)

    return jsonify(lista_computadoras)


# ---------- Actualizar computadora ----------
@app.route('/computadoras/<int:id>', methods=['PUT'])
def actualizar_computadora(id):
    computadora = Computadora.query.get(id)
    if not computadora:
        return jsonify({'error': 'Computadora no encontrada'}), 404

    data = request.json
    computadora.numero_inventario = data.get('numero_inventario', computadora.numero_inventario)
    computadora.ubicacion_campus = data.get('ubicacion_campus', computadora.ubicacion_campus)
    computadora.departamento = data.get('departamento', computadora.departamento)
    computadora.tipo_propiedad = data.get('tipo_propiedad', computadora.tipo_propiedad)
    computadora.estado = data.get('estado', computadora.estado)
    empleado_id = data.get('empleado_id')
    if empleado_id is not None:
        computadora.empleado_id = empleado_id

    # ✅ Manejo del monitor obsoleto
    if data.get('monitor_obsoleto') and computadora.monitor:
        componente_monitor = ComponenteDefectuoso(
            tipo_componente="Monitor",
            modelo=computadora.monitor,
            inventario_componente=computadora.monitor,  # Aquí usas el mismo campo monitor como inventario
            motivo="Daño irreparable",
            computadora_id=computadora.id
        )
        db.session.add(componente_monitor)
        computadora.monitor = None
        computadora.monitor_obsoleto = True
    else:
        computadora.monitor = data.get('monitor')

    # ✅ Manejo del teclado obsoleto
    if data.get('teclado_obsoleto') and computadora.teclado:
        componente_teclado = ComponenteDefectuoso(
            tipo_componente="Teclado",
            modelo=computadora.teclado,
            inventario_componente=computadora.teclado,  # Usamos el mismo campo teclado como inventario
            motivo="Daño irreparable",
            computadora_id=computadora.id
        )
        db.session.add(componente_teclado)
        computadora.teclado = None
        computadora.teclado_obsoleto = True
    else:
        computadora.teclado = data.get('teclado')

    db.session.commit()
    return jsonify({'mensaje': 'Computadora actualizada correctamente'})



@app.route('/computadoras/<int:id>', methods=['GET'])
@login_required
def obtener_computadora_por_id(id):
    computadora = Computadora.query.get(id)
    if not computadora:
        return jsonify({'error': 'Computadora no encontrada'}), 404

    computadora_info = {
        'id': computadora.id,
        'numero_inventario': computadora.numero_inventario,
        'ubicacion_campus': computadora.ubicacion_campus,
        'departamento': computadora.departamento,
        'estado': computadora.estado,
        'monitor': computadora.monitor,
        'teclado': computadora.teclado,
        'tipo_propiedad': computadora.tipo_propiedad,
        'monitor_obsoleto': computadora.monitor_obsoleto,
        'teclado_obsoleto': computadora.teclado_obsoleto,
        'empleado': {
            'nombre': computadora.empleado.nombre if computadora.empleado else '',
            'email': computadora.empleado.email if computadora.empleado else ''
        }
    }
    return jsonify(computadora_info)


# ---------- Eliminar computadora ----------
@app.route('/computadoras/<int:id>', methods=['DELETE'])
def eliminar_computadora(id):
    computadora = Computadora.query.get(id)
    if not computadora:
        return jsonify({"mensaje": "Computadora no encontrada"}), 404

    # Crear entrada en historial
    eliminada = ComputadoraEliminada(
        numero_inventario=computadora.numero_inventario,
        estado=computadora.estado,
        ubicacion_campus=computadora.ubicacion_campus,
        departamento=computadora.departamento,
        monitor=computadora.monitor,
        teclado=computadora.teclado,
        monitor_obsoleto=computadora.monitor_obsoleto,
        teclado_obsoleto=computadora.teclado_obsoleto,
        tipo_propiedad=computadora.tipo_propiedad,
        empleado_nombre=computadora.empleado.nombre if computadora.empleado else None,
        empleado_email=computadora.empleado.email if computadora.empleado else None
    )

    db.session.add(eliminada)
    db.session.delete(computadora)
    db.session.commit()

    return jsonify({"mensaje": "Computadora movida a historial de eliminadas"}), 200

# ---------- Marcar computadora como obsoleta ----------
@app.route('/computadoras/<int:id>/obsoleta', methods=['PUT'])
def Obsoletas(id):
    computadora = Computadora.query.get(id)
    if not computadora:
        return jsonify({'error': 'Computadora no encontrada'}), 404

    computadora.es_obsoleta = True
    db.session.commit()
    return jsonify({'mensaje': 'Computadora marcada como obsoleta'}), 200


# ---------- Ruta para obtener computadoras obsoletas ----------
@app.route('/computadoras/obsoletas', methods=['GET'])
def obtener_obsoletas():
    computadoras = Computadora.query.filter_by(es_obsoleta=True).all()
    computadoras_json = [
        {
            'id': comp.id,
            'numero_inventario': comp.numero_inventario,
            'estado': comp.estado,
            'departamento': comp.departamento,
            'ubicacion_campus': comp.ubicacion_campus,
            'monitor': comp.monitor,
            'teclado': comp.teclado
        } for comp in computadoras
    ]
    return jsonify(computadoras_json)


# ---------- Login y logout ----------
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    usuario = Usuario.query.filter_by(email=data['email']).first()

    if usuario and usuario.check_password(data['password']):
        login_user(usuario)
        session['usuario_id'] = usuario.id  # Guarda el ID del usuario en la sesión
        session['usuario'] = usuario.email  # Guarda el email
        session['rol'] = usuario.rol  # Guarda el rol

        return jsonify({"mensaje": "Login exitoso", "redirect": "/dashboard", "rol": usuario.rol}), 200
    else:
        return jsonify({"mensaje": "Credenciales incorrectas"}), 401


@app.route('/login', methods=['GET'])
def login_form():
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    return redirect(url_for('login'))


# ---------- Obtener rol + ID de empleado ----------
@app.route('/obtener_rol', methods=['GET'])
@login_required
def obtener_rol():
    empleado = Empleado.query.filter_by(email=current_user.email).first()
    empleado_id = empleado.id if empleado else None
    return jsonify({"id": empleado_id, "rol": current_user.rol})


# ---------- Dashboard ----------
@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', rol=current_user.rol)


# codigo para eleminar la sesion del usuario
#@app.route('/logout')
#@login_required
#def logout():
 #   logout_user()  # 🔥 Cierra sesión correctamente con Flask-Login
  #  session.clear()  # 🔥 Elimina toda la información de sesión
  #  return redirect(url_for('login'))  # Redirigir al login

# rutas para ver las computadoras eliminadas 
@app.route('/eliminadas')
@login_required
def ver_computadoras_eliminadas():
    if current_user.rol != 'admin':
        return redirect(url_for('dashboard'))  # Redirigir si no es admin
    return render_template('eliminadas.html', rol=current_user.rol)

@app.route('/computadoras_eliminadas', methods=['GET'])
@login_required
def obtener_computadoras_eliminadas():
    if current_user.rol != 'admin':
        return jsonify({"mensaje": "Acceso denegado"}), 403

    eliminadas = ComputadoraEliminada.query.all()
    lista_eliminadas = []

    for comp in eliminadas:
        lista_eliminadas.append({
            'id': comp.id,
            'numero_inventario': comp.numero_inventario,
            'estado': comp.estado,
            'departamento': comp.departamento,
            'ubicacion_campus': comp.ubicacion_campus,
            'monitor': comp.monitor,
            'teclado': comp.teclado,
            'tipo_propiedad': comp.tipo_propiedad,
            'fecha_eliminacion': comp.fecha_eliminacion.strftime('%Y-%m-%d %H:%M:%S')
        })

    return jsonify(lista_eliminadas)


# ---------- Obtener componentes obsoletos ----------
@app.route('/componentes_obsoletos', methods=['GET'])
@login_required
def obtener_componentes_obsoletos():
    if current_user.rol != 'admin':
        return jsonify({'error': 'Acceso no autorizado'}), 403

    componentes = ComponenteDefectuoso.query.all()
    componentes_json = [
        {
            'id': comp.id,
            'tipo_componente': comp.tipo_componente,
            'modelo': comp.modelo,
            'inventario': comp.inventario_componente,
            'motivo': comp.motivo,
            'fecha_marcado': comp.fecha_marcado.strftime('%Y-%m-%d %H:%M'),
            'computadora_id': comp.computadora_id,
            'numero_inventario_computadora': comp.computadora.numero_inventario if comp.computadora else "No encontrada"
        }
        for comp in componentes
    ]

    return jsonify(componentes_json)


@app.route('/componentes_obsoletos_page')
@login_required
def ver_componentes_obsoletos():
    if current_user.rol != "admin":
        return redirect(url_for('dashboard'))
    return render_template('componentes_obsoletos.html')


@app.route('/reporte/pdf')
def generar_reporte_pdf():
    # Crear un buffer para el PDF
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle("Reporte de Computadoras")

    # Título del reporte
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(200, 750, "Reporte de Computadoras")

    # Encabezados
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, 720, "No. Inventario")
    pdf.drawString(200, 720, "Estado")
    pdf.drawString(350, 720, "Empleado")

    y = 700  # Posición inicial de los datos

    computadoras = Computadora.query.all()
    pdf.setFont("Helvetica", 10)

    for comp in computadoras:
        empleado_nombre = comp.empleado.nombre if comp.empleado else "No asignado"

        pdf.drawString(50, y, comp.numero_inventario)
        pdf.drawString(200, y, comp.estado)
        pdf.drawString(350, y, empleado_nombre)

        y -= 20  # Mover hacia abajo

        # Verifica si queda espacio en la página, si no, crea una nueva
        if y < 50:
            pdf.showPage()
            pdf.setFont("Helvetica", 10)
            y = 750  # Reiniciar posición en nueva página

    pdf.save()

    # Devolver el PDF como respuesta
    buffer.seek(0)
    return Response(buffer, mimetype='application/pdf', headers={"Content-Disposition": "attachment;filename=reporte_computadoras.pdf"})


from flask import session  # Asegúrate de importar session

@app.route('/reporte/excel')
def generar_reporte_excel():
    usuario_id = session.get('usuario_id')  # Obtener el usuario logueado
    usuario_rol = session.get('rol')  # Obtener el rol del usuario
    print("Usuario ID en sesión:", session.get('usuario_id'))
    print("Rol en sesión:", session.get('rol'))
    if not usuario_id:  # Si no hay usuario en sesión, no hacer nada
        return "No autorizado", 403

    # Si es admin, descargar todas las computadoras
    if usuario_rol == "admin":
        computadoras = Computadora.query.all()
    else:  
        # Si es empleado, descargar solo sus computadoras
        computadoras = Computadora.query.filter_by(empleado_id=usuario_id).all()

    # Convertir los datos a una lista de diccionarios
    data = [{
        "Número de Inventario": comp.numero_inventario,
        "Estado": comp.estado,
        "Departamento": comp.departamento,
        "Ubicación Campus": comp.ubicacion_campus,
        "Monitor": comp.monitor,
        "Teclado": comp.teclado,
        "Empleado": comp.empleado.nombre if comp.empleado else "No asignado"
    } for comp in computadoras]

    # Crear DataFrame y generar Excel
    df = pd.DataFrame(data)
    excel_buffer = BytesIO()
    with pd.ExcelWriter(excel_buffer, engine='xlsxwriter') as writer:
        df.to_excel(writer, sheet_name="Computadoras", index=False)

    # Devolver el archivo como respuesta
    excel_buffer.seek(0)
    return Response(
        excel_buffer,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment;filename=reporte_computadoras.xlsx"}
    )



# restringir el acceso a usuarios normales
@app.route('/obsoletas')
def pagina_obsoletas():
    if 'rol' not in session or session['rol'] != 'admin':
        return redirect(url_for('dashboard'))  # Redirige a usuarios normales

    return render_template('obsoletas.html')

@app.route('/computadoras/<int:id>/obsoleta', methods=['PUT'])
def marcar_como_obsoleta(id):
    computadora = Computadora.query.get(id)
    if not computadora:
        return jsonify({'error': 'Computadora no encontrada'}), 404

    computadora.es_obsoleta = True
    db.session.commit()

    return jsonify({'mensaje': 'Computadora marcada como obsoleta'}), 200
@app.route('/computadoras/obsoletas', methods=['GET'])
def obtener_obsoletass():
    computadoras = Computadora.query.filter_by(es_obsoleta=True).all()
    computadoras_json = [
        {
            'id': comp.id,
            'numero_inventario': comp.numero_inventario,
            'estado': comp.estado,
            'departamento': comp.departamento,
            'ubicacion_campus': comp.ubicacion_campus,
            'monitor': comp.monitor,
            'teclado': comp.teclado
        } for comp in computadoras
    ]
    return jsonify(computadoras_json)

@app.route('/reasignar', methods=['GET', 'POST'])
def reasignar_computadora():
    if request.method == 'POST':
        data = request.get_json()  # Obtener datos en formato JSON
        
        if not data:
            return jsonify({"success": False, "message": "No se enviaron datos"}), 400
        
        # Crear un nuevo objeto Reasignacion con los datos del formulario
        nueva_reasignacion = Reasignacion(
            tipo_equipo=data.get("tipo_equipo"),
            nomenclatura=data.get("nomenclatura"),
            service_tag=data.get("service_tag"),
            serie=data.get("serie"),
            marca=data.get("marca"),
            modelo=data.get("modelo"),
            inventario=data.get("inventario"),
            fecha_traslado=datetime.strptime(data.get("fecha_traslado"), '%Y-%m-%d'),
            propiedad=data.get("propiedad"),
            accesorios=data.get("accesorios"),
            observaciones=data.get("observaciones"),
            unidad_emisor=data.get("unidad_emisor"),
            responsable_emisor=data.get("responsable_emisor"),
            correo_emisor=data.get("correo_emisor"),
            empleado_emisor=data.get("empleado_emisor"),
            ubicacion_emisor=data.get("ubicacion_emisor"),
            unidad_receptor=data.get("unidad_receptor"),
            responsable_receptor=data.get("responsable_receptor"),
            correo_receptor=data.get("correo_receptor"),
            empleado_receptor=data.get("empleado_receptor"),
            ubicacion_receptor=data.get("ubicacion_receptor")
        )

        # Guardar en la base de datos
        db.session.add(nueva_reasignacion)
        db.session.commit()
        
        # Asegurar que el ID se está enviando en la respuesta
        return jsonify({
            "success": True,
            "message": "Reasignación guardada exitosamente.",
            "id": nueva_reasignacion.id  # Enviar el ID correcto
        })

    return render_template('reasignar.html')

@app.route('/generar_pdf/<int:id>', methods=['GET'])
def generar_pdf(id):
    # Obtener la reasignación desde la base de datos
    reasignacion = Reasignacion.query.get(id)

    if not reasignacion:
        return "Error: No se encontró la reasignación con ID {}".format(id), 404

    # Crear el PDF
    pdf_path = f"reasignacion_{id}.pdf"
    c = canvas.Canvas(pdf_path, pagesize=letter)
    width, height = letter

    # Encabezado
    c.setFont("Helvetica-Bold", 14)
    c.drawString(200, height - 50, "FORMATO DE REASIGNACIÓN DE COMPUTADORA")

    # Sección 1: Información del Equipo
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 100, "I. Información del Equipo")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 120, f"Tipo de Equipo: {reasignacion.tipo_equipo}")
    c.drawString(300, height - 120, f"Marca: {reasignacion.marca}")
    c.drawString(50, height - 140, f"Nomenclatura: {reasignacion.nomenclatura}")
    c.drawString(300, height - 140, f"Modelo: {reasignacion.modelo}")
    c.drawString(50, height - 160, f"Service Tag: {reasignacion.service_tag}")
    c.drawString(300, height - 160, f"Serie: {reasignacion.serie}")
    c.drawString(50, height - 180, f"Inventario: {reasignacion.inventario}")
    c.drawString(300, height - 180, f"Fecha de Traslado: {reasignacion.fecha_traslado.strftime('%Y-%m-%d')}")
    c.drawString(50, height - 200, f"Propiedad: {reasignacion.propiedad}")
    c.drawString(50, height - 220, f"Accesorios: {reasignacion.accesorios}")

    # Sección 2: Usuario Emisor
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 260, "II. Información del Usuario Emisor")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 280, f"Unidad/Depto: {reasignacion.unidad_emisor}")
    c.drawString(300, height - 280, f"Responsable: {reasignacion.responsable_emisor}")
    c.drawString(50, height - 300, f"Correo: {reasignacion.correo_emisor}")
    c.drawString(300, height - 300, f"Número de Empleado: {reasignacion.empleado_emisor}")
    c.drawString(50, height - 320, f"Ubicación Física: {reasignacion.ubicacion_emisor}")

    # Sección 3: Usuario Receptor
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 360, "III. Información del Usuario Receptor")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 380, f"Unidad/Depto: {reasignacion.unidad_receptor}")
    c.drawString(300, height - 380, f"Responsable: {reasignacion.responsable_receptor}")
    c.drawString(50, height - 400, f"Correo: {reasignacion.correo_receptor}")
    c.drawString(300, height - 400, f"Número de Empleado: {reasignacion.empleado_receptor}")
    c.drawString(50, height - 420, f"Ubicación Física: {reasignacion.ubicacion_receptor}")

    # Sección 4: Observaciones
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 460, "IV. Observaciones")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 480, f"{reasignacion.observaciones}")

    # Espacio para firmas
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 520, "_________________________")
    c.drawString(300, height - 520, "_________________________")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 535, "Firma del Usuario Emisor")
    c.drawString(300, height - 535, "Firma del Usuario Receptor")

    # Guardar el PDF
    c.save()

    # Enviar el archivo al usuario
    return send_file(pdf_path, as_attachment=True)



@app.route('/generar_word/<int:id>')
def generar_word(id):
    # Obtener la reasignación desde la base de datos
    reasignacion = Reasignacion.query.get(id)

    if not reasignacion:
        return "Error: No se encontró la reasignación con ID {}".format(id), 404

    # Crear documento de Word
    doc = Document()

    # Sección 1: Información del Equipo
    p = doc.add_paragraph()
    run = p.add_run("I. INFORMACIÓN DEL EQUIPO")
    run.bold = True
    run.font.size = Pt(12)
    p.alignment = 1  # Centrar texto

    table = doc.add_table(rows=6, cols=4)
    table.style = 'Table Grid'

    # Ajustar anchos de columna
    col_widths = [2000, 3000, 2000, 3000]

    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # Rellenar la tabla
    data = [
        ("Tipo de Equipo:", reasignacion.tipo_equipo, "Marca:", reasignacion.marca),
        ("Nomenclatura:", reasignacion.nomenclatura, "Modelo:", reasignacion.modelo),
        ("Service TAG:", reasignacion.service_tag, "Inventario:", reasignacion.inventario),
        ("Serie:", reasignacion.serie, "Fecha de Traslado:", reasignacion.fecha_traslado.strftime('%Y-%m-%d')),
        ("Condiciones del equipo:", "Nuevo (  )  Usado (  )", "Propiedad:", "Leasing (  )  Propio (  )"),
    ]


    for row_idx, row_data in enumerate(data):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            cell.paragraphs[0].runs[0].font.size = Pt(10)

    # Eliminar la fila extra y corregir "Componentes o Accesorios Entregados" y "Observaciones"
    table.add_row()
    table.cell(5, 0).merge(table.cell(5, 1))  # Convertir en 2 columnas
    table.cell(5, 2).merge(table.cell(5, 3))  # Convertir en 2 columnas
    p = table.cell(5, 0).paragraphs[0]
    p.add_run("Componentes o Accesorios Entregados:").bold = True
    table.cell(5, 2).text = reasignacion.accesorios if reasignacion.accesorios else "____________________"

    table.add_row()
    table.cell(6, 0).merge(table.cell(6, 1))  # Convertir en 2 columnas
    table.cell(6, 2).merge(table.cell(6, 3))  # Convertir en 2 columnas
    p = table.cell(6, 0).paragraphs[0]
    p.add_run("Observaciones:").bold = True
    table.cell(6, 2).text = reasignacion.observaciones if reasignacion.observaciones else "____________________"

    # Ajustar la altura de las filas para que sean más grandes
    table.rows[5].height = Pt(50)  # Hacer más grande "Componentes o Accesorios"
    table.rows[6].height = Pt(50)  # Hacer más grande "Observaciones"
    # 🔥 ELIMINAR FILAS EXCEDENTES 🔥
    while len(table.rows) > 7:  # Asegurar que solo haya 7 filas en total
     table._element.remove(table.rows[-1]._element)

# 🔥 NO AGREGAMOS MÁS FILAS DESPUÉS DE OBSERVACIONES 🔥
 
    # Sección 2: Información Usuario Emisor
    p = doc.add_paragraph()
    run = p.add_run("II. INFORMACIÓN USUARIO EMISOR")
    run.bold = True
    run.font.size = Pt(12)
    p.alignment = 1  # Centrar texto

    table = doc.add_table(rows=4, cols=2)
    table.style = 'Table Grid'

    data = [
        ("Unidad o Depto.:", reasignacion.unidad_emisor),
        ("Responsable que entrega el equipo:", reasignacion.responsable_emisor),
        ("Correo Institucional:", f"{reasignacion.correo_emisor}    No. Empleado: {reasignacion.empleado_emisor}"),
        ("Ubicación Física:", reasignacion.ubicacion_emisor)
    ]

    for row_idx, row_data in enumerate(data):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            cell.paragraphs[0].runs[0].font.size = Pt(10)

    # Sección 3: Información Usuario Receptor
    p = doc.add_paragraph()
    run = p.add_run("III. INFORMACIÓN USUARIO RECEPTOR")
    run.bold = True
    run.font.size = Pt(12)
    p.alignment = 1  # Centrar texto

    table = doc.add_table(rows=4, cols=2)
    table.style = 'Table Grid'

    data = [
        ("Unidad o Depto.:", reasignacion.unidad_receptor),
        ("Responsable que recibe el equipo:", reasignacion.responsable_receptor),
        ("Correo Institucional:", f"{reasignacion.correo_receptor}    No. Empleado: {reasignacion.empleado_receptor}"),
        ("Ubicación Física:", reasignacion.ubicacion_receptor)
    ]

    for row_idx, row_data in enumerate(data):
        for col_idx, text in enumerate(row_data):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            cell.paragraphs[0].runs[0].font.size = Pt(10)

    # Agregar el código "GT FRM-001" fuera de la tabla
    p = doc.add_paragraph("GT FRM-001")
    p.alignment = 2  # Alineado a la derecha

    # Sección de Firmas
    p = doc.add_paragraph()
    run = p.add_run("USUARIO EMISOR:")
    run.bold = True
    run.font.size = Pt(12)

    run = p.add_run("\t\t\t\t\t\t")  # Espaciado para alinear
    run = p.add_run("USUARIO RECEPTOR:")
    run.bold = True
    run.font.size = Pt(12)

    p = doc.add_paragraph()
    p.add_run("Nombre: __________________________\t\t\t\t\tNombre: __________________________").font.size = Pt(10)

    p = doc.add_paragraph()
    p.add_run("No. Empleado: ____________________\t\t\t\t\tNo. Empleado: ____________________").font.size = Pt(10)

    p = doc.add_paragraph()
    p.add_run("Firma: ___________________________\t\t\t\t\tFirma: ___________________________").font.size = Pt(10)

    # Guardar el documento en memoria
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name=f"reasignacion_{id}.docx", mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
# Asegurar que la aplicación se ejecute correctamente

@app.route('/marcar_componente_obsoleto', methods=['POST'])
def marcar_componente_obsoleto():
    computadora_id = request.form.get('computadora_id')
    tipo_componente = request.form.get('tipo_componente')  # 'monitor' o 'teclado'
    motivo = request.form.get('motivo')  # Razón de obsolescencia

    computadora = Computadora.query.get(computadora_id)
    
    if not computadora:
        return jsonify({'message': 'Computadora no encontrada'}), 404

    # Determinar qué componente estamos marcando como obsoleto
    if tipo_componente == 'monitor':
        modelo_componente = computadora.monitor
        computadora.monitor = None  # Se vacía el campo en la tabla `computadoras`
        computadora.monitor_obsoleto = True  # Se marca como obsoleto
    elif tipo_componente == 'teclado':
        modelo_componente = computadora.teclado
        computadora.teclado = None  # Se vacía el campo en la tabla `computadoras`
        computadora.teclado_obsoleto = True  # Se marca como obsoleto
    else:
        return jsonify({'message': 'Tipo de componente inválido'}), 400

    # Guardar el componente en la tabla `componentes_defectuosos`
    componente_defectuoso = ComponenteDefectuoso(
        tipo_componente=tipo_componente.capitalize(),
        modelo=modelo_componente,
        motivo=motivo,
        computadora_id=computadora.id
    )
    db.session.add(componente_defectuoso)

    # Guardar cambios en la base de datos
    db.session.commit()

    return jsonify({'message': f'{tipo_componente.capitalize()} marcado como obsoleto correctamente'}), 200


#---ruta para empleados----
@app.route('/empleados_page')
@login_required
def empleados_page():
    return render_template('empleados.html', rol=current_user.rol)



if __name__ == '__main__':
 with app.app_context():
     db.create_all() 
 app.run(debug=True)