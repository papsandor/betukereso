#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Betűkereső Application
Tests all endpoints including children management, game endpoints, and progress tracking.
"""

import requests
import json
import os
from typing import Dict, Any, Optional
import time

class BetukeresoAPITester:
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

    def test_api_root(self):
        """Test the root API endpoint"""
        success, data, status = self.make_request("GET", "/")
        expected_message = "Betűkereső API is running"
        
        if success and isinstance(data, dict) and data.get("message") == expected_message:
            self.log_test("API Root Endpoint", True, f"API is running (Status: {status})")
        else:
            self.log_test("API Root Endpoint", False, f"Unexpected response (Status: {status})", data)

    def test_get_children_empty(self):
        """Test GET /api/children - should return empty array initially"""
        success, data, status = self.make_request("GET", "/children/")
        
        if success and isinstance(data, list) and len(data) == 0:
            self.log_test("GET Children (Empty)", True, "Returns empty array as expected")
        else:
            self.log_test("GET Children (Empty)", False, f"Expected empty array, got: {type(data)} (Status: {status})", data)

    def test_create_child(self):
        """Test POST /api/children with body {"name": "Teszt Gyerek"}"""
        child_data = {"name": "Teszt Gyerek"}
        success, data, status = self.make_request("POST", "/children/", child_data)
        
        if success and isinstance(data, dict) and "id" in data and data.get("name") == "Teszt Gyerek":
            self.created_child_id = data["id"]
            self.log_test("Create Child", True, f"Child created with ID: {self.created_child_id}")
        else:
            self.log_test("Create Child", False, f"Failed to create child (Status: {status})", data)

    def test_get_children_with_data(self):
        """Test GET /api/children - should now show the created child"""
        success, data, status = self.make_request("GET", "/children/")
        
        if success and isinstance(data, list) and len(data) > 0:
            child = data[0]
            if child.get("name") == "Teszt Gyerek" and "id" in child:
                self.log_test("GET Children (With Data)", True, f"Found created child: {child['name']}")
            else:
                self.log_test("GET Children (With Data)", False, "Child data doesn't match expected", data)
        else:
            self.log_test("GET Children (With Data)", False, f"Expected array with data (Status: {status})", data)

    def test_get_specific_child(self):
        """Test GET /api/children/{child_id}"""
        if not self.created_child_id:
            self.log_test("GET Specific Child", False, "No child ID available from previous test")
            return
            
        success, data, status = self.make_request("GET", f"/children/{self.created_child_id}")
        
        if success and isinstance(data, dict) and data.get("id") == self.created_child_id:
            self.log_test("GET Specific Child", True, f"Retrieved child: {data.get('name')}")
        else:
            self.log_test("GET Specific Child", False, f"Failed to get specific child (Status: {status})", data)

    def test_get_graphemes(self):
        """Test GET /api/game/graphemes - should return Hungarian graphemes with phonetic words"""
        success, data, status = self.make_request("GET", "/game/graphemes")
        
        if success and isinstance(data, list) and len(data) > 0:
            # Check if first item has expected structure
            first_item = data[0]
            if isinstance(first_item, dict) and "grapheme" in first_item and "phonetic_word" in first_item:
                # Check for some expected Hungarian graphemes
                graphemes = [item["grapheme"] for item in data]
                expected_graphemes = ["a", "á", "cs", "gy", "ny", "sz", "ty", "zs"]
                found_expected = [g for g in expected_graphemes if g in graphemes]
                
                if len(found_expected) >= 5:  # At least 5 expected graphemes found
                    self.log_test("GET Graphemes", True, f"Found {len(data)} graphemes including Hungarian ones: {found_expected[:5]}")
                else:
                    self.log_test("GET Graphemes", False, f"Missing expected Hungarian graphemes. Found: {graphemes[:10]}")
            else:
                self.log_test("GET Graphemes", False, "Graphemes don't have expected structure", first_item)
        else:
            self.log_test("GET Graphemes", False, f"Failed to get graphemes (Status: {status})", data)

    def test_get_random_graphemes(self):
        """Test GET /api/game/graphemes/random - should return random graphemes"""
        success, data, status = self.make_request("GET", "/game/graphemes/random")
        
        if success and isinstance(data, dict) and "graphemes" in data:
            graphemes = data["graphemes"]
            if isinstance(graphemes, list) and len(graphemes) > 0:
                self.log_test("GET Random Graphemes", True, f"Got {len(graphemes)} random graphemes: {graphemes[:5]}")
            else:
                self.log_test("GET Random Graphemes", False, "Empty or invalid graphemes list", data)
        else:
            self.log_test("GET Random Graphemes", False, f"Unexpected response format (Status: {status})", data)

    def test_get_random_graphemes_with_params(self):
        """Test GET /api/game/graphemes/random with parameters"""
        params = {"count": 5, "include_foreign": True, "trouble_bias": False}
        success, data, status = self.make_request("GET", "/game/graphemes/random", params=params)
        
        if success and isinstance(data, dict) and "graphemes" in data:
            graphemes = data["graphemes"]
            if isinstance(graphemes, list) and len(graphemes) == 5:
                self.log_test("GET Random Graphemes (With Params)", True, f"Got exactly 5 graphemes: {graphemes}")
            else:
                self.log_test("GET Random Graphemes (With Params)", False, f"Expected 5 graphemes, got {len(graphemes) if isinstance(graphemes, list) else 'invalid'}", data)
        else:
            self.log_test("GET Random Graphemes (With Params)", False, f"Failed with parameters (Status: {status})", data)

    def test_get_grapheme_audio(self):
        """Test GET /api/game/audio/{grapheme} - placeholder endpoint"""
        test_grapheme = "a"
        success, data, status = self.make_request("GET", f"/game/audio/{test_grapheme}")
        
        if success and isinstance(data, dict):
            if data.get("grapheme") == test_grapheme and "audio_url" in data:
                self.log_test("GET Grapheme Audio", True, f"Audio endpoint works for '{test_grapheme}': {data.get('audio_url')}")
            else:
                self.log_test("GET Grapheme Audio", False, "Missing expected fields in audio response", data)
        else:
            self.log_test("GET Grapheme Audio", False, f"Audio endpoint failed (Status: {status})", data)

    def test_record_progress(self):
        """Test POST /api/children/{child_id}/progress with game session data"""
        if not self.created_child_id:
            self.log_test("Record Progress", False, "No child ID available from previous test")
            return
            
        session_data = {
            "game_mode": "find-letter",
            "grapheme": "a",
            "is_correct": True,
            "response_time": 1500
        }
        
        success, data, status = self.make_request("POST", f"/children/{self.created_child_id}/progress", session_data)
        
        if success and isinstance(data, dict):
            expected_fields = ["new_streak", "new_stars", "total_stickers"]
            if all(field in data for field in expected_fields):
                self.log_test("Record Progress", True, f"Progress recorded: streak={data.get('new_streak')}, stars={data.get('new_stars')}")
            else:
                self.log_test("Record Progress", False, f"Missing expected fields in progress response", data)
        else:
            self.log_test("Record Progress", False, f"Failed to record progress (Status: {status})", data)

    def test_get_child_stickers(self):
        """Test GET /api/children/{child_id}/stickers - should show any earned stickers"""
        if not self.created_child_id:
            self.log_test("GET Child Stickers", False, "No child ID available from previous test")
            return
            
        success, data, status = self.make_request("GET", f"/children/{self.created_child_id}/stickers")
        
        if success and isinstance(data, list):
            self.log_test("GET Child Stickers", True, f"Retrieved {len(data)} stickers for child")
            if len(data) > 0:
                sticker = data[0]
                print(f"   First sticker: {sticker.get('name', 'Unknown')} {sticker.get('emoji', '')}")
        else:
            self.log_test("GET Child Stickers", False, f"Failed to get stickers (Status: {status})", data)

    def test_delete_child(self):
        """Test DELETE /api/children/{child_id}"""
        if not self.created_child_id:
            self.log_test("Delete Child", False, "No child ID available from previous test")
            return
            
        success, data, status = self.make_request("DELETE", f"/children/{self.created_child_id}")
        
        if success and isinstance(data, dict) and data.get("success") is True:
            self.log_test("Delete Child", True, "Child deleted successfully")
        else:
            self.log_test("Delete Child", False, f"Failed to delete child (Status: {status})", data)

    def test_random_graphemes_uniqueness_and_trouble_bias(self):
        """Test random graphemes endpoint for uniqueness, trouble bias, and rare letter reduction"""
        print("\n🎯 TESTING RANDOM GRAPHEMES - UNIQUENESS & TROUBLE BIAS")
        print("=" * 60)
        
        # Test configurations
        test_configs = [
            {"count": 6, "include_foreign": False, "trouble_bias": True},
            {"count": 9, "include_foreign": False, "trouble_bias": True},
            {"count": 12, "include_foreign": False, "trouble_bias": True},
            {"count": 15, "include_foreign": False, "trouble_bias": True},
            {"count": 20, "include_foreign": False, "trouble_bias": True},
            {"count": 6, "include_foreign": True, "trouble_bias": True},
            {"count": 9, "include_foreign": True, "trouble_bias": True},
            {"count": 12, "include_foreign": True, "trouble_bias": True},
            {"count": 15, "include_foreign": True, "trouble_bias": True},
            {"count": 20, "include_foreign": True, "trouble_bias": True},
        ]
        
        trouble_graphemes = ["b", "d", "p", "q"]
        rare_graphemes = ["dz", "dzs", "w"]
        
        for config in test_configs:
            print(f"\n📊 Testing config: count={config['count']}, include_foreign={config['include_foreign']}, trouble_bias={config['trouble_bias']}")
            
            # Test uniqueness and trouble bias with multiple calls
            unique_failures = 0
            trouble_bias_failures = 0
            rare_presence_count = {rare: 0 for rare in rare_graphemes}
            total_calls = 10
            
            for call_num in range(total_calls):
                success, data, status = self.make_request("GET", "/game/graphemes/random", params=config)
                
                if not success or not isinstance(data, dict) or "graphemes" not in data:
                    self.log_test(f"Random Graphemes Config {config}", False, f"Failed API call {call_num+1}", data)
                    continue
                
                graphemes = data["graphemes"]
                
                # Test 1: Uniqueness - no duplicates
                if len(graphemes) != len(set(graphemes)):
                    unique_failures += 1
                    print(f"   ❌ Call {call_num+1}: Found duplicates in {graphemes}")
                
                # Test 2: Trouble bias - at least one trouble grapheme when trouble_bias=True
                if config["trouble_bias"]:
                    has_trouble = any(g in trouble_graphemes for g in graphemes)
                    if not has_trouble:
                        trouble_bias_failures += 1
                        print(f"   ⚠️  Call {call_num+1}: No trouble graphemes found in {graphemes}")
                
                # Test 3: Track rare grapheme presence for statistical analysis
                for rare in rare_graphemes:
                    if rare in graphemes:
                        rare_presence_count[rare] += 1
            
            # Report results for this configuration
            config_name = f"count={config['count']}, foreign={config['include_foreign']}"
            
            # Uniqueness test result
            if unique_failures == 0:
                self.log_test(f"Uniqueness Test ({config_name})", True, f"All {total_calls} calls returned unique graphemes")
            else:
                self.log_test(f"Uniqueness Test ({config_name})", False, f"{unique_failures}/{total_calls} calls had duplicates")
            
            # Trouble bias test result
            if config["trouble_bias"]:
                if trouble_bias_failures <= 2:  # Allow up to 2 failures out of 10 (20% tolerance)
                    self.log_test(f"Trouble Bias Test ({config_name})", True, f"Trouble graphemes present in {total_calls-trouble_bias_failures}/{total_calls} calls")
                else:
                    self.log_test(f"Trouble Bias Test ({config_name})", False, f"Trouble graphemes missing in {trouble_bias_failures}/{total_calls} calls")
            
            # Rare grapheme reduction test (should be ~50% presence)
            for rare in rare_graphemes:
                presence_rate = rare_presence_count[rare] / total_calls * 100
                if 30 <= presence_rate <= 70:  # 30-70% range is acceptable for ~50% target
                    self.log_test(f"Rare Grapheme '{rare}' Reduction ({config_name})", True, f"Present in {presence_rate:.1f}% of calls (target ~50%)")
                else:
                    self.log_test(f"Rare Grapheme '{rare}' Reduction ({config_name})", False, f"Present in {presence_rate:.1f}% of calls (expected ~50%)")

    def test_error_handling(self):
        """Test error handling for non-existent resources"""
        # Test getting non-existent child
        fake_id = "non-existent-id"
        success, data, status = self.make_request("GET", f"/children/{fake_id}")
        
        if not success and status == 404:
            self.log_test("Error Handling (404)", True, "Correctly returns 404 for non-existent child")
        else:
            self.log_test("Error Handling (404)", False, f"Expected 404, got {status}", data)

        # Test invalid grapheme count - backward compatibility
        params = {"count": 25}  # Should be max 20
        success, data, status = self.make_request("GET", "/game/graphemes/random", params=params)
        
        if not success and status == 400:
            self.log_test("Error Handling (400) - Count > 20", True, "Correctly validates grapheme count parameter")
        else:
            self.log_test("Error Handling (400) - Count > 20", False, f"Expected 400 for invalid count, got {status}", data)
        
        # Test invalid grapheme count - count < 1
        params = {"count": 0}  # Should be min 1
        success, data, status = self.make_request("GET", "/game/graphemes/random", params=params)
        
        if not success and status == 400:
            self.log_test("Error Handling (400) - Count < 1", True, "Correctly validates minimum grapheme count")
        else:
            self.log_test("Error Handling (400) - Count < 1", False, f"Expected 400 for count < 1, got {status}", data)

    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🧪 Starting Betűkereső Backend API Tests")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        self.test_api_root()
        self.test_get_children_empty()
        self.test_create_child()
        self.test_get_children_with_data()
        self.test_get_specific_child()
        self.test_get_graphemes()
        self.test_get_random_graphemes()
        self.test_get_random_graphemes_with_params()
        self.test_get_grapheme_audio()
        self.test_record_progress()
        self.test_get_child_stickers()
        self.test_delete_child()
        self.test_error_handling()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
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
        
        return passed, failed

if __name__ == "__main__":
    tester = BetukeresoAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if failed == 0 else 1)