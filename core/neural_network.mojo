from tensor import Tensor
from random import random_float64
import math

struct CriticalDeepQNetwork:
    var input_layer: Tensor[DType.float64]
    var hidden1: Tensor[DType.float64] 
    var hidden2: Tensor[DType.float64]
    var hidden3: Tensor[DType.float64]
    var output_layer: Tensor[DType.float64]
    var learning_rate: Float64
    
    fn __init__(inout self, input_size: Int, hidden_size: Int, output_size: Int):
        self.learning_rate = 0.001
        # 5-layer architecture: input -> 3 hidden -> output
        self.input_layer = Tensor[DType.float64](input_size, hidden_size)
        self.hidden1 = Tensor[DType.float64](hidden_size, hidden_size)
        self.hidden2 = Tensor[DType.float64](hidden_size, hidden_size) 
        self.hidden3 = Tensor[DType.float64](hidden_size, hidden_size)
        self.output_layer = Tensor[DType.float64](hidden_size, output_size)
        self._initialize_weights()
    
    fn _initialize_weights(inout self):
        # Xavier initialization for deep networks
        let fan_in = self.input_layer.shape()[0]
        let fan_out = self.input_layer.shape()[1]
        let limit = math.sqrt(6.0 / (fan_in + fan_out))
        
        for i in range(self.input_layer.num_elements()):
            self.input_layer[i] = random_float64(-limit, limit)
    
    fn critical_activation(self, x: Float64) -> Float64:
        # Critical deep Q activation function
        return math.tanh(x) * (1.0 + 0.1 * math.sin(x))
    
    fn forward(self, input: Tensor[DType.float64]) -> Tensor[DType.float64]:
        # Forward pass through 5-layer network
        var h1 = self._layer_forward(input, self.input_layer)
        var h2 = self._layer_forward(h1, self.hidden1)
        var h3 = self._layer_forward(h2, self.hidden2)
        var h4 = self._layer_forward(h3, self.hidden3)
        return self._layer_forward(h4, self.output_layer)
    
    fn _layer_forward(self, input: Tensor[DType.float64], weights: Tensor[DType.float64]) -> Tensor[DType.float64]:
        var output = Tensor[DType.float64](weights.shape()[1])
        for i in range(weights.shape()[1]):
            var sum: Float64 = 0.0
            for j in range(weights.shape()[0]):
                sum += input[j] * weights[j * weights.shape()[1] + i]
            output[i] = self.critical_activation(sum)
        return output
    
    fn self_reference_update(inout self, reasoning_feedback: Float64):
        # Self-referencing mechanism for continuous improvement
        self.learning_rate *= (1.0 + reasoning_feedback * 0.01)