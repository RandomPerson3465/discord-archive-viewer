
const fs = require("fs");
const channels = fs.readdirSync("./data/messages");

function timeStampToId(timestamp) {
	return ((BigInt(timestamp) - BigInt(1420070400000)) * BigInt(4194304)).toString();
}

function failMessage(m) {
    return {
        data: [
            {
                attachments: "",
                author: "1",
                channelId: "",
                content: m,
                embeds: 0,
                id: timeStampToId(Date.now())
            }
        ]
    }
}

function searchMessages(channel, offset, limit, direction) {
    offset = BigInt(String(offset).replace(/[^0-9]/g, "") || "9223372036854775807");
    limit = parseInt(limit) || 50;
    if (offset > BigInt("9223372036854775807") || offset < BigInt("-9223372036854775808")) offset = BigInt("9223372036854775807"); // 64 bit integer limit
    else offset = BigInt(offset); // Convert digits to a big integer
    if (limit < 0) limit = 50; // Set default limit to 50.
    if (limit > 5000) limit = 5000; // Set max limit to 5k

    let fileList = fs.readdirSync(`./data/messages/#${channel}`);
    const messageList = new Map();
    if (direction === "down") {
        fileList = fileList.reverse();
        for (const file of fileList) {
            let fileData = require(`../data/messages/#${channel}/${file}`).data.sort((a, b) => {
                if (BigInt(a.id) > BigInt(b.id)) return 1;
                else return -1;
            })
            if (BigInt(fileData[fileData.length - 1]?.id || 0) <= offset) continue;
            for (const msg of fileData) {
                if (BigInt(msg.id) > offset) {
                    messageList.set(msg.id, msg);
                }
                if (messageList.size >= limit) break;
            }
            if (messageList.size >= limit) break;
        }
    } else {
        for (const file of fileList) {
            const fileData = require(`../data/messages/#${channel}/${file}`).data.sort((a, b) => {
                if (BigInt(a.id) < BigInt(b.id)) return 1;
                else return -1;
            });
            if (BigInt(fileData[fileData.length - 1]?.id || 0) >= offset) continue;
            for (const msg of fileData) {
                if (BigInt(msg.id) < offset) {
                    messageList.set(msg.id, msg);
                }
                if (messageList.size >= limit) break;
            }
            if (messageList.size >= limit) break;
        }
    }
    return messageList;
}


module.exports = {
    path: "/messages",
    method: "get",
    run: function (q, s) {
        const key = q.query?.key;
        if (!key || key !== process.env.KEY) {
            s.send(failMessage("You either didn't proivde an API key, or provided an incorrect one."));
        } else {
            const channel = q.query?.channel;
            if (!channel || !channels.includes(`#${channel}`)) {
                s.send(failMessage("You either didn't specify a channel, or that channel doesn't exist."));
            } else {
                s.send({
                    data: [...searchMessages(channel, q.query?.offset, q.query?.limit, q.query?.direction).values()]
                });
            }
        }
    }
}