import { Layout } from "@/components/Layout";
import { PergolaConfigurator } from "@/components/pergola/PergolaConfigurator";

const PergolaRequest = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <PergolaConfigurator />
      </div>
    </Layout>
  );
};

export default PergolaRequest;
