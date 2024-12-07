const express = require('express');
const router = express.Router();
const validateInput = require('../middleware/validateInput');
const authorizeUser = require('../middleware/authorizeUser');
const authMiddleware = require('../middleware/authMiddleware');

// Обновление данных пользователя
router.put('/:id', validateInput(['name', 'email', 'height', 'weight']), authMiddleware, authorizeUser, async (req, res) => {
    const { id } = req.params;
    const { name, email, height, weight } = req.body;

    try {
        const pool = req.pool;
        const query = `
            UPDATE users
            SET name = $1, email = $2, height = $3, weight = $4
            WHERE id = $5
            RETURNING *;
        `;
        const values = [name, email, height, weight, id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.status(200).json({
            message: 'Профиль пользователя успешно обновлен',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Ошибка при обновлении профиля пользователя:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;