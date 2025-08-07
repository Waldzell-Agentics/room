#!/usr/bin/env node

import { BreakoutRoom } from '../index.mjs'

/**
 * Example 1: Basic Room Creation and Joining
 * 
 * This example demonstrates:
 * - Creating a new room
 * - Generating an invite code
 * - Joining with an invite code
 * - Sending and receiving messages
 * - Getting room transcripts
 */

async function basicRoomExample() {
  console.log('🏠 Basic Room Example\n')
  
  // ===== HOST SIDE =====
  console.log('=== HOST: Creating a room ===')
  const hostRoom = new BreakoutRoom({
    metadata: {
      roomName: 'Basic Chat Room',
      purpose: 'Demo of basic room features'
    }
  })

  // Set up message handler before initializing
  hostRoom.on('message', (message) => {
    console.log(`📩 HOST received: "${message.data}" from ${message.who.slice(0, 8)}...`)
  })

  hostRoom.on('peerEntered', (peer) => {
    console.log(`👋 HOST: Peer joined - ${peer.who.slice(0, 8)}...`)
  })

  // Initialize the room and get invite code
  const inviteCode = await hostRoom.ready()
  console.log(`🔑 Invite code: ${inviteCode}`)
  console.log(`📍 Room ID: ${hostRoom.roomId}`)
  console.log()

  // ===== GUEST SIDE =====
  console.log('=== GUEST: Joining the room ===')
  const guestRoom = new BreakoutRoom({
    invite: inviteCode,
    metadata: {
      nickname: 'Guest User'
    }
  })

  // Set up guest message handler
  guestRoom.on('message', (message) => {
    console.log(`📩 GUEST received: "${message.data}" from ${message.who.slice(0, 8)}...`)
  })

  // Join the room
  await guestRoom.ready()
  console.log(`✅ GUEST: Successfully joined room ${guestRoom.roomId}`)
  console.log()

  // Allow time for connection to establish
  await new Promise(resolve => setTimeout(resolve, 1000))

  // ===== MESSAGING =====
  console.log('=== MESSAGING ===')
  
  // Host sends a message
  await hostRoom.message('Hello from the host! Welcome to the room.')
  
  // Small delay to ensure message propagation
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Guest responds
  await guestRoom.message('Thanks for having me! This room protocol is amazing.')
  
  // Another exchange
  await new Promise(resolve => setTimeout(resolve, 500))
  await hostRoom.message('Feel free to share any questions.')
  
  await new Promise(resolve => setTimeout(resolve, 500))
  await guestRoom.message('How many peers can join a single room?')
  
  await new Promise(resolve => setTimeout(resolve, 500))
  await hostRoom.message('Rooms can handle multiple peers joining with the same invite!')

  // Allow messages to propagate
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log()

  // ===== TRANSCRIPT =====
  console.log('=== TRANSCRIPT ===')
  const transcript = await hostRoom.getTranscript()
  
  console.log('Room conversation history:')
  transcript.forEach((entry, index) => {
    if (entry.event === 'joinedChat') {
      console.log(`  ${index + 1}. [${new Date(entry.when).toLocaleTimeString()}] ${entry.who.slice(0, 8)}... joined the chat`)
    } else if (entry.data) {
      console.log(`  ${index + 1}. [${new Date(entry.when).toLocaleTimeString()}] ${entry.who.slice(0, 8)}...: ${entry.data}`)
    }
  })
  console.log()

  // ===== CLEANUP =====
  console.log('=== CLEANUP ===')
  console.log('Exiting rooms...')
  await guestRoom.exit()
  await hostRoom.exit()
  console.log('✅ Example completed successfully!')
}

// Run the example
basicRoomExample().catch(console.error)