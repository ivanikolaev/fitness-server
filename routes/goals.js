const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

router.post('/', async (req, res) => {
    const { user_id, exercise_id, target_pr } = req.body;

    if (!user_id || !exercise_id || target_pr === undefined) {
        return res.status(400).json({ message: 'Заполните все поля (user_id, exercise_id, target_pr)' });
    }

    try {
        const pool = req.pool;
        const result = await pool.query(
            'INSERT INTO goals (user_id, exercise_id, target_pr) VALUES ($1, $2, $3) RETURNING id',
            [user_id, exercise_id, target_pr]
        );
        res.status(201).json({ message: 'Цель успешно создана', goal_id: result.rows[0].id });
    } catch (error) {
        console.error('Ошибка при создании цели:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/', async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: 'Укажите user_id' });
    }

    try {
        const pool = req.pool;
        const result = await pool.query(
            'SELECT * FROM goals WHERE user_id = $1',
            [user_id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении целей:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.put('/:id', async (req, res) => {
    const { target_pr } = req.body;
    const { id } = req.params;

    if (target_pr === undefined) {
        return res.status(400).json({ message: 'Укажите новый target_pr' });
    }

    try {
        const pool = req.pool;
        const result = await pool.query(
            'UPDATE goals SET target_pr = $1 WHERE id = $2 RETURNING *',
            [target_pr, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Цель не найдена' });
        }

        res.status(200).json({ message: 'Цель успешно обновлена', goal: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при обновлении цели:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const pool = req.pool;
        const result = await pool.query(
            'DELETE FROM goals WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Цель не найдена' });
        }

        res.status(200).json({ message: 'Цель успешно удалена' });
    } catch (error) {
        console.error('Ошибка при удалении цели:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;