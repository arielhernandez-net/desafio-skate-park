const express = require('express');
const client = require('./db');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { engine } = require('express-handlebars');
require('dotenv').config();

const app = express();
const port = 3000;
const SECRET_KEY = process.env.JWT_SECRET;

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

app.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM skaters');
        const usuarios = result.rows;

        if (!usuarios || usuarios.length === 0) {
            throw new Error('Usuarios no encontrados');
        }

        res.render('index', { title: 'Lista de Participantes', usuarios });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al obtener los usuarios');
    }
});

app.get('/admin', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM skaters');
        const usuarios = result.rows;

        if (!usuarios || usuarios.length === 0) {
            throw new Error('Usuarios no encontrados');
        }

        res.render('admin', { title: 'Administración de Usuarios', usuarios });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al obtener los usuarios');
    }
})

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Registro.html'));
});

// Se modifica tabla en la base de datos para que la columna password tenga logitud 255 y poder usar bcrypt

/* CREATE TABLE skaters (id SERIAL, email VARCHAR(50) NOT NULL, nombre
VARCHAR(25) NOT NULL, password VARCHAR(255) NOT NULL, anos_experiencia
INT NOT NULL, especialidad VARCHAR(50) NOT NULL, foto VARCHAR(255) NOT
NULL, estado BOOLEAN NOT NULL); */

app.post('/registro', async (req, res) => {
    const { email, nombre, password, experiencia, especialidad } = req.body;
    const profilePic = req.files ? req.files.profilePic : null;

    if (!email || !nombre || !password || !experiencia || !especialidad || !profilePic) {
        return res.status(400).send('Todos los campos son obligatorios.');
    }

    const uploadPath = path.join(__dirname, 'public/img', profilePic.name);
    profilePic.mv(uploadPath, async (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const result = await client.query(
                'INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [email, nombre, hashedPassword, experiencia, especialidad, profilePic.name, false]
            );
            res.redirect('/login?RegistroExitoso')
        } catch (dbError) {
            console.error(dbError);
            res.status(500).send('Error al guardar los datos en la base de datos.');
        }
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email y password son obligatorios.');
    }

    try {
        const result = await client.query('SELECT * FROM skaters WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
                expiresIn: '1h'
            });

            res.json({ message: 'Inicio de sesión exitoso', token });
        } else {
            res.status(401).send('Credenciales inválidas');
        }
    } catch (dbError) {
        console.error(dbError);
        res.status(500).send('Error al verificar las credenciales.');
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(403).send('Token requerido');

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).send('Token inválido');
        req.user = user;
        next();
    });
}

app.get('/Datos.html', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Datos.html'));
});

app.get('/datos', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await client.query('SELECT email, nombre, anos_experiencia, especialidad FROM skaters WHERE id = $1', [userId]);
        const userData = result.rows[0];

        if (!userData) {
            throw new Error('Usuario no encontrado');
        }

        res.json(userData);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al obtener los datos del usuario');
    }
});

app.put('/actualizar', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, password, anos_experiencia, especialidad } = req.body;

        if (!nombre || !password || !anos_experiencia || !especialidad) {
            return res.status(400).send('Todos los campos son obligatorios para la actualización del perfil.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await client.query(
            'UPDATE skaters SET nombre = $1, password = $2, anos_experiencia = $3, especialidad = $4 WHERE id = $5 RETURNING *',
            [nombre, hashedPassword, anos_experiencia, especialidad, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        res.json({ message: 'Perfil actualizado correctamente', user: result.rows[0] });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al actualizar el perfil del usuario');
    }
});

app.delete('/eliminar', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userQuery = await client.query('SELECT foto FROM skaters WHERE id = $1', [userId]);
        const user = userQuery.rows[0];

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        if (user.foto) {
            const imagePath = path.join(__dirname, 'public/img', user.foto);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const result = await client.query('DELETE FROM skaters WHERE id = $1 RETURNING *', [userId]);

        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        res.json({ message: 'Usuario eliminado correctamente' });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error al eliminar el usuario');
    }
});

app.put('/admin/actualizar/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { estado } = req.body;
        const result = await client.query('UPDATE skaters SET estado = $1 WHERE id = $2 RETURNING *', [estado, userId]);

        if (result.rows.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        res.json({ message: 'Estado del usuario actualizado correctamente', user: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send(`Error al actualizar el estado del usuario: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
