const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('authMiddleware token:', req.headers.authorization);

    if (!token) {
        return res.status(401).json({ message: 'Неавторизованный доступ, токен отсутствует' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Добавляем декодированный токен в `req.user`
        console.log('authMiddleware decoded:', decoded);
        next();
    } catch (error) {
        console.error('Ошибка в authMiddleware:', error);
        res.status(401).json({ message: 'Неавторизованный доступ, токен недействителен' });
    }
};
