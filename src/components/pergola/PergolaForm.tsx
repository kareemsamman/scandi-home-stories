import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "@/i18n/useLocale";
import { usePergolaConfigurator } from "@/stores/usePergolaConfigurator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MountType, LightingType } from "@/types/pergola";

const schema = z.object({
  width: z.coerce.number().min(1000).max(15000),
  length: z.coerce.number().min(2000).max(10000),
  height: z.coerce.number().min(1500).max(5000).optional().or(z.literal("")),
  pergolaType: z.string().min(1),
  mountType: z.enum(["wall", "freestanding"]),
  installation: z.boolean(),
  lighting: z.enum(["none", "white", "rgb"]),
  santafRoofing: z.boolean(),
  frameColor: z.string(),
  roofColor: z.string(),
  notes: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().regex(/^[0-9\s\-\+\(\)]{7,15}$/),
  customerEmail: z.string().email().optional().or(z.literal("")),
});

export type PergolaFormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (values: PergolaFormValues) => void;
  isSubmitting: boolean;
}

export const PergolaForm = ({ onSubmit, isSubmitting }: Props) => {
  const { t } = useLocale();
  const setConfig = usePergolaConfigurator((s) => s.setConfig);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PergolaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      width: 4000,
      length: 4000,
      height: 2500,
      pergolaType: "bioclimatic",
      mountType: "wall",
      installation: false,
      lighting: "none",
      santafRoofing: false,
      frameColor: "#333333",
      roofColor: "#CCCCCC",
      notes: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
    },
  });

  // Sync form → Zustand store for live preview
  const watchAll = watch();
  useEffect(() => {
    setConfig({
      width: Number(watchAll.width) || 0,
      length: Number(watchAll.length) || 0,
      height: Number(watchAll.height) || 2500,
      mountType: watchAll.mountType as MountType,
      lighting: watchAll.lighting as LightingType,
      pergolaType: watchAll.pergolaType,
      installation: watchAll.installation,
      santafRoofing: watchAll.santafRoofing,
      frameColor: watchAll.frameColor,
      roofColor: watchAll.roofColor,
    });
  }, [
    watchAll.width, watchAll.length, watchAll.height,
    watchAll.mountType, watchAll.lighting, watchAll.pergolaType,
    watchAll.installation, watchAll.santafRoofing,
    watchAll.frameColor, watchAll.roofColor, setConfig,
  ]);

  const pergolaTypes = [
    { value: "bioclimatic", label: t("pergolaRequest.pergolaTypes.bioclimatic") },
    { value: "motorized", label: t("pergolaRequest.pergolaTypes.motorized") },
    { value: "fixed", label: t("pergolaRequest.pergolaTypes.fixed") },
    { value: "retractable", label: t("pergolaRequest.pergolaTypes.retractable") },
  ];

  const fieldError = (name: keyof PergolaFormValues) => {
    if (!errors[name]) return null;
    const msg = errors[name]?.message;
    if (msg) return msg;
    // Fallback messages from translations
    const map: Record<string, string> = {
      width: t("pergolaRequest.minWidth"),
      length: t("pergolaRequest.minLength"),
      customerName: t("pergolaRequest.required"),
      customerPhone: t("pergolaRequest.invalidPhone"),
    };
    return map[name] || t("pergolaRequest.required");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Dimensions */}
      <Section title={t("pergolaRequest.dimensions")}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("pergolaRequest.width")} error={fieldError("width")}>
            <Input type="number" {...register("width")} min={1000} max={15000} step={100} />
          </Field>
          <Field label={t("pergolaRequest.length")} error={fieldError("length")}>
            <Input type="number" {...register("length")} min={2000} max={10000} step={100} />
          </Field>
        </div>
        <Field label={t("pergolaRequest.height")} error={fieldError("height")}>
          <Input type="number" {...register("height")} min={1500} max={5000} step={100} placeholder="2500" />
        </Field>
      </Section>

      {/* Configuration */}
      <Section title={t("pergolaRequest.configuration")}>
        <Field label={t("pergolaRequest.pergolaType")}>
          <Select defaultValue="bioclimatic" onValueChange={(v) => setValue("pergolaType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {pergolaTypes.map((pt) => (
                <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("pergolaRequest.mountType")}>
          <RadioGroup defaultValue="wall" onValueChange={(v) => setValue("mountType", v as MountType)} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="wall" id="mount-wall" />
              <Label htmlFor="mount-wall">{t("pergolaRequest.mountWall")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="freestanding" id="mount-free" />
              <Label htmlFor="mount-free">{t("pergolaRequest.mountFreestanding")}</Label>
            </div>
          </RadioGroup>
        </Field>

        <div className="flex items-center justify-between py-2">
          <Label>{t("pergolaRequest.installation")}</Label>
          <Switch checked={watchAll.installation} onCheckedChange={(v) => setValue("installation", v)} />
        </div>

        <Field label={t("pergolaRequest.lighting")}>
          <RadioGroup defaultValue="none" onValueChange={(v) => setValue("lighting", v as LightingType)} className="flex gap-4">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="none" id="light-none" />
              <Label htmlFor="light-none">{t("pergolaRequest.lightingNone")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="white" id="light-white" />
              <Label htmlFor="light-white">{t("pergolaRequest.lightingWhite")}</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="rgb" id="light-rgb" />
              <Label htmlFor="light-rgb">{t("pergolaRequest.lightingRgb")}</Label>
            </div>
          </RadioGroup>
        </Field>

        <div className="flex items-center justify-between py-2">
          <Label>{t("pergolaRequest.santafRoofing")}</Label>
          <Switch checked={watchAll.santafRoofing} onCheckedChange={(v) => setValue("santafRoofing", v)} />
        </div>
      </Section>

      {/* Colors */}
      <Section title={t("pergolaRequest.colors")}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("pergolaRequest.frameColor")}>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                {...register("frameColor")}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <Input {...register("frameColor")} className="flex-1" />
            </div>
          </Field>
          <Field label={t("pergolaRequest.roofColor")}>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                {...register("roofColor")}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
              />
              <Input {...register("roofColor")} className="flex-1" />
            </div>
          </Field>
        </div>
      </Section>

      {/* Notes */}
      <Section title={t("pergolaRequest.notes")}>
        <Textarea
          {...register("notes")}
          placeholder={t("pergolaRequest.notesPlaceholder")}
          rows={3}
        />
      </Section>

      {/* Customer info */}
      <Section title={t("pergolaRequest.customerInfo")}>
        <Field label={t("pergolaRequest.customerName")} error={fieldError("customerName")}>
          <Input {...register("customerName")} />
        </Field>
        <Field label={t("pergolaRequest.customerPhone")} error={fieldError("customerPhone")}>
          <Input {...register("customerPhone")} type="tel" dir="ltr" />
        </Field>
        <Field label={t("pergolaRequest.customerEmail")} error={fieldError("customerEmail")}>
          <Input {...register("customerEmail")} type="email" dir="ltr" />
        </Field>
      </Section>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t("pergolaRequest.submitting") : t("pergolaRequest.submit")}
      </button>
    </form>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-gray-600">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
