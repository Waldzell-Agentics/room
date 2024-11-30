import { loadAgreement, host } from '@agree-able/rpc'
import { signText, verifySignedText, generateChallengeText, getKeybaseProofChain } from '@agree-able/invite'
import Autobase from 'autobase'
import BlindPairing from 'blind-pairing'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import RAM from 'random-access-memory'
import z32 from 'z32'
import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * @typedef {Object} RoomManagerOptions
 * @property {Corestore} [corestore] - Optional preconfigured Corestore instance
 * @property {string} [storageDir] - Optional storage directory path
 * @property {Hyperswarm} [swarm] - Optional preconfigured Hyperswarm instance
 * @property {BlindPairing} [pairing] - Optional preconfigured BlindPairing instance
 */
/**
 * Manages multiple breakout rooms and their resources
 * @extends EventEmitter
 */
export class RoomManager extends EventEmitter {
  /**
   * Creates a new RoomManager instance
   * @param {RoomManagerOptions} [opts={}] - Configuration options
   */
  constructor (opts = {}) {
    super()
    this.internalManaged = { corestore: false, swarm: false, pairing: false }
    if (opts.corestore) this.corestore = opts.corestore
    else {
      this.internalManaged.corestore = true
      if (opts.storageDir) this.corestore = new Corestore(opts.storageDir)
      else this.corestore = new Corestore(RAM.reusable())
    }
    this.swarm = opts.swarm ? opts.swarm : (this.internalManaged.swarm = true, new Hyperswarm())
    this.pairing = opts.pairing ? opts.pairing : (this.internalManaged.pairing = true, new BlindPairing(this.swarm))
    this.rooms = {}
    this.challengeTexts = {} // move to a hyper thing later
  }

  /**
   * Gets configuration options for a new room
   * @param {string} roomId - Unique room identifier
   * @returns {Object} Room configuration options
   */
  getRoomOptions (roomId) {
    const corestore = roomId ? this.corestore.namespace(roomId) : this.corestore
    return { corestore, swarm: this.swarm, pairing: this.pairing }
  }

  /**
   * Creates a new breakout room
   * @param {Object} [opts={}] - Room configuration options
   * @param {string} [opts.invite] - Optional invite code
   * @param {Object} [opts.metadata] - Optional room metadata
   * @returns {BreakoutRoom} New room instance
   */
  createRoom (opts = {}) {
    const roomId = generateRoomId()
    const baseOpts = this.getRoomOptions(roomId)
    if (opts.invite) baseOpts.invite = opts.invite
    baseOpts.metadata = opts.metadata || {}
    baseOpts.roomId = roomId
    const room = new BreakoutRoom(baseOpts)
    this.rooms[roomId] = room
    room.on('roomClosed', () => {
      delete this.rooms[roomId]
      if (this.closingDown) return
      if (Object.keys(this.rooms).length > 0) return
      process.nextTick(() => this.emit('lastRoomClosed'))
    })
    process.nextTick(() => this.emit('newRoom', room))
    return room
  }

  async createReadyRoom (opts = {}) {
    const room = this.createRoom(opts)
    const invite = await room.ready()
    process.nextTick(() => this.emit('readyRoom', room))
    return invite
  }

