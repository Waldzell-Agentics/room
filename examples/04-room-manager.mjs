#!/usr/bin/env node

import { RoomManager } from '../index.mjs'

/**
 * Example 4: Room Manager for Multiple Rooms
 * 
 * This example demonstrates:
 * - Managing multiple rooms with a single RoomManager
 * - Creating rooms with different purposes
 * - Handling room lifecycle events
 * - Resource sharing between rooms
 * - Graceful cleanup of all rooms
 */

class RoomBot {
  constructor(name, room, role) {
    this.name = name
    this.room = room
    this.role = role
    this.messagesSent = 0
    this.messagesReceived = 0
    
    this.room.on('message', (msg) => {
      if (msg.who !== this.room.metadata.who) {
        this.messagesReceived++
        console.log(`  📨 [${this.room.roomId.slice(-8)}] ${this.name} received: "${msg.data}"`)
      }
    })
    
    this.room.on('peerEntered', (peer) => {
      console.log(`  👋 [${this.room.roomId.slice(-8)}] ${this.name}: New peer joined!`)
    })
  }

  async sendMessage(text) {
    this.messagesSent++
    await this.room.message(text)
    console.log(`  💬 [${this.room.roomId.slice(-8)}] ${this.name} sent: "${text}"`)
  }

  getStats() {
    return {
      name: this.name,
      role: this.role,
      sent: this.messagesSent,
      received: this.messagesReceived
    }
  }
}

