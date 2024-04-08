import { NextRequest, NextResponse } from 'next/server'

import { JobType } from '@/shared/helpers/v2/jobs'
import { removeImagesJob } from '@/shared/helpers/v2/jobs/removeImagesJob'
import { uploadImagesJob } from '@/shared/helpers/v2/jobs/uploadImagesJob'

interface TableInsert {
  type: 'INSERT'
  table: string
  record: {
    id: number
    created_at: string
    is_completed: boolean
    operation_name: JobType
  }

  schema: string
  old_record: null
}

export async function POST(_request: NextRequest) {
  const body: TableInsert = await _request.json()

  const { operation_name, id } = body.record

  switch (operation_name) {
    case 'remove_images':
      await removeImagesJob(id)
      break
    case 'upload_images':
      await uploadImagesJob(id)
      break
  }

  return NextResponse.json({ ok: true })
}
