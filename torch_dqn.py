import json
import torch
import torch.nn as nn
import torch.optim as optim
from collections import namedtuple, deque
import random

class QNetwork(nn.Module):
    def __init__(self, state_size, action_size):
        super(QNetwork, self).__init__()
        self.fc1 = nn.Linear(state_size, 128)
        self.fc2 = nn.Linear(128, 64)
        self.fc3 = nn.Linear(64, action_size)

    def forward(self, state):
        x = torch.relu(self.fc1(state))
        x = torch.relu(self.fc2(x))
        return self.fc3(x)

class ReplayBuffer:
    def __init__(self, buffer_size):
        self.buffer_size = buffer_size
        self.memory = deque(maxlen=buffer_size)
        self.Transition = namedtuple('Transition', ('state', 'action', 'reward', 'next_state', 'done'))

    def add(self, state, action, reward, next_state, done):
        transition = self.Transition(state, action, reward, next_state, done)
        self.memory.append(transition)

    def sample(self, batch_size):
        batch = random.sample(self.memory, batch_size)
        return self.Transition(*zip(*batch))

class UltimaDQN:
    def __init__(self, state_size=128, action_size=4):
        self.state_size = state_size
        self.action_size = action_size
        self.q_network = QNetwork(state_size, action_size)
        self.target_network = QNetwork(state_size, action_size)
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=0.001)
        self.buffer = ReplayBuffer(10000)
        self.epsilon = 1.0
        self.epsilon_decay = 0.995
        self.min_epsilon = 0.01
        self.gamma = 0.99
        self.batch_size = 64
        self.update_frequency = 100
        self.steps = 0
        
    def encode_text_to_tensor(self, text):
        """Convert text to tensor representation"""
        # Simple encoding: use character codes
        chars = [ord(c) for c in text[:self.state_size]]
        # Pad or truncate to state_size
        while len(chars) < self.state_size:
            chars.append(0)
        chars = chars[:self.state_size]
        return torch.tensor(chars, dtype=torch.float32).unsqueeze(0)
    
    def select_action(self, state_tensor):
        """Select action using epsilon-greedy policy"""
        if random.random() < self.epsilon:
            return random.randint(0, self.action_size - 1)
        
        with torch.no_grad():
            q_values = self.q_network(state_tensor)
            return torch.argmax(q_values).item()
    
    def learn_from_text(self, user_input, ai_response):
        """Learn from text interaction"""
        state = self.encode_text_to_tensor(user_input)
        next_state = self.encode_text_to_tensor(ai_response)
        
        action = self.select_action(state)
        reward = min(len(ai_response) / 100, 1.0)  # Simple reward
        
        # Store experience
        self.buffer.add(state.squeeze(), action, reward, next_state.squeeze(), False)
        
        # Train if enough samples
        if len(self.buffer.memory) >= self.batch_size:
            self.train()
        
        # Decay epsilon
        if self.epsilon > self.min_epsilon:
            self.epsilon *= self.epsilon_decay
        
        self.steps += 1
        
        return {
            "action": action,
            "reward": reward,
            "epsilon": self.epsilon,
            "q_value": self.q_network(state).max().item()
        }
    
    def train(self):
        """Train the DQN"""
        if len(self.buffer.memory) < self.batch_size:
            return
        
        transitions = self.buffer.sample(self.batch_size)
        batch = self.buffer.Transition(*zip(*transitions))
        
        state_batch = torch.stack(batch.state)
        action_batch = torch.tensor(batch.action)
        reward_batch = torch.tensor(batch.reward)
        next_state_batch = torch.stack(batch.next_state)
        
        current_q_values = self.q_network(state_batch).gather(1, action_batch.unsqueeze(1))
        next_q_values = self.target_network(next_state_batch).max(1)[0].detach()
        target_q_values = reward_batch + (self.gamma * next_q_values)
        
        loss = nn.MSELoss()(current_q_values.squeeze(), target_q_values)
        
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        # Update target network
        if self.steps % self.update_frequency == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())
    
    def get_reasoning_analysis(self, query):
        """Get reasoning analysis for query"""
        state = self.encode_text_to_tensor(query)
        
        with torch.no_grad():
            q_values = self.q_network(state)
            action = torch.argmax(q_values).item()
            confidence = torch.softmax(q_values, dim=1).max().item()
        
        reasoning_steps = []
        if len(query.split()) > 5:
            reasoning_steps.append("Complex multi-token analysis")
        if action >= 2:
            reasoning_steps.append("Advanced cognitive processing")
        else:
            reasoning_steps.append("Direct pattern matching")
        
        return {
            "reasoning_steps": reasoning_steps,
            "confidence": confidence,
            "action": action,
            "q_values": q_values.tolist()[0][:4]  # First 4 Q-values
        }

# Global Ultima DQN instance
ultima_dqn = UltimaDQN()