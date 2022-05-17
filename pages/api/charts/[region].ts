import { NextApiRequest, NextApiResponse } from 'next'
import { config } from '../../../config'
import { buildKeyName, s3download } from '../helpers/s3Helper'

const regionDataApi = async (req: NextApiRequest, res: NextApiResponse) => {
  let region = req.query['region']

  if (!region) region = 'nz'

  const regionName = Array.isArray(region) ? region[0] : region

  const chartData = await s3download({
    Bucket: config.bucketName,
    Key: buildKeyName(regionName),
  })

  res.status(200).json(chartData)
}

export default regionDataApi
