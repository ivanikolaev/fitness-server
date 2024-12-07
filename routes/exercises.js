const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Добавление упражнения
router.post('/', async (req, res) => {
    const { name, weight, repetitions, calories_burned } = req.body;

    if (!name || !weight || !repetitions || !calories_burned) {
        return res.status(400).json({ message: 'Заполните все поля (name, weight, repetitions, calories_burned)' });
    }

    try {
        const pool = req.pool;

        // Добавление упражнения
        await pool.query(
            'INSERT INTO exercises (name, weight, repetitions, calories_burned) VALUES ($1, $2, $3, $4)',
            [name, weight, repetitions, calories_burned]
        );

        res.status(201).json({ message: 'Упражнение успешно добавлено' });
    } catch (error) {
        console.error('Ошибка при добавлении упражнения:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
