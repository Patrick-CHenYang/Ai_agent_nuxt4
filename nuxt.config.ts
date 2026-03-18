// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
      DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
      langGraphApiKey: process.env.LANGGRAPH_API_KEY,
      langGraphBaseUrl: process.env.LANGGRAPH_BASE_URL,
      langGraphModel: process.env.LANGGRAPH_MODEL
    }
  }
})