# Room Protocol Examples

This directory contains comprehensive examples demonstrating various aspects of the Room Protocol implementation. Each example is designed to showcase specific features and use cases.

## Prerequisites

Before running the examples, ensure you have:

```bash
# Install the room protocol library
npm install @agree-able/room

# Or if running from the project root
npm install
```

## Examples Overview

### 1. Basic Room Creation and Joining (`01-basic-room.mjs`)

Demonstrates the fundamentals of the Room Protocol:
- Creating a new peer-to-peer room
- Generating and sharing invite codes
- Joining existing rooms
- Sending and receiving messages
- Retrieving conversation transcripts

**Run it:**
```bash
node examples/01-basic-room.mjs
```

**Key concepts:**
- `BreakoutRoom` class for room management
- Event-driven message handling
- Peer-to-peer connections without servers

### 2. Bot-to-Bot Communication (`02-bot-to-bot.mjs`)

Shows how to build autonomous bots that communicate with each other:
- Creating AI/bot agents with different personalities
- Implementing conversation logic and response patterns
- Handling structured data exchange between bots
- Building Q&A bot interactions

**Run it:**
```bash
node examples/02-bot-to-bot.mjs
```

**Key concepts:**
- Bot architecture with event handlers
- Autonomous conversation flows
- Structured message formats
- Multi-bot coordination

### 3. Signed Messages and Cryptographic Verification (`03-signed-messages.mjs`)

Demonstrates secure communication features:
- Signing messages with private keys
- Verifying message signatures
- Keybase integration for identity verification
- Creating audit trails with signed transcripts

**Run it:**
```bash
node examples/03-signed-messages.mjs
```

**Key concepts:**
- Message signing with `signMessages` option
- Identity verification workflows
- Challenge-response authentication
- Cryptographic audit trails

### 4. Room Manager for Multiple Rooms (`04-room-manager.mjs`)

Shows how to manage multiple concurrent rooms:
- Using `RoomManager` to handle multiple rooms
- Creating rooms for different purposes
- Resource sharing between rooms
- Room lifecycle management
- Graceful cleanup and shutdown

**Run it:**
```bash
node examples/04-room-manager.mjs
```

**Key concepts:**
- Centralized room management
- Event handling across rooms
- Resource optimization
- Bulk operations

### 5. Agreeable Protocol - Room Negotiation (`05-agreeable-protocol.mjs`)

Advanced example showing automated room access control:
- Setting up an agreeable host with validation rules
- Negotiating room access with expectations
- Custom participant validation logic
- Identity verification requirements
- Automatic room creation after successful negotiation

**Run it:**
```bash
node examples/05-agreeable-protocol.mjs
```

**Key concepts:**
- Agreeable protocol for access control
- Custom validation functions
- Automated negotiation flow
- Identity-based access control

### 6. Task Coordination System (`06-task-coordination.mjs`)

A practical example demonstrating real-world agent coordination:
- Multiple AI agents working on distributed tasks
- Dynamic task assignment based on capabilities
- Progress tracking and status updates
- Error handling with retry logic
- Real-time monitoring dashboard

**Run it:**
```bash
node examples/06-task-coordination.mjs
```

**Key concepts:**
- Capability-based task routing
- Autonomous agent coordination
- Progress monitoring
- Fault tolerance and retry logic
- Structured message protocols

## Common Patterns

### Creating a Room

```javascript
import { BreakoutRoom } from '@agree-able/room'

const room = new BreakoutRoom({
  metadata: {
    roomName: 'My Chat Room',
    purpose: 'General discussion'
  }
})

const inviteCode = await room.ready()
console.log(`Share this invite: ${inviteCode}`)
```

### Joining a Room

```javascript
const room = new BreakoutRoom({
  invite: inviteCode
})

await room.ready()
```

### Handling Messages

```javascript
room.on('message', (message) => {
  console.log(`${message.who}: ${message.data}`)
})

room.on('peerEntered', (peer) => {
  console.log(`${peer.who} joined the room`)
})
```

### Sending Messages

```javascript
// Simple text message
await room.message('Hello, world!')

// Structured data
await room.message({
  text: 'Here is some data',
  type: 'data_packet',
  data: { temperature: 72, humidity: 45 }
})
```

### Managing Multiple Rooms

```javascript
import { RoomManager } from '@agree-able/room'

const manager = new RoomManager()

// Create multiple rooms
const room1 = await manager.createReadyRoom({ 
  metadata: { purpose: 'Team A' }
})
const room2 = await manager.createReadyRoom({ 
  metadata: { purpose: 'Team B' }
})

// Clean up all rooms
await manager.cleanup()
```

## Best Practices

1. **Always handle cleanup**: Call `room.exit()` or `manager.cleanup()` when done
2. **Use metadata**: Store room context and configuration in metadata
3. **Handle events before ready()**: Set up event listeners before calling `ready()`
4. **Implement error handling**: Wrap async operations in try-catch blocks
5. **Use structured messages**: For bot communication, use objects instead of plain text

## Security Considerations

- The examples use mock private keys for demonstration. In production:
  - Generate real cryptographic keys
  - Store private keys securely
  - Use actual Keybase accounts for identity verification
  - Implement proper access control lists

## Troubleshooting

### Connection Issues
- Ensure both peers call `ready()` and have time to establish connections
- Check that invite codes are copied correctly
- Verify network connectivity allows peer-to-peer connections

### Message Delivery
- Messages are delivered asynchronously
- Use small delays in examples to ensure propagation
- Check event handlers are set up before `ready()`

### Identity Verification
- Mock keys will fail real verification
- Keybase verification requires internet connectivity
- Challenge-response flows need proper key management

## Further Reading

- [Room Protocol Documentation](https://github.com/agree-able/room)
- [Breakout Room CLI](https://github.com/agree-able/breakout-room)
- [20 Questions Bot Example](https://github.com/agree-able/20-questions-bot)
- [Agent Passports and AI Infrastructure](https://www.aitidbits.ai/p/ai-agents-web-infrastructure)

## Contributing

Feel free to submit additional examples that demonstrate:
- Integration with AI frameworks
- Complex multi-agent scenarios
- Real-world use cases
- Performance optimizations

Submit PRs to the [Room repository](https://github.com/agree-able/room).