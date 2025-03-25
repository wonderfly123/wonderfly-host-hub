import requests
import json
import os
import sys
from datetime import datetime
import pytz  # Used for explicit timezone handling
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Tripleseat credentials with enhanced debugging
tripleseat_client_id = os.getenv("TRIPLESEAT_CLIENT_ID")
tripleseat_client_secret = os.getenv("TRIPLESEAT_CLIENT_SECRET")
tripleseat_base_url = os.getenv("TRIPLESEAT_BASE_URL", "https://api.tripleseat.com/v1/")

# Print loaded environment variables
print("[ENV DEBUG] Available environment variables:")
print(f"[ENV DEBUG] TRIPLESEAT_CLIENT_ID exists: {'Yes' if tripleseat_client_id else 'No'}")
print(f"[ENV DEBUG] TRIPLESEAT_CLIENT_SECRET exists: {'Yes' if tripleseat_client_secret else 'No'}")
print(f"[ENV DEBUG] TRIPLESEAT_BASE_URL: {tripleseat_base_url}")
print(f"[ENV DEBUG] HOST_HUB_ADMIN_USERNAME exists: {'Yes' if os.getenv('HOST_HUB_ADMIN_USERNAME') else 'No'}")
print("[ENV DEBUG] Current working directory:", os.getcwd())
print("[ENV DEBUG] .env file exists:", os.path.exists(".env"))
print("[ENV DEBUG] .env in parent directory exists:", os.path.exists("../.env"))

# Host Hub settings
host_hub_port = os.getenv("PORT", "5002")
host_hub_api_url = f"http://localhost:{host_hub_port}/api"
admin_username = os.getenv("HOST_HUB_ADMIN_USERNAME", "admin")
admin_password = os.getenv("HOST_HUB_ADMIN_PASSWORD", "admin123")

# Hardcoded facility IDs based on name
facility_ids = {
    "Wonderfly Arena Timonium": "67db7fe6faf97218df1f9d96",
    "Wonderfly Arena Arbutus": "67db7fe6faf97218df1f9d97"
}

def get_tripleseat_token():
    """Get Tripleseat API access token"""
    token_url = "https://api.tripleseat.com/oauth/token"
    
    # Debug environment variables
    print(f"[DEBUG] TRIPLESEAT_CLIENT_ID length: {len(tripleseat_client_id) if tripleseat_client_id else 'NOT SET'}")
    print(f"[DEBUG] TRIPLESEAT_CLIENT_SECRET length: {len(tripleseat_client_secret) if tripleseat_client_secret else 'NOT SET'}")
    print(f"[DEBUG] First 4 chars of client_id: {tripleseat_client_id[:4] if tripleseat_client_id and len(tripleseat_client_id) >= 4 else 'N/A'}")
    
    # Create payload dictionary
    payload = {
        "client_id": tripleseat_client_id,
        "client_secret": tripleseat_client_secret,
        "grant_type": "client_credentials"
    }
    
    print("[DEBUG] Token URL:", token_url)
    print("[DEBUG] Request payload keys:", list(payload.keys()))
    print("[DEBUG] Grant type:", payload["grant_type"])
    
    # Try multiple ways of sending the request
    methods_to_try = [
        {
            "name": "form-data with Content-Type header",
            "func": lambda: requests.post(
                token_url, 
                data=payload,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        },
        {
            "name": "JSON payload",
            "func": lambda: requests.post(token_url, json=payload)
        },
        {
            "name": "form-data without Content-Type header",
            "func": lambda: requests.post(token_url, data=payload)
        }
    ]
    
    for method in methods_to_try:
        try:
            print(f"[DEBUG] Trying method: {method['name']}...")
            response = method["func"]()
            
            print(f"[DEBUG] Response status: {response.status_code}")
            print(f"[DEBUG] Response headers: {dict(response.headers)}")
            print(f"[DEBUG] Response body: {response.text}")
            
            if response.status_code == 200:
                token = response.json().get("access_token")
                print(f"[SUCCESS] Method {method['name']} worked!")
                return token
            else:
                print(f"[DEBUG] Method {method['name']} failed with status {response.status_code}")
        
        except Exception as e:
            print(f"[DEBUG] Exception with method {method['name']}: {str(e)}")
    
    # If we reach here, all methods failed
    print("[ERROR] All authentication methods failed")
    
    # Check if client credentials are valid by attempting a test validation
    try:
        print("[DEBUG] Double-checking Tripleseat credentials format...")
        # Client ID and secret should be UUID-like strings
        client_id_valid = len(tripleseat_client_id) > 10 if tripleseat_client_id else False
        client_secret_valid = len(tripleseat_client_secret) > 10 if tripleseat_client_secret else False
        
        print(f"[DEBUG] Client ID format looks valid: {client_id_valid}")
        print(f"[DEBUG] Client secret format looks valid: {client_secret_valid}")
        
        if not client_id_valid or not client_secret_valid:
            print("[WARNING] Tripleseat credentials don't appear to be in the expected format")
            print("[HELP] Check that your credentials are correctly copied from Tripleseat")
    except Exception as e:
        print(f"[DEBUG] Error checking credential format: {str(e)}")
    
    raise Exception("Failed to get Tripleseat token - all authentication methods failed")

def get_tripleseat_event(event_id, token):
    """Get event data from Tripleseat"""
    url = f"{tripleseat_base_url}events/{event_id}.json"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"Making request to Tripleseat API: {url}")
    response = requests.get(url, headers=headers)
    
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

