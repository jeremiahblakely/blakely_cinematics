import json
import boto3
import base64
import uuid
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Handle image uploads from admin dashboard
    Expects base64 encoded images with gallery metadata
    """
    
    BUCKET_NAME = 'blakely-cinematics'
    
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        gallery_code = body.get('galleryCode')
        images = body.get('images', [])
        
        if not gallery_code:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'success': False,
                    'message': 'Gallery code is required'
                })
            }
        
        if not images:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'success': False,
                    'message': 'No images provided'
                })
            }
        
        # Get DynamoDB table
        table = dynamodb.Table('blakely-cinematics-images')
        
        uploaded_images = []
        
        # Process each image
        for idx, image_data in enumerate(images):
            try:
                # Generate unique image ID
                image_id = f"IMG-{uuid.uuid4().hex[:8].upper()}"
                
                # Get file info
                file_name = image_data.get('fileName', f'image_{idx}.jpg')
                file_content = image_data.get('content', '')
                
                # Remove data URL prefix if present
                if ',' in file_content:
                    file_content = file_content.split(',')[1]
                
                # Decode base64 image
                image_bytes = base64.b64decode(file_content)
                
                # Create S3 key
                s3_key = f"galleries/{gallery_code}/{image_id}.jpg"
                
                # Upload to S3
                s3_client.put_object(
                    Bucket=BUCKET_NAME,
                    Key=s3_key,
                    Body=image_bytes,
                    ContentType='image/jpeg',
                    Metadata={
                        'gallery': gallery_code,
                        'original_name': file_name
                    }
                )
                
                # Save metadata to DynamoDB
                table.put_item(
                    Item={
                        'galleryCode': gallery_code,
                        'imageId': image_id,
                        'fileName': file_name,
                        's3Key': s3_key,
                        'uploadedAt': datetime.now().isoformat(),
                        'selected': False,
                        'size': len(image_bytes)
                    }
                )
                
                uploaded_images.append({
                    'imageId': image_id,
                    'fileName': file_name,
                    's3Key': s3_key,
                    'success': True
                })
                
            except Exception as e:
                print(f"Error uploading image {idx}: {str(e)}")
                uploaded_images.append({
                    'fileName': file_name,
                    'success': False,
                    'error': str(e)
                })
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Uploaded {len([img for img in uploaded_images if img.get("success")])} of {len(images)} images',
                'images': uploaded_images
            })
        }
        
    except Exception as e:
        print(f"Lambda error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': False,
                'message': f'Server error: {str(e)}'
            })
        }