# Discord Archive Viewer
A viewer for the RandomPerson3465's Testing Area Discord archives (August 18, 2019 to August 6, 2020)

## Message Data Format
Message data is stored in the `./data/messages/` folder

Each folder in there is named the same as the channel, with the "\#": e.g. `./data/messages/#general`

Message json files are named `messages-XX.json` where XX is two digits, e.g. `messages-00.json` **(The leading zero is IMPORTANT)**. Messages and message files are in the order of newest to oldest, so the first message in `messages-00.json` was be sent after the second message, and every message in that file was sent after the first message in `messages-01.json`.

Message json format:
```
{
    "data": [
        {
            "attachments": "List of attachment names, separated by commas",
            "author": "User ID of author",
            "channelId": "Channel name with the #",
            "embeds": 0, // Number of embeds in the message
            "content": "Whatever the message says",
            "id": "The message ID"
        },
        {
            "attachments": "",
            ...
            "id": "This ID should be less than the ID in the previous message
        },
        ...
    ]
}
```

Example message:
```
{
    "attachments": "image0.png",
    "author": "549471563616092171",
    "channelId": "#off-topic",
    "embeds": 1,
    "content": "Hey guys, check out this cool video! ||https://youtu.be/dQw4w9WgXcQ||",
    "id": "696969696969696969"
}
```
## Channel, Role, and User Data
Channel, role, and user data are stored in `channels.json`, `roles.json`, and `users.json` respectively, in the `./data` folder. See the example data folder for the format.

# API Documentation

`GET /data`: Channel, role, and user data

```
{
    "channels": {
        "CHANNEL_ID": {
            "name": "Name of the channel without the #"
        },
        ...,
        "list": ["A list of channel names without the #", "!", "A '!' means a category break"]
    },
    "roles": {
        "ROLE_ID": {
            "name": "Name of the role"
        },
        ...
    },
    "users": {
        "USER_ID": {
            "username": "Name of the user",
            "color": "Role color",
            "type": "Optional. The type of the user to be shown in the badge (e.g. bot)",
            "avatar": "Avatar URL"
        },
        ...
    }
}
```
# 

`GET /messages`: A list of messages

Parameters:

`key`: API Key (required)

`channel`: Channel name without the # (required)

`limit`: Number of messages to return (default `50`, max `5000`)

`direction`: Direction to search in (`up` or `down`, default `up`)

`offset`: Search messages with ID less than this (if direction is `up`) or greater than this (if direction is `down`). The results will **NOT** include the message with the given offset ID.

```
{
    "data: [
        // An array of messages
    ]
}
```
# 

`GET /search`: Search messages:

Parameters:

`key`: API Key (required)

`channelWhitelist`: If given, search only in these channels (without the #, separated by commas). Example: `general,off-topic`

`channelBlacklist`: Do not search in these channels (without the #, separated by commas). Example: `bot-commands,spam,bot-logs`

`before`: If given, only gives messages with an ID less than this.

`after`: If given, only gives messages with an ID greater than this.

`keywords`: If given, only gives messages containing at least one of these keywords, separated by commas. Example: `rickroll,stick bugged,gnomed`

`keywordBlacklist`: Don't give messages containing any of these keywords, separated by commas.

**NOTE**: Keyword search only matches whole words, is case insensitive, and ignores most punctuation.

`substrings`: If given, only gives messages where the given substrings, separated by commas, are contained within the message. e.g. `abc` matches `abcd` and not `ab.c` or `xyz`.

`substringBlacklist`: Don't give messages containing any of these substrings, separated by commas.

`userWhitelist`: If given, only give messages sent by these user IDs (separated by commas). `alts`, `bots`, and `webhooks` will match all users that are of that type. Example: `bots,549471563616092171`

`userBlacklist`: Don't give messages sent by these user IDs (separated by commas). `alts`, `bots`, and `webhooks` will match all users that are of that type.

`attachment`: If `1` or `true`, requires an attachment to be present in the message (Default `false`). 

`content`: If `1` or `true`, requires content to be present in the message (Default `false`).

`embed`: If `1` or `true`, requires an embed to be present in the message (Default `false`).

`sort`: `az` sorts messages in alphabetical order, `za` in reverse alphabetical order, `new` by newest first, `old` by oldest first, `short` by shortest messages first, `long` by longest messages first (Default `new`).

`page`: The page number. If this is greater than the number of total pages, the last page is returned (Default `1`). 25 messages per page.

```
{
    "results": 69420, // Total number of results
    "data": [
        // An array of up to 25 messages
    ]
}
```