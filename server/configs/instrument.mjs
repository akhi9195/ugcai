import * as Sentry from "@sentry/node";
//const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://6caeb53126f65403d64ff81428108806@o4512010677387265.ingest.de.sentry.io/4512010687479888",
  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
    sendDefaultPii: true,
  },
});
