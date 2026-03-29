import { useState } from "react";
import { useLocale } from "@/i18n/useLocale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Ruler, Layers } from "lucide-react";
import type { PergolaType } from "@/types/pergola";

interface Props {
  onStart: (widthCm: number, lengthCm: number, pergolaType: PergolaType) => void;
}

export const PergolaStartStep = ({ onStart }: Props) => {
  const { t } = useLocale();
  const [widthCm, setWidthCm] = useState(400);
  const [lengthCm, setLengthCm] = useState(400);
  const [pergolaType, setPergolaType] = useState<PergolaType>("fixed");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!widthCm || widthCm < 100 || widthCm > 1500) errs.width = t("pergolaRequest.minWidth");
    if (!lengthCm || lengthCm < 200 || lengthCm > 1000) errs.length = t("pergolaRequest.minLength");
    return errs;
  };

  const handleStart = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onStart(widthCm, lengthCm, pergolaType);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-gray-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("pergolaRequest.pageTitle")}
        </h1>
        <p className="text-gray-500">
          {t("pergolaRequest.startSubtitle")}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-gray-400" />
              {t("pergolaRequest.width")}
            </Label>
            <Input
              type="number"
              value={widthCm}
              onChange={(e) => { setWidthCm(Number(e.target.value)); setErrors({}); }}
              min={100}
              max={1500}
              step={10}
              className="text-lg h-12"
            />
            {errors.width && <p className="text-xs text-red-500">{errors.width}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-gray-400" />
              {t("pergolaRequest.length")}
            </Label>
            <Input
              type="number"
              value={lengthCm}
              onChange={(e) => { setLengthCm(Number(e.target.value)); setErrors({}); }}
              min={200}
              max={1000}
              step={10}
              className="text-lg h-12"
            />
            {errors.length && <p className="text-xs text-red-500">{errors.length}</p>}
          </div>
        </div>

        {/* Pergola type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">{t("pergolaRequest.pergolaType")}</Label>
          <div className="grid grid-cols-2 gap-3">
            {(["fixed", "pvc"] as const).map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setPergolaType(pt)}
                className={`p-5 rounded-xl border-2 text-center transition-all ${
                  pergolaType === pt
                    ? "border-gray-900 bg-gray-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="text-2xl mb-2">{pt === "fixed" ? "🏗️" : "🎪"}</div>
                <span className="text-sm font-semibold text-gray-800">
                  {t(`pergolaRequest.pergolaTypes.${pt}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {t("pergolaRequest.startEditor")}
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
};
