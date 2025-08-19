#!/usr/bin/env python3
"""
Debug script to understand the random graphemes behavior
"""

import requests
import json

def test_random_graphemes_debug():
    base_url = "https://magyar-abc.preview.emergentagent.com/api"
    
    # Test with include_foreign=False to see what's in the pool
    print("Testing with include_foreign=False, count=20 (to see full pool)")
    for i in range(5):
        response = requests.get(f"{base_url}/game/graphemes/random", 
                              params={"count": 20, "include_foreign": False, "trouble_bias": False})
        if response.status_code == 200:
            data = response.json()
            graphemes = data["graphemes"]
            print(f"Call {i+1}: {len(graphemes)} graphemes")
            print(f"  Contains dz: {'dz' in graphemes}")
            print(f"  Contains dzs: {'dzs' in graphemes}")
            print(f"  Contains w: {'w' in graphemes}")
            print(f"  Graphemes: {sorted(graphemes)}")
        else:
            print(f"Call {i+1}: Error {response.status_code}")
        print()
    
    print("\nTesting with include_foreign=True, count=20")
    for i in range(5):
        response = requests.get(f"{base_url}/game/graphemes/random", 
                              params={"count": 20, "include_foreign": True, "trouble_bias": False})
        if response.status_code == 200:
            data = response.json()
            graphemes = data["graphemes"]
            print(f"Call {i+1}: {len(graphemes)} graphemes")
            print(f"  Contains dz: {'dz' in graphemes}")
            print(f"  Contains dzs: {'dzs' in graphemes}")
            print(f"  Contains w: {'w' in graphemes}")
            print(f"  Graphemes: {sorted(graphemes)}")
        else:
            print(f"Call {i+1}: Error {response.status_code}")
        print()

if __name__ == "__main__":
    test_random_graphemes_debug()