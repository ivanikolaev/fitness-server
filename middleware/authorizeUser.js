module.exports = (req, res, next) => {
    const { id } = req.params; // ID ресурса, например, user_id
    const userIdFromToken = req.user.id; // Предполагаем, что `req.user` заполняется с помощью JWT

    if (Number(id) !== userIdFromToken) {
        return res.status(403).json({ message: 'Доступ запрещён: недостаточно прав' });
    }

    next();
};
