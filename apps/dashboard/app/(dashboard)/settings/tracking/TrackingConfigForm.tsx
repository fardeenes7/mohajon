"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
    Field,
    FieldLabel,
    FieldDescription
} from "@repo/ui/components/ui/field";
import {
    IconBrandFacebook,
    IconBrandGoogle,
    IconBrandGoogleAnalytics,
    IconDeviceFloppy
} from "@tabler/icons-react";
import {
    trackingConfigSchema,
    type TrackingConfigFormValues
} from "../../products/_schemas/productSchema";
import { updateTrackingConfig } from "@/lib/api";
import type { ShopTrackingConfig } from "@repo/api";

interface TrackingConfigFormProps {
    shopId: string;
    initialData: ShopTrackingConfig;
}

export function TrackingConfigForm({
    shopId,
    initialData
}: TrackingConfigFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty }
    } = useForm<TrackingConfigFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: standardSchemaResolver(trackingConfigSchema) as any,
        defaultValues: {
            fb_pixel_id: initialData.fb_pixel_id ?? "",
            ga4_measurement_id: initialData.ga4_measurement_id ?? "",
            gtm_id: initialData.gtm_id ?? ""
        }
    });

    const onSubmit = async (data: unknown) => {
        const formData = data as TrackingConfigFormValues;
        const res = await updateTrackingConfig(shopId, formData);
        if (res.success) {
            toast.success("Tracking configuration saved.");
            startTransition(() => router.refresh());
        } else {
            toast.error(res.error);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid sm:grid-cols-2 md:grid-cols-3 gap-6"
        >
            {/* Facebook Pixel */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <IconBrandFacebook className="size-5 text-[#1877F2]" />
                        <CardTitle>Facebook Pixel</CardTitle>
                    </div>
                    <CardDescription>
                        Track conversions, optimize ads, and build audiences on
                        Facebook and Instagram.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Field data-invalid={!!errors.fb_pixel_id}>
                        <FieldLabel htmlFor="fb-pixel-id">Pixel ID</FieldLabel>
                        <Input
                            id="fb-pixel-id"
                            placeholder="e.g. 123456789012345"
                            aria-invalid={!!errors.fb_pixel_id}
                            {...register("fb_pixel_id")}
                        />
                        {errors.fb_pixel_id && (
                            <FieldDescription className="text-destructive">
                                {errors.fb_pixel_id.message}
                            </FieldDescription>
                        )}
                        <FieldDescription>
                            Find your Pixel ID in Facebook Events Manager.
                        </FieldDescription>
                    </Field>
                </CardContent>
            </Card>

            {/* Google Analytics 4 */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <IconBrandGoogleAnalytics className="size-5 text-[#E37400]" />
                        <CardTitle>Google Analytics 4</CardTitle>
                    </div>
                    <CardDescription>
                        Track website traffic, user behavior, and sales
                        attribution.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Field data-invalid={!!errors.ga4_measurement_id}>
                        <FieldLabel htmlFor="ga4-id">Measurement ID</FieldLabel>
                        <Input
                            id="ga4-id"
                            placeholder="G-XXXXXXXXXX"
                            aria-invalid={!!errors.ga4_measurement_id}
                            {...register("ga4_measurement_id")}
                        />
                        {errors.ga4_measurement_id && (
                            <FieldDescription className="text-destructive">
                                {errors.ga4_measurement_id.message}
                            </FieldDescription>
                        )}
                        <FieldDescription>
                            Found in Google Analytics → Admin → Data Streams.
                        </FieldDescription>
                    </Field>
                </CardContent>
            </Card>

            {/* Google Tag Manager */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <IconBrandGoogle className="size-5 text-[#4285F4]" />
                        <CardTitle>Google Tag Manager</CardTitle>
                    </div>
                    <CardDescription>
                        Manage all marketing tags from a single interface.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Field data-invalid={!!errors.gtm_id}>
                        <FieldLabel htmlFor="gtm-id">Container ID</FieldLabel>
                        <Input
                            id="gtm-id"
                            placeholder="GTM-XXXXXXX"
                            aria-invalid={!!errors.gtm_id}
                            {...register("gtm_id")}
                        />
                        {errors.gtm_id && (
                            <FieldDescription className="text-destructive">
                                {errors.gtm_id.message}
                            </FieldDescription>
                        )}
                        <FieldDescription>
                            Found in Google Tag Manager → Admin → Container
                            Settings.
                        </FieldDescription>
                    </Field>
                </CardContent>
            </Card>
            <div className="col-span-full flex items-center justify-end">
                <Button
                    id="save-tracking-btn"
                    type="submit"
                    disabled={!isDirty || isPending}
                    className="self-start"
                >
                    <IconDeviceFloppy data-icon="inline-start" />
                    Save Tracking Settings
                </Button>
            </div>
        </form>
    );
}
