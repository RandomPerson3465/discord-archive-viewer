
const fs = require("fs");
const userData = require("../data/users.json");

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

function hasSubstrings(str, substr) {
    if (!substr.length) return true;
    let result = false;
    for (const substring of substr) {
        if (str.toLowerCase().includes(substring.toLowerCase())) {
            result = true;
            break;
        }
    }
    return result;
}

function keywordHelper(str) {
    str = (' ' + str + ' ').toLowerCase()
    .replace(/[\?\.!,\/\*\":;\~\`\(\)\[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    return str;
}

function hasKeywords(str, keywordList) {
    if (!keywordList.length) return true;
    let result = false;
    for (const keyword of keywordList) {
        if (keywordHelper(str).includes(keywordHelper(keyword))) {
            result = true;
            break;
        }
    }
    return result;
} 


/*
    Parameters:

    channelWhitelist: Search only in these channels
    channelBlacklist: Don't search in these channels
    before: Search before this ID
    after: Search after this ID
    keywords: Keywords to look for
    keywordBlacklist: Keywords to not look for
    substrings: Substrings to look for
    substringBlacklist: Substrings to not look for
    userWhiteList: Search only from these users
    userBlackList: Don't search from these users
    attachment: Require attachment?
    embed: Require embed?
    sort: The sorting method (oldest, newest, az, za)
    page: The page number
*/


module.exports = {
    path: "/search",
    method: "get",
    run: function (q, s) {
        
        const key = q.query?.key;
        if (!key || key !== process.env.KEY) {
            s.send(failMessage("You either didn't proivde an API key, or provided an incorrect one."));
        } else {
            const searchResults = {
                results: 0,
                data: []
            }
            const messageList = new Map();
            const maxID = BigInt(String(q.query?.before).replace(/[^0-9]/g, "") || "9223372036854775807");
            const minID = BigInt(String(q.query?.after).replace(/[^0-9]/g, "") || "-9223372036854775808");

            function getUserIDs(query) {
                query = query.split(",")
                let result = [];
                for (const item of query) {
                    switch (item) {
                        case "alts":
                            result = result.concat(Object.keys(userData).filter(x => userData[x]?.type === "alt"));
                            break;
                        case "bots":
                            result = result.concat(Object.keys(userData).filter(x => userData[x]?.type === "bot"));
                            break;
                        case "webhooks":
                            result = result.concat(Object.keys(userData).filter(x => userData[x]?.type === "webhook"));
                            break;
                        default:
                            if (Object.keys(userData).includes(item)) {
                                result.push(item);
                            }
                    }    
                }
                return result;
            }

            let userList = Object.keys(userData);
            if (q.query?.userWhitelist) userList = getUserIDs(q.query.userWhitelist.replaceAll(" ", ""));
            const userBlacklist = getUserIDs(q.query?.userBlacklist?.replaceAll(" ", "") || "");
            if (userBlacklist.length) {
                userList = userList.filter(x => !userBlacklist.includes(x));
            }
            


            if (minID < maxID && userList.length) {
                let channelList = q.query?.channelWhitelist?.replaceAll(" ", "")?.split(",") || fs.readdirSync("./data/messages/");
                for (i = 0; i < channelList.length; i++) {
                    channelList[i] = channelList[i].replace("#", "").replaceAll("/", "");
                }
                const channelBlacklist = q.query?.channelBlacklist?.replaceAll(" ", "")?.split(",");
            
                if (channelBlacklist) {
                    channelList = channelList.filter(x => !channelBlacklist.includes(x))
                }

                channelList = channelList.filter(x => fs.readdirSync("./data/messages/").includes("#" + x))

                const substrings = q.query?.substrings?.split(/, */) || [];
                const substringBlacklist = q.query?.substringBlacklist?.split(/, */) || [];

                const keywords = q.query?.keywords?.split(/, */) || [];
                const keywordBlacklist = q.query?.keywordBlacklist?.split(/, */) || [];

                const attachmentRequired = ["1","true"].includes(q.query?.attachment) ? true : false
                const embedRequired = ["1","true"].includes(q.query?.embed) == true ? true : false
                const contentRequired = ["1","true"].includes(q.query?.content) == true ? true : false

                for (i = 0; i < channelList.length; i++) {
                    const fileList = fs.readdirSync(`./data/messages/#${channelList[i]}/`);
                    for (j = 0; j < fileList.length; j++) {
                        const fileData = require(`../data/messages/#${channelList[i]}/${fileList[j]}`).data;
                        if (BigInt(fileData[0].id) < minID) break;
                        if (BigInt(fileData[fileData.length - 1].id > maxID)) continue;
                        for (const msg of fileData) {
                            
                            if (msg.id <= minID) break;
                            if (msg.id >= maxID || !userList.includes(msg.author) || (attachmentRequired && !msg.attachments) || (embedRequired && !msg.embeds) || (contentRequired && !msg.content)) continue;
                            if (!hasSubstrings(msg.content, substrings)) continue;
                            if (substringBlacklist.length && hasSubstrings(msg.content, substringBlacklist)) continue;
                            if (!hasKeywords(msg.content, keywords)) continue;
                            if (keywordBlacklist.length && hasKeywords(msg.content, keywordBlacklist)) continue;
                            
                            messageList.set(msg.id, msg);
                            
                        }
                    }
                }

                searchResults.results = messageList.size;

                let resultArray = [];
                switch (q.query?.sort?.toLowerCase()) {
                    case "az":
                        resultArray = [...messageList.values()].sort((a, b) => {
                            if (a.content > b.content) return 1;
                            else return -1;
                        });
                        break;
                    case "za":
                        resultArray = [...messageList.values()].sort((a, b) => {
                            if (a.content < b.content) return 1;
                            else return -1;
                        });
                        break;
                    case "old":
                        resultArray = [...messageList.values()].sort((a, b) => {
                            if (BigInt(a.id) > BigInt(b.id)) return 1;
                            else return -1;
                        });
                        break;
                    case "short":
                        resultArray = [...messageList.values()].sort((a, b) => {
                            return a.content.length - b.content.length;
                        });
                        break;
                    case "long":
                        resultArray = [...messageList.values()].sort((a, b) => {
                            return b.content.length - a.content.length;
                        });
                        break;
                    default:
                        resultArray = [...messageList.values()].sort((a, b) => {
                            if (BigInt(a.id) < BigInt(b.id)) return 1;
                            else return -1;
                        });
                }
                let page = parseInt(q.query?.page) || 1;
                if (page <= 0) page = 1;
                if (page > Math.ceil(resultArray.length / 25)) page = Math.ceil(resultArray.length / 25);
                searchResults.data = resultArray.slice((page - 1) * 25, page * 25);
            }
            return s.send(searchResults);
        }
    }
}