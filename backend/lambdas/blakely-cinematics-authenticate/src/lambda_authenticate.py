  import json
  import boto3
  import hashlib
  import secrets
  from datetime import datetime

  def lambda_handler(event, context):
      # CORS headers - MUST be in every response
      cors_headers = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Accept,Authorization',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
      }

      print(f"Event: {event}")
      print(f"HTTP Method: {event.get('httpMethod', 'Unknown')}")

      # Handle preflight OPTIONS request
      if event.get('httpMethod') == 'OPTIONS':
          print("Handling OPTIONS preflight request")
          return {
              'statusCode': 200,
              'headers': cors_headers,
              'body': json.dumps({'message': 'CORS preflight handled'})
          }

      # Only allow POST for actual authentication
      if event.get('httpMethod') != 'POST':
          return {
              'statusCode': 405,
              'headers': cors_headers,
              'body': json.dumps({
                  'success': False,
                  'message': 'Method not allowed'
              })
          }

      try:
          # Parse request body
          if 'body' not in event or not event['body']:
              return {
                  'statusCode': 400,
                  'headers': cors_headers,
                  'body': json.dumps({
                      'success': False,
                      'message': 'Missing request body'
                  })
              }

          body = json.loads(event['body'])
          gallery_code = body.get('galleryCode', '').strip()
          password = body.get('password', '').strip()

          print(f"Authentication attempt for gallery: {gallery_code}")

          if not gallery_code or not password:
              return {
                  'statusCode': 400,
                  'headers': cors_headers,
                  'body': json.dumps({
                      'success': False,
                      'message': 'Gallery code and password are required'
                  })
              }

          # Initialize DynamoDB
          dynamodb = boto3.resource('dynamodb')
          table = dynamodb.Table('blakely-cinematics-clients')

          # Try to get the user from DynamoDB
          try:
              response = table.get_item(
                  Key={'gallery_code': gallery_code}
              )

              if 'Item' in response:
                  # User exists - check password
                  user = response['Item']
                  if user.get('password') == password:
                      # Authentication successful
                      print(f"Authentication successful for {gallery_code}")
                      return {
                          'statusCode': 200,
                          'headers': cors_headers,
                          'body': json.dumps({
                              'success': True,
                              'message': 'Authentication successful',
                              'galleryCode': gallery_code,
                              'name': user.get('name', 'Client'),
                              'email': user.get('email', ''),
                              'package': user.get('package', ''),
                              'date': user.get('session_date', ''),
                              'time': user.get('session_time', '')
                          })
                      }
                  else:
                      # Wrong password
                      print(f"Wrong password for {gallery_code}")
                      return {
                          'statusCode': 401,
                          'headers': cors_headers,
                          'body': json.dumps({
                              'success': False,
                              'message': 'Invalid credentials'
                          })
                      }
              else:
                  # User doesn't exist - this is a new registration
                  # For testing, we'll create a new user
                  print(f"Creating new user: {gallery_code}")

                  # Create new user entry
                  new_user = {
                      'gallery_code': gallery_code,
                      'password': password,
                      'name': f'User {gallery_code}',
                      'email': 'test@example.com',
                      'package': 'Test Package',
                      'session_date': datetime.now().isoformat(),
                      'session_time': '2:00 PM',
                      'created_at': datetime.now().isoformat()
                  }

                  table.put_item(Item=new_user)

                  return {
                      'statusCode': 200,
                      'headers': cors_headers,
                      'body': json.dumps({
                          'success': True,
                          'message': 'New user created and authenticated',
                          'galleryCode': gallery_code,
                          'name': new_user['name'],
                          'email': new_user['email'],
                          'package': new_user['package'],
                          'date': new_user['session_date'],
                          'time': new_user['session_time']
                      })
                  }

          except Exception as db_error:
              print(f"Database error: {str(db_error)}")
              return {
                  'statusCode': 500,
                  'headers': cors_headers,
                  'body': json.dumps({
                      'success': False,
                      'message': 'Database error'
                  })
              }

      except json.JSONDecodeError:
          return {
              'statusCode': 400,
              'headers': cors_headers,
              'body': json.dumps({
                  'success': False,
                  'message': 'Invalid JSON in request body'
              })
          }
      except Exception as e:
          print(f"Unexpected error: {str(e)}")
          return {
              'statusCode': 500,
              'headers': cors_headers,
              'body': json.dumps({
                  'success': False,
                  'message': 'Internal server error'
              })
          }
