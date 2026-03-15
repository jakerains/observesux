// Reexport the native module. On web, it will be resolved to SunDaylightActivityModule.web.ts
// and on native platforms to SunDaylightActivityModule.ts
export { default } from './src/SunDaylightActivityModule';
export * from './src/SunDaylightActivity.types';
