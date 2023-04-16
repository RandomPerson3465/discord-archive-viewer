let channelData = {};
let userData = {};
let roleData = {};
let infiniteScrollListener = () => {
  if (messageElement.scrollTop === 0 && messageElement.childElementCount) {
    loadMoreAbove();
  }
  if (messageElement.offsetHeight + messageElement.scrollTop >= messageElement.scrollHeight - 1) {
    loadMoreBelow();
  }
};

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const whitelist = filterXSS.getDefaultWhiteList();
whitelist.span = ["class"];

function formatDateTime(date) {
  const a = date.getHours() < 12 ? "A" : "P";
  const b = date.getHours() % 12 == 0 ? 12 : date.getHours() % 12;
  const c =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  return `${months[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()} ${b}:${c} ${a}M`;
}

function formatTime(date) {
  const a = date.getHours() < 12 ? "A" : "P";
  const b = date.getHours() % 12 == 0 ? 12 : date.getHours() % 12;
  const c =
    date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
  return `${b}:${c} ${a}M`;
}

function idToUnix(id) {
  return Number(BigInt(id) / BigInt(4194304) + BigInt(1420070400000));
}

function timeStampToId(timestamp) {
  if (isNaN(timestamp)) return null;
	return ((BigInt(timestamp) - BigInt(1420070400000)) * BigInt(4194304)).toString();
}

function bigIntAbs(bigint) {
  return bigint < 0n ? (-1n * bigint) : bigint;
}

function parseMentions(message) {
  let result = [];
  message = message.split(/\r|\n/);
  for (let line of message) {
    line = line.replaceAll("><", "> <");
    let lineResult = [];
    let messageLine = line.replaceAll(">", "&gt;").split(/ /);
    for (let word of messageLine) {
      //console.log(word);
      let newWord = word.split("&gt;")[0];
      let resultWord = newWord;
      let droppedPart = word.split("&gt;").slice(1).join("&gt;");

      if (newWord.startsWith("<@")) {
        newWord = newWord.slice(2);
        if (newWord.startsWith("&")) {
          newWord = newWord.slice(1);
          if (roleData[newWord])
            resultWord = `<span class="mention">@${roleData[newWord].name}</span>`;
          else resultWord = '<span class="mention">@Role</span>';
        } else {
          if (newWord.startsWith("!")) newWord = newWord.slice(1);
          if (userData[newWord])
            resultWord = `<span class="mention">@${userData[newWord].username}</span>`;
          else resultWord = '<span class="mention">@User</span>';
        }
      }
      if (newWord.startsWith("<#")) {
        newWord = newWord.slice(2);
        if (channelData[newWord])
          resultWord = `<span class="mention">#${channelData[newWord].name}</span>`;
        else resultWord = '<span class="mention">#deleted-channel</span>';
      }
      if (newWord.startsWith("<:") || newWord.startsWith("<a:")) {
        newWord = newWord.split(":")[2];
        if (newWord) {
          newWord = BigInt(newWord.replace(/[^0-9]/g, ""))
          resultWord = `<span><img src="https://cdn.discordapp.com/emojis/${newWord}.png"></span>`;
        }
      }

      if (
        droppedPart &&
        !resultWord.endsWith(">") &&
        !resultWord.endsWith("&gt;")
      )
        droppedPart = "&gt;" + droppedPart;
      if (
        !droppedPart &&
        !resultWord.endsWith(">") &&
        word.endsWith("&gt;")
      )
        droppedPart = "&gt;";
      lineResult.push(resultWord + droppedPart);
    }
    result.push(lineResult.join(" "));
  }
  return result.join("\n");
}

const messageElement = document.querySelector(".messages");
var converter = new showdown.Converter();
converter.setOption("strikethrough", true);
converter.setOption("emoji", true);
converter.setOption("underline", true);
converter.setOption("simpleLineBreaks", true);
converter.setOption("requireSpaceBeforeHeadingText", true);
converter.setOption("noHeaderId", true);

