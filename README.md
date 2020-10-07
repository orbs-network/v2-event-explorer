# Orbs v2 Event Explorer
An event collector and dashboard for Orbs v2 Ethereum contracts.

This is a community project, if you see bugs or desire new features, feel free to contribute.

## Running locally
1. Build the project:

`npm run build`

2. Run the collector backend:

`npm run start-backend`

3. Start the dashboard server - a create-react-app project:

`npm run start-frontend`

This should also launch the browser.

## Building the dashboard
To create a static version of the dashboard that can be deployed to any static web service (such as GithubPages), run:

```
export REACT_APP_API_URL=<The collector API endpoint - e.g. https://orbsv2-event-explorer.herokuapp.com/api>
export PUBLIC_URL=<The base url for the dashbaord, e.g. https://orbs-network.github.io/v2-event-dashbaord>
cd frontend && npm run build
```

This will create a `build` folder under the `frontend` directory, with a static version of the dashboard.
