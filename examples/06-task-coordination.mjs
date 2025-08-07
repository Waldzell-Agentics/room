#!/usr/bin/env node

import { RoomManager } from '../index.mjs'

/**
 * Example 6: Task Coordination System
 * 
 * This example demonstrates a practical use case:
 * - Multiple AI agents coordinating on tasks
 * - Task assignment and status tracking
 * - Progress reporting and handoffs
 * - Error handling and retry logic
 * - Real-time status dashboard
 */

class TaskCoordinator {
  constructor(room) {
    this.room = room
    this.tasks = new Map()
    this.agents = new Map()
    this.completedTasks = []
    
    this.setupHandlers()
  }

  setupHandlers() {
    this.room.on('message', async (message) => {
      if (message.who === this.room.metadata.who) return
      
      const data = message.data
      if (typeof data !== 'object') return
      
      switch (data.type) {
        case 'agent_ready':
          await this.handleAgentReady(data, message.who)
          break
        case 'task_update':
          await this.handleTaskUpdate(data, message.who)
          break
        case 'task_complete':
          await this.handleTaskComplete(data, message.who)
          break
        case 'task_error':
          await this.handleTaskError(data, message.who)
          break
      }
    })
  }

  async createTask(id, description, requirements) {
    const task = {
      id,
      description,
      requirements,
      status: 'pending',
      assignedTo: null,
      createdAt: Date.now(),
      attempts: 0
    }
    
    this.tasks.set(id, task)
    
    await this.room.message({
      type: 'new_task',
      task
    })
    
    console.log(`📋 Coordinator: Created task ${id} - ${description}`)
    return task
  }

  async handleAgentReady(data, agentId) {
    this.agents.set(agentId, {
      id: agentId,
      name: data.name,
      capabilities: data.capabilities,
      status: 'available'
    })
    
    console.log(`✅ Coordinator: Agent ${data.name} is ready with capabilities: ${data.capabilities.join(', ')}`)
    
    // Assign pending tasks if any match
    await this.assignPendingTasks()
  }

  async assignPendingTasks() {
    for (const [taskId, task] of this.tasks) {
      if (task.status === 'pending') {
        const agent = this.findAvailableAgent(task.requirements)
        if (agent) {
          await this.assignTask(taskId, agent.id)
        }
      }
    }
  }

  findAvailableAgent(requirements) {
    for (const [agentId, agent] of this.agents) {
      if (agent.status === 'available' && 
          requirements.every(req => agent.capabilities.includes(req))) {
        return agent
      }
    }
    return null
  }

  async assignTask(taskId, agentId) {
    const task = this.tasks.get(taskId)
    const agent = this.agents.get(agentId)
    
    task.status = 'assigned'
    task.assignedTo = agentId
    task.assignedAt = Date.now()
    agent.status = 'busy'
    
    await this.room.message({
      type: 'task_assignment',
      taskId,
      agentId,
      task
    })
    
    console.log(`📌 Coordinator: Assigned task ${taskId} to ${agent.name}`)
  }

  async handleTaskUpdate(data, agentId) {
    const task = this.tasks.get(data.taskId)
    if (task && task.assignedTo === agentId) {
      task.status = 'in_progress'
      task.progress = data.progress
      console.log(`📊 Coordinator: Task ${data.taskId} progress: ${data.progress}% - ${data.message}`)
    }
  }

  async handleTaskComplete(data, agentId) {
    const task = this.tasks.get(data.taskId)
    if (task && task.assignedTo === agentId) {
      task.status = 'completed'
      task.completedAt = Date.now()
      task.result = data.result
      
      this.completedTasks.push(task)
      this.tasks.delete(data.taskId)
      
      const agent = this.agents.get(agentId)
      agent.status = 'available'
      
      console.log(`✅ Coordinator: Task ${data.taskId} completed by ${agent.name}`)
      console.log(`   Result: ${JSON.stringify(data.result)}`)
      
      // Check for more tasks
      await this.assignPendingTasks()
    }
  }

  async handleTaskError(data, agentId) {
    const task = this.tasks.get(data.taskId)
    if (task && task.assignedTo === agentId) {
      task.attempts++
      console.log(`❌ Coordinator: Task ${data.taskId} failed - ${data.error}`)
      
      const agent = this.agents.get(agentId)
      agent.status = 'available'
      
      if (task.attempts < 3) {
        // Retry with different agent
        task.status = 'pending'
        task.assignedTo = null
        console.log(`🔄 Coordinator: Retrying task ${data.taskId} (attempt ${task.attempts + 1}/3)`)
        await this.assignPendingTasks()
      } else {
        // Mark as failed
        task.status = 'failed'
        console.log(`💔 Coordinator: Task ${data.taskId} permanently failed after 3 attempts`)
      }
    }
  }

  getStatus() {
    const status = {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: this.completedTasks.length,
      failed: 0
    }
    
    for (const task of this.tasks.values()) {
      status[task.status] = (status[task.status] || 0) + 1
    }
    
    return status
  }
}

class TaskAgent {
  constructor(name, capabilities, room) {
    this.name = name
    this.capabilities = capabilities
    this.room = room
    this.currentTask = null
    
    this.setupHandlers()
  }

  async start() {
    await this.room.message({
      type: 'agent_ready',
      name: this.name,
      capabilities: this.capabilities
    })
    console.log(`🤖 ${this.name}: Ready with capabilities [${this.capabilities.join(', ')}]`)
  }

  setupHandlers() {
    this.room.on('message', async (message) => {
      if (message.who === this.room.metadata.who) return
      
      const data = message.data
      if (typeof data !== 'object') return
      
      if (data.type === 'task_assignment' && data.agentId === this.room.metadata.who) {
        await this.handleTaskAssignment(data)
      }
    })
  }

