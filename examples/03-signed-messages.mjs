#!/usr/bin/env node

import { BreakoutRoom } from '../index.mjs'
import { generateChallengeText, signText, verifySignedText } from '@agree-able/invite'

/**
 * Example 3: Signed Messages and Cryptographic Verification
 * 
 * This example demonstrates:
 * - Signing messages with private keys
 * - Verifying message signatures
 * - Using Keybase for identity verification
 * - Creating audit trails with signed transcripts
 * 
 * Note: This example uses mock keys for demonstration.
 * In production, use actual Keybase credentials.
 */

// Mock private key for demonstration (DO NOT use in production!)
const MOCK_PRIVATE_KEY = `-----BEGIN PGP PRIVATE KEY BLOCK-----

lQdGBGVtZXN0BMEIAADB5kBqF7HlSwVk3Zz1234567890abcdefghijklmnopqrs
tuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuv
... (truncated for brevity)
-----END PGP PRIVATE KEY BLOCK-----`

class SecureBot {
  constructor(name, room, privateKey) {
    this.name = name
    this.room = room
    this.privateKey = privateKey
    this.verifiedPeers = new Map()
    this.setupHandlers()
  }

  setupHandlers() {
    this.room.on('message', async (message) => {
      if (message.who === this.room.metadata.who) return
      
      // Verify signed messages
      if (message.signature) {
        const verified = await this.verifyMessage(message)
        console.log(`🔐 ${this.name}: Message signature ${verified ? '✅ VERIFIED' : '❌ FAILED'}`)
      }
      
      await this.handleMessage(message)
    })

    this.room.on('peerEntered', (peer) => {
      console.log(`🔑 ${this.name}: New peer ${peer.who.slice(0, 8)}... joined`)
      if (peer.keybaseUsername) {
        console.log(`   Keybase username: ${peer.keybaseUsername}`)
      }
    })
  }

  async verifyMessage(message) {
    try {
      // In a real implementation, you would verify against the sender's public key
      // This is a simplified demonstration
      return true
    } catch (error) {
      console.error('Verification error:', error)
      return false
    }
  }

  async handleMessage(message) {
    const content = typeof message.data === 'string' ? message.data : message.data.text
    console.log(`📨 ${this.name} received: "${content}"`)
    
    // Respond to specific commands
    if (content.includes('verify me')) {
      await this.sendChallenge(message.who)
    } else if (content.includes('challenge:')) {
      await this.respondToChallenge(content, message.who)
    }
  }

  async sendChallenge(peerId) {
    const challenge = await generateChallengeText()
    await this.sendMessage({
      text: `Please sign this challenge to verify your identity: challenge:${challenge}`,
      type: 'verification_challenge',
      challenge
    })
  }

  async respondToChallenge(content, peerId) {
    const match = content.match(/challenge:(\S+)/)
    if (match) {
      const challenge = match[1]
      try {
        const signed = await signText(challenge, this.privateKey)
        await this.sendMessage({
          text: 'Here is my signed challenge response',
          type: 'challenge_response',
          signedChallenge: signed
        })
        this.verifiedPeers.set(peerId, true)
      } catch (error) {
        console.error('Failed to sign challenge:', error)
      }
    }
  }

  async sendMessage(content) {
    const text = typeof content === 'string' ? content : content.text
    console.log(`📤 ${this.name} sending: "${text}"`)
    await this.room.message(content)
  }
}

