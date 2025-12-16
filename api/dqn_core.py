import json
import math
from collections import deque
import random

class SimpleDQN:
    def __init__(self):
        self.q_table = {}
        self.memory = deque(maxlen=1000)
        self.epsilon = 1.0
        self.epsilon_decay = 0.995
        self.min_epsilon = 0.01
        self.learning_rate = 0.1
        self.gamma = 0.9
        
    def encode_state(self, text):
        """Convert text to simple state representation"""
        return hash(text) % 1000
    
    def get_q_value(self, state, action):
        """Get Q-value for state-action pair"""
        key = f"{state}_{action}"
        return self.q_table.get(key, 0.0)
    
    def update_q_value(self, state, action, reward, next_state):
        """Update Q-value using Q-learning formula"""
        key = f"{state}_{action}"
        current_q = self.get_q_value(state, action)
        
        # Find max Q-value for next state
        max_next_q = 0
        for a in range(4):  # 4 possible actions
            next_q = self.get_q_value(next_state, a)
            if next_q > max_next_q:
                max_next_q = next_q
        
        # Q-learning update
        new_q = current_q + self.learning_rate * (reward + self.gamma * max_next_q - current_q)
        self.q_table[key] = new_q
        
        return new_q
    
    def select_action(self, state):
        """Select action using epsilon-greedy policy"""
        if random.random() < self.epsilon:
            return random.randint(0, 3)  # Random action
        
        # Choose best action
        best_action = 0
        best_q = self.get_q_value(state, 0)
        
        for action in range(1, 4):
            q_val = self.get_q_value(state, action)
            if q_val > best_q:
                best_q = q_val
                best_action = action
        
        return best_action
    
    def learn_from_interaction(self, user_input, ai_response):
        """Learn from user interaction"""
        try:
            state = self.encode_state(user_input)
            next_state = self.encode_state(ai_response)
            
            # Simple reward based on interaction length
            reward = min(len(ai_response) / 100, 1.0)
            
            action = self.select_action(state)
            new_q = self.update_q_value(state, action, reward, next_state)
            
            # Store experience
            self.memory.append({
                "state": state,
                "action": action,
                "reward": reward,
                "next_state": next_state,
                "q_value": new_q
            })
            
            # Decay epsilon
            if self.epsilon > self.min_epsilon:
                self.epsilon *= self.epsilon_decay
            
            return {
                "state": state,
                "action": action,
                "reward": reward,
                "q_value": new_q,
                "epsilon": self.epsilon
            }
        except Exception as e:
            print(f"DQN learning error: {e}")
            return {
                "state": 0,
                "action": 0,
                "reward": 0.0,
                "q_value": 0.0,
                "epsilon": self.epsilon,
                "error": str(e)
            }
    
    def get_reasoning_analysis(self, query):
        """Provide reasoning analysis for query"""
        try:
            state = self.encode_state(query)
            action = self.select_action(state)
            
            reasoning_steps = []
            if len(query.split()) > 5:
                reasoning_steps.append("Complex query - multi-step reasoning")
            if action > 2:
                reasoning_steps.append("High-level cognitive processing")
            else:
                reasoning_steps.append("Direct response processing")
            
            confidence = 1.0 - self.epsilon  # Higher confidence as epsilon decreases
            
            return {
                "reasoning_steps": reasoning_steps,
                "confidence": confidence,
                "state": state,
                "action": action,
                "q_value": self.get_q_value(state, action)
            }
        except Exception as e:
            print(f"DQN reasoning error: {e}")
            return {
                "reasoning_steps": ["Error in analysis"],
                "confidence": 0.0,
                "state": 0,
                "action": 0,
                "q_value": 0.0
            }

# Global DQN instance
dqn = SimpleDQN()