  async startAgreeable (config, expectations, validateParticipant) {
    let privateKeyArmored = config.privateKeyArmored
    if (config.privateKeyArmoredFile) {
      privateKeyArmored = fs.readFileSync(resolvePath(config.privateKeyArmoredFile), 'utf8')
    }

    /** @type { z.infer<NewRoom> } newRoom */
    const newRoom = async (agreement, { remotePublicKey }) => {
      const participantDetails = { remotePublicKey }
      if (expectations.whoamiRequired) {
        if (!agreement.whoami) return { ok: false, reason: 'whoami requested and not provided' }
        if (agreement.whoami.keybase) {
          if (!agreement.whoami.keybase.username) throw new Error('participant username was not returned')
          const expectectChallengeText = this.challengeTexts[remotePublicKey]
          if (expectectChallengeText !== agreement.whoami.keybase.challengeResponse.text) return { ok: false, reason: 'challengeText was modified' }
          participantDetails.whoami = { keybase: { username: agreement.whoami.keybase.username } }
          participantDetails.whoami.keybase.verified = await verifySignedText(agreement.whoami.keybase.challengeResponse, agreement.whoami.keybase.username) // external
          participantDetails.whoami.keybase.chain = await getKeybaseProofChain(agreement.whoami.keybase.username) // external
        }
        if (!participantDetails.whoami) return { ok: false, reason: 'participant did not provide any known whoami response' }
      }
      if (validateParticipant) {
        const results = await validateParticipant(agreement.accept, participantDetails)
        if (!results.ok) return { ok: false, reason: results.reason }
      }

      // if bad things, return { ok: false, reason: 'did not like it' }
      // we need to do lots of work here to verify the new room
      const invite = await this.createReadyRoom()
      return { ok: true, invite }
    }
    const roomExpectations = async (query, { remotePublicKey }) => {
      const _expectations = structuredClone(expectations)
      if (query.challengeText) {
        try {
          // we have been asked to sign the challengeText
          _expectations.whoami = {
            keybase: {
              username: config.keybaseUsername,
              challengeResponse: await signText(query.challengeText, privateKeyArmored)
            }
          }
        } catch (e) {
          // failed to generate challengeResponse
          console.log(e)
        }
      }
      if (!expectations.whoamiRequired) return _expectations
      const challengeText = await generateChallengeText()
      this.challengeTexts[remotePublicKey] = challengeText
      _expectations.challengeText = challengeText
      return _expectations
    }
    const api = { newRoom, roomExpectations }
    const opts = { seed: config.seed, dht: this.swarm.dht }
    const results = await host(await loadAgreement('./agreement.mjs', import.meta.url), api, opts)
    results.agreeableKey = z32.encode(results.keyPair.publicKey)
    return results
  }

  async cleanup () {
    const exitPromises = Object.values(this.rooms).map(room => room.exit())
    await Promise.all(exitPromises)
    this.rooms = {}

    // Clean up other resources
    if (this.internalManaged.pairing) await this.pairing.close()
    if (this.internalManaged.swarm) await this.swarm.destroy()
    if (this.internalManaged.corestere) await this.corestore.close()
  }

  async installSIGHandlers () {
    this.closingDown = false
    const cleanup = async () => {
      this.closingDown = true
      await this.cleanup()
      process.exit(0)
    }
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }

  isClosingDown () {
    return this.closingDown
  }
}

/**
 * @typedef {Object} BreakoutRoomOptions
 * @property {string} [roomId] - Optional room identifier
 * @property {Corestore} [corestore] - Optional Corestore instance
 * @property {string} [storageDir] - Optional storage directory
 * @property {Hyperswarm} [swarm] - Optional Hyperswarm instance
 * @property {BlindPairing} [pairing] - Optional BlindPairing instance
 * @property {string} [invite] - Optional invite code
 * @property {Object} [metadata] - Optional room metadata
 */

/**
 * Represents a single breakout room for peer-to-peer communication
 * @extends EventEmitter
 */
export class BreakoutRoom extends EventEmitter {
  /**
   * Creates a new BreakoutRoom instance
   * @param {BreakoutRoomOptions} [opts={}] - Room configuration options
   */
  constructor (opts = {}) {
    super()
    this.roomId = opts.roomId || generateRoomId()
    this.internalManaged = { corestore: false, swarm: false, pairing: false }
    if (opts.corestore) this.corestore = opts.corestore
    else {
      this.internalManaged.corestore = true
      if (opts.storageDir) this.corestore = new Corestore(opts.storageDir)
      else this.corestore = new Corestore(RAM.reusable())
    }
    this.swarm = opts.swarm ? opts.swarm : (this.internalManaged.swarm = true, new Hyperswarm())
    this.pairing = opts.pairing ? opts.pairing : (this.internalManaged.pairing = true, new BlindPairing(this.swarm))
    this.autobase = new Autobase(this.corestore, null, { apply, open, valueEncoding: 'json' })
    if (opts.invite) this.invite = z32.decode(opts.invite)
    this.metadata = opts.metadata || {}
    this.initialized = false
  }

