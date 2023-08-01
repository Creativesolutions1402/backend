const checkRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.user.role;
  
      if (roles.includes(userRole)) {
        next();
      } else {
        res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
      }
    };
  };
  
  module.exports = checkRole;
  