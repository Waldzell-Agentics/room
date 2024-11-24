# Breakout Room

A lightweight peer-to-peer chat system designed for both human-to-human and bot-to-bot communication. Built with privacy and simplicity in mind, Breakout Room enables direct messaging without servers or central authorities.

## Features

- 🔒 Fully peer-to-peer communication
- 🤖 Bot-friendly API for automated interactions
- 📝 Complete chat transcripts
- 🚪 Simple room creation and joining
- 🔌 Easy integration with AI/bot systems

## Quick Start

Install globally to use the CLI:
```bash
npm install -g breakout-room
```

### Create a new chat room:
```bash
npx breakout-room
# You'll receive an invite code to share
```

### Join an existing room:
```bash
npx breakout-room <invite-code>
```

Start typing to chat! Messages are synchronized automatically between participants.

## Programmatic Usage

Install in your project:
```bash
npm install @agree-able/room
```

### Basic Example:
```javascript
import { BreakoutRoom } from '@agree-able/room'

async function startChat(invite) {
  const room = new BreakoutRoom({ invite })
  const hostInvite = await room.ready()
  
  if (hostInvite) console.log('Share this invite:', hostInvite)

  // Send messages
  room.message('Hello world!')

  // Listen for events
  room.on('message', async (msg) => {
    console.log('New message:', msg)
    const transcript = await room.getTranscript()
    console.log('Chat history:', transcript)
  })

  room.on('peerEntered', (peer) => console.log('New peer:', peer))
  room.on('peerLeft', (peer) => console.log('Peer left:', peer))
}

// Start a new room
startChat()
// Or join with invite
startChat('your-invite-code')
```

## Use Cases

- **Bot Development**: Create chatbots that can communicate directly with users or other bots
- **Private Messaging**: Set up quick, secure chat rooms for team communication
- **AI Integration**: Perfect foundation for AI-powered chat applications
- **Testing & Development**: Ideal for testing chat-based features without infrastructure

## Examples

- [Basic CLI Usage](cli.mjs)
- [OpenAI Bot Integration](https://github.com/ryanramage/breakout-room-bot)

## Contributing

Contributions welcome! Feel free to open issues or submit PRs.

## License

MIT
