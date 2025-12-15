# token_module.py
import hashlib
import json
import time

# In-memory storage for simulated token balances and transactions
# In a real application, this would be a database.
_user_balances = {
    "default_user": 1000 # Starting balance for a generic user
}
_transactions = [] # List to store simulated transactions

TOKEN_COST_PER_CHAT_MESSAGE = 10 # Example cost
TOKEN_COST_PER_PROMPT_SUGGESTION = 50
TOKEN_COST_PER_CODE_SUGGESTION = 100
TOKEN_COST_PER_TOOL_SUGGESTION = 150

def get_balance(user_id: str = "default_user") -> int:
    """Retrieves the simulated token balance for a given user."""
    return _user_balances.get(user_id, 0)

def deduct_tokens(user_id: str, amount: int) -> bool:
    """Simulates deducting tokens from a user's balance."""
    if _user_balances.get(user_id, 0) >= amount:
        _user_balances[user_id] -= amount
        return True
    return False

def generate_transaction_hash(data: dict) -> str:
    """Generates a SHA256 hash for transaction data."""
    # Ensure data is consistently ordered for hashing
    serialized_data = json.dumps(data, sort_keys=True).encode('utf-8')
    return hashlib.sha256(serialized_data).hexdigest()

def record_transaction(user_id: str, type: str, amount: int, description: str, associated_data: dict = None) -> str:
    """Simulates recording a transaction and returns its hash."""
    transaction_data = {
        "timestamp": time.time(),
        "user_id": user_id,
        "type": type, # e.g., "deduction", "topup"
        "amount": amount,
        "description": description,
        "associated_data": associated_data if associated_data is not None else {}
    }
    tx_hash = generate_transaction_hash(transaction_data)
    transaction_data["transaction_hash"] = tx_hash
    _transactions.append(transaction_data)
    print(f"Simulated transaction recorded: {tx_hash} - {description}") # For demonstration
    return tx_hash

def get_transaction_history(user_id: str = "default_user") -> list:
    """Retrieves simulated transaction history for a user."""
    return [tx for tx in _transactions if tx["user_id"] == user_id]

# Initial top-up transaction for default user
record_transaction("default_user", "topup", _user_balances["default_user"], "Initial token allocation")
