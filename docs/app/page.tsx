import ConfigurationProvider from "@/components/ConfigurationProvider";
import Editor from "@/components/Editor";

export default function Home() {
  return (
    <ConfigurationProvider>
      <Editor />
    </ConfigurationProvider>
  );
}
