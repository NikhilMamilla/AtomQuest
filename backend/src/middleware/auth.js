const jwt = require('jsonwebtoken')

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'No token provided',
      message: 'No token provided' 
    })
  }

  const token = header.split(' ')[1]
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_change_this')
    next()
  } catch {
    res.status(401).json({ 
      error: 'Invalid or expired token',
      message: 'Invalid or expired token' 
    })
  }
}
