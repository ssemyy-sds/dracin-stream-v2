---
description: Push changes to GitHub using the GitHub Desktop Git executable
---

To push changes to the repository, use the dedicated Git executable from GitHub Desktop to avoid connection issues.

// turbo
1. Run the PowerShell push script:
```powershell
.\push.ps1 "your commit message"
```

Alternatively, you can run the command directly:
```powershell
& "C:\Users\suryanata\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe" add .
& "C:\Users\suryanata\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe" commit -m "your message"
& "C:\Users\suryanata\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe" push origin main
```
