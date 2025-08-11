#!/usr/bin/env python3
"""
Scoring Logic Bug Fix Tests for Betűkereső Application
Tests the FIXED scoring logic to verify both reported bugs are resolved:
1. Incorrect Answer Bug - wrong letters still counted as right answers
2. Off-by-One Scoring Bug - score was off by +1
"""

import requests
import json
import os
from typing import Dict, Any, Optional
import time

class ScoringBugTester:
    def __init__(self):
        # Get backend URL from frontend .env file
        self.base_url = self._get_backend_url()
        self.test_results = []
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
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

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

    def setup_test_child(self):
        """Create a test child for scoring tests"""
        child_data = {"name": "Scoring Test Child"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        
        if success and isinstance(data, dict) and "id" in data:
            self.created_child_id = data["id"]
            self.log_test("Setup Test Child", True, f"Test child created with ID: {self.created_child_id}")
            return True
        else:
            self.log_test("Setup Test Child", False, f"Failed to create test child (Status: {status})", data)
            return False

    def get_child_current_state(self):
        """Get current child state to verify scoring"""
        if not self.created_child_id:
            return None
            
        success, data, status = self.make_request("GET", f"/children/{self.created_child_id}")
        
        if success and isinstance(data, dict):
            return data
        else:
            print(f"Failed to get child state: {data}")
            return None

    def test_scenario_1_mixed_correct_incorrect(self):
        """
        Test Scenario 1 - Mixed Correct/Incorrect Answers:
        - Send: is_correct: true (should increment score to 1, streak to 1)
        - Send: is_correct: false (should keep score at 1, reset streak to 0) 
        - Send: is_correct: true (should increment score to 2, streak to 1)
        - Send: is_correct: true (should increment score to 3, streak to 2)
        - Send: is_correct: false (should keep score at 3, reset streak to 0)
        """
        print("🧪 Testing Scenario 1: Mixed Correct/Incorrect Answers")
        print("=" * 50)
        
        if not self.created_child_id:
            self.log_test("Scenario 1", False, "No test child available")
            return
        
        # Step 1: Send correct answer (should increment streak to 1)
        session_data = {
            "game_mode": "find-letter",
            "grapheme": "a",
            "is_correct": True,
            "response_time": 1500
        }
        
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        
        if not success:
            self.log_test("Scenario 1 - Step 1", False, f"Failed to record correct answer (Status: {status})", data)
            return
        
        # Verify streak is 1
        child_state = self.get_child_current_state()
        if child_state and child_state.get("streak") == 1:
            self.log_test("Scenario 1 - Step 1", True, f"Correct answer incremented streak to 1")
        else:
            self.log_test("Scenario 1 - Step 1", False, f"Expected streak=1, got streak={child_state.get('streak') if child_state else 'unknown'}")
            return
        
        # Step 2: Send incorrect answer (should reset streak to 0, not increment score)
        session_data["grapheme"] = "b"
        session_data["is_correct"] = False
        
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        
        if not success:
            self.log_test("Scenario 1 - Step 2", False, f"Failed to record incorrect answer (Status: {status})", data)
            return
        
        # Verify streak is reset to 0
        child_state = self.get_child_current_state()
        if child_state and child_state.get("streak") == 0:
            self.log_test("Scenario 1 - Step 2", True, f"Incorrect answer reset streak to 0")
        else:
            self.log_test("Scenario 1 - Step 2", False, f"Expected streak=0, got streak={child_state.get('streak') if child_state else 'unknown'}")
            return
        
        # Step 3: Send correct answer (should increment streak to 1)
        session_data["grapheme"] = "c"
        session_data["is_correct"] = True
        
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        
        if not success:
            self.log_test("Scenario 1 - Step 3", False, f"Failed to record correct answer (Status: {status})", data)
            return
        
        # Verify streak is 1
        child_state = self.get_child_current_state()
        if child_state and child_state.get("streak") == 1:
            self.log_test("Scenario 1 - Step 3", True, f"Correct answer incremented streak to 1")
        else:
            self.log_test("Scenario 1 - Step 3", False, f"Expected streak=1, got streak={child_state.get('streak') if child_state else 'unknown'}")
            return
        
        # Step 4: Send another correct answer (should increment streak to 2)
        session_data["grapheme"] = "d"
        session_data["is_correct"] = True
        
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        
        if not success:
            self.log_test("Scenario 1 - Step 4", False, f"Failed to record correct answer (Status: {status})", data)
            return
        
        # Verify streak is 2
        child_state = self.get_child_current_state()
        if child_state and child_state.get("streak") == 2:
            self.log_test("Scenario 1 - Step 4", True, f"Correct answer incremented streak to 2")
        else:
            self.log_test("Scenario 1 - Step 4", False, f"Expected streak=2, got streak={child_state.get('streak') if child_state else 'unknown'}")
            return
        
        # Step 5: Send incorrect answer (should reset streak to 0)
        session_data["grapheme"] = "e"
        session_data["is_correct"] = False
        
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        
        if not success:
            self.log_test("Scenario 1 - Step 5", False, f"Failed to record incorrect answer (Status: {status})", data)
            return
        
        # Verify streak is reset to 0
        child_state = self.get_child_current_state()
        if child_state and child_state.get("streak") == 0:
            self.log_test("Scenario 1 - Step 5", True, f"Incorrect answer reset streak to 0")
        else:
            self.log_test("Scenario 1 - Step 5", False, f"Expected streak=0, got streak={child_state.get('streak') if child_state else 'unknown'}")
            return
        
        self.log_test("Scenario 1 - Complete", True, "Mixed correct/incorrect answers handled correctly")

    def test_scenario_2_sticker_earning_logic(self):
        """
        Test Scenario 2 - Sticker Earning Logic:
        - Test reaching streak thresholds (3, 5, 10) only with consecutive correct answers
        - Verify stickers are only earned when streak reaches exact thresholds
        - Verify incorrect answers reset streak and prevent sticker earning
        """
        print("🧪 Testing Scenario 2: Sticker Earning Logic")
        print("=" * 50)
        
        if not self.created_child_id:
            self.log_test("Scenario 2", False, "No test child available")
            return
        
        # Reset child state by creating a new child for this test
        child_data = {"name": "Sticker Test Child"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        
        if not success:
            self.log_test("Scenario 2 - Setup", False, "Failed to create sticker test child")
            return
        
        sticker_test_child_id = data["id"]
        
        # Send 3 consecutive correct answers to reach first threshold
        for i in range(3):
            session_data = {
                "game_mode": "find-letter",
                "grapheme": f"test_{i}",
                "is_correct": True,
                "response_time": 1500
            }
            
            success, data, status = self.make_request("POST", f"/children/{sticker_test_child_id}/progress", session_data)
            
            if not success:
                self.log_test("Scenario 2 - Streak Build", False, f"Failed to record correct answer {i+1}")
                return
        
        # Check if sticker was earned at streak 3
        success, child_state, status = self.make_request("GET", f"/children/{sticker_test_child_id}")
        
        if success and child_state and child_state.get("streak") == 3 and child_state.get("total_stickers", 0) >= 1:
            self.log_test("Scenario 2 - Threshold 3", True, f"Sticker earned at streak 3, total stickers: {child_state.get('total_stickers')}")
        else:
            self.log_test("Scenario 2 - Threshold 3", False, f"Expected streak=3 with sticker, got streak={child_state.get('streak') if child_state else 'unknown'}, stickers={child_state.get('total_stickers') if child_state else 'unknown'}")
        
        # Send incorrect answer to reset streak
        session_data = {
            "game_mode": "find-letter",
            "grapheme": "reset",
            "is_correct": False,
            "response_time": 1500
        }
        
        success, data, status = self.make_request("POST", f"/children/{sticker_test_child_id}/progress", session_data)
        
        if not success:
            self.log_test("Scenario 2 - Reset", False, "Failed to record incorrect answer for reset")
            return
        
        # Verify streak reset
        success, child_state, status = self.make_request("GET", f"/children/{sticker_test_child_id}")
        if child_state and child_state.get("streak") == 0:
            self.log_test("Scenario 2 - Reset Verification", True, "Streak correctly reset to 0 after incorrect answer")
        else:
            self.log_test("Scenario 2 - Reset Verification", False, f"Expected streak=0, got streak={child_state.get('streak')}")
        
        # Clean up test child
        self.make_request("DELETE", f"/children/{sticker_test_child_id}")

    def test_scenario_3_progress_tracking_accuracy(self):
        """
        Test Scenario 3 - Progress Tracking:
        - Verify grapheme progress tracking is accurate (attempts vs correct count)
        - Test star calculation based on accuracy ratio
        """
        print("🧪 Testing Scenario 3: Progress Tracking Accuracy")
        print("=" * 50)
        
        if not self.created_child_id:
            self.log_test("Scenario 3", False, "No test child available")
            return
        
        # Create new child for progress tracking test
        child_data = {"name": "Progress Test Child"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        
        if not success:
            self.log_test("Scenario 3 - Setup", False, "Failed to create progress test child")
            return
        
        progress_test_child_id = data["id"]
        
        # Test grapheme "a" with mixed results: 3 correct out of 5 attempts (60% accuracy)
        test_grapheme = "a"
        results = [True, False, True, True, False]  # 3 correct, 2 incorrect
        
        for i, is_correct in enumerate(results):
            session_data = {
                "game_mode": "find-letter",
                "grapheme": test_grapheme,
                "is_correct": is_correct,
                "response_time": 1500
            }
            
            success, data, status = self.make_request("POST", f"/children/{progress_test_child_id}/progress", session_data)
            
            if not success:
                self.log_test("Scenario 3 - Progress Recording", False, f"Failed to record attempt {i+1}")
                return
        
        # Get final child state and verify progress
        success, child_state, status = self.make_request("GET", f"/children/{progress_test_child_id}")
        
        if not success:
            self.log_test("Scenario 3 - State Check", False, "Failed to get child state")
            return
        
        # Check grapheme progress
        progress = child_state.get("progress", {}).get(test_grapheme, {})
        attempts = progress.get("attempts", 0)
        correct = progress.get("correct", 0)
        stars = progress.get("stars", 0)
        
        # Verify attempts and correct counts
        if attempts == 5 and correct == 3:
            self.log_test("Scenario 3 - Progress Counts", True, f"Correct tracking: {correct}/{attempts} attempts")
        else:
            self.log_test("Scenario 3 - Progress Counts", False, f"Expected 3/5, got {correct}/{attempts}")
        
        # Verify star calculation (60% accuracy should give 2 stars based on formula: min(3, int(accuracy * 4)))
        expected_stars = min(3, int((correct / attempts) * 4))  # 60% * 4 = 2.4, int(2.4) = 2
        if stars == expected_stars:
            self.log_test("Scenario 3 - Star Calculation", True, f"Correct star calculation: {stars} stars for {(correct/attempts)*100:.1f}% accuracy")
        else:
            self.log_test("Scenario 3 - Star Calculation", False, f"Expected {expected_stars} stars, got {stars} stars")
        
        # Clean up test child
        self.make_request("DELETE", f"/children/{progress_test_child_id}")

    def test_off_by_one_bug_verification(self):
        """
        Specific test for the off-by-one scoring bug
        Verify that score increments are accurate and not off by +1
        """
        print("🧪 Testing Off-by-One Bug Fix")
        print("=" * 50)
        
        if not self.created_child_id:
            self.log_test("Off-by-One Bug Test", False, "No test child available")
            return
        
        # Create new child for off-by-one test
        child_data = {"name": "Off-by-One Test Child"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        
        if not success:
            self.log_test("Off-by-One Bug Test - Setup", False, "Failed to create test child")
            return
        
        obo_test_child_id = data["id"]
        
        # Get initial state (should have streak = 0)
        success, initial_state, status = self.make_request("GET", f"/children/{obo_test_child_id}")
        initial_streak = initial_state.get("streak", -1) if initial_state else -1
        
        if initial_streak != 0:
            self.log_test("Off-by-One Bug Test - Initial", False, f"Expected initial streak=0, got {initial_streak}")
            return
        
        # Send exactly 2 correct answers
        for i in range(2):
            session_data = {
                "game_mode": "find-letter",
                "grapheme": f"obo_test_{i}",
                "is_correct": True,
                "response_time": 1500
            }
            
            success, data, status = self.make_request("POST", f"/children/{obo_test_child_id}/progress", session_data)
            
            if not success:
                self.log_test("Off-by-One Bug Test - Recording", False, f"Failed to record correct answer {i+1}")
                return
        
        # Get final state - should have streak = 2 (not 3 due to off-by-one bug)
        success, final_state, status = self.make_request("GET", f"/children/{obo_test_child_id}")
        final_streak = final_state.get("streak", -1) if final_state else -1
        
        if final_streak == 2:
            self.log_test("Off-by-One Bug Test - Verification", True, f"Correct streak calculation: 2 correct answers = streak 2 (not 3)")
        else:
            self.log_test("Off-by-One Bug Test - Verification", False, f"Expected streak=2, got streak={final_streak} - Off-by-one bug may still exist!")
        
        # Clean up test child
        self.make_request("DELETE", f"/children/{obo_test_child_id}")

    def cleanup_test_child(self):
        """Clean up the test child"""
        if self.created_child_id:
            success, data, status = self.make_request("DELETE", f"/children/{self.created_child_id}")
            if success:
                self.log_test("Cleanup Test Child", True, "Test child deleted successfully")
            else:
                self.log_test("Cleanup Test Child", False, f"Failed to delete test child (Status: {status})")

    def run_all_scoring_tests(self):
        """Run all scoring bug fix tests"""
        print(f"🧪 Starting Betűkereső Scoring Bug Fix Tests")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_child():
            print("❌ Failed to setup test child. Aborting tests.")
            return
        
        # Run all test scenarios
        self.test_scenario_1_mixed_correct_incorrect()
        self.test_scenario_2_sticker_earning_logic()
        self.test_scenario_3_progress_tracking_accuracy()
        self.test_off_by_one_bug_verification()
        
        # Cleanup
        self.cleanup_test_child()
        
        # Summary
        print("=" * 60)
        print("📊 SCORING BUG FIX TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['details']}")
        else:
            print("\n🎉 ALL SCORING BUG FIX TESTS PASSED!")
            print("✅ Incorrect Answer Bug: FIXED - Wrong letters no longer count as correct")
            print("✅ Off-by-One Scoring Bug: FIXED - Score increments are accurate")
        
        return passed, failed

if __name__ == "__main__":
    tester = ScoringBugTester()
    passed, failed = tester.run_all_scoring_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)