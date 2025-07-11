import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className='w-full min-h-[80vh] flex items-center justify-center'>
      <SignIn />
    </div>
  )
}