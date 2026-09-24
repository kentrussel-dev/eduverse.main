# EduVerse Frontend

A modern React-based frontend for the EduVerse educational platform.

🖥️ **Backend Repository**: [eduverse.server](https://github.com/kentrussel-dev/eduverse.server)

This is the frontend application component. For the ASP.NET Core backend service, please visit the backend repository.

## Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v7
- **State Management**: React Context API
- **Authentication**: OAuth 2.0 (Google Sign-in)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Virtual world**: PixiJS 7 (2D isometric rendering) + SignalR (real-time)

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── pages/             # Page components
├── services/          # API services
├── types/             # TypeScript type definitions
└── world/             # Virtual world: renderer, server connection, game UI
```

## Virtual World (`/world`)

A Habbo-style isometric world where students and teachers walk around as avatars, chat, decorate their own rooms and hold classes.
It connects to the server's SignalR hub (`/hubs/world`, next to `REACT_APP_API_URL`) using the JWT saved at login.

- `src/pages/World.tsx`: the page (navigator, chat, people, host tools, action bar)
- `src/world/useWorld.ts`: connection and room state
- `src/world/RoomScene.ts`: PixiJS scene (floor, walls, furniture, walking, chat bubbles, emotes, build mode, camera)
- `src/world/avatar.ts`, `src/world/furni.ts`, `src/world/iso.ts`: drawing code; everything is drawn with shapes, so there are no image assets yet
- `src/world/worldClient.ts`: typed wrapper for the hub methods
- `src/world/ui/`: character creator, shop, build panel, room settings, create-room dialog
- `src/world/thumbnails.ts`: renders furniture and avatar pictures for the shop and menus

How to play:

- Click the floor to walk and click a chair, sofa or beanbag to sit. The action bar has dance, wave, sit and emoji reactions.
- Click a person to whisper to them or report them. Room hosts can also mute or kick, and owners can ban.
- 👕 Character: hair styles, tops, bottoms, hats and colors. Locked items are bought in the 🛍️ shop with coins (daily coins are free).
- 🧱 Build mode (in rooms you own): pick furniture from your inventory, rotate it, click the floor to place it; click placed furniture to rotate or pick it up.
- ⚙️ Room settings (owners): name, who can find it, max visitors, banned list, delete.
- Navigator: Public / Popular / My rooms tabs, search, and join by room code. Teachers can create classrooms and share the code.

Browser tests can build with `REACT_APP_E2E=true` to expose `window.eduverseScene` for clicking exact tiles.

## Features

- 🔐 Secure authentication with both email/password and Google Sign-in
- 🛡️ Protected routes with authentication guards
- 🎨 Modern, responsive UI with Material-UI
- 🌐 Integration with RESTful backend API
- ⚡ Type-safe development with TypeScript
- 🏫 Virtual world with rooms, avatars, chat and classrooms

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
