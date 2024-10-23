import ConfigurationProvider from "@/components/ConfigurationProvider";
import Editor from "@/components/Editor";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense>
      <ConfigurationProvider>
        <Editor />
      </ConfigurationProvider>
    </Suspense>
  );
}
