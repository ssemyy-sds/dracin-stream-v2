$GitPath = "C:\Users\suryanata\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe"

# Add all changes
& $GitPath add .

# Set a default message if none provided
$message = $args[0]
if (-not $message) {
    $message = "chore: sync changes (auto-commit)"
}

# Commit
& $GitPath commit -m $message

# Push
& $GitPath push origin main
