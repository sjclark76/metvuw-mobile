import { NextApiRequest, NextApiResponse } from 'next'
import { SatelliteChartData } from './types/satelliteChartData'
import { s3download } from './helpers/s3Helper'
import { config } from '../../config'

const satellite = async (req: NextApiRequest, res: NextApiResponse) => {
  const satelliteImages: SatelliteChartData[] = await s3download({
    Bucket: config.bucketName,
    Key: 'satellite.json',
  })
  res.status(200).json(satelliteImages)
}

export default satellite
