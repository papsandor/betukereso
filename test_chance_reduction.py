#!/usr/bin/env python3
"""
Specific test for chance reduction after 20+ stickers
"""

import requests
import json
import os
from typing import Dict, Any, Optional
import time

class ChanceReductionTester:
    def __init__(self):
        # Get backend URL from frontend .env file
        self.base_url = self._get_backend_url()
        self.created_child_id = None
        
    def _get_backend_url(self) -> str:
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
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=10, allow_redirects=True)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, timeout=10, allow_redirects=True)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, timeout=10, allow_redirects=True)
            elif method.upper() == "DELETE":
                response = requests.delete(url, timeout=10, allow_redirects=True)
            else:
                return False, f"Unsupported method: {method}", 0
            
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return response.status_code < 400, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, str(e), 0

    def test_chance_reduction_comprehensive(self):
        """Comprehensive test for chance reduction after 20+ stickers"""
        print("🎯 COMPREHENSIVE CHANCE REDUCTION TEST")
        print("=" * 60)
        
        # Create child
        child_data = {"name": "Chance Test Child"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        if not success:
            print("❌ Failed to create child")
            return
        
        self.created_child_id = data["id"]
        print(f"✅ Created test child: {self.created_child_id}")
        
        # Enable stickers
        setting_data = {"key": "stickers_enabled", "value": True}
        self.make_request("PUT", f"/children/{self.created_child_id}/settings", setting_data)
        
        # Earn exactly 25 stickers by cycling through streak 3 threshold
        print("\n📈 Earning 25 stickers to test probability reduction...")
        stickers_earned = 0
        cycle = 0
        
        while stickers_earned < 25:
            cycle += 1
            # Reset streak
            wrong_answer = {"game_mode": "find-letter", "grapheme": f"reset_{cycle}", "is_correct": False, "response_time": 1000}
            self.make_request("POST", f"/children/{self.created_child_id}/progress", wrong_answer)
            
            # Reach streak 3 to trigger sticker
            for i in range(3):
                answer = {"game_mode": "find-letter", "grapheme": f"earn_{cycle}_{i}", "is_correct": True, "response_time": 1000}
                success, progress_data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", answer)
                
                if success and i == 2:  # At streak 3
                    sticker_earned = progress_data.get("sticker_earned")
                    if sticker_earned:
                        stickers_earned += 1
                        if stickers_earned % 5 == 0:
                            print(f"   Earned {stickers_earned} stickers...")
        
        print(f"✅ Successfully earned {stickers_earned} stickers")
        
        # Now test probability reduction with 25+ stickers
        print(f"\n🎲 Testing probability reduction with {stickers_earned} total stickers...")
        
        # Test 50 cycles of reaching streak 3 threshold
        test_cycles = 50
        awards_after_25 = []
        
        for test_cycle in range(test_cycles):
            # Reset streak
            wrong_answer = {"game_mode": "find-letter", "grapheme": f"test_reset_{test_cycle}", "is_correct": False, "response_time": 1000}
            self.make_request("POST", f"/children/{self.created_child_id}/progress", wrong_answer)
            
            # Reach streak 3
            for i in range(3):
                answer = {"game_mode": "find-letter", "grapheme": f"test_{test_cycle}_{i}", "is_correct": True, "response_time": 1000}
                success, progress_data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", answer)
                
                if success and i == 2:  # At streak 3
                    sticker_earned = progress_data.get("sticker_earned")
                    awards_after_25.append(sticker_earned is not None)
                    if sticker_earned:
                        stickers_earned += 1
        
        # Analyze results
        stickers_awarded_after_25 = sum(awards_after_25)
        award_rate = stickers_awarded_after_25 / test_cycles * 100
        
        # Get final sticker count
        success, final_child_data, status = self.make_request("GET", f"/children/{self.created_child_id}")
        final_stickers = final_child_data.get("total_stickers", 0) if success else stickers_earned
        
        print(f"\n📊 RESULTS:")
        print(f"   Initial stickers: 25")
        print(f"   Final stickers: {final_stickers}")
        print(f"   Test cycles: {test_cycles}")
        print(f"   Stickers awarded in test: {stickers_awarded_after_25}")
        print(f"   Award rate: {award_rate:.1f}%")
        
        # Expected probability with 25+ stickers should be around 95% (5% reduction)
        # With 30+ stickers should be around 90% (10% reduction)
        # etc.
        
        if award_rate < 95:
            print(f"✅ PASS: Probability reduction is working! Award rate {award_rate:.1f}% is less than 95%")
            print(f"   This confirms the 1% reduction per sticker above 20 is active.")
        else:
            print(f"❌ FAIL: No probability reduction observed. Award rate {award_rate:.1f}% is too high.")
            print(f"   Expected reduction with {final_stickers} total stickers.")
        
        # Cleanup
        self.make_request("DELETE", f"/children/{self.created_child_id}")
        print(f"\n🧹 Cleaned up test child")

if __name__ == "__main__":
    tester = ChanceReductionTester()
    tester.test_chance_reduction_comprehensive()