import { ConfigurationProviderWrapper } from "@/components/ConfigurationProviderWrapper";
import Editor from "@/components/Editor";

export default function Home() {
  return (
    <ConfigurationProviderWrapper>
      <Editor />
    </ConfigurationProviderWrapper>
  );
}
