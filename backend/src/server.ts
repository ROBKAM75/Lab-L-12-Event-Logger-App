import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { Setup, sdk } from '@bsv/wallet-toolbox'
import { EventLogger, EventLogResult } from './EventLogger.js'

// Load env variables
dotenv.config()

const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || ''
const WALLET_STORAGE_URL = process.env.WALLET_STORAGE_URL || 'https://storage.babbage.systems'
const BSV_NETWORK = process.env.BSV_NETWORK || 'main'

interface LogEventRequest {
  eventData: Record<string, any>
}

interface LogEventResponse {
  txid: string
  message: string
}

const app: Express = express()
const port = process.env.PORT || 3000

async function initialize() {
  // TODO 1: Initialize BSV wallet
  const chain: sdk.Chain = BSV_NETWORK as sdk.Chain
  const wallet = await Setup.createWalletClientNoEnv({
    chain,
    rootKeyHex: SERVER_PRIVATE_KEY,
    storageUrl: WALLET_STORAGE_URL
  })
  console.log('Wallet initialized on chain:', chain)

  // TODO 2: Create EventLogger instance
  const eventLogger = new EventLogger(wallet)

  // TODO 3: Configure body-parser middleware
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  // TODO 4: Set up CORS middleware
  const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Expose-Headers', '*')
    res.header('Access-Control-Allow-Private-Network', 'true')
    if (req.method === 'OPTIONS') {
      res.sendStatus(200)
      return
    }
    next()
  }
  app.use(corsMiddleware)

  // TODO 5: Implement /log-event POST endpoint
  const logEventHandler: RequestHandler = async (req, res) => {
    try {
      const { eventData } = req.body as LogEventRequest

      if (!eventData || typeof eventData !== 'object' || Object.keys(eventData).length === 0) {
        res.status(400).json({ message: 'Event data is required' })
        return
      }

      const result = await eventLogger.logEvent(eventData)
      res.json({ txid: result.txid, message: result.message } as LogEventResponse)
    } catch (err) {
      console.error('Error logging event:', err)
      res.status(500).json({ message: 'Failed to log event' })
    }
  }
  app.post('/log-event', logEventHandler)

  // TODO 6: Implement /retrieve-logs GET endpoint
  const retrieveLogsHandler: RequestHandler = async (_req, res) => {
    try {
      const logs = await eventLogger.retrieveLogs()
      res.json({ logs })
    } catch (err) {
      console.error('Error retrieving logs:', err)
      res.status(500).json({ message: 'Failed to retrieve logs' })
    }
  }
  app.get('/retrieve-logs', retrieveLogsHandler)

  // TODO 7: Start the Express server
  app.listen(port, () => {
    console.log(`Event Logger server running on http://localhost:${port}`)
  })
}

initialize().catch(err => {
  console.error('Failed to initialize backend wallet:', err)
  process.exit(1)
})
