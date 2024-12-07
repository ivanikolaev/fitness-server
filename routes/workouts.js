const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

// Добавление тренировки
router.post('/', async (req, res) => {
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

module.exports = router;
