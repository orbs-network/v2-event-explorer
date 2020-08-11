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

This should also launch the broser.

## Building the dashboard
To create a static version of the dashboard that can be deployed to any static web service (such as GithubPages), run:

`cd frontend && npm run build`

This will create a `build` folder under the `frontend` directory, with a static version of the dashboard.