def map_tripleseat_to_host_hub(event_data):
    """Convert Tripleseat event data to Host Hub format"""
    if not event_data:
        return None
    
    # Extract key fields from Tripleseat event
    event_id = event_data.get('id')
    event_name = event_data.get('name', 'Unnamed Event')
    event_date = event_data.get('event_date')  # "3/13/2025"
    event_start_time = event_data.get('event_start_time')  # "10:00 AM"
    event_end_time = event_data.get('event_end_time')  # "11:30 AM"
    
    print(f"[DEBUG] Original Tripleseat event data:")
    print(f"[DEBUG] Event date: {event_date}")
    print(f"[DEBUG] Event start time: {event_start_time}")
    print(f"[DEBUG] Event end time: {event_end_time}")
    
    # Get location from the nested location object
    location = None
    if 'location' in event_data and event_data['location']:
        location = event_data['location'].get('name', '')
    
    # Map facility name based on location
    facility_name = "Wonderfly Arena Timonium"  # Default
    if location:
        norm_location = location.lower().strip()
        if "arbutus" in norm_location:
            facility_name = "Wonderfly Arena Arbutus"
    
    # Get description
    description = event_data.get('description', '')
    if not description:
        description = f"Auto-created from Tripleseat Event ID: {event_id}"
    
    # Map status to Definite or Closed
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
        "date": event_date,  # Keep as "3/13/2025"
        "startTime": event_start_time,  # Keep as "10:00 AM"
        "endTime": event_end_time,  # Keep as "11:30 AM"
        "status": mapped_status,
        "facility": facility_name,  # Use facility name, not ID yet
        "tripleseatEventId": str(event_id)
    }
    
    print(f"[DEBUG] Mapped event data before file save:")
    print(json.dumps(host_hub_event, indent=2))
    
    return host_hub_event