function renderMessage(message, indented = false, prepend = false, isSearch = false) {
  message.content = message.content.replaceAll("[", "\\[").replaceAll(".", "\\.");


  const a = document.createElement("div");
  a.className = "message-container";

  const b = document.createElement("div");
  if (indented) {
    b.className = "message-sub-container-indented";

    // Timestamp
    const c = document.createElement("h3");
    const d = document.createElement("span");
    d.className = "timestamp";
    d.innerText = formatTime(new Date(idToUnix(message.id)));
    c.appendChild(d);
    b.appendChild(c);
  } else {
    b.className = "message-sub-container";

    // Avatar
    const c = document.createElement("img");
    c.src =
      userData[message.author]?.avatar ||
      "https://cdn.discordapp.com/embed/avatars/0.png";
    c.width = 48;
    c.height = 48;
    a.appendChild(c);

    // Header
    const d = document.createElement("h3");
    d.className = "message-header";
    const e = document.createElement("span");
    e.className = "username";
    e.innerText = userData[message.author]?.username || "Deleted User";
    e.style.color = userData[message.author]?.color || "#fff";
    d.appendChild(e);

    if (userData[message.author]?.type) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.innerText = userData[message.author].type.toUpperCase();
      switch (userData[message.author].type.toUpperCase()) {
        case "ALT":
          badge.style.backgroundColor = "#008";
          break;
        case "DELETED":
          badge.style.backgroundColor = "#888";
          break;
      }
      d.innerHTML += " ";
      d.appendChild(badge);
    }


    const f = document.createElement("span");
    f.className = "timestamp";
    f.innerText = formatDateTime(new Date(idToUnix(message.id)));
    d.innerHTML += " ";
    d.appendChild(f);
    b.appendChild(d);
  }

  // Message content
  const g = document.createElement("div");
  g.className = "message-content";
  if (message.content) {

    g.innerHTML = filterXSS(converter.makeHtml(parseMentions(message.content)), {
      whiteList: whitelist
    });

    for (const codeBlock of g.querySelectorAll("code")) {
      codeBlock.innerText = codeBlock.innerText
        .replaceAll("&gt;", ">")
        .replaceAll("\\[", "[")
        .replaceAll("\\.", ".")
    }
  }
  b.appendChild(g);

  let k = "";
  if (message.attachments?.length) {
    k = "Attachments: " + message.attachments;
  }
  if (message.embeds > 0) {
    if (k) k += " -- ";
    k += "Embeds: " + message.embeds;
  }

  if (k) {
    const l = document.createElement("div");
    l.className = "message-info-box";
    l.innerText = k;
    b.appendChild(l);
  }

  a.appendChild(b);
  a.id = message.id;
  if (isSearch) {
    document.querySelector(".search-results").appendChild(a);
    a.setAttribute("onclick", `jumpToMessage("${message.channelId}", "${message.id}")`)
  } else {
    if (prepend) {
      messageElement.prepend(a);
    } else {
      messageElement.appendChild(a);
    }
  }
}

function renderBelow(msgList) {
  for (i = 0; i < msgList.length; i++) {
    if (
      i >= 1 &&
      new Date(idToUnix(msgList[i - 1].id)).toDateString() ==
        new Date(idToUnix(msgList[i].id)).toDateString() &&
      msgList[i - 1].author == msgList[i].author
    ) {
      renderMessage(msgList[i], true);
    } else {
      renderMessage(msgList[i]);
    }
  }
}

function renderAbove(msgList) {
  for (i = 0; i < msgList.length; i++) {
    if (
      i < msgList.length - 1 &&
      new Date(idToUnix(msgList[i + 1].id)).toDateString() ==
        new Date(idToUnix(msgList[i].id)).toDateString() &&
        msgList[i + 1].author == msgList[i].author
    ) {
      renderMessage(msgList[i], true, true);
    } else {
      renderMessage(msgList[i], false, true);
    }
  }
}

const apiKey = new URLSearchParams(window.location.href.replace(window.location.origin+window.location.pathname,"")).get("key")?.split("#")[0] || "null";
let activeChannel;

async function getData() {
    const req = await fetch("./data");
    const data = await req.json();
    return data;
}

getData().then(data => {
    channelData = data.channels;
    userData = data.users;
    roleData = data.roles;

    for (i = 0; i<channelData.list.length; i++) {
      const c = channelData.list[i];
      if (c === "!") {
        const divider = document.createElement("hr");
        document.querySelector(".channel-list").appendChild(divider);
      } else {
        const button = document.createElement("button");
        button.className = "channel-button";
        button.innerText = "#" + c;
        button.id = "channel-" + c;
        button.setAttribute("onclick", `setActiveChannel("${c}")`);
        document.querySelector(".channel-list").appendChild(button);


        
      }
    }

    const userSelect = document.querySelectorAll(".user-select");
    for (const u of Object.keys(data.users)) {
      
        for (const s of userSelect) {
          const opt = document.createElement("option");
          opt.value = u;
          opt.innerText = `${data.users[u].username} (${u})`;
          s.appendChild(opt);
        }
    }

    setActiveChannel("general").then(_ => {
      messageElement.addEventListener("scroll", infiniteScrollListener);
    })
});

async function setActiveChannel(channel, loadMessages = true) {
  activeChannel = channel;
  const channelButtons = document.querySelectorAll(".channel-button");
  for (const button of channelButtons) {
    button.className = button.className.replace(" active", "");
  }

  
  document.getElementById("channel-" + channel).className += " active";
  if (!loadMessages) return;
  const req = await fetch(`./messages?key=${apiKey}&channel=${channel}`);
  const data = await req.json();
  const messageList = data.data.sort((a, b) => {
    if (BigInt(a.id) > BigInt(b.id)) return 1;
    else return -1;
  });
  messageElement.innerHTML = "";
  renderBelow(messageList);
  location.href = location.href.split("#")[0] + `#${messageList[messageList.length - 1].id}`
}



