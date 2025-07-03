# M33T | Web3 Event Platform

In the Web3 market, there is a noticeable lack of events and platforms dedicated to fostering community engagement and interaction. This project was conceived to address this market gap by providing a seamless and innovative solution for event creation and management, specifically tailored for the Web3 ecosystem. By integrating blockchain technology and digital wallets, the platform offers a unique value proposition for users and businesses looking to host or participate in decentralized events.

### Key Benefits

1. **Market Differentiation**:
   - A pioneering platform in the Web3 space, addressing the scarcity of event-focused solutions.
   - Combines the power of blockchain with user-friendly interfaces to attract both tech-savvy and non-technical users.

2. **Enhanced User Experience**:
   - Simplifies the process of creating and managing events with intuitive tools.
   - Provides secure and transparent transactions through blockchain integration.

3. **Business Opportunities**:
   - Enables businesses to connect with a growing Web3 audience.
   - Offers sponsorship and partnership opportunities within the decentralized ecosystem.

## Project Structure

Below is an overview of the main folders and files in the project:

### interface-layer/
This folder contains the user interface layer, built with **Next.js** and **Tailwind CSS**. Key components include:

- **app/**: Pages and routes of the application, such as:
  - `api/`: API routes for authentication and blockchain interactions (e.g., `auth/wallet-signin`, `solana/create-transaction`).
  - `event-creation/`: Page for creating events.
  - `register/`: User registration page.
- **components/**: Reusable components like forms, event cards, and layouts.
  - **ui/**: A library of UI components such as buttons, inputs, modals, etc.
- **contexts/**: Global contexts, such as `wallet-context` for managing digital wallet states.
- **hooks/**: Custom hooks like `use-mobile` and `use-toast`.
- **lib/**: Utility functions, including Solana integration and wallet session management.
- **styles/**: Global style files.
- **types/**: TypeScript definitions, such as the `event` type.

## Technologies Used

- **Next.js**: React framework for server-side rendering and static site generation.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **TypeScript**: JavaScript superset that adds static typing.
- **Solana**: Blockchain used for transactions and digital wallet creation.

## Core Features

1. **Event Creation and Management**:
   - Intuitive forms for creating personalized events.
   - Interactive cards to display event details.

2. **Blockchain Integration**:
   - Authentication via digital wallets.
   - Transaction creation on the Solana blockchain.

3. **Reusable Components**:
   - A comprehensive UI library for building consistent interfaces quickly.

## How to Run the Project

1. Clone the repository:
   ```bash
   git clone <REPOSITORY_URL>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at `http://localhost:3000`.
