// 使用 any 类型避免 Next.js 15 的类型约束冲突
type SectionPageProps = any

export default function SectionPage({ params }: any) {
  return (
    <div className="bg-[#FCFAF7] min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Section Not Found</h1>
        <p className="text-gray-600">The requested section could not be found.</p>
      </div>
    </div>
  )
}
