# Agreement Center Client
**Agreement Center Client** is a TypeScript React application that people can use to sign agreements and view agreement statuses. Beastslash uses it to simplify the agreement signing process for its staff and partners.

## Testing
Agreement Center Client is ready for testing out of the box. Just install the dependencies then run `npm start` to get started.

For full functionality, run an [Agreement Center Server](https://github.com/Beastslash/agreement-center-server) development instance. The development API is set in the [development.env](./development.env) file, so feel free to change it if the development instance is somewhere else.

## Building
1. Install the app's dependencies (`npm i` or `npm ci`).
2. Configure `REACT_APP_AGREEMENT_CENTER_API` in the [production.env](./production.env) file to direct to your Agreement Center Server production instance.
3. Run `npm run build` to get the build files in the `dist` directory.