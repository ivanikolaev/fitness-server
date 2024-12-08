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

router.get('/', authMiddleware, async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: 'Укажите user_id' });
    }

    try {
        const pool = req.pool;

        // Запрос объединяет тренировки и упражнения с их данными
        const query = `
            SELECT 
                w.id AS workout_id, 
                w.type, 
                w.date, 
                e.id AS exercise_id, 
                e.name AS exercise_name, 
                e.weight, 
                e.repetitions, 
                e.calories_burned
            FROM workouts w
            LEFT JOIN workout_exercises we ON w.id = we.workout_id
            LEFT JOIN exercises e ON we.exercise_id = e.id
            WHERE w.user_id = $1
        `;

        const result = await pool.query(query, [user_id]);

        // Группируем тренировки и связанные упражнения
        const workouts = result.rows.reduce((acc, row) => {
            const { workout_id, type, date, exercise_id, exercise_name, weight, repetitions, calories_burned } = row;

            // Находим или создаем тренировку
            let workout = acc.find((w) => w.id === workout_id);
            if (!workout) {
                workout = {
                    id: workout_id,
                    type,
                    date,
                    exercises: [],
                };
                acc.push(workout);
            }

            // Добавляем упражнение с параметрами, если оно есть
            if (exercise_id) {
                workout.exercises.push({
                    id: exercise_id,
                    name: exercise_name,
                    weight,
                    repetitions,
                    calories_burned,
                });
            }

            return acc;
        }, []);

        res.status(200).json(workouts);
    } catch (error) {
        console.error('Ошибка при получении тренировок:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


// Удаление тренировки
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const pool = req.pool;
        const result = await pool.query('DELETE FROM workouts WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Тренировка не найдена' });
        }

        res.status(200).json({ message: 'Тренировка успешно удалена', workout: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при удалении тренировки:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Обновление тренировки
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { type, date, exercises } = req.body;

    if (!type || !date || !exercises || exercises.length === 0) {
        return res.status(400).json({ message: 'Заполните все поля (type, date, exercises)' });
    }

    try {
        const pool = req.pool;

        // Обновляем основные данные тренировки
        const updateWorkoutResult = await pool.query(
            'UPDATE workouts SET type = $1, date = $2 WHERE id = $3 RETURNING *',
            [type, date, id]
        );

        if (updateWorkoutResult.rowCount === 0) {
            return res.status(404).json({ message: 'Тренировка не найдена' });
        }

        // Удаляем старые связи с упражнениями
        await pool.query('DELETE FROM workout_exercises WHERE workout_id = $1', [id]);

        // Добавляем новые связи с упражнениями
        for (const exercise of exercises) {
            // Проверяем, существует ли упражнение
            const exerciseCheck = await pool.query(
                'SELECT * FROM exercises WHERE id = $1',
                [exercise.exercise_id]
            );

            if (exerciseCheck.rowCount > 0) {
                // Если данные отличаются, обновляем упражнение
                const existingExercise = exerciseCheck.rows[0];
                if (
                    existingExercise.weight !== exercise.weight ||
                    existingExercise.repetitions !== exercise.repetitions
                ) {
                    await pool.query(
                        'UPDATE exercises SET weight = $1, repetitions = $2 WHERE id = $3',
                        [exercise.weight, exercise.repetitions, exercise.exercise_id]
                    );
                }
            } else {
                return res.status(404).json({
                    message: `Упражнение с ID ${exercise.exercise_id} не найдено`,
                });
            }

            // Добавляем связь тренировки с упражнением
            await pool.query(
                'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES ($1, $2)',
                [id, exercise.exercise_id]
            );
        }

        // Получаем обновленную тренировку
        const updatedWorkoutResult = await pool.query(`
            SELECT w.id, w.type, w.date, e.id AS exercise_id, e.name AS exercise_name, e.weight, e.repetitions
            FROM workouts w
            LEFT JOIN workout_exercises we ON w.id = we.workout_id
            LEFT JOIN exercises e ON we.exercise_id = e.id
            WHERE w.id = $1
        `, [id]);

        const updatedWorkout = updatedWorkoutResult.rows.reduce((acc, row) => {
            const { id, type, date, exercise_id, exercise_name, weight, repetitions } = row;

            let workout = acc.find(w => w.id === id);
            if (!workout) {
                workout = { id, type, date, exercises: [] };
                acc.push(workout);
            }

            if (exercise_id) {
                workout.exercises.push({ id: exercise_id, name: exercise_name, weight, repetitions });
            }

            return acc;
        }, [])[0];

        res.status(200).json({ message: 'Тренировка успешно обновлена', workout: updatedWorkout });
    } catch (error) {
        console.error('Ошибка при обновлении тренировки:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


module.exports = router;
