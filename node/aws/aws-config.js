const aws = require('aws-sdk')

const region = process.env.DEPLOY_REGION || 'eu-west-1'

aws.config.update({region})
const awsConfig = {}
if (process.env.AWS_ACCESS_KEY_ID) { // on ec2 no need of env vars the role is attched to the ec2 instance
  awsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  }
}

module.exports = awsConfig
