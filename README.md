# Hackathon Notifier Bot

This bot automatically scrapes hackathon listings from Devfolio, sends notifications to a WhatsApp group, and stores the information in a MongoDB database.

## Features

- Scrapes hackathon listings from Devfolio
- Sends notifications to a WhatsApp group
- Stores hackathon information in MongoDB
- Runs on a schedule to check for new hackathons regularly

## Technologies Used

- Node.js
- Express.js
- Axios
- Cheerio
- @whiskeysockets/baileys (for WhatsApp integration)
- MongoDB
- node-schedule

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/anshaneja5/hackathon-wa-bot.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   URI=your_mongodb_uri
   GROUP_ID=your_whatsapp_group_id
   ```

4. Run the bot:
   ```
   node server.js
   ```

## How It Works

1. The bot establishes a connection to WhatsApp using the Baileys library.
2. It connects to a MongoDB database to store hackathon information.
3. A scraping job is scheduled to run at regular intervals.
4. The bot scrapes hackathon listings from Devfolio.
5. For each new hackathon found:
   - A message is sent to the specified WhatsApp group.
   - The hackathon information is stored in the MongoDB database.
  
![image](https://github.com/user-attachments/assets/448d1666-5d6f-4336-91c7-9276fa05c1fe)


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- [Devfolio](https://devfolio.co/) for providing the hackathon listings.
- [Baileys](https://github.com/whiskeysockets/baileys) for the WhatsApp Web API.

## Contact

For any queries or suggestions, please open an issue on this repository.
