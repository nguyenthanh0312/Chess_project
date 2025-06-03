import chess
import random
from math import log, sqrt, inf, e

class Node:
    def __init__(self, state, parent=None, move=None):
        self.state = state
        self.parent = parent
        self.move = move  
        self.children = []
        self.visits = 0
        self.value = 0.0
        self.untried_moves = list(state.legal_moves)

def ucb1(curr_node):
    ans = curr_node.v+2*(sqrt(log(curr_node.N+e+(10**-6))/(curr_node.n+(10**-10))))
    return ans

def select(node):
    while not node.untried_moves and node.children:
        node = max(node.children, key=lambda n: ucb1(n, node.visits))
    return node

def expand(node):
    move = node.untried_moves.pop()
    next_state = node.state.copy()
    next_state.push(move)
    child = Node(next_state, parent=node, move=move)
    node.children.append(child)
    return child

def simulate(state, max_random_moves=10):
    board = state.copy()
    for _ in range(max_random_moves):
        if board.is_game_over():
            break
        moves = list(board.legal_moves)
        move = random.choice(moves)
        board.push(move)
    from app import evaluation
    score = evaluation(board)
    try:
        score = float(score)
    except:
        score = 0
    return score

def backpropagate(node, reward):
    while node is not None:
        node.visits += 1
        node.value += reward
        reward = -reward  
        node = node.parent

def mcts_findNextMove(game, iteration=300):
    root = Node(game)
    for _ in range(iteration):
        node = root
        node = select(node)
        if node.untried_moves:
            node = expand(node)
        reward = simulate(node.state)
        backpropagate(node, reward)
    best_child = max(root.children, key=lambda n: n.visits)
    return best_child.move
