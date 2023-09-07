/**
 * The core server that runs on a Cloudflare worker.
 */

import { Router } from 'itty-router';
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
          'Please add this random string into a PR comment: hte5au4a336a',
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
    const exampleinteraction = {
      app_permissions: '49152',
      application_id: '1149326324788375562',
      channel: {
        flags: 0,
        guild_id: '1131492224371277874',
        icon_emoji: { id: null, name: '🔒' },
        id: '1131589071634956299',
        last_message_id: '1149252534754607108',
        name: 'moderator-admin-only',
        nsfw: false,
        parent_id: null,
        permissions: '562949953421311',
        position: 1,
        rate_limit_per_user: 0,
        theme_color: null,
        topic: null,
        type: 0,
      },
      channel_id: '1131589071634956299',
      data: {
        components: [
          {
            components: [
              { custom_id: 'url.2cdrrsxo4wk', type: 4, value: 'aaa' },
            ],
            type: 1,
          },
        ],
        custom_id: 'club_modal',
      },
      entitlement_sku_ids: [],
      entitlements: [],
      guild: {
        features: [
          'NEWS',
          'BANNER',
          'COMMUNITY',
          'SEVEN_DAY_THREAD_ARCHIVE',
          'PRIVATE_THREADS',
          'INVITE_SPLASH',
          'CHANNEL_ICON_EMOJIS_GENERATED',
          'ROLE_ICONS',
          'ANIMATED_ICON',
          'THREE_DAY_THREAD_ARCHIVE',
          'MEMBER_PROFILES',
        ],
        id: '1131492224371277874',
        locale: 'en-US',
      },
      guild_id: '1131492224371277874',
      guild_locale: 'en-US',
      id: '1149345185482948698',
      locale: 'en-US',
      member: {
        avatar: null,
        communication_disabled_until: null,
        deaf: false,
        flags: 0,
        joined_at: '2023-07-20T07:46:08.468000+00:00',
        mute: false,
        nick: null,
        pending: false,
        permissions: '562949953421311',
        premium_since: '2023-09-04T09:26:19.916000+00:00',
        roles: [
          '1148190088321306624',
          '1131589332529074291',
          '1148186559124865116',
          '1148187281019121734',
        ],
        unusual_dm_activity_until: null,
        user: {
          avatar: '8728dbb5c52d34f05e56fa8bb64897bf',
          avatar_decoration_data: null,
          discriminator: '0',
          global_name: 'Lars Trieloff',
          id: '304170405676187648',
          public_flags: 0,
          username: 'trieloff',
        },
      },
      message: {
        application_id: '1149326324788375562',
        attachments: [],
        author: {
          avatar: 'bb90b228b6a82557fe5a41d357f4e5e6',
          avatar_decoration_data: null,
          bot: true,
          discriminator: '6225',
          global_name: null,
          id: '1149326324788375562',
          public_flags: 524288,
          username: 'Club 100',
        },
        channel_id: '1131589071634956299',
        components: [
          {
            components: [
              {
                custom_id: 'commented.2cdrrsxo4wk',
                label: 'Copied, pasted, and done.',
                style: 1,
                type: 2,
              },
            ],
            type: 1,
          },
        ],
        content:
          'Please add this random string into a PR comment: hte5au4a336a',
        edited_timestamp: null,
        embeds: [],
        flags: 64,
        id: '1149342049963884595',
        interaction: {
          id: '1149342047250169917',
          name: 'invite',
          type: 2,
          user: {
            avatar: '8728dbb5c52d34f05e56fa8bb64897bf',
            avatar_decoration_data: null,
            discriminator: '0',
            global_name: 'Lars Trieloff',
            id: '304170405676187648',
            public_flags: 0,
            username: 'trieloff',
          },
        },
        mention_everyone: false,
        mention_roles: [],
        mentions: [],
        pinned: false,
        timestamp: '2023-09-07T13:54:58.454000+00:00',
        tts: false,
        type: 20,
        webhook_id: '1149326324788375562',
      },
      token:
        'aW50ZXJhY3Rpb246MTE0OTM0NTE4NTQ4Mjk0ODY5ODpBYnJtaElWY3B0ejloUWhsY2xVMXcxWmlkU1hNVGNJRG43eldQVHhRMFY5YW1IWVY5WUJpTlFlWWRyODhMdXpXWEp5eE1uWG1pblRyWDRRTnJONkZ1Z2l6Z1dIeVdSaU01VjdPbW16c3FrN2pPMjFmdjFrdG9IR0JmcGVOZkc5Rw',
      type: 5,
      version: 1,
    };
    // console.log(JSON.stringify(interaction));
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
          "You're in!  You can now close this modal and wait for your invite.",
        flags: InteractionResponseFlags.EPHEMERAL,
      },
    });

    // if no:
    return new JsonResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          "Sorry, that's not a valid PR.  Please try again with a valid PR.",
        flags: InteractionResponseFlags.EPHEMERAL,
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
