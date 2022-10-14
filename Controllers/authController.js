const createError = require('http-errors')
const UserModel = require('../Models/userModel')
const { authSchema } = require('../helpers/validationSchema')
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwtHelper')

module.exports.register = async (req, res, next) => {
    try {
        const result = await authSchema.validateAsync(req.body)
        const doesExist = await UserModel.findOne({ email: result.email })
        if (doesExist) throw createError.Conflict(`${result.email} is already registered`)

        const user = await UserModel.create(result)
        const accessToken = await signAccessToken(user._id)
        const refreshToken = await signRefreshToken(user._id)

        res.status(200).json({ accessToken, refreshToken })
    } catch (err) {
        if (err.isJoi === true) err.status = 422
        next(err)
    }
}

module.exports.login = async (req, res, next) => {
    try {
        const result = await authSchema.validateAsync(req.body)
        const user = await UserModel.findOne({ email: result.email })
        if (!user) {
            throw createError.NotFound("User not Registered")
        }

        const isMatch = await user.isValidPassword(result.password)
        if (!isMatch) {
            throw createError.Unauthorized("Username or password is not vaild")
        }
        const accessToken = await signAccessToken(user._id)
        const refreshToken = await signRefreshToken(user._id)

        res.status(200).json({ accessToken, refreshToken })
    } catch (err) {
        if (err.isJoi === true) {
            return next(createError.BadRequest("Invalid Username or Password"))
        }
        next(err)
    }
}

module.exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) throw createError.BadRequest()

        const userId = await verifyRefreshToken(refreshToken)
        const accessToken = await signAccessToken(userId)
        const refreshTokenNew = await signRefreshToken(userId)

        res.status(200).json({ accessToken, refreshToken: refreshTokenNew })
    } catch (err) {
        next(err)
    }
}

module.exports.logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) throw createError.BadRequest()
        const userId = await verifyRefreshToken(refreshToken)
        client.DEL(userId, (err, val) => {
          if (err) {
            console.log(err.message)
            throw createError.InternalServerError()
          }
          console.log(val)
          res.sendStatus(204)
        })
      } catch (error) {
        next(error)
      }
}