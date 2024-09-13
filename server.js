const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');
const { MongoClient } = require('mongodb');
const { DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const specialCharsRegex = /[\/|.:"\s-]/g;
const env = require('dotenv').config();

const express = require('express');
const app = express();
const port = 8000; 

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

let waSocket;

async function connectionLogic() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState("auth-info-baileys");
        waSocket = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            defaultQueryTimeoutMs:0,
            keepAliveIntervalMs: 10000,
            connectTimeoutMs:60000,
            syncFullHistory:true,
            markOnlineOnConnect:true,
            emitOwnEvents:true,
        });

        waSocket.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update || {};

            if (qr) {
                console.log(qr);
            }

            if (connection === "close") {
                const shouldReconnect =
                    lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

                if (shouldReconnect) {
                    await connectionLogic();
                }
            }
        });
        waSocket.ev.on("creds.update", saveCreds);

        //this is the code to find the groupid
        //     waSocket.ev.on("messages.upsert", (chatUpdate) => {
        //         msg = chatUpdate.messages[0]
        //         console.log(msg.key.remoteJid)
        // });
    } catch (error) {
        console.error('Error in connectionLogic:', error);
    }
}

// Function to send a WhatsApp message to a group
async function sendWhatsAppMessages(messages) {
    try {
        if (!waSocket) {
            console.log('Socket connection not established. Message not sent.');
            return;
        }
        const id = process.env.GROUP_ID; // WhatsApp group ID
        await waSocket.sendMessage(id, {text:messages});      
        console.log("WhatsApp messages sent successfully!");
    } catch (error) {
        console.log("Error sending WhatsApp messages:", error);
    }
}

// Function to insert a hackathon into the MongoDB collection
async function insertHackathon(client, hackathon) {
    try {
        const dbName = "hackathonsDB";
        const collectionName = "hackathons";
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        await collection.insertOne(hackathon);
        console.log("Hackathon inserted into MongoDB:", hackathon);
    } catch (error) {
        console.error("Error inserting hackathon into MongoDB:", error);
        throw error;
    }
}


async function connectToMongoDB() {
    const uri = process.env.URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

// Function to close MongoDB connection
async function closeMongoDBConnection(client) {
    try {
        await client.close();
        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Error closing MongoDB connection:", error);
        throw error;
    }
}

async function scrapeHackathons() {
    console.log("Scraping hackathon listings...");
    const url = "https://devfolio.co/hackathons";

    try {
        const response = await axios.get(url);

        if (response.status === 200) {
            const $ = cheerio.load(response.data);

            const hackathonDivs = $(".hackathons__StyledGrid-sc-b794cad7-0 .CompactHackathonCard__StyledCard-sc-4a10fa2a-0"); // Updated selector
            const client = await connectToMongoDB();

            const promises = hackathonDivs.map(async (index, hackathonDiv) => {
                try {
                    const title = $(hackathonDiv).find('h3').text().trim();
                    const theme = $(hackathonDiv).find('p:contains("Theme")').siblings().text().trim(); // Adjusted selector
                    const applyLink = $(hackathonDiv).find('a').attr('href');
                    const startDateText = $(hackathonDiv).find('p').filter((i, el) => $(el).text().startsWith('Starts')).text().trim();
                    const startDate = startDateText.replace('Starts ', '');

                    const messageBody = `🚀 New Hackathon Alert! 🚀 \n\n🏆 Title: ${title} \n🎨 Theme: ${theme} \n📅 Start Date: ${startDate} \n🔗 Apply Link: ${applyLink}\n\n 🤖 Brought to you by github.com/anshaneja5`;

                    console.log("messageBody", messageBody);
                    const existingHackathon = await client.db("hackathonsDB").collection("hackathons").findOne({ title, applyLink });
                    if (!existingHackathon) {
                        await sendWhatsAppMessages(messageBody);
                        await insertHackathon(client, { title, theme, applyLink, startDate });
                    }
                } catch (error) {
                    console.log("Error: Failed to extract hackathon details", error.message);
                }
            }).get(); // Convert to array of promises

            await Promise.all(promises); // Wait for all promises to complete
        } else {
            console.log("Error: Failed to fetch hackathon listings. Status code:", response.status);
        }
    } catch (error) {
        console.log("Error: Failed to fetch hackathon listings. Exception:", error.message);
    }
}



connectionLogic();

// Schedule the scrapeHackathons function to run every 3 hours
// schedule.scheduleJob('0 */3 * * *', scrapeHackathons);

// Schedule the scrapeHackathons function to run every 10 secs
schedule.scheduleJob('*/10 * * * * *', scrapeHackathons);