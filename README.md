# Desafío Skate Park

La implementación de la autenticación se realiza utilizando bcrypt para el hash de contraseñas, lo cual requiere modificar la tabla en la base de datos para que la columna de contraseñas tenga una longitud suficiente.

## Modificación de la Tabla en la Base de Datos

Se debe modificar la tabla `skaters` en la base de datos para ajustar la columna `password` y permitir el uso de bcrypt.

```sql
CREATE TABLE skaters (
    id SERIAL PRIMARY KEY,
    email VARCHAR(50) NOT NULL,
    nombre VARCHAR(25) NOT NULL,
    password VARCHAR(255) NOT NULL,
    anos_experiencia INT NOT NULL,
    especialidad VARCHAR(50) NOT NULL,
    foto VARCHAR(255) NOT NULL,
    estado BOOLEAN NOT NULL
);
