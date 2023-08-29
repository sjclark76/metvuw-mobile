import { GetObjectRequest, PutObjectRequest } from 'aws-sdk/clients/s3'
import { config } from '../../../config'
import { S3 } from 'aws-sdk'
import { RainChartData } from '../types/rainChartData'
import { SatelliteChartData } from '../types/satelliteChartData'
import { RadarChartData } from '../types/radarChartData'

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
      },
    )
  })
}

const s3download = function (params: GetObjectRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    s3.createBucket(
      {
        Bucket: params.Bucket /* Put your bucket name */,
      },
      () => {
        s3.getObject(params, (err, data) => {
          if (err) {
            console.log(
              'an error occured performing s3 download',
              {
                region: region1,
                accessKeyId: accessKey,
                secretAccessKey: secret,
                signatureVersion: 'v4',
              },
              err,
            )
            reject(err)
          } else {
            if (data.Body) {
              const file = Buffer.from(data.Body as ArrayBuffer).toString(
                'utf8',
              )

              resolve(JSON.parse(file))
            }
          }
        })
      },
    )
  })
}

export const downloadRadarChartData = (): Promise<RadarChartData[]> =>
  s3download({
    Bucket: config.s3.bucketName,
    Key: 'radar.json',
  }) as Promise<RadarChartData[]>

export const downloadSatelliteChartData = (): Promise<SatelliteChartData[]> =>
  s3download({
    Bucket: config.s3.bucketName,
    Key: 'satellite.json',
  }) as Promise<SatelliteChartData[]>

export const downloadRainChartData = (
  regionName: string,
): Promise<RainChartData[]> =>
  s3download({
    Bucket: config.s3.bucketName,
    Key: buildKeyName(regionName),
  }) as Promise<RainChartData[]>
