import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js';
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

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName}`);
		return;
	}
	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.log(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
	}
});


// Log in to Discord with your client's token
client.login(process.env.TOKEN);