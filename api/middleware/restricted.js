const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../secrets/index')

module.exports = (req, res, next) => {
  /*
    IMPLEMENT

    1- On valid token in the Authorization header, call next.

    2- On missing token in the Authorization header,
      the response body should include a string exactly as follows: "token required".

    3- On invalid or expired token in the Authorization header,
      the response body should include a string exactly as follows: "token invalid".
  */
  const token = req.headers.authorization;

  jwt.verify(token, JWT_SECRET, async (err, decodedToken) => {
    if(!token){
      res.json('token required')
      return;
    } else if (err) {
      res.json('token invalid');
      return;
    } else {
      req.decodedJwt = decodedToken;
      next();
    }
  })
};

