import HeaderButtons from "@/components/dashboard/HeaderButtons"
import Layout from "@/components/Layout"

const MultiWallet = () => {
  return (
    <Layout headerRight={<HeaderButtons />}>
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="glass p-4 w-fit">
          <div className="flex items-center justify-between">
            <h1>Multiwallet</h1>
            <h1>Testing tailwind</h1>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MultiWallet