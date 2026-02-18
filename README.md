# Firebase Studio - Spoton Music App

This is a Next.js application built with Firebase Studio.
## Our website https://spoton-web-lime.vercel.app/
https://energetic-purpose-142389.framer.app/
## Running Locally on Windows

To run this application on your local machine, you'll need to have [Node.js](https://nodejs.org/) installed. Then, follow these steps:

### 1. Download Your Project

Download the source code of your project as a ZIP file and extract it to a folder on your laptop.

### 2. Set Up Environment Variables

The application requires API keys to connect to services like Firebase and YouTube.

1.  **Create an environment file:** In the root folder of your project, create a new file named `.env`.
2.  **Add API Keys:** Copy the content from `.env.example` into your new `.env` file and fill in the required values. You will need to get a `YOUTUBE_API_KEY` from the Google Cloud Console.

### 3. Install Dependencies

Open a terminal or Command Prompt, navigate into your project's root folder, and run the following command to install all the necessary packages:

```bash
npm install
```

### 4. Run the Development Server

Once the installation is complete, you can start the local development server with this command:

```bash
npm run dev
```

This will start the application, and you'll see a message in the terminal indicating it's running, usually at `http://localhost:3000`.

### 5. Open in Your Browser

Open your web browser and navigate to `http://localhost:3000` to see your application running live on your laptop! Any changes you make to the code will now automatically reload in the browser.
