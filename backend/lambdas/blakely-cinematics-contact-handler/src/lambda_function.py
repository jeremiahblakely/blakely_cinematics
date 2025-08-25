import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses', region_name='us-east-1')

# Your DynamoDB table
table = dynamodb.Table('blakely-cinematics-contacts')

def lambda_handler(event, context):
    try:
        # Parse the incoming request
        if isinstance(event['body'], str):
            body = json.loads(event['body'])
        else:
            body = event['body']
        
        # Extract form data
        name = body.get('name', '')
        email = body.get('email', '')
        phone = body.get('phone', '')
        service = body.get('service', '')
        message = body.get('message', '')
        
        # Generate unique ID and timestamp
        contact_id = str(uuid.uuid4())
        timestamp = Decimal(str(datetime.now().timestamp()))
        
        # Store in DynamoDB
        table.put_item(
            Item={
                'id': contact_id,
                'timestamp': timestamp,
                'name': name,
                'email': email,
                'phone': phone,
                'service': service,
                'message': message,
                'date': datetime.now().isoformat()
            }
        )
        
        # Send email notification via SES
        try:
            email_subject = f"New Booking Request - {service}"
            email_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #FF6B35;">New Booking Request - Blakely Cinematics</h2>
                <p><strong>Client Details:</strong></p>
                <ul>
                    <li><strong>Name:</strong> {name}</li>
                    <li><strong>Email:</strong> {email}</li>
                    <li><strong>Phone:</strong> {phone}</li>
                    <li><strong>Service:</strong> {service}</li>
                </ul>
                <p><strong>Message:</strong></p>
                <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px;">{message}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    Booking ID: {contact_id}<br>
                    Submitted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
                </p>
            </body>
            </html>
            """
            
            ses.send_email(
                Source='jeremiah.blakely@gmail.com',
                Destination={'ToAddresses': ['jeremiah.blakely@gmail.com']},
                Message={
                    'Subject': {'Data': email_subject},
                    'Body': {'Html': {'Data': email_body}}
                }
            )
            
        except Exception as email_error:
            print(f"Email error: {str(email_error)}")
            # Continue even if email fails - booking is still saved
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'message': 'Contact form submitted successfully!',
                'id': contact_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Error submitting form',
                'error': str(e)
            })
        }