# Overview

This is a demo project that explains how to automate the setup of AWS WAF and AWS Security Automations for an API Gateway API and monitor its access logs using AWS Athena.

There are lots of API Gateway deployment variants so for this demo we will keep it as simple as possible.

**This is NOT a boilerplate!**

# Deployment

### Step 1 - Setup the deployment bucket

The solution requires a private S3 bucket for deployment. AWS Security Automations by default requires the region to be the suffix for the bucket name.

You can create the bucket using aws-cli:

```bash
aws s3api create-bucket --acl private --bucket lambda-waf-demo-us-east-1
```

### Step 2 - Build the AWS Security Automations assets

```bash
git clone https://github.com/awslabs/aws-waf-security-automations
cd aws-waf-security-automations/deployment
# note that here the bucket name does not have the region suffix
AWS_REGION=us-east-1 ./build-s3-dist.sh "lambda-waf-demo" "v2.3.0"
# copy the generated assets to our project
mv dist/* path/to/lambda-waf-demo/aws-security-automations-assets
```

### Step 3 - Upload the security automations assets

Before deploying the stack the aws-waf-security-automations assets must be on the S3 bucket. Upload them using aws-cli:

```bash
aws s3 cp ./aws-security-automations-assets s3://lambda-waf-demo-us-east-1/aws-waf-security-automations/v2.3.0 --recursive --acl bucket-owner-full-control
```

You can confirm the target path that needs to be used on the `SourceCode` mapping of the `aws-waf-security-automations.template` file:

```yml
SourceCode:
  General:
    S3Bucket: "lambda-waf-demo"
    KeyPrefix: "aws-waf-security-automations/v2.3.0"
```

### Step 4 - Deploy the stack

```bash
serverless deploy
```

# Testing

Because of the API Key requirement we set on our API we cannot invoke APIG directly, only through Cloudfront.

If you try it:

```bash
curl -G "https://rt97tm7x5d.execute-api.us-east-1.amazonaws.com/demo/hello" --data-urlencode "name=Rafael"
```

You should receive an error:

```json
{ "message": "Forbidden" }
```

But if you call it through CloudFront:

```bash
curl -G "https://dn032x3r6xgog.cloudfront.net/hello" --data-urlencode "name=Rafael"
```

You should receive a valid greeting:

```json
{ "message": "Hello Rafael" }
```

If you try a malicious request:

```bash
curl -G "https://dn032x3r6xgog.cloudfront.net/hello" --data-urlencode "name=<script>alert(1)</script>"
```

You should receive a HTTP 403 Request blocked error.

# Querying access logs using AWS Athena

Once the stack is set up you can execute various types of SQL queries on the WAF and CloudFront logs.

Execute a few different malicious requests and wait a few minutes for the logs to be delivered.

Access the AWS Athena console and execute the following query:

```sql
SELECT * from waf_access_logs where action = 'BLOCK'
```

You will see the details API requests that were blocked.

Check the AWS docs to see several useful queries that can be executed onthe access logs: https://docs.aws.amazon.com/athena/latest/ug/waf-logs.html

# Next Steps

As mentioned before, the goal of this project is to show from start to end ways of protecting and monitoring your serverless APIs.

There are several improvements that could be done based on this demo project, such as:

- Deploy the WAF into a separate stack and export it's ACL id to use with multiple APIs
- Setup a Glacier lifecycle for the logs S3 buckets to save on storage and Athena query costs
- Disable telemetry by setting `SendAnonymousUsageData` to `No` on `aws-waf-security-automations`
- Use chage sets for deployment
- Use a custom domain
- Associate a Regional WAF directly to APIG without the need of a CloudFront distribution
