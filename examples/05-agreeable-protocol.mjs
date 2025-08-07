#!/usr/bin/env node

import { RoomManager } from '../index.mjs'
import fs from 'fs'
import path from 'path'

/**
 * Example 5: Agreeable Protocol - Room Negotiation
 * 
 * This example demonstrates:
 * - Setting up an agreeable host that validates participants
 * - Negotiating room access with expectations and rules
 * - Identity verification through Keybase (mocked)
 * - Custom validation logic for participants
 * - Automatic room creation after successful negotiation
 */

// Mock private key for demo (DO NOT use in production!)
const MOCK_PRIVATE_KEY = `-----BEGIN PGP PRIVATE KEY BLOCK-----

lQdGBGVtZXN0BMEIAADB5kBqF7HlSwVk3Zz1234567890abcdefghijklmnopqrs
tuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuv
... (truncated for brevity)
-----END PGP PRIVATE KEY BLOCK-----`

async function agreeableProtocolExample() {
  console.log('🤝 Agreeable Protocol Example\n')
  console.log('This example demonstrates automated room negotiation and access control.\n')

  // ===== SETUP ROOM MANAGER AS HOST =====
  console.log('=== Setting up Agreeable Host ===')
  const hostManager = new RoomManager()
  
  // Define room expectations
  const expectations = {
    reason: 'This is a secure AI coordination room for verified bots only.',
    rules: 'All participants must: 1) Be verified bots, 2) Follow rate limits, 3) Use structured messages',
    whoamiRequired: true // Require identity verification
  }

  // Custom validation function
  const validateParticipant = async (acceptance, participantDetails) => {
    console.log('\n🔍 Validating participant...')
    console.log(`  Public Key: ${participantDetails.remotePublicKey.slice(0, 16)}...`)
    
    // Check if they accepted the rules
    if (!acceptance.reason || !acceptance.rules) {
      console.log('  ❌ Participant did not accept expectations')
      return { ok: false, reason: 'Must accept both reason and rules' }
    }
    
    // Check identity verification (mocked for demo)
    if (participantDetails.whoami?.keybase) {
      const username = participantDetails.whoami.keybase.username
      console.log(`  Keybase username: @${username}`)
      console.log(`  Verification: ${participantDetails.whoami.keybase.verified ? '✅' : '❌'}`)
      
      // Custom validation logic - only allow certain usernames (for demo)
      const allowedBots = ['bot_alpha', 'bot_beta', 'bot_gamma', 'alice_secure', 'bob_verified']
      if (!allowedBots.includes(username)) {
        return { ok: false, reason: `Username ${username} not in allowlist` }
      }
    } else {
      return { ok: false, reason: 'Identity verification required' }
    }
    
    console.log('  ✅ Participant validated successfully')
    return { ok: true }
  }

  // Start the agreeable host
  const hostConfig = {
    seed: Buffer.from('demo-seed-do-not-use-in-production'),
    keybaseUsername: 'room_host_bot',
    privateKeyArmored: MOCK_PRIVATE_KEY,
    signMessages: true
  }

  console.log('Starting agreeable host...')
  const agreeableHost = await hostManager.startAgreeable(
    hostConfig,
    expectations,
    validateParticipant
  )
  
  console.log(`✅ Agreeable host started`)
  console.log(`🔑 Agreeable key: ${agreeableHost.agreeableKey}`)
  console.log(`📋 Expectations:`)
  console.log(`   - Reason: ${expectations.reason}`)
  console.log(`   - Rules: ${expectations.rules}`)
  console.log(`   - Identity required: ${expectations.whoamiRequired}`)
  console.log()

  // Track created rooms
  const createdRooms = []
  hostManager.on('readyRoom', (room) => {
    createdRooms.push(room)
    console.log(`\n🎉 New room created via agreeable protocol!`)
    console.log(`   Room ID: ${room.roomId}`)
    console.log(`   Invite: ${room.getRoomInfo().invite}`)
  })

  // ===== SIMULATE CLIENT NEGOTIATIONS =====
  console.log('=== Simulating Client Negotiations ===')
  
  // For demo purposes, we'll simulate the client side
  // In real usage, clients would use @agree-able/rpc to connect
  
  console.log('\n📱 Client 1: Authorized bot attempting to join...')
  console.log('  - Username: bot_alpha')
  console.log('  - Accepts all rules: YES')
  console.log('  - Has valid signature: YES')
  // In real implementation, this would trigger room creation

  console.log('\n📱 Client 2: Unauthorized user attempting to join...')
  console.log('  - Username: random_user')
  console.log('  - Accepts all rules: YES')
  console.log('  - Has valid signature: YES')
  console.log('  ❌ Would be rejected: not in allowlist')

  console.log('\n📱 Client 3: Bot refusing rules...')
  console.log('  - Username: bot_beta')
  console.log('  - Accepts all rules: NO')
  console.log('  - Has valid signature: YES')
  console.log('  ❌ Would be rejected: must accept rules')

  // ===== DEMONSTRATE ROOM LIFECYCLE =====
  console.log('\n=== Room Lifecycle Management ===')
  
  // Create a room through the normal flow to demonstrate
  console.log('Creating a room through standard flow for comparison...')
  const standardRoom = hostManager.createRoom({
    metadata: {
      purpose: 'Standard room creation',
      createdVia: 'direct'
    }
  })
  await standardRoom.ready()
  console.log(`✅ Standard room created: ${standardRoom.roomId}`)

  // Show active rooms
  console.log(`\n📊 Active rooms: ${Object.keys(hostManager.rooms).length}`)
  Object.values(hostManager.rooms).forEach(room => {
    const info = room.getRoomInfo()
    console.log(`  - ${room.roomId}: ${info.metadata.purpose || 'Agreeable protocol room'}`)
  })

  // ===== ADVANCED FEATURES =====
  console.log('\n=== Advanced Features ===')
  console.log('The agreeable protocol supports:')
  console.log('  1. Custom validation logic for fine-grained access control')
  console.log('  2. Challenge-response authentication with cryptographic proofs')
  console.log('  3. Automatic room creation upon successful negotiation')
  console.log('  4. Integration with identity providers (Keybase)')
  console.log('  5. Detailed audit trails of negotiation attempts')
  console.log()

  // ===== CLEANUP =====
  console.log('=== Cleanup ===')
  console.log('Stopping agreeable host...')
  if (agreeableHost.stop) {
    await agreeableHost.stop()
  }
  
  console.log('Cleaning up rooms...')
  await hostManager.cleanup()
  console.log('✅ Agreeable protocol example completed!')
}

// Run the example
agreeableProtocolExample().catch(console.error)