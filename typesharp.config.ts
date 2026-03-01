import type { TypeSharpConfig } from 'typesharp';

const config: TypeSharpConfig = {
  projectFiles: [
    "C:/Users/User/Desktop/MyApp/Api/Api.csproj",
    "C:/Users/User/Desktop/MyApp/Domain/Domain.csproj"
  ],
  outputPath: "./app/types",
  targetAnnotation: "TypeSharp",
  singleOutputFile: false,
  namingConvention: "camel",
  fileSuffix: ""
};

export default config;
