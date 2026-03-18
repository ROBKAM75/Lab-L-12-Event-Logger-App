import {
  PushDrop,
  Utils,
  Transaction,
  WalletInterface,
  WERR_REVIEW_ACTIONS,
  LockingScript
} from '@bsv/sdk'

export interface EventLogResult {
  txid: string
  message: string
  timestamp: string
}

export class EventLogger {
  private wallet: WalletInterface
  private pushdrop: PushDrop

  private readonly PROTOCOL_ID: [1, string] = [1, 'Event Logger']
  private readonly KEY_ID = '1'
  private readonly BASKET_NAME = 'event logs v2'

  constructor(wallet: WalletInterface) {
    this.wallet = wallet
    this.pushdrop = new PushDrop(wallet)
  }

  async logEvent(
    eventData: Record<string, any>,
    testWerrLabel = false
  ): Promise<Omit<EventLogResult, 'timestamp'>> {
    const timestamp = new Date().toISOString()
    const ip = 'unknown'
    const endpoint = '/log-event'

    const payload = {
      ip,
      timestamp,
      endpoint,
      ...eventData
    }

    // TODO 1: Validate eventData and enhance error handling
    if (!eventData || typeof eventData !== 'object' || Object.keys(eventData).length === 0) {
      throw new Error('Event data is required')
    }

    try {
      // TODO 2: Validate PushDrop script generation
      const fieldBytes = Utils.toArray(JSON.stringify(payload), 'utf8')
      const lockingScript = await this.pushdrop.lock(
        [fieldBytes],
        this.PROTOCOL_ID,
        this.KEY_ID,
        'self',
        true
      )
      console.log('[logEvent] PushDrop locking script created')

      // TODO 3: Validate transaction ID and handle broadcast errors
      const result = await this.wallet.createAction({
        description: 'Log event to blockchain',
        outputs: [{
          lockingScript: lockingScript.toHex(),
          satoshis: 1,
          outputDescription: 'PushDrop event log output',
          basket: this.BASKET_NAME
        }]
      })

      const txid = result.txid
      console.log('[logEvent] Transaction created, txid:', txid)

      return {
        txid: txid ?? 'unknown-txid',
        message: 'Event logged successfully'
      }
    } catch (err: unknown) {
      if (err instanceof WERR_REVIEW_ACTIONS) {
        console.error('[logEvent] Wallet threw WERR_REVIEW_ACTIONS:', {
          code: err.code,
          message: err.message,
          reviewActionResults: err.reviewActionResults,
          sendWithResults: err.sendWithResults,
          txid: err.txid,
          tx: err.tx,
          noSendChange: err.noSendChange
        })
      } else if (err instanceof Error) {
        console.error('[logEvent] Failed with error status:', {
          message: err.message,
          name: err.name,
          stack: err.stack,
          error: err
        })
      } else {
        console.error('[logEvent] Failed with unknown error:', err)
      }
      throw err
    }
  }

  async retrieveLogs(): Promise<EventLogResult[]> {
    console.log('[retrieveLogs] Fetching outputs from basket:', this.BASKET_NAME)

    // TODO 4: Optimize log retrieval for large datasets
    const BEEF = await this.wallet.listOutputs({
      basket: this.BASKET_NAME,
      include: 'locking scripts',
      limit: 10000
    })

    if (!BEEF) {
      console.warn('[retrieveLogs] No BEEF returned, cannot proceed.')
      return []
    }

    const logs: EventLogResult[] = []

    // TODO 5: Process blockchain data with validation and optimization
    for (const output of BEEF.outputs) {
      try {
        if (!output.lockingScript) continue
        const decoded = PushDrop.decode(LockingScript.fromHex(output.lockingScript))
        const jsonStr = Utils.toUTF8(decoded.fields[0])
        const parsed = JSON.parse(jsonStr)
        logs.push({
          txid: output.outpoint?.split('.')[0] || 'unknown',
          message: jsonStr,
          timestamp: parsed.timestamp || new Date().toISOString()
        })
      } catch (err) {
        console.warn('[retrieveLogs] Failed to decode output:', err)
      }
    }

    console.log(`[retrieveLogs] Decoded ${logs.length} log entries`)
    return logs
  }
}
