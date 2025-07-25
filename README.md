# WhatsApp AI Chatbot for Restaurant Reservations

This project is a WhatsApp chatbot powered by AI to manage restaurant reservations.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- A MongoDB Atlas account
- A WhatsApp Business API account

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd Wp-GPTBot
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Environment Variables:**

    Create a file named `.env` in the root directory of the project (`Wp-GPTBot/.env`). Copy the content below into the file and add your specific credentials. The `.gitignore` file is configured to prevent this file from being committed to Git.

    ```env
    # WhatsApp Business API Configuration
    WHATSAPP_TOKEN=YOUR_WHATSAPP_TOKEN
    PHONE_NUMBER_ID=YOUR_WHATSAPP_PHONE_NUMBER_ID

    # MongoDB Connection
    MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING

    # Server Configuration
    PORT=3000
    ```

4.  **Start the server:**
    (This command will be available once the main server file is created)
    ```sh
    npm start
    ``` 