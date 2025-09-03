#!/usr/bin/env python3
"""
Comprehensive Backend API Verification Test for Betűkereső Application
Focuses on the specific areas mentioned in the review request:
1. Core API Functionality (children management, game endpoints, progress tracking)
2. Game Progress Recording (scoring and sticker systems)
3. Hungarian Graphemes (random grapheme generation)
4. Settings Management (save/load functionality)
"""

import requests
import json
import os
from typing import Dict, Any, Optional
import time

class BetukeresoVerificationTester:
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

    def test_core_api_functionality(self):
        """Test Core API Functionality: children management, game endpoints, progress tracking"""
        print("\n🎯 TESTING CORE API FUNCTIONALITY")
        print("=" * 60)
        
        # 1. API Root
        success, data, status = self.make_request("GET", "/")
        if success and isinstance(data, dict) and data.get("message") == "Betűkereső API is running":
            self.log_test("Core API - Root Endpoint", True, f"API is running (Status: {status})")
        else:
            self.log_test("Core API - Root Endpoint", False, f"Unexpected response (Status: {status})", data)
        
        # 2. Children Management - Create Child
        child_data = {"name": "Teszt Péter"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        if success and isinstance(data, dict) and "id" in data and data.get("name") == "Teszt Péter":
            self.created_child_id = data["id"]
            self.log_test("Core API - Create Child", True, f"Child created with ID: {self.created_child_id}")
        else:
            self.log_test("Core API - Create Child", False, f"Failed to create child (Status: {status})", data)
            return
        
        # 3. Children Management - Get Children
        success, data, status = self.make_request("GET", "/children/")
        if success and isinstance(data, list) and len(data) > 0:
            child = data[0]
            if child.get("name") == "Teszt Péter" and "id" in child:
                self.log_test("Core API - Get Children", True, f"Retrieved children list with {len(data)} children")
            else:
                self.log_test("Core API - Get Children", False, "Child data doesn't match expected", data)
        else:
            self.log_test("Core API - Get Children", False, f"Failed to get children (Status: {status})", data)
        
        # 4. Children Management - Get Specific Child
        success, data, status = self.make_request("GET", f"/children/{self.created_child_id}")
        if success and isinstance(data, dict) and data.get("id") == self.created_child_id:
            self.log_test("Core API - Get Specific Child", True, f"Retrieved child: {data.get('name')}")
        else:
            self.log_test("Core API - Get Specific Child", False, f"Failed to get specific child (Status: {status})", data)
        
        # 5. Game Endpoints - Get Hungarian Graphemes
        success, data, status = self.make_request("GET", "/game/graphemes")
        if success and isinstance(data, list) and len(data) > 0:
            first_item = data[0]
            if isinstance(first_item, dict) and "grapheme" in first_item and "phonetic_word" in first_item:
                graphemes = [item["grapheme"] for item in data]
                hungarian_graphemes = ["cs", "gy", "ny", "sz", "ty", "zs", "dzs"]
                found_hungarian = [g for g in hungarian_graphemes if g in graphemes]
                if len(found_hungarian) >= 3:
                    self.log_test("Core API - Hungarian Graphemes", True, f"Found {len(data)} graphemes including Hungarian ones: {found_hungarian}")
                else:
                    self.log_test("Core API - Hungarian Graphemes", False, f"Missing Hungarian graphemes. Found: {graphemes[:10]}")
            else:
                self.log_test("Core API - Hungarian Graphemes", False, "Invalid grapheme structure", first_item)
        else:
            self.log_test("Core API - Hungarian Graphemes", False, f"Failed to get graphemes (Status: {status})", data)

    def test_game_progress_recording(self):
        """Test Game Progress Recording: scoring and sticker systems"""
        print("\n🎯 TESTING GAME PROGRESS RECORDING")
        print("=" * 60)
        
        if not self.created_child_id:
            self.log_test("Game Progress - Setup", False, "No child ID available")
            return
        
        # 1. Record Correct Answer
        session_data = {
            "game_mode": "find-letter",
            "grapheme": "a",
            "is_correct": True,
            "response_time": 1200
        }
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        if success and isinstance(data, dict):
            expected_fields = ["new_streak", "new_stars", "total_stickers"]
            if all(field in data for field in expected_fields):
                self.log_test("Game Progress - Record Correct Answer", True, 
                            f"Progress recorded: streak={data.get('new_streak')}, stars={data.get('new_stars')}")
            else:
                self.log_test("Game Progress - Record Correct Answer", False, "Missing expected fields", data)
        else:
            self.log_test("Game Progress - Record Correct Answer", False, f"Failed to record progress (Status: {status})", data)
        
        # 2. Record Incorrect Answer
        session_data = {
            "game_mode": "find-letter",
            "grapheme": "b",
            "is_correct": False,
            "response_time": 2500
        }
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        if success and isinstance(data, dict):
            if data.get("new_streak") == 0:  # Streak should reset to 0 on incorrect answer
                self.log_test("Game Progress - Record Incorrect Answer", True, 
                            f"Streak correctly reset to 0 on incorrect answer")
            else:
                self.log_test("Game Progress - Record Incorrect Answer", False, 
                            f"Streak not reset properly: {data.get('new_streak')}")
        else:
            self.log_test("Game Progress - Record Incorrect Answer", False, f"Failed to record incorrect answer (Status: {status})", data)
        
        # 3. Test Sticker System - Earn stickers by reaching streak thresholds
        # Reset and build up streak to earn stickers
        for i in range(5):  # Record 5 correct answers to reach streak 5
            session_data = {
                "game_mode": "find-letter",
                "grapheme": f"test_{i}",
                "is_correct": True,
                "response_time": 1000
            }
            success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
            
            if success and i == 2:  # At streak 3, should earn first sticker
                sticker_earned = data.get("sticker_earned")
                if sticker_earned:
                    self.log_test("Game Progress - Sticker System (Streak 3)", True, 
                                f"Sticker earned at streak 3: {sticker_earned.get('name', 'Unknown')}")
                else:
                    self.log_test("Game Progress - Sticker System (Streak 3)", False, 
                                "No sticker earned at streak 3")
        
        # 4. Get Child Stickers
        success, data, status = self.make_request("GET", f"/children/{self.created_child_id}/stickers")
        if success and isinstance(data, list):
            self.log_test("Game Progress - Get Stickers", True, f"Retrieved {len(data)} stickers")
            if len(data) > 0:
                sticker = data[0]
                print(f"   Sample sticker: {sticker.get('name', 'Unknown')} {sticker.get('emoji', '')}")
        else:
            self.log_test("Game Progress - Get Stickers", False, f"Failed to get stickers (Status: {status})", data)

    def test_hungarian_graphemes(self):
        """Test Hungarian Graphemes: random grapheme generation"""
        print("\n🎯 TESTING HUNGARIAN GRAPHEMES")
        print("=" * 60)
        
        # 1. Test Random Graphemes Default
        success, data, status = self.make_request("GET", "/game/graphemes/random")
        if success and isinstance(data, dict) and "graphemes" in data:
            graphemes = data["graphemes"]
            if isinstance(graphemes, list) and len(graphemes) == 9:  # Default count
                self.log_test("Hungarian Graphemes - Random Default", True, 
                            f"Got {len(graphemes)} random graphemes: {graphemes[:5]}")
            else:
                self.log_test("Hungarian Graphemes - Random Default", False, 
                            f"Expected 9 graphemes, got {len(graphemes) if isinstance(graphemes, list) else 'invalid'}")
        else:
            self.log_test("Hungarian Graphemes - Random Default", False, f"Invalid response format (Status: {status})", data)
        
        # 2. Test Random Graphemes with Parameters
        params = {"count": 6, "include_foreign": True, "trouble_bias": True}
        success, data, status = self.make_request("GET", "/game/graphemes/random", params=params)
        if success and isinstance(data, dict) and "graphemes" in data:
            graphemes = data["graphemes"]
            if isinstance(graphemes, list) and len(graphemes) == 6:
                # Check for trouble bias (should include b, d, p, or q)
                trouble_graphemes = ["b", "d", "p", "q"]
                has_trouble = any(g in trouble_graphemes for g in graphemes)
                if has_trouble:
                    self.log_test("Hungarian Graphemes - Trouble Bias", True, 
                                f"Trouble bias working: found trouble graphemes in {graphemes}")
                else:
                    self.log_test("Hungarian Graphemes - Trouble Bias", False, 
                                f"No trouble graphemes found in {graphemes}")
            else:
                self.log_test("Hungarian Graphemes - Parameters", False, 
                            f"Expected 6 graphemes, got {len(graphemes) if isinstance(graphemes, list) else 'invalid'}")
        else:
            self.log_test("Hungarian Graphemes - Parameters", False, f"Failed with parameters (Status: {status})", data)
        
        # 3. Test Uniqueness (no duplicates in single response)
        success, data, status = self.make_request("GET", "/game/graphemes/random", params={"count": 15})
        if success and isinstance(data, dict) and "graphemes" in data:
            graphemes = data["graphemes"]
            if len(graphemes) == len(set(graphemes)):
                self.log_test("Hungarian Graphemes - Uniqueness", True, 
                            f"All {len(graphemes)} graphemes are unique")
            else:
                duplicates = [g for g in graphemes if graphemes.count(g) > 1]
                self.log_test("Hungarian Graphemes - Uniqueness", False, 
                            f"Found duplicates: {set(duplicates)}")
        else:
            self.log_test("Hungarian Graphemes - Uniqueness", False, f"Failed to test uniqueness (Status: {status})", data)
        
        # 4. Test Multi-character Hungarian Graphemes
        success, data, status = self.make_request("GET", "/game/graphemes")
        if success and isinstance(data, list):
            graphemes = [item["grapheme"] for item in data]
            multi_char_hungarian = ["cs", "gy", "ny", "sz", "ty", "zs", "dzs"]
            found_multi_char = [g for g in multi_char_hungarian if g in graphemes]
            if len(found_multi_char) >= 5:
                self.log_test("Hungarian Graphemes - Multi-character", True, 
                            f"Found multi-character Hungarian graphemes: {found_multi_char}")
            else:
                self.log_test("Hungarian Graphemes - Multi-character", False, 
                            f"Missing multi-character graphemes. Found: {found_multi_char}")
        else:
            self.log_test("Hungarian Graphemes - Multi-character", False, f"Failed to get graphemes (Status: {status})", data)

    def test_settings_management(self):
        """Test Settings Management: save/load functionality"""
        print("\n🎯 TESTING SETTINGS MANAGEMENT")
        print("=" * 60)
        
        if not self.created_child_id:
            self.log_test("Settings Management - Setup", False, "No child ID available")
            return
        
        # 1. Test Settings Save - Boolean Setting
        setting_data = {"key": "sound_enabled", "value": True}
        success, data, status = self.make_request("PUT", f"/children/{self.created_child_id}/settings", setting_data)
        if success and isinstance(data, dict) and data.get("success") is True:
            settings = data.get("settings", {})
            if settings.get("sound_enabled") is True:
                self.log_test("Settings Management - Save Boolean", True, 
                            f"Boolean setting saved correctly: sound_enabled=True")
            else:
                self.log_test("Settings Management - Save Boolean", False, 
                            f"Boolean setting not saved correctly: {settings.get('sound_enabled')}")
        else:
            self.log_test("Settings Management - Save Boolean", False, f"Failed to save boolean setting (Status: {status})", data)
        
        # 2. Test Settings Save - Integer Setting
        setting_data = {"key": "letters_per_session", "value": 12}
        success, data, status = self.make_request("PUT", f"/children/{self.created_child_id}/settings", setting_data)
        if success and isinstance(data, dict) and data.get("success") is True:
            settings = data.get("settings", {})
            if settings.get("letters_per_session") == 12:
                self.log_test("Settings Management - Save Integer", True, 
                            f"Integer setting saved correctly: letters_per_session=12")
            else:
                self.log_test("Settings Management - Save Integer", False, 
                            f"Integer setting not saved correctly: {settings.get('letters_per_session')}")
        else:
            self.log_test("Settings Management - Save Integer", False, f"Failed to save integer setting (Status: {status})", data)
        
        # 3. Test Settings Load - Get Child with Settings
        success, data, status = self.make_request("GET", f"/children/{self.created_child_id}")
        if success and isinstance(data, dict) and "settings" in data:
            settings = data["settings"]
            if settings.get("sound_enabled") is True and settings.get("letters_per_session") == 12:
                self.log_test("Settings Management - Load Settings", True, 
                            f"Settings loaded correctly: sound_enabled={settings.get('sound_enabled')}, letters_per_session={settings.get('letters_per_session')}")
            else:
                self.log_test("Settings Management - Load Settings", False, 
                            f"Settings not loaded correctly: {settings}")
        else:
            self.log_test("Settings Management - Load Settings", False, f"Failed to load settings (Status: {status})", data)
        
        # 4. Test Sticker Settings Impact
        setting_data = {"key": "stickers_enabled", "value": False}
        success, data, status = self.make_request("PUT", f"/children/{self.created_child_id}/settings", setting_data)
        if success:
            # Try to earn a sticker with stickers disabled
            session_data = {
                "game_mode": "find-letter",
                "grapheme": "settings_test",
                "is_correct": True,
                "response_time": 1000
            }
            # Reset streak first
            wrong_answer = {"game_mode": "find-letter", "grapheme": "reset", "is_correct": False, "response_time": 1000}
            self.make_request("POST", f"/children/{self.created_child_id}/progress", wrong_answer)
            
            # Try to reach streak 3 with stickers disabled
            sticker_earned = False
            for i in range(3):
                success, progress_data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
                if success and progress_data.get("sticker_earned"):
                    sticker_earned = True
                    break
            
            if not sticker_earned:
                self.log_test("Settings Management - Stickers Disabled", True, 
                            "No stickers earned when stickers_enabled=False")
            else:
                self.log_test("Settings Management - Stickers Disabled", False, 
                            "Sticker earned despite stickers_enabled=False")
        else:
            self.log_test("Settings Management - Stickers Disabled", False, f"Failed to disable stickers (Status: {status})", data)

    def cleanup(self):
        """Clean up test data"""
        if self.created_child_id:
            success, data, status = self.make_request("DELETE", f"/children/{self.created_child_id}")
            if success:
                self.log_test("Cleanup - Delete Test Child", True, "Test child deleted successfully")
            else:
                self.log_test("Cleanup - Delete Test Child", False, f"Failed to delete test child (Status: {status})", data)

    def run_verification_tests(self):
        """Run all verification tests"""
        print(f"🧪 Starting Betűkereső Backend API Verification Tests")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 80)
        
        # Run test suites
        self.test_core_api_functionality()
        self.test_game_progress_recording()
        self.test_hungarian_graphemes()
        self.test_settings_management()
        self.cleanup()
        
        # Summary
        print("=" * 80)
        print("📊 VERIFICATION TEST SUMMARY")
        print("=" * 80)
        
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
            print("\n🎉 ALL TESTS PASSED! Backend API is working correctly after frontend changes.")
        
        return passed, failed

if __name__ == "__main__":
    tester = BetukeresoVerificationTester()
    passed, failed = tester.run_verification_tests()
    exit(0 if failed == 0 else 1)