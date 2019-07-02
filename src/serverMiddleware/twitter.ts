import fs from 'fs'
import express from 'express'
import passport from 'passport'
import { Strategy, Profile } from 'passport-twitter'
import session from 'express-session'
import Twitter from 'twitter'
import bodyParser from 'body-parser'

const isProd: boolean = process.env.NODE_ENV === 'production'

const consumerKey: string = isProd
  ? process.env.TWITTER_CONSUMER_KEY
  : require('./twitter-credential').consumerKey
const consumerSecret: string = isProd
  ? process.env.TWITTER_CONSUMER_SECRET
  : require('./twitter-credential').consumerSecret

const app: express.Router = express.Router()

passport.serializeUser(
  (tokens: any, done: (err: any, id?: unknown) => void): void => {
    console.log('RUN: passport.serializeUser')
    console.log(tokens)
    return done(null, {
      ...tokens
    })
  }
)
passport.deserializeUser(
  (tokens: any, done: (err: any, id?: unknown) => void): void => {
    console.log('RUN: passport.deserializeUser')
    console.log(tokens)
    return done(null, tokens)
  }
)
passport.use(
  new Strategy(
    {
      consumerKey,
      consumerSecret,
      callbackURL: 'http://localhost:3000/api/twitter/callback'
    },
    (
      token: string,
      secretToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ): void => {
      console.log('Strategy')
      console.log(token, secretToken)
      done(null, {
        token,
        secretToken
      })
    }
  )
)

export default app
  .use(
    session({
      secret: 'secret',
      resave: false,
      saveUninitialized: false
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(bodyParser.json())
  .get(
    '/oauth/:filename',
    (req: any, res: express.Response, next: express.NextFunction): void => {
      if (req.session) {
        req.session.filename = req.params.filename
      }
      next()
    },
    passport.authenticate('twitter')
  )
  .get(
    '/callback',
    (req: any, res: express.Response, next: express.NextFunction): void => {
      passport.authenticate('twitter', {
        session: true,
        successRedirect: `/controller/share/${req.session &&
          req.session.filename}`
      })(req, res, next)
    }
  )
  .post(
    '/upload-media',
    async (req: any, res: express.Response): Promise<void> => {
      console.log('upload-media')
      if (!req.user) {
        res.status(500).json({
          error: 'no token'
        })
      }

      const client: Twitter = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        access_token_key: req.user.token,
        access_token_secret: req.user.secretToken
      })

      const mediaId: string | any = await uploadMedia(
        client,
        req.body.fileName
      ).catch((err: any) => err)

      console.log(mediaId)

      if (typeof mediaId !== 'string') {
        console.log(mediaId.error)
        res.status(500).json(mediaId.error)
        return
      }

      client.post(
        'statuses/update',
        {
          media_ids: mediaId,
          status: req.body.text
        },
        (error: any): void => {
          if (error) {
            res.status(500).json({
              error
            })

            return
          }

          res.status(200).json({
            message: 'share ok'
          })
        }
      )
    }
  )

async function uploadMedia(
  client: Twitter,
  fileName: string
): Promise<string | any> {
  const mediaFilePath: string = `${__dirname}/../static/animation-img/${fileName}.gif`

  try {
    const mediaSize: number | void = await getMediaSize(mediaFilePath)
    const mediaId: string | void = await mediaUploadInit(client, mediaSize)
    await mediaUploadAppend(client, mediaId, mediaFilePath)
    await mediaUploadFinalize(client, mediaId)

    return mediaId
  } catch (error) {
    return {
      error
    }
  }
}

function getMediaSize(filePath: string): Promise<number> {
  return new Promise(
    (resolve: (size: number) => void, reject: (reason: any) => void): void => {
      fs.stat(
        filePath,
        (error: any, stats: fs.Stats): void => {
          if (error) {
            reject(error)
            return
          }

          resolve(stats.size)
        }
      )
    }
  )
}

function mediaUploadInit(client: Twitter, mediaSize: number): Promise<string> {
  return new Promise(
    (resolve: (size: string) => void, reject: (reason: any) => void): void => {
      client.post(
        'media/upload',
        {
          command: 'INIT',
          total_bytes: mediaSize,
          media_type: 'image/gif'
        },
        (error: any, data: Twitter.ResponseData): void => {
          if (error) {
            reject(error)
            return
          }

          resolve(data.media_id_string)
        }
      )
    }
  )
}

function mediaUploadAppend(
  client: Twitter,
  mediaId: string,
  filePath: string
): Promise<void> {
  return new Promise(
    (resolve: () => void, reject: (reason: any) => void): void => {
      let segmentIndex: number = 0
      fs.createReadStream(filePath)
        .on(
          'data',
          (chunk: any[]): void => {
            client.post('media/upload', {
              command: 'APPEND',
              media_id: mediaId,
              media: chunk,
              segment_index: segmentIndex
            })

            segmentIndex++
          }
        )
        .on(
          'end',
          (): void => {
            console.log('end')
            resolve()
          }
        )
        .on(
          'error',
          (reason: any): void => {
            console.log('ERROR: createReadStream')
            console.log(reason)
            reject(reason)
          }
        )
    }
  )
}

function mediaUploadFinalize(
  client: Twitter,
  mediaId: string
): Promise<Twitter.ResponseData> {
  return new Promise(
    (
      resolve: (data: Twitter.ResponseData) => void,
      reject: (reason: any) => void
    ): void => {
      client.post(
        'media/upload',
        {
          command: 'FINALIZE',
          media_id: mediaId
        },
        (error: any, data: Twitter.ResponseData): void => {
          if (error) {
            console.error('Error: mediaUploadFinalize')
            reject(error)
            return
          }

          resolve(data)
        }
      )
    }
  )
}
