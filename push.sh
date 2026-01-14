#!/bin/bash
# Command to push using GitHub Desktop's Git
GIT_PATH="C:/Users/suryanata/AppData/Local/GitHubDesktop/app-3.5.4/resources/app/git/cmd/git.exe"

"$GIT_PATH" add .
"$GIT_PATH" commit -m "Auto-commit"
"$GIT_PATH" push
