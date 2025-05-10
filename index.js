import { Client, Collection, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

// config dotenv
dotenv.config();


// filePath
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create a new client Licence
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const folderPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(folderPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(folderPath, folder);
	const commandsFile = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandsFile) {
		const filePath = path.join(commandsPath, file);
		const command = await import (pathToFileURL(filePath));
		// Set a new item in the Collection with the key as the command name and the value as the exported module

		if ('data' in command.default && 'execute' in command.default) {
			client.commands.set(command.default.data.name, command.default);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = await import(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
// Log in to Discord with your client's token
client.login(process.env.TOKEN);