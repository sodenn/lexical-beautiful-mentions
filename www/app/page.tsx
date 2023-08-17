import Editor from "@/components/Editor";
import dynamic from "next/dynamic";

const ConfigurationProvider = dynamic(
  () => import("@/components/ConfigurationProvider"),
  {
    ssr: false,
  },
);

export default function Home() {
  return (
    <ConfigurationProvider>
      <Editor />
    </ConfigurationProvider>
  );
}
