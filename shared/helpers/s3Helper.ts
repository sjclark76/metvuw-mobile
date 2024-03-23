import { config } from '../../config'

const { S3Client } = require('@aws-sdk/client-s3')
import { RainChartData } from '../../pages/api/types/rainChartData'
import { SatelliteChartData } from '../../pages/api/types/satelliteChartData'
import { RadarChartData } from '../../pages/api/types/radarChartData'
import {
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { PutObjectCommandInput } from '@aws-sdk/client-s3/dist-types/commands/PutObjectCommand'
import { UpperAirChartData } from '../../pages/api/types/upperAirChartData'

const { region, accessKey, secret } = config.s3

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secret,
  },
  signatureVersion: 'v4',
})

export const buildKeyName = (region: string) => `${region}.json`

export const s3upload = async (params: PutObjectCommandInput) => {
  const command = new PutObjectCommand(params)

  try {
    await s3Client.send(command)
  } catch (err) {
    console.error(err)
  }
}

export const s3download = async (params: GetObjectCommandInput) => {
  const command = new GetObjectCommand(params)

  try {
    const response = await s3Client.send(command)

    const file = await response.Body.transformToString()
    return JSON.parse(file)
  } catch (err) {
    console.error(err)
  }
}

export const downloadUpperAirChartData = (): Promise<UpperAirChartData[]> =>
  s3download({
    Bucket: config.s3.bucketName,
    Key: 'upperair.json',
  }) as Promise<UpperAirChartData[]>

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
