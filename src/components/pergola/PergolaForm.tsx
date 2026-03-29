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
import {
  STANDARD_COLORS, SANTAF_COLORS, LIGHTING_TEMPS,
  type MountType, type LightingChoice, type SpacingMode, type PergolaType, type SantafChoice,
  type LightingPosition, type LightingFixture,
} from "@/types/pergola";

const schema = z.object({
  widthCm: z.coerce.number().min(100).max(1500),
  lengthCm: z.coerce.number().min(200).max(1000),
  heightCm: z.coerce.number().min(150).max(500).optional().or(z.literal(0)),
  pergolaType: z.enum(["fixed", "pvc"]),
  mountType: z.enum(["wall", "freestanding"]),
  installation: z.boolean(),
  lighting: z.enum(["none", "white", "rgb"]),
  lightingPosition: z.enum(["none", "all_posts", "selected_posts", "no_posts"]),
  lightingFixture: z.enum(["none", "spotlight", "led_strip", "rgb_strip", "mixed"]),
  lightingRoof: z.boolean(),
  santaf: z.enum(["without", "with"]),
  santafColor: z.string(),
  frameColor: z.string().min(1),
  roofColor: z.string().min(1),
  spacingMode: z.enum(["automatic", "dense", "standard", "wide"]),
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
  const { t, locale } = useLocale();
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
      widthCm: 400,
      lengthCm: 400,
      heightCm: 250,
      pergolaType: "fixed",
      mountType: "wall",
      installation: false,
      lighting: "none",
      lightingPosition: "none",
      lightingFixture: "none",
      lightingRoof: false,
      santaf: "without",
      santafColor: "",
      frameColor: "#383838",
      roofColor: "#C0C0C0",
      spacingMode: "automatic",
      notes: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
    },
  });

  const w = watch();

  // Sync form → Zustand store for live preview
  useEffect(() => {
    setConfig({
      widthCm: Number(w.widthCm) || 0,
      lengthCm: Number(w.lengthCm) || 0,
      heightCm: Number(w.heightCm) || 250,
      mountType: w.mountType as MountType,
      lighting: w.lighting as LightingChoice,
      lightingPosition: w.lightingPosition as LightingPosition,
      lightingFixture: w.lightingFixture as LightingFixture,
      lightingRoof: w.lightingRoof,
      pergolaType: w.pergolaType as PergolaType,
      santaf: w.santaf as SantafChoice,
      santafColor: w.santafColor,
      frameColor: w.frameColor,
      roofColor: w.roofColor,
      spacingMode: w.spacingMode as SpacingMode,
      installation: w.installation,
    });
  }, [
    w.widthCm, w.lengthCm, w.heightCm, w.mountType, w.lighting,
    w.lightingPosition, w.lightingFixture, w.lightingRoof,
    w.pergolaType, w.santaf, w.santafColor,
    w.frameColor, w.roofColor, w.spacingMode, w.installation, setConfig,
  ]);

  const showLightingDetails = w.lighting !== "none";
  const showSantafColor = w.santaf === "with";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ── Dimensions (cm) ── */}
      <Section title={t("pergolaRequest.dimensions")} icon="📐">
        <div className="grid grid-cols-3 gap-4">
          <Field label={t("pergolaRequest.width")} error={fieldErr(errors.widthCm, t)}>
            <Input type="number" {...register("widthCm")} min={100} max={1500} step={10} />
          </Field>
          <Field label={t("pergolaRequest.length")} error={fieldErr(errors.lengthCm, t)}>
            <Input type="number" {...register("lengthCm")} min={200} max={1000} step={10} />
          </Field>
          <Field label={t("pergolaRequest.height")} error={fieldErr(errors.heightCm, t)}>
            <Input type="number" {...register("heightCm")} min={150} max={500} step={10} placeholder="250" />
          </Field>
        </div>
      </Section>

      {/* ── Pergola Type ── */}
      <Section title={t("pergolaRequest.pergolaType")} icon="🏗️">
        <RadioGroup
          defaultValue="fixed"
          onValueChange={(v) => setValue("pergolaType", v as PergolaType)}
          className="grid grid-cols-2 gap-3"
        >
          {(["fixed", "pvc"] as const).map((pt) => (
            <label
              key={pt}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                w.pergolaType === pt
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <RadioGroupItem value={pt} id={`pt-${pt}`} />
              <span className="font-medium text-sm">{t(`pergolaRequest.pergolaTypes.${pt}`)}</span>
            </label>
          ))}
        </RadioGroup>
      </Section>

      {/* ── Mount Type ── */}
      <Section title={t("pergolaRequest.mountType")} icon="🔩">
        <RadioGroup
          defaultValue="wall"
          onValueChange={(v) => setValue("mountType", v as MountType)}
          className="grid grid-cols-2 gap-3"
        >
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${w.mountType === "wall" ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"}`}>
            <RadioGroupItem value="wall" id="mount-wall" />
            <span className="font-medium text-sm">{t("pergolaRequest.mountWall")}</span>
          </label>
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${w.mountType === "freestanding" ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"}`}>
            <RadioGroupItem value="freestanding" id="mount-free" />
            <span className="font-medium text-sm">{t("pergolaRequest.mountFreestanding")}</span>
          </label>
        </RadioGroup>

        <div className="flex items-center justify-between py-3 px-1">
          <Label className="text-sm">{t("pergolaRequest.installation")}</Label>
          <Switch checked={w.installation} onCheckedChange={(v) => setValue("installation", v)} />
        </div>
      </Section>

      {/* ── Lighting ── */}
      <Section title={t("pergolaRequest.lighting")} icon="💡">
        <RadioGroup
          defaultValue="none"
          onValueChange={(v) => {
            setValue("lighting", v as LightingChoice);
            if (v === "none") {
              setValue("lightingPosition", "none");
              setValue("lightingFixture", "none");
              setValue("lightingRoof", false);
            } else {
              setValue("lightingPosition", "all_posts");
              setValue("lightingFixture", "led_strip");
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {([{ id: "none" as const, color: "bg-gray-300", label: t("pergolaRequest.lightingNone") }, ...LIGHTING_TEMPS.map(lt => ({ id: lt.id, color: "", label: `${lt.label} ${locale === "ar" ? lt.name_ar : lt.name_he}` }))]).map((lt) => (
            <label
              key={lt.id}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-center justify-center ${
                w.lighting === lt.id
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <RadioGroupItem value={lt.id} id={`lt-${lt.id}`} className="sr-only" />
              <span className="w-3 h-3 rounded-full shrink-0 border border-gray-200" style={{ backgroundColor: lt.id === "none" ? "#d1d5db" : LIGHTING_TEMPS.find(t => t.id === lt.id)?.color || "#d1d5db" }} />
              <span className="text-sm font-medium">{lt.label}</span>
            </label>
          ))}
        </RadioGroup>

        {showLightingDetails && (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-xl">
            <Field label={t("pergolaRequest.lightingPosition")}>
              <Select value={w.lightingPosition} onValueChange={(v) => setValue("lightingPosition", v as LightingPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_posts">{t("pergolaRequest.lightingAllPosts")}</SelectItem>
                  <SelectItem value="selected_posts">{t("pergolaRequest.lightingSelectedPosts")}</SelectItem>
                  <SelectItem value="no_posts">{t("pergolaRequest.lightingNoPosts")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("pergolaRequest.lightingFixture")}>
              <Select value={w.lightingFixture} onValueChange={(v) => setValue("lightingFixture", v as LightingFixture)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="spotlight">{t("pergolaRequest.fixtureSpotlight")}</SelectItem>
                  <SelectItem value="led_strip">{t("pergolaRequest.fixtureLedStrip")}</SelectItem>
                  <SelectItem value="rgb_strip">{t("pergolaRequest.fixtureRgbStrip")}</SelectItem>
                  <SelectItem value="mixed">{t("pergolaRequest.fixtureMixed")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t("pergolaRequest.lightingRoof")}</Label>
              <Switch checked={w.lightingRoof} onCheckedChange={(v) => setValue("lightingRoof", v)} />
            </div>
          </div>
        )}
      </Section>

      {/* ── Roofing / סנטף ── */}
      <Section title={t("pergolaRequest.santafRoofing")} icon="🏠">
        <RadioGroup
          defaultValue="without"
          onValueChange={(v) => {
            setValue("santaf", v as SantafChoice);
            if (v === "without") setValue("santafColor", "");
          }}
          className="grid grid-cols-2 gap-3"
        >
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${w.santaf === "without" ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"}`}>
            <RadioGroupItem value="without" id="santaf-no" />
            <span className="text-sm font-medium">{t("pergolaRequest.santafWithout")}</span>
          </label>
          <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${w.santaf === "with" ? "border-gray-900 bg-gray-50" : "border-gray-100 hover:border-gray-200"}`}>
            <RadioGroupItem value="with" id="santaf-yes" />
            <span className="text-sm font-medium">{t("pergolaRequest.santafWith")}</span>
          </label>
        </RadioGroup>

        {showSantafColor && (
          <div className="mt-4">
            <Label className="text-sm text-gray-600 mb-2 block">{t("pergolaRequest.santafColorLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {SANTAF_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue("santafColor", c.hex)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    w.santafColor === c.hex ? "border-gray-900 scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={locale === "ar" ? c.name_ar : c.name_he}
                />
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── Colors ── */}
      <Section title={t("pergolaRequest.colors")} icon="🎨">
        <div className="space-y-5">
          <div>
            <Label className="text-sm text-gray-600 mb-2 block">{t("pergolaRequest.frameColor")}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {STANDARD_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue("frameColor", c.hex)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${
                    w.frameColor === c.hex ? "border-gray-900 scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={locale === "ar" ? c.name_ar : c.name_he}
                />
              ))}
            </div>
            <Input {...register("frameColor")} className="w-40 text-xs" dir="ltr" />
          </div>

          <div>
            <Label className="text-sm text-gray-600 mb-2 block">{t("pergolaRequest.roofColor")}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {STANDARD_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue("roofColor", c.hex)}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${
                    w.roofColor === c.hex ? "border-gray-900 scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={locale === "ar" ? c.name_ar : c.name_he}
                />
              ))}
            </div>
            <Input {...register("roofColor")} className="w-40 text-xs" dir="ltr" />
          </div>
        </div>
      </Section>

      {/* ── Spacing ── */}
      <Section title={t("pergolaRequest.spacing")} icon="↔️">
        <RadioGroup
          defaultValue="automatic"
          onValueChange={(v) => setValue("spacingMode", v as SpacingMode)}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {(["automatic", "dense", "standard", "wide"] as const).map((sm) => (
            <label
              key={sm}
              className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                w.spacingMode === sm
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <RadioGroupItem value={sm} className="sr-only" />
              <span className="text-xs font-medium">{t(`pergolaRequest.spacing${sm.charAt(0).toUpperCase() + sm.slice(1)}`)}</span>
            </label>
          ))}
        </RadioGroup>
      </Section>

      {/* ── Notes ── */}
      <Section title={t("pergolaRequest.notes")} icon="📝">
        <Textarea
          {...register("notes")}
          placeholder={t("pergolaRequest.notesPlaceholder")}
          rows={3}
        />
      </Section>

      {/* ── Customer Info ── */}
      <Section title={t("pergolaRequest.customerInfo")} icon="👤">
        <div className="space-y-3">
          <Field label={t("pergolaRequest.customerName")} error={fieldErr(errors.customerName, t)}>
            <Input {...register("customerName")} />
          </Field>
          <Field label={t("pergolaRequest.customerPhone")} error={fieldErr(errors.customerPhone, t)}>
            <Input {...register("customerPhone")} type="tel" dir="ltr" />
          </Field>
          <Field label={t("pergolaRequest.customerEmail")} error={fieldErr(errors.customerEmail, t)}>
            <Input {...register("customerEmail")} type="email" dir="ltr" />
          </Field>
        </div>
      </Section>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isSubmitting ? t("pergolaRequest.submitting") : t("pergolaRequest.submit")}
      </button>
    </form>
  );
};

// ── Helpers ──

function Section({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h3>
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

function fieldErr(err: any, t: (k: string) => any): string | null {
  if (!err) return null;
  return err.message || t("pergolaRequest.required");
}
