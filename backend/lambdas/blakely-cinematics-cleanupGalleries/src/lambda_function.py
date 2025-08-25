import boto3
import json
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key, Attr

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """
    Cleanup galleries older than 90 days
    Deletes from both S3 and DynamoDB
    """
    
    BUCKET_NAME = 'blakely-cinematics'
    DAYS_TO_KEEP = 90
    
    # Calculate cutoff date
    cutoff_date = datetime.now() - timedelta(days=DAYS_TO_KEEP)
    cutoff_timestamp = cutoff_date.isoformat()
    
    print(f"Cleaning up galleries created before: {cutoff_timestamp}")
    
    # Tables to clean
    galleries_table = dynamodb.Table('blakely-cinematics-galleries')
    images_table = dynamodb.Table('blakely-cinematics-images')
    
    deleted_galleries = []
    deleted_images_count = 0
    
    try:
        # Step 1: Find old galleries in DynamoDB
        response = galleries_table.scan(
            FilterExpression=Attr('createdAt').lt(cutoff_timestamp)
        )
        
        old_galleries = response.get('Items', [])
        print(f"Found {len(old_galleries)} galleries to delete")
        
        for gallery in old_galleries:
            gallery_code = gallery.get('galleryCode')
            if not gallery_code:
                continue
                
            print(f"Processing gallery: {gallery_code}")
            
            # Step 2: Delete S3 objects for this gallery
            try:
                # List all objects in the gallery folder
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
                    
                    deleted_images_count += len(objects_to_delete)
                    print(f"Deleted {len(objects_to_delete)} images from S3 for gallery {gallery_code}")
                
            except Exception as e:
                print(f"Error deleting S3 objects for {gallery_code}: {str(e)}")
            
            # Step 3: Delete image records from DynamoDB
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
                
                print(f"Deleted image records from DynamoDB for gallery {gallery_code}")
                
            except Exception as e:
                print(f"Error deleting image records for {gallery_code}: {str(e)}")
            
            # Step 4: Delete gallery record from DynamoDB
            try:
                galleries_table.delete_item(
                    Key={'galleryCode': gallery_code}
                )
                deleted_galleries.append(gallery_code)
                print(f"Deleted gallery record: {gallery_code}")
                
            except Exception as e:
                print(f"Error deleting gallery record {gallery_code}: {str(e)}")
        
        # Summary
        result = {
            'statusCode': 200,
            'message': f'Cleanup completed successfully',
            'deletedGalleries': deleted_galleries,
            'galleriesDeleted': len(deleted_galleries),
            'imagesDeleted': deleted_images_count,
            'cutoffDate': cutoff_timestamp
        }
        
        print(json.dumps(result))
        return result
        
    except Exception as e:
        print(f"Cleanup error: {str(e)}")
        return {
            'statusCode': 500,
            'message': f'Cleanup failed: {str(e)}'
        }