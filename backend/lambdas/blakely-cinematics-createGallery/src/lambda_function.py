import json
import boto3
import uuid
from datetime import datetime, timedelta
import random
import string

def lambda_handler(event, context):
    # Initialize DynamoDB
    dynamodb = boto3.resource('dynamodb')
    galleries_table = dynamodb.Table('blakely-cinematics-galleries')
    
    try:
        # Parse request body
        if 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
        
        # Extract booking details
        client_name = body.get('name')
        session_type = body.get('package', 'Signature Session')
        email = body.get('email')
        phone = body.get('phone')
        booking_date = body.get('date')
        booking_time = body.get('time')
        
        # Generate unique gallery code (e.g., "SMITH2025A")
        name_part = client_name.split()[0][:5].upper()
        year = datetime.now().year
        random_letter = random.choice(string.ascii_uppercase)
        gallery_code = f"{name_part}{year}{random_letter}"
        
        # Generate secure password
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        
        # Calculate expiration (90 days from now)
        created_at = datetime.now().isoformat()
        expires_at = (datetime.now() + timedelta(days=90)).isoformat()
        
        # Create gallery entry
        galleries_table.put_item(
            Item={
                'galleryCode': gallery_code,
                'password': password,
                'clientName': client_name,
                'email': email,
                'phone': phone,
                'sessionType': session_type,
                'bookingDate': booking_date,
                'bookingTime': booking_time,
                'createdAt': created_at,
                'expiresAt': expires_at,
                'imageCount': 0,
                'status': 'pending'
            }
        )
        
        # Return success with credentials
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'galleryCode': gallery_code,
                'password': password,
                'message': f'Gallery created for {client_name}'
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': False,
                'message': 'Failed to create gallery'
            })
        }