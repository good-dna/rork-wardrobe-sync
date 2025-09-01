module.exports = {
  extends: ['@expo/eslint-config'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@supabase/*'],
            message: 'Supabase imports are not allowed. Use the DataAPI abstraction layer instead.'
          }
        ]
      }
    ]
  }
};