async function loadMoreAbove() {
  const firstMessage = messageElement.firstElementChild;

  const req = await fetch(`./messages?key=${apiKey}&channel=${activeChannel}&offset=${firstMessage.id}`);
  const data = await req.json();

  if (!data.data?.length) return;

  const messageList = data.data.sort((a, b) => {
    if (BigInt(a.id) < BigInt(b.id)) return 1;
    else return -1;
  });
  renderAbove(messageList);

  messageElement.scrollTop = firstMessage.offsetTop;
}

async function loadMoreBelow() {
  const lastMessage = messageElement.lastElementChild;
  const scrollPosition = messageElement.scrollTop;

  const req = await fetch(`./messages?key=${apiKey}&channel=${activeChannel}&offset=${lastMessage.id}&direction=down`);
  const data = await req.json();

  if (!data.data?.length) return;

  const messageList = data.data.sort((a, b) => {
    if (BigInt(a.id) > BigInt(b.id)) return 1;
    else return -1;
  });
  renderBelow(messageList);

  messageElement.scrollTop = scrollPosition;
}

function getSelectedOptions(selectElement) {
  let result = [];
  for (i = 0; i < selectElement.selectedOptions.length; i++) {
    result.push(selectElement.selectedOptions[i].value);
  }
  return result.join(",");
}

function getSearchURL() {
  let result = `?key=${apiKey}`;

  let parameters = {
    before: timeStampToId(new Date(document.querySelector("#search-before").value)?.getTime()),
    after: timeStampToId(new Date(document.querySelector("#search-after").value)?.getTime()),
    keywords: document.querySelector("#search-keywords").value,
    keywordBlacklist: document.querySelector("#search-no-keywords").value,
    substrings: document.querySelector("#search-substrings").value,
    substringBlacklist: document.querySelector("#search-no-substrings").value,
    userWhitelist: getSelectedOptions(document.querySelector("#search-from")),
    userBlacklist: getSelectedOptions(document.querySelector("#search-not-from")),
    channelWhitelist: document.querySelector("#search-in").value.replaceAll("#", ""),
    channelBlacklist: document.querySelector("#search-not-in").value.replaceAll("#", ""),
    attachment: document.querySelector("#search-attachment").checked,
    embed: document.querySelector("#search-embed").checked,
    content: document.querySelector("#search-content").checked,
    sort: document.querySelector("#search-sort").value,
    page: document.querySelector("#page-counter").value
  }

  for (const param of Object.keys(parameters)) {
    if (parameters[param]) result+=`&${param}=${encodeURIComponent(parameters[param])}`
  }

  return result;
}

async function searchMessages() {
  document.querySelector(".search-results").innerHTML = "";
  document.querySelector("#result-counter").innerText = "Searching..."

  const req = await fetch(`./search${getSearchURL()}`);
  const data = await req.json();

  if (data.results === 1) {
    document.querySelector("#result-counter").innerText = "1 result"
  } else {
    document.querySelector("#result-counter").innerText = `${data.results.toLocaleString()} results`
  }
  if (!data.data.length) {
    return document.querySelector(".search-results").innerText = "There are no results on this page."
  }
  for (i = 0; i < data.data.length; i++) {
    const channelName = document.createElement("p");
    channelName.innerText = data.data[i].channelId;
    document.querySelector(".search-results").appendChild(channelName);
    renderMessage(data.data[i], false, false, true);
    document.querySelector(".search-results").appendChild(document.createElement("hr"));
  }
}

async function jumpToMessage(channel, message) {
  messageElement.removeEventListener("scroll", infiniteScrollListener);
  channel = channel.replace("#", "");
  setActiveChannel(channel, false);
  let req = await fetch(`./messages?key=${apiKey}&channel=${activeChannel}&offset=${(BigInt(message) + 1n).toString()}`);
  let data = await req.json();
  let messageList = data.data.sort((a, b) => {
    if (BigInt(a.id) > BigInt(b.id)) return 1;
    else return -1;
  });
  messageElement.innerHTML = "";
  renderBelow(messageList);
  messageList = messageList.sort((a, b) => {
    if (bigIntAbs(BigInt(a.id) - BigInt(message)) < bigIntAbs(BigInt(b.id) - BigInt(message))) return -1;
    else return 1;
  })
  

  if (messageList.length) location.href = location.href.split("#")[0] + `#${messageList[0].id}`;
  loadMoreBelow().then(_ => {messageElement.addEventListener("scroll", infiniteScrollListener)});
  

}