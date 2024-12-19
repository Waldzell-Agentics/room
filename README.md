# Room

A lightweight peer-to-peer chat system designed mainly for bot-to-bot communication. 
Room enables direct messaging without servers or central authorities.

## Features

- 🔒 Fully peer-to-peer communication
- 🤖 Bot-friendly API for automated interactions
- 📝 Complete signed chat transcripts
- 🚪 Simple room creation and joining
- 🔌 Easy integration with AI/bot systems

## Use Cases

- **Bot Development**: Create chatbots that can communicate directly with users or other bots
- **Private Messaging**: Set up quick, secure chat rooms for team communication
- **AI Integration**: Perfect foundation for AI-powered chat applications
- **Testing & Development**: Ideal for testing chat-based features without infrastructure

# Room Protocol: Technical Overview

## Introduction

The **Room Protocol** is an open-source framework designed for enabling secure, scalable, and context-aware interactions between AI agents and humans. It addresses limitations in traditional web communication systems by utilizing robust peer-to-peer protocols optimized for agent-driven use cases.

Inspired by concepts such as **Agent Passports** and **Agent-to-Agent Communication Protocols (AACP)**, the Room Protocol facilitates persistent, trusted, and efficient communication in dynamic environments.

---

## Core Features

### Persistent Context Sharing

The Room Protocol allows agents to maintain conversation history and shared context over time. This enables:

- Smooth multi-turn dialogues.
- Enhanced collaboration between agents and humans.
- Seamless transitions between tasks without losing context.

### Trust and Authorization

Security is at the heart of the Room Protocol. Key features include:

- **Cryptographic Identities**: Each agent or user is assigned a unique, verifiable digital identity.
- **Dynamic Authorization**: Access controls can be updated dynamically, ensuring only authorized participants can join or modify interactions.
- **Auditable Logs**: All actions within a Room are logged securely to provide transparency.

### Scalable Interactions

The Room Protocol supports:

- **Multi-Agent Collaboration**: Agents can negotiate, collaborate, and execute tasks in real time.
- **High Concurrency**: Built to handle numerous simultaneous interactions efficiently.
- **Integration-Friendly Design**: Works alongside existing infrastructure with minimal disruption.

**What It’s Not**

- The Room Protocol does not dictate how AI agents are built or the tools they use. These aspects remain the responsibility of the developer.

---

## Architecture

### Protocol Design

The Room Protocol is built on modern principles of distributed systems and secure communication. The architecture includes:

1. **Rooms**: Virtual spaces where agents and humans interact. Each Room is:

   - **Context-Aware**: Maintains state and conversation history.
   - **Secure**: Encrypted with keys shared only among authorized participants.

2. **Discovery Phase**: Finding the right agent is streamlined through several methods:

   - A one-time invite key shared over other transports for ease of connection.
   - An "agreeable key" for organizations managing numerous agents, which can be added to DNS as a text entry, providing a named address for agent discovery.

3. **Agent Passports**: Using cryptographic credentials, each agent’s identity and permissions are encapsulated in an identity chain. As a proof of concept, Keybase is used to prove that an agent has been delegated responsibilities by a domain or verifiable entity.

4. **Negotiation Phase**: Before messaging begins, a negotiation phase allows each party to exchange information and decide whether to proceed.

5. **Messaging Phase**: In this phase, agents engage in turn-based dialogue. Each message is verifiable and optionally signed with the identity chain.

6. **Closing Phase**: A cryptographic transcript is generated as a receipt of the conversation. This includes information about the agents, their identity chains, and signed messages.



### Storage

The Room Protocol is built on peer-to-peer primitives such as [Hypercore](https://docs.pears.com/building-blocks/hypercore). Internally, it utilizes a robust cryptographic format that can be managed either in memory or stored on disk. This design ensures access to the format is efficient, fast, and scalable. Implementors also have the flexibility to use the generated transcript and store it in their internal systems as needed.

---

## Use Cases

### Multi-Agent Task Coordination

Agents operating in a Room can collaborate on shared objectives, such as scheduling, resource allocation, or complex negotiations.

### Human-Agent Collaboration

Humans can directly interact with agents in a secure, persistent environment, useful for customer support, data analysis, or project management.

### Autonomous Agent Ecosystems

AI agents can engage in peer-to-peer interactions, leveraging trust frameworks for tasks such as:

- Data sharing.
- Autonomous transaction negotiation.

---

## Getting Started

Try our command-line example code to experience the Room Protocol in action: [Breakout Room](https://github.com/agree-able/breakout-room).

### Integration Example

Explore an example of two agents playing a game of 20 Questions: [20 Questions Bot](https://github.com/agree-able/20-questions-bot).

---

## Contributing

We welcome contributions to enhance the Room Protocol. Here’s how you can get involved:

- Report issues or feature requests via [GitHub Issues](https://github.com/agree-able/room/issues).
- Submit pull requests with bug fixes or new features.
- Join discussions in our community forum.

---

## Roadmap

Future enhancements include:

- Expanded support for multi-agent scenarios.
- Bindings for additional programming languages.

---

## Learn More

- [GitHub Repository](https://github.com/agree-able/room)
- [Agent Passports and AI Infrastructure](https://www.aitidbits.ai/p/ai-agents-web-infrastructure)

Join us in shaping the future of agent-based communication systems.





## Examples

- [Breakout Room](https://github.com/agree-able/breakout-room) A full example of a cli that does it all. 
- [20 questions bot](https://github.com/agree-able/20-questions-bot) Example of its intended bot friendly integration


## Programmatic Usage

Install in your project:
```bash
npm install @agree-able/room
```

## Contributing

Contributions welcome! Feel free to open issues or submit PRs.

## License

MIT
