const router = require('express').Router();
const { JWT_SECRET } = require('../secrets/index');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../../data/dbConfig')


// model functions
async function register({username, password}) {
  const [id] = await db('users').insert({username, password})
  return db('users').select('id', 'username', 'password').where('id', id).first()
}


function findBy(filter) {
  return db("users as u")
    .select("u.id", "u.username", "u.password")
    .where(filter)
}

// additional middleware
async function checkUsernameFree(req, res, next) {
  try {
    const users = await db('users').where({username: req.body.username})
    if(!users.length) {
      next()
    } else {
      res.json("username taken")
    }
  } catch(error) {
    next(error)
  }
}

async function checkUsernameExists(req, res, next) {
  try {
    const [user] = await db('users').where({username: req.body.username})
    if(!user) {
      res.json("invalid credentials")
    } else {
      req.user = user
      next()
    }
  } catch(error) {
    next(error)
  }
}

function checkUsernameAndPassword(req, res, next) {
  if(!req.body.password || !req.body.username) {
    res.json("username and password required")
  } else {
    next()
  }
}

function buildToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  }
  const options = {
    expiresIn: '1d'
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

// endpoints
router.post('/register', checkUsernameAndPassword, checkUsernameFree, (req, res) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
  const { username, password } = req.body
  const hash = bcrypt.hashSync(password, 8)
    register({username, password: hash})
    .then(newUser => {
      res.status(201).json(newUser)
    })
    .catch()
});

router.post('/login', checkUsernameAndPassword, checkUsernameExists, (req, res, next) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
  const { username, password } = req.body

  findBy({username})
      .then(([user]) => {
          if (user && bcrypt.compareSync(password, req.user.password)) {
          res.json({ message: `Welcome, ${req.user.username}`, token: buildToken(user)
          })
        } else {
          next({ status: 401, message: "invalid credentials"})
        }
      })
      .catch(next)
  })


module.exports = router;
