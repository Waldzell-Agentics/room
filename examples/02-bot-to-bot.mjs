#!/usr/bin/env node

import { BreakoutRoom } from '../index.mjs'

/**
 * Example 2: Bot-to-Bot Communication
 * 
 * This example demonstrates:
 * - Creating AI/bot agents that communicate autonomously
 * - Implementing conversation logic and response patterns
 * - Handling structured data exchange between bots
 * - Building a simple Q&A bot interaction
 */

class ChatBot {
  constructor(name, room, personality) {
    this.name = name
    this.room = room
    this.personality = personality
    this.messageCount = 0
    this.setupHandlers()
  }

  setupHandlers() {
    this.room.on('message', async (message) => {
      // Don't respond to own messages
      if (message.who === this.room.metadata.who) return
      
      // Process incoming message
      await this.handleMessage(message)
    })
  }

  async handleMessage(message) {
    // Parse message for structured data if present
    let messageContent = message.data
    let structuredData = null
    
    if (typeof message.data === 'object') {
      structuredData = message.data
      messageContent = message.data.text || JSON.stringify(message.data)
    }

    console.log(`🤖 ${this.name} received: "${messageContent}"`)
    
    // Generate response based on personality and message content
    const response = await this.generateResponse(messageContent, structuredData)
    
    if (response) {
      // Add small delay to simulate thinking
      await new Promise(resolve => setTimeout(resolve, 800))
      await this.sendMessage(response)
    }
  }

  async generateResponse(messageText, structuredData) {
    this.messageCount++
    
    // Different response patterns based on bot personality
    switch (this.personality) {
      case 'questioner':
        return this.questionerResponse(messageText)
      
      case 'answerer':
        return this.answererResponse(messageText)
      
      case 'analyst':
        return this.analystResponse(messageText, structuredData)
      
      default:
        return null
    }
  }

  questionerResponse(messageText) {
    const questions = [
      "What programming languages do you support?",
      "Can you handle real-time data processing?",
      "What's your favorite feature of the room protocol?",
      "How do you handle error conditions?",
      "Can you process structured data formats?"
    ]
    
    // Ask questions in sequence
    if (this.messageCount <= questions.length) {
      return questions[this.messageCount - 1]
    }
    
    // Thank and end conversation
    if (this.messageCount === questions.length + 1) {
      return "Thanks for all the answers! This has been very informative."
    }
    
    return null
  }

  answererResponse(messageText) {
    // Simple Q&A responses
    const responses = {
      'programming languages': 'I support JavaScript, Python, and TypeScript primarily.',
      'real-time': 'Yes! The room protocol enables real-time peer-to-peer communication.',
      'favorite feature': 'I love the signed transcript feature - it provides cryptographic proof of our conversation!',
      'error': 'I implement robust error handling with retry logic and graceful degradation.',
      'structured data': 'Absolutely! Let me send you an example...'
    }
    
    // Check for keywords and respond
    const lowerMessage = messageText.toLowerCase()
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerMessage.includes(keyword)) {
        // Send structured data example
        if (keyword === 'structured data') {
          return {
            text: response,
            example: {
              type: 'user_profile',
              data: {
                id: 'bot-123',
                capabilities: ['chat', 'analysis', 'data_processing'],
                version: '1.0.0'
              }
            }
          }
        }
        return response
      }
    }
    
    // Default response
    return "That's an interesting point! Could you elaborate?"
  }

  analystResponse(messageText, structuredData) {
    if (structuredData && structuredData.example) {
      return {
        text: "I've analyzed the structured data you sent:",
        analysis: {
          dataType: structuredData.example.type,
          fields: Object.keys(structuredData.example.data),
          complexity: 'medium',
          recommendation: 'This data structure is well-organized for bot communication.'
        }
      }
    }
    
    // Analyze message sentiment/content
    const wordCount = messageText.split(' ').length
    const hasQuestion = messageText.includes('?')
    
    return {
      text: `Analysis complete for your ${wordCount}-word ${hasQuestion ? 'question' : 'statement'}.`,
      metrics: {
        wordCount,
        messageType: hasQuestion ? 'question' : 'statement',
        timestamp: new Date().toISOString()
      }
    }
  }

  async sendMessage(content) {
    console.log(`💬 ${this.name} sending:`, typeof content === 'object' ? content.text : content)
    await this.room.message(content)
  }
}

async function botToBotExample() {
  console.log('🤖 Bot-to-Bot Communication Example\n')
  
  // ===== CREATE QUESTIONER BOT =====
  console.log('=== Setting up Questioner Bot ===')
  const questionerRoom = new BreakoutRoom({
    metadata: {
      botName: 'QuestionBot',
      botType: 'questioner',
      version: '1.0'
    }
  })
  
  const inviteCode = await questionerRoom.ready()
  const questionBot = new ChatBot('QuestionBot', questionerRoom, 'questioner')
  console.log(`✅ QuestionBot ready with invite: ${inviteCode}`)
  console.log()

  // ===== CREATE ANSWERER BOT =====
  console.log('=== Setting up Answerer Bot ===')
  const answererRoom = new BreakoutRoom({
    invite: inviteCode,
    metadata: {
      botName: 'AnswerBot',
      botType: 'answerer',
      version: '1.0'
    }
  })
  
  await answererRoom.ready()
  const answerBot = new ChatBot('AnswerBot', answererRoom, 'answerer')
  console.log('✅ AnswerBot joined the room')
  console.log()

  // ===== CREATE ANALYST BOT =====
  console.log('=== Setting up Analyst Bot ===')
  const analystRoom = new BreakoutRoom({
    invite: inviteCode,
    metadata: {
      botName: 'AnalystBot',
      botType: 'analyst',
      version: '1.0'
    }
  })
  
  await analystRoom.ready()
  const analystBot = new ChatBot('AnalystBot', analystRoom, 'analyst')
  console.log('✅ AnalystBot joined the room')
  console.log()

  // Allow connections to establish
  await new Promise(resolve => setTimeout(resolve, 1500))

  // ===== START CONVERSATION =====
  console.log('=== Bot Conversation Starting ===')
  console.log('(Bots will communicate autonomously)\n')
  
  // QuestionBot starts the conversation
  await questionBot.sendMessage("Hello everyone! I'm QuestionBot, and I have some questions about your capabilities.")
  
  // Let the conversation run for a while
  await new Promise(resolve => setTimeout(resolve, 15000))
  console.log()

  // ===== TRANSCRIPT =====
  console.log('=== CONVERSATION TRANSCRIPT ===')
  const transcript = await questionerRoom.getTranscript()
  
  console.log('Full bot conversation:')
  transcript.forEach((entry, index) => {
    if (entry.event === 'joinedChat') {
      const botName = entry.keybaseUsername || 'Unknown Bot'
      console.log(`  [${new Date(entry.when).toLocaleTimeString()}] 🤖 ${entry.who.slice(0, 8)}... joined`)
    } else if (entry.data) {
      const displayData = typeof entry.data === 'object' 
        ? entry.data.text || JSON.stringify(entry.data, null, 2)
        : entry.data
      console.log(`  [${new Date(entry.when).toLocaleTimeString()}] ${entry.who.slice(0, 8)}...: ${displayData}`)
    }
  })
  console.log()

  // ===== CLEANUP =====
  console.log('=== CLEANUP ===')
  console.log('Shutting down bots...')
  await answererRoom.exit()
  await analystRoom.exit()
  await questionerRoom.exit()
  console.log('✅ Bot-to-bot example completed!')
}

// Run the example
botToBotExample().catch(console.error)