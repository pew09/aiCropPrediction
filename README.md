# AI Crop Demand Predictor

This is a Next.js application that provides AI-powered crop analysis, price prediction, and demand forecasting for farmers in the Cotabato region. It uses a combination of machine learning models and a rule-based engine to deliver actionable insights through a user-friendly dashboard.

## Features

- **Crop Price Prediction**: Utilizes a linear regression model to forecast future crop prices.
- **Demand Level Forecasting**: Employs a Naive Bayes classifier to predict market demand levels.
- **AI-Powered Recommendations**: A rule-based engine provides strategic advice on when and where to sell crops.
- **Interactive Dashboard**: A clean, user-friendly interface for farmers to input their data and receive insights.
- **Chat Assistant**: An AI-powered chatbot to answer farming-related questions.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/): A running instance of PostgreSQL is required.

### 1. Clone the Repository

First, download the project from GitHub and navigate into the project directory.

```bash
git clone <your-github-repository-url>
cd ai-crop-demand-predictor
```
*(Replace `<your-github-repository-url>` with the actual URL of your GitHub repository).*

### 2. Install Dependencies

This command installs all the necessary libraries and frameworks the project uses (like Next.js, React, and Drizzle).

```bash
npm install
```

### 3. Set Up the Database

This project uses a PostgreSQL database.

-   Make sure you have PostgreSQL installed and running on your computer.
-   Create a new, empty database named `ai_crop_predictor`.

### 4. Configure Environment Variables

The application needs a database connection string to communicate with your new database.

-   In the project's root directory, create a new file named `.env.local`.
-   Add the following line to it, replacing `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password.








### 5. Run Database Migrations

This command reads the `src/db/schema.ts` file and automatically creates all the necessary tables (like `crops`, `regions`, etc.) in your database.

```bash
npx drizzle-kit push:pg
```

### 6. Seed the Database

This command runs the `scripts/seed.ts` file to fill your new database tables with the initial data for crops, regions, and prices.

```bash
npm run seed
```

### 7. Run the Application

You're all set! Start the local development server with this command:

```bash
npm run dev
```

You can now open your browser and navigate to `http://localhost:3000/farmer` to see the running application.
