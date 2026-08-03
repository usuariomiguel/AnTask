// Declaraciones para los imports con efecto de lado que no traen tipos.
//
// Los paquetes de @fontsource-variable solo exponen CSS y .woff2 — Vite los
// bundlea sin problema, pero TypeScript no encuentra tipos y desde TS 7 eso
// es error (TS2882) en los ficheros con `// @ts-check`.

declare module "@fontsource-variable/*";
