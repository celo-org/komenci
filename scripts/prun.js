#!/bin/env node

const { spawn } = require("child_process");

const workspaces = require('../package.json').workspaces;
const glob = require("glob")

const projectRe = new RegExp(process.argv[2])
const command = process.argv.slice(3)

workspaces.forEach((ws) => {
    glob.sync(ws).forEach((pdir) => {
        if (projectRe.exec(pdir)) {
            console.log("> Running `"+command+"` in "+pdir)
            const cmd = spawn("yarn", ["--cwd", pdir].concat(command), {
                cwd: process.cwd(),
                stdio: "inherit"
            })
        }
    })
})
