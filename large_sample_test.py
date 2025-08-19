#!/usr/bin/env python3
"""
Large sample test for rare grapheme statistics
"""

import requests
import json

def test_rare_graphemes_large_sample():
    base_url = "https://magyar-abc.preview.emergentagent.com/api"
    
    # Test with larger sample size for better statistics
    total_calls = 50
    rare_graphemes = ["dz", "dzs", "w"]
    
    print(f"Testing with {total_calls} calls for better statistics")
    print("=" * 60)
    
    # Test include_foreign=False
    print("\nTesting include_foreign=False:")
    rare_presence_count = {rare: 0 for rare in rare_graphemes}
    
    for i in range(total_calls):
        response = requests.get(f"{base_url}/game/graphemes/random", 
                              params={"count": 15, "include_foreign": False, "trouble_bias": True})
        if response.status_code == 200:
            data = response.json()
            graphemes = data["graphemes"]
            for rare in rare_graphemes:
                if rare in graphemes:
                    rare_presence_count[rare] += 1
    
    for rare in rare_graphemes:
        presence_rate = rare_presence_count[rare] / total_calls * 100
        print(f"  {rare}: Present in {rare_presence_count[rare]}/{total_calls} calls ({presence_rate:.1f}%)")
    
    # Test include_foreign=True
    print("\nTesting include_foreign=True:")
    rare_presence_count = {rare: 0 for rare in rare_graphemes}
    
    for i in range(total_calls):
        response = requests.get(f"{base_url}/game/graphemes/random", 
                              params={"count": 15, "include_foreign": True, "trouble_bias": True})
        if response.status_code == 200:
            data = response.json()
            graphemes = data["graphemes"]
            for rare in rare_graphemes:
                if rare in graphemes:
                    rare_presence_count[rare] += 1
    
    for rare in rare_graphemes:
        presence_rate = rare_presence_count[rare] / total_calls * 100
        print(f"  {rare}: Present in {rare_presence_count[rare]}/{total_calls} calls ({presence_rate:.1f}%)")

if __name__ == "__main__":
    test_rare_graphemes_large_sample()