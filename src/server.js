/**
 * The core server that runs on a Cloudflare worker.
 */

import { Router } from 'itty-router';
import { verify } from './verify.js';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { InteractionResponseFlags } from 'discord-interactions';

class JsonResponse extends Response {
  constructor(body, init) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

async function addGuildMemberRole(guildId, userId, roleId, token) {
  const url = `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`;
  console.log('addGuildMemberRole', url);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      access_token: token,
    }),
  });
  if (!response.ok) {
    console.error(response.status, await response.json());
    throw new Error('Error adding role to user');
  }
}

const router = Router();

/**
 * A simple :wave: hello page to verify the worker is working.
 */
router.get('/', (request, env) => {
  return new Response(`👋 ${env.DISCORD_APPLICATION_ID}`);
});

/**
 * Main route for all requests sent from Discord.  All incoming messages will
 * include a JSON payload described here:
 * https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object
 */
router.post('/', async (request, env) => {
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
    return new Response('Bad request signature.', { status: 401 });
  }

  if (interaction.type === InteractionType.PING) {
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    });
  }
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    // the user typed a slash command
    // and we tell them what to do next
    const id = Math.random().toString(36).substring(2, 15);
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          `In order to join the club, we want to see a a pull request, that
1. is for an AEM project (Edge Delivery Services)
2. has a performance score of 100
3. has been merged
4. was created by you        
In order to prove it's really you, please add this random string into a PR comment: ` +
          id,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Copied, pasted, and done.',
                style: 1,
                custom_id: 'commented.' + id,
                //url: INVITE_URL,
              },
            ],
          },
        ],
        flags: InteractionResponseFlags.EPHEMERAL,
      },
    });
  }
  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    console.log(JSON.stringify(interaction.data.custom_id));
    // the user clicked the button
    // so we show a modal
    return new JsonResponse({
      type: InteractionResponseType.MODAL,
      data: {
        title: 'Your Club 100 Entry Ticket',
        custom_id: 'club_modal',
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: 'url.' + interaction.data.custom_id.split('.')[1],
                label: 'URL of the PR you just commented',
                style: 1,
                min_length: 1,
                max_length: 4000,
                placeholder: 'https://github.com/',
                required: true,
              },
            ],
          },
        ],
      },
    });
  }
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    // the user submitted the modal
    const prurl = interaction.data.components[0].components[0].value;
    const id =
      interaction.data.components[0].components[0].custom_id.split('.')[1];
    const userid = interaction.member.user.id;
    const guildid = interaction.guild_id;
    // this is the Club 100 Members role (it needs to be lower than the bot's own role)
    const roleid = '1149357829162020955';
    console.log('Type5', 'url:', prurl, 'id:', id);

    // TODO: fetch the PR and check if the user has commented
    // if there is a comment from helix bot
    // and if the performance is great
    // if yes:
    return await verify(prurl, id, env.GITHUB_TOKEN, {
      onsuccess: async () => {
        console.log('verified');
        try {
          await addGuildMemberRole(guildid, userid, roleid, env.DISCORD_TOKEN);
        } catch (e) {
          return new JsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: 'Sorry, that did not work.',
              flags: InteractionResponseFlags.EPHEMERAL,
            },
          });
        }

        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content:
              "You're in! Enjoy your shiny new badge and keep the performance up.",
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      },
      onreject: async (reason) => {
        console.log('rejected', reason);
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: reason,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      },
      onerror: async (error) => {
        console.log('error', error);
        return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: error,
            flags: InteractionResponseFlags.EPHEMERAL,
          },
        });
      },
    });
  }

  console.error('Unknown Type', interaction.type);
  return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
});
router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request, env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

const server = {
  verifyDiscordRequest: verifyDiscordRequest,
  fetch: async function (request, env) {
    return router.handle(request, env);
  },
};

export default server;
