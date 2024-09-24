import boto3
import logging
import uuid

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Print the existing buckets in S3.
region = 'us-west-1'
s3_client = boto3.client('s3', region_name=region)
response = s3_client.list_buckets()
logger.info('Existing buckets:')
for bucket in response['Buckets']:
    logger.info(f'    {bucket['Name']}')

# Create a new bucket in Amazon S3.
logger.info('Creating new S3 bucket.')
location = {'LocationConstraint': region}
bucket_name = 'dillon-isaacs-tse-s3-demo'
s3_resource = boto3.resource('s3')
if not s3_resource.Bucket(bucket_name) in s3_resource.buckets.all():
    s3_client.create_bucket(Bucket=bucket_name, CreateBucketConfiguration=location)


# Print the updated list of all buckets: including the new bucket in the S3.
response = s3_client.list_buckets()
logger.info('Existing buckets:')
for bucket in response['Buckets']:
    logger.info(f'    {bucket['Name']}')

# Upload 3 files (objects) to the bucket you just created.
for x in range(3):
    identifier = str(uuid.uuid4())
    file_id = identifier + '-demo-file.txt'
    with open(file_id, 'w') as f:
        f.write(identifier)
        f.close()
    with open (file_id, 'rb') as f:
        s3_client.upload_fileobj(f, bucket_name, file_id)

# Print all 3 files (objects) in the bucket you just created.
logger.info('Bucket objects:')
for bucket_object in s3_client.list_objects(Bucket=bucket_name)['Contents']:
    logger.info('    ' + bucket_object['Key'])
