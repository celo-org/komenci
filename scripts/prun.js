#!/bin/env node

const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")
const glob = require("glob")

const workspaces = require('../package.json').workspaces

const projectMatcher = new RegExp(process.argv[2])
const command = process.argv.slice(3)
const commandPreview = command.join(" ")

function isProject(projectDir) {
    return fs.existsSync(path.join(projectDir, "package.json"))
}

workspaces.forEach((workspaceGlob) => {
    glob.sync(workspaceGlob).forEach((projectDir) => {
        if (isProject(projectDir) && projectMatcher.exec(projectDir)) {
            console.log("> Running `"+commandPreview+"` in "+projectDir)
            const cmd = spawn("yarn", ["--cwd", projectDir].concat(command), {
                cwd: process.cwd(),
                stdio: "inherit"
            })
        }
    })
})
