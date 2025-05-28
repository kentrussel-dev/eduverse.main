# EduVerse Frontend

A modern React-based frontend for the EduVerse educational platform.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v7
- **State Management**: React Context API
- **Authentication**: OAuth 2.0 (Google Sign-in)
- **HTTP Client**: Axios
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── pages/             # Page components
├── services/          # API services
└── types/             # TypeScript type definitions
```

## Features

- 🔐 Secure authentication with both email/password and Google Sign-in
- 🛡️ Protected routes with authentication guards
- 🎨 Modern, responsive UI with Material-UI
- 🌐 Integration with RESTful backend API
- ⚡ Type-safe development with TypeScript

## Environment Variables and Secrets Management

The frontend uses environment variables for configuration. These should never be committed to the repository.

1. **Local Development**:
   - Create a `.env.local` file in the project root
   - Required variables:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```
   - Optional variables:
   ```
   REACT_APP_ENV=development
   REACT_APP_AUTH_COOKIE_NAME=eduverse_auth
   ```

2. **Production Deployment**:
   - Use deployment platform's environment configuration:
     - Vercel: Environment Variables section
     - Netlify: Environment Variables in site settings
     - Docker: Use environment files or Docker secrets
   - Never commit `.env` files
   - Use different values for each environment

3. **Template**:
   - A `.env.template` file is provided as reference
   - Copy to `.env.local` and update with your values
   - The `.gitignore` file excludes all `.env*` files except templates

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

3. Start the development server:
```bash
npm start
```

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
