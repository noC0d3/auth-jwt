const express = require('express')
let bodyParser = require('body-parser')
let jwt = require('jsonwebtoken');
const Sequelize = require('sequelize')

// initialize an instance of Sequelize
const sequelize = new Sequelize({
    host: 'kangkode',
    database: 'titiktemu',
    username: 'root',
    password: 'root',
    dialect: 'mysql'
})

// check the database connection
sequelize
    .authenticate()
    .then(() => console.log('Connection has been established successfully.'))
    .catch(err => console.error('Unable to connect to the database:', err))

// create user Model
const User = sequelize.define('user', {
    name: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    }
})

// create some helper function to work on the database
const createUser = async ({ name, password }) => {
    return await User.create({ name, password })
}

const getAllUsers = async () => {
    return await User.findAll()
}

const getUser = async (obj, attr) => {
    return await User.findOne({ where: obj, attributes: attr })
}

// import passport and passport-jwt modules
let passport = require('passport')
let passportJWT = require('passport-jwt')

// ExtractJWT to help extract the token
let ExtractJWT = passportJWT.ExtractJwt

// JwtStrategy which is the strategy for the authentication
let JwtStrategy = passportJWT.Strategy
let jwtOptions = {}

jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeaderAsBearerToken()
jwtOptions.secretOrKey = 'badakberculasatu'

// lets create our strategy for web token
let strategy = new JwtStrategy(jwtOptions, async function (jwt_payload, next) {
    console.log('payload received', jwt_payload)
    let user = await getUser({ id: jwt_payload.id }, ['id', 'name'])
    if (user) {
        next(null, user)
    } else {
        console.log('unauthorized')
        // next(null, false)
        res.json({ message: 'Unauthorized' })
    }
})

// use the strategy
passport.use(strategy)

const app = express()

// parse application/json
app.use(bodyParser.json())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

app.use(passport.initialize())

// create table with user model
User.sync()
    .then(() => console.log('Oh yeah! User table created successfully'))
    .catch(err => console.log('BTW, did you enter wrong database credential?'))

// add a basic route
app.get('/', function (req, res) {
    res.json({ message: 'Express is up!' })
})

// get all users
app.get('/users', function (req, res) {
    getAllUsers().then(user => res.json({
        message: 'ok',
        user: user
    }))
})

// register user
app.post('/register', function (req, res, next) {
    const { name, password } = req.body
    createUser({ name, password }).then(user => 
        res.json({ message: 'account created successfully', user: user })
    )
})

// login route
app.post('/login', async function (req, res, next) {
    const { name, password } = req.body
    if (name && password) {
        let user = await getUser({ name }, '')
        if (!user) {
            res.status(401).json({ message: 'No such user found', user: user })
        }

        if (user.password === password) {
            let payload = { id: user.id, name: user.name }
            let token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: 60 })
            res.json({ message: 'ok', token: token})
        } else {
            res.status(401).json({ message: 'Password is incorect'})
        }
    }
})

app.get('/protected', passport.authenticate('jwt', { session: false }), function (req, res) {
    console.log(req.user.id)
    res.json({ message: 'My Protected ID ' + req.user.id + ' and My Name is ' + req.user.name })
})

// start the app
app.listen(2405, function () {
    console.log('Express is running on port 2405')
})