const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

router.get('/', async (req, res) => {
    try {
        const pool = req.pool;
        const result = await pool.query('SELECT * FROM logs');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении логов:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.get('/user/:user_id', async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
        return res.status(400).json({ message: 'Укажите user_id' });
    }
    
    try {
        const pool = req.pool;
        const result = await pool.query('SELECT * FROM logs WHERE user_id = $1', [user_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(`Ошибка при получении логов пользователя с id ${user_id}:`, error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.post('/', async (req, res) => {
    const { user_id, workout_id, date } = req.body;

    if (!user_id || !workout_id || !date) {
        return res.status(400).json({ message: 'Заполните все поля (user_id, workout_id, date)' });
    }

    try {
        const pool = req.pool;
        const result = await pool.query(
            'INSERT INTO logs (user_id, workout_id, date) VALUES ($1, $2, $3) RETURNING id',
            [user_id, workout_id, date]
        );
        res.status(201).json({ message: 'Лог успешно добавлен', log_id: result.rows[0].id });
    } catch (error) {
        console.error('Ошибка при добавлении лога:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const pool = req.pool;
        const result = await pool.query('DELETE FROM logs WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Лог не найден' });
        }

        res.status(200).json({ message: 'Лог успешно удален' });
    } catch (error) {
        console.error('Ошибка при удалении лога:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