  /**
   * Initializes the room and sets up event handlers
   * @returns {Promise<string|void>} Returns invite code if room is host
   */
  async ready () {
    if (this.initialized) return this.invite
    this.initialized = true
    await this.autobase.ready()
    this.metadata.who = z32.encode(this.autobase.local.key)
    // some hacky stuff to only emit remote messages, and only emit once
    this.lastEmitMessageLength = 0
    this.autobase.view.on('append', async () => {
      const entry = await this.autobase.view.get(this.autobase.view.length - 1)
      if (entry.who === this.metadata.who) return
      if (entry.event === 'leftChat') return this.emit('peerLeft', entry.who)
      if (this.lastEmitMessageLength === this.autobase.view.length) return
      this.lastEmitMessageLength = this.autobase.view.length
      process.nextTick(() => this.emit('message', entry))
    })
    this.swarm.join(this.autobase.local.discoveryKey)
    this.swarm.on('connection', conn => this.corestore.replicate(conn))

    if (this.invite) {
      const candidate = this.pairing.addCandidate({
        invite: this.invite,
        userData: this.autobase.local.key,
        onadd: (result) => this._onHostInvite(result)
      })
      await candidate.paring
    } else {
      const { invite, publicKey, discoveryKey } = BlindPairing.createInvite(this.autobase.local.key)
      this.metadata.host = {
        publicKey: z32.encode(publicKey),
        discoveryKey: z32.encode(discoveryKey)
      }
      const member = this.pairing.addMember({
        discoveryKey,
        onadd: (candidate) => this._onAddMember(publicKey, candidate)
      })
      await member.flushed()
      this.invite = invite
      return z32.encode(invite)
    }
  }

  getRoomInfo () {
    return {
      invite: z32.encode(this.invite),
      roomId: this.roomId,
      metadata: this.metadata
    }
  }

  /**
   * Sends a message to the room
   * @param {string} data - Message content
   * @returns {Promise<void>}
   */
  async message (data) {
    await this.autobase.append({
      when: Date.now(),
      who: this.metadata.who,
      data
    })
  }

  async _onHostInvite (result) {
    if (result.key) {
      // can read result.additional data here
      this._connectOtherCore(result.key)
      this.metadata.host = {
        publicKey: z32.encode(result.key)
        // should add the discovery key here
      }
    }
  }

  async _onAddMember (publicKey, candidate) {
    candidate.open(publicKey)
    candidate.confirm({ key: this.autobase.local.key }) // can add additional https://github.com/holepunchto/blind-pairing-core/blob/main/index.js#L190
    this._connectOtherCore(candidate.userData)
  }

  async _connectOtherCore (key) {
    await this.autobase.append({ addWriter: key })
    this.emit('peerEntered', z32.encode(key))
  }

  /**
   * Retrieves the complete room message history
   * @returns {Promise<Array>} Array of message entries
   */
  async getTranscript () {
    const transcript = []
    await this.autobase.update()
    for (let i = 0; i < this.autobase.view.length; i++) {
      transcript.push(await this.autobase.view.get(i))
    }
    return transcript
  }

  async exit () {
    await this.autobase.append({
      when: Date.now(),
      who: this.metadata.who,
      event: 'leftChat'
    })
    await this.autobase.update()
    this.swarm.leave(this.autobase.local.discoveryKey)
    await this.autobase.close()
    if (this.internalManaged.pairing) await this.pairing.close()
    if (this.internalManaged.swarm) await this.swarm.destroy()
    if (this.internalManaged.corestore) await this.corestore.close()
    this.emit('roomClosed')
    this.removeAllListeners() // clean up listeners
  }

  async installSIGHandlers () {
    this.closingDown = false
    const cleanup = async () => {
      if (this.closingDown) return
      this.closingDown = true
      await this.exit()
      process.exit(0)
    }
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }

  isClosingDown () {
    return this.closingDown
  }
}

// create the view
/**
 * Opens the view store
 * @param {Object} store - Storage instance
 * @returns {Promise<Object>} View store instance
 */
function open (store) {
  return store.get({ name: 'view', valueEncoding: 'json' })
}

// use apply to handle to updates
/**
 * Applies updates to the view
 * @param {Array} nodes - Array of nodes to process
 * @param {Object} view - View instance
 * @param {Object} base - Base instance
 * @returns {Promise<void>}
 */
async function apply (nodes, view, base) {
  for (const { value } of nodes) {
    if (value.addWriter) {
      if (value.addWriter.type) continue // weird cycle have to figure out
      await base.addWriter(value.addWriter, { isIndexer: true })
      continue
    }
    await view.append(value)
  }
}

/**
 * Generates a unique room identifier
 * @returns {string} Unique room ID combining timestamp and random string
 */
function generateRoomId () {
  const timestamp = Date.now().toString(36) // Base36 timestamp
  const random = Math.random().toString(36).substr(2, 5) // 5 random chars
  return `room-${timestamp}-${random}`
}

// Function to resolve a path with ~
function resolvePath (inputPath) {
  if (inputPath.startsWith('~')) {
    return path.join(os.homedir(), inputPath.slice(1))
  }
  return path.resolve(inputPath)
}
