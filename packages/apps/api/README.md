# @komenci/api

This package holds the public api that Valora interacts with to orchestrate onboarding.

## Running and development

See installation and running notes in the top-level readme.

### reCAPTCHA Testing

You may bypass the reCAPTCHA check by setting the following env variables:

```bash
export RULE_CAPTCHA_CONFIG_BYPASS_ENABLED=true
export RULE_CAPTCHA_CONFIG_BYPASS_TOKEN=special-captcha-bypass-token
```

This will allow you to pass in `special-captcha-bypass-token` as a successful reCAPTCHA solution.

You may also want to test the reCAPTCHA end-to-end. You can easily do so by [running the onboarding service](#running) locally and navigating to `http://localhost:3000/recaptcha-test.html`. This will produce a token which you may use to manually test the service. Note that the expiry of a token is two minutes. Both client-side site keys can be found [in the html](./apps/onboarding/public/recaptcha-test.html) and can be swapped manually depending on which environment you'd like to get a token for.

### Database migration

In order to create the tables in the database that has the structure of our Session we should run the following command: 

```yarn run typeorm:cli schema:sync```

The entities that we are going to update are in the file migration.config.json. If for any reason a migration is needed (ex. some field in the database changed) we should run the following command:

``` yarn run typeorm:cli migration:run ```

More detailed documentation about the process can be found in the following [link](https://typeorm.io/#/migrations/creating-a-new-migration).