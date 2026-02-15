#!/bin/bash

BASE_URL="http://localhost:3001"

echo "1. Creating Event..."
CREATE_RES=$(curl -s -X POST "$BASE_URL/events" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event Phase 2",
    "location": "Santiago",
    "eventDate": "2023-12-31T20:00:00.000Z",
    "description": "A test event for verification"
  }')
echo "Response: $CREATE_RES"

EVENT_ID=$(echo $CREATE_RES | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Event ID: $EVENT_ID"

if [ -z "$EVENT_ID" ]; then
  echo "Failed to create event"
  exit 1
fi

echo -e "\n2. Listing Events..."
curl -s "$BASE_URL/events" | grep "Test Event Phase 2" && echo "Event found in list" || echo "Event not found in list"

echo -e "\n3. Creating Attendees CSV..."
echo "name,email,rut" > dependencies.csv
echo "John Doe,john@example.com,12345678-9" >> dependencies.csv
echo "Jane Doe,jane@example.com,98765432-1" >> dependencies.csv

echo -e "\n4. Uploading Attendees..."
curl -s -X POST "$BASE_URL/events/$EVENT_ID/attendees/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@dependencies.csv"

echo -e "\n5. Verifying Attendees..."
ATTENDEES_RES=$(curl -s "$BASE_URL/events/$EVENT_ID/attendees")
echo "$ATTENDEES_RES"
echo "$ATTENDEES_RES" | grep "john@example.com" && echo "Attendee John found" || echo "Attendee John not found"

echo -e "\n6. Triggering Emails (Mocking SendGrid)..."
# We expect this to fail or log if key is invalid, but endpoint should respond
curl -s -X POST "$BASE_URL/events/$EVENT_ID/invitations"

echo -e "\nDone."
