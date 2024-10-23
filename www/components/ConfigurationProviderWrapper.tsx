"use client";
import dynamic from "next/dynamic";
import { PropsWithChildren, Suspense } from "react";

const LazyConfigurationProvider = dynamic(
  () => import("@/components/ConfigurationProvider"),
  {
    ssr: false,
  },
);

export function ConfigurationProviderWrapper({ children }: PropsWithChildren) {
  return (
    <Suspense>
      <LazyConfigurationProvider>{children}</LazyConfigurationProvider>
    </Suspense>
  );
}
