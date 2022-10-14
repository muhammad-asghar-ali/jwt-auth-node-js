const jwt = require('jsonwebtoken')
const createError = require('http-errors')
const client = require('./initRadis')

module.exports.signAccessToken = async userId => {
    const payload = {
        aud: userId
    }
    const secret = process.env.ACCESSTOKENSECRET
    const options = {
        expiresIn: '1h',
        issuer: 'learning',
        // audience: [userId],
    }
    const accessToken = jwt.sign(payload, secret, options)
    if (!accessToken) {
        return createError.InternalServerError()
    }
    return accessToken
}

module.exports.verifyAccessToken = (req, res, next) => {
    try {
        if (!req.headers['authorization']) return next(createError.Unauthorized())
        const authHeader = req.headers['authorization']
        const bearerToken = authHeader.split(' ')
        const token = bearerToken[1]
        jwt.verify(token, process.env.ACCESSTOKENSECRET, (err, payload) => {
            if (err) {
                const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
                return next(createError.Unauthorized(message))
            }
            req.payload = payload
            next()
        })
    } catch (err) {
        next(err)
    }
}

module.exports.signRefreshToken = async userId => {
    const payload = {
        aud: userId
    }
    const secret = process.env.REFRESHTOKENSECRET
    const options = {
        expiresIn: '1y',
        issuer: 'learning',
        // audience: [userId],
    }
    const accessToken = jwt.sign(payload, secret, options)
    if (!accessToken) {
        return createError.InternalServerError()
    }
    client.SET(userId, accessToken, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
        if (err) {
          console.log(err.message)  
          return createError.InternalServerError()          
        }
        return accessToken
      })
    // return accessToken
}

module.exports.verifyRefreshToken = async refreshToken => {
    jwt.verify(refreshToken, process.env.REFRESHTOKENSECRET, (err, payload) => {
        if (err) {
            return next(createError.Unauthorized(message))
        }
        const userId = payload.aud
        client.GET(userId, (err, result) => {
            if (err) {
              console.log(err.message)
              reject(createError.InternalServerError())
              return
            }
            if (refreshToken === result) return resolve(userId)
            reject(createError.Unauthorized())
          })
    })
}
