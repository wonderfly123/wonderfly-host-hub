# this script works and checks for duplicates and updates if it exists... but... times and dates are wrong
import requests
import json
import os
import time
import sys
from datetime import datetime
from dotenv import load_dotenv

class TripleseatHostHubIntegration:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        
        # Tripleseat credentials
        self.tripleseat_client_id = os.getenv("TRIPLESEAT_CLIENT_ID")
        self.tripleseat_client_secret = os.getenv("TRIPLESEAT_CLIENT_SECRET")
        self.tripleseat_base_url = os.getenv("TRIPLESEAT_BASE_URL", "https://api.tripleseat.com/v1/")
        
        # Host Hub settings
        self.host_hub_port = os.getenv("PORT", "5002")
        self.host_hub_api_url = f"http://localhost:{self.host_hub_port}/api"
        self.admin_username = os.getenv("HOST_HUB_ADMIN_USERNAME", "admin")
        self.admin_password = os.getenv("HOST_HUB_ADMIN_PASSWORD", "admin123")
        
        # Facility mapping
        self.facility_ids = {
            "Wonderfly Arena Timonium": "67db7fe6faf97218df1f9d96",
            "Wonderfly Arena Arbutus": "67db7fe6faf97218df1f9d97"
        }
        
        # Auth tokens
        self.tripleseat_token = None
        self.host_hub_token = None
        
        # Initialize with retries
        self._initialize_tokens()
    
    def _initialize_tokens(self):
        """Initialize both authentication tokens with retries"""
        max_retries = 3
        retry_delay = 2  # seconds
        
        # Get Tripleseat token
        for attempt in range(max_retries):
            try:
                self.tripleseat_token = self._get_tripleseat_token()
                if self.tripleseat_token:
                    break
            except Exception as e:
                print(f"Tripleseat auth attempt {attempt+1}/{max_retries} failed: {str(e)}")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
        
        if not self.tripleseat_token:
            print("Failed to authenticate with Tripleseat after multiple attempts")
            
        # Get Host Hub token
        for attempt in range(max_retries):
            try:
                self.host_hub_token = self._get_host_hub_token()
                if self.host_hub_token:
                    break
            except Exception as e:
                print(f"Host Hub auth attempt {attempt+1}/{max_retries} failed: {str(e)}")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
        
        if not self.host_hub_token:
            print("Failed to authenticate with Host Hub after multiple attempts")
    
    def _get_tripleseat_token(self):
        """Get Tripleseat API access token"""
        token_url = "https://api.tripleseat.com/oauth/token"
        
        payload = {
            "client_id": self.tripleseat_client_id,
            "client_secret": self.tripleseat_client_secret,
            "grant_type": "client_credentials"
        }
        
        print("Getting Tripleseat auth token...")
        response = requests.post(token_url, json=payload, timeout=10)
        
        if response.status_code != 200:
            print(f"Error getting Tripleseat token: {response.status_code}")
            print(response.text)
            return None
            
        token = response.json().get("access_token")
        if token:
            print("Successfully obtained Tripleseat token")
        return token
    
    def _get_host_hub_token(self):
        """Get Host Hub authentication token"""
        # First check if the API is responsive
        try:
            test_url = f"{self.host_hub_api_url}/test"
            test_response = requests.get(test_url, timeout=10)
            if test_response.status_code != 200:
                print(f"Host Hub API test failed: {test_response.status_code}")
                return None
            
            print("Host Hub API is responsive")
        except Exception as e:
            print(f"Error testing Host Hub API: {str(e)}")
            return None
        
        # Authenticate with Host Hub
        try:
            auth_url = f"{self.host_hub_api_url}/auth/admin-login"
            auth_data = {
                "username": self.admin_username,
                "password": self.admin_password
            }
            
            print(f"Authenticating with Host Hub...")
            auth_response = requests.post(auth_url, json=auth_data, timeout=10)
            
            if auth_response.status_code != 200:
                print(f"Host Hub authentication failed: {auth_response.status_code}")
                print(auth_response.text)
                return None
            
            token = auth_response.json().get("token")
            if token:
                print("Successfully authenticated with Host Hub")
                return token
            else:
                print("No token in Host Hub authentication response")
                return None
                
        except Exception as e:
            print(f"Error during Host Hub authentication: {str(e)}")
            return None
    
    def refresh_tokens_if_needed(self):
        """Refresh authentication tokens if they're missing"""
        if not self.tripleseat_token:
            print("Tripleseat token missing, refreshing...")
            self.tripleseat_token = self._get_tripleseat_token()
        
        if not self.host_hub_token:
            print("Host Hub token missing, refreshing...")
            self.host_hub_token = self._get_host_hub_token()
        
        return self.tripleseat_token and self.host_hub_token
    
    def get_tripleseat_event(self, event_id):
        """Get event data from Tripleseat"""
        if not self.tripleseat_token:
            print("No Tripleseat authentication token available")
            return None
            
        url = f"{self.tripleseat_base_url}events/{event_id}.json"
        
        headers = {
            "Authorization": f"Bearer {self.tripleseat_token}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"Fetching event from Tripleseat API: {url}")
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code != 200:
                print(f"Error fetching event from Tripleseat: {response.status_code}")
                print(response.text)
                return None
            
            # Parse the response
            response_data = response.json()
            
            # The event data is nested inside the 'event' property
            if 'event' in response_data:
                event_data = response_data['event']
                print(f"Successfully retrieved event from Tripleseat: {event_data.get('name')}")
                return event_data
            else:
                print("Response doesn't contain event data in the expected format")
                return None
                
        except Exception as e:
            print(f"Error fetching event from Tripleseat: {str(e)}")
            return None
    
    def _convert_date_format(self, date_str):
        """Convert MM/DD/YYYY to ISO date format"""
        if not date_str or "/" not in date_str:
            return date_str
            
        try:
            date_parts = date_str.split("/")
            month, day, year = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
            date_obj = datetime(year, month, day)
            iso_date = date_obj.strftime("%Y-%m-%dT00:00:00.000Z")
            print(f"Converted date: {date_str} → {iso_date}")
            return iso_date
        except Exception as e:
            print(f"Error converting date {date_str}: {e}")
            return date_str
    
    def _convert_time_format(self, date_str, time_str):
        """Convert time (like "10:00 AM") to ISO format"""
        if not time_str or not date_str:
            return time_str
            
        try:
            # Extract just the date part if it's a full ISO string
            if "T" in date_str:
                date_str = date_str.split("T")[0]
                
            # Parse AM/PM time
            is_pm = "PM" in time_str.upper()
            time_parts = time_str.upper().replace("AM", "").replace("PM", "").strip().split(":")
            hours = int(time_parts[0])
            minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
            
            # Adjust for PM
            if is_pm and hours < 12:
                hours += 12
            elif not is_pm and hours == 12:
                hours = 0
                
            # Create ISO datetime string
            iso_time = f"{date_str}T{hours:02d}:{minutes:02d}:00.000Z"
            print(f"Converted time: {time_str} → {iso_time}")
            return iso_time
        except Exception as e:
            print(f"Error converting time {time_str}: {e}")
            return time_str
    
    def convert_to_host_hub_format(self, event_data):
        """Convert Tripleseat event data to Host Hub format with proper data conversions"""
        if not event_data:
            return None
        
        try:
            # Extract key fields from Tripleseat event
            event_id = event_data.get('id')
            event_name = event_data.get('name', 'Unnamed Event')
            event_date = event_data.get('event_date')  # "3/13/2025"
            event_start_time = event_data.get('event_start_time')  # "10:00 AM"
            event_end_time = event_data.get('event_end_time')  # "11:30 AM"
            
            print(f"Processing event: {event_name}")
            print(f"Event date: {event_date}")
            print(f"Event start time: {event_start_time}")
            print(f"Event end time: {event_end_time}")
            
            # Get location
            location = None
            if 'location' in event_data and event_data['location']:
                location = event_data['location'].get('name', '')
            
            # Map facility name based on location
            facility_name = "Wonderfly Arena Timonium"  # Default
            if location:
                norm_location = location.lower().strip()
                if "arbutus" in norm_location:
                    facility_name = "Wonderfly Arena Arbutus"
            
            # Map to facility ID
            facility_id = self.facility_ids.get(facility_name)
            if not facility_id:
                print(f"WARNING: Unknown facility name: {facility_name}")
                facility_id = next(iter(self.facility_ids.values()))
            
            # Get description
            description = event_data.get('description', '')
            if not description:
                description = f"Auto-created from Tripleseat Event ID: {event_id}"
            
            # Convert date and time formats
            iso_date = self._convert_date_format(event_date)
            iso_start_time = self._convert_time_format(iso_date, event_start_time)
            iso_end_time = self._convert_time_format(iso_date, event_end_time)
            
            # Map status
            status = event_data.get('status', 'DEFINITE')
            mapped_status = "Definite"  # Default
            if status:
                status_norm = status.lower().strip()
                if not ('definite' in status_norm or 'confirmed' in status_norm):
                    mapped_status = "Closed"
            
            # Create Host Hub event data
            host_hub_event = {
                "name": event_name,
                "description": description,
                "date": iso_date,
                "startTime": iso_start_time,
                "endTime": iso_end_time,
                "status": mapped_status,
                "facility": facility_id,
                "tripleseatEventId": str(event_id)
            }
            
            # Remove any None values
            host_hub_event = {k: v for k, v in host_hub_event.items() if v is not None}
            
            print(f"Data formatted for Host Hub: {json.dumps(host_hub_event, indent=2)}")
            return host_hub_event
            
        except Exception as e:
            print(f"Error converting event data to Host Hub format: {str(e)}")
            return None
    
    def check_if_event_exists(self, tripleseat_id):
        """Check if an event with the given Tripleseat ID already exists in Host Hub"""
        if not self.host_hub_token:
            print("No Host Hub authentication token available")
            return None
            
        find_url = f"{self.host_hub_api_url}/events/tripleseat/{tripleseat_id}"
        headers = {
            "Authorization": f"Bearer {self.host_hub_token}",
            "Content-Type": "application/json"
        }
        
        try:
            print(f"Checking if event with Tripleseat ID {tripleseat_id} exists...")
            find_response = requests.get(find_url, headers=headers, timeout=10)
            
            if find_response.status_code == 200:
                # Event exists
                response_data = find_response.json()
                if 'event' in response_data and response_data['event']:
                    existing_event = response_data['event']
                    existing_id = existing_event.get('_id')
                    print(f"Found existing event with Host Hub ID: {existing_id}")
                    return existing_id
                else:
                    print("Response indicated event exists but no event data found")
                    return None
            elif find_response.status_code == 404:
                # Event doesn't exist
                print(f"No existing event found with Tripleseat ID {tripleseat_id}")
                return None
            else:
                print(f"Unexpected response when checking for event: {find_response.status_code}")
                print(find_response.text)
                return None
                
        except Exception as e:
            print(f"Error checking if event exists: {str(e)}")
            return None
    
    def create_event_in_host_hub(self, event_data):
        """Create or update event in Host Hub"""
        if not self.host_hub_token:
            print("No Host Hub authentication token available")
            return False
        
        tripleseat_id = event_data.get('tripleseatEventId')
        if not tripleseat_id:
            print("No Tripleseat ID in event data, cannot check for duplicates")
            return False
            
        # Check if the event already exists
        existing_event_id = self.check_if_event_exists(tripleseat_id)
        
        headers = {
            "Authorization": f"Bearer {self.host_hub_token}",
            "Content-Type": "application/json"
        }
        
        try:
            if existing_event_id:
                # Update existing event
                update_url = f"{self.host_hub_api_url}/events/{existing_event_id}"
                print(f"Updating existing event at: {update_url}")
                
                update_response = requests.put(update_url, json=event_data, headers=headers, timeout=15)
                
                print(f"Update response status: {update_response.status_code}")
                
                if update_response.status_code in [200, 201]:
                    print(f"Successfully updated existing event in Host Hub (ID: {existing_event_id})")
                    return True
                else:
                    print(f"Failed to update event: {update_response.status_code}")
                    print(f"Response: {update_response.text}")
                    
                    # If update fails, try creating new as fallback
                    print("Attempting to create new event as fallback...")
            
            # Create new event
            create_url = f"{self.host_hub_api_url}/events"
            print(f"Creating new event in Host Hub...")
            
            create_response = requests.post(create_url, json=event_data, headers=headers, timeout=15)
            
            print(f"Create response status: {create_response.status_code}")
            
            if create_response.status_code in [200, 201]:
                print("Successfully created new event in Host Hub!")
                try:
                    response_data = create_response.json()
                    if 'event' in response_data:
                        new_event_id = response_data['event'].get('_id')
                        print(f"New Host Hub Event ID: {new_event_id}")
                except:
                    pass
                return True
            else:
                print(f"Failed to create event: {create_response.status_code}")
                print(f"Response: {create_response.text}")
                return False
                
        except Exception as e:
            print(f"Error creating/updating event in Host Hub: {str(e)}")
            return False
    
    def process_event(self, event_id):
        """Process an event end-to-end from Tripleseat to Host Hub"""
        print(f"\n=== PROCESSING TRIPLESEAT EVENT {event_id} ===\n")
        
        # Ensure we have valid tokens
        if not self.refresh_tokens_if_needed():
            print("Failed to obtain required authentication tokens")
            return False
        
        # Step 1: Get event from Tripleseat
        tripleseat_event = self.get_tripleseat_event(event_id)
        if not tripleseat_event:
            print(f"Failed to get event {event_id} from Tripleseat")
            return False
        
        # Step 2: Convert to Host Hub format
        host_hub_data = self.convert_to_host_hub_format(tripleseat_event)
        if not host_hub_data:
            print("Failed to convert event data to Host Hub format")
            return False
        
        # Step 3: Create/update in Host Hub
        success = self.create_event_in_host_hub(host_hub_data)
        
        if success:
            print(f"\n=== EVENT {event_id} SUCCESSFULLY PROCESSED ===")
            return True
        else:
            print(f"\n=== FAILED TO PROCESS EVENT {event_id} ===")
            return False

def main():
    """Main entry point with command line argument support"""
    # Get event ID from command line arguments if provided
    event_id = sys.argv[1] if len(sys.argv) > 1 else "47545207"
    
    # Create integration instance
    integration = TripleseatHostHubIntegration()
    
    # Process the event
    success = integration.process_event(event_id)
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()