
const fs = require("fs");
module.exports = {
    path: "/data",
    method: "get",
    run: function (q, s) {
      const channels = require("../data/channels.json");
      const users = require("../data/users.json");
      const roles = require("../data/roles.json");
      s.send({
        channels: channels,
        users: users,
        roles: roles
      })
    }
}