// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  // Dos navegadores a la vez en local. Con el valor por defecto (la mitad de
  // los núcleos) la máquina se saturaba: el primer test de cada tanda
  // tardaba 1,5–2 min y caía por tiempo, y la batería entera iba a 24 min
  // con una docena de «flaky». Con 2, los mismos tests pasan todos y antes.
  workers: process.env.CI ? undefined : 2,
  reporter: "list",

  use: {
    baseURL: "http://localhost:5173",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Arranca el servidor de desarrollo antes de los tests y lo para al acabar.
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
