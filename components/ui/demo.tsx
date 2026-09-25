import { ShaderBackground } from "@/components/ui/red-in-black"

export default function ShaderBackgroundDemo() {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#1B2A4A]">
      <ShaderBackground className="absolute inset-0 h-full w-full" />
    </div>
  )
}
