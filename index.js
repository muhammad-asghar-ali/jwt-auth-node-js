require('dotenv').config()
const express = require("express")
const cors = require('cors')
const morgan = require('morgan')
const createError = require('http-errors')
const authRoutes = require('./Routes/authRoutes')
const { verifyAccessToken } = require('./helpers/jwtHelper')
require('./helpers/initRadis')


const app = express()
const port = process.env.PORT

// middleweares
app.use(cors())
app.use(morgan('tiny'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// db connection
require('./helpers/initMongo')

// protected routes

app.get('/', verifyAccessToken, async (req, res, next) => {
    res.status(200).send({ message: 'Hello from express.' })
})

// auth routes
app.use('/api/auth', authRoutes)

app.use(async (req, res, next) => {
    // const error = new Error("Not Found")
    // error.status = 404
    // next(error)
    next(createError.NotFound())
})

app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.send({
        error: {
            status: err.status || 500,
            message: err.message,
        },
    })
})

app.listen(port, () => {
    console.log(`App is runnig on port ${port}`)
})