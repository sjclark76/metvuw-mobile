import { GetObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3'
import { config } from '../../../config'
import { S3 } from 'aws-sdk'
import { RainChartData } from '../types/rainChartData'

const { region: region1, accessKey, secret } = config.s3
const s3 = new S3({
  region: region1,
  accessKeyId: accessKey,
  secretAccessKey: secret,
  signatureVersion: 'v4',
})

export const buildKeyName = (region: string) => `${region}.json`

export const s3upload = function (params: PutObjectRequest) {
  return new Promise((resolve, reject) => {
    s3.createBucket(
      {
        Bucket: params.Bucket /* Put your bucket name */,
      },
      function () {
        s3.putObject(params, function (err, data) {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        })
      }
    )
  })
}

export const s3download = function (
  params: GetObjectRequest
): Promise<RainChartData[]> {
  return new Promise((resolve, reject) => {
    s3.createBucket(
      {
        Bucket: params.Bucket /* Put your bucket name */,
      },
      () => {
        s3.getObject(params, (err, data) => {
          if (err) {
            reject(err)
          } else {
            if (data.Body) {
              const file = Buffer.from(data.Body as ArrayBuffer).toString(
                'utf8'
              )

              resolve(JSON.parse(file))
            }
          }
        })
      }
    )
  })
}
