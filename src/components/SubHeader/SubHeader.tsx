import { useAtomValue } from 'jotai'
import { submenuTextAtom } from '@/components/Atoms/GlobalState'

export function SubHeader() {
  const submenuText = useAtomValue(submenuTextAtom)

  return (
    <div className="flex flex-row justify-center">
      <div className="px-2 filter  bg-gray-50 w-full ">
        <h1 className="text-center font-medium text-sm text-gray-800 my-4 ">
          {submenuText}
        </h1>
      </div>
    </div>
  )
}