def extract_event_data(event_id):
    """Extract event data from Tripleseat and save to JSON file"""
    print(f"\n=== EXTRACTING TRIPLESEAT EVENT {event_id} ===\n")
    
    try:
        # Check for required environment variables
        print("[VALIDATION] Checking required environment variables...")
        missing_vars = []
        
        if not tripleseat_client_id:
            missing_vars.append("TRIPLESEAT_CLIENT_ID")
        
        if not tripleseat_client_secret:
            missing_vars.append("TRIPLESEAT_CLIENT_SECRET")
        
        if missing_vars:
            print(f"[ERROR] The following required environment variables are missing: {', '.join(missing_vars)}")
            print("[HELP] Make sure these variables are set in your .env file in the project root directory.")
            print("[DEBUG] To troubleshoot, try:")
            print("  1. Check that your .env file exists and contains the correct variables")
            print("  2. Try printing the environment variables directly: python3 -c 'import os; print(os.environ.get(\"TRIPLESEAT_CLIENT_ID\"))'")
            print("  3. Run this script with: python3 -m dotenv.cli .env python3 server/services/create_event.py")
            
            # Try to give more info about the .env file
            for search_path in [".env", "../.env", "../../.env"]:
                if os.path.exists(search_path):
                    print(f"[INFO] Found .env file at {search_path}")
                    try:
                        with open(search_path, 'r') as f:
                            env_contents = f.read()
                            # Don't print actual values, just check if the keys exist
                            has_client_id = "TRIPLESEAT_CLIENT_ID" in env_contents
                            has_client_secret = "TRIPLESEAT_CLIENT_SECRET" in env_contents
                            print(f"[INFO] .env file contains TRIPLESEAT_CLIENT_ID: {has_client_id}")
                            print(f"[INFO] .env file contains TRIPLESEAT_CLIENT_SECRET: {has_client_secret}")
                    except Exception as e:
                        print(f"[ERROR] Failed to read .env file: {str(e)}")
            
            return False
            
        # Get Tripleseat token
        try:
            print("[API] Attempting to get Tripleseat token...")
            tripleseat_token = get_tripleseat_token()
            print(f"[API] Token obtained successfully: {tripleseat_token[:10]}...")
        except Exception as token_error:
            print(f"[ERROR] Failed to get Tripleseat token: {str(token_error)}")
            print("[DEBUG] This is likely due to invalid credentials or an API connectivity issue.")
            print("[HELP] Verify your Tripleseat API credentials and ensure they are active.")
            return False
        
        # Get event from Tripleseat
        try:
            print(f"[API] Retrieving event {event_id} from Tripleseat...")
            tripleseat_event = get_tripleseat_event(event_id, tripleseat_token)
            if not tripleseat_event:
                print(f"[ERROR] Failed to get event {event_id} from Tripleseat")
                return False
            print(f"[API] Successfully retrieved event: {tripleseat_event.get('name', 'Unknown')}")
        except Exception as event_error:
            print(f"[ERROR] Exception retrieving event: {str(event_error)}")
            return False
        
        # Map to Host Hub format
        try:
            print("[PROCESSING] Mapping Tripleseat data to Host Hub format...")
            host_hub_data = map_tripleseat_to_host_hub(tripleseat_event)
            if not host_hub_data:
                print("[ERROR] Failed to map event data - mapping function returned None")
                return False
            print("[PROCESSING] Mapping completed successfully")
        except Exception as mapping_error:
            print(f"[ERROR] Exception during data mapping: {str(mapping_error)}")
            return False
        
        # Save mapped data to file
        try:
            output_file = f'event_{event_id}_data.json'
            with open(output_file, 'w') as f:
                json.dump(host_hub_data, f, indent=2)
                print(f"[FILE] Saved mapped event data to {output_file}")
            
            print("\n=== EVENT DATA EXTRACTION SUCCESSFUL ===")
            print(f"Event Name: {host_hub_data.get('name')}")
            print(f"Event Date: {host_hub_data.get('date')}")
            print(f"Event Start Time: {host_hub_data.get('startTime')}")
            print(f"Event End Time: {host_hub_data.get('endTime')}")
            print(f"Facility: {host_hub_data.get('facility')}")
            print(f"Tripleseat ID: {host_hub_data.get('tripleseatEventId')}")
            print(f"\nData saved to {output_file}")
            return output_file
        except Exception as file_error:
            print(f"[ERROR] Exception saving output file: {str(file_error)}")
            return False
    
    except Exception as e:
        print(f"[ERROR] Unhandled exception in extract_event_data: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def create_event_from_file(json_file):
    """Create event in Host Hub from JSON file"""
    print(f"\n=== CREATING EVENT FROM {json_file} ===\n")
    
    try:
        # Load the event data from the JSON file
        with open(json_file, "r") as f:
            event_data = json.load(f)
        
        print("[DEBUG] Original event data from file:")
        print(json.dumps(event_data, indent=2))
        
        # Prepare data for Host Hub
        # Convert facility name to ObjectId
        facility_name = event_data.get("facility")
        if facility_name in facility_ids:
            event_data["facility"] = facility_ids[facility_name]
            print(f"[DEBUG] Mapped facility name '{facility_name}' to ID: {event_data['facility']}")
        else:
            print(f"WARNING: Unknown facility name: {facility_name}")
            # Default to first facility
            event_data["facility"] = next(iter(facility_ids.values()))
            print(f"[DEBUG] Using default facility ID: {event_data['facility']}")
        
        # Store original date and time values for debugging
        original_date = event_data.get("date", "")
        original_start_time = event_data.get("startTime", "")
        original_end_time = event_data.get("endTime", "")
        
        print(f"[DEBUG] Before conversion - date: {original_date}")
        print(f"[DEBUG] Before conversion - startTime: {original_start_time}")
        print(f"[DEBUG] Before conversion - endTime: {original_end_time}")
        
        # Handle date format conversion
        # Convert MM/DD/YYYY to ISO date format
        if "/" in event_data["date"]:
            try:
                date_parts = event_data["date"].split("/")
                print(f"[DEBUG] Date parts: {date_parts}")
                month, day, year = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
                print(f"[DEBUG] Parsed month={month}, day={day}, year={year}")
                
                # Store the date parts for later use with time conversion
                date_parts_for_time = (year, month, day)
                print(f"[DEBUG] Stored date parts: {date_parts_for_time}")
                
                # IMPORTANT FIX: For the date field, we need to use noon UTC to ensure
                # it maps to the correct day in Eastern Time
                event_data["date"] = f"{year}-{month:02d}-{day:02d}T12:00:00.000Z"
                print(f"[DEBUG] Fixed date value: {event_data['date']}")
            except Exception as e:
                print(f"[DEBUG] Error converting date: {str(e)}")
                import traceback
                traceback.print_exc()
        
        # Handle time format conversion
        # Convert "10:00 AM" and "11:30 AM" to full ISO datetime
        try:
            # Get date string for time conversion (e.g., "2025-03-13")
            date_str = event_data["date"].split("T")[0]
            print(f"[DEBUG] Using date string for time conversion: {date_str}")
            
            # Convert start time if present
            if "startTime" in event_data:
                start_time = event_data["startTime"]
                print(f"[DEBUG] Processing start time: {start_time}")
                
                # Parse AM/PM time
                is_pm = "PM" in start_time.upper()
                print(f"[DEBUG] Is PM? {is_pm}")
                
                time_parts = start_time.upper().replace("AM", "").replace("PM", "").strip().split(":")
                print(f"[DEBUG] Time parts: {time_parts}")
                
                hours = int(time_parts[0])
                minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
                print(f"[DEBUG] Parsed hours={hours}, minutes={minutes}")
                
                # Adjust for PM
                original_hours = hours
                if is_pm and hours < 12:
                    hours += 12
                elif not is_pm and hours == 12:
                    hours = 0
                print(f"[DEBUG] After AM/PM adjustment: hours={hours} (was {original_hours})")
                
                # Create datetime object in Eastern Time
                eastern = pytz.timezone('US/Eastern')
                year, month, day = date_parts_for_time
                print(f"[DEBUG] Using stored date parts: year={year}, month={month}, day={day}")
                
                # Create a datetime in Eastern Time
                naive_dt = datetime(year, month, day, hours, minutes, 0)
                print(f"[DEBUG] Naive datetime: {naive_dt}")
                dt_eastern = eastern.localize(naive_dt)
                print(f"[DEBUG] Eastern time datetime: {dt_eastern}")
                
                # Convert to UTC
                dt_utc = dt_eastern.astimezone(pytz.UTC)
                print(f"[DEBUG] UTC time datetime: {dt_utc}")
                
                # Format as ISO string
                start_datetime = dt_utc.strftime('%Y-%m-%dT%H:%M:%S.000Z')
                event_data["startTime"] = start_datetime
                print(f"[DEBUG] Converted startTime: {event_data['startTime']}")
                print(f"[DEBUG] Would display in EST as: {dt_eastern.strftime('%m/%d/%Y %I:%M %p')}")
            
            # Convert end time
            if "endTime" in event_data:
                end_time = event_data["endTime"]
                print(f"[DEBUG] Processing end time: {end_time}")
                
                # Parse AM/PM time
                is_pm = "PM" in end_time.upper()
                print(f"[DEBUG] Is PM? {is_pm}")
                
                time_parts = end_time.upper().replace("AM", "").replace("PM", "").strip().split(":")
                print(f"[DEBUG] Time parts: {time_parts}")
                
                hours = int(time_parts[0])
                minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
                print(f"[DEBUG] Parsed hours={hours}, minutes={minutes}")
                
                # Adjust for PM
                original_hours = hours
                if is_pm and hours < 12:
                    hours += 12
                elif not is_pm and hours == 12:
                    hours = 0
                print(f"[DEBUG] After AM/PM adjustment: hours={hours} (was {original_hours})")
                
                # Create datetime object in Eastern Time
                eastern = pytz.timezone('US/Eastern')
                year, month, day = date_parts_for_time
                print(f"[DEBUG] Using stored date parts: year={year}, month={month}, day={day}")
                
                # Create a datetime in Eastern Time
                naive_dt = datetime(year, month, day, hours, minutes, 0)
                print(f"[DEBUG] Naive datetime: {naive_dt}")
                dt_eastern = eastern.localize(naive_dt)
                print(f"[DEBUG] Eastern time datetime: {dt_eastern}")
                
                # Convert to UTC
                dt_utc = dt_eastern.astimezone(pytz.UTC)
                print(f"[DEBUG] UTC time datetime: {dt_utc}")
                
                # Format as ISO string
                end_datetime = dt_utc.strftime('%Y-%m-%dT%H:%M:%S.000Z')
                event_data["endTime"] = end_datetime
                print(f"[DEBUG] Converted endTime: {event_data['endTime']}")
                print(f"[DEBUG] Would display in EST as: {dt_eastern.strftime('%m/%d/%Y %I:%M %p')}")
        except Exception as e:
            print(f"[DEBUG] Error converting times: {str(e)}")
            import traceback
            traceback.print_exc()
        
        print("[DEBUG] After all conversions, event data:")
        print(json.dumps(event_data, indent=2))
        
        # Create a human-readable summary of what's being sent
        try:
            start_dt = datetime.fromisoformat(event_data["startTime"].replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(event_data["endTime"].replace("Z", "+00:00"))
            date_dt = datetime.fromisoformat(event_data["date"].replace("Z", "+00:00"))
            
            # Convert to EST for display
            eastern = pytz.timezone('US/Eastern')
            start_dt_est = start_dt.replace(tzinfo=pytz.UTC).astimezone(eastern)
            end_dt_est = end_dt.replace(tzinfo=pytz.UTC).astimezone(eastern)
            date_dt_est = date_dt.replace(tzinfo=pytz.UTC).astimezone(eastern)
            
            print("\n[DEBUG] SUMMARY OF WHAT'S BEING SENT TO HOST HUB:")
            print(f"[DEBUG] Original values: {original_date}, {original_start_time} - {original_end_time}")
            print(f"[DEBUG] Date in UTC: {event_data['date']}")
            print(f"[DEBUG] Date in EST: {date_dt_est.strftime('%m/%d/%Y')}")
            print(f"[DEBUG] Start time in UTC: {event_data['startTime']}")
            print(f"[DEBUG] End time in UTC: {event_data['endTime']}")
            print(f"[DEBUG] Time Range (EST): {start_dt_est.strftime('%I:%M %p')} - {end_dt_est.strftime('%I:%M %p')}")
            print(f"[DEBUG] Complete datetime range (EST): {start_dt_est.strftime('%m/%d/%Y %I:%M %p')} - {end_dt_est.strftime('%m/%d/%Y %I:%M %p')}")
            print(f"[DEBUG] As it would appear in Host Hub: {date_dt_est.strftime('%m/%d/%Y')}")
            print(f"[DEBUG] Time range as it would appear: {start_dt_est.strftime('%I:%M %p')} - {end_dt_est.strftime('%I:%M %p')}")
        except Exception as e:
            print(f"[DEBUG] Error creating summary: {str(e)}")
            import traceback
            traceback.print_exc()
        
        # Step 1: Authenticate with Host Hub
        auth_url = f"{host_hub_api_url}/auth/admin-login"
        auth_data = {
            "username": admin_username,
            "password": admin_password
        }
        
        print(f"Authenticating with: {auth_url}")
        auth_response = requests.post(auth_url, json=auth_data)
        print(f"Auth response status: {auth_response.status_code}")
        
        if auth_response.status_code != 200:
            print("Authentication failed")
            print(auth_response.text)
            return False
        
        # Get token
        token = auth_response.json().get("token")
        if not token:
            print("No token in authentication response")
            return False
        
        print("Successfully authenticated")
        
        # Step 2: Create event in Host Hub
        create_url = f"{host_hub_api_url}/events"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"Creating event at: {create_url}")
        print("Headers:", headers)
        print("Event data:", json.dumps(event_data, indent=2))
        
        create_response = requests.post(create_url, json=event_data, headers=headers)
        print(f"Create response status: {create_response.status_code}")
        print(f"Create response: {create_response.text}")
        
        if create_response.status_code in [200, 201]:
            print("Successfully created/updated event in Host Hub!")
            return True
        else:
            print("Failed to create/update event in Host Hub")
            return False
            
    except Exception as e:
        print(f"Error creating event: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def process_event(event_id="47545207"):
    """Complete process: Extract data and then create event"""
    # Step 1: Extract data from Tripleseat and save to JSON
    json_file = extract_event_data(event_id)
    
    if not json_file:
        print("Failed to extract event data. Skipping creation step.")
        return
    
    # Give the system a moment to process the file
    import time
    print("Waiting 2 seconds before proceeding...")
    time.sleep(2)
    
    # Step 2: Create event from the JSON file using your working script
    creation_success = create_event_from_file(json_file)
    
    if creation_success:
        print("\n=== COMPLETE EVENT PROCESS SUCCESSFUL ===")
    else:
        print("\n=== EVENT CREATION FAILED ===")

if __name__ == "__main__":
    # Get event ID from command line arguments if provided
    event_id = sys.argv[1] if len(sys.argv) > 1 else "47545207"
    
    # Run the complete process
    process_event(event_id)