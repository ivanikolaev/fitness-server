const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const workoutRoutes = require('./routes/workouts');
const exerciseRoutes = require('./routes/exercises');
const goalRoutes = require('./routes/goals');
const logRoutes = require('./routes/logs');
const userRoutes = require('./routes/users');
const authMiddleware = require('./middleware/authMiddleware');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Настройка подключения к PostgreSQL
const pool = new Pool({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
    // ssl: {
    //     rejectUnauthorized: false,
    // },
});

// Проверка подключения к базе данных
pool.connect((err, client, release) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.stack);
    } else {
        console.log('Успешное подключение к базе данных!');
        release(); // Освобождаем клиент после проверки
    }
});

// Middleware для парсинга JSON
app.use(cors());
app.use(express.json());

// Передача пула соединений в маршруты
app.use('/auth', (req, res, next) => {
    req.pool = pool;
    next();
}, authRoutes);

app.use('/workouts', (req, res, next) => {
    req.pool = pool;
    next();
}, workoutRoutes);

app.use('/exercises', (req, res, next) => {
    req.pool = pool;
    next();
}, exerciseRoutes);

app.use('/goals', (req, res, next) => {
    req.pool = pool;
    next();
}, goalRoutes);

app.use('/logs', (req, res, next) => {
    req.pool = pool;
    next();
}, logRoutes);

app.use('/users', (req, res, next) => {
    req.pool = pool;
    next();
}, userRoutes);

// Базовый роут
app.get('/', (req, res) => {
    res.send('Сервер работает!');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});
