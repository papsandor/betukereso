#!/usr/bin/env python3
"""
Debug Sticker Logic Test
"""

import requests
import json

def get_backend_url():
    """Read backend URL from frontend .env file"""
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=', 1)[1].strip()
                    return f"{url}/api"
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return "http://localhost:8001/api"

def make_request(method: str, endpoint: str, data=None):
    """Make HTTP request"""
    base_url = get_backend_url()
    url = f"{base_url}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, timeout=10, allow_redirects=True)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, timeout=10, allow_redirects=True)
        elif method.upper() == "DELETE":
            response = requests.delete(url, timeout=10, allow_redirects=True)
        
        try:
            response_data = response.json()
        except:
            response_data = response.text
        
        return response.status_code < 400, response_data, response.status_code
        
    except requests.exceptions.RequestException as e:
        return False, str(e), 0

def debug_sticker_logic():
    print("🔍 Debugging Sticker Logic")
    print("=" * 40)
    
    # Create test child
    child_data = {"name": "Sticker Debug Child"}
    success, data, status = make_request("POST", "/children/", child_data)
    
    if not success:
        print(f"❌ Failed to create child: {data}")
        return
    
    child_id = data["id"]
    print(f"✅ Created child: {child_id}")
    
    # Check initial state
    success, child_state, status = make_request("GET", f"/children/{child_id}")
    print(f"📊 Initial state: streak={child_state.get('streak')}, stickers={child_state.get('total_stickers')}")
    
    # Send 3 consecutive correct answers
    for i in range(3):
        session_data = {
            "game_mode": "find-letter",
            "grapheme": f"debug_{i}",
            "is_correct": True,
            "response_time": 1500
        }
        
        success, response_data, status = make_request("POST", f"/children/{child_id}/progress", session_data)
        print(f"📝 Step {i+1}: Success={success}, Response={response_data}")
        
        if success:
            # Check child state after each step
            success, child_state, status = make_request("GET", f"/children/{child_id}")
            print(f"   Child state: streak={child_state.get('streak')}, stickers={child_state.get('total_stickers')}")
            
            # Check if sticker was earned in response
            if response_data.get('sticker_earned'):
                print(f"   🎉 Sticker earned: {response_data['sticker_earned']}")
    
    # Check final stickers
    success, stickers, status = make_request("GET", f"/children/{child_id}/stickers")
    print(f"🏆 Final stickers: {stickers}")
    
    # Cleanup
    make_request("DELETE", f"/children/{child_id}")
    print("🧹 Cleaned up test child")

if __name__ == "__main__":
    debug_sticker_logic()