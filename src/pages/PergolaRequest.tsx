import { Layout } from "@/components/Layout";
import { useLocale } from "@/i18n/useLocale";
import { PergolaConfigurator } from "@/components/pergola/PergolaConfigurator";

const PergolaRequest = () => {
  const { t } = useLocale();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t("pergolaRequest.pageTitle")}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t("pergolaRequest.pageSubtitle")}
          </p>
        </div>

        <PergolaConfigurator />
      </div>
    </Layout>
  );
};

export default PergolaRequest;
