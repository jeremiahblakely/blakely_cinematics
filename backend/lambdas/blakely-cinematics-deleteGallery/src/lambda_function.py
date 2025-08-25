import json
import boto3
from boto3.dynamodb.conditions import Key

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Delete a gallery and all associated images
    """
    
    BUCKET_NAME = 'blakely-cinematics'
    
    try:
        # Parse request
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        gallery_code = body.get('galleryCode')
        
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
        
        print(f"Deleting gallery: {gallery_code}")
        
        # Tables
        galleries_table = dynamodb.Table('blakely-cinematics-galleries')
        images_table = dynamodb.Table('blakely-cinematics-images')
        
        deleted_items = {
            'images': 0,
            's3_objects': 0
        }
        
        # Step 1: Delete S3 objects
        try:
            # List all objects in gallery folder
            s3_response = s3_client.list_objects_v2(
                Bucket=BUCKET_NAME,
                Prefix=f"galleries/{gallery_code}/"
            )
            
            if 'Contents' in s3_response:
                # Delete all objects
                objects_to_delete = [{'Key': obj['Key']} for obj in s3_response['Contents']]
                
                s3_client.delete_objects(
                    Bucket=BUCKET_NAME,
                    Delete={'Objects': objects_to_delete}
                )
                
                deleted_items['s3_objects'] = len(objects_to_delete)
                print(f"Deleted {len(objects_to_delete)} S3 objects")
        
        except Exception as e:
            print(f"Error deleting S3 objects: {str(e)}")
        
        # Step 2: Delete image records from DynamoDB
        try:
            # Query all images for this gallery
            img_response = images_table.query(
                KeyConditionExpression=Key('galleryCode').eq(gallery_code)
            )
            
            # Delete each image record
            for image in img_response.get('Items', []):
                images_table.delete_item(
                    Key={
                        'galleryCode': gallery_code,
                        'imageId': image['imageId']
                    }
                )
                deleted_items['images'] += 1
            
            print(f"Deleted {deleted_items['images']} image records")
            
        except Exception as e:
            print(f"Error deleting image records: {str(e)}")
        
        # Step 3: Delete gallery record
        try:
            galleries_table.delete_item(
                Key={'galleryCode': gallery_code}
            )
            print(f"Deleted gallery record: {gallery_code}")
            
        except Exception as e:
            print(f"Error deleting gallery record: {str(e)}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'message': f'Gallery {gallery_code} deleted successfully',
                'deleted': deleted_items
            })
        }
        
    except Exception as e:
        print(f"Delete error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': False,
                'message': f'Error deleting gallery: {str(e)}'
            })
        }