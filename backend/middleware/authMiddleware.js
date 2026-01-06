const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autorizado. Token no proporcionado.' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'secret_key_123'
        );

        req.user = {
            empleadoId: decoded.id,
            isAdmin: decoded.isAdmin || decoded.EMP_Es_Administrador || false,
            puesto: decoded.puesto || null
        };

        next();
    } catch (error) {
        console.error('Error en auth middleware:', error);
        return res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

module.exports = { authMiddleware, isAdmin };
