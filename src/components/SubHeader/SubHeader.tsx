import { useAtomValue } from 'jotai'
import { submenuTextAtom } from '@/components/Atoms/GlobalState'

export function SubHeader() {
  const submenuText = useAtomValue(submenuTextAtom)

  return (
    <div className="flex flex-row justify-center">
      <div className="w-full bg-gray-50  px-2 filter ">
        <h1 className="my-4 text-center text-sm font-medium text-gray-800 ">
          {submenuText}
        </h1>
      </div>
    </div>
  )
}
