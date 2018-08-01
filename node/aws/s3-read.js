const aws = require('aws-sdk')
const awsConfig = require('./aws-config')
const s3 = new aws.S3(awsConfig)
const byline = require('byline')

// _path is a string containing a file path with the first member being the bucket
let readByLine = function(path, lineCallback, done) {
	let parts = path.split(/\//)
	let bucket = parts.shift()
	let params = {
		Bucket: bucket,
		Key: parts.join('/'),
	}
	byline(s3.getObject(params).createReadStream())
		.on('data', (line) => {
			lineCallback(line)
		})
		.on('end', () => {
			done(null)
		})
}

// _path is a string containing a file path with the first member being the bucket
let read = function(path, done) {
	let parts = path.split(/\//)
	let bucket = parts.shift()
	let params = {
		Bucket: bucket,
		Key: parts.join('/'),
	}
	s3.getObject(params, (err, data) => {
		if (err) {
			return done(err)
		}
		done(null, data.Body.toString('utf8'))
	})
}

if (require.main === module) {
	const fullS3Path = process.argv[2]
	readByLine(fullS3Path, (line) => {
		console.log(`line ${ line }`)
	}, (err) => {
		if (err) {
			return console.log(`warn:`, err)
		}
	})
	read(fullS3Path, (err, content) => {
		if (err) {
			return console.log(`warn:`, err)
		}
		console.log(content)
	})
}