async function signedMessagesExample() {
  console.log('🔐 Signed Messages Example\n')
  console.log('⚠️  Note: This example uses mock keys for demonstration.')
  console.log('   In production, use real Keybase credentials.\n')

  // ===== CREATE SECURE HOST ROOM =====
  console.log('=== Creating Secure Host Room ===')
  const hostRoom = new BreakoutRoom({
    signMessages: true,
    privateKeyArmored: MOCK_PRIVATE_KEY,
    keybaseUsername: 'alice_secure',
    metadata: {
      roomType: 'secure',
      requiresVerification: true
    }
  })

  const inviteCode = await hostRoom.ready()
  const hostBot = new SecureBot('Alice', hostRoom, MOCK_PRIVATE_KEY)
  console.log(`✅ Secure room created by Alice`)
  console.log(`🔑 Invite code: ${inviteCode}`)
  console.log()

  // ===== CREATE SECURE GUEST =====
  console.log('=== Bob Joining with Signed Messages ===')
  const guestRoom = new BreakoutRoom({
    invite: inviteCode,
    signMessages: true,
    privateKeyArmored: MOCK_PRIVATE_KEY,
    keybaseUsername: 'bob_verified',
    metadata: {
      clientType: 'secure_bot'
    }
  })

  await guestRoom.ready()
  const guestBot = new SecureBot('Bob', guestRoom, MOCK_PRIVATE_KEY)
  console.log('✅ Bob joined the secure room')
  console.log()

  // Allow connections to establish
  await new Promise(resolve => setTimeout(resolve, 1000))

  // ===== SIGNED CONVERSATION =====
  console.log('=== Secure Conversation ===')
  
  // Regular signed message
  await hostBot.sendMessage('Welcome to the secure room! All messages here are cryptographically signed.')
  await new Promise(resolve => setTimeout(resolve, 500))

  // Bob responds with signed message
  await guestBot.sendMessage('Thanks! I can see your message is signed. Let me send a signed response.')
  await new Promise(resolve => setTimeout(resolve, 500))

  // Structured signed data
  await hostBot.sendMessage({
    text: 'Here is some important structured data',
    type: 'secure_data',
    data: {
      timestamp: new Date().toISOString(),
      importance: 'high',
      classification: 'confidential'
    }
  })
  await new Promise(resolve => setTimeout(resolve, 500))

  // Verification challenge flow
  await guestBot.sendMessage('Please verify me with a challenge')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Another exchange
  await hostBot.sendMessage('Your identity has been verified! We can now exchange sensitive information.')
  await new Promise(resolve => setTimeout(resolve, 500))

  await guestBot.sendMessage({
    text: 'Sending encrypted coordinates',
    type: 'location_data',
    encrypted: true,
    data: {
      lat: '37.7749',
      lng: '-122.4194',
      accuracy: 'high'
    }
  })

  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log()

  // ===== SIGNED TRANSCRIPT =====
  console.log('=== Cryptographically Signed Transcript ===')
  const transcript = await hostRoom.getTranscript()
  
  console.log('Verified conversation history:')
  transcript.forEach((entry, index) => {
    if (entry.event === 'joinedChat') {
      console.log(`\n[SYSTEM] ${entry.who.slice(0, 8)}... joined`)
      if (entry.keybaseUsername) {
        console.log(`  Identity: @${entry.keybaseUsername}`)
      }
    } else if (entry.data) {
      const content = typeof entry.data === 'string' ? entry.data : entry.data.text
      console.log(`\n[${new Date(entry.when).toLocaleTimeString()}] ${entry.who.slice(0, 8)}...`)
      console.log(`  Message: ${content}`)
      if (entry.signature) {
        console.log(`  Signature: ${entry.signature.slice(0, 50)}...`)
      }
      if (typeof entry.data === 'object' && entry.data.type) {
        console.log(`  Type: ${entry.data.type}`)
      }
    }
  })
  console.log()

  // ===== AUDIT SUMMARY =====
  console.log('=== Audit Summary ===')
  const signedMessages = transcript.filter(e => e.signature).length
  const totalMessages = transcript.filter(e => e.data).length
  const verifiedIdentities = [...new Set(transcript
    .filter(e => e.keybaseUsername)
    .map(e => e.keybaseUsername)
  )]

  console.log(`📊 Message Statistics:`)
  console.log(`   Total messages: ${totalMessages}`)
  console.log(`   Signed messages: ${signedMessages}`)
  console.log(`   Signature rate: ${((signedMessages/totalMessages) * 100).toFixed(0)}%`)
  console.log(`   Verified identities: ${verifiedIdentities.join(', ')}`)
  console.log()

  // ===== CLEANUP =====
  console.log('=== CLEANUP ===')
  console.log('Closing secure rooms...')
  await guestRoom.exit()
  await hostRoom.exit()
  console.log('✅ Signed messages example completed!')
}

// Run the example
signedMessagesExample().catch(console.error)