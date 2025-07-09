#!/bin/bash

# Base URL for the API
BASE_URL="http://localhost:3000/api/scrape"

# List of all region codes
REGIONS=(
  "nz" "nzni" "nzsi" "victoria" "nsw" "waussie" "swaussie" 
  "queensland" "saussie" "seaussie" "newcaledonia" "swp" 
  "europe" "uk" "estonia" "turkey" "world" "usa" "japan" 
  "safrica" "ocean" "pacific" "fiji" "spacific" "pitcairn" 
  "natlantic" "satlantic"
)

# --- Helper Function ---
function call_endpoint() {
  local method=$1
  local url=$2
  echo "--------------------------------------"
  echo "Calling $method $url"
  curl -X "$method" "$url" -H "Content-Type: application/json"
  echo ""
  echo "--------------------------------------"
}

# --- Main Script ---

echo ">>> Scraping non-region-specific data..."
call_endpoint "POST" "$BASE_URL/radar"
call_endpoint "POST" "$BASE_URL/satellite"
call_endpoint "POST" "$BASE_URL/upper-air"

echo ""
echo ">>> Scraping region-specific data..."

for region in "${REGIONS[@]}"; do
  echo ""
  echo "--- Processing region: $region ---"
  
  # Full scrape (download and remove)
  call_endpoint "POST" "$BASE_URL/regions/$region"
  
  # Remove only
  call_endpoint "POST" "$BASE_URL/regions/remove/$region"
  
  # Upload only
  call_endpoint "POST" "$BASE_URL/regions/upload/$region"
done

echo ""
echo "All scrape endpoints have been called."
