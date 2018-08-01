const aws = require('aws-sdk')
const awsConfig = require('./aws-config')
const s3 = new aws.S3(awsConfig)
const libasync = require('async')

/*
* Note that if you don't have permission to list objects, the callback won't raise any error
* but the content will be null
*/
// _path is a string containing a file path with the first member being the bucket
let ls = function(_path, done, level = 0) {
  let recurse = []
  let _list = (path, continuation, cb) => {
    if (typeof cb === 'undefined') {
      cb = continuation
      continuation = null
    }
    let parts = path.split(/\//)
    let bucket = parts.shift()
    let params = {
      Bucket: bucket,
      Prefix: parts.join('/'),
      MaxKeys: 1000,
      Delimiter: '/',
    }
    if (continuation !== null) {
      params.ContinuationToken = continuation
    }
    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        console.log(err)
        return cb(err)
      }
      if (data.CommonPrefixes && data.CommonPrefixes.length > 0) {
        let jobs = []
        data.CommonPrefixes.map((p) => p.Prefix).forEach((current) => {
          jobs.push((_cb) => {
            ls(`${ bucket }/${ current }`, (__, files) => {
              recurse.push(files)
              _cb(null, files)
            }, level + 1)
          })
        })
        libasync.parallel(jobs, (__, ff) => {
          cb(null, ff)
        })
      } else {
        let files = data.Contents.map((file) => file.Key)
        recurse.push(files)
        if (data.IsTruncated === true) {
          _list(path, data.NextContinuationToken, cb)
        } else {
          cb(null, files)
        }
      }
    })
  }
  _list(_path, () => {
    let r = recurse.reduce((a, b) => {
      return a.concat(b)
    }, [])
    let parts = _path.split(/\//)
    let bucket = parts.shift()
		if (level === 0) {
			r = r.map((e) => `${ bucket }/${ e }`)
		}
    done(null, r)
  })
}

if (require.main === module) {
	const fullS3Path = process.argv[2]
	ls(fullS3Path, (err, files) => {
		if (err) {
			return console.log(`warn:`, err)
		}
		console.log(files)
	})
}
