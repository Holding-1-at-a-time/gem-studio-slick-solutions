
// eslint-disable-next-line import/no-anonymous-default-export
export default {
    providers: [
      {
        domain: process.env.REACT_APP_CLERK_JWT_ISSUER_DOMAIN,
        applicationID: "convex",
      },
    ]
  };