  async handleTaskAssignment(data) {
    this.currentTask = data.task
    console.log(`📥 ${this.name}: Received task ${data.taskId} - ${data.task.description}`)
    
    // Simulate task processing
    await this.processTask()
  }

  async processTask() {
    const taskId = this.currentTask.id
    
    try {
      // Send progress updates
      for (let progress = 0; progress <= 100; progress += 25) {
        await this.room.message({
          type: 'task_update',
          taskId,
          progress,
          message: `Processing ${this.currentTask.description}...`
        })
        
        if (progress < 100) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Simulate task completion with result
      const result = this.generateTaskResult()
      
      await this.room.message({
        type: 'task_complete',
        taskId,
        result
      })
      
      console.log(`✅ ${this.name}: Completed task ${taskId}`)
      this.currentTask = null
      
    } catch (error) {
      // Simulate random errors
      await this.room.message({
        type: 'task_error',
        taskId,
        error: error.message
      })
      
      console.log(`❌ ${this.name}: Failed task ${taskId} - ${error.message}`)
      this.currentTask = null
    }
  }

  generateTaskResult() {
    // Generate different results based on capabilities
    if (this.capabilities.includes('analysis')) {
      return {
        type: 'analysis',
        metrics: {
          score: Math.floor(Math.random() * 100),
          confidence: Math.random().toFixed(2),
          timestamp: new Date().toISOString()
        }
      }
    } else if (this.capabilities.includes('processing')) {
      return {
        type: 'processed',
        items: Math.floor(Math.random() * 1000),
        duration: Math.floor(Math.random() * 5000) + 'ms'
      }
    } else {
      return {
        type: 'generic',
        success: true,
        data: `Result from ${this.name}`
      }
    }
  }
}

async function taskCoordinationExample() {
  console.log('🎯 Task Coordination System Example\n')
  
  // ===== SETUP ROOM MANAGER =====
  const manager = new RoomManager()
  
  // ===== CREATE COORDINATION ROOM =====
  console.log('=== Setting up Coordination Room ===')
  const coordinatorRoom = manager.createRoom({
    metadata: {
      purpose: 'Task Coordination Hub',
      type: 'coordinator'
    }
  })
  
  const inviteCode = await coordinatorRoom.ready()
  const coordinator = new TaskCoordinator(coordinatorRoom)
  console.log(`📡 Coordination room created: ${inviteCode}`)
  console.log()

  // ===== CREATE AGENT ROOMS =====
  console.log('=== Creating Task Agents ===')
  
  // Data Analysis Agent
  const analystRoom = manager.createRoom({ invite: inviteCode })
  await analystRoom.ready()
  const analyst = new TaskAgent('DataAnalyst', ['analysis', 'reporting'], analystRoom)
  
  // Processing Agent
  const processorRoom = manager.createRoom({ invite: inviteCode })
  await processorRoom.ready()
  const processor = new TaskAgent('Processor', ['processing', 'transformation'], processorRoom)
  
  // Multi-skilled Agent
  const multiAgentRoom = manager.createRoom({ invite: inviteCode })
  await multiAgentRoom.ready()
  const multiAgent = new TaskAgent('MultiAgent', ['analysis', 'processing', 'reporting'], multiAgentRoom)
  
  // Allow connections
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Start all agents
  await analyst.start()
  await processor.start()
  await multiAgent.start()
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log()

  // ===== CREATE TASKS =====
  console.log('=== Creating Tasks ===')
  
  await coordinator.createTask('task-001', 'Analyze user behavior data', ['analysis'])
  await coordinator.createTask('task-002', 'Process transaction logs', ['processing'])
  await coordinator.createTask('task-003', 'Generate monthly report', ['analysis', 'reporting'])
  await coordinator.createTask('task-004', 'Transform data format', ['processing', 'transformation'])
  await coordinator.createTask('task-005', 'Analyze and process metrics', ['analysis', 'processing'])
  
  console.log()

  // ===== MONITOR PROGRESS =====
  console.log('=== Task Execution in Progress ===')
  console.log('(Agents are working autonomously...)\n')
  
  // Let tasks run
  const startTime = Date.now()
  const maxRuntime = 20000 // 20 seconds
  
  while (Date.now() - startTime < maxRuntime) {
    const status = coordinator.getStatus()
    const hasActiveTasks = status.pending > 0 || status.assigned > 0 || status.in_progress > 0
    
    if (!hasActiveTasks && status.completed > 0) {
      console.log('\n✅ All tasks completed!')
      break
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // ===== FINAL STATUS =====
  console.log('\n=== Final Status Report ===')
  const finalStatus = coordinator.getStatus()
  console.log('📊 Task Summary:')
  console.log(`   Completed: ${finalStatus.completed}`)
  console.log(`   Failed: ${finalStatus.failed}`)
  console.log(`   Pending: ${finalStatus.pending}`)
  console.log(`   In Progress: ${finalStatus.in_progress}`)
  
  if (coordinator.completedTasks.length > 0) {
    console.log('\n📋 Completed Tasks:')
    coordinator.completedTasks.forEach(task => {
      const duration = task.completedAt - task.assignedAt
      console.log(`   - ${task.id}: ${task.description}`)
      console.log(`     Duration: ${duration}ms`)
      console.log(`     Result: ${JSON.stringify(task.result)}`)
    })
  }
  console.log()

  // ===== CLEANUP =====
  console.log('=== Cleanup ===')
  await manager.cleanup()
  console.log('✅ Task coordination example completed!')
}

// Run the example
taskCoordinationExample().catch(console.error)