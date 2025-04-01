import psycopg2

# URL de conexión desde Railway
DATABASE_URL = "postgresql://postgres:viqVSHTJagoHbtYkytwtKFapwPsSqiEi@shinkansen.proxy.rlwy.net:47285/railway"

try:
    # Conectar a la base de datos
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Ejecutar una consulta de prueba
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    
    print(f"Conectado a PostgreSQL, versión: {version[0]}")
    
    # Cerrar conexión
    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error al conectar: {e}")
