const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

// Добавление тренировки
router.post('/', authMiddleware, async (req, res) => {
    const { user_id, type, date, exercises } = req.body; // тип тренировки, дата и массив упражнений

    if (!user_id || !type || !date || !exercises || exercises.length === 0) {
        return res.status(400).json({ message: 'Заполните все поля (user_id, type, date, exercises)' });
    }

    try {
        const pool = req.pool;

        // Создание тренировки
        const result = await pool.query(
            'INSERT INTO workouts (user_id, type, date) VALUES ($1, $2, $3) RETURNING id',
            [user_id, type, date]
        );
        const workout_id = result.rows[0].id;

        // Добавление связей тренировки с упражнениями (many-to-many)
        for (const exercise_id of exercises) {
            await pool.query(
                'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES ($1, $2)',
                [workout_id, exercise_id]
            );
        }

        res.status(201).json({ message: 'Тренировка успешно добавлена', workout_id });
    } catch (error) {
        console.error('Ошибка при добавлении тренировки:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Получение всех тренировок
router.get('/', authMiddleware, async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: 'Укажите user_id' });
    }

    try {
        const pool = req.pool;
        const result = await pool.query('SELECT * FROM workouts WHERE user_id = $1', [user_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении тренировок:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
