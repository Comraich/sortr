const jwt = require('jsonwebtoken');

// Validate required environment variables
const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {
  console.error('FATAL ERROR: SECRET_KEY environment variable is required.');
  console.error('Generate one with: openssl rand -base64 32');
  process.exit(1);
}

// JWT authentication middleware
// Accepts token from httpOnly cookie (preferred) or Authorization header (fallback)
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token || (req.headers['authorization']?.split(' ')[1]);
  if (token == null) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken, SECRET_KEY };