async function roomManagerExample() {
  console.log('🏢 Room Manager Example - Multiple Rooms\n')

  // ===== INITIALIZE ROOM MANAGER =====
  console.log('=== Setting up Room Manager ===')
  const manager = new RoomManager({
    storageDir: null // Use in-memory storage for demo
  })

  // Install signal handlers for graceful shutdown
  await manager.installSIGHandlers()

  // Set up event listeners
  manager.on('newRoom', (room) => {
    console.log(`📣 Manager: New room created - ${room.roomId}`)
  })

  manager.on('readyRoom', (room) => {
    console.log(`✅ Manager: Room ready - ${room.roomId}`)
  })

  manager.on('lastRoomClosed', () => {
    console.log('📪 Manager: All rooms have been closed')
  })

  console.log('Room Manager initialized\n')

  // ===== CREATE MULTIPLE ROOMS =====
  console.log('=== Creating Multiple Rooms ===')
  
  // Room 1: Development Team Standup
  const devRoomInvite = await manager.createReadyRoom({
    metadata: {
      purpose: 'Development Team Standup',
      team: 'Engineering',
      maxParticipants: 10
    }
  })
  const devRoom = manager.rooms[Object.keys(manager.rooms)[0]]
  console.log(`🛠️  Dev Room: ${devRoomInvite}`)

  // Room 2: Customer Support Channel
  const supportRoomInvite = await manager.createReadyRoom({
    metadata: {
      purpose: 'Customer Support Channel',
      team: 'Support',
      priority: 'high'
    }
  })
  const supportRoom = manager.rooms[Object.keys(manager.rooms)[1]]
  console.log(`🎧 Support Room: ${supportRoomInvite}`)

  // Room 3: AI Bot Coordination
  const botRoomInvite = await manager.createReadyRoom({
    metadata: {
      purpose: 'AI Bot Coordination',
      type: 'automated',
      bots: ['analyzer', 'responder', 'monitor']
    }
  })
  const botRoom = manager.rooms[Object.keys(manager.rooms)[2]]
  console.log(`🤖 Bot Room: ${botRoomInvite}`)

  console.log(`\n📊 Total active rooms: ${Object.keys(manager.rooms).length}\n`)

  // ===== POPULATE ROOMS WITH PARTICIPANTS =====
  console.log('=== Populating Rooms with Participants ===')

  // Dev room participants
  const devLead = new RoomBot('DevLead', devRoom, 'leader')
  
  const dev1Room = manager.createRoom({ invite: devRoomInvite })
  await dev1Room.ready()
  const dev1 = new RoomBot('Developer1', dev1Room, 'developer')
  
  const dev2Room = manager.createRoom({ invite: devRoomInvite })
  await dev2Room.ready()
  const dev2 = new RoomBot('Developer2', dev2Room, 'developer')

  // Support room participants
  const supportLead = new RoomBot('SupportLead', supportRoom, 'leader')
  
  const agent1Room = manager.createRoom({ invite: supportRoomInvite })
  await agent1Room.ready()
  const agent1 = new RoomBot('Agent1', agent1Room, 'agent')

  // Bot room participants
  const botCoordinator = new RoomBot('Coordinator', botRoom, 'coordinator')
  
  const analyzerRoom = manager.createRoom({ invite: botRoomInvite })
  await analyzerRoom.ready()
  const analyzer = new RoomBot('Analyzer', analyzerRoom, 'bot')
  
  const responderRoom = manager.createRoom({ invite: botRoomInvite })
  await responderRoom.ready()
  const responder = new RoomBot('Responder', responderRoom, 'bot')

  // Allow connections to establish
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log()

  // ===== SIMULATE ROOM ACTIVITIES =====
  console.log('=== Room Activities ===')
  
  // Dev room standup
  console.log('\n🛠️  Development Standup:')
  await devLead.sendMessage('Good morning team! Let\'s start our standup.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await dev1.sendMessage('Yesterday I fixed the authentication bug.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await dev2.sendMessage('I\'m working on the new API endpoints today.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await devLead.sendMessage('Great progress! Any blockers?')
  await new Promise(resolve => setTimeout(resolve, 500))
  await dev1.sendMessage('None from my side.')
  await dev2.sendMessage('All good here too.')

  // Support room activity
  console.log('\n🎧 Support Channel:')
  await supportLead.sendMessage('New ticket: Customer having login issues.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await agent1.sendMessage('I\'ll take this one. Checking the logs now.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await agent1.sendMessage('Found the issue - password reset needed.')
  await supportLead.sendMessage('Perfect, please update the ticket.')

  // Bot coordination
  console.log('\n🤖 Bot Coordination:')
  await botCoordinator.sendMessage('Starting daily analysis tasks.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await analyzer.sendMessage('Analyzing system metrics...')
  await new Promise(resolve => setTimeout(resolve, 500))
  await responder.sendMessage('Standing by for alerts.')
  await new Promise(resolve => setTimeout(resolve, 500))
  await analyzer.sendMessage('Analysis complete: All systems normal.')
  await botCoordinator.sendMessage('Excellent. Continue monitoring.')

  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log()

  // ===== ROOM STATISTICS =====
  console.log('=== Room Statistics ===')
  const allBots = [
    devLead, dev1, dev2,
    supportLead, agent1,
    botCoordinator, analyzer, responder
  ]

  console.log('\n📊 Activity Summary:')
  allBots.forEach(bot => {
    const stats = bot.getStats()
    console.log(`  ${stats.name} (${stats.role}): Sent ${stats.sent}, Received ${stats.received}`)
  })

  console.log('\n📍 Room Information:')
  Object.values(manager.rooms).forEach(room => {
    const info = room.getRoomInfo()
    console.log(`  Room ${info.roomId}:`)
    console.log(`    Purpose: ${info.metadata.purpose || 'General'}`)
    console.log(`    Invite: ${info.invite.slice(0, 20)}...`)
  })
  console.log()

  // ===== SELECTIVE ROOM CLOSURE =====
  console.log('=== Closing Individual Rooms ===')
  console.log('Closing support room...')
  await agent1Room.exit()
  await supportRoom.exit()
  console.log(`✅ Support room closed. Active rooms: ${Object.keys(manager.rooms).length}`)
  
  await new Promise(resolve => setTimeout(resolve, 1000))

  // ===== CLEANUP ALL REMAINING ROOMS =====
  console.log('\n=== Final Cleanup ===')
  console.log('Cleaning up all remaining rooms...')
  await manager.cleanup()
  console.log('✅ All rooms closed and resources cleaned up')
  console.log('✅ Room Manager example completed!')
}

// Run the example
roomManagerExample().catch(console.error)