/// <reference types="vite/client" />
/// <reference types="./types/svg.d.ts" />

declare module "*.apk" {
    const content: string;
    export default content;
}
