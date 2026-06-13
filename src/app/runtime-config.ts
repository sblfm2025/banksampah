const appEnvironment =
  import.meta.env.VITE_APP_ENV ||
  (import.meta.env.PROD ? 'production' : 'development');

export const useDemoData = import.meta.env.VITE_USE_DEMO_DATA !== 'false';
export const isProductionLike =
  import.meta.env.PROD ||
  appEnvironment === 'production' ||
  appEnvironment === 'staging';

if (isProductionLike && useDemoData) {
  throw new Error(
    'Production/staging tidak boleh berjalan dengan mode demo. Set VITE_USE_DEMO_DATA=false.',
  );
}
