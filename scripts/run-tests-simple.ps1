#!/usr/bin/env pwsh

Write-Host "Updating test files in existing container..." -ForegroundColor Cyan

# Start temp container
$tempContainer = docker run -d mqtt-explorer-tests tail -f /dev/null

# Copy updated test
docker cp ./src/spec "${tempContainer}:/app/src/"

# Rebuild
docker exec $tempContainer /bin/bash -c "yarn build"

# Commit
docker commit $tempContainer mqtt-explorer-tests | Out-Null
docker rm -f $tempContainer | Out-Null

Write-Host "Running tests..." -ForegroundColor Cyan

# Run tests
$containerId = docker run -d mqtt-explorer-tests /bin/bash -c "./scripts/uiTests.sh; sleep 10"
docker logs -f $containerId

# Get exit code
$exitCode = [int](docker wait $containerId)

# Copy videos
docker cp "${containerId}:/app/ui-test.mp4" ./ui-test.mp4 2>$null
docker cp "${containerId}:/app/ui-test.gif" ./ui-test.gif 2>$null

# Cleanup
docker rm $containerId | Out-Null

if ($exitCode -eq 0) {
  Write-Host "Success! Video files extracted." -ForegroundColor Green
} else {
  Write-Host "Tests failed with exit code $exitCode" -ForegroundColor Red
}

exit $exitCode
